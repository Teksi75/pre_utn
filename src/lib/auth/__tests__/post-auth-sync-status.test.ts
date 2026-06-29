/**
 * Tests for src/lib/auth/post-auth-sync.ts — PostAuthSyncStatus state machine.
 *
 * The status module is the public surface auth and persistence UI consumers read to know
 * whether it is safe to claim "Sincronizado" in the Nav and to drive the
 * Home fallback view model.
 *
 * Status contract:
 *   - "disabled"     — auth is not configured (no env / no client).
 *   - "signed-out"   — no session.
 *   - "pending"      — sync started, has not resolved yet.
 *   - "ready"        — sync completed; remote is authoritative for this session.
 *   - "local-fallback" — sync ran but remote is empty/unavailable; the app
 *                       must keep showing local progress.
 *
 * Spec: REQ-AUTH-3, REQ-NEW-2c.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PROFILES_STORAGE_KEY } from "../../student-profile-storage";

// ---------------------------------------------------------------------------
// localStorage + sessionStorage mocks
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  vi.stubGlobal("sessionStorage", sessionStorageMock);
  localStorageMock.clear();
  sessionStorageMock.clear();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setActiveProfile(studentId: string): void {
  localStorageMock.setItem(
    PROFILES_STORAGE_KEY,
    JSON.stringify({
      profiles: [
        {
          studentId,
          displayName: "Ana",
          createdAt: "t0",
          lastActiveAt: "t0",
        },
      ],
      activeStudentId: studentId,
    })
  );
}

const SESSION = {
  user: {
    id: "auth-user-1",
    email: "ana@example.com",
  },
  access_token: "tok",
  refresh_token: "ref",
};

function makeSupabaseClient() {
  return {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: SESSION },
        error: null,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Status state machine tests
// ---------------------------------------------------------------------------

describe("getPostAuthSyncStatus()", () => {
  it("returns 'signed-out' as the initial state", async () => {
    const { getPostAuthSyncStatus } = await import("../post-auth-sync");
    expect(getPostAuthSyncStatus()).toBe("signed-out");
  });
});

describe("beginPostAuthSync(session) status transitions", () => {
  it("null session → resolves to 'signed-out'", async () => {
    const { beginPostAuthSync, getPostAuthSyncStatus } = await import(
      "../post-auth-sync"
    );
    const result = await beginPostAuthSync(null);
    expect(result).toBe("signed-out");
    expect(getPostAuthSyncStatus()).toBe("signed-out");
  });

  it("session + disabled client → resolves to 'disabled'", async () => {
    // Simulate auth-disabled by returning null from createBrowserClient.
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => null,
    }));
    // Stub the orchestrator to a no-op so the test only checks the
    // status state machine.
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: vi.fn(async () => undefined),
    }));

    const { beginPostAuthSync, getPostAuthSyncStatus } = await import(
      "../post-auth-sync"
    );
    const result = await beginPostAuthSync(SESSION as never);
    expect(result).toBe("disabled");
    expect(getPostAuthSyncStatus()).toBe("disabled");
  });

  it("session + working sync → resolves to 'ready'", async () => {
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: vi.fn(async () => ({
        kind: "ready",
        branch: "link-only",
      })),
    }));

    const { beginPostAuthSync, getPostAuthSyncStatus } = await import(
      "../post-auth-sync"
    );
    const result = await beginPostAuthSync(SESSION as never);
    expect(result).toBe("ready");
    expect(getPostAuthSyncStatus()).toBe("ready");
  });

  it("session + orchestrator throws → resolves to 'local-fallback'", async () => {
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: vi.fn(async () => {
        throw new Error("remote-down");
      }),
    }));

    const { beginPostAuthSync, getPostAuthSyncStatus } = await import(
      "../post-auth-sync"
    );
    const result = await beginPostAuthSync(SESSION as never);
    expect(result).toBe("local-fallback");
    expect(getPostAuthSyncStatus()).toBe("local-fallback");
  });

  it("flips status to 'pending' while sync is in flight, then 'ready' after", async () => {
    let resolveSync: () => void = () => undefined;
    const slowSync = new Promise<{ kind: "ready"; branch: string }>((resolve) => {
      resolveSync = () =>
        resolve({ kind: "ready", branch: "link-only" });
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: vi.fn(() => slowSync),
    }));

    setActiveProfile("student-1");
    const { beginPostAuthSync, getPostAuthSyncStatus } = await import(
      "../post-auth-sync"
    );

    // Kick off sync but don't await yet — peek at the in-flight status.
    const inflight = beginPostAuthSync(SESSION as never);
    expect(getPostAuthSyncStatus()).toBe("pending");

    // Resolve the orchestrator and await.
    resolveSync();
    const result = await inflight;
    expect(result).toBe("ready");
    expect(getPostAuthSyncStatus()).toBe("ready");
  });
});

describe("waitForPostAuthSync()", () => {
  it("returns null when no sync has been started", async () => {
    const { waitForPostAuthSync } = await import("../post-auth-sync");
    expect(waitForPostAuthSync()).toBeNull();
  });

  it("returns the in-flight promise while sync is pending", async () => {
    let resolveSync: () => void = () => undefined;
    const slowSync = new Promise<{ kind: "ready"; branch: string }>((resolve) => {
      resolveSync = () => resolve({ kind: "ready", branch: "link-only" });
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: vi.fn(() => slowSync),
    }));

    setActiveProfile("student-1");
    const { beginPostAuthSync, waitForPostAuthSync } = await import(
      "../post-auth-sync"
    );

    const inflight = beginPostAuthSync(SESSION as never);
    const waiter = waitForPostAuthSync();
    expect(waiter).not.toBeNull();

    // Both the begin-promise and the waitForPostAuthSync promise resolve
    // when the orchestrator finishes — they share the same underlying work.
    resolveSync();
    await expect(inflight).resolves.toBe("ready");
    await expect(waiter).resolves.toBeUndefined();
  });

  it("returns null after sync has completed (no stale handle)", async () => {
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: vi.fn(async () => ({
        kind: "ready",
        branch: "link-only",
      })),
    }));

    setActiveProfile("student-1");
    const { beginPostAuthSync, waitForPostAuthSync } = await import(
      "../post-auth-sync"
    );

    await beginPostAuthSync(SESSION as never);
    expect(waitForPostAuthSync()).toBeNull();
  });
});

describe("beginPostAuthSync() idempotency", () => {
  it("calling twice with the same session does not double-run the orchestrator", async () => {
    const mockOrchestrator = vi.fn(async () => undefined);

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: mockOrchestrator,
    }));

    setActiveProfile("student-1");
    const { beginPostAuthSync } = await import("../post-auth-sync");

    await beginPostAuthSync(SESSION as never);
    await beginPostAuthSync(SESSION as never);

    expect(mockOrchestrator).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Cross-user isolation
  // -------------------------------------------------------------------------
  // The status module's in-flight entry must NOT dedupe a second user
  // while a first user's sync is still pending. A naive single-slot
  // implementation would set a shared promise for user A, then when user
  // B signs in before A's promise resolves, the second call would either
  // re-await A's promise (wrong) or block until A finishes (wrong).
  //
  // Correct behavior: each userId gets its own in-flight promise, and
  // `waitForPostAuthSync()` returns the in-flight promise for ANY user.

  it("two-user pending: user A pending → user B starts own sync (NOT shared)", async () => {
    let resolveA: () => void = () => undefined;
    const slowA = new Promise<{ kind: "ready"; branch: string }>((resolve) => {
      resolveA = () => resolve({ kind: "ready", branch: "link-only" });
    });

    const mockOrchestrator = vi.fn((session: { user: { id: string } }) => {
      if (session.user.id === "auth-user-A") return slowA;
      return Promise.resolve({ kind: "ready", branch: "link-only" });
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: mockOrchestrator,
    }));

    setActiveProfile("student-1");
    const { beginPostAuthSync, getPostAuthSyncStatus } = await import(
      "../post-auth-sync"
    );

    const sessionA = {
      user: { id: "auth-user-A", email: "a@example.com" },
      access_token: "tok-a",
      refresh_token: "ref-a",
    };
    const sessionB = {
      user: { id: "auth-user-B", email: "b@example.com" },
      access_token: "tok-b",
      refresh_token: "ref-b",
    };

    // Kick off A. Don't await yet — A is still pending.
    const inflightA = beginPostAuthSync(sessionA as never);
    expect(getPostAuthSyncStatus()).toBe("pending");

    // Start B. B should NOT inherit A's pending promise. B should resolve
    // quickly because B's orchestrator is the immediate-resolution branch.
    const resultB = await beginPostAuthSync(sessionB as never);
    expect(resultB).toBe("ready");
    expect(mockOrchestrator).toHaveBeenCalledTimes(2);
    expect(mockOrchestrator).toHaveBeenNthCalledWith(1, sessionA);
    expect(mockOrchestrator).toHaveBeenNthCalledWith(2, sessionB);

    // Now resolve A and verify A still completes.
    resolveA();
    const resultA = await inflightA;
    expect(resultA).toBe("ready");
  });
});

// ---------------------------------------------------------------------------
// Cross-user global status ownership (active-user guard)
// ---------------------------------------------------------------------------
// The per-userId token guard only checks whether THIS user's in-flight entry
// is still current. It does NOT close the cross-user race where a slow sync
// for user A (never cleared) resolves "ready" AFTER user B has begun and set
// currentStatus = "pending". Without the active-user guard, A would stomp
// currentStatus = "ready" over B's "pending", surfacing a false ready for
// B's UI. The active-user check (activeStatusUserId) scopes global writes to
// the latest user to begin a sync; a stale A may still update its own
// per-user completedByUser cache, but must NOT overwrite the global snapshot.

describe("beginPostAuthSync() cross-user global status ownership", () => {
  it("A slow sync + B begins pending: A resolving ready does NOT overwrite global status; B owns it; B resolves ready", async () => {
    // Scenario:
    //   1. A begins a slow sync — currentStatus = "pending", A owns global.
    //   2. B begins its own sync — currentStatus = "pending", B now owns
    //      global (activeStatusUserId = B).
    //   3. A's slow orchestrator resolves "ready". A may update its own
    //      per-user completedByUser cache, but MUST NOT overwrite the
    //      global currentStatus or emit ready for B's UI.
    //   4. assert getPostAuthSyncStatus() remains "pending" (B-owned),
    //      not "ready" from A.
    //   5. B resolves "ready" → currentStatus becomes "ready".
    //
    // On the OLD behavior, the per-userId token guard alone did NOT close
    // this race: A's entry was never cleared, so A's token still matched
    // and A wrote currentStatus = "ready" over B's "pending" — this test
    // would fail there.

    let resolveA: (outcome: { kind: "ready"; branch: string }) => void =
      () => undefined;
    const slowA = new Promise<{ kind: "ready"; branch: string }>((resolve) => {
      resolveA = resolve;
    });
    let resolveB: (outcome: { kind: "ready"; branch: string }) => void =
      () => undefined;
    const slowB = new Promise<{ kind: "ready"; branch: string }>((resolve) => {
      resolveB = resolve;
    });

    const mockOrchestrator = vi.fn((session: { user: { id: string } }) => {
      if (session.user.id === "auth-user-A") return slowA;
      if (session.user.id === "auth-user-B") return slowB;
      return Promise.resolve({ kind: "ready" as const, branch: "link-only" });
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: mockOrchestrator,
      clearPostAuthSyncState: vi.fn(),
    }));

    setActiveProfile("student-1");
    const {
      beginPostAuthSync,
      getPostAuthSyncStatus,
      resetPostAuthSyncStatusForTests,
    } = await import("../post-auth-sync");

    resetPostAuthSyncStatusForTests();

    const sessionA = {
      user: { id: "auth-user-A", email: "a@example.com" },
      access_token: "tok-a",
      refresh_token: "ref-a",
    };
    const sessionB = {
      user: { id: "auth-user-B", email: "b@example.com" },
      access_token: "tok-b",
      refresh_token: "ref-b",
    };

    // 1. A begins — pending, A owns global.
    const inflightA = beginPostAuthSync(sessionA as never);
    expect(getPostAuthSyncStatus()).toBe("pending");

    // 2. B begins — pending, B now owns global.
    const inflightB = beginPostAuthSync(sessionB as never);
    expect(getPostAuthSyncStatus()).toBe("pending");

    // 3. A resolves "ready". A updates its per-user cache but MUST NOT
    //    overwrite the global currentStatus (B owns it).
    resolveA({ kind: "ready", branch: "link-only" });
    const resultA = await inflightA;
    expect(resultA).toBe("ready"); // A's own cached status
    // Global status must remain pending (B-owned), NOT "ready" from A.
    expect(getPostAuthSyncStatus()).toBe("pending");

    // 4. B resolves "ready" → global status becomes "ready" (B owns it).
    resolveB({ kind: "ready", branch: "link-only" });
    const resultB = await inflightB;
    expect(resultB).toBe("ready");
    expect(getPostAuthSyncStatus()).toBe("ready");
  });

  it("A slow sync + B begins: A resolving local-fallback does NOT overwrite global status (B owns it)", async () => {
    // Complement to the ready variant: a stale A local-fallback resolution
    // must also NOT stomp B's pending global status. A's per-user cache
    // records local-fallback; the global stays pending until B resolves.
    let resolveA: (
      outcome: { kind: "local-fallback"; reason: string; branch: string },
    ) => void = () => undefined;
    const slowA = new Promise<{
      kind: "local-fallback";
      reason: string;
      branch: string;
    }>((resolve) => {
      resolveA = resolve;
    });
    let resolveB: (outcome: { kind: "ready"; branch: string }) => void =
      () => undefined;
    const slowB = new Promise<{ kind: "ready"; branch: string }>((resolve) => {
      resolveB = resolve;
    });

    const mockOrchestrator = vi.fn((session: { user: { id: string } }) => {
      if (session.user.id === "auth-user-A") return slowA;
      if (session.user.id === "auth-user-B") return slowB;
      return Promise.resolve({ kind: "ready" as const, branch: "link-only" });
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: mockOrchestrator,
      clearPostAuthSyncState: vi.fn(),
    }));

    setActiveProfile("student-1");
    const {
      beginPostAuthSync,
      getPostAuthSyncStatus,
      resetPostAuthSyncStatusForTests,
    } = await import("../post-auth-sync");

    resetPostAuthSyncStatusForTests();

    const sessionA = {
      user: { id: "auth-user-A", email: "a@example.com" },
      access_token: "tok-a",
      refresh_token: "ref-a",
    };
    const sessionB = {
      user: { id: "auth-user-B", email: "b@example.com" },
      access_token: "tok-b",
      refresh_token: "ref-b",
    };

    const inflightA = beginPostAuthSync(sessionA as never);
    const inflightB = beginPostAuthSync(sessionB as never);
    expect(getPostAuthSyncStatus()).toBe("pending");

    // A resolves local-fallback — global must stay pending (B-owned).
    resolveA({
      kind: "local-fallback",
      reason: "profile-link-failed",
      branch: "link-only",
    });
    const resultA = await inflightA;
    expect(resultA).toBe("local-fallback"); // A's own cached status
    expect(getPostAuthSyncStatus()).toBe("pending");

    // B resolves ready — global becomes ready.
    resolveB({ kind: "ready", branch: "link-only" });
    const resultB = await inflightB;
    expect(resultB).toBe("ready");
    expect(getPostAuthSyncStatus()).toBe("ready");
  });
});

// ---------------------------------------------------------------------------
// Per-userId completed-status cache
// ---------------------------------------------------------------------------
// The status module caches the final outcome per userId so a caller that
// re-invokes beginPostAuthSync after completion gets THAT user's result
// back, not whatever global currentStatus has been overwritten to by a
// later user signing in.

describe("beginPostAuthSync() per-userId completed-status cache", () => {
  it("user A local-fallback then user B ready → calling A again returns A local-fallback (not global currentStatus)", async () => {
    const sessionA = {
      user: { id: "auth-user-A", email: "a@example.com" },
      access_token: "tok-a",
      refresh_token: "ref-a",
    };
    const sessionB = {
      user: { id: "auth-user-B", email: "b@example.com" },
      access_token: "tok-b",
      refresh_token: "ref-b",
    };

    const mockOrchestrator = vi.fn((session: { user: { id: string } }) => {
      if (session.user.id === "auth-user-A") {
        return Promise.resolve({
          kind: "local-fallback" as const,
          reason: "profile-link-failed",
          branch: "link-only",
        });
      }
      return Promise.resolve({ kind: "ready" as const, branch: "link-only" });
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: mockOrchestrator,
      clearPostAuthSyncState: vi.fn(),
    }));

    setActiveProfile("student-1");
    const { beginPostAuthSync, getPostAuthSyncStatus, resetPostAuthSyncStatusForTests } =
      await import("../post-auth-sync");

    resetPostAuthSyncStatusForTests();

    // A completes → status "local-fallback"
    const resultA = await beginPostAuthSync(sessionA as never);
    expect(resultA).toBe("local-fallback");

    // B completes → currentStatus now "ready" (global overwrite)
    const resultB = await beginPostAuthSync(sessionB as never);
    expect(resultB).toBe("ready");
    expect(getPostAuthSyncStatus()).toBe("ready");

    // Re-invoking A must return A's cached status, NOT the global currentStatus.
    const resultAAgain = await beginPostAuthSync(sessionA as never);
    expect(resultAAgain).toBe("local-fallback");
    // And the orchestrator must NOT have been re-invoked for A — A is
    // still in the completed cache.
    expect(mockOrchestrator).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Cached branch global ownership claim
// ---------------------------------------------------------------------------
// The per-userId completed cache returns THIS user's cached status on a
// re-invoke, but it MUST also claim the GLOBAL snapshot (currentStatus +
// activeStatusUserId) for that user before returning. Otherwise the global
// snapshot keeps reflecting whichever user last wrote it, and Nav — which
// reads getPostAuthSyncStatus() — renders a stale pill for the wrong user.
//
// Scenario this guards:
//   1. A signs in → sync settles "local-fallback" (cached for A).
//   2. B signs in → sync settles "ready"; global currentStatus = "ready",
//      activeStatusUserId = B.
//   3. A signs in again → beginPostAuthSync(A) hits the cached branch.
//      OLD behavior returned A's "local-fallback" but left global
//      currentStatus = "ready" (B's stale value), so Nav showed a false
//      "Sincronizado como <A>" for A. The fix claims global ownership for
//      A in the cached branch so the snapshot matches the cached return.

describe("beginPostAuthSync() cached branch claims global ownership", () => {
  it("A cached local-fallback after B ready → re-invoking A updates global currentStatus back to A's local-fallback (no stale ready for A)", async () => {
    // After B reaches ready, the
    // global snapshot says "ready" with B as owner. Re-invoking A must
    // NOT leave that stale "ready" visible to Nav: the cached branch
    // must claim ownership for A and flip global currentStatus to A's
    // cached "local-fallback".
    const sessionA = {
      user: { id: "auth-user-A", email: "a@example.com" },
      access_token: "tok-a",
      refresh_token: "ref-a",
    };
    const sessionB = {
      user: { id: "auth-user-B", email: "b@example.com" },
      access_token: "tok-b",
      refresh_token: "ref-b",
    };

    const mockOrchestrator = vi.fn((session: { user: { id: string } }) => {
      if (session.user.id === "auth-user-A") {
        return Promise.resolve({
          kind: "local-fallback" as const,
          reason: "profile-link-failed",
          branch: "link-only",
        });
      }
      return Promise.resolve({ kind: "ready" as const, branch: "link-only" });
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: mockOrchestrator,
      clearPostAuthSyncState: vi.fn(),
    }));

    setActiveProfile("student-1");
    const {
      beginPostAuthSync,
      getPostAuthSyncStatus,
      resetPostAuthSyncStatusForTests,
    } = await import("../post-auth-sync");

    resetPostAuthSyncStatusForTests();

    // A completes → cached "local-fallback", A owns global.
    const resultA = await beginPostAuthSync(sessionA as never);
    expect(resultA).toBe("local-fallback");
    expect(getPostAuthSyncStatus()).toBe("local-fallback");

    // B completes → global overwritten to "ready", B owns it.
    const resultB = await beginPostAuthSync(sessionB as never);
    expect(resultB).toBe("ready");
    expect(getPostAuthSyncStatus()).toBe("ready");

    // Re-invoke A (cached branch). Must return A's cached local-fallback
    // AND flip the global snapshot back to A's status so Nav does not
    // keep showing B's stale "ready" for A.
    const resultAAgain = await beginPostAuthSync(sessionA as never);
    expect(resultAAgain).toBe("local-fallback");
    expect(getPostAuthSyncStatus()).toBe("local-fallback");

    // The cached branch must NOT re-run the orchestrator for A.
    expect(mockOrchestrator).toHaveBeenCalledTimes(2);
  });

  it("cached ready updates global owner back to A (ready variant)", async () => {
    // Complement to the local-fallback variant: a cached "ready" for A
    // must also reclaim global ownership from B. After B settles
    // local-fallback (global = local-fallback, owner = B), re-invoking
    // A must flip global currentStatus back to A's cached "ready".
    const sessionA = {
      user: { id: "auth-user-A", email: "a@example.com" },
      access_token: "tok-a",
      refresh_token: "ref-a",
    };
    const sessionB = {
      user: { id: "auth-user-B", email: "b@example.com" },
      access_token: "tok-b",
      refresh_token: "ref-b",
    };

    const mockOrchestrator = vi.fn((session: { user: { id: string } }) => {
      if (session.user.id === "auth-user-A") {
        return Promise.resolve({ kind: "ready" as const, branch: "link-only" });
      }
      return Promise.resolve({
        kind: "local-fallback" as const,
        reason: "import-failed",
        branch: "link-and-import",
      });
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: mockOrchestrator,
      clearPostAuthSyncState: vi.fn(),
    }));

    setActiveProfile("student-1");
    const {
      beginPostAuthSync,
      getPostAuthSyncStatus,
      resetPostAuthSyncStatusForTests,
    } = await import("../post-auth-sync");

    resetPostAuthSyncStatusForTests();

    // A completes → cached "ready", A owns global.
    const resultA = await beginPostAuthSync(sessionA as never);
    expect(resultA).toBe("ready");
    expect(getPostAuthSyncStatus()).toBe("ready");

    // B completes → global overwritten to "local-fallback", B owns it.
    const resultB = await beginPostAuthSync(sessionB as never);
    expect(resultB).toBe("local-fallback");
    expect(getPostAuthSyncStatus()).toBe("local-fallback");

    // Re-invoke A (cached branch). Must reclaim global ownership and
    // flip currentStatus back to A's cached "ready".
    const resultAAgain = await beginPostAuthSync(sessionA as never);
    expect(resultAAgain).toBe("ready");
    expect(getPostAuthSyncStatus()).toBe("ready");

    expect(mockOrchestrator).toHaveBeenCalledTimes(2);
  });

  it("cached branch emits a transition when the global snapshot changes", async () => {
    // The ownership claim must notify subscribers so useSyncExternalStore
    // consumers (Nav) re-render with the corrected pill. A listener
    // registered before the re-invoke must fire exactly once for the
    // ready → local-fallback transition.
    const sessionA = {
      user: { id: "auth-user-A", email: "a@example.com" },
      access_token: "tok-a",
      refresh_token: "ref-a",
    };
    const sessionB = {
      user: { id: "auth-user-B", email: "b@example.com" },
      access_token: "tok-b",
      refresh_token: "ref-b",
    };

    const mockOrchestrator = vi.fn((session: { user: { id: string } }) => {
      if (session.user.id === "auth-user-A") {
        return Promise.resolve({
          kind: "local-fallback" as const,
          reason: "profile-link-failed",
          branch: "link-only",
        });
      }
      return Promise.resolve({ kind: "ready" as const, branch: "link-only" });
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: mockOrchestrator,
      clearPostAuthSyncState: vi.fn(),
    }));

    setActiveProfile("student-1");
    const {
      beginPostAuthSync,
      subscribePostAuthSyncChange,
      resetPostAuthSyncStatusForTests,
    } = await import("../post-auth-sync");

    resetPostAuthSyncStatusForTests();

    // Run A (local-fallback) then B (ready) to set up the stale global.
    await beginPostAuthSync(sessionA as never);
    await beginPostAuthSync(sessionB as never);

    // Subscribe AFTER B has settled ready, so the only transition the
    // listener observes is the cached-branch ownership claim for A.
    let emissions = 0;
    const unsubscribe = subscribePostAuthSyncChange(() => {
      emissions += 1;
    });

    try {
      await beginPostAuthSync(sessionA as never);
      // Exactly one emission for the ready → local-fallback transition.
      expect(emissions).toBe(1);
    } finally {
      unsubscribe();
    }
  });

  it("cached branch does NOT emit when re-invoking the active owner with the same status", async () => {
    // No-op re-invoke (same user still owns global, same cached status)
    // must not spam subscribers with a redundant transition. Guards
    // against the fix over-emitting on every cached return.
    const sessionA = {
      user: { id: "auth-user-A", email: "a@example.com" },
      access_token: "tok-a",
      refresh_token: "ref-a",
    };

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: vi.fn(async () => ({
        kind: "ready",
        branch: "link-only",
      })),
      clearPostAuthSyncState: vi.fn(),
    }));

    setActiveProfile("student-1");
    const {
      beginPostAuthSync,
      subscribePostAuthSyncChange,
      resetPostAuthSyncStatusForTests,
    } = await import("../post-auth-sync");

    resetPostAuthSyncStatusForTests();

    // A completes → A owns global, status "ready".
    await beginPostAuthSync(sessionA as never);

    let emissions = 0;
    const unsubscribe = subscribePostAuthSyncChange(() => {
      emissions += 1;
    });

    try {
      // Re-invoke A: cached branch, owner is already A, status already
      // "ready" → no transition, no emission.
      await beginPostAuthSync(sessionA as never);
      expect(emissions).toBe(0);
    } finally {
      unsubscribe();
    }
  });
});

// ---------------------------------------------------------------------------
// Clear path
// ---------------------------------------------------------------------------
// After sign-in → sync → sign-out → sign-in (same user), the orchestrator
// must re-run. The clear path must reset BOTH the orchestrator's per-userId
// idempotency cache AND the status module's per-userId completed-set.

describe("beginPostAuthSync() clear path", () => {
  it("sign in → sync completes → clearPostAuthSyncStatus(userId) → same user sign in re-runs orchestrator", async () => {
    const mockOrchestrator = vi.fn(async () => ({
      kind: "ready" as const,
      branch: "link-only",
    }));

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: mockOrchestrator,
      clearPostAuthSyncState: vi.fn(),
    }));

    setActiveProfile("student-1");
    const { beginPostAuthSync, clearPostAuthSyncStatus, getPostAuthSyncStatus } =
      await import("../post-auth-sync");

    // First sign-in
    await beginPostAuthSync(SESSION as never);
    expect(mockOrchestrator).toHaveBeenCalledTimes(1);
    expect(getPostAuthSyncStatus()).toBe("ready");

    // Clear the per-userId state (simulating SIGNED_OUT)
    clearPostAuthSyncStatus(SESSION.user.id);

    // Second sign-in for the same user must re-run the orchestrator
    await beginPostAuthSync(SESSION as never);
    expect(mockOrchestrator).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------------------------
  // Stale in-flight status writes
  // -------------------------------------------------------------------------
  // If a sync is in flight for user A and we call clearPostAuthSyncStatus(A)
  // BEFORE A's promise resolves, the late resolution must NOT write to the
  // per-userId cache or to the global currentStatus. Otherwise a previous
  // sync could leak state across a SIGNED_OUT → SIGNED_IN cycle.

  it("clear while promise pending → old promise's late resolution does NOT overwrite status", async () => {
    let resolveA: (outcome: { kind: "local-fallback"; reason: string; branch: string }) => void = () =>
      undefined as never;
    const slowA = new Promise<{ kind: "local-fallback"; reason: string; branch: string }>(
      (resolve) => {
        resolveA = resolve;
      },
    );

    const mockOrchestrator = vi.fn((session: { user: { id: string } }) => {
      if (session.user.id === "auth-user-A") return slowA;
      return Promise.resolve({ kind: "ready" as const, branch: "link-only" });
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: mockOrchestrator,
      clearPostAuthSyncState: vi.fn(),
    }));

    setActiveProfile("student-1");
    const {
      beginPostAuthSync,
      clearPostAuthSyncStatus,
      getPostAuthSyncStatus,
      resetPostAuthSyncStatusForTests,
    } = await import("../post-auth-sync");

    resetPostAuthSyncStatusForTests();

    const sessionA = {
      user: { id: "auth-user-A", email: "a@example.com" },
      access_token: "tok-a",
      refresh_token: "ref-a",
    };
    const sessionB = {
      user: { id: "auth-user-B", email: "b@example.com" },
      access_token: "tok-b",
      refresh_token: "ref-b",
    };

    // Kick off A — do not await, A is still pending.
    const inflightA = beginPostAuthSync(sessionA as never);

    // Clear A while the orchestrator is still pending. clearPostAuthSyncStatus
    // resets the global currentStatus to "signed-out" so a stale in-flight
    // resolution cannot rewrite the post-clear snapshot.
    clearPostAuthSyncStatus("auth-user-A");
    expect(getPostAuthSyncStatus()).toBe("signed-out");

    // Now resolve A's orchestrator with local-fallback.
    resolveA({ kind: "local-fallback", reason: "profile-link-failed", branch: "link-only" });

    await inflightA;

    // currentStatus must NOT have been overwritten with A's stale result.
    // The token guard inside the in-flight write suppresses the late
    // resolution, and the clear itself pinned currentStatus to "signed-out".
    expect(getPostAuthSyncStatus()).toBe("signed-out");

    // A subsequent re-invocation must re-run the orchestrator.
    await beginPostAuthSync(sessionA as never);
    expect(mockOrchestrator).toHaveBeenCalledTimes(2);

    // And B (a different user) must still get a clean independent cycle.
    const resultB = await beginPostAuthSync(sessionB as never);
    expect(resultB).toBe("ready");
    expect(getPostAuthSyncStatus()).toBe("ready");
  });
});

// ---------------------------------------------------------------------------
// Public status reset on clear
// ---------------------------------------------------------------------------
// After a completed sync (e.g. status = "ready" or "local-fallback"),
// clearPostAuthSyncStatus(userId) must reset the GLOBAL currentStatus
// snapshot to "signed-out". Otherwise callers of getPostAuthSyncStatus()
// see the stale "ready"/"local-fallback" value after sign-out and
// cannot tell that the auth session is gone. The documented safe
// non-ready state for a cleared user is "signed-out".

describe("clearPostAuthSyncStatus() resets global currentStatus to 'signed-out'", () => {
  it("after a completed 'ready' sync → clearPostAuthSyncStatus(userId) → getPostAuthSyncStatus() returns 'signed-out'", async () => {
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: vi.fn(async () => ({
        kind: "ready",
        branch: "link-only",
      })),
      clearPostAuthSyncState: vi.fn(),
    }));

    setActiveProfile("student-1");
    const {
      beginPostAuthSync,
      clearPostAuthSyncStatus,
      getPostAuthSyncStatus,
    } = await import("../post-auth-sync");

    // Sync completes → status "ready".
    await beginPostAuthSync(SESSION as never);
    expect(getPostAuthSyncStatus()).toBe("ready");

    // Clear (simulating SIGNED_OUT) → status must be the documented safe
    // non-ready state, NOT the stale "ready" snapshot.
    clearPostAuthSyncStatus(SESSION.user.id);
    expect(getPostAuthSyncStatus()).toBe("signed-out");
  });

  it("after a completed 'local-fallback' sync → clearPostAuthSyncStatus(userId) → getPostAuthSyncStatus() returns 'signed-out'", async () => {
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: vi.fn(async () => ({
        kind: "local-fallback",
        reason: "profile-link-failed",
        branch: "link-only",
      })),
      clearPostAuthSyncState: vi.fn(),
    }));

    setActiveProfile("student-1");
    const {
      beginPostAuthSync,
      clearPostAuthSyncStatus,
      getPostAuthSyncStatus,
    } = await import("../post-auth-sync");

    // Sync completes with local-fallback.
    await beginPostAuthSync(SESSION as never);
    expect(getPostAuthSyncStatus()).toBe("local-fallback");

    // Clear (simulating SIGNED_OUT) → status must reset to "signed-out",
    // not stay stuck at "local-fallback".
    clearPostAuthSyncStatus(SESSION.user.id);
    expect(getPostAuthSyncStatus()).toBe("signed-out");
  });

  it("two users: A completes 'ready', B completes 'local-fallback', then clear A → getPostAuthSyncStatus() returns 'signed-out'", async () => {
    // Verify the reset is consistent regardless of which user is the
    // most-recently completed. After clear(A), currentStatus must reflect
    // "no active session", not B's last result.
    const sessionA = {
      user: { id: "auth-user-A", email: "a@example.com" },
      access_token: "tok-a",
      refresh_token: "ref-a",
    };
    const sessionB = {
      user: { id: "auth-user-B", email: "b@example.com" },
      access_token: "tok-b",
      refresh_token: "ref-b",
    };

    const mockOrchestrator = vi.fn((session: { user: { id: string } }) => {
      if (session.user.id === "auth-user-A") {
        return Promise.resolve({ kind: "ready" as const, branch: "link-only" });
      }
      return Promise.resolve({
        kind: "local-fallback" as const,
        reason: "import-failed",
        branch: "link-and-import",
      });
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: mockOrchestrator,
      clearPostAuthSyncState: vi.fn(),
    }));

    setActiveProfile("student-1");
    const {
      beginPostAuthSync,
      clearPostAuthSyncStatus,
      getPostAuthSyncStatus,
      resetPostAuthSyncStatusForTests,
    } = await import("../post-auth-sync");

    resetPostAuthSyncStatusForTests();

    await beginPostAuthSync(sessionA as never);
    expect(getPostAuthSyncStatus()).toBe("ready");

    await beginPostAuthSync(sessionB as never);
    expect(getPostAuthSyncStatus()).toBe("local-fallback");

    // Clear A — currentStatus must reset to "signed-out", not stay at
    // B's "local-fallback" snapshot.
    clearPostAuthSyncStatus("auth-user-A");
    expect(getPostAuthSyncStatus()).toBe("signed-out");
  });
});

// ---------------------------------------------------------------------------
// Outcome → status translation
// ---------------------------------------------------------------------------
// The status module must translate the orchestrator's `LinkImportOutcome`
// into the public `PostAuthSyncStatus`. If the orchestrator reports
// `local-fallback`, the status must reflect that — never falsely "ready".

describe("beginPostAuthSync() outcome → status mapping", () => {
  it("orchestrator returns {kind:'ready'} → status is 'ready'", async () => {
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: vi.fn(async () => ({
        kind: "ready",
        branch: "link-only",
      })),
    }));

    setActiveProfile("student-1");
    const { beginPostAuthSync, getPostAuthSyncStatus } = await import(
      "../post-auth-sync"
    );

    const result = await beginPostAuthSync(SESSION as never);
    expect(result).toBe("ready");
    expect(getPostAuthSyncStatus()).toBe("ready");
  });

  it("orchestrator returns {kind:'local-fallback', reason:'profile-link-failed'} → status is 'local-fallback'", async () => {
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: vi.fn(async () => ({
        kind: "local-fallback",
        reason: "profile-link-failed",
        branch: "link-only",
      })),
    }));

    setActiveProfile("student-1");
    const { beginPostAuthSync, getPostAuthSyncStatus } = await import(
      "../post-auth-sync"
    );

    const result = await beginPostAuthSync(SESSION as never);
    expect(result).toBe("local-fallback");
    expect(getPostAuthSyncStatus()).toBe("local-fallback");
  });

  it("orchestrator returns {kind:'local-fallback', reason:'import-failed'} → status is 'local-fallback'", async () => {
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: vi.fn(async () => ({
        kind: "local-fallback",
        reason: "import-failed",
        branch: "link-and-import",
      })),
    }));

    setActiveProfile("student-1");
    const { beginPostAuthSync, getPostAuthSyncStatus } = await import(
      "../post-auth-sync"
    );

    const result = await beginPostAuthSync(SESSION as never);
    expect(result).toBe("local-fallback");
    expect(getPostAuthSyncStatus()).toBe("local-fallback");
  });

  it("orchestrator returns {kind:'local-fallback', reason:'import-partial', partialFields:['progress']} → status is 'local-fallback'", async () => {
    // Partial import (progress wrote, diagnostic/study-plan failed)
    // MUST surface as local-fallback, NOT ready. Otherwise the
    // post-auth status would falsely report "ready" while local
    // diagnostic and study-plan data is hidden behind a remote null
    // row, destroying the user's learning evidence on the next remote
    // read. partialFields is preserved on the outcome for observability.
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => makeSupabaseClient(),
    }));
    vi.doMock("../link-and-import", () => ({
      linkAndImportLocalProgress: vi.fn(async () => ({
        kind: "local-fallback",
        reason: "import-partial",
        branch: "link-and-import",
        partialFields: ["progress"],
      })),
    }));

    setActiveProfile("student-1");
    const { beginPostAuthSync, getPostAuthSyncStatus } = await import(
      "../post-auth-sync"
    );

    const result = await beginPostAuthSync(SESSION as never);
    expect(result).toBe("local-fallback");
    expect(getPostAuthSyncStatus()).toBe("local-fallback");
  });
});
