/**
 * Advanced practice progress — localStorage adapter for challenge attempts.
 *
 * Storage shape:
 * {
 *   challengeAttempts: readonly ChallengeAttempt[];
 *   readinessBySkill: Record<SkillId, number | null>;
 * }
 *
 * Key: pre-utn.advanced-practice.v1 (separate from base pre-utn.practice.v1)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SkillId } from "../../domain/models/skill";
import {
  addChallengeAttempt,
  loadAdvancedProgress,
  computeAdvancedReadiness,
  ADVANCED_PRACTICE_STORAGE_KEY,
  type ChallengeAttempt,
  type AdvancedPracticeProgress,
} from "../advanced-practice-progress";

// ---------------------------------------------------------------------------
// Mock localStorage
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

// ---------------------------------------------------------------------------
// Helper builders
// ---------------------------------------------------------------------------

const makeAttempt = (overrides: Partial<ChallengeAttempt> = {}): ChallengeAttempt => ({
  exerciseId: "ex.u1.complejos.desafio-1",
  skillId: "mat.u1.complejos",
  correct: true,
  answeredAt: "2025-01-01T00:00:00.000Z",
  timeMs: 30000,
  attemptIndex: 1,
  ...overrides,
});

const emptyAdvancedProgress = (): AdvancedPracticeProgress => ({
  challengeAttempts: [],
  readinessBySkill: {},
});

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  localStorageMock.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("advanced-practice-progress localStorage adapter", () => {
  describe("ADVANCED_PRACTICE_STORAGE_KEY", () => {
    it("uses separate versioned key from base practice", () => {
      expect(ADVANCED_PRACTICE_STORAGE_KEY).toBe("pre-utn.advanced-practice.v1");
    });

    it("is different from base PRACTICE_STORAGE_KEY", () => {
      // This ensures challenge attempts never pollute base progress
      // Hardcoded to avoid module resolution issues in tests
      expect(ADVANCED_PRACTICE_STORAGE_KEY).not.toBe("pre-utn.practice.v1");
    });
  });

  describe("loadAdvancedProgress", () => {
    it("returns empty progress when nothing stored", () => {
      const result = loadAdvancedProgress();
      expect(result.challengeAttempts).toEqual([]);
      expect(result.readinessBySkill).toEqual({});
    });

    it("returns stored challenge attempts", () => {
      const stored: AdvancedPracticeProgress = {
        challengeAttempts: [
          makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: true }),
          makeAttempt({ exerciseId: "ex.u1.complejos.desafio-2", correct: false }),
        ],
        readinessBySkill: { "mat.u1.complejos": 50 },
      };
      localStorageMock.setItem(
        ADVANCED_PRACTICE_STORAGE_KEY,
        JSON.stringify(stored)
      );

      const result = loadAdvancedProgress();

      expect(result.challengeAttempts).toHaveLength(2);
      expect(result.challengeAttempts[0].exerciseId).toBe("ex.u1.complejos.desafio-1");
      expect(result.challengeAttempts[1].exerciseId).toBe("ex.u1.complejos.desafio-2");
    });

    it("tolerates corrupt JSON in localStorage", () => {
      localStorageMock.setItem(ADVANCED_PRACTICE_STORAGE_KEY, "not-valid-json {{{");

      const result = loadAdvancedProgress();

      expect(result.challengeAttempts).toEqual([]);
      expect(result.readinessBySkill).toEqual({});
    });

    it("tolerates empty string in localStorage", () => {
      localStorageMock.setItem(ADVANCED_PRACTICE_STORAGE_KEY, "");

      const result = loadAdvancedProgress();

      expect(result.challengeAttempts).toEqual([]);
      expect(result.readinessBySkill).toEqual({});
    });

    it("tolerates null values in readinessBySkill", () => {
      const stored: AdvancedPracticeProgress = {
        challengeAttempts: [],
        readinessBySkill: { "mat.u1.complejos": null },
      };
      localStorageMock.setItem(
        ADVANCED_PRACTICE_STORAGE_KEY,
        JSON.stringify(stored)
      );

      const result = loadAdvancedProgress();

      expect(result.readinessBySkill["mat.u1.complejos"]).toBeNull();
    });
  });

  describe("addChallengeAttempt", () => {
    it("appends a challenge attempt to the store", () => {
      const before = loadAdvancedProgress();
      expect(before.challengeAttempts).toHaveLength(0);

      const result = addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: true })
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.challengeAttempts).toHaveLength(1);
        expect(result.value.challengeAttempts[0].exerciseId).toBe("ex.u1.complejos.desafio-1");
        expect(result.value.challengeAttempts[0].correct).toBe(true);
      }

      // Verify persisted
      const persisted: AdvancedPracticeProgress = JSON.parse(
        localStorageMock.getItem(ADVANCED_PRACTICE_STORAGE_KEY) ?? "{}"
      );
      expect(persisted.challengeAttempts).toHaveLength(1);
    });

    it("accumulates multiple attempts", () => {
      addChallengeAttempt(makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: true }));
      addChallengeAttempt(makeAttempt({ exerciseId: "ex.u1.complejos.desafio-2", correct: false }));
      addChallengeAttempt(makeAttempt({ exerciseId: "ex.u1.complejos.desafio-3", correct: true }));

      const result = loadAdvancedProgress();
      expect(result.challengeAttempts).toHaveLength(3);
    });

    it("stores all attempt fields correctly", () => {
      const attempt: ChallengeAttempt = {
        exerciseId: "ex.u1.complejos.desafio-1",
        skillId: "mat.u1.complejos",
        correct: true,
        answeredAt: "2025-06-16T10:30:00.000Z",
        timeMs: 45000,
        attemptIndex: 3,
      };

      addChallengeAttempt(attempt);

      const result = loadAdvancedProgress();
      const saved = result.challengeAttempts[0];
      expect(saved.exerciseId).toBe("ex.u1.complejos.desafio-1");
      expect(saved.skillId).toBe("mat.u1.complejos");
      expect(saved.correct).toBe(true);
      expect(saved.answeredAt).toBe("2025-06-16T10:30:00.000Z");
      expect(saved.timeMs).toBe(45000);
      expect(saved.attemptIndex).toBe(3);
    });

    it("recomputes readinessBySkill for the affected skill after each attempt", () => {
      // Two attempts: first incorrect, second correct → 1 correct out of 2 deduplicated = 50%
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: false })
      );
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-2", correct: true })
      );

      const result = loadAdvancedProgress();
      expect(result.readinessBySkill["mat.u1.complejos"]).toBe(50);
    });

    it("does NOT read or write pre-utn.practice.v1", () => {
      addChallengeAttempt(makeAttempt({ correct: true }));

      expect(localStorageMock.getItem("pre-utn.practice.v1")).toBeNull();
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        "pre-utn.practice.v1",
        expect.any(String)
      );
    });
  });

  describe("computeAdvancedReadiness", () => {
    it("returns null when no attempts exist for the skill", () => {
      const progress = loadAdvancedProgress();
      const result = computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts);
      expect(result).toBeNull();
    });

    it("returns null when skill has no attempts (different skill has attempts)", () => {
      addChallengeAttempt(
        makeAttempt({ skillId: "mat.u1.valor_absoluto", correct: true })
      );

      const progress = loadAdvancedProgress();
      const result = computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts);
      expect(result).toBeNull();
    });

    it("returns 100 when all deduplicated attempts are correct", () => {
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: true })
      );
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-2", correct: true })
      );

      const progress = loadAdvancedProgress();
      const result = computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts);
      expect(result).toBe(100);
    });

    it("returns 0 when all deduplicated attempts are incorrect", () => {
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: false })
      );
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-2", correct: false })
      );

      const progress = loadAdvancedProgress();
      const result = computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts);
      expect(result).toBe(0);
    });

    it("returns rounded accuracy percentage for mixed results", () => {
      // 1 correct out of 3 = 33.33...% → 33
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: true })
      );
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-2", correct: false })
      );
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-3", correct: false })
      );

      const progress = loadAdvancedProgress();
      const result = computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts);
      expect(result).toBe(33);
    });

    it("deduplicates by last attempt per exerciseId", () => {
      // Two attempts on same exercise: first incorrect, second correct (later attemptIndex wins)
      // Only the last attempt counts → 1 correct / 1 total = 100%
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: false, attemptIndex: 1 })
      );
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: true, attemptIndex: 2 })
      );

      const progress = loadAdvancedProgress();
      const result = computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts);
      expect(result).toBe(100);
    });

    it("handles multiple skills independently", () => {
      addChallengeAttempt(
        makeAttempt({ skillId: "mat.u1.complejos", exerciseId: "ex.u1.complejos.desafio-1", correct: true })
      );
      addChallengeAttempt(
        makeAttempt({ skillId: "mat.u1.complejos", exerciseId: "ex.u1.complejos.desafio-2", correct: false })
      );
      addChallengeAttempt(
        makeAttempt({ skillId: "mat.u1.valor_absoluto", exerciseId: "ex.u1.valor_absoluto.desafio-1", correct: true })
      );

      const progress = loadAdvancedProgress();
      expect(computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts)).toBe(50);
      expect(computeAdvancedReadiness("mat.u1.valor_absoluto", progress.challengeAttempts)).toBe(100);
    });
  });
});
