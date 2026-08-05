import { describe, expect, test } from "vitest";
import { evaluateAnswer } from "../evaluator/index";
import type { EvaluableExercise } from "../models/exercise";

/**
 * Pure-evaluator guarantee.
 *
 * `evaluateAnswer` MUST be a pure function: no runtime state, no random
 * seed, no DOM dependency. Calling it 100 times with the same input must
 * yield 100 identical results.
 */

describe("evaluateAnswer purity / determinism", () => {
  test("100 identical calls return 100 identical results (structured)", () => {
    const exercise: EvaluableExercise = {
      type: "structured",
      skillId: "mat.u5.medicion_angulos_y_arcos" as never,
      expectedAnswer: "1/5",
      commonErrorTags: [],
      prompt: "Convertir 36° a radianes",
      answerSpec: {
        kind: "pi-rational",
        expected: { numerator: 1, denominator: 5 },
        decimal: 0.6283,
        tolerance: 0.0001,
      },
    };
    const submission = JSON.stringify({
      v: 1,
      kind: "pi-rational",
      numerator: 1,
      denominator: 5,
      decimal: 0.6283,
    });
    const first = evaluateAnswer(exercise, submission);
    for (let i = 0; i < 99; i++) {
      const result = evaluateAnswer(exercise, submission);
      expect(result).toEqual(first);
    }
  });

  test("100 identical calls return 100 identical results (numerical)", () => {
    const exercise: EvaluableExercise = {
      type: "numerical",
      skillId: "mat.u1.conjuntos_numericos" as never,
      expectedAnswer: "135",
      commonErrorTags: [],
      prompt: "Convertir 3π/4 a grados",
    };
    const first = evaluateAnswer(exercise, "135");
    for (let i = 0; i < 99; i++) {
      expect(evaluateAnswer(exercise, "135")).toEqual(first);
    }
  });

  test("100 identical calls return 100 identical results (multiple-choice)", () => {
    const exercise: EvaluableExercise = {
      type: "multiple-choice",
      skillId: "mat.u3.ecuaciones_cuadraticas" as never,
      expectedAnswer: "x = 2, x = 3",
      commonErrorTags: [],
      prompt: "Resuelve x² - 5x + 6 = 0",
      options: ["x = 2, x = 3", "x = -2, x = -3", "x = 2, x = -3", "x = -2, x = 3"],
    };
    const first = evaluateAnswer(exercise, "x = 2, x = 3");
    for (let i = 0; i < 99; i++) {
      expect(evaluateAnswer(exercise, "x = 2, x = 3")).toEqual(first);
    }
  });

  test("100 identical calls return 100 identical results (true-false)", () => {
    const exercise: EvaluableExercise = {
      type: "true-false",
      skillId: "mat.u1.conjuntos_numericos" as never,
      expectedAnswer: "true",
      commonErrorTags: [],
      prompt: "¿Es ℕ ⊂ ℤ?",
    };
    const first = evaluateAnswer(exercise, "true");
    for (let i = 0; i < 99; i++) {
      expect(evaluateAnswer(exercise, "true")).toEqual(first);
    }
  });
});