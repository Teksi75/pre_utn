import { describe, test, expect } from "vitest";
import {
  computeAccuracy,
  computeTrend,
  computeMasteryLevel,
  deduplicateByLastAttempt,
  type PracticeAttempt,
  type PracticeProgress,
} from "../progress/index";
import type { SkillId } from "../models/skill";

describe("PracticeAttempt / PracticeProgress", () => {
  const makeAttempt = (overrides: Partial<PracticeAttempt> = {}): PracticeAttempt => ({
    exerciseId: "ex.u1.propiedades_operaciones_reales.1",
    skillId: "mat.u1.propiedades_operaciones_reales",
    correct: true,
    answeredAt: "2026-01-15T10:00:00Z",
    timeMs: 0,
    attemptIndex: 1,
    ...overrides,
  });

  describe("PracticeAttempt model", () => {
    test("has required timeMs field with default 0", () => {
      const attempt = makeAttempt();
      expect(attempt.timeMs).toBe(0);
    });

    test("has required attemptIndex field with default 1", () => {
      const attempt = makeAttempt();
      expect(attempt.attemptIndex).toBe(1);
    });

    test("allows overriding timeMs and attemptIndex", () => {
      const attempt = makeAttempt({ timeMs: 45000, attemptIndex: 3 });
      expect(attempt.timeMs).toBe(45000);
      expect(attempt.attemptIndex).toBe(3);
    });
  });

  describe("deduplicateByLastAttempt", () => {
    test("returns only last attempt per exercise (highest attemptIndex)", () => {
      const attempts = [
        makeAttempt({ exerciseId: "ex.1", attemptIndex: 1, correct: false }),
        makeAttempt({ exerciseId: "ex.1", attemptIndex: 2, correct: false }),
        makeAttempt({ exerciseId: "ex.1", attemptIndex: 3, correct: true }),
      ];
      const result = deduplicateByLastAttempt(attempts);
      expect(result).toHaveLength(1);
      expect(result[0].attemptIndex).toBe(3);
      expect(result[0].correct).toBe(true);
    });

    test("preserves one attempt per distinct exerciseId", () => {
      const attempts = [
        makeAttempt({ exerciseId: "ex.A", attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.A", attemptIndex: 2, correct: false }),
        makeAttempt({ exerciseId: "ex.B", attemptIndex: 1, correct: true }),
      ];
      const result = deduplicateByLastAttempt(attempts);
      expect(result).toHaveLength(2);
      // ex.A: last attempt is attemptIndex 2 (correct: false)
      const a = result.find((r) => r.exerciseId === "ex.A")!;
      expect(a.attemptIndex).toBe(2);
      expect(a.correct).toBe(false);
      // ex.B: only one attempt (correct: true)
      const b = result.find((r) => r.exerciseId === "ex.B")!;
      expect(b.attemptIndex).toBe(1);
      expect(b.correct).toBe(true);
    });

    test("returns empty array for empty input", () => {
      const result = deduplicateByLastAttempt([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("computeAccuracy", () => {
    test("returns 1.0 for all correct attempts", () => {
      const attempts = [
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(accuracy).toBe(1.0);
    });

    test("returns 0.0 for all incorrect attempts", () => {
      const attempts = [
        makeAttempt({ correct: false }),
        makeAttempt({ correct: false }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(accuracy).toBe(0.0);
    });

    test("returns 0.5 for half correct", () => {
      const attempts = [
        makeAttempt({ correct: true }),
        makeAttempt({ correct: false }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: false }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(accuracy).toBe(0.5);
    });

    test("filters by skillId", () => {
      const attempts = [
        makeAttempt({ skillId: "mat.u1.propiedades_operaciones_reales", correct: true }),
        makeAttempt({ skillId: "mat.u1.intervalos", correct: false }),
        makeAttempt({ skillId: "mat.u1.propiedades_operaciones_reales", correct: false }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(accuracy).toBe(0.5);
    });

    test("returns 0 for no matching attempts", () => {
      const attempts = [
        makeAttempt({ skillId: "mat.u1.intervalos", correct: true }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(accuracy).toBe(0);
    });
  });

  describe("computeTrend", () => {
    test("returns 'improving' when accuracy increases", () => {
      // First half: 1 correct out of 4 (0.25), second half: 3 correct out of 4 (0.75)
      const attempts: PracticeAttempt[] = [
        makeAttempt({ correct: false }),
        makeAttempt({ correct: false }),
        makeAttempt({ correct: false }),
        makeAttempt({ correct: false }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
      ];
      const trend = computeTrend(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(trend).toBe("improving");
    });

    test("returns 'stable' when accuracy is constant", () => {
      const attempts: PracticeAttempt[] = [
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
      ];
      const trend = computeTrend(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(trend).toBe("stable");
    });

    test("returns 'needs-review' when accuracy decreases", () => {
      const attempts: PracticeAttempt[] = [
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: false }),
        makeAttempt({ correct: false }),
        makeAttempt({ correct: false }),
        makeAttempt({ correct: false }),
      ];
      const trend = computeTrend(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(trend).toBe("needs-review");
    });

    test("returns 'stable' for fewer than 4 attempts", () => {
      const attempts = [
        makeAttempt({ correct: true }),
        makeAttempt({ correct: false }),
      ];
      const trend = computeTrend(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(trend).toBe("stable");
    });

    test("filters by skillId", () => {
      const attempts: PracticeAttempt[] = [
        makeAttempt({ skillId: "mat.u1.propiedades_operaciones_reales", correct: false }),
        makeAttempt({ skillId: "mat.u1.propiedades_operaciones_reales", correct: false }),
        makeAttempt({ skillId: "mat.u1.propiedades_operaciones_reales", correct: false }),
        makeAttempt({ skillId: "mat.u1.propiedades_operaciones_reales", correct: false }),
        makeAttempt({ skillId: "mat.u1.propiedades_operaciones_reales", correct: true }),
        makeAttempt({ skillId: "mat.u1.propiedades_operaciones_reales", correct: true }),
        makeAttempt({ skillId: "mat.u1.propiedades_operaciones_reales", correct: true }),
        makeAttempt({ skillId: "mat.u1.propiedades_operaciones_reales", correct: true }),
        // Other skill attempts — should not affect trend
        makeAttempt({ skillId: "mat.u1.intervalos", correct: true }),
        makeAttempt({ skillId: "mat.u1.intervalos", correct: true }),
      ];
      const trend = computeTrend(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(trend).toBe("improving");
    });
  });

  describe("computeMasteryLevel", () => {
    // Helper: build a progress with N attempts for a skill, all correct.
    // Lets each test independently tune attempts/accuracy/trend.
    const buildProgress = (
      skillId: SkillId,
      correctCount: number,
      totalCount: number,
      trend: "improving" | "stable" | "needs-review" = "stable"
    ): PracticeProgress => {
      const attempts: PracticeAttempt[] = [];
      for (let i = 0; i < totalCount; i++) {
        attempts.push(
          makeAttempt({
            skillId,
            correct: i < correctCount,
            answeredAt: `2026-01-01T10:${String(i).padStart(2, "0")}:00Z`,
          })
        );
      }
      const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
      return {
        attempts,
        accuracyBySkill: { [skillId]: accuracy },
        trendBySkill: { [skillId]: trend },
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };
    };

    test("returns 'not-started' when there are no attempts for the skill", () => {
      const progress: PracticeProgress = {
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("not-started");
    });

    test("returns 'mastered' when accuracy >= 0.8 with 5+ attempts and stable trend", () => {
      // 5 attempts, 5 correct (1.0 accuracy) — meets mastered threshold
      const progress = buildProgress("mat.u1.propiedades_operaciones_reales", 5, 5, "stable");
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("mastered");
    });

    test("returns 'mastered' at the 0.8 / 5-attempts boundary", () => {
      // 4 correct out of 5 = 0.8 accuracy, 5 attempts, stable → mastered
      const progress = buildProgress("mat.u1.propiedades_operaciones_reales", 4, 5, "stable");
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("mastered");
    });

    test("returns 'learning' when accuracy is high but fewer than 5 attempts", () => {
      // 3 correct out of 3 = 1.0 accuracy, but only 3 attempts → not mastered
      const progress = buildProgress("mat.u1.propiedades_operaciones_reales", 3, 3, "stable");
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("learning");
    });

    test("returns 'practicing' when accuracy >= 0.7 and trend is improving", () => {
      // 7 correct out of 10 = 0.7 accuracy, improving trend
      const progress = buildProgress("mat.u1.propiedades_operaciones_reales", 7, 10, "improving");
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("practicing");
    });

    test("returns 'review' when trend is needs-review, regardless of accuracy", () => {
      // 9 correct out of 10 = 0.9 accuracy, but trend is needs-review
      const progress = buildProgress("mat.u1.propiedades_operaciones_reales", 9, 10, "needs-review");
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("review");
    });

    test("returns 'learning' as the default for low accuracy and stable trend", () => {
      // 3 correct out of 10 = 0.3 accuracy, stable trend
      const progress = buildProgress("mat.u1.propiedades_operaciones_reales", 3, 10, "stable");
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("learning");
    });

    test("falls back to 'learning' when accuracy/trend maps are missing entries", () => {
      // Attempts exist for the skill but accuracy/trend maps are empty —
      // should not throw and should return 'learning' (or higher)
      const progress: PracticeProgress = {
        attempts: [
          makeAttempt({ skillId: "mat.u1.propiedades_operaciones_reales", correct: true }),
        ],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      // Accuracy defaults to 0 → not mastered/practicing; trend defaults to
      // 'stable' (not 'needs-review') → not review → 'learning'
      expect(level).toBe("learning");
    });
  });
});
