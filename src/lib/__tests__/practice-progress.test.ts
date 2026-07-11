import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadProgress,
  saveProgress,
  resetProgress,
  addAttempt,
  parseProgress,
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
    //
    // REPAIR CONTRACT (post-fix):
    //   When the practice pointer is stale (points to a profile that is
    //   NOT the currently-active one), the repair MUST:
    //     1. PRESERVE ALL profile slots — including the slot the stale
    //        pointer named. Deleting any slot would silently wipe a
    //        student's history when only the pointer was out of sync.
    //     2. Re-point `map.activeStudentId` to the actual active profile so
    //        subsequent reads resolve to the right slice.
    //     3. Return the active profile's slice on this call.

    it("repairs stale pointer by re-pointing only — never deletes any slot (REQ-ISOL-2)", () => {
      // profiles active = B; practice pointer stale = A; BOTH slots have data.
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
          // B's slot has its own legitimate data (the active profile is B).
          {
            exerciseId: "ex.b.legacy",
            skillId: "mat.u1.intervalos",
            correct: false,
            answeredAt: "2025-01-04T00:00:00.000Z",
            timeMs: 500,
            attemptIndex: 1,
            studentId: "local-b",
          },
        ],
      });

      const result = asSync(loadProgress());

      // Active profile is B → B's slot is returned.
      expect(result.attempts).toHaveLength(1);
      expect(result.attempts[0].exerciseId).toBe("ex.b.legacy");
      expect(result.attempts[0].studentId).toBe("local-b");

      // Persisted map: BOTH slots preserved, pointer re-pointed to B.
      const persisted = JSON.parse(
        localStorageMock.getItem(PRACTICE_STORAGE_KEY) ?? "{}"
      );
      expect(persisted.students["local-a"]).toBeDefined();
      expect(persisted.students["local-a"].attempts).toHaveLength(1);
      expect(persisted.students["local-a"].attempts[0].exerciseId).toBe("ex.a.01");
      expect(persisted.students["local-b"]).toBeDefined();
      expect(persisted.students["local-b"].attempts).toHaveLength(1);
      expect(persisted.students["local-b"].attempts[0].exerciseId).toBe("ex.b.legacy");
      expect(persisted.activeStudentId).toBe("local-b");
    });

    // REGRESSION FOR GGA BLOCKER (practice-progress pointer repair):
    // The original GGA blocker reported that the repair deleted a profile
    // slot — which silently wiped student progress. The contract that MUST
    // hold, pinned by this regression test, is: NEVER DELETE ANY SLOT. The
    // repair only moves the pointer. Both stale-pointer and active-profile
    // slots are preserved verbatim.
    it("REGRESSION: stale activeStudentId repair MUST never delete any profile slot", () => {
      seedTwoStudents({
        profilesActive: "local-b",
        stalePracticePointer: "local-a",
        aAttempts: [
          {
            exerciseId: "ex.a.unique1",
            skillId: "mat.u1.intervalos",
            correct: true,
            answeredAt: "2025-01-01T00:00:00.000Z",
            timeMs: 1000,
            attemptIndex: 1,
          },
        ],
        bAttempts: [
          {
            // Identifier designed to be detected ONLY in B's persisted slot.
            exerciseId: "ex.b.KEEP_ME",
            skillId: "mat.u1.intervalos",
            correct: false,
            answeredAt: "2025-01-04T00:00:00.000Z",
            timeMs: 500,
            attemptIndex: 1,
            studentId: "local-b",
          },
          {
            exerciseId: "ex.b.KEEP_ME_TOO",
            skillId: "mat.u1.intervalos",
            correct: true,
            answeredAt: "2025-01-04T01:00:00.000Z",
            timeMs: 600,
            attemptIndex: 2,
            studentId: "local-b",
          },
        ],
      });

      // Trigger the repair by reading.
      const result = asSync(loadProgress());

      // 1. Returned slice MUST be B's data (not EMPTY_PROGRESS, not A's data).
      expect(result.attempts).toHaveLength(2);
      expect(result.attempts.map((a) => a.exerciseId)).toEqual([
        "ex.b.KEEP_ME",
        "ex.b.KEEP_ME_TOO",
      ]);
      for (const a of result.attempts) {
        expect(a.studentId).toBe("local-b");
      }

      // 2. Persisted map MUST still contain BOTH slots — never delete any.
      const persisted = JSON.parse(
        localStorageMock.getItem(PRACTICE_STORAGE_KEY) ?? "{}",
      );
      expect(persisted.students["local-b"]).toBeDefined();
      expect(persisted.students["local-b"].attempts).toHaveLength(2);
      expect(
        persisted.students["local-b"].attempts.map((a: { exerciseId: string }) => a.exerciseId),
      ).toEqual(["ex.b.KEEP_ME", "ex.b.KEEP_ME_TOO"]);
      // Stale-pointer slot is preserved too — repair only moves the pointer.
      expect(persisted.students["local-a"]).toBeDefined();
      expect(persisted.students["local-a"].attempts).toHaveLength(1);
      expect(persisted.students["local-a"].attempts[0].exerciseId).toBe("ex.a.unique1");

      // 3. The pointer MUST be re-pointed to the active profile.
      expect(persisted.activeStudentId).toBe("local-b");
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

      // Persisted map after repair + addAttempt:
      //   - A's stale slot is PRESERVED (the contract is: never delete any slot).
      //   - B's slot has the new attempt [b1] AND pointer is re-pointed to B.
      const persisted = JSON.parse(
        localStorageMock.getItem(PRACTICE_STORAGE_KEY) ?? "{}"
      );
      expect(persisted.students["local-a"]).toBeDefined();
      expect(persisted.students["local-a"].attempts).toHaveLength(1);
      expect(persisted.students["local-a"].attempts[0].exerciseId).toBe("ex.a.01");
      expect(persisted.students["local-b"].attempts).toHaveLength(1);
      expect(persisted.students["local-b"].attempts[0].exerciseId).toBe("ex.b.01");
      expect(persisted.students["local-b"].attempts[0].studentId).toBe("local-b");
      expect(persisted.activeStudentId).toBe("local-b");
    });
  });
});

