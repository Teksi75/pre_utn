/**
 * U2 Factorizacion error-tagging detectors.
 *
 * Spec coverage: U2FAC-EVAL-003, U2FAC-EVAL-004, U2FAC-EVAL-005
 */
import { describe, test, expect } from "vitest";
import { tagError } from "../evaluator/error-tagging";
import { loadExercisesForSkill } from "../catalog/content-loaders";
import { getExerciseOptionValue } from "../models/exercise";
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
    unit: 2,
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

  test("sign error detector no longer fires for non-MC (symbolic removed)", () => {
    // Symbolic type was removed; sign error detection only works for MC exercises now.
    const exercise = makeExercise({
      id: "ex.u2.factorizacion.4",
      type: "fill-blank",
      skillId: "mat.u2.factorizacion",
      prompt: "Factoriza completamente: x² − 4",
      expectedAnswer: "(x-2)(x+2)",
      commonErrorTags: ["u2_signo_factorizacion"],
    });

    const result = tagError(exercise, "(x-2)(x-2)");
    expect(result).toBeUndefined();
  });

  // Regression: gate review for align-u2-practice-official-exercises PR5
  // flagged that ex.u2.factorizacion.5 distractor `6x(x^2 + 1.5x - 2)` was
  // algebraically equivalent to the correct answer, so a student who picked
  // it would have been wrongly marked wrong even though they produced a
  // valid factorization. The replacement distractor `3x(2x^2 + 3x + 4)`
  // represents a genuine sign error (forgot the negative when dividing
  // -12x by 3x) and must trigger `u2_signo_factorizacion` when picked.
  test("ex.u2.factorizacion.5 replacement distractor triggers u2_signo_factorizacion (gate-review regression)", () => {
    const exercises = loadExercisesForSkill("mat.u2.factorizacion");
    const ex = exercises.find((e) => e.id === "ex.u2.factorizacion.5");
    expect(ex, "ex.u2.factorizacion.5 must exist").toBeDefined();

    // The exercise must declare the u2_signo_factorizacion tag for the
    // detector to fire on it.
    expect(ex!.commonErrorTags, "ex.u2.factorizacion.5 must declare u2_signo_factorizacion").toContain(
      "u2_signo_factorizacion"
    );

    // The new distractor value must be present as an option.
    const distractorBValue = "3x(2x^2 + 3x + 4)";
    const distractorB = ex!.options!.find((o) => getExerciseOptionValue(o) === distractorBValue);
    expect(distractorB, `Distractor ${distractorBValue} must be one of the options`).toBeDefined();

    // Picking the new distractor must trigger u2_signo_factorizacion.
    const tag = tagError(ex!, distractorBValue);
    expect(
      tag,
      `Picking distractor B (${distractorBValue}) must tag u2_signo_factorizacion`
    ).toBe("u2_signo_factorizacion");

    // Sanity: picking the correct answer must NOT tag anything.
    expect(tagError(ex!, ex!.expectedAnswer)).toBeUndefined();
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
