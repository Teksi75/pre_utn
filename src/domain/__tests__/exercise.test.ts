import { describe, test, expect } from "vitest";
import { validateExercise, type Exercise, type ExerciseType, type Difficulty } from "../models/exercise";
import type { SkillId } from "../models/skill";

describe("Exercise validation", () => {
  const knownSkills = new Set<SkillId>([
    "mat.u1.reales_operaciones",
    "mat.u1.potencias_raices",
    "mat.u2.polinomios_basico",
  ]);

  const knownErrorTags = new Set<string>([
    "u1_order_of_operations",
    "u1_sign_error",
  ]);

  const validExercise: Exercise = {
    id: "ex.u1.reales_operaciones.1",
    skillId: "mat.u1.reales_operaciones",
    type: "numerical",
    difficulty: 2,
    prompt: "Calcula 3 + 5 × 2",
    expectedAnswer: "13",
    commonErrorTags: ["u1_order_of_operations"],
    pedagogicalNote: "Evalúa orden de operaciones",
  };

  describe("valid exercises are accepted", () => {
    test("exercise with valid ID, skill ref, and metadata passes", () => {
      const result = validateExercise(validExercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe("ex.u1.reales_operaciones.1");
        expect(result.value.skillId).toBe("mat.u1.reales_operaciones");
      }
    });
  });

  describe("all 9 exercise types are accepted", () => {
    const types: ExerciseType[] = [
      "multiple-choice",
      "true-false",
      "numerical",
      "symbolic",
      "fill-blank",
      "matching",
      "ordering",
      "free-response",
      "graphical",
    ];

    for (const [index, exerciseType] of types.entries()) {
      test(`type "${exerciseType}" is accepted`, () => {
        const exercise: Exercise = {
          ...validExercise,
          id: `ex.u1.reales_operaciones.${index + 1}` as Exercise["id"],
          type: exerciseType,
        };
        const result = validateExercise(exercise, knownSkills, knownErrorTags);
        expect(result.ok).toBe(true);
      });
    }
  });

  describe("invalid references are rejected", () => {
    test("unknown skillId is rejected", () => {
      const exercise: Exercise = {
        ...validExercise,
        skillId: "mat.u99.nonexistent" as Exercise["skillId"],
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("skillId");
        expect(result.error.message).toContain("mat.u99.nonexistent");
      }
    });

    test("known error tags are accepted", () => {
      const exercise: Exercise = {
        ...validExercise,
        commonErrorTags: ["u1_order_of_operations", "u1_sign_error"],
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(true);
    });

    test("unknown error tags are rejected", () => {
      const exercise: Exercise = {
        ...validExercise,
        commonErrorTags: ["u1_nonexistent_tag"],
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("commonErrorTags");
        expect(result.error.message).toContain("u1_nonexistent_tag");
      }
    });
  });

  describe("difficulty validation", () => {
    test("difficulty 0 is rejected", () => {
      const exercise: Exercise = { ...validExercise, difficulty: 0 as Difficulty };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("difficulty");
      }
    });

    test("difficulty 6 is rejected", () => {
      const exercise: Exercise = { ...validExercise, difficulty: 6 as Difficulty };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("difficulty");
      }
    });

    test("difficulty 1-5 are accepted", () => {
      for (let d = 1; d <= 5; d++) {
        const exercise: Exercise = { ...validExercise, difficulty: d as Difficulty };
        const result = validateExercise(exercise, knownSkills, knownErrorTags);
        expect(result.ok).toBe(true);
      }
    });
  });

  describe("ID format validation", () => {
    test("ID without ex.u prefix is rejected", () => {
      const exercise: Exercise = { ...validExercise, id: "bad_id" as Exercise["id"] };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("id");
      }
    });

    test("ID unit must match 1-6", () => {
      const exercise: Exercise = {
        ...validExercise,
        id: "ex.u7.reales_operaciones.1" as Exercise["id"],
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("id");
      }
    });
  });

  describe("missing required fields", () => {
    test("empty prompt is rejected", () => {
      const exercise: Exercise = { ...validExercise, prompt: "" };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("prompt");
      }
    });

    test("empty expectedAnswer is rejected", () => {
      const exercise: Exercise = { ...validExercise, expectedAnswer: "" };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("expectedAnswer");
      }
    });
  });
});
