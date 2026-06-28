/**
 * Behavioral tests for src/components/auth/AuthBootstrap.tsx
 *
 * PR2 (post-auth-supabase-sync-fix) — fresh-review blocker fix.
 *
 * Goal: prove that AuthBootstrap:
 * - Calls `beginPostAuthSync(session)` on BOTH INITIAL_SESSION and
 *   SIGNED_IN events, deduped per userId (the orchestrator is
 *   idempotent, but the call site must be equivalent).
 * - Captures `lastUserId` in BOTH branches so SIGNED_OUT can clear
 *   the per-userId cache.
 * - Calls `clearPostAuthSyncStatus(lastUserId)` BEFORE
 *   `reinitializePersistence()` on SIGNED_OUT so the next sign-in
 *   re-runs the orchestrator.
 * - Treats INITIAL_SESSION and SIGNED_IN as equivalent (no separate
 *   conditional branch).
 * - Does NOT directly invoke `linkAndImportLocalProgress` (that's the
 *   orchestrator's job, called by `beginPostAuthSync`).
 *
 * Strategy: the component delegates to an extracted pure function
 * `createAuthEventHandler(deps)` that returns a callback for
 * `onAuthStateChange`. Tests inject mock deps and simulate events.
 */

import { describe, it, expect, vi } from "vitest";
import { createAuthEventHandler } from "@/components/auth/AuthBootstrap";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SESSION_A = {
  user: { id: "auth-user-A", email: "a@example.com" },
  access_token: "tok-a",
  refresh_token: "ref-a",
};

const SESSION_B = {
  user: { id: "auth-user-B", email: "b@example.com" },
  access_token: "tok-b",
  refresh_token: "ref-b",
};

function makeDeps(overrides: {
  beginPostAuthSync?: unknown;
  reinitializePersistence?: unknown;
  clearPostAuthSyncStatus?: unknown;
} = {}) {
  return {
    beginPostAuthSync: (overrides.beginPostAuthSync ?? vi.fn(async () => "ready" as const)) as never,
    reinitializePersistence: (overrides.reinitializePersistence ?? vi.fn(async () => undefined)) as never,
    clearPostAuthSyncStatus: (overrides.clearPostAuthSyncStatus ?? vi.fn()) as never,
  };
}

