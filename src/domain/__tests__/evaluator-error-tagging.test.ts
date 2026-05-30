import { describe, test, expect } from "vitest";
import { tagError } from "../evaluator/error-tagging";
import type { Exercise } from "../models/exercise";

describe("Error tagging — tagError()", () => {
  const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
    id: "ex.u1.reales_operaciones.1",
    skillId: "mat.u1.reales_operaciones",
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
