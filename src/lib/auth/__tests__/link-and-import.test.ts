/**
 * Tests for src/lib/auth/link-and-import.ts — linkAndImportLocalProgress()
 *
 * Verifies the SIGNED_IN orchestrator:
 * - 4-branch decision matrix from design §3.
 * - Pure `decideBranch(localHas, remote)` is exported for unit testing.
 * - No active profile → reads `sessionStorage` pendingName keyed by email,
 *   falls back to email local-part, creates local profile, upserts remote
 *   `student_profiles` row, then saves local backup, then links FK.
 * - Always calls `linkActiveProfileToAuthUserWithResult()` so the FK row exists.
 * - Imports local progress to remote ONLY in the `local has + remote
 *   empty` branch.
 * - Does not import in the conflict branch (both have progress).
 * - Never throws — uses the best-effort helpers.
 * - Returns a discriminated `LinkImportOutcome` so post-auth-sync.ts can
 *   flip status to "local-fallback" instead of falsely reporting "ready"
 *   when sync fails (REQ-NEW-2c: FK-before-snapshot readiness).
 *
 * Spec: REQ-NEW-1, REQ-NEW-2a, REQ-NEW-2b, REQ-NEW-2c, REQ-NEW-2d,
 *       REQ-NEW-ARCH-1.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PROFILES_STORAGE_KEY } from "../../student-profile-storage";

// ---------------------------------------------------------------------------
// vi.hoisted mocks — declared BEFORE vi.doMock factories run, because
// vitest hoists `vi.doMock` calls to the top of the file. The factories
// must reference values that exist at module-evaluation time, so we put
// the mutable mock registry + persistent vi.fn instances in `vi.hoisted`.
// ---------------------------------------------------------------------------

const mockRegistry = vi.hoisted(() => ({
  // Persistent vi.fn instances — tests mutate via mockImplementation /
  // mockReturnValue. This way the vi.doMock factory reference stays
  // stable while the behavior changes per test.
  link: {
    fn: vi.fn(),
  },
  importLocal: {
    fn: vi.fn(),
  },
  supabase: {
    createBrowserClient: vi.fn(),
  },
  persistence: {
    createSupabaseAdapter: vi.fn(),
  },
  studentProfile: {
    createProfileAndActivate: vi.fn(),
  },
  hasLocal: {
    hasLocalProgress: vi.fn(),
  },
  probeRemote: {
    probeRemoteState: vi.fn(),
  },
}));

vi.doMock("../link-profile", () => ({
  linkActiveProfileToAuthUser: async () => {
    await mockRegistry.link.fn();
  },
  linkActiveProfileToAuthUserWithResult: mockRegistry.link.fn,
}));

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

  // Reset persistent mocks to their default success behaviors. Tests
  // override via mockImplementation / mockReturnValue.
  mockRegistry.link.fn.mockReset();
  mockRegistry.link.fn.mockImplementation(async () => ({ ok: true as const }));

  mockRegistry.importLocal.fn.mockReset();
  mockRegistry.importLocal.fn.mockImplementation(async () => ({
    ok: true,
    importedFields: ["progress"],
  }));

  mockRegistry.supabase.createBrowserClient.mockReset();
  mockRegistry.supabase.createBrowserClient.mockImplementation(
    () => makeSupabaseClient()
  );

  mockRegistry.persistence.createSupabaseAdapter.mockReset();
  mockRegistry.persistence.createSupabaseAdapter.mockImplementation(() => ({
    saveProfiles: vi.fn(async (state: unknown) => ({ ok: true, state })),
  }));

  mockRegistry.studentProfile.createProfileAndActivate.mockReset();
  mockRegistry.studentProfile.createProfileAndActivate.mockImplementation(
    () => ({
      ok: true,
      state: { profiles: [], activeStudentId: "new-id" },
    })
  );

  mockRegistry.hasLocal.hasLocalProgress.mockReset();
  mockRegistry.hasLocal.hasLocalProgress.mockImplementation(() => false);

  mockRegistry.probeRemote.probeRemoteState.mockReset();
  mockRegistry.probeRemote.probeRemoteState.mockImplementation(async () => ({
    hasRemoteProgress: false,
    hasDiagnostic: false,
    hasStudyPlan: false,
  }));
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

  // Configure persistent mocks for this test.
  if (mocks.noClient) {
    mockRegistry.supabase.createBrowserClient.mockImplementation(() => null);
  }

  if (mocks.createProfileResult) {
    mockRegistry.studentProfile.createProfileAndActivate.mockImplementation(
      () => mocks.createProfileResult!
    );
  }

  if (mocks.hasLocal !== undefined) {
    mockRegistry.hasLocal.hasLocalProgress.mockImplementation(
      () => mocks.hasLocal!
    );
  }

  if (mocks.remoteState) {
    mockRegistry.probeRemote.probeRemoteState.mockImplementation(
      async () => mocks.remoteState!
    );
  }

  if (mocks.importResult) {
    mockRegistry.importLocal.fn.mockImplementation(async () => mocks.importResult!);
  }

  // (link mock retains its default `{ ok: true }` implementation; tests
  // override via mockImplementation / mockReturnValue after loadWithMocks.)

  vi.doMock("../../supabase/browser", () => ({
    createBrowserClient: mockRegistry.supabase.createBrowserClient,
  }));

  vi.doMock("../../persistence/supabase-adapter", () => ({
    createSupabaseAdapter: mockRegistry.persistence.createSupabaseAdapter,
  }));

  vi.doMock("../import-local-progress", () => ({
    importLocalProgressToRemote: mockRegistry.importLocal.fn,
  }));

  vi.doMock("../../student-profile-storage", async () => {
    const actual =
      await vi.importActual<typeof import("../../student-profile-storage")>(
        "../../student-profile-storage",
      );
    return {
      ...actual,
      createProfileAndActivate:
        mockRegistry.studentProfile.createProfileAndActivate,
    };
  });

  vi.doMock("../has-local-progress", () => ({
    hasLocalProgress: mockRegistry.hasLocal.hasLocalProgress,
  }));

  vi.doMock("../probe-remote", () => ({
    probeRemoteState: mockRegistry.probeRemote.probeRemoteState,
  }));

  const mod = await import("../link-and-import");
  return {
    ...mod,
    mocks: {
      mockImport: mockRegistry.importLocal.fn,
      mockCreateProfile: mockRegistry.studentProfile.createProfileAndActivate,
      mockLink: mockRegistry.link.fn,
    },
  };
}

describe("linkAndImportLocalProgress()", () => {
  it("is a no-op (no link/import calls) when no Supabase session is provided", async () => {
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: "student-1",
    });
    const outcome = await linkAndImportLocalProgress(null as never);
    expect(mocks.mockLink).not.toHaveBeenCalled();
    expect(mocks.mockImport).not.toHaveBeenCalled();
    // Even no-session must report an outcome so callers can react.
    expect(outcome).toMatchObject({ kind: "local-fallback" });
    expect((outcome as { reason: string }).reason).toBe("no-session");
  });

  it("is a no-op when createBrowserClient returns null (env missing)", async () => {
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: "student-1",
      noClient: true,
    });
    const outcome = await linkAndImportLocalProgress(SESSION as never);
    expect(mocks.mockLink).not.toHaveBeenCalled();
    expect(mocks.mockImport).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      kind: "local-fallback",
      reason: "auth-disabled",
    });
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
    const outcome = await linkAndImportLocalProgress(SESSION as never);
    expect(mocks.mockLink).toHaveBeenCalledTimes(1);
    expect(mocks.mockImport).not.toHaveBeenCalled();
    expect(mocks.mockCreateProfile).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ kind: "ready" });
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
    const outcome = await linkAndImportLocalProgress(SESSION as never);
    expect(mocks.mockLink).toHaveBeenCalledTimes(1);
    expect(mocks.mockImport).toHaveBeenCalledTimes(1);
    expect(outcome).toMatchObject({ kind: "ready" });
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
    const outcome = await linkAndImportLocalProgress(SESSION as never);
    expect(mocks.mockLink).toHaveBeenCalledTimes(1);
    expect(mocks.mockImport).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ kind: "ready" });
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
    const outcome = await linkAndImportLocalProgress(SESSION as never);
    expect(mocks.mockLink).toHaveBeenCalledTimes(1);
    expect(mocks.mockImport).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ kind: "ready" });
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

  it("never throws — best-effort throughout (link returns {ok:false} → outcome local-fallback)", async () => {
    // The link helper is contracted to NEVER throw — it returns a result.
    // Verify that a `{ok:false}` link result propagates as a
    // "local-fallback / profile-link-failed" outcome so the orchestrator
    // never throws and the status module can flip to "local-fallback".
    const { linkAndImportLocalProgress } = await loadWithMocks({
      activeProfileId: "student-1",
      hasLocal: true,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });
    // Override the link mock to return failure.
    mockRegistry.link.fn.mockImplementation(async () => ({
      ok: false,
      reason: "remote-failed",
    }));
    const outcome = await linkAndImportLocalProgress(SESSION as never);
    expect(outcome).toMatchObject({
      kind: "local-fallback",
      reason: "profile-link-failed",
    });
  });

  // ---------------------------------------------------------------------------
  // REQ-NEW-2c — Profile FK precedes snapshot writes
  // ---------------------------------------------------------------------------

  it("link-and-import branch: link awaited BEFORE import (REQ-NEW-2c)", async () => {
    const callOrder: string[] = [];
    mockRegistry.link.fn.mockImplementation(async () => {
      callOrder.push("link");
      return { ok: true as const };
    });
    mockRegistry.importLocal.fn.mockImplementation(async () => {
      callOrder.push("import");
      return { ok: true, importedFields: ["progress"] };
    });

    const { linkAndImportLocalProgress } = await loadWithMocks({
      activeProfileId: "student-1",
      hasLocal: true,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });
    await linkAndImportLocalProgress(SESSION as never);

    expect(callOrder).toEqual(["link", "import"]);
  });

  // ---------------------------------------------------------------------------
  // Outcome reporting (REQ-NEW-2c: FK-before-snapshot readiness)
  // ---------------------------------------------------------------------------

  it("link-failure (FK upsert fails): import is NOT attempted and outcome is local-fallback", async () => {
    mockRegistry.link.fn.mockImplementation(async () => ({
      ok: false,
      reason: "remote-failed",
    }));
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: "student-1",
      hasLocal: true,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });

    const outcome = await linkAndImportLocalProgress(SESSION as never);

    expect(mocks.mockImport).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      kind: "local-fallback",
      reason: "profile-link-failed",
    });
  });

  it("import returns ok:false with NO imported fields → outcome local-fallback reason import-failed", async () => {
    mockRegistry.importLocal.fn.mockImplementation(async () => ({
      ok: false,
      importedFields: [],
      error: new Error("remote-down"),
    }));
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: "student-1",
      hasLocal: true,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });

    const outcome = await linkAndImportLocalProgress(SESSION as never);

    expect(mocks.mockImport).toHaveBeenCalledTimes(1);
    expect(outcome).toMatchObject({
      kind: "local-fallback",
      reason: "import-failed",
    });
  });

  it("import returns ok:false with PARTIAL imported fields → outcome local-fallback reason import-partial", async () => {
    mockRegistry.importLocal.fn.mockImplementation(async () => ({
      ok: false,
      importedFields: ["progress"],
      error: new Error("diagnostic-failed"),
    }));
    const { linkAndImportLocalProgress } = await loadWithMocks({
      activeProfileId: "student-1",
      hasLocal: true,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });

    const outcome = await linkAndImportLocalProgress(SESSION as never);

    expect(outcome).toMatchObject({
      kind: "local-fallback",
      reason: "import-partial",
    });
    expect(outcome).toMatchObject({
      partialFields: ["progress"],
    });
  });

  it("import returns ok:true → outcome is ready", async () => {
    mockRegistry.importLocal.fn.mockImplementation(async () => ({
      ok: true,
      importedFields: ["progress", "diagnostic"],
    }));
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: "student-1",
      hasLocal: true,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });

    const outcome = await linkAndImportLocalProgress(SESSION as never);

    expect(mocks.mockImport).toHaveBeenCalledTimes(1);
    expect(outcome).toMatchObject({ kind: "ready" });
  });

  it("link-only branch (local empty + remote empty): no import runs, outcome is ready", async () => {
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: "student-1",
      hasLocal: false,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });
    const outcome = await linkAndImportLocalProgress(SESSION as never);

    expect(mocks.mockImport).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ kind: "ready" });
  });

  it("createProfileAndActivate fails (no active profile after creation) → outcome local-fallback reason no-active-profile", async () => {
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: null,
      createProfileResult: { ok: false },
      hasLocal: false,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });
    const outcome = await linkAndImportLocalProgress(SESSION as never);

    expect(mocks.mockImport).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      kind: "local-fallback",
      reason: "no-active-profile",
    });
  });
});

// ---------------------------------------------------------------------------
// REQ-AUTH-3 — Idempotency: duplicate events do not duplicate import
// ---------------------------------------------------------------------------

describe("linkAndImportLocalProgress() idempotency (REQ-AUTH-3)", () => {
  it("2 calls with the same session.user.id run the orchestrator body exactly once", async () => {
    const { linkAndImportLocalProgress, mocks } = await loadWithMocks({
      activeProfileId: "student-1",
      hasLocal: true,
      remoteState: {
        hasRemoteProgress: false,
        hasDiagnostic: false,
        hasStudyPlan: false,
      },
    });

    // First call (e.g. INITIAL_SESSION)
    await linkAndImportLocalProgress(SESSION as never);
    // Second call (e.g. SIGNED_IN arrives later for the same user)
    await linkAndImportLocalProgress(SESSION as never);

    expect(mocks.mockLink).toHaveBeenCalledTimes(1);
    expect(mocks.mockImport).toHaveBeenCalledTimes(1);
  });
});