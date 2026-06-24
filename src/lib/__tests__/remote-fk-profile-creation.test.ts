/**
 * Remote FK/profile creation gap — proves createProfileAndActivate persists
 * profiles through the configured adapter when remote is active.
 *
 * Design: "When a profile is created/activated under configured remote
 * adapter, persist profiles through adapter as well while preserving local
 * fallback and sync compatibility."
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
  };
})();

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  localStorageMock.clear();
  vi.restoreAllMocks();
  vi.resetModules();
});

// ---------------------------------------------------------------------------
// RED: createProfileAndActivate persists through adapter when configured
// ---------------------------------------------------------------------------

describe("remote FK: createProfileAndActivate persists profiles through adapter", () => {
  it("calls adapter.saveProfiles when remote adapter is configured", async () => {
    const { configurePersistenceAdapter, resetPersistenceAdapter } = await import(
      "../persistence/adapter-config"
    );
    const { createProfileAndActivate } = await import("../student-profile-storage");

    let remoteSaveProfilesCalled = false;
    let savedState: unknown = null;

    const remoteAdapter = {
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: (state: never) => {
        remoteSaveProfilesCalled = true;
        savedState = state;
        return { ok: true as const, state };
      },
      loadProgress: () => ({ attempts: [], accuracyBySkill: {}, trendBySkill: {}, lastPracticedBySkill: {}, diagnosticResult: null, studyPlan: null }),
      saveProgress: () => ({ ok: true as const, value: undefined as void }),
      loadDiagnosticResult: () => null,
      saveDiagnosticResult: () => ({ ok: true as const, value: undefined as void }),
      loadStudyPlan: () => null,
      saveStudyPlan: () => ({ ok: true as const, value: undefined as void }),
    };
    configurePersistenceAdapter(remoteAdapter as never);

    const result = createProfileAndActivate({ displayName: "Remote Student" });

    // Local save must succeed
    expect(result.ok).toBe(true);

    // Remote saveProfiles MUST have been called to avoid FK violation
    expect(remoteSaveProfilesCalled).toBe(true);

    // Saved state must include the new profile
    expect(savedState).not.toBeNull();
    const state = savedState as { profiles: Array<{ displayName: string }> };
    expect(state.profiles).toHaveLength(1);
    expect(state.profiles[0].displayName).toBe("Remote Student");

    resetPersistenceAdapter();
  });

  it("falls back to local-only when adapter.saveProfiles rejects", async () => {
    const { configurePersistenceAdapter, resetPersistenceAdapter } = await import(
      "../persistence/adapter-config"
    );
    const { createProfileAndActivate } = await import("../student-profile-storage");

    const remoteAdapter = {
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: () => Promise.reject(new Error("Network error")),
      loadProgress: () => ({ attempts: [], accuracyBySkill: {}, trendBySkill: {}, lastPracticedBySkill: {}, diagnosticResult: null, studyPlan: null }),
      saveProgress: () => ({ ok: true as const, value: undefined as void }),
      loadDiagnosticResult: () => null,
      saveDiagnosticResult: () => ({ ok: true as const, value: undefined as void }),
      loadStudyPlan: () => null,
      saveStudyPlan: () => ({ ok: true as const, value: undefined as void }),
    };
    configurePersistenceAdapter(remoteAdapter as never);

    // Must NOT throw even if remote fails
    const result = createProfileAndActivate({ displayName: "Fallback Student" });
    expect(result.ok).toBe(true);

    // Local save must have happened
    const raw = localStorageMock.getItem("pre-utn.profiles.v1");
    expect(raw).not.toBeNull();
    const state = JSON.parse(raw!);
    expect(state.profiles).toHaveLength(1);
    expect(state.profiles[0].displayName).toBe("Fallback Student");

    resetPersistenceAdapter();
  });

  it("falls back to local-only when adapter.saveProfiles resolves ok:false", async () => {
    const { configurePersistenceAdapter, resetPersistenceAdapter } = await import(
      "../persistence/adapter-config"
    );
    const { createProfileAndActivate } = await import("../student-profile-storage");

    const remoteAdapter = {
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: () => ({ ok: false as const, reason: "storage-unavailable" as const }),
      loadProgress: () => ({ attempts: [], accuracyBySkill: {}, trendBySkill: {}, lastPracticedBySkill: {}, diagnosticResult: null, studyPlan: null }),
      saveProgress: () => ({ ok: true as const, value: undefined as void }),
      loadDiagnosticResult: () => null,
      saveDiagnosticResult: () => ({ ok: true as const, value: undefined as void }),
      loadStudyPlan: () => null,
      saveStudyPlan: () => ({ ok: true as const, value: undefined as void }),
    };
    configurePersistenceAdapter(remoteAdapter as never);

    const result = createProfileAndActivate({ displayName: "OkFalse Student" });
    // Must succeed locally even if remote returns ok:false
    expect(result.ok).toBe(true);

    const raw = localStorageMock.getItem("pre-utn.profiles.v1");
    expect(raw).not.toBeNull();
    const state = JSON.parse(raw!);
    expect(state.profiles).toHaveLength(1);

    resetPersistenceAdapter();
  });

  it("still works normally when no adapter configured (local-only path)", async () => {
    const { createProfileAndActivate } = await import("../student-profile-storage");

    const result = createProfileAndActivate({ displayName: "Local Only Student" });
    expect(result.ok).toBe(true);

    const raw = localStorageMock.getItem("pre-utn.profiles.v1");
    expect(raw).not.toBeNull();
    const state = JSON.parse(raw!);
    expect(state.profiles).toHaveLength(1);
    expect(state.profiles[0].displayName).toBe("Local Only Student");
    expect(state.activeStudentId).toBe(state.profiles[0].studentId);
  });

  // -------------------------------------------------------------------------
  // RED: addAttempt() must wait for pending remote saveProfiles() to complete
  // -------------------------------------------------------------------------

  it("addAttempt waits for pending remote saveProfiles before remote saveProgress", async () => {
    const callOrder: string[] = [];
    let resolveSaveProfiles!: () => void;
    const saveProfilesPromise = new Promise<void>((resolve) => {
      resolveSaveProfiles = resolve;
    });

    const remoteAdapter = {
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: () => {
        callOrder.push("saveProfiles-start");
        return saveProfilesPromise.then(() => {
          callOrder.push("saveProfiles-end");
          return { ok: true as const, state: { profiles: [], activeStudentId: null } };
        });
      },
      loadProgress: () => ({
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      }),
      saveProgress: () => {
        callOrder.push("saveProgress");
        return { ok: true as const, value: undefined as void };
      },
      loadDiagnosticResult: () => null,
      saveDiagnosticResult: () => ({ ok: true as const, value: undefined as void }),
      loadStudyPlan: () => null,
      saveStudyPlan: () => ({ ok: true as const, value: undefined as void }),
    };

    const { configurePersistenceAdapter, resetPersistenceAdapter } = await import(
      "../persistence/adapter-config"
    );
    const { createProfileAndActivate } = await import("../student-profile-storage");
    const { addAttempt } = await import("../practice-progress");

    configurePersistenceAdapter(remoteAdapter as never);

    // Create profile — starts remote saveProfiles (not yet resolved)
    const profileResult = createProfileAndActivate({ displayName: "Ordering Student" });
    expect(profileResult.ok).toBe(true);

    // Immediately add attempt — should wait for saveProfiles to complete
    const attemptResult = addAttempt({
      exerciseId: "ex-1",
      skillId: "mat.u1.fracciones",
      correct: true,
      answeredAt: "2025-01-01T00:00:00.000Z",
      timeMs: 1000,
      attemptIndex: 1,
    });
    expect(attemptResult.ok).toBe(true);

    // Wait for all pending promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Now resolve saveProfiles
    resolveSaveProfiles();
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify ordering: saveProfiles must complete before saveProgress
    expect(callOrder).toContain("saveProfiles-start");
    expect(callOrder).toContain("saveProfiles-end");
    expect(callOrder).toContain("saveProgress");

    // saveProfiles-end must come before saveProgress
    const saveProfilesEndIndex = callOrder.indexOf("saveProfiles-end");
    const saveProgressIndex = callOrder.indexOf("saveProgress");
    expect(saveProfilesEndIndex).toBeLessThan(saveProgressIndex);

    resetPersistenceAdapter();
  });
});
