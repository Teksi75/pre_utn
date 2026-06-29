/**
 * AuthBootstrap — behavior tests.
 *
 * These tests mount the real component in a happy-dom environment so the
 * `useEffect` actually runs and registers a listener with `onAuthStateChange`.
 * The Supabase auth listener is mocked so tests can capture the registered
 * callback and dispatch auth events (`SIGNED_IN`, `SIGNED_OUT`, ignored
 * events). Behavior is verified purely through observable calls to the
 * mocked downstream modules (`linkAndImportLocalProgress`,
 * `reinitializePersistence`, `clearPostAuthSyncStatus`) — not by reading the
 * source file or matching regex/textual ordering.
 *
 * Coverage:
 * - SIGNED_IN → `linkAndImportLocalProgress(session)` runs first, is awaited,
 *   then `reinitializePersistence()` runs (FK row must exist before the
 *   selector flips to the remote adapter).
 * - SIGNED_OUT → `clearPostAuthSyncStatus(lastUserId)` then
 *   `reinitializePersistence()`; never invokes the import orchestrator.
 * - The userId captured at SIGNED_IN is forwarded to the clear at SIGNED_OUT
 *   so the per-userId post-auth sync state is reset for the next sign-in of
 *   the same user.
 * - Non-relevant events (`TOKEN_REFRESHED`, `INITIAL_SESSION`, etc.) do not
 *   trigger sync, import, reinit, or clear.
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

type AuthListener = (
  event: string,
  session: Session | null
) => void | Promise<void>;

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
  const linkAndImport = vi.fn(async (_session: Session): Promise<void> => {
    state.callOrder.push("linkAndImport");
  });
  const reinitializePersistence = vi.fn(async (): Promise<void> => {
    state.callOrder.push("reinitializePersistence");
  });
  const clearPostAuthSyncStatus = vi.fn((_userId: string): void => {
    state.callOrder.push("clearPostAuthSyncStatus");
  });
  return {
    onAuthStateChange,
    linkAndImport,
    reinitializePersistence,
    clearPostAuthSyncStatus,
  };
});

const {
  onAuthStateChange: onAuthStateChangeMock,
  linkAndImport: linkAndImportMock,
  reinitializePersistence: reinitializePersistenceMock,
  clearPostAuthSyncStatus: clearPostAuthSyncStatusMock,
} = mocks;

vi.mock("@/lib/supabase/auth", () => ({
  onAuthStateChange: mocks.onAuthStateChange,
}));

vi.mock("@/lib/persistence/adapter-config", () => ({
  reinitializePersistence: mocks.reinitializePersistence,
}));

vi.mock("@/lib/auth/link-and-import", () => ({
  linkAndImportLocalProgress: mocks.linkAndImport,
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
  // SDK internals.
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
 * async branch the component awaits. Returns the listener's promise so the
 * caller can await ordering deterministically.
 */
