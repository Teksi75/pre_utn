import { describe, test, expect } from "vitest";
import { validateSkill, type Skill, type SkillId } from "../models/skill";

describe("Skill validation", () => {
  const validSkill: Skill = {
    id: "mat.u1.numeros_reales",
    unit: 1,
    displayName: "Números reales",
    description: "Operaciones con números reales",
    prerequisites: [],
    learnerPurpose: "Practicar operaciones básicas",
    teacherInterpretation: ["Domina operaciones fundamentales"],
    tags: ["aritmética", "base"],
  };

  describe("valid skills are accepted", () => {
    test("skill with valid ID and metadata passes", () => {
      const result = validateSkill(validSkill, new Set());
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe("mat.u1.numeros_reales");
        expect(result.value.unit).toBe(1);
      }
    });

    test("skill with prerequisite referencing known skill passes", () => {
      const skill: Skill = {
        ...validSkill,
        id: "mat.u1.potencias_raices",
        prerequisites: ["mat.u1.reales_operaciones"],
      };
      const known = new Set<SkillId>(["mat.u1.reales_operaciones"]);
      const result = validateSkill(skill, known);
      expect(result.ok).toBe(true);
    });
  });

  describe("invalid identity is rejected", () => {
    test("ID without mat.u prefix is rejected", () => {
      const skill: Skill = { ...validSkill, id: "math-1" as SkillId };
      const result = validateSkill(skill, new Set());
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("id");
      }
    });

    test("unit 7 is rejected", () => {
      const skill: Skill = { ...validSkill, unit: 7 as 1 | 2 | 3 | 4 | 5 | 6 };
      const result = validateSkill(skill, new Set());
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("unit");
      }
    });

    test("unit 0 is rejected", () => {
      const skill: Skill = { ...validSkill, unit: 0 as 1 | 2 | 3 | 4 | 5 | 6 };
      const result = validateSkill(skill, new Set());
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("unit");
      }
    });
  });

  describe("prerequisite integrity", () => {
    test("missing prerequisite is rejected", () => {
      const skill: Skill = {
        ...validSkill,
        id: "mat.u1.logaritmos",
        prerequisites: ["mat.u1.potencias_raices"],
      };
      const result = validateSkill(skill, new Set());
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("prerequisites");
        expect(result.error.message).toContain("mat.u1.potencias_raices");
      }
    });

    test("self-referencing prerequisite is rejected", () => {
      const skill: Skill = {
        ...validSkill,
        prerequisites: ["mat.u1.numeros_reales"],
      };
      const result = validateSkill(skill, new Set(["mat.u1.numeros_reales"]));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("prerequisites");
        expect(result.error.message).toContain("cycle");
      }
    });
  });

  describe("pedagogical metadata", () => {
    test("skill exposes learner purpose", () => {
      const result = validateSkill(validSkill, new Set());
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.learnerPurpose).toBeTruthy();
      }
    });

    test("skill exposes teacher interpretation", () => {
      const result = validateSkill(validSkill, new Set());
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.teacherInterpretation.length).toBeGreaterThan(0);
      }
    });
  });
});
