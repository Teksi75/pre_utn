/**
 * Initialization race — proves storage APIs can await/chain the initialization
 * promise on first use when a remote session may exist.
 *
 * Design: "Storage APIs must be able to await/chain the initialization promise
 * on first use when a remote session may exist. Do not gate UI visually."
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { PracticeProgress } from "../../domain/progress/index";

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
// Helper: set up active profile
// ---------------------------------------------------------------------------

function setActiveProfile(studentId: string): void {
  localStorageMock.setItem(
    "pre-utn.profiles.v1",
    JSON.stringify({
      profiles: [{
        studentId,
        displayName: "Test Student",
        createdAt: "2025-01-01T00:00:00.000Z",
        lastActiveAt: "2025-01-01T00:00:00.000Z",
      }],
      activeStudentId: studentId,
    })
  );
}

// ---------------------------------------------------------------------------
// RED: Storage APIs await initialization promise
// ---------------------------------------------------------------------------

describe("initialization race: storage APIs await init promise", () => {
  it("loadProgress waits for initialization promise before checking adapter", async () => {
    setActiveProfile("local-student");

    // Set up local progress data
    localStorageMock.setItem(
      "pre-utn.practice.v1",
      JSON.stringify({
        students: {
          "local-student": {
            attempts: [{ exerciseId: "ex-local", skillId: "mat.u1.fracciones", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1, studentId: "local-student" }],
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

    // Simulate: initialization is still in progress (not yet resolved)
    // The init function will resolve AFTER loadProgress is called
    let resolveInit!: () => void;
    const initPromise = new Promise<void>((resolve) => { resolveInit = resolve; });

    vi.doMock("../supabase/browser", () => ({
      createBrowserClient: () => ({
        auth: {
          getSession: vi.fn(async () => ({
            data: { session: { user: { id: "auth-user-1" } } },
            error: null,
          })),
        },
      }),
    }));

    const { initializePersistence, loadProgressWhenReady } = await import("../persistence/adapter-config");

    // Start initialization (async, not yet resolved)
    const initResult = initializePersistence();

    // Call loadProgressWhenReady BEFORE init completes
    const progressPromise = loadProgressWhenReady();

    // Now resolve initialization
    resolveInit();
    await initResult;

    // loadProgressWhenReady should resolve AFTER init completes
    const result = await progressPromise;
    expect(result).toBeDefined();
    expect(Array.isArray(result.attempts)).toBe(true);

    vi.doUnmock("../supabase/browser");
  });

  it("loadProgressWhenReady returns local data when no init pending", async () => {
    setActiveProfile("local-student");

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

    const { loadProgressWhenReady } = await import("../persistence/adapter-config");

    // No initialization pending — should return local data immediately
    const result = await loadProgressWhenReady();
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].exerciseId).toBe("ex-1");
  });

  it("exposes getInitializationPromise for callers to chain on", async () => {
    const { getInitializationPromise } = await import("../persistence/adapter-config");

    // Initially null (no init started)
    const promise = getInitializationPromise();
    expect(promise).toBeNull();
  });

  it("getInitializationPromise returns promise after init starts", async () => {
    vi.doMock("../supabase/browser", () => ({
      createBrowserClient: () => ({
        auth: {
          getSession: vi.fn(async () => ({
            data: { session: null },
            error: null,
          })),
        },
      }),
    }));

    const { initializePersistence, getInitializationPromise, resetPersistenceAdapter } = await import("../persistence/adapter-config");

    // Start initialization
    const initResult = initializePersistence();

    // Now promise should be set
    const promise = getInitializationPromise();
    expect(promise).toBeInstanceOf(Promise);

    await initResult;
    resetPersistenceAdapter();
    vi.doUnmock("../supabase/browser");
  });

  // -------------------------------------------------------------------------
  // RED: Public loadProgress() races initialization — must await init
  // -------------------------------------------------------------------------

  it("loadProgress (public) returns Promise when initialization is pending", async () => {
    setActiveProfile("local-student");

    // Set up local progress data
    localStorageMock.setItem(
      "pre-utn.practice.v1",
      JSON.stringify({
        students: {
          "local-student": {
            attempts: [{ exerciseId: "ex-race", skillId: "mat.u1.fracciones", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1, studentId: "local-student" }],
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

    // Simulate: initialization takes time (not instant)
    let resolveSession!: () => void;
    const sessionPromise = new Promise<void>((resolve) => { resolveSession = resolve; });

    vi.doMock("../supabase/browser", () => ({
      createBrowserClient: () => ({
        auth: {
          getSession: vi.fn(async () => {
            await sessionPromise;
            return {
              data: { session: null },
              error: null,
            };
          }),
        },
      }),
    }));

    const { initializePersistence, resetPersistenceAdapter } = await import("../persistence/adapter-config");

    // Start initialization (async, not yet resolved because sessionPromise pending)
    const initResult = initializePersistence();

    // Call public loadProgress BEFORE init completes
    const { loadProgress } = await import("../practice-progress");
    const result = loadProgress();

    // The result should be a Promise when init is pending
    expect(result).toBeInstanceOf(Promise);

    // Now resolve the session and wait for init to complete
    resolveSession();
    await initResult;

    // The promise should resolve to local data (no remote session)
    const resolved = await result;
    expect(resolved.attempts).toHaveLength(1);
    expect(resolved.attempts[0].exerciseId).toBe("ex-race");

    resetPersistenceAdapter();
    vi.doUnmock("../supabase/browser");
  });

  it("loadProgress (public) returns sync result when no initialization pending", async () => {
    setActiveProfile("local-student");

    localStorageMock.setItem(
      "pre-utn.practice.v1",
      JSON.stringify({
        students: {
          "local-student": {
            attempts: [{ exerciseId: "ex-sync", skillId: "mat.u1.fracciones", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1, studentId: "local-student" }],
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

    const { loadProgress } = await import("../practice-progress");

    // No initialization pending — should return sync result
    const result = loadProgress();
    expect(result).not.toBeInstanceOf(Promise);
    expect((result as PracticeProgress).attempts).toHaveLength(1);
    expect((result as PracticeProgress).attempts[0].exerciseId).toBe("ex-sync");
  });

  // -------------------------------------------------------------------------
  // RED: Other public storage APIs also race initialization
  // -------------------------------------------------------------------------

  it("loadDiagnosticResult (public) returns Promise when initialization is pending", async () => {
    setActiveProfile("local-student");

    // Set up local diagnostic data
    localStorageMock.setItem(
      "pre-utn.diagnostic.v1",
      JSON.stringify({
        students: {
          "local-student": {
            completedAt: "2025-01-01T00:00:00.000Z",
            results: [{ skillId: "mat.u1.fracciones", level: "good" }],
          },
        },
        activeStudentId: "local-student",
      })
    );

    // Simulate: initialization takes time
    let resolveSession!: () => void;
    const sessionPromise = new Promise<void>((resolve) => { resolveSession = resolve; });

    vi.doMock("../supabase/browser", () => ({
      createBrowserClient: () => ({
        auth: {
          getSession: vi.fn(async () => {
            await sessionPromise;
            return { data: { session: null }, error: null };
          }),
        },
      }),
    }));

    const { initializePersistence, resetPersistenceAdapter } = await import("../persistence/adapter-config");

    // Start initialization
    const initResult = initializePersistence();

    // Call public loadDiagnosticResult BEFORE init completes
    const { loadDiagnosticResult } = await import("../diagnostic-storage");
    const result = loadDiagnosticResult();

    // Should be a Promise when init is pending
    expect(result).toBeInstanceOf(Promise);

    // Resolve and wait
    resolveSession();
    await initResult;

    const resolved = await result;
    expect(resolved).not.toBeNull();
    expect(resolved!.completedAt).toBe("2025-01-01T00:00:00.000Z");

    resetPersistenceAdapter();
    vi.doUnmock("../supabase/browser");
  });

  it("loadStudyPlan (public) returns Promise when initialization is pending", async () => {
    setActiveProfile("local-student");

    // Set up local study plan data
    localStorageMock.setItem(
      "pre-utn.study-plan.v1",
      JSON.stringify({
        students: {
          "local-student": {
            createdAt: "2025-01-01T00:00:00.000Z",
            skillPriorities: [{ skillId: "mat.u1.fracciones", priority: 1 }],
          },
        },
        activeStudentId: "local-student",
      })
    );

    // Simulate: initialization takes time
    let resolveSession!: () => void;
    const sessionPromise = new Promise<void>((resolve) => { resolveSession = resolve; });

    vi.doMock("../supabase/browser", () => ({
      createBrowserClient: () => ({
        auth: {
          getSession: vi.fn(async () => {
            await sessionPromise;
            return { data: { session: null }, error: null };
          }),
        },
      }),
    }));

    const { initializePersistence, resetPersistenceAdapter } = await import("../persistence/adapter-config");

    // Start initialization
    const initResult = initializePersistence();

    // Call public loadStudyPlan BEFORE init completes
    const { loadStudyPlan } = await import("../diagnostic-storage");
    const result = loadStudyPlan();

    // Should be a Promise when init is pending
    expect(result).toBeInstanceOf(Promise);

    // Resolve and wait
    resolveSession();
    await initResult;

    const resolved = await result;
    expect(resolved).not.toBeNull();
    expect(resolved!.skillPriorities).toHaveLength(1);

    resetPersistenceAdapter();
    vi.doUnmock("../supabase/browser");
  });

  it("loadProfiles (public) returns Promise when initialization is pending", async () => {
    setActiveProfile("local-student");

    // Simulate: initialization takes time
    let resolveSession!: () => void;
    const sessionPromise = new Promise<void>((resolve) => { resolveSession = resolve; });

    vi.doMock("../supabase/browser", () => ({
      createBrowserClient: () => ({
        auth: {
          getSession: vi.fn(async () => {
            await sessionPromise;
            return { data: { session: null }, error: null };
          }),
        },
      }),
    }));

    const { initializePersistence, resetPersistenceAdapter } = await import("../persistence/adapter-config");

    // Start initialization
    const initResult = initializePersistence();

    // Call public loadProfiles BEFORE init completes
    const { loadProfiles } = await import("../student-profile-storage");
    const result = loadProfiles();

    // Should be a Promise when init is pending
    expect(result).toBeInstanceOf(Promise);

    // Resolve and wait
    resolveSession();
    await initResult;

    const resolved = await result;
    expect(resolved.profiles).toHaveLength(1);
    expect(resolved.profiles[0].displayName).toBe("Test Student");

    resetPersistenceAdapter();
    vi.doUnmock("../supabase/browser");
  });
});
