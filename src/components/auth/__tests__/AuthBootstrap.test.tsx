/**
 * AuthBootstrap — behavior tests.
 *
 * These tests mount the real component in a happy-dom environment so the
 * `useEffect` actually runs and registers a listener with `onAuthStateChange`.
 * The Supabase auth listener is mocked so tests can capture the registered
 * callback and dispatch auth events (`SIGNED_IN`, `INITIAL_SESSION`,
 * `SIGNED_OUT`, ignored events). Behavior is verified purely through
 * observable calls to the mocked downstream modules (`beginPostAuthSync`,
 * `reinitializePersistence`, `resetPersistenceToLocal`,
 * `clearPostAuthSyncStatus`) — not by reading the source file or
 * matching regex/textual ordering.
 *
 * Coverage:
 * - SIGNED_IN / INITIAL_SESSION → `beginPostAuthSync(session)` runs first,
 *   is awaited, then `reinitializePersistence()` runs (FK row must exist
 *   before the selector flips to the remote adapter).
 * - SIGNED_OUT → `clearPostAuthSyncStatus(lastUserId)` then
 *   `resetPersistenceToLocal()` (session-blind local reset, never the
 *   session-reading `reinitializePersistence()` which would race a
 *   concurrent sign-in); never invokes the sync orchestrator.
 * - The userId captured at SIGNED_IN / INITIAL_SESSION is forwarded to the
 *   clear at SIGNED_OUT so the per-userId post-auth sync state is reset for
 *   the next sign-in of the same user.
 * - Non-relevant events (`TOKEN_REFRESHED`, `PASSWORD_RECOVERY`, etc.) do not
 *   trigger sync, reinit, or clear.
 * - Mounting renders nothing (empty subtree) — confirms side-effect-only
 *   component contract.
 * - Strict-mode-style unmount unsubscribes the listener handle exactly once.
 *
 * Spec: REQ-AUTH-3, REQ-NEW-2a, REQ-NEW-2b, REQ-NEW-2c, REQ-NEW-ARCH-1.
 */

// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";

import { AuthBootstrap } from "@/components/auth/AuthBootstrap";

// ---------------------------------------------------------------------------
// Mocks — capture the listener registered by the component and observe
// downstream module calls. vi.hoisted keeps the mock fns and shared state
// reachable from inside the hoisted vi.mock factories (which run before any
// import).
// ---------------------------------------------------------------------------

type AuthListener = ((event: string, session: Session | null) => void) & {
  /**
   * Latest deferred post-auth promise exposed by the synchronous
   * Supabase callback (see `createDeferredAuthStateCallback`). Production
   * never reads this; the test harness awaits it before asserting on
   * downstream side effects.
   */
  readonly __deferred?: Promise<void> | null;
};

const state = vi.hoisted(() => ({
  /** Listener registered by AuthBootstrap on mount. Reset per test. */
  registeredListener: null as AuthListener | null,
  /** Unsubscribe spy handed back in the auth handle. Reset per test. */
  unsubscribeSpy: (() => undefined) as ReturnType<typeof vi.fn>,
  /**
   * Ordered log of downstream calls recorded inside each mock impl.
   * Decouples ordering assertions from vitest's internal invocation counter
   * (which `vi.clearAllMocks()` wipes between tests). Reset per test.
   */
  callOrder: [] as string[],
}));

const mocks = vi.hoisted(() => {
  const onAuthStateChange = vi.fn((cb: AuthListener) => {
    state.registeredListener = cb;
    return { unsubscribe: state.unsubscribeSpy };
  });
  const beginPostAuthSync = vi.fn(async (_session: Session): Promise<void> => {
    state.callOrder.push("beginPostAuthSync");
  });
  const reinitializePersistence = vi.fn(async (): Promise<void> => {
    state.callOrder.push("reinitializePersistence");
  });
  const resetPersistenceToLocal = vi.fn(async (): Promise<void> => {
    state.callOrder.push("resetPersistenceToLocal");
  });
  const clearPostAuthSyncStatus = vi.fn((_userId: string): void => {
    state.callOrder.push("clearPostAuthSyncStatus");
  });
  return {
    onAuthStateChange,
    beginPostAuthSync,
    reinitializePersistence,
    resetPersistenceToLocal,
    clearPostAuthSyncStatus,
  };
});

