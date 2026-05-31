import { describe, test, expect } from "vitest";
import {
  computeAccuracy,
  computeTrend,
  type PracticeAttempt,
  type PracticeProgress,
} from "../progress/index";

describe("PracticeAttempt / PracticeProgress", () => {
  const makeAttempt = (overrides: Partial<PracticeAttempt> = {}): PracticeAttempt => ({
    exerciseId: "ex.u1.reales_operaciones.1",
    skillId: "mat.u1.reales_operaciones",
    correct: true,
    answeredAt: "2026-01-15T10:00:00Z",
    ...overrides,
  });

  describe("computeAccuracy", () => {
    test("returns 1.0 for all correct attempts", () => {
      const attempts = [
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.reales_operaciones");
      expect(accuracy).toBe(1.0);
    });

    test("returns 0.0 for all incorrect attempts", () => {
      const attempts = [
        makeAttempt({ correct: false }),
        makeAttempt({ correct: false }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.reales_operaciones");
      expect(accuracy).toBe(0.0);
    });

    test("returns 0.5 for half correct", () => {
      const attempts = [
        makeAttempt({ correct: true }),
        makeAttempt({ correct: false }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: false }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.reales_operaciones");
      expect(accuracy).toBe(0.5);
    });

    test("filters by skillId", () => {
      const attempts = [
        makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: true }),
        makeAttempt({ skillId: "mat.u1.intervalos", correct: false }),
        makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: false }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.reales_operaciones");
      expect(accuracy).toBe(0.5);
    });

    test("returns 0 for no matching attempts", () => {
      const attempts = [
        makeAttempt({ skillId: "mat.u1.intervalos", correct: true }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.reales_operaciones");
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
      const trend = computeTrend(attempts, "mat.u1.reales_operaciones");
      expect(trend).toBe("improving");
    });

    test("returns 'stable' when accuracy is constant", () => {
      const attempts: PracticeAttempt[] = [
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
        makeAttempt({ correct: true }),
      ];
      const trend = computeTrend(attempts, "mat.u1.reales_operaciones");
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
      const trend = computeTrend(attempts, "mat.u1.reales_operaciones");
      expect(trend).toBe("needs-review");
    });

    test("returns 'stable' for fewer than 4 attempts", () => {
      const attempts = [
        makeAttempt({ correct: true }),
        makeAttempt({ correct: false }),
      ];
      const trend = computeTrend(attempts, "mat.u1.reales_operaciones");
      expect(trend).toBe("stable");
    });

    test("filters by skillId", () => {
      const attempts: PracticeAttempt[] = [
        makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: false }),
        makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: false }),
        makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: false }),
        makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: false }),
        makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: true }),
        makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: true }),
        makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: true }),
        makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: true }),
        // Other skill attempts — should not affect trend
        makeAttempt({ skillId: "mat.u1.intervalos", correct: true }),
        makeAttempt({ skillId: "mat.u1.intervalos", correct: true }),
      ];
      const trend = computeTrend(attempts, "mat.u1.reales_operaciones");
      expect(trend).toBe("improving");
    });
  });
});
