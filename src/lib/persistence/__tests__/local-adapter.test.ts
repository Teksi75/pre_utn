/**
 * Local storage adapter — isolation on profile switch (REQ-ISOL-4).
 *
 * The selector-wired local fallback adapter must resolve the active student
 * via `getActiveProfileId()` so a stale `practice.v1.activeStudentId` never
 * leaks another student's slice back to the caller.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  PRACTICE_STORAGE_KEY,
  EMPTY_PROGRESS,
} from "../../practice-progress";
import { PROFILES_STORAGE_KEY } from "../../student-profile-storage";
import { createLocalStorageAdapter } from "../local-adapter";
import type { PracticeProgress } from "../../../domain/progress/index";

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

/** Assert that a MaybePromise result is sync (no remote adapter) and return it. */
function asSync<T>(value: T | Promise<T>): T {
  expect(value).not.toBeInstanceOf(Promise);
  return value as T;
}

const emptyProgress = (overrides: Partial<PracticeProgress> = {}): PracticeProgress => ({
  attempts: [],
  accuracyBySkill: {},
  trendBySkill: {},
  lastPracticedBySkill: {},
  diagnosticResult: null,
  studyPlan: null,
  ...overrides,
});

function setProfiles(activeStudentId: string): void {
  localStorageMock.setItem(
    PROFILES_STORAGE_KEY,
    JSON.stringify({
      profiles: [
        { studentId: "local-a", displayName: "Ana", createdAt: "2025-01-01T00:00:00.000Z", lastActiveAt: "2025-01-01T00:00:00.000Z" },
        { studentId: "local-b", displayName: "Beto", createdAt: "2025-01-02T00:00:00.000Z", lastActiveAt: "2025-01-02T00:00:00.000Z" },
      ],
      activeStudentId,
    })
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createLocalStorageAdapter — profile isolation (REQ-ISOL-4)", () => {
  it("drops the active slot via the repaired loadProgress path when the practice pointer is stale", () => {
    // profiles active = B; practice pointer stale = A (points to a real student).
    // Per REQ-ISOL-2 (aggressive repair), the active slot MUST be dropped
    // and persisted when the pointer points to a real student in the map.
    setProfiles("local-b");
    localStorageMock.setItem(
      PRACTICE_STORAGE_KEY,
      JSON.stringify({
        students: {
          "local-a": emptyProgress({
            attempts: [
              {
                exerciseId: "ex.a.01",
                skillId: "mat.u1.intervalos",
                correct: true,
                answeredAt: "2025-01-01T00:00:00.000Z",
                timeMs: 1000,
                attemptIndex: 1,
              },
            ],
          }),
          "local-b": emptyProgress({
            attempts: [
              {
                exerciseId: "ex.b.01",
                skillId: "mat.u1.intervalos",
                correct: false,
                answeredAt: "2025-01-02T00:00:00.000Z",
                timeMs: 2000,
                attemptIndex: 1,
              },
            ],
          }),
        },
        activeStudentId: "local-a", // stale — should not be used
      })
    );

    const adapter = createLocalStorageAdapter();
    const result = asSync(adapter.loadProgress("local-b"));

    // Must NOT return A's attempts. After aggressive repair, the active
    // slot is dropped and the result is EMPTY_PROGRESS.
    expect(result.attempts).toEqual([]);
    expect(result.attempts).not.toContainEqual(
      expect.objectContaining({ exerciseId: "ex.a.01" })
    );

    // A's slot MUST remain intact.
    const persisted = JSON.parse(
      localStorageMock.getItem(PRACTICE_STORAGE_KEY) ?? "{}"
    );
    expect(persisted.students["local-a"]).toBeDefined();
    expect(persisted.students["local-a"].attempts[0].exerciseId).toBe("ex.a.01");
    // B's slot dropped.
    expect(persisted.students["local-b"]).toBeUndefined();
  });

  it("returns the active student's slice when the practice pointer is null (REQ-ISOL-4)", () => {
    setProfiles("local-b");
    localStorageMock.setItem(
      PRACTICE_STORAGE_KEY,
      JSON.stringify({
        students: {
          "local-b": emptyProgress({
            attempts: [
              {
                exerciseId: "ex.b.02",
                skillId: "mat.u1.intervalos",
                correct: true,
                answeredAt: "2025-01-03T00:00:00.000Z",
                timeMs: 1500,
                attemptIndex: 1,
              },
            ],
          }),
        },
        activeStudentId: null,
      })
    );

    const adapter = createLocalStorageAdapter();
    const result = asSync(adapter.loadProgress("local-b"));

    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].exerciseId).toBe("ex.b.02");
  });

  it("returns the active student's slice when the practice pointer is unknown (REQ-ISOL-4)", () => {
    // Unknown pointer ("ghost") does not trigger repair — no student in the
    // map has that id. The active student's intact data MUST be returned.
    setProfiles("local-b");
    localStorageMock.setItem(
      PRACTICE_STORAGE_KEY,
      JSON.stringify({
        students: {
          "local-b": emptyProgress({
            attempts: [
              {
                exerciseId: "ex.b.03",
                skillId: "mat.u1.intervalos",
                correct: false,
                answeredAt: "2025-01-04T00:00:00.000Z",
                timeMs: 1700,
                attemptIndex: 1,
              },
            ],
          }),
        },
        activeStudentId: "ghost",
      })
    );

    const adapter = createLocalStorageAdapter();
    const result = asSync(adapter.loadProgress("local-b"));

    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].exerciseId).toBe("ex.b.03");
  });
});
