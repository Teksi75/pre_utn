import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadProgress,
  saveProgress,
  resetProgress,
  addAttempt,
  PRACTICE_STORAGE_KEY,
} from "../practice-progress";
import { PROFILES_STORAGE_KEY } from "../student-profile-storage";
import type { PracticeProgress } from "../../domain/progress/index";

/** Assert that a MaybePromise result is sync (no adapter configured) and return it. */
function asSync<T>(value: T | Promise<T>): T {
  expect(value).not.toBeInstanceOf(Promise);
  return value as T;
}

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

const emptyProgress = (overrides: Partial<PracticeProgress> = {}): PracticeProgress => ({
  attempts: [],
  accuracyBySkill: {},
  trendBySkill: {},
  lastPracticedBySkill: {},
  diagnosticResult: null,
  studyPlan: null,
  ...overrides,
});

function activateStudent(studentId = "local-student-a") {
  localStorageMock.setItem(
    PROFILES_STORAGE_KEY,
    JSON.stringify({
      profiles: [
        {
          studentId,
          displayName: "Ana",
          createdAt: "2025-01-01T00:00:00.000Z",
          lastActiveAt: "2025-01-01T00:00:00.000Z",
        },
      ],
      activeStudentId: studentId,
    })
  );
  return studentId;
}

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  localStorageMock.clear();
  vi.restoreAllMocks();
});

