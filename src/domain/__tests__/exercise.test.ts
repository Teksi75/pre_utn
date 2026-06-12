import { describe, test, expect } from "vitest";
import { validateExercise, type Exercise, type ExerciseType, type Difficulty } from "../models/exercise";
import type { SkillId } from "../models/skill";

describe("Exercise validation", () => {
  const knownSkills = new Set<SkillId>([
    "mat.u1.propiedades_operaciones_reales",
    "mat.u1.potencias_raices",
    "mat.u2.polinomios_basico",
  ]);

  const knownErrorTags = new Set<string>([
    "u1_order_of_operations",
    "u1_sign_error",
  ]);

  const validExercise: Exercise = {
    id: "ex.u1.propiedades_operaciones_reales.1",
    skillId: "mat.u1.propiedades_operaciones_reales",
    type: "numerical",
    difficulty: 2,
    prompt: "Calcula 3 + 5 × 2",
    expectedAnswer: "13",
    commonErrorTags: ["u1_order_of_operations"],
    pedagogicalNote: "Evalúa orden de operaciones",
    unit: 1,
  };

  describe("valid exercises are accepted", () => {
    test("exercise with valid ID, skill ref, and metadata passes", () => {
      const result = validateExercise(validExercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe("ex.u1.propiedades_operaciones_reales.1");
        expect(result.value.skillId).toBe("mat.u1.propiedades_operaciones_reales");
      }
    });
  });

  describe("all 7 exercise types are accepted", () => {
    const types: ExerciseType[] = [
      "multiple-choice",
      "true-false",
      "numerical",
      "fill-blank",
      "matching",
      "ordering",
      "graphical",
    ];

    for (const [index, exerciseType] of types.entries()) {
      test(`type "${exerciseType}" is accepted`, () => {
        const exercise: Exercise = {
          ...validExercise,
          id: `ex.u1.propiedades_operaciones_reales.${index + 1}` as Exercise["id"],
          type: exerciseType,
          ...(exerciseType === "multiple-choice"
            ? { options: ["13", "10", "16", "11"] }
            : {}),
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

    test("existing numeric final segment is accepted", () => {
      const exercise: Exercise = { ...validExercise, id: "ex.u1.propiedades_operaciones_reales.1" as Exercise["id"] };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(true);
    });

    test("slug-style final segment (cn-per-01) is accepted", () => {
      const exercise: Exercise = {
        ...validExercise,
        id: "ex.u1.conjuntos_numericos.cn-per-01" as Exercise["id"],
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(true);
    });
  });

  describe("optional metadata fields", () => {
    test("exercise without category and tags is valid (backward compat)", () => {
      const exercise: Exercise = { ...validExercise };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.category).toBeUndefined();
        expect(result.value.tags).toBeUndefined();
      }
    });

    test("exercise with category and tags is valid", () => {
      const exercise: Exercise = {
        ...validExercise,
        category: "clasificacion",
        tags: ["u1_conjunto_minimo", "pertenencia"],
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.category).toBe("clasificacion");
        expect(result.value.tags).toEqual(["u1_conjunto_minimo", "pertenencia"]);
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

  describe("type-answer shape validation", () => {
    test("numerical type with multi-value answer (comma-separated) is rejected", () => {
      const exercise: Exercise = {
        ...validExercise,
        type: "numerical",
        expectedAnswer: "x = -2, x = 2",
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("expectedAnswer");
      }
    });

    test("numerical type with system-of-equations answer is rejected", () => {
      const exercise: Exercise = {
        ...validExercise,
        type: "numerical",
        expectedAnswer: "x = 3, y = 2",
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("expectedAnswer");
      }
    });

    test.each([
      "x = 3; y = 2",
      "{1, 2}",
      "x = 4",
      "0° 180°",
    ])("numerical type with structured symbolic answer %s is rejected", (expectedAnswer) => {
      const exercise: Exercise = {
        ...validExercise,
        type: "numerical",
        expectedAnswer,
      };

      const result = validateExercise(exercise, knownSkills, knownErrorTags);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("expectedAnswer");
      }
    });

    test("numerical type with non-finite symbolic scalar answer is rejected", () => {
      const exercise: Exercise = {
        ...validExercise,
        type: "numerical",
        expectedAnswer: "π",
      };

      const result = validateExercise(exercise, knownSkills, knownErrorTags);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("expectedAnswer");
        expect(result.error.message).toContain("finite numeric");
      }
    });

    test("numerical type with valid single numeric answer is accepted", () => {
      const exercise: Exercise = {
        ...validExercise,
        type: "numerical",
        expectedAnswer: "42",
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(true);
    });

    test("numerical type with decimal numeric answer is accepted", () => {
      const exercise: Exercise = {
        ...validExercise,
        type: "numerical",
        expectedAnswer: "3.14",
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(true);
    });

    test.each(["1e3", "-1e-3"]) (
      "numerical type with scientific notation answer %s is accepted",
      (expectedAnswer) => {
        const exercise: Exercise = {
          ...validExercise,
          type: "numerical",
          expectedAnswer,
        };

        const result = validateExercise(exercise, knownSkills, knownErrorTags);

        expect(result.ok).toBe(true);
      }
    );

    test("multiple-choice with multi-value answer that IS in options is accepted", () => {
      const exercise: Exercise = {
        ...validExercise,
        type: "multiple-choice",
        expectedAnswer: "x = -2, x = 2",
        options: ["x = -2, x = 2", "x = 2", "x = -4, x = 4", "x = 0"],
      };
      const result = validateExercise(exercise, knownSkills, knownErrorTags);
      expect(result.ok).toBe(true);
    });
  });
});
