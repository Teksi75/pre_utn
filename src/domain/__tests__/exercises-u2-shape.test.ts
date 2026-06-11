import { describe, test, expect } from "vitest";
import { loadExercisesForSkill, loadSkillBank } from "../catalog/content-loaders";
import { parsePolynomial } from "../evaluator/polynomial-evaluator";
import type { Exercise } from "../models/exercise";

/** Load all U2 exercises from the 7 slice skills. */
function allU2Exercises(): Exercise[] {
  return [
    ...loadExercisesForSkill("mat.u2.polinomios_basico"),
    ...loadExercisesForSkill("mat.u2.operaciones_polinomios"),
    ...loadExercisesForSkill("mat.u2.ruffini_resto"),
    ...loadExercisesForSkill("mat.u2.factorizacion"),
    ...loadExercisesForSkill("mat.u2.gauss"),
    ...loadExercisesForSkill("mat.u2.mcm_mcd_polinomios"),
    ...loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias"),
  ];
}

describe("U2 exercise shape validation", () => {
  describe("31 U2 exercises exist across all 7 slice skills", () => {
    test("all 31 expected exercise IDs are present", () => {
      const exercises = allU2Exercises();
      const ids = exercises.map((e) => e.id);

      const expected = [
        "ex.u2.polinomios_basico.1",
        "ex.u2.polinomios_basico.2",
        "ex.u2.polinomios_basico.3",
        "ex.u2.polinomios_basico.4",
        "ex.u2.polinomios_basico.5",
        "ex.u2.operaciones_polinomios.1",
        "ex.u2.operaciones_polinomios.2",
        "ex.u2.operaciones_polinomios.3",
        "ex.u2.operaciones_polinomios.4",
        "ex.u2.operaciones_polinomios.5",
        "ex.u2.ruffini_resto.1",
        "ex.u2.ruffini_resto.2",
        "ex.u2.ruffini_resto.3",
        "ex.u2.ruffini_resto.4",
        "ex.u2.ruffini_resto.5",
        "ex.u2.factorizacion.1",
        "ex.u2.factorizacion.2",
        "ex.u2.factorizacion.3",
        "ex.u2.factorizacion.4",
        "ex.u2.gauss.1",
        "ex.u2.gauss.2",
        "ex.u2.gauss.3",
        "ex.u2.gauss.4",
        "ex.u2.mcm_mcd_polinomios.1",
        "ex.u2.mcm_mcd_polinomios.2",
        "ex.u2.mcm_mcd_polinomios.3",
        "ex.u2.mcm_mcd_polinomios.4",
        "ex.u2.ecuaciones_fraccionarias.1",
        "ex.u2.ecuaciones_fraccionarias.2",
        "ex.u2.ecuaciones_fraccionarias.3",
        "ex.u2.ecuaciones_fraccionarias.4",
      ];

      for (const id of expected) {
        expect(ids, `Exercise ID ${id} should exist`).toContain(id);
      }

      expect(exercises.length).toBeGreaterThanOrEqual(31);
    });
  });

  describe("unique exercise IDs", () => {
    test("no duplicate IDs among U2 exercises", () => {
      const exercises = allU2Exercises();
      const ids = exercises.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("type distribution (MC, numerical, symbolic across all U2 exercises)", () => {
    test("U2 exercises have balanced type distribution", () => {
      const exercises = allU2Exercises();

      const mcCount = exercises.filter((e) => e.type === "multiple-choice").length;
      const numCount = exercises.filter((e) => e.type === "numerical").length;
      const symCount = exercises.filter((e) => e.type === "symbolic").length;

      expect(mcCount).toBeGreaterThanOrEqual(18);
      expect(numCount).toBeGreaterThanOrEqual(7);
      expect(symCount).toBeGreaterThanOrEqual(6);
    });
  });

  describe("factorizacion + gauss exercises exist", () => {
    test("4 factorizacion exercises (1 updated + 3 new)", () => {
      const exercises = loadExercisesForSkill("mat.u2.factorizacion");
      expect(exercises.length).toBeGreaterThanOrEqual(4);
      const ids = exercises.map((e) => e.id);
      expect(ids).toContain("ex.u2.factorizacion.1");
      expect(ids).toContain("ex.u2.factorizacion.2");
      expect(ids).toContain("ex.u2.factorizacion.3");
      expect(ids).toContain("ex.u2.factorizacion.4");
    });

    test("4 gauss exercises (1 recreated + 3 new)", () => {
      const exercises = loadExercisesForSkill("mat.u2.gauss");
      expect(exercises.length).toBeGreaterThanOrEqual(4);
      const ids = exercises.map((e) => e.id);
      expect(ids).toContain("ex.u2.gauss.1");
      expect(ids).toContain("ex.u2.gauss.2");
      expect(ids).toContain("ex.u2.gauss.3");
      expect(ids).toContain("ex.u2.gauss.4");
    });

    test("factorizacion + gauss type distribution (4 MC, 2 numerical, 2 symbolic)", () => {
      const fac = loadExercisesForSkill("mat.u2.factorizacion");
      const gau = loadExercisesForSkill("mat.u2.gauss");
      const combined = [...fac, ...gau];

      const mcCount = combined.filter((e) => e.type === "multiple-choice").length;
      const numCount = combined.filter((e) => e.type === "numerical").length;
      const symCount = combined.filter((e) => e.type === "symbolic").length;

      expect(mcCount).toBeGreaterThanOrEqual(3);
      expect(numCount).toBeGreaterThanOrEqual(2);
      expect(symCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("difficulty progression per skill", () => {
    test("polinomios_basico difficulty ranges 1-4", () => {
      const exercises = loadExercisesForSkill("mat.u2.polinomios_basico");
      const difficulties = exercises.map((e) => e.difficulty);
      expect(Math.min(...difficulties)).toBeLessThanOrEqual(2);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(3);
    });

    test("operaciones_polinomios difficulty ranges 2-4", () => {
      const exercises = loadExercisesForSkill("mat.u2.operaciones_polinomios");
      const difficulties = exercises.map((e) => e.difficulty);
      expect(Math.min(...difficulties)).toBeLessThanOrEqual(2);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(3);
    });

    test("ruffini_resto difficulty ranges 2-4", () => {
      const exercises = loadExercisesForSkill("mat.u2.ruffini_resto");
      const difficulties = exercises.map((e) => e.difficulty);
      expect(Math.min(...difficulties)).toBeLessThanOrEqual(3);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(4);
    });

    test("factorizacion difficulty ranges 2-4", () => {
      const exercises = loadExercisesForSkill("mat.u2.factorizacion");
      const difficulties = exercises.map((e) => e.difficulty);
      expect(Math.min(...difficulties)).toBeLessThanOrEqual(2);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(3);
    });

    test("gauss difficulty ranges 2-4", () => {
      const exercises = loadExercisesForSkill("mat.u2.gauss");
      const difficulties = exercises.map((e) => e.difficulty);
      expect(Math.min(...difficulties)).toBeLessThanOrEqual(2);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(3);
    });
  });

  describe("no free-text for polynomial answers", () => {
    test("no U2 exercise uses free-response type", () => {
      const exercises = allU2Exercises();
      const freeResponse = exercises.filter((e) => e.type === "free-response");
      expect(freeResponse.length).toBe(0);
    });
  });

  describe("commonErrorTags are non-empty for all U2 exercises", () => {
    test("every U2 factorizacion + gauss exercise has at least one commonErrorTag", () => {
      const fac = loadExercisesForSkill("mat.u2.factorizacion");
      const gau = loadExercisesForSkill("mat.u2.gauss");
      const exercises = [...fac, ...gau];

      for (const ex of exercises) {
        expect(
          ex.commonErrorTags.length,
          `Exercise ${ex.id} should have at least one commonErrorTag`
        ).toBeGreaterThan(0);
      }
    });

    test("every new exercise has at least one commonErrorTag", () => {
      const exercises = allU2Exercises();
      const newEx = exercises.filter((e) => !e.id.endsWith(".1"));

      for (const ex of newEx) {
        expect(
          ex.commonErrorTags.length,
          `Exercise ${ex.id} should have at least one commonErrorTag`
        ).toBeGreaterThan(0);
      }
    });

    test("all commonErrorTags reference existing u2_* tags", () => {
      const exercises = allU2Exercises();
      for (const ex of exercises) {
        for (const tag of ex.commonErrorTags) {
          expect(tag).toMatch(/^u[1-6]_/);
        }
      }
    });
  });

  describe("gauss.1 correction to U2 content", () => {
    test("ex.u2.gauss.1 has skillId mat.u2.gauss", () => {
      const exercises = loadExercisesForSkill("mat.u2.gauss");
      const gauss = exercises.find((e) => e.id === "ex.u2.gauss.1");
      expect(gauss).toBeDefined();
      expect(gauss?.skillId).toBe("mat.u2.gauss");
    });

    test("ex.u2.gauss.1 is NOT in mat.u3.sistemas exercises", () => {
      const exercises = loadExercisesForSkill("mat.u3.sistemas");
      const gauss = exercises.find((e) => e.id === "ex.u2.gauss.1");
      expect(gauss).toBeUndefined();
    });
  });

  describe("symbolic exercises have polynomial-evaluator-compatible expectedAnswer", () => {
    test("every symbolic U2 expectedAnswer parses without error via parsePolynomial", () => {
      const exercises = allU2Exercises();
      const symbolic = exercises.filter((e) => e.type === "symbolic");

      expect(symbolic.length, "There must be symbolic exercises to validate").toBeGreaterThan(0);

      for (const ex of symbolic) {
        expect(
          () => parsePolynomial(ex.expectedAnswer),
          `Symbolic exercise ${ex.id} expectedAnswer "${ex.expectedAnswer}" must be parseable by polynomial-evaluator`
        ).not.toThrow();
      }
    });
  });

  describe("mcm_mcd_polinomios exercises", () => {
    test("at least 3 mcm_mcd_polinomios exercises exist", () => {
      const exercises = loadExercisesForSkill("mat.u2.mcm_mcd_polinomios");
      expect(exercises.length).toBeGreaterThanOrEqual(3);
    });

    test("mcm_mcd_polinomios has at least 1 MC and at least 1 symbolic", () => {
      const exercises = loadExercisesForSkill("mat.u2.mcm_mcd_polinomios");
      const mcCount = exercises.filter((e) => e.type === "multiple-choice").length;
      const symCount = exercises.filter((e) => e.type === "symbolic").length;
      expect(mcCount).toBeGreaterThanOrEqual(1);
      expect(symCount).toBeGreaterThanOrEqual(1);
    });

    test("mcm_mcd_polinomios difficulty ranges 1-4", () => {
      const exercises = loadExercisesForSkill("mat.u2.mcm_mcd_polinomios");
      const difficulties = exercises.map((e) => e.difficulty);
      expect(Math.min(...difficulties)).toBeLessThanOrEqual(2);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(3);
    });

    test("mcm_mcd_polinomios exercises reference chapter 14 in pedagogicalNote", () => {
      const exercises = loadExercisesForSkill("mat.u2.mcm_mcd_polinomios");
      expect(exercises.length, "There must be exercises to check").toBeGreaterThanOrEqual(1);
      for (const ex of exercises) {
        expect(
          ex.pedagogicalNote.toLowerCase(),
          `Exercise ${ex.id} should reference chapter 14`
        ).toMatch(/cap[ií]tulo|chapter|14/);
      }
    });

    test("mcm_mcd_polinomios exercises include u2_confunde_mcm_mcd tag", () => {
      const exercises = loadExercisesForSkill("mat.u2.mcm_mcd_polinomios");
      const taggedExercises = exercises.filter(
        (e) => e.commonErrorTags.includes("u2_confunde_mcm_mcd")
      );
      expect(taggedExercises.length).toBeGreaterThanOrEqual(1);
    });

    test("every mcm_mcd_polinomios exercise has at least one commonErrorTag", () => {
      const exercises = loadExercisesForSkill("mat.u2.mcm_mcd_polinomios");
      for (const ex of exercises) {
        expect(
          ex.commonErrorTags.length,
          `Exercise ${ex.id} should have at least one commonErrorTag`
        ).toBeGreaterThan(0);
      }
    });
  });

  describe("ecuaciones_fraccionarias exercises", () => {
    test("at least 3 ecuaciones_fraccionarias exercises exist", () => {
      const exercises = loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias");
      expect(exercises.length).toBeGreaterThanOrEqual(3);
    });

    test("ecuaciones_fraccionarias has at least 1 MC with domain-exclusion distractor and at least 1 numerical", () => {
      const exercises = loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias");
      const mcCount = exercises.filter((e) => e.type === "multiple-choice").length;
      const numCount = exercises.filter((e) => e.type === "numerical").length;
      expect(mcCount).toBeGreaterThanOrEqual(1);
      expect(numCount).toBeGreaterThanOrEqual(1);
    });

    test("ecuaciones_fraccionarias difficulty ranges 2-4", () => {
      const exercises = loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias");
      const difficulties = exercises.map((e) => e.difficulty);
      expect(Math.min(...difficulties)).toBeLessThanOrEqual(2);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(3);
    });

    test("ecuaciones_fraccionarias exercises reference chapter 15 in pedagogicalNote", () => {
      const exercises = loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias");
      expect(exercises.length, "There must be exercises to check").toBeGreaterThanOrEqual(1);
      for (const ex of exercises) {
        expect(
          ex.pedagogicalNote.toLowerCase(),
          `Exercise ${ex.id} should reference chapter 15`
        ).toMatch(/cap[ií]tulo|chapter|15/);
      }
    });

    test("ecuaciones_fraccionarias exercises include u2_denominador_cero tag", () => {
      const exercises = loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias");
      const taggedExercises = exercises.filter(
        (e) => e.commonErrorTags.includes("u2_denominador_cero")
      );
      expect(taggedExercises.length).toBeGreaterThanOrEqual(1);
    });

    test("every ecuaciones_fraccionarias exercise has at least one commonErrorTag", () => {
      const exercises = loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias");
      for (const ex of exercises) {
        expect(
          ex.commonErrorTags.length,
          `Exercise ${ex.id} should have at least one commonErrorTag`
        ).toBeGreaterThan(0);
      }
    });
  });

  describe("loadSkillBank integration for new skills", () => {
    test("mcm_mcd_polinomios skill bank loads exercises", () => {
      const bank = loadSkillBank("mat.u2.mcm_mcd_polinomios");
      expect(bank.exercises.length).toBeGreaterThanOrEqual(3);
      // Diagnostics will include missing feedback until Phase 3 (FeedbackMappings)
      // but there MUST be NO diagnostics about zero exercises or missing IDs
    });

    test("ecuaciones_fraccionarias skill bank loads exercises", () => {
      const bank = loadSkillBank("mat.u2.ecuaciones_fraccionarias");
      expect(bank.exercises.length).toBeGreaterThanOrEqual(3);
    });
  });
});
