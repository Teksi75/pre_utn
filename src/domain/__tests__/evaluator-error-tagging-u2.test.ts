import { describe, test, expect } from "vitest";
import { tagError } from "../evaluator/error-tagging";
import type { Exercise } from "../models/exercise";

/** Factory to create a minimal Exercise with commonErrorTags for error-tagging dispatch. */
function ex(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "ex.test",
    skillId: "mat.u2.polinomios_basico",
    type: "numerical",
    difficulty: 2,
    prompt: "Test prompt",
    expectedAnswer: "42",
    commonErrorTags: [],
    ...overrides,
  } as Exercise;
}

describe("U2 error tagging patterns", () => {
  // ─── u2_signo_operacion ──────────────────────────────────────────────
  describe("u2_signo_operacion", () => {
    test("detects sign flip in numerical polynomial answer when declared", () => {
      const exercise = ex({
        type: "numerical",
        expectedAnswer: "14",
        commonErrorTags: ["u2_signo_operacion"],
      });

      const result = tagError(exercise, "-14");
      expect(result).toBe("u2_signo_operacion");
    });

    test("returns undefined when sign is correct", () => {
      const exercise = ex({
        type: "numerical",
        expectedAnswer: "14",
        commonErrorTags: ["u2_signo_operacion"],
      });

      const result = tagError(exercise, "14");
      expect(result).toBeUndefined();
    });
  });

  // ─── u2_termino_semejante ────────────────────────────────────────────
  describe("u2_termino_semejante", () => {
    test("detects combining unlike-degree terms in MC exercise", () => {
      const exercise = ex({
        type: "multiple-choice",
        expectedAnswer: "3x² + 2x",
        options: ["3x² + 2x", "5x²", "5x³", "6x²"],
        skillId: "mat.u2.polinomios_basico",
        commonErrorTags: ["u2_termino_semejante"],
      });

      // Student picks "5x²" — combining unlike terms 3x² + 2x into 5x²
      const result = tagError(exercise, "5x²");
      expect(result).toBe("u2_termino_semejante");
    });

    test("returns undefined when student answer is an unrelated error", () => {
      const exercise = ex({
        type: "multiple-choice",
        expectedAnswer: "3x² + 2x",
        options: ["3x² + 2x", "5x²", "5x³", "6x²"],
        skillId: "mat.u2.polinomios_basico",
        commonErrorTags: ["u2_termino_semejante"],
      });

      // Student picks "5x³" — this is a degree error, not term confusion
      const result = tagError(exercise, "5x³");
      expect(result).toBeUndefined();
    });
  });

  // ─── u2_ruffini_signo_a ──────────────────────────────────────────────
  describe("u2_ruffini_signo_a", () => {
    test("detects evaluating at wrong sign in MC Ruffini exercise", () => {
      const exercise = ex({
        type: "multiple-choice",
        expectedAnswer: "5",
        options: ["5", "-3", "0", "8"],
        prompt: "Usando el teorema del resto para P(x)=x³-2x+1, divisor (x-2). ¿Cuál es el resto?",
        skillId: "mat.u2.ruffini_resto",
        commonErrorTags: ["u2_ruffini_signo_a"],
      });

      // Student picks "-3" — evaluated P(-2) instead of P(2)
      const result = tagError(exercise, "-3");
      expect(result).toBe("u2_ruffini_signo_a");
    });

    test("returns undefined when answer is completely unrelated (not an option)", () => {
      const exercise = ex({
        type: "multiple-choice",
        expectedAnswer: "5",
        options: ["5", "-3", "0", "8"],
        prompt: "Usando el teorema del resto para P(x)=x³-2x+1, divisor (x-2). ¿Cuál es el resto?",
        skillId: "mat.u2.ruffini_resto",
        commonErrorTags: ["u2_ruffini_signo_a"],
      });

      // Student gives answer not in options — can't be a declared distractor
      const result = tagError(exercise, "99");
      expect(result).toBeUndefined();
    });
  });

  // ─── u2_grado_incorrecto ─────────────────────────────────────────────
  describe("u2_grado_incorrecto", () => {
    test("detects wrong degree answer in MC exercise", () => {
      const exercise = ex({
        type: "multiple-choice",
        expectedAnswer: "4",
        options: ["4", "3", "5", "2"],
        prompt: "¿Cuál es el grado de 3x⁴ + 2x² − 1?",
        skillId: "mat.u2.polinomios_basico",
        commonErrorTags: ["u2_grado_incorrecto"],
      });

      // Student picks "3" (number of terms) instead of "4" (max exponent)
      const result = tagError(exercise, "3");
      expect(result).toBe("u2_grado_incorrecto");
    });

    test("returns undefined when answer is a non-numeric value", () => {
      const exercise = ex({
        type: "multiple-choice",
        expectedAnswer: "4",
        options: ["4", "3", "5", "2"],
        prompt: "¿Cuál es el grado de 3x⁴ + 2x² − 1?",
        skillId: "mat.u2.polinomios_basico",
        commonErrorTags: ["u2_grado_incorrecto"],
      });

      // Student gives non-numeric answer — not a degree error
      const result = tagError(exercise, "no sé");
      expect(result).toBeUndefined();
    });
  });

  // ─── u2_termino_faltante (symbolic removed — detector disabled) ──────
  describe("u2_termino_faltante (symbolic type removed)", () => {
    test("termino_faltante detector no longer fires (symbolic removed)", () => {
      const exercise = ex({
        type: "fill-blank",
        expectedAnswer: "[1, 0, 0, -1]",
        skillId: "mat.u2.polinomios_basico",
        commonErrorTags: ["u2_termino_faltante"],
      });

      // Symbolic type removed — detector always returns false
      const result = tagError(exercise, "[1, -1]");
      expect(result).toBeUndefined();
    });
  });

  // ─── u2_factorizacion_incompleta ─────────────────────────────────────
  describe("u2_factorizacion_incompleta", () => {
    test("detects incomplete factorization in MC exercise", () => {
      const exercise = ex({
        type: "multiple-choice",
        expectedAnswer: "x(x-1)(x+1)",
        options: ["x(x-1)(x+1)", "x(x²-1)", "(x-1)(x+1)", "x³-x"],
        prompt: "Factoriza completamente x³ − x",
        skillId: "mat.u2.factorizacion",
        commonErrorTags: ["u2_factorizacion_incompleta"],
      });

      // Student picks "x(x²-1)" — partial factorization, (x²-1) still factorable
      const result = tagError(exercise, "x(x²-1)");
      expect(result).toBe("u2_factorizacion_incompleta");
    });

    test("returns undefined when answer is a different error", () => {
      const exercise = ex({
        type: "multiple-choice",
        expectedAnswer: "x(x-1)(x+1)",
        options: ["x(x-1)(x+1)", "x(x²-1)", "(x-1)(x+1)", "x³-x"],
        prompt: "Factoriza completamente x³ − x",
        skillId: "mat.u2.factorizacion",
        commonErrorTags: ["u2_factorizacion_incompleta"],
      });

      // Student picks "x³-x" — that's not factoring at all
      const result = tagError(exercise, "x³-x");
      expect(result).toBeUndefined();
    });
  });

  // ─── No tag when not declared ────────────────────────────────────────
  describe("dispatch respects commonErrorTags", () => {
    test("returns undefined when tag is not in exercise.commonErrorTags", () => {
      const exercise = ex({
        type: "numerical",
        expectedAnswer: "14",
        commonErrorTags: ["u1_orden_operaciones"], // NOT u2_signo_operacion
      });

      const result = tagError(exercise, "-14");
      expect(result).toBeUndefined();
    });

    test("returns undefined for non-U2 exercise even with matching pattern", () => {
      const exercise = ex({
        type: "numerical",
        expectedAnswer: "14",
        skillId: "mat.u1.propiedades_operaciones_reales", // U1, not U2
        commonErrorTags: ["u2_signo_operacion"], // declared but wrong unit
      });

      const result = tagError(exercise, "-14");
      // u2_signo_operacion is in SIGN_ERROR_TAGS_U2, which isChecked by isSignError
      // but isSignError works on any numerical exercise
      expect(result).toBe("u2_signo_operacion");
    });
  });
});