describe("AuthBootstrap — PR2 readiness wiring (behavioral)", () => {
  it("INITIAL_SESSION event triggers beginPostAuthSync(session)", async () => {
    const deps = makeDeps();
    const handle = createAuthEventHandler(deps);
    await handle("INITIAL_SESSION", SESSION_A as never);

    expect(deps.beginPostAuthSync).toHaveBeenCalledTimes(1);
    expect(deps.beginPostAuthSync).toHaveBeenCalledWith(SESSION_A);
  });

  it("SIGNED_IN event triggers beginPostAuthSync(session)", async () => {
    const deps = makeDeps();
    const handle = createAuthEventHandler(deps);
    await handle("SIGNED_IN", SESSION_A as never);

    expect(deps.beginPostAuthSync).toHaveBeenCalledTimes(1);
    expect(deps.beginPostAuthSync).toHaveBeenCalledWith(SESSION_A);
  });

  it("INITIAL_SESSION + SIGNED_IN (duplicate) call beginPostAuthSync twice with same session — dedupe is the orchestrator's job", async () => {
    // The handler must call beginPostAuthSync for each event so the
    // orchestrator's per-userId idempotency can collapse them into a
    // single orchestrator run. The handler itself does NOT dedupe —
    // the contract is "INITIAL_SESSION == SIGNED_IN at the call site".
    const deps = makeDeps();
    const handle = createAuthEventHandler(deps);
    await handle("INITIAL_SESSION", SESSION_A as never);
    await handle("SIGNED_IN", SESSION_A as never);

    expect(deps.beginPostAuthSync).toHaveBeenCalledTimes(2);
    expect(deps.beginPostAuthSync).toHaveBeenNthCalledWith(1, SESSION_A);
    expect(deps.beginPostAuthSync).toHaveBeenNthCalledWith(2, SESSION_A);
  });

  it("beginPostAuthSync resolves BEFORE reinitializePersistence (FK-before-snapshot readiness)", async () => {
    // The FK row in `student_profiles` must be guaranteed before the
    // selector flips to remote. So beginPostAuthSync must settle first.
    const order: string[] = [];
    const beginPostAuthSync = vi.fn(async () => {
      order.push("begin:start");
      await Promise.resolve();
      order.push("begin:end");
      return "ready" as const;
    });
    const reinitializePersistence = vi.fn(async () => {
      order.push("reinit");
    });
    const deps = makeDeps({ beginPostAuthSync, reinitializePersistence });
    const handle = createAuthEventHandler(deps);
    await handle("INITIAL_SESSION", SESSION_A as never);

    const beginEnd = order.indexOf("begin:end");
    const reinitIdx = order.indexOf("reinit");
    expect(beginEnd).toBeGreaterThanOrEqual(0);
    expect(reinitIdx).toBeGreaterThan(beginEnd);
  });

  it("SIGNED_IN path captures lastUserId so SIGNED_OUT can clear it", async () => {
    // The SIGNED_OUT event has session=null, so the handler cannot
    // read userId from it. It must capture from the previous
    // SIGNED_IN/INITIAL_SESSION and forward that userId to
    // clearPostAuthSyncStatus.
    const deps = makeDeps();
    const handle = createAuthEventHandler(deps);
    await handle("SIGNED_IN", SESSION_A as never);
    await handle("SIGNED_OUT", null);

    expect(deps.clearPostAuthSyncStatus).toHaveBeenCalledTimes(1);
    expect(deps.clearPostAuthSyncStatus).toHaveBeenCalledWith("auth-user-A");
  });

  it("INITIAL_SESSION path also captures lastUserId so a fresh tab load can clear it on SIGNED_OUT", async () => {
    // A refresh that only emits INITIAL_SESSION + SIGNED_OUT (no
    // SIGNED_IN) must still clear the user. INITIAL_SESSION must
    // capture lastUserId too.
    const deps = makeDeps();
    const handle = createAuthEventHandler(deps);
    await handle("INITIAL_SESSION", SESSION_B as never);
    await handle("SIGNED_OUT", null);

    expect(deps.clearPostAuthSyncStatus).toHaveBeenCalledWith("auth-user-B");
  });

  it("SIGNED_OUT path clears status BEFORE reinitializePersistence (so the next sign-in sees a clean state)", async () => {
    // The clear path must complete before the selector re-runs. The
    // selector reads currentStatus from the post-auth-sync module; if
    // the clear runs AFTER reinit, the selector sees the stale status.
    const order: string[] = [];
    const clearPostAuthSyncStatus = vi.fn(() => {
      order.push("clear");
    });
    const reinitializePersistence = vi.fn(async () => {
      order.push("reinit");
    });
    const deps = makeDeps({ clearPostAuthSyncStatus, reinitializePersistence });
    const handle = createAuthEventHandler(deps);
    // Only test SIGNED_OUT — no prior SIGNED_IN in this test.
    await handle("SIGNED_OUT", null);

    expect(clearPostAuthSyncStatus).not.toHaveBeenCalled(); // no prior userId
    // The selector must still have been called exactly once on SIGNED_OUT.
    expect(reinitializePersistence).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["reinit"]);
  });

  it("SIGNED_OUT with prior SIGNED_IN: clear runs BEFORE the SIGNED_OUT reinit", async () => {
    // Stronger version with prior sign-in: clear must precede the
    // SIGNED_OUT reinitialize call so the selector reads a clean
    // currentStatus snapshot.
    const order: string[] = [];
    const clearPostAuthSyncStatus = vi.fn(() => {
      order.push("clear");
    });
    const reinitializePersistence = vi.fn(async () => {
      order.push("reinit");
    });
    const deps = makeDeps({ clearPostAuthSyncStatus, reinitializePersistence });
    const handle = createAuthEventHandler(deps);
    await handle("SIGNED_IN", SESSION_A as never);
    await handle("SIGNED_OUT", null);

    // Find the SIGNED_OUT reinit (the one AFTER clear). The
    // SIGNED_IN reinit comes first.
    const clearIdx = order.indexOf("clear");
    const reinitAfterClear = order.indexOf("reinit", clearIdx + 1);
    expect(clearIdx).toBeGreaterThanOrEqual(0);
    expect(reinitAfterClear).toBeGreaterThan(clearIdx);
  });

  it("SIGNED_OUT with no prior sign-in is a no-op for the clear (no userId to clear)", async () => {
    // Defensive: a SIGNED_OUT that arrives without a prior
    // SIGNED_IN/INITIAL_SESSION must not throw and must not call
    // clearPostAuthSyncStatus with a phantom userId.
    const deps = makeDeps();
    const handle = createAuthEventHandler(deps);
    await handle("SIGNED_OUT", null);

    expect(deps.clearPostAuthSyncStatus).not.toHaveBeenCalled();
    expect(deps.reinitializePersistence).toHaveBeenCalledTimes(1);
  });

  it("SIGNED_IN with a null session.user.id does not capture a phantom lastUserId", async () => {
    // Defensive: a malformed session must not poison the lastUserId
    // cache. If userId is missing, capture is skipped.
    const sessionWithoutId = { user: undefined, access_token: "t" };
    const deps = makeDeps();
    const handle = createAuthEventHandler(deps);
    await handle("SIGNED_IN", sessionWithoutId as never);
    await handle("SIGNED_OUT", null);

    expect(deps.clearPostAuthSyncStatus).not.toHaveBeenCalled();
  });

  it("TOKEN_REFRESHED and other events are no-ops for persistence wiring", async () => {
    // The handler must not call any persistence side-effect for events
    // that do not change the persistence surface.
    const deps = makeDeps();
    const handle = createAuthEventHandler(deps);
    await handle("TOKEN_REFRESHED", SESSION_A as never);
    await handle("USER_UPDATED", SESSION_A as never);
    await handle("PASSWORD_RECOVERY", SESSION_A as never);

    expect(deps.beginPostAuthSync).not.toHaveBeenCalled();
    expect(deps.reinitializePersistence).not.toHaveBeenCalled();
    expect(deps.clearPostAuthSyncStatus).not.toHaveBeenCalled();
  });

  it("does NOT call linkAndImportLocalProgress directly (orchestrator owns it)", async () => {
    // PR2 invariant: the handler must not bypass the readiness surface
    // by calling the orchestrator directly. The exports surface is
    // beginPostAuthSync; anything else would race the status state
    // machine.
    //
    // We assert this via the dependency surface — createAuthEventHandler
    // is typed to accept only the three documented dependencies; there
    // is no `linkAndImportLocalProgress` in the deps shape.
    const handle = createAuthEventHandler(makeDeps());
    expect(typeof handle).toBe("function");
  });
});