describe("practice-progress localStorage adapter", () => {
  describe("PRACTICE_STORAGE_KEY", () => {
    it("uses versioned key to avoid collisions", () => {
      expect(PRACTICE_STORAGE_KEY).toBe("pre-utn.practice.v1");
    });
  });

  describe("loadProgress", () => {
    it("returns empty progress when nothing stored and no active student exists", () => {
      const result = asSync(loadProgress());
      expect(result.attempts).toEqual([]);
      expect(result.accuracyBySkill).toEqual({});
      expect(result.trendBySkill).toEqual({});
    });

    it("returns the active student's slice from the central map", () => {
      activateStudent("local-a");
      localStorageMock.setItem(
        PRACTICE_STORAGE_KEY,
        JSON.stringify({
          students: {
            "local-a": emptyProgress({
              attempts: [
                {
                  exerciseId: "ex.active",
                  skillId: "mat.u1.propiedades_operaciones_reales",
                  correct: true,
                  answeredAt: "2025-01-01T00:00:00.000Z",
                  timeMs: 1000,
                  attemptIndex: 1,
                },
              ],
              accuracyBySkill: { "mat.u1.propiedades_operaciones_reales": 1 },
            }),
            "local-b": emptyProgress({
              attempts: [
                {
                  exerciseId: "ex.other",
                  skillId: "mat.u1.intervalos",
                  correct: false,
                  answeredAt: "2025-01-02T00:00:00.000Z",
                  timeMs: 1000,
                  attemptIndex: 1,
                },
              ],
            }),
          },
          activeStudentId: "local-a",
        })
      );

      const result = asSync(loadProgress());

      expect(result.attempts).toHaveLength(1);
      expect(result.attempts[0].exerciseId).toBe("ex.active");
      expect(result.accuracyBySkill["mat.u1.propiedades_operaciones_reales"]).toBe(1);
    });

    it("returns empty progress when stored data is invalid JSON", () => {
      localStorageMock.setItem(PRACTICE_STORAGE_KEY, "not-valid-json {{{");

      const result = asSync(loadProgress());

      expect(result.attempts).toEqual([]);
      expect(result.accuracyBySkill).toEqual({});
    });

    it("migrates legacy flat progress to Alumno local and normalizes old attempts", () => {
      localStorageMock.setItem(
        PRACTICE_STORAGE_KEY,
        JSON.stringify({
          attempts: [
            {
              exerciseId: "ex.u1.01",
              skillId: "mat.u1.propiedades_operaciones_reales",
              correct: true,
              answeredAt: "2024-12-01T00:00:00.000Z",
            },
          ],
          accuracyBySkill: { "mat.u1.propiedades_operaciones_reales": 1 },
          trendBySkill: { "mat.u1.propiedades_operaciones_reales": "stable" },
        })
      );

      const result = asSync(loadProgress());
      const profiles = JSON.parse(localStorageMock.getItem(PROFILES_STORAGE_KEY) ?? "{}");

      expect(profiles.profiles).toHaveLength(1);
      expect(profiles.profiles[0].displayName).toBe("Alumno local");
      expect(result.attempts).toHaveLength(1);
      expect(result.attempts[0].studentId).toBe(profiles.activeStudentId);
      expect(result.attempts[0].timeMs).toBe(0);
      expect(result.attempts[0].attemptIndex).toBe(1);
    });
  });

  describe("saveProgress", () => {
    it("persists progress under the active student in the central map", () => {
      const studentId = activateStudent("local-a");
      const progress = emptyProgress({
        attempts: [
          {
            exerciseId: "ex.u1.test",
            skillId: "mat.u1.intervalos",
            correct: false,
            errorTag: "u1_error_intervalo",
            answeredAt: "2025-01-01T00:00:00.000Z",
            timeMs: 0,
            attemptIndex: 1,
          },
        ],
        trendBySkill: { "mat.u1.intervalos": "needs-review" },
      });

      const result = asSync(saveProgress(progress));
      const stored = JSON.parse(localStorageMock.getItem(PRACTICE_STORAGE_KEY) ?? "{}");

      expect(result.ok).toBe(true);
      expect(stored.activeStudentId).toBe(studentId);
      expect(stored.students[studentId].attempts).toHaveLength(1);
      expect(asSync(loadProgress()).trendBySkill["mat.u1.intervalos"]).toBe("needs-review");
    });

    it("returns a blocked result and writes nothing when no active profile exists", () => {
      const result = asSync(saveProgress(emptyProgress()));

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("missing-active-profile");
      expect(localStorageMock.getItem(PRACTICE_STORAGE_KEY)).toBeNull();
    });
  });

  describe("resetProgress", () => {
    it("removes stored data from localStorage", () => {
      localStorageMock.setItem(PRACTICE_STORAGE_KEY, '{"some":"data"}');

      resetProgress();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(PRACTICE_STORAGE_KEY);
    });
  });

  describe("addAttempt", () => {
    it("appends attempt to the active student and recomputes skill metrics", () => {
      activateStudent("local-a");
      saveProgress(
        emptyProgress({
          attempts: [
            {
              exerciseId: "ex.u1.01",
              skillId: "mat.u1.propiedades_operaciones_reales",
              correct: true,
              answeredAt: "2025-01-01T00:00:00.000Z",
              timeMs: 5000,
              attemptIndex: 1,
              studentId: "local-a",
            },
          ],
        })
      );

      const result = addAttempt({
        exerciseId: "ex.u1.02",
        skillId: "mat.u1.propiedades_operaciones_reales",
        correct: false,
        errorTag: "u1_orden_operaciones",
        answeredAt: "2025-01-01T01:00:00.000Z",
        timeMs: 3000,
        attemptIndex: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.attempts).toHaveLength(2);
        expect(result.value.attempts[1].studentId).toBe("local-a");
        expect(result.value.accuracyBySkill["mat.u1.propiedades_operaciones_reales"]).toBe(0.5);
        expect(result.value.lastPracticedBySkill["mat.u1.propiedades_operaciones_reales"]).toBe(
          "2025-01-01T01:00:00.000Z"
        );
      }
    });

    it("persists difficulty, timeMs, attemptIndex, diagnosticResult, and studyPlan", () => {
      const diag = {
        completedAt: "2025-01-01T00:00:00.000Z",
        estimates: [],
        suggestions: [],
        version: 1 as const,
      };
      activateStudent("local-a");
      saveProgress(emptyProgress({ diagnosticResult: diag }));

      const result = addAttempt({
        exerciseId: "ex.u1.01",
        skillId: "mat.u1.intervalos",
        correct: true,
        answeredAt: "2025-02-01T00:00:00.000Z",
        difficulty: 4,
        timeMs: 45000,
        attemptIndex: 2,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.attempts[0].difficulty).toBe(4);
        expect(result.value.attempts[0].timeMs).toBe(45000);
        expect(result.value.attempts[0].attemptIndex).toBe(2);
        expect(result.value.diagnosticResult).toEqual(diag);
      }
    });

    it("returns blocked result and does not persist when no active profile exists", () => {
      const result = addAttempt({
        exerciseId: "ex.u1.01",
        skillId: "mat.u1.propiedades_operaciones_reales",
        correct: true,
        answeredAt: "2025-01-01T00:00:00.000Z",
        timeMs: 0,
        attemptIndex: 1,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("missing-active-profile");
      expect(localStorageMock.getItem(PRACTICE_STORAGE_KEY)).toBeNull();
      expect(asSync(loadProgress()).attempts).toHaveLength(0);
    });
  });
});
