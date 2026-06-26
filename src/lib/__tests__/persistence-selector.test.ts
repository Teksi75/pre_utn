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

/** Assert that a MaybePromise result is sync (no adapter configured) and return it. */
function asSync<T>(value: T | Promise<T>): T {
  expect(value).not.toBeInstanceOf(Promise);
  return value as T;
}

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

  // --- Resolved-failure fallback tests ---
  // BLOCKER FIX: withLocalFallback must detect resolved { ok: false } results
  // from write operations and fall back to local adapter.

  it("falls back to local when remote saveProgress resolves with ok:false", async () => {
    setActiveProfile("local-student-a");

    // Remote adapter that resolves (not throws) with ok:false — simulates
    // a real Supabase save failure that returns a result instead of throwing.
    const failingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      saveProgress: () => ({ ok: false as const, reason: "missing-active-profile" as const }),
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: failingAdapter,
    });

    const progress = {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    };
    const result = await adapter.saveProgress("local-student-a", progress);
    // Must fall back to local — which succeeds (local studentId matches)
    expect(result.ok).toBe(true);
  });

  it("falls back to local when remote saveProfiles resolves with ok:false", async () => {
    setActiveProfile("local-student-a");

    const failingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      saveProfiles: () => ({ ok: false as const, reason: "storage-unavailable" as const }),
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: failingAdapter,
    });

    const result = await adapter.saveProfiles({
      profiles: [],
      activeStudentId: null,
    });
    // Must fall back to local — which succeeds
    expect(result.ok).toBe(true);
  });

  it("falls back to local when remote saveDiagnosticResult resolves with ok:false", async () => {
    setActiveProfile("local-student-a");

    const failingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      saveDiagnosticResult: () => ({ ok: false as const, reason: "missing-active-profile" as const }),
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: failingAdapter,
    });

    const result = await adapter.saveDiagnosticResult("local-student-a", {
      completedAt: "2025-01-01T00:00:00.000Z",
      estimates: [],
      suggestions: [],
      version: 1,
    });
    // Must fall back to local — which succeeds
    expect(result.ok).toBe(true);
  });

  it("falls back to local when remote saveStudyPlan resolves with ok:false", async () => {
    setActiveProfile("local-student-a");

    const failingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      saveStudyPlan: () => ({ ok: false as const, reason: "missing-active-profile" as const }),
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: failingAdapter,
    });

    const result = await adapter.saveStudyPlan("local-student-a", {
      createdAt: "2025-01-01T00:00:00.000Z",
      diagnosticResult: {
        completedAt: "2025-01-01T00:00:00.000Z",
        estimates: [],
        suggestions: [],
        version: 1,
      },
      skillPriorities: [],
    });
    // Must fall back to local — which succeeds
    expect(result.ok).toBe(true);
  });

  it("does NOT fall back when remote saveProgress resolves with ok:true", async () => {
    setActiveProfile("local-student-a");

    let remoteCalled = false;
    const successAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      saveProgress: () => {
        remoteCalled = true;
        return { ok: true as const, value: undefined as void };
      },
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: successAdapter,
    });

    const result = await adapter.saveProgress("local-student-a", {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    });
    // Remote succeeded — should use remote result, not fall back
    expect(remoteCalled).toBe(true);
    expect(result.ok).toBe(true);
  });

  it("falls back to local when remote saveProgress async resolves with ok:false", async () => {
    setActiveProfile("local-student-a");

    const asyncFailingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      saveProgress: () => Promise.resolve({ ok: false as const, reason: "missing-active-profile" as const }),
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: asyncFailingAdapter,
    });

    const result = await adapter.saveProgress("local-student-a", {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    });
    // Async resolved { ok: false } — must fall back to local
    expect(result.ok).toBe(true);
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

// ---------------------------------------------------------------------------
// Dangling activeStudentId — boundary gap
// ---------------------------------------------------------------------------

