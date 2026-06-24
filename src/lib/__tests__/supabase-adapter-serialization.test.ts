/**
 * Supabase adapter serialization — round-trip tests for domain types
 * through the Supabase persistence adapter.
 *
 * Spec: "When Supabase is configured, the system MUST persist student
 * profiles and progress remotely through row-level student isolation."
 *
 * These tests verify that domain types survive serialization through
 * the adapter without data loss.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type {
  ProfilesState,
  StudentProfile,
  PracticeProgress,
  DiagnosticResult,
  StudyPlan,
} from "../persistence/port";
import { PROFILES_STORAGE_KEY } from "../student-profile-storage";

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
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
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

const STUDENT_ID = "local-test-student";

const SAMPLE_PROFILE: StudentProfile = {
  studentId: STUDENT_ID,
  displayName: "Juan Pérez",
  createdAt: "2025-06-01T10:00:00.000Z",
  lastActiveAt: "2025-06-15T14:30:00.000Z",
};

const SAMPLE_PROFILES_STATE: ProfilesState = {
  profiles: [SAMPLE_PROFILE],
  activeStudentId: STUDENT_ID,
};

const SAMPLE_PROGRESS: PracticeProgress = {
  attempts: [
    {
      exerciseId: "ex.u1.fracciones.1",
      skillId: "mat.u1.fracciones" as never,
      correct: true,
      errorTag: undefined,
      answeredAt: "2025-06-10T09:00:00.000Z",
      difficulty: 2 as never,
      timeMs: 15000,
      attemptIndex: 1,
      studentId: STUDENT_ID,
    },
    {
      exerciseId: "ex.u1.fracciones.2",
      skillId: "mat.u1.fracciones" as never,
      correct: false,
      errorTag: "u2_signo_factorizacion",
      answeredAt: "2025-06-10T09:05:00.000Z",
      difficulty: 3 as never,
      timeMs: 25000,
      attemptIndex: 1,
      studentId: STUDENT_ID,
    },
  ],
  accuracyBySkill: { "mat.u1.fracciones": 0.5 },
  trendBySkill: { "mat.u1.fracciones": "stable" },
  lastPracticedBySkill: { "mat.u1.fracciones": "2025-06-10T09:05:00.000Z" },
  diagnosticResult: {
    completedAt: "2025-06-01T10:30:00.000Z",
    estimates: [
      { skillId: "mat.u1.fracciones" as never, accuracy: 0.7, attempts: 3, provisional: true as const, errorTags: [] },
      { skillId: "mat.u1.intervalos" as never, accuracy: 0.3, attempts: 2, provisional: true as const, errorTags: ["u1_intervalos_error"] },
    ],
    suggestions: [
      { skillId: "mat.u1.intervalos" as never, accuracy: 0.3, errorTags: ["u1_intervalos_error"] },
    ],
    version: 1 as const,
  },
  studyPlan: {
    createdAt: "2025-06-01T10:31:00.000Z",
    diagnosticResult: {
      completedAt: "2025-06-01T10:30:00.000Z",
      estimates: [],
      suggestions: [],
      version: 1 as const,
    },
    skillPriorities: [
      { skillId: "mat.u1.intervalos" as never, priority: 1, reason: "diagnostic-weak" as const, weakConcepts: ["u1_intervalos_error"] },
    ],
  },
};

const SAMPLE_DIAGNOSTIC: DiagnosticResult = {
  completedAt: "2025-06-01T10:30:00.000Z",
  estimates: [
    { skillId: "mat.u1.fracciones" as never, accuracy: 0.8, attempts: 5, provisional: true as const, errorTags: [] },
    { skillId: "mat.u1.conjuntos_numericos" as never, accuracy: 0.4, attempts: 3, provisional: true as const, errorTags: ["conjuntos_error"] },
  ],
  suggestions: [
    {
      skillId: "mat.u1.conjuntos_numericos" as never,
      accuracy: 0.4,
      errorTags: ["conjuntos_error"],
    },
  ],
  version: 1 as const,
};

const SAMPLE_STUDY_PLAN: StudyPlan = {
  createdAt: "2025-06-01T10:31:00.000Z",
  diagnosticResult: SAMPLE_DIAGNOSTIC,
  skillPriorities: [
    { skillId: "mat.u1.conjuntos_numericos" as never, priority: 1, reason: "diagnostic-weak" as const, weakConcepts: ["conjuntos_error"] },
    { skillId: "mat.u1.fracciones" as never, priority: 2, reason: "not-attempted" as const, weakConcepts: [] },
  ],
};

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

/**
 * Creates a fake Supabase client that records calls and returns
 * configurable results. Used to test the adapter's serialization
 * without a real Supabase connection.
 */
