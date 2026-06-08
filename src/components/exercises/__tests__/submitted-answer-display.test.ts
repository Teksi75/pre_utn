import { describe, expect, it } from "vitest";
import { mapSubmittedAnswer } from "../submitted-answer-display";
import type { Exercise } from "@/domain/models/exercise";

type PartialWithSkill = Partial<Exercise> & { skillId?: Exercise["skillId"] };

/**
 * Minimal exercise factory so tests focus on behavior, not boilerplate.
 */
function makeExercise(overrides: PartialWithSkill = {}): Exercise {
  return {
    id: "ex.u1.testing.001",
    skillId: "mat.u1.operaciones",
    type: "numerical",
    difficulty: 1,
    prompt: "Test prompt",
    expectedAnswer: "42",
    commonErrorTags: [],
    pedagogicalNote: "",
    ...overrides,
  };
}

describe("mapSubmittedAnswer", () => {
  describe("text answer types (numerical, symbolic, fill-blank)", () => {
    it("maps a numerical answer to a single 'Respuesta' row", () => {
      const exercise = makeExercise({ type: "numerical" });
      const result = mapSubmittedAnswer(exercise, "42");

      expect(result).toEqual([{ label: "Respuesta", value: "42" }]);
    });

    it("maps a symbolic answer to a single 'Respuesta' row", () => {
      const exercise = makeExercise({
        type: "symbolic",
        expectedAnswer: "x^2 + 1",
      });
      const result = mapSubmittedAnswer(exercise, "x^2 + 1");

      expect(result).toEqual([{ label: "Respuesta", value: "x^2 + 1" }]);
    });

    it("maps a fill-blank answer to a single 'Respuesta' row", () => {
      const exercise = makeExercise({
        type: "fill-blank",
        expectedAnswer: "completar",
      });
      const result = mapSubmittedAnswer(exercise, "completar");

      expect(result).toEqual([{ label: "Respuesta", value: "completar" }]);
    });
  });

  describe("true-false", () => {
    it("returns 'Verdadero' label for 'true' submitted value", () => {
      const exercise = makeExercise({
        type: "true-false",
        expectedAnswer: "true",
      });
      const result = mapSubmittedAnswer(exercise, "true");

      expect(result).toEqual([{ label: "Verdadero", value: "true" }]);
    });

    it("returns 'Falso' label for 'false' submitted value", () => {
      const exercise = makeExercise({
        type: "true-false",
        expectedAnswer: "false",
      });
      const result = mapSubmittedAnswer(exercise, "false");

      expect(result).toEqual([{ label: "Falso", value: "false" }]);
    });
  });

  describe("multiple-choice — option object labels", () => {
    it("maps a stored option value to its corresponding label from exercise options", () => {
      const exercise = makeExercise({
        type: "multiple-choice",
        expectedAnswer: "opt-b",
        options: [
          { value: "opt-a", label: "$\\mathbb{N}$" },
          { value: "opt-b", label: "$\\mathbb{Z}$" },
          { value: "opt-c", label: "$\\mathbb{Q}$" },
        ],
      });
      const result = mapSubmittedAnswer(exercise, "opt-b");

      expect(result).toEqual([{ label: "$\\mathbb{Z}$", value: "opt-b" }]);
    });

    it("maps a plain-string option value to itself as both label and value", () => {
      const exercise = makeExercise({
        type: "multiple-choice",
        expectedAnswer: "plain",
        options: ["plain", "other"],
      });
      const result = mapSubmittedAnswer(exercise, "plain");

      expect(result).toEqual([{ label: "plain", value: "plain" }]);
    });
  });

  describe("multiple-choice — fallback when option not found", () => {
    it("displays raw submitted value when option is not in the exercise options list", () => {
      const exercise = makeExercise({
        type: "multiple-choice",
        expectedAnswer: "opt-a",
        options: [
          { value: "opt-a", label: "Opción A" },
          { value: "opt-b", label: "Opción B" },
        ],
      });
      const result = mapSubmittedAnswer(exercise, "desconocido");

      expect(result).toEqual([{ label: "desconocido", value: "desconocido" }]);
    });

    it("displays raw value when exercise has no options at all (defensive)", () => {
      const exercise = makeExercise({
        type: "multiple-choice",
        options: undefined,
      });
      const result = mapSubmittedAnswer(exercise, "algo");

      expect(result).toEqual([{ label: "algo", value: "algo" }]);
    });
  });

  describe("free-response and other non-text types", () => {
    it("maps a free-response answer to a single 'Respuesta' row", () => {
      const exercise = makeExercise({
        type: "free-response",
        expectedAnswer: "",
      });
      const result = mapSubmittedAnswer(
        exercise,
        "El alumno escribió un párrafo extenso de respuesta."
      );

      expect(result).toEqual([
        { label: "Respuesta", value: "El alumno escribió un párrafo extenso de respuesta." },
      ]);
    });

    it("maps a graphical answer to a single 'Respuesta' row", () => {
      const exercise = makeExercise({ type: "graphical", expectedAnswer: "" });
      const result = mapSubmittedAnswer(exercise, "drawn");

      expect(result).toEqual([{ label: "Respuesta", value: "drawn" }]);
    });
  });
});