const {
  onAuthStateChange: onAuthStateChangeMock,
  beginPostAuthSync: beginPostAuthSyncMock,
  reinitializePersistence: reinitializePersistenceMock,
  resetPersistenceToLocal: resetPersistenceToLocalMock,
  clearPostAuthSyncStatus: clearPostAuthSyncStatusMock,
} = mocks;

vi.mock("@/lib/supabase/auth", () => ({
  onAuthStateChange: mocks.onAuthStateChange,
}));

vi.mock("@/lib/persistence/adapter-config", () => ({
  beginPostAuthSync: mocks.beginPostAuthSync,
  reinitializePersistence: mocks.reinitializePersistence,
  resetPersistenceToLocal: mocks.resetPersistenceToLocal,
}));

vi.mock("@/lib/auth/post-auth-sync", () => ({
  clearPostAuthSyncStatus: mocks.clearPostAuthSyncStatus,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSession(userId: string): Session {
  // Minimal `Session` shape — only the fields the component reads are real;
  // the rest are stubbed to satisfy the type without coupling the test to
  // the SDK internals.
  return {
    access_token: `access-${userId}`,
    refresh_token: `refresh-${userId}`,
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: userId,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00.000Z",
    } as Session["user"],
  } as Session;
}

// ---------------------------------------------------------------------------
// Mount harness — fires the component effect so the listener is captured.
// ---------------------------------------------------------------------------

function mount(target: HTMLElement): Root {
  const root = createRoot(target);
  act(() => {
    root.render(<AuthBootstrap />);
  });
  return root;
}

function unmount(root: Root): void {
  act(() => {
    root.unmount();
  });
}

/**
 * Dispatch an auth event through the registered listener and flush the
 * deferred post-auth sync. Returns a promise that resolves once the
 * deferred post-auth body has settled, so callers can await the
 * awaited downstream calls before asserting.
 *
 * After the post-auth-defer fix, the Supabase listener returns
 * synchronously (void) and the async post-auth sync runs in a
 * microtask; the deferred promise is exposed as `__deferred` on the
 * listener. `dispatch` invokes the listener, then awaits that deferred
 * promise so existing tests can assert on `beginPostAuthSync` /
 * `reinitializePersistence` / `resetPersistenceToLocal` having actually
 * run, without having to await explicit microtask flushes themselves.
 */
function dispatch(event: string, session: Session | null): Promise<void> {
  const listener = state.registeredListener;
  if (!listener) {
    throw new Error("AuthBootstrap did not register an auth listener on mount");
  }
  // Synchronous listener call: it captures event+session and stashes
  // the deferred post-auth promise on `__deferred`.
  listener(event, session);
  const deferred = listener.__deferred ?? Promise.resolve();
  return Promise.resolve(deferred);
}

function resetListenerState(): void {
  state.registeredListener = null;
  state.unsubscribeSpy = vi.fn();
  state.callOrder = [];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AuthBootstrap — mount contract", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    resetListenerState();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = mount(container);
  });

  afterEach(() => {
    unmount(root);
    container.remove();
  });

  it("registers exactly one auth listener via onAuthStateChange on mount", () => {
    expect(onAuthStateChangeMock).toHaveBeenCalledTimes(1);
    expect(state.registeredListener).not.toBeNull();
  });

  it("renders nothing (empty subtree) — side-effect-only component", () => {
    expect(container.innerHTML).toBe("");
  });
});

