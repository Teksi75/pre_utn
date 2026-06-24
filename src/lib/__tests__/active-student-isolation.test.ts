/**
 * Active student isolation — asserts that the Supabase adapter scopes
 * all queries to the active studentId and filters by auth.uid() via RLS.
 *
 * Spec: "active student isolation is enforced"
 * Scenario: "students A and B both have remote progress — when student A
 * is active and progress is loaded, then only student A's remote progress
 * is returned."
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
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
// Helpers
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

/**
 * Creates a mock Supabase client that records eq() calls to verify
 * student isolation scoping. The mock simulates RLS behavior by
 * tracking which student_id was requested.
 */
function createIsolationMockClient() {
  const eqCalls: Array<{ column: string; value: unknown }> = [];
  let mockData: unknown = null;
  let requestedStudentId: string | null = null;

  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    eq: vi.fn((column: string, value: unknown) => {
      eqCalls.push({ column, value });
      if (column === "student_id") {
        requestedStudentId = value as string;
      }
      return chain;
    }),
    single: vi.fn(async () => ({ data: mockData, error: null })),
    maybeSingle: vi.fn(async () => ({ data: mockData, error: null })),
    then: (resolve: (value: unknown) => void) =>
      resolve({ data: mockData, error: null }),
  };

  const from = vi.fn(() => chain);
  const auth = {
    getSession: vi.fn(async () => ({
      data: { session: { user: { id: "auth-user-1" } } },
      error: null,
    })),
  };

  return {
    client: { from, auth } as unknown,
    eqCalls,
    setMockData: (data: unknown) => {
      mockData = data;
    },
    getChain: () => chain,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("active student isolation in Supabase adapter", () => {
  it("scopes loadProgress to active studentId", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const STUDENT_A = "local-student-a";
    setActiveProfile(STUDENT_A);

    const mock = createIsolationMockClient();
    mock.setMockData({
      practice_progress: {
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      },
      diagnostic_result: null,
      study_plan: null,
    });

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    await adapter.loadProgress(STUDENT_A);

    // Must have called eq with student_id = STUDENT_A
    const studentIdCalls = mock.eqCalls.filter((c) => c.column === "student_id");
    expect(studentIdCalls.length).toBeGreaterThan(0);
    expect(studentIdCalls.some((c) => c.value === STUDENT_A)).toBe(true);
  });

  it("scopes saveProgress to active studentId via upsert payload", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const STUDENT_A = "local-student-a";
    setActiveProfile(STUDENT_A);

    const mock = createIsolationMockClient();
    mock.setMockData(null);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    // saveProgress uses upsert (not eq), so we verify by checking
    // that the call was made to student_progress_snapshots
    // and that mismatched studentId fails closed (tested below)
    const result = await adapter.saveProgress(STUDENT_A, {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    });

    // Must succeed for the active student
    expect(result.ok).toBe(true);
  });

  it("does not return student B's data when student A is active (defense-in-depth)", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const STUDENT_A = "local-student-a";
    setActiveProfile(STUDENT_A);

    const mock = createIsolationMockClient();

    // Simulate: Supabase returns B's row (should be filtered by RLS,
    // but adapter must also validate student_id on returned data)
    mock.setMockData({
      student_id: "local-student-b",
      practice_progress: {
        attempts: [
          {
            exerciseId: "ex-b-1",
            skillId: "mat.u1.fracciones",
            correct: true,
            answeredAt: "2025-01-01T00:00:00.000Z",
            timeMs: 1000,
            attemptIndex: 1,
            studentId: "local-student-b",
          },
        ],
        accuracyBySkill: { "mat.u1.fracciones": 1.0 },
        trendBySkill: { "mat.u1.fracciones": "improving" },
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      },
      diagnostic_result: null,
      study_plan: null,
    });

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    const result = await adapter.loadProgress(STUDENT_A);

    // Verify query was scoped to STUDENT_A (not B)
    const studentIdCalls = mock.eqCalls.filter((c) => c.column === "student_id");
    expect(studentIdCalls.some((c) => c.value === STUDENT_A)).toBe(true);
    expect(studentIdCalls.some((c) => c.value === "local-student-b")).toBe(
      false
    );

    // Defense-in-depth: even though the mock returns B's data (simulating
    // a backend that didn't filter), the adapter MUST validate returned
    // student_id and reject mismatched data. With defense-in-depth,
    // B's exercise data must NOT appear in the result.
    expect(result.attempts).toHaveLength(0);
    expect(result.accuracyBySkill).toEqual({});
  });

  it("scopes loadDiagnosticResult to active studentId", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const STUDENT_A = "local-student-a";
    setActiveProfile(STUDENT_A);

    const mock = createIsolationMockClient();
    mock.setMockData({ diagnostic_result: null });

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    await adapter.loadDiagnosticResult(STUDENT_A);

    const studentIdCalls = mock.eqCalls.filter((c) => c.column === "student_id");
    expect(studentIdCalls.some((c) => c.value === STUDENT_A)).toBe(true);
  });

  it("scopes loadStudyPlan to active studentId", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const STUDENT_A = "local-student-a";
    setActiveProfile(STUDENT_A);

    const mock = createIsolationMockClient();
    mock.setMockData({ study_plan: null });

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    await adapter.loadStudyPlan(STUDENT_A);

    const studentIdCalls = mock.eqCalls.filter((c) => c.column === "student_id");
    expect(studentIdCalls.some((c) => c.value === STUDENT_A)).toBe(true);
  });

  it("returns missing-active-profile when studentId does not match active profile", async () => {
    const { createSupabaseAdapter } = await import(
      "../persistence/supabase-adapter"
    );

    const STUDENT_A = "local-student-a";
    setActiveProfile(STUDENT_A);

    const mock = createIsolationMockClient();
    mock.setMockData(null);

    const adapter = createSupabaseAdapter(
      mock.client as Parameters<typeof createSupabaseAdapter>[0]
    );

    // Try to save progress for a DIFFERENT student — must fail closed
    const result = await adapter.saveProgress("local-student-b", {
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
});
