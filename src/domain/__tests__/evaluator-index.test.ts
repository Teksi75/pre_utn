import { describe, test, expect } from "vitest";
import { evaluateAnswer } from "../evaluator/index";
import type { Exercise } from "../models/exercise";

describe("Evaluator dispatcher", () => {
  const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
    id: "ex.u1.reales_operaciones.1",
    skillId: "mat.u1.reales_operaciones",
    type: "numerical",
    difficulty: 2,
    prompt: "Calcula 3 + 5",
    expectedAnswer: "8",
    commonErrorTags: [],
    pedagogicalNote: "Test exercise",
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
    test("symbolic exercise with matching answer returns correct", () => {
      const exercise = makeExercise({ type: "symbolic", expectedAnswer: "x+1" });
      const result = evaluateAnswer(exercise, "x+1");
      expect(result.correct).toBe(true);
    });

    test("symbolic exercise trims whitespace", () => {
      const exercise = makeExercise({ type: "symbolic", expectedAnswer: "x+1" });
      const result = evaluateAnswer(exercise, "  x+1  ");
      expect(result.correct).toBe(true);
    });

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
    test("free-response returns manual-review", () => {
      const exercise = makeExercise({ type: "free-response", expectedAnswer: "any" });
      const result = evaluateAnswer(exercise, "student answer");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("unsupported_type");
      expect(result.feedback).toBe("manual-review");
    });

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

  describe("empty answer", () => {
    test("empty answer is always incorrect", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "5" });
      const result = evaluateAnswer(exercise, "");
      expect(result.correct).toBe(false);
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
      const exercise = makeExercise({ type: "free-response", expectedAnswer: "any" });
      const result = evaluateAnswer(exercise, "wrong");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("unsupported_type");
      expect(result.feedback).toBe("manual-review");
    });
  });
});