describe("AuthBootstrap — SIGNED_IN flow", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    resetListenerState();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = mount(container);
  });

  afterEach(() => {
    unmount(root);
    container.remove();
  });

  it("runs beginPostAuthSync THEN reinitializePersistence with the session", async () => {
    const session = makeSession("user-123");
    await act(async () => {
      await dispatch("SIGNED_IN", session);
    });

    expect(beginPostAuthSyncMock).toHaveBeenCalledTimes(1);
    expect(beginPostAuthSyncMock).toHaveBeenCalledWith(session);
    expect(reinitializePersistenceMock).toHaveBeenCalledTimes(1);
  });

  it("awaits beginPostAuthSync before reinitializePersistence (FK-before-flip)", async () => {
    const session = makeSession("user-456");

    let resolveSync: () => void = () => {};
    beginPostAuthSyncMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          state.callOrder.push("beginPostAuthSync");
          resolveSync = resolve;
        })
    );

    await act(async () => {
      const pending = dispatch("SIGNED_IN", session);
      // Yield once so the listener body reaches the first await.
      await Promise.resolve();
      // Sync is in flight and blocking reinit — neither must have advanced.
      expect(beginPostAuthSyncMock).toHaveBeenCalledTimes(1);
      expect(reinitializePersistenceMock).not.toHaveBeenCalled();

      resolveSync();
      await pending;
    });

    // After the sync resolves, reinit runs exactly once.
    expect(reinitializePersistenceMock).toHaveBeenCalledTimes(1);

    // Observed call order proves the sync call happened before reinit.
    expect(state.callOrder).toEqual(["beginPostAuthSync", "reinitializePersistence"]);
  });

  it("does not invoke the sync orchestrator when session is null", async () => {
    await act(async () => {
      await dispatch("SIGNED_IN", null);
    });

    // No session to sync on — the sync orchestrator must not run.
    expect(beginPostAuthSyncMock).not.toHaveBeenCalled();
    // A null session is a stale/no-session tail: it must NOT call the
    // session-reading reinitializePersistence (which could observe a
    // concurrent SIGNED_IN B and select remote for B before B's readiness).
    // It uses the session-blind local reset instead — same path as
    // SIGNED_OUT.
    expect(reinitializePersistenceMock).not.toHaveBeenCalled();
    expect(resetPersistenceToLocalMock).toHaveBeenCalledTimes(1);
  });
});

describe("AuthBootstrap — INITIAL_SESSION flow", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    resetListenerState();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = mount(container);
  });

  afterEach(() => {
    unmount(root);
    container.remove();
  });

  it("handles INITIAL_SESSION like SIGNED_IN (beginPostAuthSync then reinit)", async () => {
    const session = makeSession("user-initial");
    await act(async () => {
      await dispatch("INITIAL_SESSION", session);
    });

    expect(beginPostAuthSyncMock).toHaveBeenCalledTimes(1);
    expect(beginPostAuthSyncMock).toHaveBeenCalledWith(session);
    expect(reinitializePersistenceMock).toHaveBeenCalledTimes(1);
  });

  it("captures userId from INITIAL_SESSION for the SIGNED_OUT clear", async () => {
    await act(async () => {
      await dispatch("INITIAL_SESSION", makeSession("user-initial-cap"));
    });
    vi.clearAllMocks();

    await act(async () => {
      await dispatch("SIGNED_OUT", null);
    });

    expect(clearPostAuthSyncStatusMock).toHaveBeenCalledWith("user-initial-cap");
  });
});

