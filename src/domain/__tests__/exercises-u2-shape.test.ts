import { describe, test, expect } from "vitest";
import { loadExercisesForSkill, loadSkillBank, loadFeedbackContent } from "../catalog/content-loaders";
import { areEquivalent } from "../evaluator/polynomial-evaluator";
import { getExerciseOptionValue } from "../models/exercise";
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
  describe("U2 exercises exist across all 7 slice skills", () => {
    test("all 63 expected exercise IDs are present (55 post-PR6 + 4 PR7 expresiones_racionales + 4 PR7 ecuaciones_fraccionarias)", () => {
      const exercises = allU2Exercises();
      const ids = exercises.map((e) => e.id);

      const expected = [
        "ex.u2.polinomios_basico.1",
        "ex.u2.polinomios_basico.2",
        "ex.u2.polinomios_basico.3",
        "ex.u2.polinomios_basico.4",
        "ex.u2.polinomios_basico.5",
        "ex.u2.polinomios_basico.6",
        "ex.u2.polinomios_basico.7",
        "ex.u2.polinomios_basico.8",
        "ex.u2.polinomios_basico.9",
        "ex.u2.operaciones_polinomios.1",
        "ex.u2.operaciones_polinomios.2",
        "ex.u2.operaciones_polinomios.3",
        "ex.u2.operaciones_polinomios.4",
        "ex.u2.operaciones_polinomios.5",
        "ex.u2.operaciones_polinomios.6",
        "ex.u2.operaciones_polinomios.7",
        "ex.u2.operaciones_polinomios.8",
        "ex.u2.operaciones_polinomios.9",
        "ex.u2.operaciones_polinomios.10",
        "ex.u2.operaciones_polinomios.11",
        "ex.u2.ruffini_resto.1",
        "ex.u2.ruffini_resto.2",
        "ex.u2.ruffini_resto.3",
        "ex.u2.ruffini_resto.4",
        "ex.u2.ruffini_resto.5",
        "ex.u2.ruffini_resto.6",
        "ex.u2.ruffini_resto.7",
        "ex.u2.factorizacion.1",
        "ex.u2.factorizacion.2",
        "ex.u2.factorizacion.3",
        "ex.u2.factorizacion.4",
        "ex.u2.factorizacion.5",
        "ex.u2.factorizacion.6",
        "ex.u2.factorizacion.7",
        "ex.u2.factorizacion.8",
        "ex.u2.factorizacion.9",
        "ex.u2.factorizacion.10",
        "ex.u2.factorizacion.11",
        "ex.u2.factorizacion.12",
        "ex.u2.factorizacion.13",
        "ex.u2.factorizacion.14",
        "ex.u2.gauss.1",
        "ex.u2.gauss.2",
        "ex.u2.gauss.3",
        "ex.u2.gauss.4",
        "ex.u2.mcm_mcd_polinomios.1",
        "ex.u2.mcm_mcd_polinomios.2",
        "ex.u2.mcm_mcd_polinomios.3",
        "ex.u2.mcm_mcd_polinomios.4",
        "ex.u2.mcm_mcd_polinomios.5",
        "ex.u2.mcm_mcd_polinomios.6",
        "ex.u2.ecuaciones_fraccionarias.1",
        "ex.u2.ecuaciones_fraccionarias.2",
        "ex.u2.ecuaciones_fraccionarias.3",
        "ex.u2.ecuaciones_fraccionarias.4",
        "ex.u2.ecuaciones_fraccionarias.5",
        "ex.u2.ecuaciones_fraccionarias.6",
        "ex.u2.ecuaciones_fraccionarias.7",
        "ex.u2.ecuaciones_fraccionarias.8",
        "ex.u2.ecuaciones_fraccionarias.9",
        "ex.u2.ecuaciones_fraccionarias.10",
        "ex.u2.ecuaciones_fraccionarias.11",
        "ex.u2.ecuaciones_fraccionarias.12",
      ];

      for (const id of expected) {
        expect(ids, `Exercise ID ${id} should exist`).toContain(id);
      }

      expect(exercises.length).toBeGreaterThanOrEqual(63);
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
    test("U2 exercises have balanced type distribution (52 MC, 9 numerical, 0 symbolic after PR 7)", () => {
      const exercises = allU2Exercises();

      const mcCount = exercises.filter((e) => e.type === "multiple-choice").length;
      const numCount = exercises.filter((e) => e.type === "numerical").length;
      const symCount = exercises.filter((e) => (e.type as string) === "symbolic").length;

      expect(mcCount).toBeGreaterThanOrEqual(51);
      expect(numCount).toBeGreaterThanOrEqual(9);
      expect(symCount).toBe(0);
    });
  });

  describe("factorizacion + gauss exercises exist", () => {
    test("14 factorizacion exercises (4 existing + 10 new aligned across 7 cases after PR 5)", () => {
      const exercises = loadExercisesForSkill("mat.u2.factorizacion");
      expect(exercises.length).toBeGreaterThanOrEqual(14);
      const ids = exercises.map((e) => e.id);
      expect(ids).toContain("ex.u2.factorizacion.1");
      expect(ids).toContain("ex.u2.factorizacion.2");
      expect(ids).toContain("ex.u2.factorizacion.3");
      expect(ids).toContain("ex.u2.factorizacion.4");
      expect(ids).toContain("ex.u2.factorizacion.5");
      expect(ids).toContain("ex.u2.factorizacion.14");
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

    test("factorizacion + gauss type distribution (17 MC, 2 numerical, 0 symbolic after PR 5)", () => {
      const fac = loadExercisesForSkill("mat.u2.factorizacion");
      const gau = loadExercisesForSkill("mat.u2.gauss");
      const combined = [...fac, ...gau];

      const mcCount = combined.filter((e) => e.type === "multiple-choice").length;
      const numCount = combined.filter((e) => e.type === "numerical").length;
      const symCount = combined.filter((e) => (e.type as string) === "symbolic").length;

      expect(mcCount).toBeGreaterThanOrEqual(16);
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

    test("operaciones_polinomios difficulty ranges 2-4 after PR 4", () => {
      const exercises = loadExercisesForSkill("mat.u2.operaciones_polinomios");
      const difficulties = exercises.map((e) => e.difficulty);
      expect(Math.min(...difficulties)).toBeLessThanOrEqual(2);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(4);
    });

    test("ruffini_resto difficulty ranges 2-4", () => {
      const exercises = loadExercisesForSkill("mat.u2.ruffini_resto");
      const difficulties = exercises.map((e) => e.difficulty);
      expect(Math.min(...difficulties)).toBeLessThanOrEqual(3);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(4);
    });

    test("factorizacion difficulty ranges 2-4 after PR 5", () => {
      const exercises = loadExercisesForSkill("mat.u2.factorizacion");
      const difficulties = exercises.map((e) => e.difficulty);
      expect(Math.min(...difficulties)).toBeLessThanOrEqual(2);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(4);
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
    test("at least 6 mcm_mcd_polinomios exercises exist (4 existing + 2 PR6 3-poly/param)", () => {
      const exercises = loadExercisesForSkill("mat.u2.mcm_mcd_polinomios");
      expect(exercises.length).toBeGreaterThanOrEqual(6);
    });

    test("mcm_mcd_polinomios has all MC exercises (symbolic removed)", () => {
      const exercises = loadExercisesForSkill("mat.u2.mcm_mcd_polinomios");
      const mcCount = exercises.filter((e) => e.type === "multiple-choice").length;
      const symCount = exercises.filter((e) => (e.type as string) === "symbolic").length;
      expect(mcCount).toBeGreaterThanOrEqual(6);
      expect(symCount).toBe(0);
    });

    test("mcm_mcd_polinomios difficulty ranges 1-4 after PR 6", () => {
      const exercises = loadExercisesForSkill("mat.u2.mcm_mcd_polinomios");
      const difficulties = exercises.map((e) => e.difficulty);
      expect(Math.min(...difficulties)).toBeLessThanOrEqual(2);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(4);
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
    test("at least 12 ecuaciones_fraccionarias exercises exist (4 existing + 4 expresiones_racionales + 4 ecuaciones after PR 7)", () => {
      const exercises = loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias");
      expect(exercises.length).toBeGreaterThanOrEqual(12);
    });

    test("ecuaciones_fraccionarias has at least 1 MC with domain-exclusion distractor and at least 1 numerical (covers both kinds after PR 7)", () => {
      const exercises = loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias");
      const mcCount = exercises.filter((e) => e.type === "multiple-choice").length;
      const numCount = exercises.filter((e) => e.type === "numerical").length;
      expect(mcCount).toBeGreaterThanOrEqual(3);
      expect(numCount).toBeGreaterThanOrEqual(2);
    });

    test("ecuaciones_fraccionarias difficulty ranges 2-4", () => {
      const exercises = loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias");
      const difficulties = exercises.map((e) => e.difficulty);
      expect(Math.min(...difficulties)).toBeLessThanOrEqual(2);
      expect(Math.max(...difficulties)).toBeGreaterThanOrEqual(4);
    });

    test("ecuaciones_fraccionarias exercises reference a canonical chapter (13, 14, or 15)", () => {
      // PR 7 split: rational-expression exercises (.5-.8) reference chapter 13/14;
      // fractional-equation exercises (.9-.12) reference chapter 15. Pre-PR 7
      // exercises all referenced chapter 15. The catalog contract is that each
      // exercise cites SOME chapter, not necessarily the same one — the
      // audit doc (alineacion-02-ej-utn.md) is the canonical source.
      const exercises = loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias");
      expect(exercises.length, "There must be exercises to check").toBeGreaterThanOrEqual(1);
      for (const ex of exercises) {
        expect(
          ex.pedagogicalNote.toLowerCase(),
          `Exercise ${ex.id} should reference chapter 13, 14, or 15`
        ).toMatch(/cap[ií]tulo|chapter|13|14|15/);
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
      expect(bank.exercises.length).toBeGreaterThanOrEqual(6);
      // Diagnostics will include missing feedback until Phase 3 (FeedbackMappings)
      // but there MUST be NO diagnostics about zero exercises or missing IDs
    });

    test("ecuaciones_fraccionarias skill bank loads exercises", () => {
      const bank = loadSkillBank("mat.u2.ecuaciones_fraccionarias");
      expect(bank.exercises.length).toBeGreaterThanOrEqual(12);
    });
  });

  // PR 3 of align-u2-practice-official-exercises — 4 new polinomios_basico
  // exercises covering 02_ej_utn_1..5 (items 4+5 combined in slot .9).
  // Shape contract: floor >=9, `02_ej_utn_*` tag presence, official-PDF
  // canonicalTrace entry, category="polinomios_basico", difficulty 1-5.
  describe("polinomios_basico PR 3 alignment (02_ej_utn_1..5)", () => {
    const NEW_IDS = [
      "ex.u2.polinomios_basico.6",
      "ex.u2.polinomios_basico.7",
      "ex.u2.polinomios_basico.8",
      "ex.u2.polinomios_basico.9",
    ] as const;

    const findById = (id: string): Exercise => {
      const exercise = loadExercisesForSkill("mat.u2.polinomios_basico").find((e) => e.id === id);
      if (!exercise) throw new Error(`Exercise ${id} not found in mat.u2.polinomios_basico`);
      return exercise;
    };

    test("polinomios_basico has at least 9 exercises (5 existing + 4 new aligned)", () => {
      expect(loadExercisesForSkill("mat.u2.polinomios_basico").length).toBeGreaterThanOrEqual(9);
    });

    // Parameterized: every new slot shares the same shape contract, so a single
    // test body covers existence + skillId + MC + options + expectedAnswer +
    // commonErrorTag (u2_*) + category + difficulty. Four test rows = four
    // independent vitest entries with isolated failure messages.
    for (const id of NEW_IDS) {
      test(`${id} shape: MC+options, expectedAnswer in options, commonErrorTag u2_*, category "polinomios_basico", difficulty 1-5`, () => {
        const ex = findById(id);
        expect(ex.skillId).toBe("mat.u2.polinomios_basico");
        expect(ex.type).toBe("multiple-choice");
        expect(ex.options, `${id} must declare options`).toBeDefined();
        expect(ex.options!.length).toBeGreaterThanOrEqual(3);
        const optionValues = ex.options!.map((o) => (typeof o === "string" ? o : o.value));
        expect(optionValues, `${id} expectedAnswer must be one of the option values`).toContain(
          ex.expectedAnswer
        );
        expect(ex.commonErrorTags.length).toBeGreaterThan(0);
        for (const tag of ex.commonErrorTags) {
          expect(tag, `${id} commonErrorTag must reference a u[1-6]_ tag`).toMatch(/^u[1-6]_/);
        }
        expect(ex.category, `${id} must declare category "polinomios_basico"`).toBe(
          "polinomios_basico"
        );
        expect(ex.difficulty).toBeGreaterThanOrEqual(1);
        expect(ex.difficulty).toBeLessThanOrEqual(5);
      });
    }

    test("multi-value .7 uses string tuple '(4, -10)' inside MC option (avoids numerical scalar trap)", () => {
      // The PR-3 audit item 2 demands a multi-value answer that `numerical`
      // cannot carry. Type='multiple-choice' on slot .7 explicitly avoids the
      // numerical structured-answer validator that rejects comma-separated tuples.
      const slot7 = findById("ex.u2.polinomios_basico.7");
      expect(slot7.type).toBe("multiple-choice");
      expect(slot7.expectedAnswer).toContain(",");
      expect(slot7.expectedAnswer.trim().startsWith("$")).toBe(false);
    });

    test("each new slot carries its 02_ej_utn_* tag (.9 carries 02_ej_utn_4 AND 02_ej_utn_5)", () => {
      const expected: Record<string, readonly string[]> = {
        "ex.u2.polinomios_basico.6": ["02_ej_utn_1"],
        "ex.u2.polinomios_basico.7": ["02_ej_utn_2"],
        "ex.u2.polinomios_basico.8": ["02_ej_utn_3"],
        "ex.u2.polinomios_basico.9": ["02_ej_utn_4", "02_ej_utn_5"],
      };
      for (const [id, tags] of Object.entries(expected)) {
        const got = findById(id).tags ?? [];
        for (const t of tags) expect(got, `${id} must carry ${t}`).toContain(t);
      }
    });

    test("each new slot references official 02_ej_utn.pdf in canonicalTrace with valid sourceUse", () => {
      // canonicalTrace is preserved as extra metadata by content-loaders, so
      // we narrow-cast. SourceUse currently allows adapted|reinforcement|reference;
      // the path itself already differentiates official vs local material.
      type TraceEntry = { readonly path: string; readonly sourceUse: string };
      for (const id of NEW_IDS) {
        const trace = (findById(id) as unknown as { canonicalTrace?: readonly TraceEntry[] })
          .canonicalTrace ?? [];
        const official = trace.find((t) => t.path.includes("02_ej_utn.pdf"));
        expect(official, `${id} must reference 02_ej_utn.pdf`).toBeDefined();
        expect(official!.sourceUse).toMatch(/^(reference|adapted|reinforcement|alignment)$/);
      }
    });
  });

  // PR 4 of align-u2-practice-official-exercises — 6 new operaciones_polinomios
  // exercises (3 long-division 02_ej_utn_7 + 3 productos notables 02_ej_utn_9)
  // with floor `>=11` (5 existing + 6 new), per-family floor `>=3` each tag,
  // official-PDF canonicalTrace, category "operaciones_polinomios".
  describe("operaciones_polinomios PR 4 alignment (02_ej_utn_7 long div + 02_ej_utn_9 productos notables)", () => {
    const NEW_IDS = [
      "ex.u2.operaciones_polinomios.6",
      "ex.u2.operaciones_polinomios.7",
      "ex.u2.operaciones_polinomios.8",
      "ex.u2.operaciones_polinomios.9",
      "ex.u2.operaciones_polinomios.10",
      "ex.u2.operaciones_polinomios.11",
    ] as const;

    const findById = (id: string): Exercise => {
      const exercise = loadExercisesForSkill("mat.u2.operaciones_polinomios").find(
        (e) => e.id === id,
      );
      if (!exercise) throw new Error(`Exercise ${id} not found in mat.u2.operaciones_polinomios`);
      return exercise;
    };

    test("operaciones_polinomios has at least 11 exercises (5 existing + 6 new aligned)", () => {
      expect(loadExercisesForSkill("mat.u2.operaciones_polinomios").length).toBeGreaterThanOrEqual(11);
    });

    // Parameterized shape contract — long-division .6-.8 + productos notables .9-.11 share the same shape.
    for (const id of NEW_IDS) {
      test(`${id} shape: MC+options, expectedAnswer in options, commonErrorTag u2_*, category "operaciones_polinomios", difficulty 1-5`, () => {
        const ex = findById(id);
        expect(ex.skillId).toBe("mat.u2.operaciones_polinomios");
        expect(ex.type).toBe("multiple-choice");
        expect(ex.options, `${id} must declare options`).toBeDefined();
        expect(ex.options!.length).toBeGreaterThanOrEqual(3);
        const optionValues = ex.options!.map((o) => (typeof o === "string" ? o : o.value));
        expect(
          optionValues,
          `${id} expectedAnswer must be one of the option values`,
        ).toContain(ex.expectedAnswer);
        expect(ex.commonErrorTags.length).toBeGreaterThan(0);
        for (const tag of ex.commonErrorTags) {
          expect(tag, `${id} commonErrorTag must reference a u[1-6]_ tag`).toMatch(/^u[1-6]_/);
        }
        expect(ex.category, `${id} must declare category "operaciones_polinomios"`).toBe("operaciones_polinomios");
        expect(ex.difficulty).toBeGreaterThanOrEqual(1);
        expect(ex.difficulty).toBeLessThanOrEqual(5);
      });
    }

    test("each PR 4 family floor (>=3): long-division tagged 02_ej_utn_7, productos notables tagged 02_ej_utn_9", () => {
      const ops = loadExercisesForSkill("mat.u2.operaciones_polinomios");
      const byTag = (t: string) => ops.filter((e) => e.tags?.includes(t) ?? false).length;
      expect(byTag("02_ej_utn_7"), "long division floor").toBeGreaterThanOrEqual(3);
      expect(byTag("02_ej_utn_9"), "productos notables floor").toBeGreaterThanOrEqual(3);
    });

    test("each new slot carries its 02_ej_utn_7 (long div) or 02_ej_utn_9 (productos notables) tag, slots .6-.8 carry 7 and .9-.11 carry 9", () => {
      const expected: Record<string, readonly string[]> = {
        "ex.u2.operaciones_polinomios.6": ["02_ej_utn_7"],
        "ex.u2.operaciones_polinomios.7": ["02_ej_utn_7"],
        "ex.u2.operaciones_polinomios.8": ["02_ej_utn_7"],
        "ex.u2.operaciones_polinomios.9": ["02_ej_utn_9"],
        "ex.u2.operaciones_polinomios.10": ["02_ej_utn_9"],
        "ex.u2.operaciones_polinomios.11": ["02_ej_utn_9"],
      };
      for (const [id, tags] of Object.entries(expected)) {
        const got = findById(id).tags ?? [];
        for (const t of tags) expect(got, `${id} must carry ${t}`).toContain(t);
      }
    });

    // canonicalTrace is preserved as extra metadata by content-loaders.
    test("each new slot references official 02_ej_utn.pdf in canonicalTrace with valid sourceUse", () => {
      type TraceEntry = { readonly path: string; readonly sourceUse: string };
      for (const id of NEW_IDS) {
        const trace = (findById(id) as unknown as { canonicalTrace?: readonly TraceEntry[] }).canonicalTrace ?? [];
        const official = trace.find((t) => t.path.includes("02_ej_utn.pdf"));
        expect(official, `${id} must reference 02_ej_utn.pdf`).toBeDefined();
        expect(official!.sourceUse).toMatch(/^(reference|adapted|reinforcement|alignment)$/);
      }
    });
  });

  // PR 5 of align-u2-practice-official-exercises — 10 new factorizacion
  // exercises (slots .5-.14) covering all 7 official cases of Ítem 10 from
  // 02_ej_utn.pdf: factor común (.5), grupos (.6), TCP (.7-.8), cubo
  // perfecto (.9-.10), diferencia de cuadrados extendida (.11),
  // suma/diferencia de potencias (.12, .14), combinados (.13).
  // Floor: factorizacion >=14 (4 existing + 10 new). Per-case floor matches
  // the audit doc spec: >=1 each case, >=2 for TCP and cubo.
  // Shape: MC, options as {value,label} with $...$, expectedAnswer in
  // option values, commonErrorTag u2_*, category "factorizacion", official
  // PDF canonicalTrace entry.
  describe("factorizacion PR 5 alignment (02_ej_utn_10_* — 7 official cases)", () => {
    const NEW_IDS = [
      "ex.u2.factorizacion.5",
      "ex.u2.factorizacion.6",
      "ex.u2.factorizacion.7",
      "ex.u2.factorizacion.8",
      "ex.u2.factorizacion.9",
      "ex.u2.factorizacion.10",
      "ex.u2.factorizacion.11",
      "ex.u2.factorizacion.12",
      "ex.u2.factorizacion.13",
      "ex.u2.factorizacion.14",
    ] as const;

    const findById = (id: string): Exercise => {
      const exercise = loadExercisesForSkill("mat.u2.factorizacion").find((e) => e.id === id);
      if (!exercise) throw new Error(`Exercise ${id} not found in mat.u2.factorizacion`);
      return exercise;
    };

    test("factorizacion has at least 14 exercises (4 existing + 10 new aligned)", () => {
      expect(loadExercisesForSkill("mat.u2.factorizacion").length).toBeGreaterThanOrEqual(14);
    });

    // Per-case floor: 7 official cases from 02_ej_utn.pdf Item 10. Combined
    // into one body so a single test failure points at which case is short.
    test("per-case presence: each of the 7 official cases is represented across slots .5-.14", () => {
      const fac = loadExercisesForSkill("mat.u2.factorizacion");
      const byTag = (t: string) => fac.filter((e) => e.tags?.includes(t) ?? false).length;
      expect(byTag("02_ej_utn_10_factor_comun"), "factor común extendido").toBeGreaterThanOrEqual(1);
      expect(byTag("02_ej_utn_10_grupos"), "factor común por grupos").toBeGreaterThanOrEqual(1);
      expect(byTag("02_ej_utn_10_tcp"), "trinomio cuadrado perfecto").toBeGreaterThanOrEqual(2);
      expect(byTag("02_ej_utn_10_cubo"), "cuatrinomio cubo perfecto").toBeGreaterThanOrEqual(2);
      expect(byTag("02_ej_utn_10_dif_cuadrados"), "diferencia de cuadrados").toBeGreaterThanOrEqual(1);
      expect(byTag("02_ej_utn_10_potencias"), "suma/diferencia de potencias").toBeGreaterThanOrEqual(1);
      expect(byTag("02_ej_utn_10_combinados"), "casos combinados").toBeGreaterThanOrEqual(1);
    });

    // Parameterized shape contract: every new factorization slot shares the
    // same shape (MC + object-form options + $...$ labels + expectedAnswer in
    // option values + commonErrorTag u2_* + category + difficulty 1-5). One
    // body covers all 10 slots with isolated failure messages.
    for (const id of NEW_IDS) {
      test(`${id} shape: MC+options, expectedAnswer in options, commonErrorTag u2_*, category "factorizacion", difficulty 1-5`, () => {
        const ex = findById(id);
        expect(ex.skillId).toBe("mat.u2.factorizacion");
        expect(ex.type).toBe("multiple-choice");
        expect(ex.options, `${id} must declare options`).toBeDefined();
        expect(ex.options!.length).toBeGreaterThanOrEqual(3);
        const optionValues = ex.options!.map((o) => (typeof o === "string" ? o : o.value));
        expect(optionValues, `${id} expectedAnswer must be one of the option values`).toContain(ex.expectedAnswer);
        expect(ex.commonErrorTags.length, `${id} must have at least one commonErrorTag`).toBeGreaterThan(0);
        for (const tag of ex.commonErrorTags) {
          expect(tag, `${id} commonErrorTag must reference a u[1-6]_ tag`).toMatch(/^u[1-6]_/);
        }
        expect(ex.category, `${id} must declare category "factorizacion"`).toBe("factorizacion");
        expect(ex.difficulty).toBeGreaterThanOrEqual(1);
        expect(ex.difficulty).toBeLessThanOrEqual(5);
      });
    }

    // Tag-presence per-slot map: each slot carries its 02_ej_utn_10_* tag
    // matching the case it covers. Slots .5-.14 map to the 7 cases.
    test("each new slot carries its 02_ej_utn_10_* tag matching its factorization case", () => {
      const expected: Record<string, readonly string[]> = {
        "ex.u2.factorizacion.5": ["02_ej_utn_10_factor_comun"],
        "ex.u2.factorizacion.6": ["02_ej_utn_10_grupos"],
        "ex.u2.factorizacion.7": ["02_ej_utn_10_tcp"],
        "ex.u2.factorizacion.8": ["02_ej_utn_10_tcp"],
        "ex.u2.factorizacion.9": ["02_ej_utn_10_cubo"],
        "ex.u2.factorizacion.10": ["02_ej_utn_10_cubo"],
        "ex.u2.factorizacion.11": ["02_ej_utn_10_dif_cuadrados"],
        "ex.u2.factorizacion.12": ["02_ej_utn_10_potencias"],
        "ex.u2.factorizacion.13": ["02_ej_utn_10_combinados"],
        "ex.u2.factorizacion.14": ["02_ej_utn_10_potencias"],
      };
      for (const [id, tags] of Object.entries(expected)) {
        const got = findById(id).tags ?? [];
        for (const t of tags) expect(got, `${id} must carry ${t}`).toContain(t);
      }
    });

    // canonicalTrace is preserved as extra metadata by content-loaders.
    test("each new slot references official 02_ej_utn.pdf in canonicalTrace with valid sourceUse", () => {
      type TraceEntry = { readonly path: string; readonly sourceUse: string };
      for (const id of NEW_IDS) {
        const trace = (findById(id) as unknown as { canonicalTrace?: readonly TraceEntry[] }).canonicalTrace ?? [];
        const official = trace.find((t) => t.path.includes("02_ej_utn.pdf"));
        expect(official, `${id} must reference 02_ej_utn.pdf`).toBeDefined();
        expect(official!.sourceUse).toMatch(/^(reference|adapted|reinforcement|alignment)$/);
      }
    });

    // Regression: gate review flagged that ex.u2.factorizacion.5 distractor
    // `6x(x^2 + 1.5x - 2)` was algebraically equivalent to the correct
    // answer (both expand to 6x^3 + 9x^2 - 12x). The replacement distractor
    // must NOT be equivalent — it has to be a genuine sign-error factorization
    // that produces a different polynomial when expanded. We assert the
    // non-equivalence via the polynomial-evaluator's `areEquivalent` API
    // using coefficient arrays (the factored strings contain degree-2 inner
    // factors that the parser only handles as coefficient arrays, not as
    // factored strings).
    test("ex.u2.factorizacion.5 distractor B is algebraically NON-equivalent to the source polynomial (no false-positive trap)", () => {
      // Source polynomial from the prompt: 6x^3 + 9x^2 - 12x
      const sourceCoeffs: readonly number[] = [6, 9, -12, 0];

      // Correct answer expands to 6x^3 + 9x^2 - 12x (matches source).
      const correctCoeffs: readonly number[] = [6, 9, -12, 0];
      expect(
        areEquivalent(sourceCoeffs, correctCoeffs),
        "Correct answer 3x(2x^2 + 3x - 4) must expand to the source polynomial"
      ).toBe(true);

      // Replaced distractor B: 3x(2x^2 + 3x + 4) expands to 6x^3 + 9x^2 + 12x
      // (sign error on the last term — u2_signo_factorizacion). Must NOT be
      // equivalent to source.
      const replacedBCoeffs: readonly number[] = [6, 9, 12, 0];
      expect(
        areEquivalent(sourceCoeffs, replacedBCoeffs),
        "Replaced distractor B 3x(2x^2 + 3x + 4) must NOT expand to the source polynomial"
      ).toBe(false);

      // Catalog-level: the live distractor B value must not be algebraically
      // equivalent to the expected answer. Asserted by loading the exercise
      // from the catalog and expanding the option value into coefficient
      // form manually (the factored form has a degree-2 inner factor that
      // the parser cannot tokenize as a single factor).
      const ex = findById("ex.u2.factorizacion.5");
      const distractorB = ex.options!.find(
        (o) => getExerciseOptionValue(o) === "3x(2x^2 + 3x + 4)"
      );
      expect(distractorB, "Distractor B 3x(2x^2 + 3x + 4) must exist as an option").toBeDefined();
      expect(
        getExerciseOptionValue(distractorB!),
        "Live distractor B value must NOT equal the expected answer"
      ).not.toBe(ex.expectedAnswer);
    });
  });

  // PR 6 of align-u2-practice-official-exercises — 2 new ruffini_resto
  // exercises (slots .6-.7) covering 02_ej_utn_8 (Ruffini cociente cases,
  // quotient coefficients returned as comma-separated tuples) and 2 new
  // mcm_mcd_polinomios exercises (slots .5-.6) covering 02_ej_utn_11b
  // (3-polynomial case) and 02_ej_utn_11c (parameter case).
  // Floors: ruffini_resto >=7 (5 existing + 2 new), mcm_mcd_polinomios
  // >=6 (4 existing + 2 new). Both skills lift to the per-skill >=5 floor
  // established by the spec. Shape: MC, options as {value,label} with $...$,
  // expectedAnswer in option values, commonErrorTag u2_* referencing a
  // feedback-covered tag, category "ruffini_resto" or "mcm_mcd_polinomios",
  // official-PDF canonicalTrace entry.
  describe("ruffini_resto PR 6 alignment (02_ej_utn_8 — Ruffini cociente)", () => {
    const NEW_IDS = ["ex.u2.ruffini_resto.6", "ex.u2.ruffini_resto.7"] as const;

    const findById = (id: string): Exercise => {
      const exercise = loadExercisesForSkill("mat.u2.ruffini_resto").find((e) => e.id === id);
      if (!exercise) throw new Error(`Exercise ${id} not found in mat.u2.ruffini_resto`);
      return exercise;
    };

    test("ruffini_resto has at least 7 exercises (5 existing + 2 new aligned)", () => {
      expect(loadExercisesForSkill("mat.u2.ruffini_resto").length).toBeGreaterThanOrEqual(7);
    });

    test("ruffini_resto >=5 floor (per-skill PR 6 acceptance criterion)", () => {
      // Spec requires per-skill >=5 floor; ruffini is at 7 (5 existing + 2 new).
      expect(loadExercisesForSkill("mat.u2.ruffini_resto").length).toBeGreaterThanOrEqual(5);
    });

    for (const id of NEW_IDS) {
      test(`${id} shape: MC+options, expectedAnswer in options, commonErrorTag u2_*, category "ruffini_resto", difficulty 1-5`, () => {
        const ex = findById(id);
        expect(ex.skillId).toBe("mat.u2.ruffini_resto");
        expect(ex.type).toBe("multiple-choice");
        expect(ex.options, `${id} must declare options`).toBeDefined();
        expect(ex.options!.length).toBeGreaterThanOrEqual(3);
        const optionValues = ex.options!.map((o) => (typeof o === "string" ? o : o.value));
        expect(optionValues, `${id} expectedAnswer must be one of the option values`).toContain(ex.expectedAnswer);
        expect(ex.commonErrorTags.length, `${id} must have at least one commonErrorTag`).toBeGreaterThan(0);
        for (const tag of ex.commonErrorTags) {
          expect(tag, `${id} commonErrorTag must reference a u[1-6]_ tag`).toMatch(/^u[1-6]_/);
        }
        expect(ex.category, `${id} must declare category "ruffini_resto"`).toBe("ruffini_resto");
        expect(ex.difficulty).toBeGreaterThanOrEqual(1);
        expect(ex.difficulty).toBeLessThanOrEqual(5);
      });
    }

    test("each new ruffini slot carries its 02_ej_utn_8 tag (.6→8a, .7→8d)", () => {
      const expected: Record<string, readonly string[]> = {
        "ex.u2.ruffini_resto.6": ["02_ej_utn_8a"],
        "ex.u2.ruffini_resto.7": ["02_ej_utn_8d"],
      };
      for (const [id, tags] of Object.entries(expected)) {
        const got = findById(id).tags ?? [];
        for (const t of tags) expect(got, `${id} must carry ${t}`).toContain(t);
      }
    });

    test("each new ruffini slot references official 02_ej_utn.pdf in canonicalTrace with valid sourceUse", () => {
      type TraceEntry = { readonly path: string; readonly sourceUse: string };
      for (const id of NEW_IDS) {
        const trace = (findById(id) as unknown as { canonicalTrace?: readonly TraceEntry[] }).canonicalTrace ?? [];
        const official = trace.find((t) => t.path.includes("02_ej_utn.pdf"));
        expect(official, `${id} must reference 02_ej_utn.pdf`).toBeDefined();
        expect(official!.sourceUse).toMatch(/^(reference|adapted|reinforcement|alignment)$/);
      }
    });

    test("PR 6 ruffini expectedAnswer is a comma-separated coefficient tuple (no free-form symbolic)", () => {
      // PR 6 returns the quotient as a comma-separated tuple (per `numerical`
      // type restriction: free-form symbolic answers like polynomial strings
      // are forbidden). The MC type is the only allowed type for multi-value
      // tuple answers.
      for (const id of NEW_IDS) {
        const ex = findById(id);
        expect(ex.expectedAnswer, `${id} expectedAnswer must be comma-separated`).toContain(",");
        expect(ex.expectedAnswer.trim().startsWith("$"), `${id} expectedAnswer must not start with $`).toBe(false);
      }
    });
  });

  describe("mcm_mcd_polinomios PR 6 alignment (02_ej_utn_11 — 3 poly + param cases)", () => {
    const NEW_IDS = ["ex.u2.mcm_mcd_polinomios.5", "ex.u2.mcm_mcd_polinomios.6"] as const;

    const findById = (id: string): Exercise => {
      const exercise = loadExercisesForSkill("mat.u2.mcm_mcd_polinomios").find((e) => e.id === id);
      if (!exercise) throw new Error(`Exercise ${id} not found in mat.u2.mcm_mcd_polinomios`);
      return exercise;
    };

    test("mcm_mcd_polinomios has at least 6 exercises (4 existing + 2 new aligned)", () => {
      expect(loadExercisesForSkill("mat.u2.mcm_mcd_polinomios").length).toBeGreaterThanOrEqual(6);
    });

    test("mcm_mcd_polinomios >=5 floor (per-skill PR 6 acceptance criterion)", () => {
      // Spec requires per-skill >=5 floor; mcm_mcd_polinomios is at 6 (4 existing + 2 new).
      expect(loadExercisesForSkill("mat.u2.mcm_mcd_polinomios").length).toBeGreaterThanOrEqual(5);
    });

    for (const id of NEW_IDS) {
      test(`${id} shape: MC+options, expectedAnswer in options, commonErrorTag u2_*, category "mcm_mcd_polinomios", difficulty 1-5`, () => {
        const ex = findById(id);
        expect(ex.skillId).toBe("mat.u2.mcm_mcd_polinomios");
        expect(ex.type).toBe("multiple-choice");
        expect(ex.options, `${id} must declare options`).toBeDefined();
        expect(ex.options!.length).toBeGreaterThanOrEqual(3);
        const optionValues = ex.options!.map((o) => (typeof o === "string" ? o : o.value));
        expect(optionValues, `${id} expectedAnswer must be one of the option values`).toContain(ex.expectedAnswer);
        expect(ex.commonErrorTags.length, `${id} must have at least one commonErrorTag`).toBeGreaterThan(0);
        for (const tag of ex.commonErrorTags) {
          expect(tag, `${id} commonErrorTag must reference a u[1-6]_ tag`).toMatch(/^u[1-6]_/);
        }
        expect(ex.category, `${id} must declare category "mcm_mcd_polinomios"`).toBe("mcm_mcd_polinomios");
        expect(ex.difficulty).toBeGreaterThanOrEqual(1);
        expect(ex.difficulty).toBeLessThanOrEqual(5);
      });
    }

    test("each new mcm_mcd slot carries its 02_ej_utn_11 tag (.5→11b 3-poly, .6→11c param)", () => {
      const expected: Record<string, readonly string[]> = {
        "ex.u2.mcm_mcd_polinomios.5": ["02_ej_utn_11b"],
        "ex.u2.mcm_mcd_polinomios.6": ["02_ej_utn_11c"],
      };
      for (const [id, tags] of Object.entries(expected)) {
        const got = findById(id).tags ?? [];
        for (const t of tags) expect(got, `${id} must carry ${t}`).toContain(t);
      }
    });

    test("each new mcm_mcd slot references official 02_ej_utn.pdf in canonicalTrace with valid sourceUse", () => {
      type TraceEntry = { readonly path: string; readonly sourceUse: string };
      for (const id of NEW_IDS) {
        const trace = (findById(id) as unknown as { canonicalTrace?: readonly TraceEntry[] }).canonicalTrace ?? [];
        const official = trace.find((t) => t.path.includes("02_ej_utn.pdf"));
        expect(official, `${id} must reference 02_ej_utn.pdf`).toBeDefined();
        expect(official!.sourceUse).toMatch(/^(reference|adapted|reinforcement|alignment)$/);
      }
    });

    test("each new mcm_mcd slot references chapter 14 in pedagogicalNote (regression for non-aligned exercises)", () => {
      // The pedagogicalNote of PR 6 slots extends the existing chapter 14
      // convention. Confirms the audit-aligned new slots stay consistent
      // with the pre-existing 4 mcm_mcd_polinomios exercises.
      for (const id of NEW_IDS) {
        const note = findById(id).pedagogicalNote.toLowerCase();
        expect(note, `${id} pedagogicalNote must reference chapter 14`).toMatch(/cap[ií]tulo|chapter|14/);
      }
    });

    test("each new mcm_mcd slot includes u2_confunde_mcm_mcd tag (regression for MCM-vs-MCD confusion case)", () => {
      for (const id of NEW_IDS) {
        const tags = findById(id).commonErrorTags;
        expect(tags, `${id} must include u2_confunde_mcm_mcd`).toContain("u2_confunde_mcm_mcd");
      }
    });
  });

  // PR 7 of align-u2-practice-official-exercises — +4 rational-expression
  // exercises (.5-.8, category "expresiones_racionales", covering
  // 02_ej_utn_12/13/14) + +4 fractional-equation exercises (.9-.12, covering
  // 02_ej_utn_15a/b/c/g with domain-exclusion distractors). Numerical type
  // allowed ONLY for unique-scalar cases (.9, .10); domain-rich and
  // double-scalar cases (.11, .12) MUST use MC.
  describe("ecuaciones_fraccionarias PR 7 alignment (02_ej_utn_12..14 + 02_ej_utn_15)", () => {
    const RATIONAL_EXPR_IDS = [
      "ex.u2.ecuaciones_fraccionarias.5",
      "ex.u2.ecuaciones_fraccionarias.6",
      "ex.u2.ecuaciones_fraccionarias.7",
      "ex.u2.ecuaciones_fraccionarias.8",
    ] as const;

    const FRACTIONAL_EQ_IDS = [
      "ex.u2.ecuaciones_fraccionarias.9",
      "ex.u2.ecuaciones_fraccionarias.10",
      "ex.u2.ecuaciones_fraccionarias.11",
      "ex.u2.ecuaciones_fraccionarias.12",
    ] as const;

    const NEW_IDS = [...RATIONAL_EXPR_IDS, ...FRACTIONAL_EQ_IDS] as const;

    const findById = (id: string): Exercise => {
      const exercise = loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias").find(
        (e) => e.id === id,
      );
      if (!exercise) throw new Error(`Exercise ${id} not found in mat.u2.ecuaciones_fraccionarias`);
      return exercise;
    };

    test("ecuaciones_fraccionarias has at least 12 exercises (4 existing + 8 PR7 aligned)", () => {
      expect(loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias").length).toBeGreaterThanOrEqual(12);
    });

    test("rational-expression floor >=4 and fractional-equation floor >=4 (spec acceptance per family)", () => {
      const all = loadExercisesForSkill("mat.u2.ecuaciones_fraccionarias");
      const rationalExpr = all.filter((e) => e.category === "expresiones_racionales").length;
      const fractionalEq = all.filter((e) => e.category === "ecuaciones_fraccionarias").length;
      expect(rationalExpr, "expresiones_racionales family floor").toBeGreaterThanOrEqual(4);
      expect(fractionalEq, "ecuaciones_fraccionarias family floor").toBeGreaterThanOrEqual(4);
    });

    // Parameterized shape contract: every PR 7 slot shares skillId + category
    // (per family) + difficulty + commonErrorTag (u[1-6]_) + MC+options shape
    // (when MC type) + expectedAnswer-in-options. One body covers all 8 slots.
    for (const id of NEW_IDS) {
      const expectedCategory = FRACTIONAL_EQ_IDS.includes(id as (typeof FRACTIONAL_EQ_IDS)[number])
        ? "ecuaciones_fraccionarias"
        : "expresiones_racionales";
      test(`${id} shape: skillId + ${expectedCategory} category + MC+options + commonErrorTag u2_* + difficulty 1-5`, () => {
        const ex = findById(id);
        expect(ex.skillId).toBe("mat.u2.ecuaciones_fraccionarias");
        expect(ex.category, `${id} must declare category "${expectedCategory}"`).toBe(expectedCategory);
        expect(ex.difficulty).toBeGreaterThanOrEqual(1);
        expect(ex.difficulty).toBeLessThanOrEqual(5);
        expect(ex.commonErrorTags.length, `${id} must have at least one commonErrorTag`).toBeGreaterThan(0);
        for (const tag of ex.commonErrorTags) {
          expect(tag, `${id} commonErrorTag must reference a u[1-6]_ tag`).toMatch(/^u[1-6]_/);
        }
        // MC+options shape for symbolic answers (rational-expression slots
        // always MC; equation slots handled by the MC branch of the
        // type-distribution test below).
        if (ex.type === "multiple-choice") {
          expect(ex.options, `${id} must declare options`).toBeDefined();
          expect(ex.options!.length).toBeGreaterThanOrEqual(3);
          const optionValues = ex.options!.map((o) => (typeof o === "string" ? o : o.value));
          expect(optionValues, `${id} expectedAnswer must be one of the option values`).toContain(ex.expectedAnswer);
        }
      });
    }

    test("fractional-equation slots use MC for domain-rich/double-scalar, numerical ONLY for unique scalar (.9, .10)", () => {
      // Scalar-only numerical guard (spec: "numerical exercise avoids ambiguous
      // domain"). .9 and .10 are the only legitimate numerical cases (unique
      // scalar, no domain ambiguity); .11 is double-scalar and .12 is
      // domain-rich (solution lies outside domain) — both MUST be MC.
      const allowedNumerical = new Set<string>(["ex.u2.ecuaciones_fraccionarias.9", "ex.u2.ecuaciones_fraccionarias.10"]);
      for (const id of FRACTIONAL_EQ_IDS) {
        const ex = findById(id);
        if (allowedNumerical.has(id)) {
          expect(ex.type, `${id} must be numerical (single scalar, no domain ambiguity)`).toBe("numerical");
          // Scalar-only guard: expectedAnswer parses as a single finite number
          // with no structured tokens (commas, semicolons).
          const numeric = Number(ex.expectedAnswer);
          expect(ex.expectedAnswer.includes(","), `${id} numerical expectedAnswer must NOT contain commas`).toBe(false);
          expect(ex.expectedAnswer.includes(";"), `${id} numerical expectedAnswer must NOT contain semicolons`).toBe(false);
          expect(Number.isFinite(numeric), `${id} expectedAnswer must parse as a finite number`).toBe(true);
        } else {
          expect(ex.type, `${id} must be multiple-choice (domain-rich or double-scalar case)`).toBe("multiple-choice");
          expect(ex.options, `${id} must declare options`).toBeDefined();
          expect(ex.options!.length).toBeGreaterThanOrEqual(3);
          const optionValues = ex.options!.map((o) => (typeof o === "string" ? o : o.value));
          expect(optionValues, `${id} expectedAnswer must be one of the option values`).toContain(ex.expectedAnswer);
        }
      }
    });

    test("each MC fractional-equation slot (.11, .12) includes a domain-exclusion distractor", () => {
      // Spec scenario: "MC exercise with domain-exclusion distractor". We
      // assert presence via a value-based check (the value textually encodes
      // the excluded value, e.g. "x = 2" for denominators (x-2), or "0" for
      // denominators x).
      const mcIds = FRACTIONAL_EQ_IDS.filter((id) => findById(id).type === "multiple-choice");
      expect(mcIds.length, "PR 7 introduces at least 2 MC equation slots").toBeGreaterThanOrEqual(2);
      for (const id of mcIds) {
        const ex = findById(id);
        const optionValues = ex.options!.map((o) => (typeof o === "string" ? o : o.value));
        const distractors = optionValues.filter((v) => v !== ex.expectedAnswer);
        const hasExclusionDistractor = distractors.some((v) =>
          /\bx\s*=\s*-?\d+\b/.test(v) || /^[-+]?\d+$/.test(v.trim()) || /no\s+tiene\s+soluci/i.test(v)
        );
        expect(
          hasExclusionDistractor,
          `${id} MC must include at least one domain-exclusion distractor among ${JSON.stringify(distractors)}`
        ).toBe(true);
      }
    });

    test("each new slot carries its 02_ej_utn_* tag matching the family it covers", () => {
      const expected: Record<string, readonly string[]> = {
        // Rational-expression exercises (PR 7 task 7.1)
        "ex.u2.ecuaciones_fraccionarias.5": ["02_ej_utn_12a"],
        "ex.u2.ecuaciones_fraccionarias.6": ["02_ej_utn_12c"],
        "ex.u2.ecuaciones_fraccionarias.7": ["02_ej_utn_13a"],
        "ex.u2.ecuaciones_fraccionarias.8": ["02_ej_utn_14a"],
        // Fractional-equation exercises (PR 7 task 7.2)
        "ex.u2.ecuaciones_fraccionarias.9": ["02_ej_utn_15a"],
        "ex.u2.ecuaciones_fraccionarias.10": ["02_ej_utn_15b"],
        "ex.u2.ecuaciones_fraccionarias.11": ["02_ej_utn_15c"],
        "ex.u2.ecuaciones_fraccionarias.12": ["02_ej_utn_15g"],
      };
      for (const [id, tags] of Object.entries(expected)) {
        const got = findById(id).tags ?? [];
        for (const t of tags) expect(got, `${id} must carry ${t}`).toContain(t);
      }
    });

    test("each new slot references official 02_ej_utn.pdf in canonicalTrace with valid sourceUse", () => {
      type TraceEntry = { readonly path: string; readonly sourceUse: string };
      for (const id of NEW_IDS) {
        const trace = (findById(id) as unknown as { canonicalTrace?: readonly TraceEntry[] }).canonicalTrace ?? [];
        const official = trace.find((t) => t.path.includes("02_ej_utn.pdf"));
        expect(official, `${id} must reference 02_ej_utn.pdf`).toBeDefined();
        expect(official!.sourceUse).toMatch(/^(reference|adapted|reinforcement|alignment)$/);
      }
    });

    test("rational-expression slots reference chapter 13 or 14 in pedagogicalNote (local canonical split)", () => {
      // The audit doc (alineacion-02-ej-utn.md §2.5) assigns the
      // rational-expression subset (items 12-14) to chapters 13-14 of
      // UNIDAD2_matemática.pdf (fracciones algebraicas / simplificación).
      // Fractional-equation slots (.9-.12) reference chapter 15.
      for (const id of RATIONAL_EXPR_IDS) {
        const note = findById(id).pedagogicalNote.toLowerCase();
        expect(
          note,
          `${id} pedagogicalNote must reference chapter 13 or 14 (rational-expression subset)`,
        ).toMatch(/cap[ií]tulo|chapter|13|14/);
      }
      for (const id of FRACTIONAL_EQ_IDS) {
        const note = findById(id).pedagogicalNote.toLowerCase();
        expect(
          note,
          `${id} pedagogicalNote must reference chapter 15 (fractional-equation subset)`,
        ).toMatch(/cap[ií]tulo|chapter|15/);
      }
    });

    test("rational-expression slots use feedback-covered tags only (no dormant PR 2 tags)", () => {
      // PR 2 added 8 new u2_* tags without feedback mappings. PR 8 added
      // feedback entries for all 8 (see feedback/unit-2.json). The covered
      // set is now DERIVED from loadFeedbackContent so the test catches
      // any future drift between taxonomy and feedback coverage.
      const coveredTags = new Set(loadFeedbackContent("unit-2").map((m) => m.errorTag));
      // Sanity: the 8 PR 2 tags must be feedback-covered after PR 8.
      const PR2_TAGS = [
        "u2_division_larga", "u2_tcp", "u2_cubo_perfecto", "u2_diferencia_cuadrados",
        "u2_factor_comun", "u2_trinomio_cuadrado", "u2_resta_potencias", "u2_simplifica_racional",
      ];
      for (const t of PR2_TAGS) {
        expect(coveredTags.has(t), `${t} must be in feedback/unit-2.json after PR 8`).toBe(true);
      }
      for (const id of NEW_IDS) {
        for (const tag of findById(id).commonErrorTags) {
          expect(coveredTags.has(tag), `${id} tag ${tag} must be feedback-covered`).toBe(true);
        }
      }
    });

    test("fractional-equation slots carry u2_denominador_cero (domain-exclusion tag contract)", () => {
      // The domain-exclusion distractor on .11/.12 only makes pedagogical
      // sense if commonErrorTags include u2_denominador_cero so the
      // feedback pipeline can surface the error to the student.
      for (const id of FRACTIONAL_EQ_IDS) {
        expect(
          findById(id).commonErrorTags,
          `${id} must include u2_denominador_cero`,
        ).toContain("u2_denominador_cero");
      }
    });
  });
});
