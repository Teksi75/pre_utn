/**
 * Tests for src/lib/auth/link-profile.ts — linkActiveProfileToAuthUser()
 *
 * Verifies:
 * - No active profile → no-op (no saveProfiles call, no throw)
 * - Active profile + session → upserts a (user_id, student_id) row via saveProfiles
 * - Idempotent: running twice does not throw and does not duplicate
 * - Best-effort: errors are swallowed, function never throws
 * - No session → no-op (no saveProfiles call)
 *
 * Spec: REQ-AUTH-4 — "linkActiveProfileToAuthUser() MUST read the active
 * local profile and call saveProfiles() so the remote adapter upserts a
 * student_profiles row keyed by (authUserId, studentId). It MUST be
 * idempotent and best-effort."
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setActiveProfile(studentId: string, displayName = "Test"): void {
  localStorageMock.setItem(
    PROFILES_STORAGE_KEY,
    JSON.stringify({
      profiles: [
        {
          studentId,
          displayName,
          createdAt: "2025-01-01T00:00:00.000Z",
          lastActiveAt: "2025-01-01T00:00:00.000Z",
        },
      ],
      activeStudentId: studentId,
    })
  );
}

function makeSupabaseClient(session: unknown) {
  return {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session },
        error: null,
      })),
    },
  };
}

async function loadModule() {
  return import("../link-profile");
}

// ---------------------------------------------------------------------------
// RED tests
// ---------------------------------------------------------------------------

describe("linkActiveProfileToAuthUser()", () => {
  it("is a no-op when no active profile exists", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const mockClient = makeSupabaseClient({
      user: { id: "auth-user-1" },
      access_token: "token",
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    const { linkActiveProfileToAuthUser } = await loadModule();

    // No active profile → no throw, no remote call.
    await expect(linkActiveProfileToAuthUser()).resolves.toBeUndefined();
    expect(mockClient.auth.getSession).not.toHaveBeenCalled();
    vi.doUnmock("../../supabase/browser");
  });

  it("upserts (user_id, student_id) via remote saveProfiles when active profile + session exist", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const mockClient = makeSupabaseClient({
      user: { id: "auth-user-1" },
      access_token: "token",
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student", "Ana");

    const saveSpy = vi.fn(async (state: unknown) => ({
      ok: true as const,
      state,
    }));

    // Mock createSupabaseAdapter to return a stub adapter whose saveProfiles
    // we control.
    vi.doMock("../../persistence/supabase-adapter", () => ({
      createSupabaseAdapter: () => ({
        saveProfiles: saveSpy,
      }),
    }));

    const { linkActiveProfileToAuthUser } = await loadModule();

    await linkActiveProfileToAuthUser();

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const arg = saveSpy.mock.calls[0]![0] as {
      profiles: Array<{
        studentId: string;
        displayName: string;
        createdAt: string;
        lastActiveAt: string;
      }>;
      activeStudentId: string | null;
    };
    expect(arg.profiles).toHaveLength(1);
    expect(arg.profiles[0]).toMatchObject({
      studentId: "local-student",
      displayName: "Ana",
    });
    expect(arg.activeStudentId).toBe("local-student");

    vi.doUnmock("../../supabase/browser");
    vi.doUnmock("../../persistence/supabase-adapter");
  });

  it("is idempotent: calling twice does not throw and uses same upsert shape", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const mockClient = makeSupabaseClient({
      user: { id: "auth-user-1" },
      access_token: "token",
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student", "Ana");

    const saveSpy = vi.fn(async (state: unknown) => ({
      ok: true as const,
      state,
    }));

    vi.doMock("../../persistence/supabase-adapter", () => ({
      createSupabaseAdapter: () => ({
        saveProfiles: saveSpy,
      }),
    }));

    const { linkActiveProfileToAuthUser } = await loadModule();

    await linkActiveProfileToAuthUser();
    await linkActiveProfileToAuthUser();

    expect(saveSpy).toHaveBeenCalledTimes(2);
    // Both calls use the same (studentId) — upsert handles dedup.
    const first = saveSpy.mock.calls[0]![0] as { profiles: Array<{ studentId: string }> };
    const second = saveSpy.mock.calls[1]![0] as { profiles: Array<{ studentId: string }> };
    expect(first.profiles[0].studentId).toBe("local-student");
    expect(second.profiles[0].studentId).toBe("local-student");

    vi.doUnmock("../../supabase/browser");
    vi.doUnmock("../../persistence/supabase-adapter");
  });

  it("is best-effort: remote saveProfiles failure does NOT throw", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const mockClient = makeSupabaseClient({
      user: { id: "auth-user-1" },
      access_token: "token",
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student", "Ana");

    const saveSpy = vi.fn(async () => {
      throw new Error("Network unreachable");
    });

    vi.doMock("../../persistence/supabase-adapter", () => ({
      createSupabaseAdapter: () => ({
        saveProfiles: saveSpy,
      }),
    }));

    const { linkActiveProfileToAuthUser } = await loadModule();

    await expect(linkActiveProfileToAuthUser()).resolves.toBeUndefined();

    vi.doUnmock("../../supabase/browser");
    vi.doUnmock("../../persistence/supabase-adapter");
  });

  it("is best-effort: saveProfiles returning {ok:false} does NOT throw", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const mockClient = makeSupabaseClient({
      user: { id: "auth-user-1" },
      access_token: "token",
    });

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student", "Ana");

    const saveSpy = vi.fn(async () => ({
      ok: false as const,
      reason: "storage-unavailable",
    }));

    vi.doMock("../../persistence/supabase-adapter", () => ({
      createSupabaseAdapter: () => ({
        saveProfiles: saveSpy,
      }),
    }));

    const { linkActiveProfileToAuthUser } = await loadModule();

    await expect(linkActiveProfileToAuthUser()).resolves.toBeUndefined();

    vi.doUnmock("../../supabase/browser");
    vi.doUnmock("../../persistence/supabase-adapter");
  });

  it("is a no-op when no Supabase session exists (user signed out)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    const mockClient = makeSupabaseClient(null);

    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student", "Ana");

    const saveSpy = vi.fn(async (state: unknown) => ({
      ok: true as const,
      state,
    }));

    vi.doMock("../../persistence/supabase-adapter", () => ({
      createSupabaseAdapter: () => ({
        saveProfiles: saveSpy,
      }),
    }));

    const { linkActiveProfileToAuthUser } = await loadModule();

    await linkActiveProfileToAuthUser();

    expect(saveSpy).not.toHaveBeenCalled();

    vi.doUnmock("../../supabase/browser");
    vi.doUnmock("../../persistence/supabase-adapter");
  });

  it("is a no-op when createBrowserClient returns null (env missing)", async () => {
    vi.doMock("../../supabase/browser", () => ({
      createBrowserClient: () => null,
    }));

    setActiveProfile("local-student", "Ana");

    const { linkActiveProfileToAuthUser } = await loadModule();

    await expect(linkActiveProfileToAuthUser()).resolves.toBeUndefined();
    vi.doUnmock("../../supabase/browser");
  });
});