function dispatch(event: string, session: Session | null): Promise<void> {
  const listener = state.registeredListener;
  if (!listener) {
    throw new Error("AuthBootstrap did not register an auth listener on mount");
  }
  const result = listener(event, session);
  // The listener is `async`; normalize to a promise so callers can await
  // the awaited downstream calls before asserting.
  return Promise.resolve(result as Promise<void>);
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

  it("runs linkAndImportLocalProgress THEN reinitializePersistence with the session", async () => {
    const session = makeSession("user-123");
    await act(async () => {
      await dispatch("SIGNED_IN", session);
    });

    expect(linkAndImportMock).toHaveBeenCalledTimes(1);
    expect(linkAndImportMock).toHaveBeenCalledWith(session);
    expect(reinitializePersistenceMock).toHaveBeenCalledTimes(1);
  });

  it("awaits linkAndImportLocalProgress before reinitializePersistence (FK-before-flip)", async () => {
    const session = makeSession("user-456");

    let resolveImport: () => void = () => {};
    linkAndImportMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          state.callOrder.push("linkAndImport");
          resolveImport = resolve;
        })
    );

    await act(async () => {
      const pending = dispatch("SIGNED_IN", session);
      // Yield once so the listener body reaches the first await.
      await Promise.resolve();
      // Import is in flight and blocking reinit — neither must have advanced.
      expect(linkAndImportMock).toHaveBeenCalledTimes(1);
      expect(reinitializePersistenceMock).not.toHaveBeenCalled();

      resolveImport();
      await pending;
    });

    // After the import resolves, reinit runs exactly once.
    expect(reinitializePersistenceMock).toHaveBeenCalledTimes(1);

    // Observed call order proves the import call happened before reinit.
    expect(state.callOrder).toEqual(["linkAndImport", "reinitializePersistence"]);
  });

  it("does not invoke the import orchestrator when session is null", async () => {
    await act(async () => {
      await dispatch("SIGNED_IN", null);
    });

    // No session to link/import on; reinitializePersistence still fires to
    // keep the selector consistent with the bootstrap contract.
    expect(linkAndImportMock).not.toHaveBeenCalled();
    expect(reinitializePersistenceMock).toHaveBeenCalledTimes(1);
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

  it("clears the previously captured userId and reinitializes persistence", async () => {
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
    expect(reinitializePersistenceMock).toHaveBeenCalledTimes(1);
  });

  it("runs clearPostAuthSyncStatus before reinitializePersistence (clear-then-reinit)", async () => {
    await act(async () => {
      await dispatch("SIGNED_IN", makeSession("user-clear-order"));
    });
    vi.clearAllMocks();
    state.callOrder = [];

    await act(async () => {
      await dispatch("SIGNED_OUT", null);
    });

    expect(clearPostAuthSyncStatusMock).toHaveBeenCalledTimes(1);
    expect(reinitializePersistenceMock).toHaveBeenCalledTimes(1);
    expect(state.callOrder).toEqual([
      "clearPostAuthSyncStatus",
      "reinitializePersistence",
    ]);
  });

  it("never invokes the import orchestrator on SIGNED_OUT", async () => {
    await act(async () => {
      await dispatch("SIGNED_IN", makeSession("user-no-import-on-signout"));
    });
    vi.clearAllMocks();

    await act(async () => {
      await dispatch("SIGNED_OUT", null);
    });

    expect(linkAndImportMock).not.toHaveBeenCalled();
  });

  it("does not call clearPostAuthSyncStatus when no userId was captured", async () => {
    // SIGNED_OUT with no prior SIGNED_IN → lastUserId is null → no clear.
    await act(async () => {
      await dispatch("SIGNED_OUT", null);
    });

    expect(clearPostAuthSyncStatusMock).not.toHaveBeenCalled();
    // Reinit still runs so the selector resets to the local adapter.
    expect(reinitializePersistenceMock).toHaveBeenCalledTimes(1);
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

  it("ignores TOKEN_REFRESHED (no sync, import, reinit, or clear)", async () => {
    await act(async () => {
      await dispatch("TOKEN_REFRESHED", makeSession("user-refresh"));
    });

    expect(linkAndImportMock).not.toHaveBeenCalled();
    expect(reinitializePersistenceMock).not.toHaveBeenCalled();
    expect(clearPostAuthSyncStatusMock).not.toHaveBeenCalled();
  });

  it("ignores INITIAL_SESSION (no sync, import, reinit, or clear)", async () => {
    await act(async () => {
      await dispatch("INITIAL_SESSION", makeSession("user-initial"));
    });

    expect(linkAndImportMock).not.toHaveBeenCalled();
    expect(reinitializePersistenceMock).not.toHaveBeenCalled();
    expect(clearPostAuthSyncStatusMock).not.toHaveBeenCalled();
  });

  it("ignores PASSWORD_RECOVERY (no sync, import, reinit, or clear)", async () => {
    await act(async () => {
      await dispatch("PASSWORD_RECOVERY", makeSession("user-recovery"));
    });

    expect(linkAndImportMock).not.toHaveBeenCalled();
    expect(reinitializePersistenceMock).not.toHaveBeenCalled();
    expect(clearPostAuthSyncStatusMock).not.toHaveBeenCalled();
  });

  it("does not accumulate sync side effects across ignored events", async () => {
    await act(async () => {
      await dispatch("INITIAL_SESSION", makeSession("u1"));
      await dispatch("TOKEN_REFRESHED", makeSession("u1"));
    });

    expect(linkAndImportMock).not.toHaveBeenCalled();
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