import { describe, test, expect } from "vitest";
import { validateExercise, type Exercise } from "../models/exercise";
import type { SkillId } from "../models/skill";

describe("Exercise options field", () => {
  const knownSkills = new Set<SkillId>([
    "mat.u1.propiedades_operaciones_reales",
    "mat.u1.intervalos",
  ]);

  const knownErrorTags = new Set<string>([
    "u1_orden_operaciones",
    "u1_extremo_inclusion",
    "u1_error_intervalo",
  ]);

  const baseExercise: Exercise = {
    id: "ex.u1.intervalos.1",
    skillId: "mat.u1.intervalos",
    type: "multiple-choice",
    difficulty: 2,
    prompt: "¿Qué intervalo representa x > 3?",
    expectedAnswer: "(3, ∞)",
    commonErrorTags: ["u1_extremo_inclusion"],
    pedagogicalNote: "Test",
    unit: 1,
  };

  describe("multiple-choice exercises without options are rejected", () => {
    test("multiple-choice without options fails validation", () => {
      const result = validateExercise(baseExercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("options");
      }
    });
  });

  describe("multiple-choice exercises with options are accepted", () => {
    test("with valid options array passes", () => {
      const exercise: Exercise = {
        ...baseExercise,
        options: ["(3, ∞)", "[3, ∞)", "(3, ∞]", "[3, ∞]"],
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(true);
    });

    test("options must have at least 2 choices", () => {
      const exercise: Exercise = {
        ...baseExercise,
        options: ["(3, ∞)"],
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("options");
      }
    });

    test("expectedAnswer must be one of the options", () => {
      const exercise: Exercise = {
        ...baseExercise,
        options: ["(3, ∞)", "[3, ∞)", "(3, ∞]", "[3, ∞]"],
        expectedAnswer: "not-in-options",
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("expectedAnswer");
        expect(result.error.message).toContain("options");
      }
    });

    test("options must not be empty", () => {
      const exercise: Exercise = {
        ...baseExercise,
        options: [],
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
    });
  });

  describe("non-multiple-choice exercises ignore options", () => {
    test("numerical without options passes", () => {
      const exercise: Exercise = {
        ...baseExercise,
        id: "ex.u1.propiedades_operaciones_reales.1" as Exercise["id"],
        skillId: "mat.u1.propiedades_operaciones_reales",
        type: "numerical",
        prompt: "Calcula 2 + 3 × 4",
        expectedAnswer: "14",
        commonErrorTags: ["u1_orden_operaciones"],
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(true);
    });

    test("numerical with options also passes (options ignored)", () => {
      const exercise: Exercise = {
        ...baseExercise,
        id: "ex.u1.propiedades_operaciones_reales.1" as Exercise["id"],
        skillId: "mat.u1.propiedades_operaciones_reales",
        type: "numerical",
        prompt: "Calcula 2 + 3 × 4",
        expectedAnswer: "14",
        commonErrorTags: ["u1_orden_operaciones"],
        options: ["14", "20", "10"],
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(true);
    });
  });
});
