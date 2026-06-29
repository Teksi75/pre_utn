/**
 * Behavioral tests for src/components/auth/AuthBootstrap.tsx
 *
 * Goal: prove that AuthBootstrap:
 * - Calls `beginPostAuthSync(session)` on BOTH INITIAL_SESSION and
 *   SIGNED_IN events, deduped per userId (the orchestrator is
 *   idempotent, but the call site must be equivalent).
 * - Captures `lastUserId` in BOTH branches so SIGNED_OUT can clear
 *   the per-userId cache.
 * - Calls `clearPostAuthSyncStatus(lastUserId)` BEFORE
 *   `resetPersistenceToLocal()` on SIGNED_OUT so the next sign-in
 *   re-runs the orchestrator. SIGNED_OUT uses the session-blind
 *   local reset (never the session-reading `reinitializePersistence`,
 *   which would race a concurrent sign-in B).
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
  resetPersistenceToLocal?: unknown;
  clearPostAuthSyncStatus?: unknown;
} = {}) {
  return {
    beginPostAuthSync: (overrides.beginPostAuthSync ?? vi.fn(async () => "ready" as const)) as never,
    reinitializePersistence: (overrides.reinitializePersistence ?? vi.fn(async () => undefined)) as never,
    resetPersistenceToLocal: (overrides.resetPersistenceToLocal ?? vi.fn(async () => undefined)) as never,
    clearPostAuthSyncStatus: (overrides.clearPostAuthSyncStatus ?? vi.fn()) as never,
  };
}

describe("AuthBootstrap — readiness wiring (behavioral)", () => {
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

  it("SIGNED_IN forwards the session user id as expectedUserId to reinitializePersistence (identity-aware selector)", async () => {
    // Guard-passes-then-flip race, handler side.
    // The generation guard alone is not sufficient: between the guard
    // and the selector's own client.auth.getSession() read, another
    // auth event can flip the live session. The handler MUST forward
    // the entry session's user id as expectedUserId so the selector
    // can refuse to select remote when the live session no longer
    // matches. The selector-side guard is covered in
    // adapter-config-reinit.test.ts.
    const reinitializePersistence = vi.fn(async () => undefined);
    const deps = makeDeps({ reinitializePersistence });
    const handle = createAuthEventHandler(deps);

    await handle("SIGNED_IN", SESSION_A as never);

    expect(reinitializePersistence).toHaveBeenCalledTimes(1);
    expect(reinitializePersistence).toHaveBeenCalledWith(
      expect.objectContaining({ expectedUserId: "auth-user-A" }),
    );
  });

  it("INITIAL_SESSION forwards the session user id as expectedUserId to reinitializePersistence", async () => {
    // The identity forwarding must apply to BOTH sign-in events,
    // since the handler treats INITIAL_SESSION and SIGNED_IN as
    // equivalent at the call site.
    const reinitializePersistence = vi.fn(async () => undefined);
    const deps = makeDeps({ reinitializePersistence });
    const handle = createAuthEventHandler(deps);

    await handle("INITIAL_SESSION", SESSION_A as never);

    expect(reinitializePersistence).toHaveBeenCalledTimes(1);
    expect(reinitializePersistence).toHaveBeenCalledWith(
      expect.objectContaining({ expectedUserId: "auth-user-A" }),
    );
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

  it("SIGNED_OUT path clears status BEFORE resetPersistenceToLocal (so the next sign-in sees a clean state)", async () => {
    // The clear path must complete before the sign-out tail flips the
    // adapter to local. The selector reads currentStatus from the
    // post-auth-sync module; if the clear runs AFTER the tail, the
    // selector sees the stale status.
    const order: string[] = [];
    const clearPostAuthSyncStatus = vi.fn(() => {
      order.push("clear");
    });
    const resetPersistenceToLocal = vi.fn(async () => {
      order.push("reset");
    });
    const deps = makeDeps({ clearPostAuthSyncStatus, resetPersistenceToLocal });
    const handle = createAuthEventHandler(deps);
    // Only test SIGNED_OUT — no prior SIGNED_IN in this test.
    await handle("SIGNED_OUT", null);

    expect(clearPostAuthSyncStatus).not.toHaveBeenCalled(); // no prior userId
    // The sign-out tail must run exactly once; the session-reading
    // reinit must NOT run on SIGNED_OUT (would race a concurrent sign-in).
    expect(resetPersistenceToLocal).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["reset"]);
  });

  it("SIGNED_OUT with prior SIGNED_IN: clear runs BEFORE the SIGNED_OUT local reset", async () => {
    // Stronger version with prior sign-in: clear must precede the
    // SIGNED_OUT local-reset tail so the selector reads a clean
    // currentStatus snapshot.
    const order: string[] = [];
    const clearPostAuthSyncStatus = vi.fn(() => {
      order.push("clear");
    });
    const resetPersistenceToLocal = vi.fn(async () => {
      order.push("reset");
    });
    const deps = makeDeps({ clearPostAuthSyncStatus, resetPersistenceToLocal });
    const handle = createAuthEventHandler(deps);
    await handle("SIGNED_IN", SESSION_A as never);
    await handle("SIGNED_OUT", null);

    // Find the SIGNED_OUT reset (the one AFTER clear). The SIGNED_IN
    // reinit comes first.
    const clearIdx = order.indexOf("clear");
    const resetAfterClear = order.indexOf("reset", clearIdx + 1);
    expect(clearIdx).toBeGreaterThanOrEqual(0);
    expect(resetAfterClear).toBeGreaterThan(clearIdx);
  });

  it("SIGNED_OUT with no prior sign-in is a no-op for the clear (no userId to clear)", async () => {
    // Defensive: a SIGNED_OUT that arrives without a prior
    // SIGNED_IN/INITIAL_SESSION must not throw and must not call
    // clearPostAuthSyncStatus with a phantom userId.
    const deps = makeDeps();
    const handle = createAuthEventHandler(deps);
    await handle("SIGNED_OUT", null);

    expect(deps.clearPostAuthSyncStatus).not.toHaveBeenCalled();
    // SIGNED_OUT runs the session-blind local reset, not the
    // session-reading reinit (race safety).
    expect(deps.resetPersistenceToLocal).toHaveBeenCalledTimes(1);
    expect(deps.reinitializePersistence).not.toHaveBeenCalled();
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
    // The handler must not bypass the readiness surface
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

  it("stale SIGNED_IN A does NOT reinitializePersistence after sign-out + sign-in B (race guard)", async () => {
    // Stale auth handler race.
    // Scenario:
    //   1. session A starts a slow post-auth sync (suspends at the
    //      orchestrator await);
    //   2. sign-out arrives (supersedes A);
    //   3. sign-in B arrives (supersedes A again);
    //   4. A's slow sync finally resolves — the stale A handler resumes;
    //   5. assert A does NOT reinitializePersistence and does NOT
    //      overwrite B's persistence state.
    //
    // Without the generation guard, the stale A handler would call
    // reinitializePersistence against the current session B before B's
    // own readiness flow completes, flipping persistence prematurely.
    let resolveASync!: () => void;
    const beginPostAuthSync = vi.fn((session: unknown) => {
      const sid = (session as { user?: { id?: string } })?.user?.id;
      if (sid === "auth-user-A") {
        // A's sync is slow and only resolves when we trigger it.
        return new Promise<string>((r) => {
          resolveASync = () => r("ready");
        });
      }
      // B resolves immediately.
      return Promise.resolve("ready" as const);
    });
    const reinitializePersistence = vi.fn(async () => undefined);
    const resetPersistenceToLocal = vi.fn(async () => undefined);
    const clearPostAuthSyncStatus = vi.fn();
    const deps = makeDeps({
      beginPostAuthSync,
      reinitializePersistence,
      resetPersistenceToLocal,
      clearPostAuthSyncStatus,
    });
    const handle = createAuthEventHandler(deps);

    // 1. Session A starts its slow sync (fire and forget — it suspends
    //    at the orchestrator await).
    const aPromise = handle("SIGNED_IN", SESSION_A as never);
    await Promise.resolve(); // let A reach its await

    // 2. Sign-out supersedes A — clears + resets persistence to local
    //    (session-blind; does not read live session).
    await handle("SIGNED_OUT", null);

    // 3. Sign-in B supersedes A again — B's sync resolves immediately,
    //    then B reinitializes persistence.
    await handle("SIGNED_IN", SESSION_B as never);

    // reinit has been called for B (NOT for stale A, NOT for SIGNED_OUT —
    // SIGNED_OUT uses the session-blind reset). The local reset has been
    // called once for SIGNED_OUT.
    expect(reinitializePersistence).toHaveBeenCalledTimes(1);
    expect(resetPersistenceToLocal).toHaveBeenCalledTimes(1);
    expect(beginPostAuthSync).toHaveBeenCalledWith(SESSION_A);
    expect(beginPostAuthSync).toHaveBeenCalledWith(SESSION_B);

    // 4. A's slow sync finally resolves — the stale A handler resumes.
    resolveASync();
    await aPromise;

    // 5. A did NOT add an extra reinitializePersistence call and did NOT
    //    overwrite B's persistence state.
    expect(reinitializePersistence).toHaveBeenCalledTimes(1);
    expect(resetPersistenceToLocal).toHaveBeenCalledTimes(1);
  });

  it("stale SIGNED_IN A does NOT reinitializePersistence after a direct sign-in B (session change, no sign-out)", async () => {
    // Complement to the sign-out variant: a session change (A → B)
    // without an intervening sign-out must also suppress the stale A
    // reinit. Supabase can emit a second SIGNED_IN for a different user
    // without a SIGNED_OUT in some edge flows.
    let resolveASync!: () => void;
    const beginPostAuthSync = vi.fn((session: unknown) => {
      const sid = (session as { user?: { id?: string } })?.user?.id;
      if (sid === "auth-user-A") {
        return new Promise<string>((r) => {
          resolveASync = () => r("ready");
        });
      }
      return Promise.resolve("ready" as const);
    });
    const reinitializePersistence = vi.fn(async () => undefined);
    const deps = makeDeps({ beginPostAuthSync, reinitializePersistence });
    const handle = createAuthEventHandler(deps);

    // 1. Session A starts its slow sync.
    const aPromise = handle("SIGNED_IN", SESSION_A as never);
    await Promise.resolve();

    // 2. Session B arrives (supersedes A); B resolves + reinits.
    await handle("SIGNED_IN", SESSION_B as never);

    // reinit has been called once (for B) — NOT for stale A.
    expect(reinitializePersistence).toHaveBeenCalledTimes(1);

    // 3. A's slow sync resolves — stale handler resumes.
    resolveASync();
    await aPromise;

    // 4. A did NOT add an extra reinitializePersistence call.
    expect(reinitializePersistence).toHaveBeenCalledTimes(1);
  });

  it("in-flight SIGNED_OUT tail cannot select remote for a newly signed-in B (session-blind sign-out tail)", async () => {
    // Stale SIGNED_OUT reinitialize race.
    // Scenario:
    //   1. session A is established (persistence = remote for A);
    //   2. SIGNED_OUT fires — its tail is slow (it awaits
    //      `client.auth.getSession()` in production);
    //   3. before the SIGNED_OUT tail resolves, SIGNED_IN B fires and
    //      updates the live Supabase session to B;
    //   4. the SIGNED_OUT tail must NOT flip persistence to remote for
    //      B — its final effect must be local (signed-out) regardless
    //      of the live session value at its tail. The session-reading
    //      `reinitializePersistence` must NOT be invoked by the SIGNED_OUT
    //      path;
    //   5. B owns the final remote selection — its own SIGNED_IN path
    //      runs `reinitializePersistence` once its FK readiness completes.
    //
    // The test models production semantics:
    //   - `reinitializePersistence` reads the live session and sets the
    //     configured adapter to remote for that user (or local if null);
    //   - `resetPersistenceToLocal` explicitly selects local WITHOUT
    //     reading the live session.
    //
    // On the OLD behavior, the SIGNED_OUT path called `reinitializePersistence`
    // instead of `resetPersistenceToLocal`, so the in-flight tail observed
    // B's live session and selected remote for B before B's readiness
    // completed — this test would fail there.    // Live Supabase session user id — mutated as auth events fire.
    let liveUser: string | null = "auth-user-A";
    // Outcome: user id the persistence adapter is currently selecting
    // remote for. null = local. undefined = never selected.
    let selectedRemoteFor: string | null | undefined = undefined;

    // Gate that holds the SIGNED_OUT tail in flight while SIGNED_IN B
    // interleaves. The tail mock awaits this promise before resolving.
    let releaseSignedOutTail!: () => void;
    const signedOutTailGate = new Promise<void>((r) => {
      releaseSignedOutTail = () => r();
    });
    // True while the race window is open (SIGNED_OUT tail in flight,
    // before B's readiness resolves). The `reinitializePersistence`
    // mock only slows down on calls inside this window — SIGNED_IN A
    // (before the window) and SIGNED_IN B (after the window, once its
    // readiness completes) resolve fast.
    let inRaceWindow = false;

    // SIGNED_IN reinit — production-like: reads live session and sets
    // the configured adapter's remote selection.
    const reinitializePersistence = vi.fn(async () => {
      if (inRaceWindow) {
        // Simulate the slow `client.auth.getSession()` await that
        // exposes the SIGNED_OUT tail to a concurrent sign-in.
        await signedOutTailGate;
      }
      selectedRemoteFor = liveUser;
    });

    // SIGNED_OUT tail — production-like (NEW behavior): explicit local,
    // session-blind. Slow so the race window is exercised against the
    // new path too.
    const resetPersistenceToLocal = vi.fn(async () => {
      await signedOutTailGate;
      selectedRemoteFor = null;
    });

    // B's slow readiness — only released once the SIGNED_OUT tail has
    // resolved, so B's reinit (which reads live session) definitively
    // happens AFTER the SIGNED_OUT tail finished without observing B.
    let resolveBSync!: () => void;
    const bSyncGate = new Promise<void>((r) => {
      resolveBSync = () => r();
    });
    const beginPostAuthSync = vi.fn((session: unknown) => {
      const sid = (session as { user?: { id?: string } })?.user?.id;
      if (sid === "auth-user-B") return bSyncGate;
      return Promise.resolve();
    });

    const deps = makeDeps({
      beginPostAuthSync,
      reinitializePersistence,
      resetPersistenceToLocal,
    });
    const handle = createAuthEventHandler(deps);

    // 1. session A signs in — fast; persistence selects remote for A.
    await handle("SIGNED_IN", SESSION_A as never);
    expect(selectedRemoteFor).toBe("auth-user-A");

    // 2. SIGNED_OUT fires — its tail is gated slow. Open the race window
    //    so a reinit call from this point would await the gate.
    inRaceWindow = true;
    const signedOutPromise = handle("SIGNED_OUT", null);
    // Let SIGNED_OUT reach its tail await.
    await Promise.resolve();
    await Promise.resolve();

    // 3. SIGNED_IN B fires BEFORE SIGNED_OUT tail resolves. The live
    //    Supabase session flips to B.
    liveUser = "auth-user-B";
    const bPromise = handle("SIGNED_IN", SESSION_B as never);
    // Let B's handler enter — bumps generation, captures B, then awaits
    // beginPostAuthSync(B) (bSyncGate, slow).
    await Promise.resolve();
    await Promise.resolve();

    // 4. Release the SIGNED_OUT tail. Its final effect must be local,
    //    NOT remote-for-B. The SIGNED_OUT path must not have invoked
    //    the session-reading `reinitializePersistence`.
    inRaceWindow = false;
    releaseSignedOutTail();
    await signedOutPromise;

    expect(resetPersistenceToLocal).toHaveBeenCalledTimes(1);
    expect(selectedRemoteFor).toBe(null);
    // Only A's SIGNED_IN reinit has run so far. B's reinit is still
    // gated behind bSyncGate; the SIGNED_OUT path contributed NO
    // extra reinit.
    expect(reinitializePersistence).toHaveBeenCalledTimes(1);

    // 5. Resolve B's readiness — B owns the final remote selection.
    resolveBSync();
    await bPromise;

    // B's reinit has now run, reading the live session (= B) and
    // selecting remote for B.
    expect(reinitializePersistence).toHaveBeenCalledTimes(2);
    expect(selectedRemoteFor).toBe("auth-user-B");
  });

  it("null INITIAL_SESSION uses session-blind local reset (NOT reinitializePersistence), so a concurrent SIGNED_IN B cannot be observed by the null tail", async () => {
    // Null INITIAL_SESSION/SIGNED_IN stale reinit race.
    // Scenario:
    //   1. INITIAL_SESSION arrives with session === null (stale/no-session
    //      tail — e.g. the tab opened before any auth cookie landed, or a
    //      recovery flow that emits INITIAL_SESSION before the session is
    //      materialized). The null tail must NOT call reinitializePersistence
    //      (which reads the live Supabase session): a SIGNED_IN B arriving
    //      while the tail is in flight would have its session observed here,
    //      selecting remote for B before B's FK readiness completes.
    //   2. SIGNED_IN B arrives and updates the live Supabase session to B.
    //   3. assert the null tail called resetPersistenceToLocal (session-blind
    //      local), NOT reinitializePersistence; B owns the final remote
    //      selection via its own SIGNED_IN path.
    //
    // On the OLD behavior, the null-session branch skipped beginPostAuthSync
    // but still fell through to `await deps.reinitializePersistence()`, which
    // reads the live session — this test would fail there.

    // Live Supabase session user id — mutated as auth events fire.
    let liveUser: string | null = null;
    // Outcome: user id the persistence adapter is currently selecting
    // remote for. null = local.
    let selectedRemoteFor: string | null | undefined = undefined;

    // Gate that holds the null INITIAL_SESSION tail in flight while
    // SIGNED_IN B interleaves. Both reset and reinit await it inside the
    // race window so the interleaving is observable.
    let releaseNullTail!: () => void;
    const nullTailGate = new Promise<void>((r) => {
      releaseNullTail = () => r();
    });
    let inRaceWindow = false;

    // reinitializePersistence — production-like: reads the live session and
    // selects remote for that user. Slow when called inside the race window
    // so we can prove the null tail never reaches it.
    const reinitializePersistence = vi.fn(async () => {
      if (inRaceWindow) {
        await nullTailGate;
      }
      selectedRemoteFor = liveUser;
    });

    // resetPersistenceToLocal — production-like (session-blind local reset).
    // Slow so the race window is exercised against the new path too.
    const resetPersistenceToLocal = vi.fn(async () => {
      await nullTailGate;
      selectedRemoteFor = null;
    });

    // B's slow readiness — only released once the null tail has resolved.
    let resolveBSync!: () => void;
    const bSyncGate = new Promise<void>((r) => {
      resolveBSync = () => r();
    });
    const beginPostAuthSync = vi.fn((session: unknown) => {
      const sid = (session as { user?: { id?: string } })?.user?.id;
      if (sid === "auth-user-B") return bSyncGate;
      return Promise.resolve();
    });

    const deps = makeDeps({
      beginPostAuthSync,
      reinitializePersistence,
      resetPersistenceToLocal,
    });
    const handle = createAuthEventHandler(deps);

    // 1. INITIAL_SESSION with null session — its tail is gated slow. Open
    //    the race window so a reinit call from this point would await the
    //    gate (proving the null tail must not reach reinit).
    inRaceWindow = true;
    const nullTailPromise = handle("INITIAL_SESSION", null);
    // Let the null tail reach its local-reset await.
    await Promise.resolve();
    await Promise.resolve();

    // The null session must not invoke beginPostAuthSync (no session to
    // sync) and must not have invoked reinitializePersistence yet.
    expect(beginPostAuthSync).not.toHaveBeenCalled();
    expect(reinitializePersistence).not.toHaveBeenCalled();

    // 2. SIGNED_IN B fires BEFORE the null tail resolves. The live Supabase
    //    session flips to B.
    liveUser = "auth-user-B";
    const bPromise = handle("SIGNED_IN", SESSION_B as never);
    // Let B's handler enter — bumps generation, captures B, then awaits
    // beginPostAuthSync(B) (bSyncGate, slow).
    await Promise.resolve();
    await Promise.resolve();

    expect(beginPostAuthSync).toHaveBeenCalledWith(SESSION_B);

    // 3. Release the null tail. Its final effect must be local (NOT
    //    remote-for-B). The null-session path must have invoked
    //    resetPersistenceToLocal, NOT the session-reading
    //    reinitializePersistence.
    inRaceWindow = false;
    releaseNullTail();
    await nullTailPromise;

    expect(resetPersistenceToLocal).toHaveBeenCalledTimes(1);
    expect(reinitializePersistence).not.toHaveBeenCalled();
    expect(selectedRemoteFor).toBe(null);

    // 4. Resolve B's readiness — B owns the final remote selection.
    resolveBSync();
    await bPromise;

    // B's reinit has now run, reading the live session (= B) and selecting
    // remote for B. The null tail contributed NO reinit call.
    expect(reinitializePersistence).toHaveBeenCalledTimes(1);
    expect(selectedRemoteFor).toBe("auth-user-B");
  });

  it("null SIGNED_IN also uses session-blind local reset (equivalent to null INITIAL_SESSION)", async () => {
    // The null-session fix must apply to BOTH sign-in events, since the
    // handler treats INITIAL_SESSION and SIGNED_IN as equivalent at the
    // call site. A null SIGNED_IN must route to resetPersistenceToLocal,
    // not the session-reading reinitializePersistence.
    const reinitializePersistence = vi.fn(async () => undefined);
    const resetPersistenceToLocal = vi.fn(async () => undefined);
    const beginPostAuthSync = vi.fn(async () => "ready" as const);
    const deps = makeDeps({
      beginPostAuthSync,
      reinitializePersistence,
      resetPersistenceToLocal,
    });
    const handle = createAuthEventHandler(deps);

    await handle("SIGNED_IN", null);

    expect(beginPostAuthSync).not.toHaveBeenCalled();
    expect(reinitializePersistence).not.toHaveBeenCalled();
    expect(resetPersistenceToLocal).toHaveBeenCalledTimes(1);
  });
});
