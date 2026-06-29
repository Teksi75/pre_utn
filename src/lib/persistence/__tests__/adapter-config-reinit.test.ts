/**
 * Tests for reinitializePersistence() in src/lib/persistence/adapter-config.ts
 *
 * Verifies that reinitializePersistence:
 * - resets the configured adapter
 * - re-runs selection against the current state
 * - configures remote adapter when env vars + session are present
 * - leaves adapter null when env vars are missing (local fallback)
 * - leaves adapter null when session is missing (local fallback)
 * - preserves the onFallback sink from options
 * - is safe to call repeatedly
 *
 * Spec: REQ-AUTH-3 — "AuthBootstrap MUST subscribe to onAuthStateChange;
 * on SIGNED_IN it MUST call linkActiveProfileToAuthUser() then
 * reinitializePersistence(); on SIGNED_OUT it MUST call
 * reinitializePersistence(). reinitializePersistence() MUST reset the
 * configured adapter and re-run selection."
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PROFILES_STORAGE_KEY } from "../../student-profile-storage";

// ---------------------------------------------------------------------------
// localStorage mock
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

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  localStorageMock.clear();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.restoreAllMocks();
});

function setActiveProfile(studentId: string): void {
  localStorageMock.setItem(
    PROFILES_STORAGE_KEY,
    JSON.stringify({
      profiles: [
        {
          studentId,
          displayName: "Test Student",
          createdAt: "2025-01-01T00:00:00.000Z",
          lastActiveAt: "2025-01-01T00:00:00.000Z",
        },
      ],
      activeStudentId: studentId,
    })
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSupabaseClient(session: unknown) {
  return {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
        })),
      })),
    })),
  };
}

async function loadModule() {
  return import("../adapter-config");
}

// ---------------------------------------------------------------------------
// RED tests
// ---------------------------------------------------------------------------

describe("reinitializePersistence()", () => {
  it("configures remote adapter when env vars + active session are present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const mockClient = makeSupabaseClient({ user: { id: "auth-user-1" } });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student");

    const { reinitializePersistence, getConfiguredAdapter, resetPersistenceAdapter } =
      await loadModule();

    await reinitializePersistence();

    expect(getConfiguredAdapter()).not.toBeNull();

    resetPersistenceAdapter();
    vi.doUnmock("../../supabase/browser");
  });

  it("leaves adapter null when env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    setActiveProfile("local-student");

    const { reinitializePersistence, getConfiguredAdapter, resetPersistenceAdapter } =
      await loadModule();

    await reinitializePersistence();

    expect(getConfiguredAdapter()).toBeNull();

    resetPersistenceAdapter();
  });

  it("leaves adapter null when session is missing (signed out)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const mockClient = makeSupabaseClient(null);

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student");

    const { reinitializePersistence, getConfiguredAdapter, resetPersistenceAdapter } =
      await loadModule();

    await reinitializePersistence();

    expect(getConfiguredAdapter()).toBeNull();

    resetPersistenceAdapter();
    vi.doUnmock("../../supabase/browser");
  });

  it("resets a previously configured adapter before re-running selection", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const mockClient = makeSupabaseClient(null);

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student");

    const {
      reinitializePersistence,
      configurePersistenceAdapter,
      getConfiguredAdapter,
      resetPersistenceAdapter,
    } = await loadModule();

    // First, configure a fake adapter as if a prior run had succeeded.
    const fakeAdapter = { _id: "fake-remote-adapter" } as never;
    configurePersistenceAdapter(fakeAdapter);
    expect(getConfiguredAdapter()).toBe(fakeAdapter);

    // Now reinitialize with no session — adapter must be cleared.
    await reinitializePersistence();
    expect(getConfiguredAdapter()).toBeNull();

    resetPersistenceAdapter();
    vi.doUnmock("../../supabase/browser");
  });

  it("switches from local to remote when called after a fresh sign-in (state change)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    // First call: no session.
    const clientNoSession = makeSupabaseClient(null);
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => clientNoSession,
    }));

    setActiveProfile("local-student");

    const {
      reinitializePersistence: reinit1,
      getConfiguredAdapter: getAdapter1,
      resetPersistenceAdapter: reset1,
    } = await loadModule();

    await reinit1();
    expect(getAdapter1()).toBeNull();
    reset1();
    vi.doUnmock("../../supabase/browser");

    // Simulate sign-in: session now exists. Reset modules so the new
    // mock factory is applied to a fresh module import.
    vi.resetModules();
    const clientWithSession = makeSupabaseClient({ user: { id: "u1" } });
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => clientWithSession,
    }));

    const {
      reinitializePersistence: reinit2,
      getConfiguredAdapter: getAdapter2,
      resetPersistenceAdapter: reset2,
    } = await loadModule();

    await reinit2();
    expect(getAdapter2()).not.toBeNull();

    reset2();
    vi.doUnmock("../../supabase/browser");
  });

  it("switches from remote back to local when called after sign-out", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const clientWithSession = makeSupabaseClient({ user: { id: "u1" } });
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => clientWithSession,
    }));

    setActiveProfile("local-student");

    const {
      reinitializePersistence: reinit1,
      getConfiguredAdapter: getAdapter1,
      resetPersistenceAdapter: reset1,
    } = await loadModule();

    await reinit1();
    expect(getAdapter1()).not.toBeNull();
    reset1();
    vi.doUnmock("../../supabase/browser");

    // Now sign out → no session. Reset modules so the new mock applies.
    vi.resetModules();
    const clientSignedOut = makeSupabaseClient(null);
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => clientSignedOut,
    }));

    const {
      reinitializePersistence: reinit2,
      getConfiguredAdapter: getAdapter2,
      resetPersistenceAdapter: reset2,
    } = await loadModule();

    await reinit2();
    expect(getAdapter2()).toBeNull();

    reset2();
    vi.doUnmock("../../supabase/browser");
  });

  it("passes the options.onFallback sink through to the selector", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const mockClient = makeSupabaseClient({ user: { id: "u1" } });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student");

    const { reinitializePersistence, resetPersistenceAdapter } = await loadModule();

    const sink = vi.fn();
    // Must not throw when options is passed.
    await reinitializePersistence({ onFallback: sink });

    resetPersistenceAdapter();
    vi.doUnmock("../../supabase/browser");
  });

  it("does not throw when called repeatedly", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const mockClient = makeSupabaseClient({ user: { id: "u1" } });
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student");

    const { reinitializePersistence, resetPersistenceAdapter } = await loadModule();

    await expect(
      (async () => {
        await reinitializePersistence();
        await reinitializePersistence();
        await reinitializePersistence();
      })()
    ).resolves.toBeUndefined();

    resetPersistenceAdapter();
    vi.doUnmock("../../supabase/browser");
  });

  it("is exported from the persistence barrel", async () => {
    const barrel = await import("../index");
    expect(typeof barrel.reinitializePersistence).toBe("function");
  });

  it("does not select remote when expectedUserId does not match the live session user (identity-aware guard)", async () => {
    // Guard-passes-then-flip race, selector side.
    // The caller (PersistenceInitializer / AuthBootstrap) captured user A
    // and forwarded expectedUserId="user-A". Auth flipped to B before the
    // selector's own client.auth.getSession() read. The selector MUST NOT
    // select remote for B — that would let a stale A run flip persistence
    // for B before B's own readiness flow settles. The adapter is left in
    // the safe local (null) state; B's own path owns the final remote
    // selection.
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    // Live session is B, but the caller expects A.
    const mockClient = makeSupabaseClient({ user: { id: "user-B" } });
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student");

    const {
      reinitializePersistence,
      getConfiguredAdapter,
      resetPersistenceAdapter,
    } = await loadModule();

    await reinitializePersistence({ expectedUserId: "user-A" });

    // Stale A run must NOT select remote for B.
    expect(getConfiguredAdapter()).toBeNull();
    // The live getSession was read (proving the race window was
    // entered) but the identity guard refused to select remote for
    // the wrong user.
    expect(mockClient.auth.getSession).toHaveBeenCalledTimes(1);

    resetPersistenceAdapter();
    vi.doUnmock("../../supabase/browser");
  });

  it("selects remote when expectedUserId matches the live session user (happy path)", async () => {
    // Complement to the mismatch case: when the live session user
    // matches the captured expectedUserId, the selector MUST still
    // select remote. The identity guard must not break the happy
    // path.
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const mockClient = makeSupabaseClient({ user: { id: "user-A" } });
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student");

    const {
      reinitializePersistence,
      getConfiguredAdapter,
      resetPersistenceAdapter,
    } = await loadModule();

    await reinitializePersistence({ expectedUserId: "user-A" });

    expect(getConfiguredAdapter()).not.toBeNull();
    expect(mockClient.auth.getSession).toHaveBeenCalledTimes(1);

    resetPersistenceAdapter();
    vi.doUnmock("../../supabase/browser");
  });

  it("expectedUserId undefined preserves legacy behavior (selects remote for the live session user)", async () => {
    // The session-blind local reset paths and the no-session/error
    // fallbacks intentionally omit expectedUserId. The selector must
    // keep its legacy behavior for those callers — select remote for
    // whichever user the live session reports — so the identity guard
    // is a no-op when expectedUserId is undefined.
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const mockClient = makeSupabaseClient({ user: { id: "user-B" } });
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student");

    const {
      reinitializePersistence,
      getConfiguredAdapter,
      resetPersistenceAdapter,
    } = await loadModule();

    // No expectedUserId — legacy behavior.
    await reinitializePersistence();

    expect(getConfiguredAdapter()).not.toBeNull();

    resetPersistenceAdapter();
    vi.doUnmock("../../supabase/browser");
  });
});
