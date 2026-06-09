import { describe, test, expect } from "vitest";
import {
  detectPrerequisiteCycles,
  loadCatalog,
  queryByDifficultyRange,
  queryBySkill,
  queryByUnit,
} from "../catalog/index";
import type { Exercise } from "../models/exercise";
import type { SkillDependency } from "../models/skill-catalog";

describe("Exercise Catalog", () => {
  describe("loadCatalog", () => {
    test("loads a catalog with at least 30 exercises", () => {
      const catalog = loadCatalog();
      expect(catalog).toBeInstanceOf(Array);
      expect(catalog.length).toBeGreaterThanOrEqual(30);
    });

    test("each unit has at least 5 exercises", () => {
      const catalog = loadCatalog();
      for (let unit = 1; unit <= 6; unit++) {
        const unitExercises = catalog.filter((e) => {
          // extract unit from skillId: mat.u{unit}.xxx
          const match = e.skillId.match(/^mat\.u(\d+)\./);
          return match && Number(match[1]) === unit;
        });
        expect(unitExercises.length).toBeGreaterThanOrEqual(5);
      }
    });

    test("all exercises have valid skill IDs (known in catalog)", () => {
      const catalog = loadCatalog();
      const knownSkillIds = new Set([
        "mat.u1.conjuntos_numericos",
        "mat.u1.reales_operaciones",
        "mat.u1.potencias_raices",
        "mat.u1.racionalizacion",
        "mat.u1.intervalos",
        "mat.u1.valor_absoluto",
        "mat.u1.logaritmos",
        "mat.u1.complejos",
        "mat.u2.polinomios_basico",
        "mat.u2.operaciones_polinomios",
        "mat.u2.ruffini_resto",
        "mat.u2.factorizacion",
        "mat.u2.gauss",
        "mat.u2.mcm_mcd_polinomios",
        "mat.u2.ecuaciones_fraccionarias",
        "mat.u3.ecuaciones_lineales",
        "mat.u3.ecuaciones_cuadraticas",
        "mat.u3.inecuaciones_lineales",
        "mat.u3.inecuaciones_valor_absoluto",
        "mat.u3.recta",
        "mat.u3.sistemas",
        "mat.u3.exponenciales",
        "mat.u3.logaritmicas",
        "mat.u4.perimetro_area_volumen",
        "mat.u4.proporciones",
        "mat.u4.thales",
        "mat.u4.pitagoras",
        "mat.u4.razones_trigonometricas",
        "mat.u4.seno_coseno",
        "mat.u5.angulos",
        "mat.u5.radianes",
        "mat.u5.circunferencia_trigonometrica",
        "mat.u5.identidades",
        "mat.u5.ecuaciones_trigonometricas",
        "mat.u5.complejos_forma_polar",
        "mat.u6.funcion_concepto",
        "mat.u6.dominio_imagen",
        "mat.u6.ceros_positividad_negatividad",
        "mat.u6.crecimiento_decrecimiento",
        "mat.u6.funcion_afin",
        "mat.u6.funcion_cuadratica",
        "mat.u6.funcion_exponencial",
        "mat.u6.funcion_logaritmica",
        "mat.u6.funcion_trigonometrica",
        "mat.u6.funcion_por_tramos",
      ]);
      for (const exercise of catalog) {
        expect(knownSkillIds.has(exercise.skillId)).toBe(true);
      }
    });

    test("all exercises have required fields", () => {
      const catalog = loadCatalog();
      for (const exercise of catalog) {
        expect(exercise).toHaveProperty("id");
        expect(exercise).toHaveProperty("skillId");
        expect(exercise).toHaveProperty("type");
        expect(exercise).toHaveProperty("difficulty");
        expect(exercise).toHaveProperty("prompt");
        expect(exercise).toHaveProperty("expectedAnswer");
        expect(exercise).toHaveProperty("commonErrorTags");
        expect(exercise).toHaveProperty("pedagogicalNote");
        expect(typeof exercise.id).toBe("string");
        expect(typeof exercise.skillId).toBe("string");
        expect(typeof exercise.type).toBe("string");
        expect(typeof exercise.difficulty).toBe("number");
        expect(typeof exercise.prompt).toBe("string");
        expect(typeof exercise.expectedAnswer).toBe("string");
        expect(Array.isArray(exercise.commonErrorTags)).toBe(true);
        expect(typeof exercise.pedagogicalNote).toBe("string");
      }
    });

    test("exercise IDs follow ex.u{1-6}.{slug}.{number} pattern", () => {
      const catalog = loadCatalog();
      // Accepts both legacy numeric IDs (ex.u1.conjuntos_numericos.1)
      // and bank-code IDs from per-skill files (ex.u1.conjuntos_numericos.cn-per-01)
      const idPattern = /^ex\.u[1-6]\.[a-z_]+\.([a-z]+-[a-z]+-\d+|\d+)$/;
      for (const exercise of catalog) {
        expect(exercise.id).toMatch(idPattern);
      }
    });

    test("detects prerequisite cycles in skill dependencies", () => {
      const cyclicDependencies: readonly SkillDependency[] = [
        { skillId: "mat.u1.reales_operaciones", prerequisites: ["mat.u1.potencias_raices"] },
        { skillId: "mat.u1.potencias_raices", prerequisites: ["mat.u1.racionalizacion"] },
        { skillId: "mat.u1.racionalizacion", prerequisites: ["mat.u1.reales_operaciones"] },
      ];

      expect(detectPrerequisiteCycles(cyclicDependencies)).toEqual([
        ["mat.u1.reales_operaciones", "mat.u1.potencias_raices", "mat.u1.racionalizacion", "mat.u1.reales_operaciones"],
      ]);
    });

    test("accepts the current prerequisite graph as acyclic", () => {
      expect(detectPrerequisiteCycles()).toEqual([]);
    });
  });

  describe("queryByUnit", () => {
    test("returns exercises for a specific unit", () => {
      const catalog = loadCatalog();
      const unit1 = queryByUnit(1);
      expect(unit1.length).toBeGreaterThanOrEqual(5);
      for (const exercise of unit1) {
        const match = exercise.skillId.match(/^mat\.u(\d+)\./);
        expect(match && Number(match[1])).toBe(1);
      }
    });

    test("returns empty array for unit with no exercises", () => {
      const unit7 = queryByUnit(7);
      expect(unit7).toEqual([]);
    });

    test("returns exercises sorted by difficulty ascending, then ID ascending", () => {
      const catalog = loadCatalog();
      const unit2 = queryByUnit(2);
      // Verify sorting
      for (let i = 1; i < unit2.length; i++) {
        const prev = unit2[i - 1];
        const curr = unit2[i];
        if (prev.difficulty === curr.difficulty) {
          expect(prev.id.localeCompare(curr.id)).toBeLessThanOrEqual(0);
        } else {
          expect(prev.difficulty).toBeLessThanOrEqual(curr.difficulty);
        }
      }
    });
  });

  describe("queryBySkill", () => {
    test("returns exercises for a specific skill", () => {
      const catalog = loadCatalog();
      const skillExercises = queryBySkill("mat.u1.reales_operaciones");
      expect(skillExercises.length).toBeGreaterThanOrEqual(1);
      for (const exercise of skillExercises) {
        expect(exercise.skillId).toBe("mat.u1.reales_operaciones");
      }
    });

    test("returns empty array for unknown skill", () => {
      const unknown = queryBySkill("mat.u99.unknown");
      expect(unknown).toEqual([]);
    });

    test("returns exercises sorted by difficulty ascending, then ID ascending", () => {
      const catalog = loadCatalog();
      const skillExercises = queryBySkill("mat.u3.ecuaciones_lineales");
      for (let i = 1; i < skillExercises.length; i++) {
        const prev = skillExercises[i - 1];
        const curr = skillExercises[i];
        if (prev.difficulty === curr.difficulty) {
          expect(prev.id.localeCompare(curr.id)).toBeLessThanOrEqual(0);
        } else {
          expect(prev.difficulty).toBeLessThanOrEqual(curr.difficulty);
        }
      }
    });
  });

  describe("queryByDifficultyRange", () => {
    test("returns exercises inside an inclusive difficulty range", () => {
      const exercises = queryByDifficultyRange(2, 3);
      expect(exercises.length).toBeGreaterThan(0);
      for (const exercise of exercises) {
        expect(exercise.difficulty).toBeGreaterThanOrEqual(2);
        expect(exercise.difficulty).toBeLessThanOrEqual(3);
      }
    });

    test("returns empty array when no difficulty matches", () => {
      expect(queryByDifficultyRange(6, 7)).toEqual([]);
    });

    test("returns exercises sorted by difficulty ascending, then ID ascending", () => {
      const exercises = queryByDifficultyRange(1, 5);
      for (let i = 1; i < exercises.length; i++) {
        const prev = exercises[i - 1];
        const curr = exercises[i];
        if (prev.difficulty === curr.difficulty) {
          expect(prev.id.localeCompare(curr.id)).toBeLessThanOrEqual(0);
        } else {
          expect(prev.difficulty).toBeLessThanOrEqual(curr.difficulty);
        }
      }
    });
  });

  describe("Exercise shape", () => {
    test("difficulty is between 1 and 5", () => {
      const catalog = loadCatalog();
      for (const exercise of catalog) {
        expect(exercise.difficulty).toBeGreaterThanOrEqual(1);
        expect(exercise.difficulty).toBeLessThanOrEqual(5);
      }
    });

    test("type is one of the allowed exercise types", () => {
      const allowedTypes = new Set([
        "multiple-choice",
        "true-false",
        "numerical",
        "symbolic",
        "fill-blank",
        "matching",
        "ordering",
        "free-response",
        "graphical",
      ]);
      const catalog = loadCatalog();
      for (const exercise of catalog) {
        expect(allowedTypes.has(exercise.type)).toBe(true);
      }
    });

    test("student-facing catalog excludes symbolic exercise types", () => {
      const catalog = loadCatalog();

      for (const exercise of catalog) {
        expect(exercise.type).not.toBe("symbolic");
      }
    });

    test("prompt is non-empty", () => {
      const catalog = loadCatalog();
      for (const exercise of catalog) {
        expect(exercise.prompt.trim().length).toBeGreaterThan(0);
      }
    });

    test("expectedAnswer is non-empty", () => {
      const catalog = loadCatalog();
      for (const exercise of catalog) {
        expect(exercise.expectedAnswer.trim().length).toBeGreaterThan(0);
      }
    });
  });
});
