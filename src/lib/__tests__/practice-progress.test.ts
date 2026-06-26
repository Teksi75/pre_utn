import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadProgress,
  saveProgress,
  resetProgress,
  addAttempt,
  PRACTICE_STORAGE_KEY,
} from "../practice-progress";
import { PROFILES_STORAGE_KEY } from "../student-profile-storage";
import type { PracticeProgress, PracticeAttempt } from "../../domain/progress/index";

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

  /**
   * REQ-ISOL-1, REQ-ISOL-2, REQ-ISOL-3 — isolation on profile switch.
   *
   * `extractActiveProgress` MUST resolve the active student via
   * `getActiveProfileId()` instead of reading `map.activeStudentId` from the
   * practice storage shape. When the practice pointer is stale, the active
   * student's slice MUST be returned (or EMPTY_PROGRESS if missing), and
   * `addAttempt` MUST write to the active student only.
   */
  describe("profile isolation on switch (REQ-ISOL-1..3)", () => {
    /**
     * Seed two students in practice storage and set profiles.v1.activeStudentId.
     * The practice map's `activeStudentId` is set to `stalePracticePointer`
     * so we can drive the stale-pointer scenario explicitly.
     */
    function seedTwoStudents(opts: {
      readonly profilesActive: string;
      readonly stalePracticePointer: string | null;
      readonly aAttempts?: readonly PracticeAttempt[];
      readonly bAttempts?: readonly PracticeAttempt[];
    }): void {
      localStorageMock.setItem(
        PROFILES_STORAGE_KEY,
        JSON.stringify({
          profiles: [
            { studentId: "local-a", displayName: "Ana", createdAt: "2025-01-01T00:00:00.000Z", lastActiveAt: "2025-01-01T00:00:00.000Z" },
            { studentId: "local-b", displayName: "Beto", createdAt: "2025-01-02T00:00:00.000Z", lastActiveAt: "2025-01-02T00:00:00.000Z" },
          ],
          activeStudentId: opts.profilesActive,
        })
      );
      localStorageMock.setItem(
        PRACTICE_STORAGE_KEY,
        JSON.stringify({
          students: {
            "local-a": emptyProgress({
              attempts: opts.aAttempts ?? [],
            }),
            "local-b": emptyProgress({
              attempts: opts.bAttempts ?? [],
            }),
          },
          activeStudentId: opts.stalePracticePointer,
        })
      );
    }

    // ----- REQ-ISOL-1 -----

    it("returns the active student's slice when practice pointer is stale (REQ-ISOL-1)", () => {
      // profiles active = B; practice pointer stale = A; attempts only under A.
      seedTwoStudents({
        profilesActive: "local-b",
        stalePracticePointer: "local-a",
        aAttempts: [
          {
            exerciseId: "ex.a.01",
            skillId: "mat.u1.intervalos",
            correct: true,
            answeredAt: "2025-01-01T00:00:00.000Z",
            timeMs: 1000,
            attemptIndex: 1,
          },
        ],
      });

      const result = asSync(loadProgress());

      // Active student is B. B has no attempts → EMPTY_PROGRESS shape.
      // The KEY assertion is that we do NOT receive A's attempts.
      expect(result.attempts).toEqual([]);
      expect(result.attempts).not.toContainEqual(
        expect.objectContaining({ exerciseId: "ex.a.01" })
      );
    });

    it("returns the active student's slice when practice pointer is null (REQ-ISOL-1)", () => {
      // profiles active = B; practice pointer = null; B has attempts.
      seedTwoStudents({
        profilesActive: "local-b",
        stalePracticePointer: null,
        bAttempts: [
          {
            exerciseId: "ex.b.01",
            skillId: "mat.u1.intervalos",
            correct: false,
            answeredAt: "2025-01-02T00:00:00.000Z",
            timeMs: 1500,
            attemptIndex: 1,
          },
        ],
      });

      const result = asSync(loadProgress());

      expect(result.attempts).toHaveLength(1);
      expect(result.attempts[0].exerciseId).toBe("ex.b.01");
    });

    it("returns the active student's slice when practice pointer is unknown (REQ-ISOL-1)", () => {
      // profiles active = B; practice pointer = "ghost" (not in students); B has attempts.
      seedTwoStudents({
        profilesActive: "local-b",
        stalePracticePointer: "ghost",
        bAttempts: [
          {
            exerciseId: "ex.b.02",
            skillId: "mat.u1.intervalos",
            correct: true,
            answeredAt: "2025-01-03T00:00:00.000Z",
            timeMs: 2000,
            attemptIndex: 1,
          },
        ],
      });

      const result = asSync(loadProgress());

      // B's slice — NOT EMPTY_PROGRESS caused by the ghost pointer.
      expect(result.attempts).toHaveLength(1);
      expect(result.attempts[0].exerciseId).toBe("ex.b.02");
    });

    // ----- REQ-ISOL-2 -----

    it("drops a corrupted active slot when practice pointer is stale (REQ-ISOL-2)", () => {
      // profiles active = B; practice pointer stale = A; B's slot has a hybrid blob.
      seedTwoStudents({
        profilesActive: "local-b",
        stalePracticePointer: "local-a",
        aAttempts: [
          {
            exerciseId: "ex.a.01",
            skillId: "mat.u1.intervalos",
            correct: true,
            answeredAt: "2025-01-01T00:00:00.000Z",
            timeMs: 1000,
            attemptIndex: 1,
          },
        ],
        bAttempts: [
          // Hybrid: this slot got polluted with A's data on a previous write.
          {
            exerciseId: "ex.a.01",
            skillId: "mat.u1.intervalos",
            correct: true,
            answeredAt: "2025-01-01T00:00:00.000Z",
            timeMs: 1000,
            attemptIndex: 1,
            studentId: "local-a",
          },
          {
            exerciseId: "ex.b.legacy",
            skillId: "mat.u1.intervalos",
            correct: false,
            answeredAt: "2025-01-04T00:00:00.000Z",
            timeMs: 500,
            attemptIndex: 2,
            studentId: "local-b",
          },
        ],
      });

      const result = asSync(loadProgress());

      // Active is B; B's slot is corrupted → drop and return EMPTY_PROGRESS.
      expect(result.attempts).toEqual([]);

      // Persisted map: A's slot intact, B's slot dropped.
      const persisted = JSON.parse(
        localStorageMock.getItem(PRACTICE_STORAGE_KEY) ?? "{}"
      );
      expect(persisted.students["local-a"]).toBeDefined();
      expect(persisted.students["local-a"].attempts).toHaveLength(1);
      expect(persisted.students["local-a"].attempts[0].exerciseId).toBe("ex.a.01");
      expect(persisted.students["local-b"]).toBeUndefined();
    });

    // ----- REQ-ISOL-3 -----

    it("addAttempt after switch does not corrupt the new active slot (REQ-ISOL-3)", () => {
      // Active profile is B. Practice pointer is stale (= A). A has [a1]; B is empty.
      seedTwoStudents({
        profilesActive: "local-b",
        stalePracticePointer: "local-a",
        aAttempts: [
          {
            exerciseId: "ex.a.01",
            skillId: "mat.u1.intervalos",
            correct: true,
            answeredAt: "2025-01-01T00:00:00.000Z",
            timeMs: 1000,
            attemptIndex: 1,
          },
        ],
      });

      const result = addAttempt({
        exerciseId: "ex.b.01",
        skillId: "mat.u1.intervalos",
        correct: false,
        errorTag: "u1_error_intervalo",
        answeredAt: "2025-01-02T00:00:00.000Z",
        timeMs: 3000,
        attemptIndex: 1,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok=true");
      // B's attempts MUST be exactly [b1] — not [a1, b1].
      expect(result.value.attempts).toHaveLength(1);
      expect(result.value.attempts[0].exerciseId).toBe("ex.b.01");
      expect(result.value.attempts[0].studentId).toBe("local-b");

      // Persisted map: A's slot untouched, B's slot = [b1].
      const persisted = JSON.parse(
        localStorageMock.getItem(PRACTICE_STORAGE_KEY) ?? "{}"
      );
      expect(persisted.students["local-a"].attempts).toHaveLength(1);
      expect(persisted.students["local-a"].attempts[0].exerciseId).toBe("ex.a.01");
      expect(persisted.students["local-b"].attempts).toHaveLength(1);
      expect(persisted.students["local-b"].attempts[0].exerciseId).toBe("ex.b.01");
      expect(persisted.students["local-b"].attempts[0].studentId).toBe("local-b");
    });
  });
});
