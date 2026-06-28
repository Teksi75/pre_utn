/**
 * Characterization tests for src/lib/persistence/supabase-adapter.ts
 * loadProgress() empty-progress semantics.
 *
 * Invariant under test (REQ-NEW-2c, supabase-adapter-v0 §"Remote Student
 * Persistence", §"Adapter tests preserve invariants"):
 *
 *   "EMPTY_PROGRESS from remote is not destructive" — the Supabase
 *    adapter MUST return a recoverable empty sentinel (EMPTY_PROGRESS)
 *    when the remote row is missing or its practice_progress column is
 *    absent. It MUST NOT collapse EMPTY_PROGRESS into null or an error,
 *    so downstream consumers (selector, probe-remote) can detect "empty
 *    but available" vs "remote unavailable" vs "real data".
 *
 * Companion scenario: when the remote is empty but local has real
 * student evidence, the selector's `withLocalFallback` MUST prefer the
 * local slice (see selector.test.ts). These two tests together prove the
 * non-destructiveness invariant end-to-end.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PROFILES_STORAGE_KEY } from "../../student-profile-storage";

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
          displayName: "Ana",
          createdAt: "t0",
          lastActiveAt: "t0",
        },
      ],
      activeStudentId: studentId,
    })
  );
}

const EMPTY_PROGRESS = expect.objectContaining({
  attempts: [],
  accuracyBySkill: {},
  trendBySkill: {},
  lastPracticedBySkill: {},
  diagnosticResult: null,
  studyPlan: null,
});

function makeSupabaseClient(
  session: unknown,
  fromImpl: (table: string) => unknown
) {
  return {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session },
        error: null,
      })),
    },
    from: vi.fn((table: string) => fromImpl(table)),
  };
}

describe("supabase-adapter loadProgress — EMPTY_PROGRESS is preserved (not canonical)", () => {
  it("missing row (data null) → returns EMPTY_PROGRESS, NOT null/error", async () => {
    setActiveProfile("student-1");

    const client = makeSupabaseClient(
      { user: { id: "auth-user-1" } },
      () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      })
    );

    const { createSupabaseAdapter } = await import("../supabase-adapter");
    const adapter = createSupabaseAdapter(client as never);

    const result = await adapter.loadProgress("student-1");

    expect(result).toEqual({
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    });
  });

  it("row exists with practice_progress = null → returns EMPTY_PROGRESS, NOT null/error", async () => {
    setActiveProfile("student-1");

    const client = makeSupabaseClient(
      { user: { id: "auth-user-1" } },
      () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { practice_progress: null, student_id: "student-1" },
                error: null,
              }),
            }),
          }),
        }),
      })
    );

    const { createSupabaseAdapter } = await import("../supabase-adapter");
    const adapter = createSupabaseAdapter(client as never);

    const result = await adapter.loadProgress("student-1");

    expect(result).toEqual({
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    });
  });

  it("PGRST116 not-found error → returns EMPTY_PROGRESS, NOT throw", async () => {
    setActiveProfile("student-1");

    const notFoundError = { code: "PGRST116", message: "not found" };
    const client = makeSupabaseClient(
      { user: { id: "auth-user-1" } },
      () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: notFoundError }),
            }),
          }),
        }),
      })
    );

    const { createSupabaseAdapter } = await import("../supabase-adapter");
    const adapter = createSupabaseAdapter(client as never);

    const result = await adapter.loadProgress("student-1");

    expect(result.attempts).toEqual([]);
    expect(result.diagnosticResult).toBeNull();
  });

  it("studentId mismatch (active != requested) → returns EMPTY_PROGRESS, fail-closed", async () => {
    // Active profile is student-1, request comes for student-2.
    setActiveProfile("student-1");

    const client = makeSupabaseClient(
      { user: { id: "auth-user-1" } },
      () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      })
    );

    const { createSupabaseAdapter } = await import("../supabase-adapter");
    const adapter = createSupabaseAdapter(client as never);

    const result = await adapter.loadProgress("student-2");

    expect(result).toEqual({
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    });
  });

  it("row exists with REAL practice_progress → returns real data, NOT EMPTY_PROGRESS", async () => {
    setActiveProfile("student-1");

    const realProgress = {
      attempts: [
        {
          exerciseId: "ex.u1.reales.1",
          skillId: "mat.u1.propiedades_operaciones_reales",
          correct: true,
          answeredAt: "2026-06-26T12:00:00.000Z",
          timeMs: 1200,
          attemptIndex: 1,
        },
      ],
      accuracyBySkill: { "mat.u1.propiedades_operaciones_reales": 1 },
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    };

    const client = makeSupabaseClient(
      { user: { id: "auth-user-1" } },
      () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { practice_progress: realProgress, student_id: "student-1" },
                error: null,
              }),
            }),
          }),
        }),
      })
    );

    const { createSupabaseAdapter } = await import("../supabase-adapter");
    const adapter = createSupabaseAdapter(client as never);

    const result = await adapter.loadProgress("student-1");

    expect(result.attempts.length).toBe(1);
    expect(result.attempts[0].exerciseId).toBe("ex.u1.reales.1");
  });
});