describe("dangling activeStudentId detection", () => {
  it("returns null when activeStudentId does not match any profile", async () => {
    // Set up profiles with student A and B, but activeStudentId = student-c
    localStorageMock.setItem(
      "pre-utn.profiles.v1",
      JSON.stringify({
        profiles: [
          {
            studentId: "student-a",
            displayName: "Student A",
            createdAt: "2025-01-01T00:00:00.000Z",
            lastActiveAt: "2025-01-01T00:00:00.000Z",
          },
          {
            studentId: "student-b",
            displayName: "Student B",
            createdAt: "2025-01-01T00:00:00.000Z",
            lastActiveAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        activeStudentId: "student-c", // dangling — not in profiles
      })
    );

    const { getActiveStudentId } = await import("../student-profile-storage");

    // Must fail closed — return null instead of dangling ID
    const result = getActiveStudentId();
    expect(result).toBeNull();
  });

  it("returns valid studentId when activeStudentId matches a profile", async () => {
    localStorageMock.setItem(
      "pre-utn.profiles.v1",
      JSON.stringify({
        profiles: [
          {
            studentId: "student-a",
            displayName: "Student A",
            createdAt: "2025-01-01T00:00:00.000Z",
            lastActiveAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        activeStudentId: "student-a", // valid — exists in profiles
      })
    );

    const { getActiveStudentId } = await import("../student-profile-storage");

    const result = getActiveStudentId();
    expect(result).toBe("student-a");
  });
});

describe("malformed Supabase env handling", () => {
  it("returns null when Supabase URL is malformed (not a valid URL)", async () => {
    // Reset module cache so the singleton doesn't carry over
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-valid-url");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");

    const { createBrowserClient } = await import("../supabase/browser");

    // Must not crash — returns null, signaling local fallback
    const client = createBrowserClient();
    expect(client).toBeNull();
  });

  it("returns null when Supabase key is empty string", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const { createBrowserClient } = await import("../supabase/browser");

    const client = createBrowserClient();
    expect(client).toBeNull();
  });
});

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

// ---------------------------------------------------------------------------
// BLOCKER 1: Production path wired through selector
// Public functions (loadProfiles, saveProfiles, etc.) must delegate through
// the configured adapter, not always use raw localStorage directly.
// ---------------------------------------------------------------------------

describe("BLOCKER: public functions delegate through configured adapter", () => {
  it("loadProfiles returns remote adapter data when adapter is configured", async () => {
    const { configurePersistenceAdapter, resetPersistenceAdapter } = await import(
      "../persistence/adapter-config"
    );
    const { loadProfiles } = await import("../student-profile-storage");

    // localStorage has "local-student"
    setActiveProfile("local-student");

    // Configure a remote adapter that returns "remote-student"
    const remoteAdapter = {
      loadProfiles: () => ({
        profiles: [
          {
            studentId: "remote-student",
            displayName: "Remote Student",
            createdAt: "2025-01-01T00:00:00.000Z",
            lastActiveAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        activeStudentId: "remote-student",
      }),
      saveProfiles: (state: never) => ({ ok: true, state }),
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
    configurePersistenceAdapter(remoteAdapter as never);

    const result = asSync(loadProfiles());
    // If wired: returns remote data ("remote-student")
    // If NOT wired: returns local data ("local-student")
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0].studentId).toBe("remote-student");

    resetPersistenceAdapter();
  });

  it("loadProfiles falls back to raw localStorage when no adapter configured", async () => {
    const { loadProfiles } = await import("../student-profile-storage");

    setActiveProfile("local-student");

    const result = asSync(loadProfiles());
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0].studentId).toBe("local-student");
  });

  it("saveProfiles delegates through configured adapter", async () => {
    const { configurePersistenceAdapter, resetPersistenceAdapter } = await import(
      "../persistence/adapter-config"
    );
    const { saveProfiles } = await import("../student-profile-storage");

    let remoteCalled = false;
    const remoteAdapter = {
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: (state: never) => {
        remoteCalled = true;
        return { ok: true, state };
      },
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
    configurePersistenceAdapter(remoteAdapter as never);

    const state = { profiles: [], activeStudentId: null };
    const result = asSync(saveProfiles(state));
    // If wired: remote adapter is called
    // If NOT wired: remoteCalled stays false
    expect(remoteCalled).toBe(true);
    expect(result.ok).toBe(true);

    resetPersistenceAdapter();
  });
});

// ---------------------------------------------------------------------------
// BLOCKER 2: No-session reads fall back to local
// Remote adapter returning no-session results for reads must trigger
// local fallback, not hide local data behind empty results.
// ---------------------------------------------------------------------------

describe("BLOCKER: no-session reads fall back to local", () => {
  // Helper: create a mock Supabase client with no auth session
  function createNoSessionMockClient() {
    let mockData: unknown = null;
    let mockListData: unknown[] | null = null;

    const chain = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      upsert: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      single: vi.fn(async () => ({ data: mockData, error: null })),
      maybeSingle: vi.fn(async () => ({ data: mockData, error: null })),
      then: (resolve: (value: unknown) => void) => {
        if (mockListData !== null) return resolve({ data: mockListData, error: null });
        return resolve({ data: mockData, error: null });
      },
    };

    const from = vi.fn(() => chain);
    const auth = {
      getSession: vi.fn(async () => ({
        data: { session: null }, // No session
        error: null,
      })),
    };

    return {
      client: { from, auth } as unknown,
      setMockData: (data: unknown) => { mockData = data; mockListData = null; },
      setMockListData: (data: unknown[]) => { mockListData = data; mockData = null; },
    };
  }

  it("falls back to local when remote loadProfiles has no session", async () => {
    setActiveProfile("local-student");

    const { createSupabaseAdapter } = await import("../persistence/supabase-adapter");
    const mock = createNoSessionMockClient();
    const remoteAdapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter,
    });

    const result = await adapter.loadProfiles();
    // Must fall back to local — which has "local-student"
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0].studentId).toBe("local-student");
  });

  it("falls back to local when remote loadProgress has no session", async () => {
    setActiveProfile("local-student");

    // Set up local progress data
    localStorageMock.setItem(
      "pre-utn.practice.v1",
      JSON.stringify({
        students: {
          "local-student": {
            attempts: [{ exerciseId: "ex-1", skillId: "mat.u1.fracciones", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1, studentId: "local-student" }],
            accuracyBySkill: { "mat.u1.fracciones": 1.0 },
            trendBySkill: {},
            lastPracticedBySkill: {},
            diagnosticResult: null,
            studyPlan: null,
          },
        },
        activeStudentId: "local-student",
      })
    );

    const { createSupabaseAdapter } = await import("../persistence/supabase-adapter");
    const mock = createNoSessionMockClient();
    mock.setMockData(null);
    const remoteAdapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter,
    });

    const result = await adapter.loadProgress("local-student");
    // Must fall back to local — which has 1 attempt
    expect(result.attempts).toHaveLength(1);
    expect(result.accuracyBySkill).toEqual({ "mat.u1.fracciones": 1.0 });
  });

  it("falls back to local when remote loadDiagnosticResult has no session", async () => {
    setActiveProfile("local-student");

    // Set up local diagnostic data
    localStorageMock.setItem(
      "pre-utn.diagnostic.v1",
      JSON.stringify({
        students: {
          "local-student": {
            completedAt: "2025-01-01T00:00:00.000Z",
            estimates: [],
            suggestions: [],
            version: 1,
          },
        },
        activeStudentId: "local-student",
      })
    );

    const { createSupabaseAdapter } = await import("../persistence/supabase-adapter");
    const mock = createNoSessionMockClient();
    mock.setMockData(null);
    const remoteAdapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter,
    });

    const result = await adapter.loadDiagnosticResult("local-student");
    // Must fall back to local — which has a diagnostic result
    expect(result).not.toBeNull();
    expect(result!.version).toBe(1);
  });

  it("falls back to local when remote loadStudyPlan has no session", async () => {
    setActiveProfile("local-student");

    // Set up local study plan data
    localStorageMock.setItem(
      "pre-utn.study-plan.v1",
      JSON.stringify({
        students: {
          "local-student": {
            createdAt: "2025-01-01T00:00:00.000Z",
            diagnosticResult: null,
            skillPriorities: [{ skillId: "mat.u1.fracciones", priority: 1, reason: "diagnostic-weak", weakConcepts: [] }],
          },
        },
        activeStudentId: "local-student",
      })
    );

    const { createSupabaseAdapter } = await import("../persistence/supabase-adapter");
    const mock = createNoSessionMockClient();
    mock.setMockData(null);
    const remoteAdapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter,
    });

    const result = await adapter.loadStudyPlan("local-student");
    // Must fall back to local — which has a study plan
    expect(result).not.toBeNull();
    expect(result!.skillPriorities).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// CRITICAL: Observability hook for fallback activation