function createMockSupabaseClient() {
  const calls: Array<{ method: string; table: string; args: unknown[] }> = [];
  let mockData: unknown = null;
  let mockError: unknown = null;
  let mockListData: unknown[] | null = null;

  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(async () => {
      if (mockError) return { data: null, error: mockError };
      return { data: mockData, error: null };
    }),
    maybeSingle: vi.fn(async () => {
      if (mockError) return { data: null, error: mockError };
      return { data: mockData, error: null };
    }),
    then: (resolve: (value: unknown) => void) => {
      if (mockError) return resolve({ data: null, error: mockError });
      // If listData is set, return array (for .select() without .single())
      if (mockListData !== null) return resolve({ data: mockListData, error: null });
      return resolve({ data: mockData, error: null });
    },
  };

  const from = vi.fn((table: string) => {
    calls.push({ method: "from", table, args: [table] });
    return chain;
  });

  const auth = {
    getSession: vi.fn(async () => ({
      data: {
        session: {
          user: { id: "test-auth-user-id" },
        },
      },
      error: null,
    })),
  };

  return {
    client: { from, auth } as unknown,
    calls,
    setMockData: (data: unknown) => {
      mockData = data;
      mockListData = null;
      mockError = null;
    },
    setMockListData: (data: unknown[]) => {
      mockListData = data;
      mockData = null;
      mockError = null;
    },
    setMockError: (error: unknown) => {
      mockError = error;
      mockData = null;
      mockListData = null;
    },
    getChain: () => chain,
    getAuth: () => auth,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("supabase adapter serialization round-trip", () => {
  it("adapter module exists and exports createSupabaseAdapter", async () => {
    const mod = await import("../persistence/supabase-adapter");
    expect(typeof mod.createSupabaseAdapter).toBe("function");
  });

  it("createSupabaseAdapter returns a valid PersistenceAdapter", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );
    const { isPersistenceAdapter } = await import("../persistence/port");

    const mock = createMockSupabaseClient();
    setActiveProfile(STUDENT_ID);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );
    expect(isPersistenceAdapter(adapter)).toBe(true);
  });

  it("saveProfiles sends serialized profiles to Supabase", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const mock = createMockSupabaseClient();
    mock.setMockData(null); // No existing row
    setActiveProfile(STUDENT_ID);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const result = await adapter.saveProfiles(SAMPLE_PROFILES_STATE);
    expect(result.ok).toBe(true);
    // Verify that the adapter called from() with student_profiles
    expect(mock.calls.some((c) => c.table === "student_profiles")).toBe(true);

    // Payload assertion: verify the upsert was called with correct data
    const chain = mock.getChain();
    expect(chain.upsert).toHaveBeenCalled();
    const upsertArgs = (chain.upsert.mock.calls as unknown[][])[0]?.[0] as Record<string, unknown> | undefined;
    expect(upsertArgs).toBeDefined();
    expect(upsertArgs!.student_id).toBe(STUDENT_ID);
    expect(upsertArgs!.display_name).toBe("Juan Pérez");
  });

  it("saveProgress sends serialized progress to Supabase", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const mock = createMockSupabaseClient();
    mock.setMockData(null);
    setActiveProfile(STUDENT_ID);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const result = await adapter.saveProgress(STUDENT_ID, SAMPLE_PROGRESS);
    expect(result.ok).toBe(true);
    expect(
      mock.calls.some((c) => c.table === "student_progress_snapshots")
    ).toBe(true);

    // Payload assertion: verify the upsert contains the progress data
    const chain = mock.getChain();
    expect(chain.upsert).toHaveBeenCalled();
    const upsertArgs = (chain.upsert.mock.calls as unknown[][])[0]?.[0] as Record<string, unknown> | undefined;
    expect(upsertArgs).toBeDefined();
    const progress = upsertArgs!.practice_progress as Record<string, unknown>;
    expect(progress.attempts).toHaveLength(2);
    expect(progress.accuracyBySkill).toEqual({ "mat.u1.fracciones": 0.5 });
    expect(upsertArgs!.student_id).toBe(STUDENT_ID);
  });

  it("saveDiagnosticResult sends serialized diagnostic to Supabase", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const mock = createMockSupabaseClient();
    mock.setMockData(null);
    setActiveProfile(STUDENT_ID);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const result = await adapter.saveDiagnosticResult(
      STUDENT_ID,
      SAMPLE_DIAGNOSTIC
    );
    expect(result.ok).toBe(true);
    expect(
      mock.calls.some((c) => c.table === "student_progress_snapshots")
    ).toBe(true);

    // Payload assertion: verify the upsert contains the diagnostic data
    const chain = mock.getChain();
    expect(chain.upsert).toHaveBeenCalled();
    const upsertArgs = (chain.upsert.mock.calls as unknown[][])[0]?.[0] as Record<string, unknown> | undefined;
    expect(upsertArgs).toBeDefined();
    expect(upsertArgs!.student_id).toBe(STUDENT_ID);
    const diag = upsertArgs!.diagnostic_result as Record<string, unknown>;
    expect(diag).toBeDefined();
    expect(diag.version).toBe(1);
    expect(Array.isArray(diag.estimates)).toBe(true);
    expect(diag.completedAt).toBe("2025-06-01T10:30:00.000Z");
  });

  it("saveStudyPlan sends serialized study plan to Supabase", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const mock = createMockSupabaseClient();
    mock.setMockData(null);
    setActiveProfile(STUDENT_ID);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const result = await adapter.saveStudyPlan(STUDENT_ID, SAMPLE_STUDY_PLAN);
    expect(result.ok).toBe(true);
    expect(
      mock.calls.some((c) => c.table === "student_progress_snapshots")
    ).toBe(true);

    // Payload assertion: verify the upsert contains the study plan data
    const chain = mock.getChain();
    expect(chain.upsert).toHaveBeenCalled();
    const upsertArgs = (chain.upsert.mock.calls as unknown[][])[0]?.[0] as Record<string, unknown> | undefined;
    expect(upsertArgs).toBeDefined();
    expect(upsertArgs!.student_id).toBe(STUDENT_ID);
    const plan = upsertArgs!.study_plan as Record<string, unknown>;
    expect(plan).toBeDefined();
    expect(plan.createdAt).toBe("2025-06-01T10:31:00.000Z");
    expect(Array.isArray(plan.skillPriorities)).toBe(true);
    expect(plan.skillPriorities).toHaveLength(2);
  });

  it("loadProfiles returns deserialized profiles from Supabase", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const mock = createMockSupabaseClient();
    mock.setMockListData([
      {
        student_id: STUDENT_ID,
        display_name: "Juan Pérez",
        created_at: "2025-06-01T10:00:00.000Z",
        last_active_at: "2025-06-15T14:30:00.000Z",
      },
    ]);
    setActiveProfile(STUDENT_ID);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const result = await adapter.loadProfiles();
    expect(result.profiles).toBeDefined();
    expect(Array.isArray(result.profiles)).toBe(true);
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0].studentId).toBe(STUDENT_ID);
    expect(result.profiles[0].displayName).toBe("Juan Pérez");
  });

  it("loadProgress returns deserialized progress with deep equality from Supabase", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const mock = createMockSupabaseClient();
    mock.setMockData({
      practice_progress: JSON.parse(JSON.stringify(SAMPLE_PROGRESS)),
      student_id: STUDENT_ID,
      diagnostic_result: null,
      study_plan: null,
    });
    setActiveProfile(STUDENT_ID);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const result = await adapter.loadProgress(STUDENT_ID);
    // Deep equality: all fields must round-trip losslessly
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts[0].exerciseId).toBe("ex.u1.fracciones.1");
    expect(result.attempts[0].correct).toBe(true);
    expect(result.attempts[1].exerciseId).toBe("ex.u1.fracciones.2");
    expect(result.attempts[1].errorTag).toBe("u2_signo_factorizacion");
    expect(result.accuracyBySkill).toEqual({ "mat.u1.fracciones": 0.5 });
    expect(result.trendBySkill).toEqual({ "mat.u1.fracciones": "stable" });
    expect(result.lastPracticedBySkill).toEqual({ "mat.u1.fracciones": "2025-06-10T09:05:00.000Z" });
    expect(result.diagnosticResult).not.toBeNull();
    expect(result.diagnosticResult!.version).toBe(1);
    expect(result.diagnosticResult!.estimates).toHaveLength(2);
    expect(result.studyPlan).not.toBeNull();
    expect(result.studyPlan!.skillPriorities).toHaveLength(1);
  });

  it("loadDiagnosticResult returns deserialized diagnostic with deep equality from Supabase", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const mock = createMockSupabaseClient();
    mock.setMockData({
      diagnostic_result: JSON.parse(JSON.stringify(SAMPLE_DIAGNOSTIC)),
      student_id: STUDENT_ID,
    });
    setActiveProfile(STUDENT_ID);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const result = await adapter.loadDiagnosticResult(STUDENT_ID);
    expect(result).not.toBeNull();
    // Deep equality: all diagnostic fields must round-trip
    expect(result!.version).toBe(1);
    expect(result!.completedAt).toBe("2025-06-01T10:30:00.000Z");
    expect(result!.estimates).toHaveLength(2);
    expect(result!.estimates[0].skillId).toBe("mat.u1.fracciones");
    expect(result!.estimates[0].accuracy).toBe(0.8);
    expect(result!.estimates[1].skillId).toBe("mat.u1.conjuntos_numericos");
    expect(result!.estimates[1].errorTags).toEqual(["conjuntos_error"]);
    expect(result!.suggestions).toHaveLength(1);
    expect(result!.suggestions[0].skillId).toBe("mat.u1.conjuntos_numericos");
  });

  it("loadStudyPlan returns deserialized study plan with deep equality from Supabase", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const mock = createMockSupabaseClient();
    mock.setMockData({
      study_plan: JSON.parse(JSON.stringify(SAMPLE_STUDY_PLAN)),
      student_id: STUDENT_ID,
    });
    setActiveProfile(STUDENT_ID);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const result = await adapter.loadStudyPlan(STUDENT_ID);
    expect(result).not.toBeNull();
    // Deep equality: all study plan fields must round-trip
    expect(result!.createdAt).toBe("2025-06-01T10:31:00.000Z");
    expect(result!.skillPriorities).toHaveLength(2);
    expect(result!.skillPriorities[0].skillId).toBe("mat.u1.conjuntos_numericos");
    expect(result!.skillPriorities[0].priority).toBe(1);
    expect(result!.skillPriorities[0].reason).toBe("diagnostic-weak");
    expect(result!.skillPriorities[0].weakConcepts).toEqual(["conjuntos_error"]);
    expect(result!.skillPriorities[1].skillId).toBe("mat.u1.fracciones");
    expect(result!.skillPriorities[1].reason).toBe("not-attempted");
    expect(result!.diagnosticResult).not.toBeNull();
    expect(result!.diagnosticResult!.version).toBe(1);
  });
});

describe("supabase adapter error handling", () => {
  it("returns recoverable result when Supabase returns PGRST116 (not found)", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const mock = createMockSupabaseClient();
    mock.setMockError({ code: "PGRST116", message: "Not found" });
    setActiveProfile(STUDENT_ID);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const result = await adapter.loadProgress(STUDENT_ID);
    // Must not throw — returns recoverable result
    expect(result).toBeDefined();
    expect(result.attempts).toBeDefined();
  });

  it("returns ok:false when Supabase network fails on save", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const mock = createMockSupabaseClient();
    mock.setMockError(new Error("Network error"));
    setActiveProfile(STUDENT_ID);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const result = await adapter.saveProgress(STUDENT_ID, SAMPLE_PROGRESS);
    expect(result.ok).toBe(false);
  });

  it("returns ok:false when no auth session exists", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const mock = createMockSupabaseClient();
    // Override the auth.getSession to return no session
    const auth = mock.getAuth();
    auth.getSession = vi.fn(async () => ({
      data: { session: null },
      error: null,
    })) as never;
    setActiveProfile(STUDENT_ID);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const result = await adapter.saveProfiles(SAMPLE_PROFILES_STATE);
    expect(result.ok).toBe(false);
  });
});
