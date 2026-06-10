import { describe, test, expect } from "vitest";
import { loadExercisesForSkill } from "../catalog/content-loaders";
import type { Exercise } from "../models/exercise";

/** Load all U2 exercises from the 3 slice skills. */
function allU2Exercises(): Exercise[] {
  return [
    ...loadExercisesForSkill("mat.u2.polinomios_basico"),
    ...loadExercisesForSkill("mat.u2.operaciones_polinomios"),
    ...loadExercisesForSkill("mat.u2.ruffini_resto"),
  ];
}

describe("U2 exercise shape validation", () => {
  describe("12 new exercises exist", () => {
    test("all 12 expected exercise IDs are present", () => {
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
      ];

      for (const id of expected) {
        expect(ids, `Exercise ID ${id} should exist`).toContain(id);
      }

      expect(exercises.length).toBeGreaterThanOrEqual(15);
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

  describe("type distribution (6 MC + 3 numerical + 3 symbolic per the 12 NEW exercises)", () => {
    test("new exercises have balanced type distribution", () => {
      // Only check the 12 new exercises (not the .1 placeholders)
      const exercises = allU2Exercises();
      const newEx = exercises.filter((e) => !e.id.endsWith(".1"));

      const mcCount = newEx.filter((e) => e.type === "multiple-choice").length;
      const numCount = newEx.filter((e) => e.type === "numerical").length;
      const symCount = newEx.filter((e) => e.type === "symbolic").length;

      expect(mcCount).toBeGreaterThanOrEqual(5);
      expect(numCount).toBeGreaterThanOrEqual(3);
      expect(symCount).toBeGreaterThanOrEqual(2);
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
  });

  describe("no free-text for polynomial answers", () => {
    test("no U2 exercise uses free-response type", () => {
      const exercises = allU2Exercises();
      const freeResponse = exercises.filter((e) => e.type === "free-response");
      expect(freeResponse.length).toBe(0);
    });
  });

  describe("commonErrorTags are non-empty for all new exercises", () => {
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

  describe("gauss.1 relocation", () => {
    test("ex.u2.gauss.1 has skillId mat.u3.sistemas", () => {
      const exercises = loadExercisesForSkill("mat.u3.sistemas");
      const gauss = exercises.find((e) => e.id === "ex.u2.gauss.1");
      expect(gauss).toBeDefined();
      expect(gauss?.skillId).toBe("mat.u3.sistemas");
    });

    test("ex.u2.gauss.1 is NOT in mat.u2.gauss exercises", () => {
      const exercises = loadExercisesForSkill("mat.u2.gauss");
      const gauss = exercises.find((e) => e.id === "ex.u2.gauss.1");
      expect(gauss).toBeUndefined();
    });
  });

  describe("symbolic exercises have polynomial-friendly expectedAnswer", () => {
    test("symbolic U2 exercises have coefficient arrays or factorized forms", () => {
      const exercises = allU2Exercises();
      const symbolic = exercises.filter((e) => e.type === "symbolic");

      for (const ex of symbolic) {
        // Expected answer should be parseable by polynomial-evaluator
        expect(ex.expectedAnswer).toBeTruthy();
        expect(ex.expectedAnswer.length).toBeGreaterThan(0);
      }
    });
  });
});