// ---------------------------------------------------------------------------
// GGA BLOCKER FIX — parseProgress full-shape validation
// ---------------------------------------------------------------------------
//
// The previous parseProgress only checked that `attempts` was an array
// and cast the rest through `unknown`. The new contract validates the
// COMPLETE PracticeProgress shape AND every attempt entry before
// casting. These tests pin the new contract.

describe("GGA BLOCKER — parseProgress full-shape validation", () => {
  function fullProgress(overrides: Record<string, unknown> = {}) {
    return {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
      ...overrides,
    };
  }

  it("rejects null / non-object input", () => {
    expect(parseProgress(null)).toBeNull();
    expect(parseProgress(undefined)).toBeNull();
    expect(parseProgress(42)).toBeNull();
    expect(parseProgress("string")).toBeNull();
    expect(parseProgress([])).toBeNull();
  });

  it("rejects input missing the attempts array", () => {
    const { attempts: _drop, ...rest } = fullProgress();
    void _drop;
    expect(parseProgress(rest)).toBeNull();
  });

  it("rejects input where attempts is not an array", () => {
    expect(parseProgress(fullProgress({ attempts: "not-an-array" }))).toBeNull();
    expect(parseProgress(fullProgress({ attempts: { length: 0 } }))).toBeNull();
  });

  it("rejects input where accuracyBySkill is missing or wrong-typed", () => {
    const { accuracyBySkill: _drop, ...rest } = fullProgress();
    void _drop;
    expect(parseProgress(rest)).toBeNull();
    expect(parseProgress(fullProgress({ accuracyBySkill: "wrong" }))).toBeNull();
    expect(parseProgress(fullProgress({ accuracyBySkill: { foo: "bar" } }))).toBeNull();
    expect(parseProgress(fullProgress({ accuracyBySkill: { foo: NaN } }))).toBeNull();
  });

  it("rejects input where trendBySkill has an unknown trend literal", () => {
    expect(parseProgress(fullProgress({ trendBySkill: { foo: "unknown" } }))).toBeNull();
    expect(parseProgress(fullProgress({ trendBySkill: { foo: 42 } }))).toBeNull();
  });

  it("accepts input where trendBySkill uses a valid trend literal", () => {
    expect(parseProgress(fullProgress({ trendBySkill: { foo: "improving" } }))).not.toBeNull();
    expect(parseProgress(fullProgress({ trendBySkill: { foo: "stable" } }))).not.toBeNull();
    expect(parseProgress(fullProgress({ trendBySkill: { foo: "needs-review" } }))).not.toBeNull();
  });

  it("rejects input where lastPracticedBySkill is missing or wrong-typed", () => {
    const { lastPracticedBySkill: _drop, ...rest } = fullProgress();
    void _drop;
    expect(parseProgress(rest)).toBeNull();
    expect(parseProgress(fullProgress({ lastPracticedBySkill: { foo: 42 } }))).toBeNull();
  });

  it("rejects input where diagnosticResult is neither null nor an object", () => {
    expect(parseProgress(fullProgress({ diagnosticResult: 42 }))).toBeNull();
    expect(parseProgress(fullProgress({ diagnosticResult: "wrong" }))).toBeNull();
    expect(parseProgress(fullProgress({ diagnosticResult: [] }))).toBeNull();
  });

  it("accepts input where diagnosticResult is null", () => {
    expect(parseProgress(fullProgress({ diagnosticResult: null }))).not.toBeNull();
  });

  it("accepts input where diagnosticResult is an object", () => {
    expect(
      parseProgress(fullProgress({ diagnosticResult: { completedAt: "x" } })),
    ).not.toBeNull();
  });

  it("rejects input where studyPlan is neither null nor an object", () => {
    expect(parseProgress(fullProgress({ studyPlan: 42 }))).toBeNull();
    expect(parseProgress(fullProgress({ studyPlan: "wrong" }))).toBeNull();
  });

  it("accepts input where studyPlan is null", () => {
    expect(parseProgress(fullProgress({ studyPlan: null }))).not.toBeNull();
  });

  it("rejects an attempt entry missing exerciseId", () => {
    const invalid = fullProgress({
      attempts: [
        {
          // exerciseId missing
          skillId: "mat.u1.x",
          correct: true,
          answeredAt: "2025-01-01T00:00:00.000Z",
          timeMs: 1000,
          attemptIndex: 1,
        },
      ],
    });
    expect(parseProgress(invalid)).toBeNull();
  });

  it("rejects an attempt entry with non-boolean correct", () => {
    const invalid = fullProgress({
      attempts: [
        {
          exerciseId: "ex.x",
          skillId: "mat.u1.x",
          correct: "yes" as unknown as boolean,
          answeredAt: "2025-01-01T00:00:00.000Z",
          timeMs: 1000,
          attemptIndex: 1,
        },
      ],
    });
    expect(parseProgress(invalid)).toBeNull();
  });

  it("rejects an attempt entry with non-numeric timeMs", () => {
    const invalid = fullProgress({
      attempts: [
        {
          exerciseId: "ex.x",
          skillId: "mat.u1.x",
          correct: true,
          answeredAt: "2025-01-01T00:00:00.000Z",
          timeMs: "1000" as unknown as number,
          attemptIndex: 1,
        },
      ],
    });
    expect(parseProgress(invalid)).toBeNull();
  });

  it("rejects an attempt entry with attemptIndex < 1", () => {
    const invalid = fullProgress({
      attempts: [
        {
          exerciseId: "ex.x",
          skillId: "mat.u1.x",
          correct: true,
          answeredAt: "2025-01-01T00:00:00.000Z",
          timeMs: 1000,
          attemptIndex: 0,
        },
      ],
    });
    expect(parseProgress(invalid)).toBeNull();
  });

  it("rejects an attempt entry with non-integer attemptIndex", () => {
    const invalid = fullProgress({
      attempts: [
        {
          exerciseId: "ex.x",
          skillId: "mat.u1.x",
          correct: true,
          answeredAt: "2025-01-01T00:00:00.000Z",
          timeMs: 1000,
          attemptIndex: 1.5,
        },
      ],
    });
    expect(parseProgress(invalid)).toBeNull();
  });

  it("rejects an attempt entry with optional studentId of wrong type", () => {
    const invalid = fullProgress({
      attempts: [
        {
          exerciseId: "ex.x",
          skillId: "mat.u1.x",
          correct: true,
          answeredAt: "2025-01-01T00:00:00.000Z",
          timeMs: 1000,
          attemptIndex: 1,
          studentId: 42 as unknown as string,
        },
      ],
    });
    expect(parseProgress(invalid)).toBeNull();
  });

  it("accepts a well-formed empty PracticeProgress", () => {
    expect(parseProgress(fullProgress())).not.toBeNull();
  });

  it("accepts a well-formed PracticeProgress with one well-formed attempt", () => {
    const wellFormed = fullProgress({
      attempts: [
        {
          exerciseId: "ex.x",
          skillId: "mat.u1.x",
          correct: true,
          answeredAt: "2025-01-01T00:00:00.000Z",
          timeMs: 1000,
          attemptIndex: 1,
          studentId: "local-x",
        },
      ],
    });
    expect(parseProgress(wellFormed)).not.toBeNull();
  });
});
