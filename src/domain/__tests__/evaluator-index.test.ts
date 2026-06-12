import { describe, test, expect } from "vitest";
import { evaluateAnswer } from "../evaluator/index";
import { loadCatalog } from "../catalog/index";
import type { Exercise } from "../models/exercise";

describe("Evaluator dispatcher", () => {
  const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
    id: "ex.u1.propiedades_operaciones_reales.1",
    skillId: "mat.u1.propiedades_operaciones_reales",
    type: "numerical",
    difficulty: 2,
    prompt: "Calcula 3 + 5",
    expectedAnswer: "8",
    commonErrorTags: [],
    pedagogicalNote: "Test exercise",
    unit: 1,
    ...overrides,
  });

  describe("dispatches to numeric evaluator", () => {
    test("numerical exercise with correct answer returns correct", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "8" });
      const result = evaluateAnswer(exercise, "8");
      expect(result.correct).toBe(true);
    });

    test("numerical exercise with incorrect answer returns incorrect", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "8" });
      const result = evaluateAnswer(exercise, "10");
      expect(result.correct).toBe(false);
    });

    test("numerical exercise respects tolerance", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "3.14" });
      const result = evaluateAnswer(exercise, "3.1405");
      expect(result.correct).toBe(true);
    });

    test.each([
      { expectedAnswer: "1e3", studentAnswer: "1000" },
      { expectedAnswer: "-1e-3", studentAnswer: "-0.001" },
    ])("numerical exercise accepts scientific notation expected answer $expectedAnswer", ({ expectedAnswer, studentAnswer }) => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer });
      const result = evaluateAnswer(exercise, studentAnswer);

      expect(result.correct).toBe(true);
      expect(result.errorTag).toBeUndefined();
    });

    test("numerical exercise accepts keyboard hyphen for unicode minus expected answer", () => {
      const exercise = makeExercise({
        type: "numerical",
        prompt: "Calcula 5 − 3 × (2 + 1)",
        expectedAnswer: "−4",
      });
      const result = evaluateAnswer(exercise, "-4");
      expect(result.correct).toBe(true);
    });
  });

  describe("dispatches to exact evaluator", () => {
    test("fill-blank exercise is case-insensitive", () => {
      const exercise = makeExercise({ type: "fill-blank", expectedAnswer: "hello" });
      const result = evaluateAnswer(exercise, "HELLO");
      expect(result.correct).toBe(true);
    });

    test("multiple-choice exercise uses exact match", () => {
      const exercise = makeExercise({ type: "multiple-choice", expectedAnswer: "B" });
      const result = evaluateAnswer(exercise, "b");
      expect(result.correct).toBe(true);
    });
  });

  describe("dispatches to boolean evaluator", () => {
    test("true-false exercise accepts v as true", () => {
      const exercise = makeExercise({ type: "true-false", expectedAnswer: "true" });
      const result = evaluateAnswer(exercise, "v");
      expect(result.correct).toBe(true);
    });

    test("true-false exercise accepts verdadero as true", () => {
      const exercise = makeExercise({ type: "true-false", expectedAnswer: "true" });
      const result = evaluateAnswer(exercise, "verdadero");
      expect(result.correct).toBe(true);
    });

    test("true-false exercise accepts f as false", () => {
      const exercise = makeExercise({ type: "true-false", expectedAnswer: "false" });
      const result = evaluateAnswer(exercise, "f");
      expect(result.correct).toBe(true);
    });

    test("true-false exercise accepts no as false", () => {
      const exercise = makeExercise({ type: "true-false", expectedAnswer: "false" });
      const result = evaluateAnswer(exercise, "no");
      expect(result.correct).toBe(true);
    });
  });

  describe("unsupported types return manual-review", () => {
    test("graphical returns manual-review", () => {
      const exercise = makeExercise({ type: "graphical", expectedAnswer: "any" });
      const result = evaluateAnswer(exercise, "student answer");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("unsupported_type");
      expect(result.feedback).toBe("manual-review");
    });

    test("matching returns manual-review", () => {
      const exercise = makeExercise({ type: "matching", expectedAnswer: "any" });
      const result = evaluateAnswer(exercise, "student answer");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("unsupported_type");
      expect(result.feedback).toBe("manual-review");
    });

    test("ordering returns manual-review", () => {
      const exercise = makeExercise({ type: "ordering", expectedAnswer: "any" });
      const result = evaluateAnswer(exercise, "student answer");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("unsupported_type");
      expect(result.feedback).toBe("manual-review");
    });
  });

  describe("configuration error for mismatched type-answer shape", () => {
    test("numerical exercise with non-numeric expected answer returns configuration error", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "x = -2, x = 2",
      });
      const result = evaluateAnswer(exercise, "5");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("configuration_error");
    });

    test("numerical exercise with valid numeric expected answer does NOT return configuration error", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "42",
      });
      const result = evaluateAnswer(exercise, "42");
      expect(result.correct).toBe(true);
      expect(result.errorTag).toBeUndefined();
    });

    test("numerical exercise with non-numeric expected answer returns configuration error even on empty student answer", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "x = 3, y = 2",
      });
      const result = evaluateAnswer(exercise, "");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("configuration_error");
    });

    test("numerical exercise with unicode minus numeric expected answer does NOT return configuration error", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "−4",
      });
      const result = evaluateAnswer(exercise, "-4");
      expect(result.correct).toBe(true);
      expect(result.errorTag).toBeUndefined();
    });

    test("numerical exercise with spaced numeric expected answer does NOT return configuration error", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "  3.14  ",
      });
      const result = evaluateAnswer(exercise, "3.14");
      expect(result.correct).toBe(true);
      expect(result.errorTag).toBeUndefined();
    });
  });

  describe("empty answer", () => {
    test("empty answer is always incorrect", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "5" });
      const result = evaluateAnswer(exercise, "");
      expect(result.correct).toBe(false);
    });
  });

  describe("migrated symbolic exercises", () => {
    const migratedExercises = [
      {
        id: "ex.u2.operaciones_polinomios.1",
        expectedType: "multiple-choice",
        correctAnswer: "2x² - 5x - 3",
        wrongAnswer: "2x² - 6x - 3",
      },
      {
        id: "ex.u2.gauss.1",
        expectedType: "multiple-choice",
        correctAnswer: "1, -1, 3",
        wrongAnswer: "1, 3, -3",
      },
      {
        id: "ex.u3.inecuaciones_lineales.1",
        expectedType: "multiple-choice",
        correctAnswer: "x > 2",
        wrongAnswer: "x < 2",
      },
      {
        id: "ex.u3.recta.1",
        expectedType: "numerical",
        correctAnswer: "1",
        wrongAnswer: "2",
      },
      {
        id: "ex.u3.sistemas.1",
        expectedType: "multiple-choice",
        correctAnswer: "x = 3, y = 1",
        wrongAnswer: "x = 1, y = 3",
      },
      {
        id: "ex.u4.thales.1",
        expectedType: "multiple-choice",
        correctAnswer: "Los segmentos correspondientes son proporcionales",
        wrongAnswer: "Los segmentos correspondientes son congruentes",
      },
      {
        id: "ex.u5.identidades.1",
        expectedType: "numerical",
        correctAnswer: "1",
        wrongAnswer: "0",
      },
      {
        id: "ex.u5.ecuaciones_trigonometricas.1",
        expectedType: "multiple-choice",
        correctAnswer: "θ = 0°, 180°",
        wrongAnswer: "θ = 90°, 270°",
      },
      {
        id: "ex.u6.dominio_imagen.1",
        expectedType: "multiple-choice",
        correctAnswer: "Todos los reales excepto 0",
        wrongAnswer: "Todos los reales",
      },
      {
        id: "ex.u6.funcion_afin.1",
        expectedType: "numerical",
        correctAnswer: "2",
        wrongAnswer: "3",
      },
      {
        id: "ex.u6.funcion_cuadratica.1",
        expectedType: "multiple-choice",
        correctAnswer: "(2, -1)",
        wrongAnswer: "(-2, -1)",
      },
    ] as const;

    test.each(migratedExercises)(
      "$id evaluates correctly after migration to $expectedType",
      ({ id, expectedType, correctAnswer, wrongAnswer }) => {
        const exercise = loadCatalog().find((candidate) => candidate.id === id);

        expect(exercise).toBeDefined();
        expect(exercise?.type).toBe(expectedType);
        expect(evaluateAnswer(exercise!, correctAnswer).correct).toBe(true);
        expect(evaluateAnswer(exercise!, wrongAnswer).correct).toBe(false);
      }
    );

    test("ex.u5.radianes.1 evaluates as structured multiple-choice after migration", () => {
      const exercise = loadCatalog().find((candidate) => candidate.id === "ex.u5.radianes.1");

      expect(exercise).toBeDefined();
      expect(exercise?.type).toBe("multiple-choice");
      expect(evaluateAnswer(exercise!, "$\\pi$").correct).toBe(true);
      expect(evaluateAnswer(exercise!, "$\\dfrac{\\pi}{2}$").correct).toBe(false);
    });
  });

  describe("error-tag integration via evaluateAnswer", () => {
    test("incorrect numerical answer with declared sign-error tag returns the tag", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "5",
        commonErrorTags: ["u1_signo_racionalizacion"],
      });
      const result = evaluateAnswer(exercise, "-5");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("u1_signo_racionalizacion");
    });

    test("incorrect numerical answer with undeclared matching tag returns no tag", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "5",
        commonErrorTags: ["u1_orden_operaciones"],
      });
      const result = evaluateAnswer(exercise, "-5");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBeUndefined();
    });

    test("correct numerical answer with declared tags never returns errorTag", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "5",
        commonErrorTags: ["u1_signo_racionalizacion"],
      });
      const result = evaluateAnswer(exercise, "5");
      expect(result.correct).toBe(true);
      expect(result.errorTag).toBeUndefined();
    });

    test("incorrect numerical answer with empty commonErrorTags returns no tag", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "5",
        commonErrorTags: [],
      });
      const result = evaluateAnswer(exercise, "-5");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBeUndefined();
    });
  });

  describe("EvaluationResult shape", () => {
    test("correct result has no errorTag or feedback", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "5" });
      const result = evaluateAnswer(exercise, "5");
      expect(result.correct).toBe(true);
      expect(result.errorTag).toBeUndefined();
      expect(result.feedback).toBeUndefined();
    });

    test("incorrect result may have feedback", () => {
      const exercise = makeExercise({ type: "graphical", expectedAnswer: "any" });
      const result = evaluateAnswer(exercise, "wrong");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("unsupported_type");
      expect(result.feedback).toBe("manual-review");
    });
  });

  describe("Gauss numerical exercises are now multiple-choice (no raw-string routing)", () => {
    test("gauss.1 is multiple-choice, not numerical", () => {
      const exercise = loadCatalog().find((e) => e.id === "ex.u2.gauss.1");
      expect(exercise).toBeDefined();
      expect(exercise?.type).toBe("multiple-choice");
    });

    test("gauss.3 is numerical with single scalar answer", () => {
      const exercise = loadCatalog().find((e) => e.id === "ex.u2.gauss.3");
      expect(exercise).toBeDefined();
      expect(exercise?.type).toBe("numerical");
      expect(exercise?.expectedAnswer).toBe("1");
    });
  });

  describe("symbolic type removed — exercises converted to structured types", () => {
    test("no exercise in catalog uses symbolic type", () => {
      const catalog = loadCatalog();
      const symbolic = catalog.filter((e) => (e.type as string) === "symbolic");
      expect(symbolic.length).toBe(0);
    });

    test("mcm_mcd_polinomios.4 is now multiple-choice", () => {
      const exercise = loadCatalog().find((e) => e.id === "ex.u2.mcm_mcd_polinomios.4");
      expect(exercise).toBeDefined();
      expect(exercise?.type).toBe("multiple-choice");
      expect(exercise?.options).toBeDefined();
      expect(exercise!.options!.length).toBeGreaterThanOrEqual(3);
    });
  });
});
