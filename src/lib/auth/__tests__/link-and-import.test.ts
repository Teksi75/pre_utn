/**
 * Tests for src/lib/auth/link-and-import.ts — linkAndImportLocalProgress()
 *
 * Verifies the SIGNED_IN orchestrator:
 * - 4-branch decision matrix from design §3.
 * - Pure `decideBranch(localHas, remote)` is exported for unit testing.
 * - No active profile → reads `sessionStorage` pendingName keyed by email,
 *   falls back to email local-part, creates local profile, upserts remote
 *   `student_profiles` row, then saves local backup, then links FK.
 * - Always calls `linkActiveProfileToAuthUser()` so the FK row exists.
 * - Imports local progress to remote ONLY in the `local has + remote
 *   empty` branch.
 * - Does not import in the conflict branch (both have progress).
 * - Never throws — uses the best-effort helpers.
 *
 * Spec: REQ-NEW-1, REQ-NEW-2a, REQ-NEW-2b, REQ-NEW-2c, REQ-NEW-2d,
 *       REQ-NEW-ARCH-1.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PROFILES_STORAGE_KEY } from "../../student-profile-storage";

// ---------------------------------------------------------------------------
// localStorage mock + sessionStorage mock
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

function setActiveProfile(studentId: string, displayName = "Ana"): void {
  localStorageMock.setItem(
    PROFILES_STORAGE_KEY,
    JSON.stringify({
      profiles: [
        {
          studentId,
          displayName,
          createdAt: "t0",
          lastActiveAt: "t0",
        },
      ],
      activeStudentId: studentId,
    }),
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
// Pure function tests — exported `decideBranch`
// ---------------------------------------------------------------------------

describe("decideBranch(localHas, remote)", () => {
  it("returns 'link-only' for local-empty + remote-empty", async () => {
    const { decideBranch } = await import("../link-and-import");
    const remote = {
      hasRemoteProgress: false,
      hasDiagnostic: false,
      hasStudyPlan: false,
    };
    expect(decideBranch(false, remote)).toBe("link-only");
  });

  it("returns 'link-and-import' for local-has + remote-empty", async () => {
    const { decideBranch } = await import("../link-and-import");
    const remote = {
      hasRemoteProgress: false,
      hasDiagnostic: false,
      hasStudyPlan: false,
    };
    expect(decideBranch(true, remote)).toBe("link-and-import");
  });

  it("returns 'conflict-no-overwrite' for local-has + remote-has (any field)", async () => {
    const { decideBranch } = await import("../link-and-import");
    expect(
      decideBranch(true, {
        hasRemoteProgress: true,
        hasDiagnostic: false,
        hasStudyPlan: false,
      }),
    ).toBe("conflict-no-overwrite");
    expect(
      decideBranch(true, {
        hasRemoteProgress: false,
        hasDiagnostic: true,
        hasStudyPlan: false,
      }),
    ).toBe("conflict-no-overwrite");
    expect(
      decideBranch(true, {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: true,
      }),
    ).toBe("conflict-no-overwrite");
  });

  it("returns 'remote-canonical' for local-empty + remote-has (any field)", async () => {
    const { decideBranch } = await import("../link-and-import");
    expect(
      decideBranch(false, {
        hasRemoteProgress: true,
        hasDiagnostic: false,
        hasStudyPlan: false,
      }),
    ).toBe("remote-canonical");
    expect(
      decideBranch(false, {
        hasRemoteProgress: false,
        hasDiagnostic: true,
        hasStudyPlan: false,
      }),
    ).toBe("remote-canonical");
  });
});

// ---------------------------------------------------------------------------
// Integration tests — full orchestrator with mocked dependencies
// ---------------------------------------------------------------------------

async function loadWithMocks(mocks: {
  activeProfileId?: string | null;
  pendingNameForEmail?: string | null;
  remoteState?: {
    hasRemoteProgress: boolean;
    hasDiagnostic: boolean;
    hasStudyPlan: boolean;
  };
  hasLocal?: boolean;
  importResult?: { ok: boolean; importedFields: string[]; error?: Error };
  createProfileResult?: { ok: boolean };
  noClient?: boolean;
}) {
  // Pre-seed pendingName if requested.
  if (mocks.pendingNameForEmail !== undefined && mocks.pendingNameForEmail !== null) {
    sessionStorageMock.setItem(
      `pre-utn.pendingName:${SESSION.user.email}`,
      mocks.pendingNameForEmail,
    );
  }

  // Pre-seed active profile if requested.
  if (mocks.activeProfileId !== undefined && mocks.activeProfileId !== null) {
    setActiveProfile(mocks.activeProfileId);
  }

  const mockLink = vi.fn(async () => undefined);
  const mockImport = vi.fn(async () =>
    mocks.importResult ?? { ok: true, importedFields: ["progress"] },
  );
  const mockCreateProfile = vi.fn(() => mocks.createProfileResult ?? { ok: true, state: { profiles: [], activeStudentId: "new-id" } });
  const mockSaveProfiles = vi.fn(async (state: unknown) => ({ ok: true, state }));

  const mockSupabaseClient = makeSupabaseClient();

  vi.doMock("../../supabase/browser", () => ({
    createBrowserClient: mocks.noClient ? () => null : () => mockSupabaseClient,
  }));

  vi.doMock("../../persistence/supabase-adapter", () => ({
    createSupabaseAdapter: () => ({
      saveProfiles: mockSaveProfiles,
    }),
  }));

  vi.doMock("../link-profile", () => ({
    linkActiveProfileToAuthUser: mockLink,
  }));

  vi.doMock("../import-local-progress", () => ({
    importLocalProgressToRemote: mockImport,
  }));

  vi.doMock("../../student-profile-storage", async () => {
    const actual =
      await vi.importActual<typeof import("../../student-profile-storage")>(
        "../../student-profile-storage",
      );
    return {
      ...actual,
      createProfileAndActivate: mockCreateProfile,
    };
  });

  // hasLocalProgress — return whatever the test wants (it's a pure helper).
  vi.doMock("../has-local-progress", () => ({
    hasLocalProgress: () => mocks.hasLocal ?? false,
  }));

  vi.doMock("../probe-remote", () => ({
    probeRemoteState: async () =>
      mocks.remoteState ?? {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
  }));

  const mod = await import("../link-and-import");
  return { ...mod, mocks: { mockLink, mockImport, mockCreateProfile, mockSaveProfiles } };
}

describe("linkAndImportLocalProgress()", () => {
  it("is a no-op when no Supabase session is provided", async () => {
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: "student-1",
    });
    await linkAndImportLocalProgress(null as never);
    expect(mocks.mockLink).not.toHaveBeenCalled();
    expect(mocks.mockImport).not.toHaveBeenCalled();
  });

  it("is a no-op when createBrowserClient returns null (env missing)", async () => {
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: "student-1",
      noClient: true,
    });
    await linkAndImportLocalProgress(SESSION as never);
    expect(mocks.mockLink).not.toHaveBeenCalled();
    expect(mocks.mockImport).not.toHaveBeenCalled();
  });

  it("branch link-only (local empty + remote empty): just calls link", async () => {
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: "student-1",
      hasLocal: false,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });
    await linkAndImportLocalProgress(SESSION as never);
    expect(mocks.mockLink).toHaveBeenCalledTimes(1);
    expect(mocks.mockImport).not.toHaveBeenCalled();
    expect(mocks.mockCreateProfile).not.toHaveBeenCalled();
  });

  it("branch link-and-import (local has + remote empty): link + import", async () => {
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: "student-1",
      hasLocal: true,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });
    await linkAndImportLocalProgress(SESSION as never);
    expect(mocks.mockLink).toHaveBeenCalledTimes(1);
    expect(mocks.mockImport).toHaveBeenCalledTimes(1);
  });

  it("branch conflict-no-overwrite (local has + remote has): link only, no import", async () => {
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: "student-1",
      hasLocal: true,
      remoteState: {
        hasRemoteProgress: true,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });
    await linkAndImportLocalProgress(SESSION as never);
    expect(mocks.mockLink).toHaveBeenCalledTimes(1);
    expect(mocks.mockImport).not.toHaveBeenCalled();
  });

  it("branch remote-canonical (local empty + remote has): link only", async () => {
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: "student-1",
      hasLocal: false,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: true,
        hasStudyPlan: false,
      },
    });
    await linkAndImportLocalProgress(SESSION as never);
    expect(mocks.mockLink).toHaveBeenCalledTimes(1);
    expect(mocks.mockImport).not.toHaveBeenCalled();
  });

  it("no active profile: reads pendingName from sessionStorage keyed by email", async () => {
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: null,
      pendingNameForEmail: "Anita",
      hasLocal: false,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });
    await linkAndImportLocalProgress(SESSION as never);
    expect(mocks.mockCreateProfile).toHaveBeenCalledTimes(1);
    expect(mocks.mockCreateProfile).toHaveBeenCalledWith({
      displayName: "Anita",
    });
  });

  it("no active profile + no pendingName: falls back to email local-part", async () => {
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: null,
      hasLocal: false,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });
    await linkAndImportLocalProgress(SESSION as never);
    expect(mocks.mockCreateProfile).toHaveBeenCalledTimes(1);
    expect(mocks.mockCreateProfile).toHaveBeenCalledWith({
      displayName: "ana", // local part of "ana@example.com"
    });
  });

  it("no active profile: clears the pendingName sessionStorage key after consuming it", async () => {
    const { linkAndImportLocalProgress } = await loadWithMocks({
      activeProfileId: null,
      pendingNameForEmail: "Anita",
      hasLocal: false,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });
    await linkAndImportLocalProgress(SESSION as never);
    const stored = sessionStorageMock.getItem(
      `pre-utn.pendingName:${SESSION.user.email}`,
    );
    expect(stored).toBeNull();
  });

  it("never throws — best-effort throughout", async () => {
    // If link or import throws, the orchestrator should swallow it.
    const { linkAndImportLocalProgress } = await loadWithMocks({
      activeProfileId: "student-1",
      hasLocal: true,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });
    // Override the mock to throw, then re-import.
    vi.doMock("../link-profile", () => ({
      linkActiveProfileToAuthUser: async () => {
        throw new Error("boom");
      },
    }));
    vi.resetModules();
    const mod = await import("../link-and-import");
    await expect(
      mod.linkAndImportLocalProgress(SESSION as never),
    ).resolves.toBeUndefined();
  });
});
