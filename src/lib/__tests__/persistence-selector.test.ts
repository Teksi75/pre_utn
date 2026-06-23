/**
 * Persistence selector — covers adapter selection, auth-session gate,
 * and local fallback.
 *
 * Spec scenarios:
 * - "missing env uses local fallback"
 * - "failed remote operation falls back gracefully"
 * - "persistence uses active profile id"
 *
 * Design: "Require an existing Supabase Auth session before selecting remote."
 * Local active profile alone is NOT auth — selector needs explicit
 * `hasRemoteSession: true` from an injected session gate.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { selectPersistenceAdapter } from "../persistence/selector";
import { isPersistenceAdapter } from "../persistence/port";
import type { PersistenceAdapter } from "../persistence/port";
import { PROFILES_STORAGE_KEY } from "../student-profile-storage";

// ---------------------------------------------------------------------------
// localStorage mock (same pattern as existing tests)
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
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: minimal conforming remote adapter for tests
// ---------------------------------------------------------------------------

function makeRemoteAdapter(): PersistenceAdapter {
  return {
    loadProfiles: () => ({ profiles: [], activeStudentId: null }),
    saveProfiles: (state) => ({ ok: true, state }),
    loadProgress: () => ({
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    }),
    saveProgress: () => ({ ok: true, value: undefined }),
    loadDiagnosticResult: () => null,
    saveDiagnosticResult: () => ({ ok: true, value: undefined }),
    loadStudyPlan: () => null,
    saveStudyPlan: () => ({ ok: true, value: undefined }),
  };
}

// ---------------------------------------------------------------------------
// Helper: set up active profile in localStorage
// ---------------------------------------------------------------------------

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
// Tests
// ---------------------------------------------------------------------------

describe("selectPersistenceAdapter", () => {
  // --- Missing env tests ---

  it("returns local adapter when Supabase URL is missing", () => {
    const adapter = selectPersistenceAdapter({
      env: { url: undefined, publishableKey: "test-key" },
    });
    expect(isPersistenceAdapter(adapter)).toBe(true);
  });

  it("returns local adapter when Supabase key is missing", () => {
    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: undefined },
    });
    expect(isPersistenceAdapter(adapter)).toBe(true);
  });

  it("returns local adapter when both URL and key are missing", () => {
    const adapter = selectPersistenceAdapter({
      env: { url: undefined, publishableKey: undefined },
    });
    expect(isPersistenceAdapter(adapter)).toBe(true);
  });

  it("returns local adapter when no config provided (default)", () => {
    const adapter = selectPersistenceAdapter();
    expect(isPersistenceAdapter(adapter)).toBe(true);
  });

  // --- Auth-session gate tests ---

  it("returns local adapter when env present but no active profile", () => {
    // No active profile in localStorage
    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
    });
    expect(isPersistenceAdapter(adapter)).toBe(true);
  });

  it("returns local adapter (not remote) when env and active profile present but hasRemoteSession is false", () => {
    setActiveProfile("local-student-a");
    const remoteAdapter = makeRemoteAdapter();

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: false,
      remoteAdapter,
    });

    // Local profile alone is NOT auth — must return local, not remote
    expect(isPersistenceAdapter(adapter)).toBe(true);
    expect(adapter).not.toBe(remoteAdapter);
  });

  it("returns local adapter (not remote) when env and active profile present but hasRemoteSession omitted", () => {
    setActiveProfile("local-student-a");
    const remoteAdapter = makeRemoteAdapter();

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      // hasRemoteSession deliberately omitted
      remoteAdapter,
    });

    // Omitted = no auth signal = local, not remote
    expect(isPersistenceAdapter(adapter)).toBe(true);
    expect(adapter).not.toBe(remoteAdapter);
  });

  // --- Remote adapter selection tests ---

  it("returns local adapter when no remote adapter provided even with env and session", () => {
    setActiveProfile("local-student-a");

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      // No remoteAdapter provided
    });

    expect(isPersistenceAdapter(adapter)).toBe(true);
  });

  it("returns fallback-wrapped adapter when env, active profile, hasRemoteSession, and remote adapter all present", () => {
    setActiveProfile("local-student-a");

    const remoteAdapter = makeRemoteAdapter();

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter,
    });

    // Must be a valid adapter (wrapped, not referentially equal to remote)
    expect(isPersistenceAdapter(adapter)).toBe(true);
    // Must NOT be the raw remote adapter (it's wrapped with fallback)
    expect(adapter).not.toBe(remoteAdapter);
  });

  it("returns local adapter when env missing even with remote adapter and session", () => {
    setActiveProfile("local-student-a");
    const remoteAdapter = makeRemoteAdapter();

    const adapter = selectPersistenceAdapter({
      env: { url: undefined, publishableKey: undefined },
      hasRemoteSession: true,
      remoteAdapter,
    });

    // Env missing → must always return local, ignoring remote adapter
    expect(isPersistenceAdapter(adapter)).toBe(true);
    expect(adapter).not.toBe(remoteAdapter);
  });

  // --- Fallback wrapper tests ---

  it("returns fallback adapter when remote adapter throws on loadProfiles", async () => {
    setActiveProfile("local-student-a");

    const throwingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      loadProfiles: () => {
        throw new Error("Supabase unreachable");
      },
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: throwingAdapter,
    });

    // Must be a valid adapter
    expect(isPersistenceAdapter(adapter)).toBe(true);
    // Calling loadProfiles must NOT throw — falls back to local behavior
    const result = await adapter.loadProfiles();
    expect(result).toBeDefined();
    expect(Array.isArray(result.profiles)).toBe(true);
  });

  it("returns fallback adapter when remote adapter throws on saveProgress", async () => {
    setActiveProfile("local-student-a");

    const throwingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      saveProgress: () => {
        throw new Error("Network timeout");
      },
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: throwingAdapter,
    });

    // saveProgress must NOT throw — falls back to local
    const result = await adapter.saveProgress("local-student-a", {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    });
    // Result must be a valid PersistenceResult
    expect(result).toBeDefined();
    expect(typeof result.ok).toBe("boolean");
  });

  it("returns fallback adapter when remote adapter throws on loadProgress", async () => {
    setActiveProfile("local-student-a");

    const throwingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      loadProgress: () => {
        throw new Error("Connection refused");
      },
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: throwingAdapter,
    });

    // loadProgress must NOT throw — falls back to local
    const result = await adapter.loadProgress("local-student-a");
    expect(result).toBeDefined();
    expect(Array.isArray(result.attempts)).toBe(true);
  });

  // --- Async fallback tests (async-aware withLocalFallback) ---

  it("falls back to local when remote loadProfiles returns a rejected Promise", async () => {
    setActiveProfile("local-student-a");

    const asyncThrowingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      loadProfiles: () => Promise.reject(new Error("Supabase timeout")),
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: asyncThrowingAdapter,
    });

    const result = adapter.loadProfiles();
    // Result must be a Promise (async path triggered)
    expect(result).toBeInstanceOf(Promise);
    // Resolved value must be the local fallback (valid ProfilesState)
    const resolved = await result;
    expect(Array.isArray(resolved.profiles)).toBe(true);
  });

  it("falls back to local when remote saveProgress returns a rejected Promise", async () => {
    setActiveProfile("local-student-a");

    const asyncThrowingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      saveProgress: () => Promise.reject(new Error("Network error")),
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: asyncThrowingAdapter,
    });

    const result = adapter.saveProgress("local-student-a", {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    });
    expect(result).toBeInstanceOf(Promise);
    const resolved = await result;
    expect(resolved.ok).toBe(true);
  });

  it("falls back to local when remote loadProgress returns a rejected Promise", async () => {
    setActiveProfile("local-student-a");

    const asyncThrowingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      loadProgress: () => Promise.reject(new Error("Connection refused")),
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: asyncThrowingAdapter,
    });

    const result = adapter.loadProgress("local-student-a");
    expect(result).toBeInstanceOf(Promise);
    const resolved = await result;
    expect(Array.isArray(resolved.attempts)).toBe(true);
  });

  it("falls back to local when remote loadDiagnosticResult returns a rejected Promise", async () => {
    setActiveProfile("local-student-a");

    const asyncThrowingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      loadDiagnosticResult: () => Promise.reject(new Error("Supabase down")),
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: asyncThrowingAdapter,
    });

    const result = adapter.loadDiagnosticResult("local-student-a");
    expect(result).toBeInstanceOf(Promise);
    const resolved = await result;
    // Local fallback returns null for diagnostic when none stored
    expect(resolved).toBeNull();
  });

  it("falls back to local when remote saveStudyPlan returns a rejected Promise", async () => {
    setActiveProfile("local-student-a");

    const asyncThrowingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      saveStudyPlan: () => Promise.reject(new Error("Timeout")),
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: asyncThrowingAdapter,
    });

    const result = adapter.saveStudyPlan("local-student-a", {
      createdAt: "2025-01-01T00:00:00.000Z",
      diagnosticResult: {
        completedAt: "2025-01-01T00:00:00.000Z",
        estimates: [],
        suggestions: [],
        version: 1,
      },
      skillPriorities: [],
    });
    expect(result).toBeInstanceOf(Promise);
    const resolved = await result;
    expect(resolved.ok).toBe(true);
  });

  // --- studentId enforcement tests ---
  // Note: StudentId enforcement is the LOCAL adapter's responsibility.
  // When selector returns a fallback-wrapped remote adapter, the remote
  // adapter handles its own studentId scoping (via RLS in Supabase).
  // These tests verify the local adapter directly.

  it("local adapter returns missing-active-profile when studentId does not match active profile", async () => {
    setActiveProfile("local-student-a");

    // Get the local adapter directly (no remote session → local)
    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: false,
    });

    // Calling with a different studentId must fail closed
    const result = await adapter.saveProgress("wrong-student-id", {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing-active-profile");
    }
  });

  it("local adapter returns empty progress when studentId mismatches on load", async () => {
    setActiveProfile("local-student-a");

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: false,
    });

    // loadProgress with wrong studentId must return empty progress (fail-closed)
    const result = await adapter.loadProgress("wrong-student-id");
    expect(result).toBeDefined();
    expect(result.attempts).toEqual([]);
    expect(result.accuracyBySkill).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Local adapter — legacy migration path
// ---------------------------------------------------------------------------

describe("local adapter legacy migration path", () => {
  it("migrates legacy flat data when no active profile exists", async () => {
    // Set up legacy flat-shaped practice data with NO profile
    localStorageMock.setItem(
      "pre-utn.practice.v1",
      JSON.stringify({
        attempts: [
          {
            exerciseId: "ex-1",
            skillId: "mat.u1.fracciones",
            correct: true,
            answeredAt: "2025-01-01T00:00:00.000Z",
            timeMs: 5000,
            attemptIndex: 1,
          },
        ],
        accuracyBySkill: { "mat.u1.fracciones": 1.0 },
        trendBySkill: { "mat.u1.fracciones": "stable" },
        lastPracticedBySkill: { "mat.u1.fracciones": "2025-01-01T00:00:00.000Z" },
        diagnosticResult: null,
        studyPlan: null,
      })
    );

    // No profiles storage set — no active profile exists
    const { createLocalStorageAdapter } = await import("../persistence/local-adapter");
    const adapter = createLocalStorageAdapter();

    // loadProgress delegates to raw loadProgress() when no active profile,
    // which runs legacy migration: creates "Alumno local" profile, re-keys
    // attempts under that studentId, and returns the migrated data.
    const result = await adapter.loadProgress("nonexistent-student");

    // Migration MUST produce actual migrated data — not EMPTY_PROGRESS.
    // If this returns empty, the adapter returned EMPTY_PROGRESS without
    // running legacy migration, which is a false-positive.
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].exerciseId).toBe("ex-1");
    expect(result.accuracyBySkill).toEqual({ "mat.u1.fracciones": 1.0 });

    // Migration must also create the profile and set activeStudentId
    const profilesRaw = localStorageMock.getItem("pre-utn.profiles.v1");
    expect(profilesRaw).not.toBeNull();
    const profiles = JSON.parse(profilesRaw!);
    expect(profiles.profiles).toHaveLength(1);
    expect(profiles.profiles[0].displayName).toBe("Alumno local");
    expect(profiles.activeStudentId).toBe(profiles.profiles[0].studentId);
  });
});

// ---------------------------------------------------------------------------
// Local adapter — injectable ops boundary
// ---------------------------------------------------------------------------

describe("createLocalStorageAdapter with injectable ops", () => {
  it("calls injected loadProfiles instead of default module", async () => {
    const customLoadProfiles = vi.fn(() => ({
      profiles: [
        {
          studentId: "custom-student",
          displayName: "Custom Student",
          createdAt: "2025-01-01T00:00:00.000Z",
          lastActiveAt: "2025-01-01T00:00:00.000Z",
        },
      ],
      activeStudentId: "custom-student",
    }));

    const { createLocalStorageAdapter } = await import("../persistence/local-adapter");
    const adapter = createLocalStorageAdapter({
      loadProfiles: customLoadProfiles,
      saveProfiles: (state) => ({ ok: true, state }),
      loadProgress: () => ({
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      }),
      saveProgress: () => ({ ok: true, value: undefined as void }),
      loadDiagnosticResult: () => null,
      saveDiagnosticResult: () => ({ ok: true, value: undefined as void }),
      loadStudyPlan: () => null,
      saveStudyPlan: () => ({ ok: true, value: undefined as void }),
    });

    const result = await adapter.loadProfiles();
    expect(customLoadProfiles).toHaveBeenCalledOnce();
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0].studentId).toBe("custom-student");
  });

  it("calls injected saveProgress instead of default module", async () => {
    const customSaveProgress = vi.fn(() => ({ ok: true as const, value: undefined as void }));

    setActiveProfile("injected-student");

    const { createLocalStorageAdapter } = await import("../persistence/local-adapter");
    const adapter = createLocalStorageAdapter({
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: (state) => ({ ok: true, state }),
      loadProgress: () => ({
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      }),
      saveProgress: customSaveProgress,
      loadDiagnosticResult: () => null,
      saveDiagnosticResult: () => ({ ok: true, value: undefined as void }),
      loadStudyPlan: () => null,
      saveStudyPlan: () => ({ ok: true, value: undefined as void }),
    });

    const progress = {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    };
    await adapter.saveProgress("injected-student", progress);
    expect(customSaveProgress).toHaveBeenCalledOnce();
    expect(customSaveProgress).toHaveBeenCalledWith(progress);
  });

  it("calls injected loadDiagnosticResult instead of default module", async () => {
    const mockDiagnostic = {
      completedAt: "2025-01-01T00:00:00.000Z",
      estimates: [],
      suggestions: [],
      version: 1 as const,
    };
    const customLoadDiagnostic = vi.fn(() => mockDiagnostic);

    setActiveProfile("injected-student");

    const { createLocalStorageAdapter } = await import("../persistence/local-adapter");
    const adapter = createLocalStorageAdapter({
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: (state) => ({ ok: true, state }),
      loadProgress: () => ({
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      }),
      saveProgress: () => ({ ok: true, value: undefined as void }),
      loadDiagnosticResult: customLoadDiagnostic,
      saveDiagnosticResult: () => ({ ok: true, value: undefined as void }),
      loadStudyPlan: () => null,
      saveStudyPlan: () => ({ ok: true, value: undefined as void }),
    });

    const result = await adapter.loadDiagnosticResult("injected-student");
    expect(customLoadDiagnostic).toHaveBeenCalledOnce();
    expect(result).toBe(mockDiagnostic);
  });

  it("calls injected saveStudyPlan instead of default module", async () => {
    const customSaveStudyPlan = vi.fn(() => ({ ok: true as const, value: undefined as void }));

    setActiveProfile("injected-student");

    const { createLocalStorageAdapter } = await import("../persistence/local-adapter");
    const adapter = createLocalStorageAdapter({
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: (state) => ({ ok: true, state }),
      loadProgress: () => ({
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      }),
      saveProgress: () => ({ ok: true, value: undefined as void }),
      loadDiagnosticResult: () => null,
      saveDiagnosticResult: () => ({ ok: true, value: undefined as void }),
      loadStudyPlan: () => null,
      saveStudyPlan: customSaveStudyPlan,
    });

    const plan = {
      createdAt: "2025-01-01T00:00:00.000Z",
      diagnosticResult: {
        completedAt: "2025-01-01T00:00:00.000Z",
        estimates: [],
        suggestions: [],
        version: 1 as const,
      },
      skillPriorities: [],
    };
    await adapter.saveStudyPlan("injected-student", plan);
    expect(customSaveStudyPlan).toHaveBeenCalledOnce();
    expect(customSaveStudyPlan).toHaveBeenCalledWith(plan);
  });
});
