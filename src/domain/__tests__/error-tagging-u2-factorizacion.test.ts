/**
 * U2 Factorizacion error-tagging detectors.
 * Strict TDD: RED phase first (this file written before detectors exist).
 *
 * Spec coverage: U2FAC-EVAL-003, U2FAC-EVAL-004, U2FAC-EVAL-005
 */
import { describe, test, expect } from "vitest";
import { tagError } from "../evaluator/error-tagging";
import type { Exercise } from "../models/exercise";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "ex.u2.factorizacion.1",
    skillId: "mat.u2.factorizacion",
    type: "multiple-choice",
    difficulty: 2,
    prompt: "¿Cuál es la factorización correcta de x² − 9?",
    expectedAnswer: "(x-3)(x+3)",
    commonErrorTags: [],
    pedagogicalNote: "Test exercise",
    options: [
      { value: "(x-3)(x+3)", label: "A" },
      { value: "(x-3)(x-3)", label: "B" },
      { value: "(x+3)(x+3)", label: "C" },
      { value: "(3x-1)(x+3)", label: "D" },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// u2_signo_factorizacion — MC detection
// ---------------------------------------------------------------------------

describe("u2_signo_factorizacion MC detection", () => {
  test("detects when student picks distractor with inverted sign factor (MC)", () => {
    const exercise = makeExercise({
      prompt: "¿Cuál es la factorización correcta de x² − 9?",
      expectedAnswer: "(x-3)(x+3)",
      commonErrorTags: ["u2_signo_factorizacion"],
      options: [
        { value: "(x-3)(x+3)", label: "A" },
        { value: "(x-3)(x-3)", label: "B" }, // Same signs → wrong
        { value: "(x+3)(x+3)", label: "C" },
        { value: "(3x-1)(x+3)", label: "D" },
      ],
    });

    // Student picks (x-3)(x-3) — same factor repeated instead of conjugates
    const result = tagError(exercise, "(x-3)(x-3)");
    expect(result).toBe("u2_signo_factorizacion");
  });

  test("does NOT tag when student answer is correct", () => {
    const exercise = makeExercise({
      expectedAnswer: "(x-3)(x+3)",
      commonErrorTags: ["u2_signo_factorizacion"],
      options: [
        { value: "(x-3)(x+3)", label: "A" },
        { value: "(x-3)(x-3)", label: "B" },
      ],
    });

    const result = tagError(exercise, "(x-3)(x+3)");
    expect(result).toBeUndefined();
  });

  test("does NOT tag when tag not declared in commonErrorTags", () => {
    const exercise = makeExercise({
      expectedAnswer: "(x-3)(x+3)",
      commonErrorTags: [], // not declared
      options: [
        { value: "(x-3)(x+3)", label: "A" },
        { value: "(x-3)(x-3)", label: "B" },
      ],
    });

    const result = tagError(exercise, "(x-3)(x-3)");
    expect(result).toBeUndefined();
  });

  test("detects sign error in non-MC factorizacion context (symbolic)", () => {
    // For symbolic exercises in factorizacion, the polynomial-evaluator
    // catches equivalence. But tagError can also detect sign patterns.
    const exercise = makeExercise({
      id: "ex.u2.factorizacion.4",
      type: "symbolic",
      skillId: "mat.u2.factorizacion",
      prompt: "Factoriza completamente: x² − 4",
      expectedAnswer: "(x-2)(x+2)",
      commonErrorTags: ["u2_signo_factorizacion"],
    });

    // Student gives (x-2)(x-2) — only sign differs in second factor
    // This won't route through polynomial-evaluator in tagError but
    // the detector should work on the raw strings
    const result = tagError(exercise, "(x-2)(x-2)");
    expect(result).toBe("u2_signo_factorizacion");
  });
});

// ---------------------------------------------------------------------------
// u2_caso_incorrecto — MC detection
// ---------------------------------------------------------------------------

describe("u2_caso_incorrecto MC detection", () => {
  test("detects when student picks wrong case-of-factorization label", () => {
    const exercise = makeExercise({
      prompt: "¿Qué caso de factoreo aplica al polinomio x² − 25?",
      expectedAnswer: "Diferencia de cuadrados",
      commonErrorTags: ["u2_caso_incorrecto"],
      options: [
        { value: "Diferencia de cuadrados", label: "A" },
        { value: "Trinomio cuadrado perfecto", label: "B" },
        { value: "Factor común", label: "C" },
        { value: "Cubo perfecto", label: "D" },
      ],
    });

    const result = tagError(exercise, "Trinomio cuadrado perfecto");
    expect(result).toBe("u2_caso_incorrecto");
  });

  test("does NOT tag when student picks correct case", () => {
    const exercise = makeExercise({
      prompt: "¿Qué caso de factoreo aplica al polinomio x² − 25?",
      expectedAnswer: "Diferencia de cuadrados",
      commonErrorTags: ["u2_caso_incorrecto"],
      options: [
        { value: "Diferencia de cuadrados", label: "A" },
        { value: "Trinomio cuadrado perfecto", label: "B" },
      ],
    });

    const result = tagError(exercise, "Diferencia de cuadrados");
    expect(result).toBeUndefined();
  });

  test("does NOT tag when tag not declared in commonErrorTags", () => {
    const exercise = makeExercise({
      prompt: "¿Qué caso aplica?",
      expectedAnswer: "Diferencia de cuadrados",
      commonErrorTags: [], // not declared
      options: [
        { value: "Diferencia de cuadrados", label: "A" },
        { value: "Trinomio cuadrado perfecto", label: "B" },
      ],
    });

    const result = tagError(exercise, "Trinomio cuadrado perfecto");
    expect(result).toBeUndefined();
  });

  test("does NOT tag when prompt is not about case identification", () => {
    const exercise = makeExercise({
      prompt: "Calcula el valor de x en la ecuación x² − 25 = 0",
      expectedAnswer: "5",
      commonErrorTags: ["u2_caso_incorrecto"],
      type: "numerical",
      options: undefined,
    });

    const result = tagError(exercise, "5");
    // Should be undefined — context is not about factorization case
    expect(result).toBeUndefined();
  });
});
