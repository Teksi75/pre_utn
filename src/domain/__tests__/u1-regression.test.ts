/**
 * U1 Regression Guard — verifies that PR-1 + PR-2 changes to the evaluator
 * chain do NOT break any U1 exercise evaluation or catalog integrity.
 *
 * Spec coverage: U2-EVAL-009
 * TDD: Strict — this file is a RED-written approval/regression suite.
 */
import { describe, test, expect } from "vitest";
import { evaluateAnswer } from "../evaluator/index";
import { loadCatalog } from "../catalog/index";
import type { Exercise } from "../models/exercise";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "ex.u1.propiedades_operaciones_reales.1",
    skillId: "mat.u1.propiedades_operaciones_reales",
    type: "numerical",
    difficulty: 2,
    prompt: "Calcula 3 + 5",
    expectedAnswer: "8",
    commonErrorTags: [],
    pedagogicalNote: "Test exercise",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Regression tests
// ---------------------------------------------------------------------------

describe("U1 Regression — Evaluator chain", () => {
  describe("U1 numerical evaluator still works", () => {
    test("correct numeric answer is accepted", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "42" });
      const result = evaluateAnswer(exercise, "42");
      expect(result.correct).toBe(true);
      expect(result.errorTag).toBeUndefined();
    });

    test("incorrect numeric answer is rejected", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "42" });
      const result = evaluateAnswer(exercise, "99");
      expect(result.correct).toBe(false);
    });

    test("tolerance works for numeric answers", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "3.14" });
      const result = evaluateAnswer(exercise, "3.1405");
      expect(result.correct).toBe(true);
    });

    test("negative numbers are evaluated correctly", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "-5" });
      expect(evaluateAnswer(exercise, "-5").correct).toBe(true);
      expect(evaluateAnswer(exercise, "5").correct).toBe(false);
    });

    test("unicode minus is normalized", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "−4" });
      const result = evaluateAnswer(exercise, "-4");
      expect(result.correct).toBe(true);
    });
  });

  describe("U1 symbolic/exact evaluator still works", () => {
    test("exact string match for symbolic", () => {
      const exercise = makeExercise({ type: "symbolic", expectedAnswer: "x+1" });
      const result = evaluateAnswer(exercise, "x+1");
      expect(result.correct).toBe(true);
    });

    test("whitespace is trimmed for symbolic", () => {
      const exercise = makeExercise({ type: "symbolic", expectedAnswer: "x+1" });
      const result = evaluateAnswer(exercise, "  x+1  ");
      expect(result.correct).toBe(true);
    });

    test("symbolic U1 exercise does NOT route to polynomial evaluator", () => {
      // Regression guard: non-U2 symbolic exercises must use exact match
      const exercise = makeExercise({
        id: "ex.u1.intervalos.1",
        skillId: "mat.u1.intervalos",
        type: "symbolic",
        expectedAnswer: "[2, 5]",
      });
      // A different interval-like answer should be rejected (exact match)
      const result = evaluateAnswer(exercise, "(2, 5]");
      expect(result.correct).toBe(false);
    });
  });

  describe("U1 boolean evaluator still works", () => {
    test.each([
      ["v", "true"],
      ["verdadero", "true"],
      ["f", "false"],
      ["no", "false"],
    ])("'%s' maps to '%s' for true-false", (answer, expectedAnswer) => {
      const exercise = makeExercise({
        type: "true-false",
        expectedAnswer,
      });
      const result = evaluateAnswer(exercise, answer);
      // Boolean evaluator normalizes input: v/verdadero → true, f/no → false
      expect(result.correct).toBe(true);
    });
  });

  describe("U1 multiple-choice evaluator still works", () => {
    test("case-insensitive MC answer", () => {
      const exercise = makeExercise({ type: "multiple-choice", expectedAnswer: "B" });
      const result = evaluateAnswer(exercise, "b");
      expect(result.correct).toBe(true);
    });
  });

  describe("U1 error tagging still works", () => {
    test("sign error tag is detected on wrong-sign numeric answer", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "5",
        commonErrorTags: ["u1_signo_racionalizacion"],
      });
      const result = evaluateAnswer(exercise, "-5");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("u1_signo_racionalizacion");
    });

    test("sign error tag is NOT emitted when tag not declared", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "5",
        commonErrorTags: ["u1_orden_operaciones"],
      });
      const result = evaluateAnswer(exercise, "-5");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBeUndefined();
    });
  });

  describe("U1 unsupported types return manual-review", () => {
    test.each(["free-response", "graphical", "matching", "ordering"] as const)(
      "%s returns manual-review",
      (type) => {
        const exercise = makeExercise({ type, expectedAnswer: "any" });
        const result = evaluateAnswer(exercise, "student answer");
        expect(result.correct).toBe(false);
        expect(result.errorTag).toBe("unsupported_type");
        expect(result.feedback).toBe("manual-review");
      }
    );
  });
});

// ---------------------------------------------------------------------------
// Catalog integrity
// ---------------------------------------------------------------------------

describe("U1 Regression — Catalog integrity", () => {
  const catalog = loadCatalog();

  test("all 8 U1 skills are present", () => {
    const u1SkillIds = [
      "mat.u1.conjuntos_numericos",
      "mat.u1.propiedades_operaciones_reales",
      "mat.u1.potencias_raices",
      "mat.u1.racionalizacion",
      "mat.u1.intervalos",
      "mat.u1.valor_absoluto",
      "mat.u1.logaritmos",
      "mat.u1.complejos",
    ];

    for (const skillId of u1SkillIds) {
      const exercises = catalog.filter((ex) => ex.skillId === skillId);
      expect(exercises.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("U1 exercises have correct types (no free-text for structured math)", () => {
    const u1Exercises = catalog.filter((ex) => ex.skillId.startsWith("mat.u1."));
    for (const ex of u1Exercises) {
      // Free-response is only allowed for conceptual questions, not structured math
      if (ex.type === "free-response") {
        // Acceptable — but verify it has valid expectedAnswer
        expect(typeof ex.expectedAnswer).toBe("string");
      }
      // No graphical, no ordering for U1 exercises (regression guard)
      expect(ex.type).not.toBe("graphical");
      expect(ex.type).not.toBe("ordering");
    }
  });

  test("ex.u2.gauss.1 is properly relocated to mat.u3.sistemas", () => {
    const gauss = catalog.find((ex) => ex.id === "ex.u2.gauss.1");
    expect(gauss).toBeDefined();
    expect(gauss!.skillId).toBe("mat.u3.sistemas");
  });

  test("catalog has no duplicate exercise IDs", () => {
    const ids = catalog.map((ex) => ex.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("all exercises have expectedAnswer defined", () => {
    for (const ex of catalog) {
      expect(ex.expectedAnswer).toBeDefined();
      expect(ex.expectedAnswer.trim().length).toBeGreaterThan(0);
    }
  });
});
