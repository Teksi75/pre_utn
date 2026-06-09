import { describe, test, expect } from "vitest";
import { tagError } from "../evaluator/error-tagging";
import type { Exercise } from "../models/exercise";

describe("Error tagging — tagError()", () => {
  const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
    id: "ex.u1.propiedades_operaciones_reales.1",
    skillId: "mat.u1.propiedades_operaciones_reales",
    type: "numerical",
    difficulty: 2,
    prompt: "Calcula 5",
    expectedAnswer: "5",
    commonErrorTags: [],
    pedagogicalNote: "Test exercise",
    ...overrides,
  });

  describe("declared-tag match", () => {
    test("sign-error tag is returned when exercise declares it and answer is negated", () => {
      const exercise = makeExercise({
        expectedAnswer: "5",
        commonErrorTags: ["u1_signo_racionalizacion"],
      });
      const tag = tagError(exercise, "-5");
      expect(tag).toBe("u1_signo_racionalizacion");
    });

    test("sign-error tag for u2 declared tag is returned", () => {
      const exercise = makeExercise({
        expectedAnswer: "3",
        commonErrorTags: ["u2_signo_al_mover"],
      });
      const tag = tagError(exercise, "-3");
      expect(tag).toBe("u2_signo_al_mover");
    });

    test("sign-and-parentheses tag is returned for negative-base power misconception", () => {
      const exercise = makeExercise({
        prompt: "Calcula (−3)^2",
        expectedAnswer: "9",
        commonErrorTags: ["u1_signo_parentesis"],
      });
      const tag = tagError(exercise, "-9");
      expect(tag).toBe("u1_signo_parentesis");
    });
  });

  describe("order-of-operations pattern", () => {
    test("detects sum-before-multiply error when declared", () => {
      // Exercise: 2 + 3 × 4 = 14, student computes (2+3)×4 = 20
      const exercise = makeExercise({
        prompt: "Calcula 2 + 3 × 4",
        expectedAnswer: "14",
        commonErrorTags: ["u1_orden_operaciones"],
      });
      const tag = tagError(exercise, "20");
      expect(tag).toBe("u1_orden_operaciones");
    });

    test("no tag when exercise does not declare the pattern tag", () => {
      const exercise = makeExercise({
        prompt: "Calcula 2 + 3 × 4",
        expectedAnswer: "14",
        commonErrorTags: ["u1_signo_racionalizacion"],
      });
      const tag = tagError(exercise, "20");
      expect(tag).toBeUndefined();
    });
  });

  describe("interval endpoint-inclusion pattern", () => {
    test("detects endpoint inclusion error when declared", () => {
      // Exercise expects [3,7] but student writes (3,7) — endpoint type mismatch
      const exercise = makeExercise({
        type: "symbolic",
        expectedAnswer: "[3,7]",
        commonErrorTags: ["u1_extremo_inclusion"],
      });
      const tag = tagError(exercise, "(3,7)");
      expect(tag).toBe("u1_extremo_inclusion");
    });

    test("no tag for interval when exercise does not declare the tag", () => {
      const exercise = makeExercise({
        type: "symbolic",
        expectedAnswer: "[3,7]",
        commonErrorTags: [],
      });
      const tag = tagError(exercise, "(3,7)");
      expect(tag).toBeUndefined();
    });
  });

  describe("undeclared-tag no-match", () => {
    test("no tag returned when exercise does not declare the matching tag", () => {
      const exercise = makeExercise({
        expectedAnswer: "5",
        commonErrorTags: ["u1_orden_operaciones"],
      });
      const tag = tagError(exercise, "-5");
      expect(tag).toBeUndefined();
    });

    test("no tag returned when commonErrorTags is empty", () => {
      const exercise = makeExercise({
        expectedAnswer: "5",
        commonErrorTags: [],
      });
      const tag = tagError(exercise, "-5");
      expect(tag).toBeUndefined();
    });
  });

  describe("unrelated wrong answer no-match", () => {
    test("no tag returned when wrong answer does not match any pattern", () => {
      const exercise = makeExercise({
        expectedAnswer: "5",
        commonErrorTags: ["u1_signo_racionalizacion"],
      });
      const tag = tagError(exercise, "12");
      expect(tag).toBeUndefined();
    });

    test("no tag returned for non-numeric wrong answer", () => {
      const exercise = makeExercise({
        expectedAnswer: "5",
        commonErrorTags: ["u1_signo_racionalizacion"],
      });
      const tag = tagError(exercise, "abc");
      expect(tag).toBeUndefined();
    });
  });

  describe("zero-exponent pattern", () => {
    test("detects zero-exponent error when student answers 0 for x^0 = 1", () => {
      const exercise = makeExercise({
        prompt: "Calcula 5^0",
        expectedAnswer: "1",
        commonErrorTags: ["u1_exponente_cero"],
      });
      const tag = tagError(exercise, "0");
      expect(tag).toBe("u1_exponente_cero");
    });

    test("no tag when exercise does not declare u1_exponente_cero", () => {
      const exercise = makeExercise({
        prompt: "Calcula 5^0",
        expectedAnswer: "1",
        commonErrorTags: [],
      });
      const tag = tagError(exercise, "0");
      expect(tag).toBeUndefined();
    });

    test("no tag when expected is not 1 (not a zero-exponent case)", () => {
      const exercise = makeExercise({
        prompt: "Calcula 3 + 2",
        expectedAnswer: "5",
        commonErrorTags: ["u1_exponente_cero"],
      });
      const tag = tagError(exercise, "0");
      expect(tag).toBeUndefined();
    });
  });

  describe("principal-square-root pattern", () => {
    test("detects principal-root error when student answers negative of expected positive root", () => {
      const exercise = makeExercise({
        prompt: "Calcula √9",
        expectedAnswer: "3",
        commonErrorTags: ["u1_raiz_principal"],
      });
      const tag = tagError(exercise, "-3");
      expect(tag).toBe("u1_raiz_principal");
    });

    test("detects principal-root error for √16", () => {
      const exercise = makeExercise({
        prompt: "Calcula √16",
        expectedAnswer: "4",
        commonErrorTags: ["u1_raiz_principal"],
      });
      const tag = tagError(exercise, "-4");
      expect(tag).toBe("u1_raiz_principal");
    });

    test("no tag when exercise does not declare u1_raiz_principal", () => {
      const exercise = makeExercise({
        prompt: "Calcula √9",
        expectedAnswer: "3",
        commonErrorTags: [],
      });
      const tag = tagError(exercise, "-3");
      expect(tag).toBeUndefined();
    });

    test("no tag when expected answer is already negative", () => {
      const exercise = makeExercise({
        prompt: "Calcula algo",
        expectedAnswer: "-3",
        commonErrorTags: ["u1_raiz_principal"],
      });
      const tag = tagError(exercise, "3");
      expect(tag).toBeUndefined();
    });
  });

  describe("exponent-law patterns", () => {
    test("detects product-of-powers error when student multiplies exponents", () => {
      const exercise = makeExercise({
        prompt: "Calcula $2^3 \\times 2^4$",
        expectedAnswer: "128",
        commonErrorTags: ["u1_producto_potencias"],
      });
      const tag = tagError(exercise, "4096");
      expect(tag).toBe("u1_producto_potencias");
    });

    test("detects quotient-of-powers error when student adds exponents", () => {
      const exercise = makeExercise({
        prompt: "Calcula $2^5 \\div 2^2$",
        expectedAnswer: "8",
        commonErrorTags: ["u1_cociente_potencias"],
      });
      const tag = tagError(exercise, "128");
      expect(tag).toBe("u1_cociente_potencias");
    });

    test("detects power-of-power error when student adds exponents", () => {
      const exercise = makeExercise({
        prompt: "Calcula $(2^3)^2$",
        expectedAnswer: "64",
        commonErrorTags: ["u1_potencia_de_potencia"],
      });
      const tag = tagError(exercise, "32");
      expect(tag).toBe("u1_potencia_de_potencia");
    });

    test("does not tag exponent-law misconception when tag is not declared", () => {
      const exercise = makeExercise({
        prompt: "Calcula $2^3 \\times 2^4$",
        expectedAnswer: "128",
        commonErrorTags: [],
      });
      const tag = tagError(exercise, "4096");
      expect(tag).toBeUndefined();
    });
  });

  describe("negative even root in real numbers pattern", () => {
    test("detects even-root-of-negative misconception in multiple choice", () => {
      const exercise = makeExercise({
        type: "multiple-choice",
        prompt: "¿Qué resultado tiene $\\sqrt{-4}$ en los números reales?",
        expectedAnswer: "No tiene resultado real",
        options: ["2", "-2", "No tiene resultado real", "4"],
        commonErrorTags: ["u1_raiz_negativa_par"],
      });
      const tag = tagError(exercise, "2");
      expect(tag).toBe("u1_raiz_negativa_par");
    });
  });

  describe("correct answer never tagged", () => {
    test("no tag returned when answer is correct", () => {
      const exercise = makeExercise({
        expectedAnswer: "5",
        commonErrorTags: ["u1_signo_racionalizacion"],
      });
      const tag = tagError(exercise, "5");
      expect(tag).toBeUndefined();
    });

    test("no tag returned when answer matches within tolerance", () => {
      const exercise = makeExercise({
        expectedAnswer: "3.14",
        commonErrorTags: ["u1_signo_racionalizacion"],
      });
      const tag = tagError(exercise, "3.14");
      expect(tag).toBeUndefined();
    });
  });
});
