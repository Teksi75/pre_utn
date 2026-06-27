/**
 * Tests for src/lib/auth/has-local-progress.ts — hasLocalProgress()
 *
 * Verifies the predicate that powers the linking-vs-new-student branch
 * on `/cuenta/ingresar` and the import branch in the SIGNED_IN orchestrator.
 *
 * Contract (REQ-NEW-2a, REQ-NEW-2b):
 * - null / unknown profileId → false
 * - profileId does NOT match active profile → false (defensive; raw loaders
 *   can only read the active student's slot)
 * - profileId matches AND raw loaders report any of: non-empty attempts[],
 *   non-null diagnostic, non-null study plan → true
 * - profileId matches AND all three raw loaders return empty/null → false
 *
 * Implementation OR-reduces the three raw local loaders so we do not have
 * to inspect localStorage directly. The raw loaders already swallow
 * missing-key and corrupt-JSON cases.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PROFILES_STORAGE_KEY } from "../../student-profile-storage";
import { PRACTICE_STORAGE_KEY } from "../../practice-progress";
import { DIAGNOSTIC_STORAGE_KEY } from "../../diagnostic-storage";
import { STUDY_PLAN_STORAGE_KEY } from "../../diagnostic-storage";

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

function setActiveProfile(studentId: string, displayName = "Ana"): void {
  localStorageMock.setItem(
    PROFILES_STORAGE_KEY,
    JSON.stringify({
      profiles: [{ studentId, displayName, createdAt: "t0", lastActiveAt: "t0" }],
      activeStudentId: studentId,
    }),
  );
}

function setProgressFor(studentId: string, attempts: unknown[]): void {
  const existing = localStorageMock.getItem(PRACTICE_STORAGE_KEY);
  const parsed: { students?: Record<string, unknown> } = existing
    ? JSON.parse(existing)
    : { students: {} };
  const map = {
    students: {
      ...(parsed.students ?? {}),
      [studentId]: {
        attempts,
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      },
    },
    activeStudentId: studentId,
  };
  localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(map));
}

function setDiagnosticFor(studentId: string, value: unknown | null): void {
  const existing = localStorageMock.getItem(DIAGNOSTIC_STORAGE_KEY);
  const parsed: { students?: Record<string, unknown> } = existing
    ? JSON.parse(existing)
    : { students: {} };
  const map = {
    students: { ...(parsed.students ?? {}), [studentId]: value },
    activeStudentId: studentId,
  };
  localStorageMock.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(map));
}

function setStudyPlanFor(studentId: string, value: unknown | null): void {
  const existing = localStorageMock.getItem(STUDY_PLAN_STORAGE_KEY);
  const parsed: { students?: Record<string, unknown> } = existing
    ? JSON.parse(existing)
    : { students: {} };
  const map = {
    students: { ...(parsed.students ?? {}), [studentId]: value },
    activeStudentId: studentId,
  };
  localStorageMock.setItem(STUDY_PLAN_STORAGE_KEY, JSON.stringify(map));
}

async function loadModule() {
  return import("../has-local-progress");
}

// ---------------------------------------------------------------------------
// RED tests
// ---------------------------------------------------------------------------

describe("hasLocalProgress()", () => {
  it("returns false when profileId is null", async () => {
    const { hasLocalProgress } = await loadModule();
    expect(hasLocalProgress(null)).toBe(false);
  });

  it("returns false when profileId is undefined", async () => {
    const { hasLocalProgress } = await loadModule();
    expect(hasLocalProgress(undefined as unknown as null)).toBe(false);
  });

  it("returns false when no active profile exists (raw loaders have no slot)", async () => {
    const { hasLocalProgress } = await loadModule();
    expect(hasLocalProgress("some-student-id")).toBe(false);
  });

  it("returns false when profileId does NOT match the active profile", async () => {
    setActiveProfile("active-id");
    // No progress stored.
    const { hasLocalProgress } = await loadModule();
    expect(hasLocalProgress("other-id")).toBe(false);
  });

  it("returns false when profileId matches but all three raw loaders are empty", async () => {
    setActiveProfile("student-1");
    // No progress, no diagnostic, no plan stored.
    const { hasLocalProgress } = await loadModule();
    expect(hasLocalProgress("student-1")).toBe(false);
  });

  it("returns true when profileId matches AND attempts[] is non-empty", async () => {
    setActiveProfile("student-1");
    setProgressFor("student-1", [
      { exerciseId: "e1", skillId: "s1", correct: true, answeredAt: "t1" },
    ]);
    const { hasLocalProgress } = await loadModule();
    expect(hasLocalProgress("student-1")).toBe(true);
  });

  it("returns true when profileId matches AND a diagnostic result exists", async () => {
    setActiveProfile("student-1");
    setDiagnosticFor("student-1", { completedAt: "t1", estimates: [], version: 1 });
    const { hasLocalProgress } = await loadModule();
    expect(hasLocalProgress("student-1")).toBe(true);
  });

  it("returns true when profileId matches AND a study plan exists", async () => {
    setActiveProfile("student-1");
    setStudyPlanFor("student-1", { steps: [] });
    const { hasLocalProgress } = await loadModule();
    expect(hasLocalProgress("student-1")).toBe(true);
  });

  it("returns false when localStorage contains corrupt JSON", async () => {
    setActiveProfile("student-1");
    localStorageMock.setItem(PRACTICE_STORAGE_KEY, "{not-json");
    const { hasLocalProgress } = await loadModule();
    // Raw loaders swallow corrupt JSON → EMPTY_PROGRESS, no diagnostic,
    // no plan → false.
    expect(hasLocalProgress("student-1")).toBe(false);
  });
});
