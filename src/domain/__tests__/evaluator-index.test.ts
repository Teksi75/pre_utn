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

  describe("U3 aislamiento_incorrecto integration via evaluateAnswer (PR1)", () => {
    // Spec anchor: recuperar-u3-ecuaciones-lineales/PR1.
    // The detector is already implemented (isU3AislamientoIncorrectoError)
    // and is MC-only. Before PR1, no catalog entry declared the tag, so the
    // detector was unreachable from real content. PR1 wires a catalog item
    // to the detector through evaluateAnswer.
    test("evaluateAnswer on an MC isolation catalog item returns u3_aislamiento_incorrecto for the post-subtraction distractor", () => {
      const catalog = loadCatalog();
      const exercise = catalog.find(
        (e) =>
          e.skillId === "mat.u3.ecuaciones_lineales" &&
          e.type === "multiple-choice" &&
          (e.commonErrorTags ?? []).includes("u3_aislamiento_incorrecto"),
      );
      expect(
        exercise,
        "catalog must contain an MC ecuaciones_lineales item declaring u3_aislamiento_incorrecto",
      ).toBeDefined();
      // The exercise's expected answer must produce a correct evaluation
      // (no tag, correct: true).
      const correct = evaluateAnswer(exercise!, exercise!.expectedAnswer);
      expect(correct.correct, "expectedAnswer must evaluate as correct").toBe(true);
      expect(correct.errorTag, "expectedAnswer must not surface an error tag").toBeUndefined();

      // A wrong option that matches the post-subtraction intermediate
      // (c - b for "ax + b = c", c + b for "ax - b = c") must fire the
      // u3_aislamiento_incorrecto tag. We pick it by parsing the prompt.
      const prompt = exercise!.prompt.replace(/−/g, "-");
      const linearMatch = prompt.match(
        /(-?\d+)\s*[xX]\s*([+-])\s*(\d+)\s*=\s*(-?\d+)/,
      );
      expect(linearMatch, `${exercise!.id} prompt must match the ax ± b = c detector pattern`).not.toBeNull();
      const a = Number(linearMatch![1]);
      const op = linearMatch![2];
      const b = Number(linearMatch![3]);
      const c = Number(linearMatch![4]);
      const intermediate = op === "+" ? c - b : c + b;
      expect(
        intermediate,
        `${exercise!.id} intermediate must not be 0 (else detector skips it)`,
      ).not.toBe(0);
      const wrongOption = `x = ${intermediate}`;
      // The wrong distractor must be one of the catalog options.
      const optionValues = exercise!.options!.map((opt) =>
        typeof opt === "string" ? opt : opt.value,
      );
      expect(
        optionValues,
        `${exercise!.id} must include the post-subtraction distractor "${wrongOption}" among its options`,
      ).toContain(wrongOption);

      const wrong = evaluateAnswer(exercise!, wrongOption);
      expect(wrong.correct, "post-subtraction distractor must be incorrect").toBe(false);
      expect(
        wrong.errorTag,
        "post-subtraction distractor must surface the u3_aislamiento_incorrecto tag",
      ).toBe("u3_aislamiento_incorrecto");
    });
  });
});