// ---------------------------------------------------------------------------

describe("observability: onFallback callback", () => {
  it("calls onFallback when remote throws and falls back to local", async () => {
    setActiveProfile("local-student-a");

    const fallbackCalls: Array<{ method: string; error: unknown }> = [];
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
      onFallback: (method, error) => {
        fallbackCalls.push({ method, error });
      },
    });

    await adapter.loadProfiles();
    expect(fallbackCalls).toHaveLength(1);
    expect(fallbackCalls[0].method).toBe("loadProfiles");
  });

  it("calls onFallback when remote resolves with ok:false and falls back", async () => {
    setActiveProfile("local-student-a");

    const fallbackCalls: Array<{ method: string; error: unknown }> = [];
    const failingAdapter: PersistenceAdapter = {
      ...makeRemoteAdapter(),
      saveProgress: () => ({ ok: false as const, reason: "missing-active-profile" as const }),
    };

    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: failingAdapter,
      onFallback: (method, error) => {
        fallbackCalls.push({ method, error });
      },
    });

    await adapter.saveProgress("local-student-a", {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    });
    expect(fallbackCalls).toHaveLength(1);
    expect(fallbackCalls[0].method).toBe("saveProgress");
  });

  it("does NOT call onFallback when remote succeeds", async () => {
    setActiveProfile("local-student-a");

    const fallbackCalls: Array<{ method: string; error: unknown }> = [];
    const adapter = selectPersistenceAdapter({
      env: { url: "https://test.supabase.co", publishableKey: "test-key" },
      hasRemoteSession: true,
      remoteAdapter: makeRemoteAdapter(),
      onFallback: (method, error) => {
        fallbackCalls.push({ method, error });
      },
    });

    await adapter.loadProfiles();
    expect(fallbackCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// BLOCKER 1: Production initialization — initializePersistence()
// Tests that the production init function correctly wires the adapter
// based on real env vars and Supabase Auth session.
// ---------------------------------------------------------------------------

describe("BLOCKER 1: initializePersistence() production wiring", () => {
  it("configures adapter when env vars present AND Supabase session exists", async () => {
    vi.resetModules();

    // Mock env vars present
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    // Mock Supabase client with active session
    const mockClient = {
      auth: {
        getSession: vi.fn(async () => ({
          data: { session: { user: { id: "auth-user-1" } } },
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

    // Mock createBrowserClient to return our mock client
    vi.doMock("../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student");

    const { initializePersistence, getConfiguredAdapter, resetPersistenceAdapter } =
      await import("../persistence/adapter-config");

    await initializePersistence();

    // After init with env + session, adapter MUST be configured
    const adapter = getConfiguredAdapter();
    expect(adapter).not.toBeNull();

    resetPersistenceAdapter();
    vi.doUnmock("../supabase/browser");
  });

  it("leaves adapter null when Supabase env vars are missing", async () => {
    vi.resetModules();

    // No env vars
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const { initializePersistence, getConfiguredAdapter, resetPersistenceAdapter } =
      await import("../persistence/adapter-config");

    await initializePersistence();

    // Without env vars, adapter MUST remain null (local fallback)
    const adapter = getConfiguredAdapter();
    expect(adapter).toBeNull();

    resetPersistenceAdapter();
  });

  it("leaves adapter null when no Supabase Auth session exists", async () => {
    vi.resetModules();

    // Env vars present
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

    // Mock Supabase client with NO session
    const mockClient = {
      auth: {
        getSession: vi.fn(async () => ({
          data: { session: null },
          error: null,
        })),
      },
    };

    vi.doMock("../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    setActiveProfile("local-student");

    const { initializePersistence, getConfiguredAdapter, resetPersistenceAdapter } =
      await import("../persistence/adapter-config");

    await initializePersistence();

    // Without session, adapter MUST remain null (local fallback)
    const adapter = getConfiguredAdapter();
    expect(adapter).toBeNull();

    resetPersistenceAdapter();
    vi.doUnmock("../supabase/browser");
  });

  it("leaves adapter null when createBrowserClient returns null (malformed env)", async () => {
    vi.resetModules();

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-valid-url");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");

    // createBrowserClient returns null for malformed URL
    vi.doMock("../supabase/browser", () => ({
      createBrowserClient: () => null,
    }));

    const { initializePersistence, getConfiguredAdapter, resetPersistenceAdapter } =
      await import("../persistence/adapter-config");

    await initializePersistence();

    const adapter = getConfiguredAdapter();
    expect(adapter).toBeNull();

    resetPersistenceAdapter();
    vi.doUnmock("../supabase/browser");
  });
});

// ---------------------------------------------------------------------------
// BLOCKER 2: Async-aware public APIs
// Public storage functions must NOT discard Promise results from the adapter.
// When a remote adapter is configured, async results must be propagated.
// ---------------------------------------------------------------------------

describe("BLOCKER 2: public functions propagate async adapter results", () => {
  it("loadProfiles returns Promise when adapter returns async", async () => {
    const { configurePersistenceAdapter, resetPersistenceAdapter } = await import(
      "../persistence/adapter-config"
    );
    const { loadProfiles } = await import("../student-profile-storage");

    setActiveProfile("local-student");

    const asyncAdapter = {
      loadProfiles: () => Promise.resolve({
        profiles: [{
          studentId: "remote-student",
          displayName: "Remote",
          createdAt: "2025-01-01T00:00:00.000Z",
          lastActiveAt: "2025-01-01T00:00:00.000Z",
        }],
        activeStudentId: "remote-student",
      }),
      saveProfiles: () => ({ ok: true as const, state: { profiles: [], activeStudentId: null } }),
      loadProgress: () => Promise.resolve({
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      }),
      saveProgress: () => Promise.resolve({ ok: true as const, value: undefined as void }),
      loadDiagnosticResult: () => Promise.resolve(null),
      saveDiagnosticResult: () => Promise.resolve({ ok: true as const, value: undefined as void }),
      loadStudyPlan: () => Promise.resolve(null),
      saveStudyPlan: () => Promise.resolve({ ok: true as const, value: undefined as void }),
    };
    configurePersistenceAdapter(asyncAdapter as never);

    const result = loadProfiles();
    // MUST return the Promise, not discard it
    expect(result).toBeInstanceOf(Promise);
    const resolved = await (result as Promise<unknown>);
    expect((resolved as { profiles: unknown[] }).profiles).toHaveLength(1);
    expect((resolved as { profiles: Array<{ studentId: string }> }).profiles[0].studentId).toBe("remote-student");

    resetPersistenceAdapter();
  });

  it("saveProfiles returns Promise when adapter returns async", async () => {
    const { configurePersistenceAdapter, resetPersistenceAdapter } = await import(
      "../persistence/adapter-config"
    );
    const { saveProfiles } = await import("../student-profile-storage");

    setActiveProfile("local-student");

    const asyncAdapter = {
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: () => Promise.resolve({ ok: true as const, state: { profiles: [], activeStudentId: null } }),
      loadProgress: () => ({ attempts: [], accuracyBySkill: {}, trendBySkill: {}, lastPracticedBySkill: {}, diagnosticResult: null, studyPlan: null }),
      saveProgress: () => ({ ok: true as const, value: undefined as void }),
      loadDiagnosticResult: () => null,
      saveDiagnosticResult: () => ({ ok: true as const, value: undefined as void }),
      loadStudyPlan: () => null,
      saveStudyPlan: () => ({ ok: true as const, value: undefined as void }),
    };
    configurePersistenceAdapter(asyncAdapter as never);

    const result = saveProfiles({ profiles: [], activeStudentId: null });
    // MUST return the Promise, not discard it
    expect(result).toBeInstanceOf(Promise);
    const resolved = await (result as Promise<unknown>);
    expect((resolved as { ok: boolean }).ok).toBe(true);

    resetPersistenceAdapter();
  });

  it("loadProgress returns Promise when adapter returns async", async () => {
    const { configurePersistenceAdapter, resetPersistenceAdapter } = await import(
      "../persistence/adapter-config"
    );
    const { loadProgress } = await import("../practice-progress");

    setActiveProfile("local-student");

    const asyncAdapter = {
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: () => ({ ok: true as const, state: { profiles: [], activeStudentId: null } }),
      loadProgress: () => Promise.resolve({
        attempts: [{ exerciseId: "ex-remote", skillId: "mat.u1.fracciones", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1, studentId: "local-student" }],
        accuracyBySkill: { "mat.u1.fracciones": 1.0 },
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      }),
      saveProgress: () => ({ ok: true as const, value: undefined as void }),
      loadDiagnosticResult: () => null,
      saveDiagnosticResult: () => ({ ok: true as const, value: undefined as void }),
      loadStudyPlan: () => null,
      saveStudyPlan: () => ({ ok: true as const, value: undefined as void }),
    };
    configurePersistenceAdapter(asyncAdapter as never);

    const result = loadProgress();
    // MUST return the Promise, not discard it
    expect(result).toBeInstanceOf(Promise);
    const resolved = await (result as Promise<unknown>);
    expect((resolved as { attempts: unknown[] }).attempts).toHaveLength(1);

    resetPersistenceAdapter();
  });

  it("saveProgress returns Promise when adapter returns async", async () => {
    const { configurePersistenceAdapter, resetPersistenceAdapter } = await import(
      "../persistence/adapter-config"
    );
    const { saveProgress } = await import("../practice-progress");

    setActiveProfile("local-student");

    const asyncAdapter = {
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: () => ({ ok: true as const, state: { profiles: [], activeStudentId: null } }),
      loadProgress: () => ({ attempts: [], accuracyBySkill: {}, trendBySkill: {}, lastPracticedBySkill: {}, diagnosticResult: null, studyPlan: null }),
      saveProgress: () => Promise.resolve({ ok: true as const, value: undefined as void }),
      loadDiagnosticResult: () => null,
      saveDiagnosticResult: () => ({ ok: true as const, value: undefined as void }),
      loadStudyPlan: () => null,
      saveStudyPlan: () => ({ ok: true as const, value: undefined as void }),
    };
    configurePersistenceAdapter(asyncAdapter as never);

    const result = saveProgress({
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    });
    // MUST return the Promise, not discard it
    expect(result).toBeInstanceOf(Promise);
    const resolved = await (result as Promise<unknown>);
    expect((resolved as { ok: boolean }).ok).toBe(true);

    resetPersistenceAdapter();
  });

  it("addAttempt fires adapter saveProgress when adapter configured", async () => {
    const { configurePersistenceAdapter, resetPersistenceAdapter } = await import(
      "../persistence/adapter-config"
    );
    const { addAttempt } = await import("../practice-progress");

    setActiveProfile("local-student");

    let adapterSaveCalled = false;
    const asyncAdapter = {
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: () => ({ ok: true as const, state: { profiles: [], activeStudentId: null } }),
      loadProgress: () => ({ attempts: [], accuracyBySkill: {}, trendBySkill: {}, lastPracticedBySkill: {}, diagnosticResult: null, studyPlan: null }),
      saveProgress: (_sid: string, _progress: unknown) => {
        adapterSaveCalled = true;
        return Promise.resolve({ ok: true as const, value: undefined as void });
      },
      loadDiagnosticResult: () => null,
      saveDiagnosticResult: () => ({ ok: true as const, value: undefined as void }),
      loadStudyPlan: () => null,
      saveStudyPlan: () => ({ ok: true as const, value: undefined as void }),
    };
    configurePersistenceAdapter(asyncAdapter as never);

    const result = addAttempt({
      exerciseId: "ex-1",
      skillId: "mat.u1.fracciones" as never,
      correct: true,
      answeredAt: "2025-01-01T00:00:00.000Z",
      difficulty: 2 as never,
      timeMs: 1000,
      attemptIndex: 1,
    });

    // addAttempt returns sync (local save happened synchronously)
    expect(result.ok).toBe(true);

    // But the adapter save MUST have been fired (not discarded)
    // Wait a tick for the async fire-and-forget
    await new Promise((r) => setTimeout(r, 10));
    expect(adapterSaveCalled).toBe(true);

    resetPersistenceAdapter();
  });
});

// ---------------------------------------------------------------------------
// auth-sign-in-v0: Supabase SSR auth options for v0
// With auth-sign-in-v0 the browser client opts into cookie-based session
// storage via @supabase/ssr. `persistSession` MUST be true so reloads
// restore the session from cookies; `autoRefreshToken` MUST be true so
// the middleware can refresh expired access tokens; `detectSessionInUrl`
// MUST be true so /auth/callback can capture the magic-link code.
// ---------------------------------------------------------------------------

describe("auth-sign-in-v0: @supabase/ssr browser client auth options", () => {
  it("createBrowserClient uses @supabase/ssr with persistSession=true", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");

    let capturedOptions: Record<string, unknown> | null = null;
    vi.doMock("@supabase/ssr", () => ({
      createBrowserClient: (_url: string, _key: string, options: Record<string, unknown>) => {
        capturedOptions = options;
        return { auth: { getSession: vi.fn() } };
      },
    }));

    const { createBrowserClient } = await import("../supabase/browser");
    createBrowserClient();

    expect(capturedOptions).not.toBeNull();
    const auth = (capturedOptions as unknown as { auth: Record<string, unknown> }).auth;
    expect(auth.persistSession).toBe(true);
    expect(auth.autoRefreshToken).toBe(true);
    expect(auth.detectSessionInUrl).toBe(true);

    vi.doUnmock("@supabase/ssr");
  });
});
