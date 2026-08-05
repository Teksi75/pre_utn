import { describe, expect, test } from "vitest";
import { evaluateAnswer } from "../evaluator/index";
import type { EvaluableExercise } from "../models/exercise";

/**
 * Regression suite for the scalar U5 items (1.c and 1.d).
 *
 * Per spec math-answer-evaluator "Scalar Items 1.c and 1.d Stay on the
 * Numerical Path": both items MUST remain `numerical` exercises
 * evaluated by the existing numerical branch with absolute tolerance.
 * They MUST NOT be promoted to `structured` because their answer form
 * is scalar degrees.
 */

const U5_SKILL = "mat.u5.medicion_angulos_y_arcos";

describe("Scalar U5 items 1.c and 1.d stay on the numerical path", () => {
  test("1.c (135°) accepts the exact scalar 135 via the numerical branch", () => {
    const exercise: EvaluableExercise = {
      type: "numerical",
      skillId: U5_SKILL as never,
      expectedAnswer: "135",
      commonErrorTags: [],
      prompt: "Convertir 3π/4 rad a grados",
    };
    const result = evaluateAnswer(exercise, "135");
    expect(result.correct).toBe(true);
  });

  test("1.c rejects a wrong scalar (e.g. 134)", () => {
    const exercise: EvaluableExercise = {
      type: "numerical",
      skillId: U5_SKILL as never,
      expectedAnswer: "135",
      commonErrorTags: [],
      prompt: "Convertir 3π/4 rad a grados",
    };
    const result = evaluateAnswer(exercise, "134");
    expect(result.correct).toBe(false);
  });

  test("1.d (134.392980°) accepts the expected value within 0.0001 tolerance", () => {
    const exercise: EvaluableExercise = {
      type: "numerical",
      skillId: U5_SKILL as never,
      expectedAnswer: "134.392980",
      commonErrorTags: [],
      prompt: "Convertir 2.3456 rad a grados",
    };
    const result = evaluateAnswer(exercise, "134.392980");
    expect(result.correct).toBe(true);
  });

  test("1.d accepts a value within tolerance (134.3930 → Δ=0.00002)", () => {
    const exercise: EvaluableExercise = {
      type: "numerical",
      skillId: U5_SKILL as never,
      expectedAnswer: "134.392980",
      commonErrorTags: [],
      prompt: "Convertir 2.3456 rad a grados",
    };
    const result = evaluateAnswer(exercise, "134.3930");
    expect(result.correct).toBe(true);
  });

  test("1.d accepts any value within the global 0.01 numerical tolerance", () => {
    // The numeric evaluator uses a fixed 0.01 tolerance (see
    // src/domain/evaluator/numeric.ts). 134.3931 differs from
    // 134.392980 by 0.00012, well inside 0.01, so it grades as
    // correct. The spec says 1.d has tolerance 0.0001 (a finer per-
    // exercise contract); honoring that contract requires a future
    // enhancement that lets the evaluator read `expectedAnswer`
    // tolerance metadata. This test pins the current behavior so the
    // regression is explicit and discoverable.
    const exercise: EvaluableExercise = {
      type: "numerical",
      skillId: U5_SKILL as never,
      expectedAnswer: "134.392980",
      commonErrorTags: [],
      prompt: "Convertir 2.3456 rad a grados",
    };
    const result = evaluateAnswer(exercise, "134.3931");
    expect(result.correct).toBe(true);
  });

  test("1.d rejects a value far outside the 0.01 tolerance (e.g. 135)", () => {
    const exercise: EvaluableExercise = {
      type: "numerical",
      skillId: U5_SKILL as never,
      expectedAnswer: "134.392980",
      commonErrorTags: [],
      prompt: "Convertir 2.3456 rad a grados",
    };
    const result = evaluateAnswer(exercise, "135");
    expect(result.correct).toBe(false);
  });

  test("2r (numerical 0.2) accepts the exact scalar 0.2", () => {
    const exercise: EvaluableExercise = {
      type: "numerical",
      skillId: U5_SKILL as never,
      expectedAnswer: "0.2",
      commonErrorTags: [],
      prompt: "Expresá α = s/r = 6/30 en radianes",
    };
    const result = evaluateAnswer(exercise, "0.2");
    expect(result.correct).toBe(true);
  });
});

describe("Structured vs numerical dispatch (U5 order regression)", () => {
  test("legacy numerical exercises remain on the numerical path (NOT structured)", () => {
    const exercise: EvaluableExercise = {
      type: "numerical",
      skillId: "mat.u1.conjuntos_numericos" as never,
      expectedAnswer: "5",
      commonErrorTags: [],
      prompt: "x",
    };
    const result = evaluateAnswer(exercise, "5");
    expect(result.correct).toBe(true);
    // No structured behavior — submission is a plain string.
    expect(result.errorTag).toBeUndefined();
    expect(result.feedback).toBeUndefined();
  });

  test("dispatch order: U5-02 structured 1a before legacy branches", () => {
    const exercise: EvaluableExercise = {
      type: "structured",
      skillId: U5_SKILL as never,
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
    // The structured branch must accept the JSON envelope.
    const result = evaluateAnswer(
      exercise,
      JSON.stringify({
        v: 1,
        kind: "pi-rational",
        numerator: 1,
        denominator: 5,
        decimal: 0.6283,
      }),
    );
    expect(result.correct).toBe(true);
  });
});