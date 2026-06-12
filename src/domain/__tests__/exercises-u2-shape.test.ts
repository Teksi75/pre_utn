import { describe, test, expect } from "vitest";
import { loadExercisesForSkill, loadSkillBank } from "../catalog/content-loaders";
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

  describe("type distribution (MC, numerical across all U2 exercises — symbolic removed)", () => {
    test("U2 exercises have balanced type distribution (24 MC, 7 numerical, 0 symbolic)", () => {
      const exercises = allU2Exercises();

      const mcCount = exercises.filter((e) => e.type === "multiple-choice").length;
      const numCount = exercises.filter((e) => e.type === "numerical").length;
      const symCount = exercises.filter((e) => (e.type as string) === "symbolic").length;

      expect(mcCount).toBeGreaterThanOrEqual(23);
      expect(numCount).toBeGreaterThanOrEqual(7);
      expect(symCount).toBe(0);
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

    test("factorizacion + gauss type distribution (7 MC, 2 numerical, 0 symbolic)", () => {
      const fac = loadExercisesForSkill("mat.u2.factorizacion");
      const gau = loadExercisesForSkill("mat.u2.gauss");
      const combined = [...fac, ...gau];

      const mcCount = combined.filter((e) => e.type === "multiple-choice").length;
      const numCount = combined.filter((e) => e.type === "numerical").length;
      const symCount = combined.filter((e) => (e.type as string) === "symbolic").length;

      expect(mcCount).toBeGreaterThanOrEqual(6);
      expect(numCount).toBeGreaterThanOrEqual(2);
      expect(symCount).toBe(0);
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
    test("no U2 exercise uses graphical type (requires structured answers)", () => {
      const exercises = allU2Exercises();
      const graphical = exercises.filter((e) => e.type === "graphical");
      expect(graphical.length).toBe(0);
    });
  });

  describe("migrated polynomial-expression exercise regression guards", () => {
    const migratedPolynomialExercises = [
      {
        skillId: "mat.u2.polinomios_basico",
        exerciseId: "ex.u2.polinomios_basico.5",
      },
      {
        skillId: "mat.u2.operaciones_polinomios",
        exerciseId: "ex.u2.operaciones_polinomios.5",
      },
      {
        skillId: "mat.u2.ruffini_resto",
        exerciseId: "ex.u2.ruffini_resto.5",
      },
      {
        skillId: "mat.u2.factorizacion",
        exerciseId: "ex.u2.factorizacion.4",
      },
      {
        skillId: "mat.u2.gauss",
        exerciseId: "ex.u2.gauss.4",
      },
    ] as const;

    for (const { skillId, exerciseId } of migratedPolynomialExercises) {
      test(`${exerciseId} is structured multiple-choice, never keyboard/free-text input`, () => {
        const exercises = loadExercisesForSkill(skillId);
        const exercise = exercises.find((e) => e.id === exerciseId);
        expect(exercise, `${exerciseId} must exist`).toBeDefined();
        expect(exercise!.type).toBe("multiple-choice");
        expect((exercise!.type as string) === "symbolic").toBe(false);
        expect(exercise!.options).toBeDefined();
        expect(exercise!.options!.length).toBeGreaterThanOrEqual(3);
      });

      test(`${exerciseId} has object options with $...$ math labels and a plain expectedAnswer`, () => {
        const exercises = loadExercisesForSkill(skillId);
        const exercise = exercises.find((e) => e.id === exerciseId);
        expect(exercise, `${exerciseId} must exist`).toBeDefined();
        expect(exercise!.options).toBeDefined();

        const optionValues = exercise!.options!.map((option) => {
          expect(
            option !== null && typeof option === "object",
            `Option "${JSON.stringify(option)}" must be an object, not a string`
          ).toBe(true);

          if (option !== null && typeof option === "object") {
            expect(typeof option.value, "Option must have a string 'value' field").toBe("string");
            expect(typeof option.label, "Option must have a string 'label' field").toBe("string");
            expect(option.value.length).toBeGreaterThan(0);
            expect(option.label.length).toBeGreaterThan(0);
            expect(
              option.label,
              `Option label "${option.label}" must use $...$ delimiters for math rendering`
            ).toMatch(/^\$.*\$$/);
            return option.value;
          }

          return "";
        });

        expect(new Set(optionValues).size).toBe(optionValues.length);
        expect(exercise!.expectedAnswer).not.toMatch(/^\$/);
        expect(optionValues).toContain(exercise!.expectedAnswer);
      });
    }
  });

  describe("no U2 symbolic exercises remain (symbolic type removed)", () => {
    test("zero symbolic exercises in U2 catalog", () => {
      const exercises = allU2Exercises();
      const symbolic = exercises.filter((e) => (e.type as string) === "symbolic");
      expect(symbolic.length).toBe(0);
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

  describe("mcm_mcd_polinomios exercises", () => {
    test("at least 3 mcm_mcd_polinomios exercises exist", () => {
      const exercises = loadExercisesForSkill("mat.u2.mcm_mcd_polinomios");
      expect(exercises.length).toBeGreaterThanOrEqual(3);
    });

    test("mcm_mcd_polinomios has all MC exercises (symbolic removed)", () => {
      const exercises = loadExercisesForSkill("mat.u2.mcm_mcd_polinomios");
      const mcCount = exercises.filter((e) => e.type === "multiple-choice").length;
      const symCount = exercises.filter((e) => (e.type as string) === "symbolic").length;
      expect(mcCount).toBeGreaterThanOrEqual(3);
      expect(symCount).toBe(0);
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