describe("AuthBootstrap — SIGNED_OUT flow", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    resetListenerState();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = mount(container);
  });

  afterEach(() => {
    unmount(root);
    container.remove();
  });

  it("clears the previously captured userId and resets persistence to local", async () => {
    // Establish a signed-in user so the component captures its userId.
    await act(async () => {
      await dispatch("SIGNED_IN", makeSession("user-789"));
    });
    vi.clearAllMocks();

    await act(async () => {
      await dispatch("SIGNED_OUT", null);
    });

    expect(clearPostAuthSyncStatusMock).toHaveBeenCalledTimes(1);
    expect(clearPostAuthSyncStatusMock).toHaveBeenCalledWith("user-789");
    // SIGNED_OUT uses the session-blind local reset (race safety);
    // the session-reading reinit must NOT fire on SIGNED_OUT.
    expect(resetPersistenceToLocalMock).toHaveBeenCalledTimes(1);
    expect(reinitializePersistenceMock).not.toHaveBeenCalled();
  });

  it("runs clearPostAuthSyncStatus before resetPersistenceToLocal (clear-then-local)", async () => {
    await act(async () => {
      await dispatch("SIGNED_IN", makeSession("user-clear-order"));
    });
    vi.clearAllMocks();
    state.callOrder = [];

    await act(async () => {
      await dispatch("SIGNED_OUT", null);
    });

    expect(clearPostAuthSyncStatusMock).toHaveBeenCalledTimes(1);
    expect(resetPersistenceToLocalMock).toHaveBeenCalledTimes(1);
    expect(state.callOrder).toEqual([
      "clearPostAuthSyncStatus",
      "resetPersistenceToLocal",
    ]);
  });

  it("never invokes the sync orchestrator on SIGNED_OUT", async () => {
    await act(async () => {
      await dispatch("SIGNED_IN", makeSession("user-no-sync-on-signout"));
    });
    vi.clearAllMocks();

    await act(async () => {
      await dispatch("SIGNED_OUT", null);
    });

    expect(beginPostAuthSyncMock).not.toHaveBeenCalled();
  });

  it("does not call clearPostAuthSyncStatus when no userId was captured", async () => {
    // SIGNED_OUT with no prior SIGNED_IN → lastUserId is null → no clear.
    await act(async () => {
      await dispatch("SIGNED_OUT", null);
    });

    expect(clearPostAuthSyncStatusMock).not.toHaveBeenCalled();
    // The session-blind local reset still runs so the adapter resets
    // to local even with no prior sign-in.
    expect(resetPersistenceToLocalMock).toHaveBeenCalledTimes(1);
    expect(reinitializePersistenceMock).not.toHaveBeenCalled();
  });
});

describe("AuthBootstrap — non-relevant events", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    resetListenerState();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = mount(container);
  });

  afterEach(() => {
    unmount(root);
    container.remove();
  });

  it("ignores TOKEN_REFRESHED (no sync, reinit, or clear)", async () => {
    await act(async () => {
      await dispatch("TOKEN_REFRESHED", makeSession("user-refresh"));
    });

    expect(beginPostAuthSyncMock).not.toHaveBeenCalled();
    expect(reinitializePersistenceMock).not.toHaveBeenCalled();
    expect(clearPostAuthSyncStatusMock).not.toHaveBeenCalled();
  });

  it("ignores PASSWORD_RECOVERY (no sync, reinit, or clear)", async () => {
    await act(async () => {
      await dispatch("PASSWORD_RECOVERY", makeSession("user-recovery"));
    });

    expect(beginPostAuthSyncMock).not.toHaveBeenCalled();
    expect(reinitializePersistenceMock).not.toHaveBeenCalled();
    expect(clearPostAuthSyncStatusMock).not.toHaveBeenCalled();
  });

  it("does not accumulate sync side effects across ignored events", async () => {
    await act(async () => {
      await dispatch("TOKEN_REFRESHED", makeSession("u1"));
      await dispatch("PASSWORD_RECOVERY", makeSession("u1"));
    });

    expect(beginPostAuthSyncMock).not.toHaveBeenCalled();
    expect(reinitializePersistenceMock).not.toHaveBeenCalled();
    expect(clearPostAuthSyncStatusMock).not.toHaveBeenCalled();
  });
});

describe("AuthBootstrap — unsubscribe on unmount (Strict Mode safe)", () => {
  it("calls unsubscribe exactly once when the component unmounts", () => {
    vi.clearAllMocks();
    resetListenerState();

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = mount(container);

    expect(state.unsubscribeSpy).not.toHaveBeenCalled();

    unmount(root);
    expect(state.unsubscribeSpy).toHaveBeenCalledTimes(1);

    container.remove();
  });
});
