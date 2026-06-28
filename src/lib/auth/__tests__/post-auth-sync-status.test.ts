/**
 * Tests for src/lib/auth/post-auth-sync.ts — PostAuthSyncStatus state machine.
 *
 * The status module is the public surface AuthBootstrap (PR2) reads to know
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