/**
 * Domain tests for `mat.u1.logaritmos` — Unit 1 Logaritmos.
 *
 * Validates the skill is fully traversable:
 *  - It exists in the catalog with the correct dependency.
 *  - It is content-ready (theory, examples, exercises, feedback).
 *  - Every exercise uses a permitted type (no free-text logarithmic expressions).
 *  - Every exercise references the theory node and at least one error tag.
 *  - The /learn and /practice routes resolve correctly.
 *
 * PR 1 (RED): Tests reference production code that does NOT exist yet.
 * Content, taxonomy, pilot registration, and route mappings are added in PR 2–3.
 */

import { describe, test, expect } from "vitest";
import {
  isSkillReady,
  getSkillComponents,
} from "../catalog/readiness";
import { loadTheoryContent, loadExampleContent, loadFeedbackContent } from "../catalog/content-loaders";
import { queryBySkill, loadCatalog } from "../catalog/index";
import { PILOT_SKILLS } from "../catalog/pilot-skills";
import { SKILL_DEPENDENCIES, KNOWN_SKILL_IDS } from "../models/skill-catalog";
import { loadTaxonomy } from "../error-taxonomy/index";
import { resolveInitialPracticeSkill, analyzeRequestedSkill } from "../../app/practice/start-skill";
import type { Exercise, ExerciseType } from "../models/exercise";
import { getExerciseOptionValue } from "../models/exercise";
import type { PracticeProgress } from "../progress/index";

const SKILL_ID = "mat.u1.logaritmos" as const;

function emptyProgress(): PracticeProgress {
  return {
    attempts: [],
    accuracyBySkill: {},
    trendBySkill: {},
    lastPracticedBySkill: {},
    diagnosticResult: null,
    studyPlan: null,
  };
}

const FORBIDDEN_TYPES: ReadonlySet<ExerciseType> = new Set<ExerciseType>([
  "fill-blank",
  "graphical",
  "matching",
  "ordering",
]);

const PERMITTED_TYPES: ReadonlySet<ExerciseType> = new Set<ExerciseType>([
  "multiple-choice",
  "true-false",
  "numerical",
]);

const LOG_ERROR_TAGS = [
  "u1_log_base_invalida",
  "u1_log_argumento_no_positivo",
  "u1_log_confunde_base_argumento",
  "u1_log_confunde_resultado_exponente",
  "u1_log_conversion_exponencial",
  "u1_log_propiedad_aplicada_mal",
] as const;

// ── 1.1 Catalog identity ──────────────────────────────────────────────────

describe("mat.u1.logaritmos — catalog identity", () => {
  test("the skill ID is registered in the known skill catalog", () => {
    expect(KNOWN_SKILL_IDS.has(SKILL_ID)).toBe(true);
  });

  test("the skill depends on mat.u1.valor_absoluto (and only that)", () => {
    const dep = SKILL_DEPENDENCIES.find((d) => d.skillId === SKILL_ID);
    expect(dep).toBeDefined();
    expect(dep!.prerequisites).toEqual(["mat.u1.valor_absoluto"]);
  });

  test("the skill is registered as a pilot skill", () => {
    const pilotIds = PILOT_SKILLS.map((p) => p.skillId);
    expect(pilotIds).toContain(SKILL_ID);
    const pilot = PILOT_SKILLS.find((p) => p.skillId === SKILL_ID);
    expect(pilot!.unitKey).toBe("unit-1");
  });
});

// ── 1.2 Readiness ─────────────────────────────────────────────────────────

describe("mat.u1.logaritmos — readiness", () => {
  test("isSkillReady reports ready=true for the skill", () => {
    const result = isSkillReady(SKILL_ID);
    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test("getSkillComponents reports all 5 components present", () => {
    const components = getSkillComponents(SKILL_ID);
    expect(components).toHaveLength(5);
    for (const component of components) {
      expect(component.present).toBe(true);
    }
  });
});

// ── 1.3 Theory and examples ───────────────────────────────────────────────

describe("mat.u1.logaritmos — theory and examples", () => {
  test("a theory node exists for the skill with the expected id", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    expect(node!.id).toBe("theory-logaritmos");
  });

  test("the theory node covers the core logarithm concepts", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    const titles = node!.concepts.map((c) => c.id);
    expect(titles).toContain("concept-definicion-logaritmo");
    expect(titles).toContain("concept-conversion-log-exponencial");
    expect(titles).toContain("concept-condiciones-existencia");
    expect(titles).toContain("concept-valor-simple");
    expect(titles).toContain("concept-propiedades-basicas");
    expect(titles).toContain("concept-error-deteccion");
  });

  test("the theory node validates as a TheoryNode", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    expect(node!.concepts.length).toBeGreaterThanOrEqual(6);
    expect(node!.notation.length).toBeGreaterThanOrEqual(3);
    expect(node!.commonMistakes.length).toBeGreaterThanOrEqual(3);
    expect(node!.practicePrompts.length).toBeGreaterThanOrEqual(3);
    expect(node!.canonicalTrace.length).toBeGreaterThanOrEqual(1);
  });

  test("at least 5 worked examples exist for the skill", () => {
    const examples = loadExampleContent("unit-1").filter(
      (e) => e.skillId === SKILL_ID
    );
    expect(examples.length).toBeGreaterThanOrEqual(5);
    for (const example of examples) {
      expect(example.steps.length).toBeGreaterThanOrEqual(2);
      expect(example.finalAnswer).toBeTruthy();
    }
  });
});

// ── 1.4 Exercises ─────────────────────────────────────────────────────────

describe("mat.u1.logaritmos — exercises", () => {
  const exercises = queryBySkill(SKILL_ID);

  test("the skill has at least 8 exercises", () => {
    expect(exercises.length).toBeGreaterThanOrEqual(8);
  });

  test("every exercise uses a permitted type (no free-text logarithmic expressions)", () => {
    for (const exercise of exercises) {
      expect(
        PERMITTED_TYPES.has(exercise.type),
        `exercise ${exercise.id} has forbidden type ${exercise.type}`
      ).toBe(true);
    }
  });

  test("no exercise uses a forbidden free-text or symbolic type", () => {
    for (const exercise of exercises) {
      expect(
        FORBIDDEN_TYPES.has(exercise.type),
        `exercise ${exercise.id} uses forbidden type ${exercise.type}`
      ).toBe(false);
    }
  });

  test("every exercise references the logarithm theory node", () => {
    const links = exercises.map((e) => ({
      id: e.id,
      relatedTheoryIds: (e as unknown as { relatedTheoryIds?: readonly string[] })
        .relatedTheoryIds,
    }));
    for (const link of links) {
      expect(
        Array.isArray(link.relatedTheoryIds),
        `exercise ${link.id} missing relatedTheoryIds`
      ).toBe(true);
      expect(link.relatedTheoryIds!.length).toBeGreaterThan(0);
      expect(link.relatedTheoryIds).toContain("theory-logaritmos");
    }
  });

  test("every exercise has at least one error tag", () => {
    for (const exercise of exercises) {
      expect(
        exercise.commonErrorTags.length,
        `exercise ${exercise.id} has no commonErrorTags`
      ).toBeGreaterThan(0);
    }
  });

  test("every error tag references a real taxonomy entry", () => {
    const taxonomyIds = new Set<string>(loadTaxonomy().map((t) => t.id));
    for (const exercise of exercises) {
      for (const tag of exercise.commonErrorTags) {
        expect(
          taxonomyIds.has(tag),
          `exercise ${exercise.id} references unknown error tag ${tag}`
        ).toBe(true);
      }
    }
  });

  test("every multiple-choice exercise has >=3 options and expectedAnswer in options", () => {
    for (const exercise of exercises) {
      if (exercise.type !== "multiple-choice") continue;
      expect(exercise.options).toBeDefined();
      expect(exercise.options!.length).toBeGreaterThanOrEqual(3);
      expect(exercise.options).toContain(exercise.expectedAnswer);
    }
  });

  test("every true-false exercise uses the standard Verdadero/Falso options", () => {
    const tfExercises = exercises.filter((e) => e.type === "true-false");
    expect(tfExercises.length).toBeGreaterThan(0);
    for (const exercise of tfExercises) {
      expect(exercise.options).toBeDefined();
      expect(exercise.options!.length).toBe(2);
      expect(exercise.options).toContain("Verdadero");
      expect(exercise.options).toContain("Falso");
    }
  });

  test("every exercise validates against the domain validator", () => {
    const taxonomy = loadTaxonomy();
    const knownErrorTagIds = new Set<string>(taxonomy.map((t) => t.id));
    for (const raw of loadCatalog()) {
      if (raw.skillId !== SKILL_ID) continue;
      expect(raw.id).toMatch(/^ex\.u1\.logaritmos\.\d+$/);
      expect(raw.prompt.trim().length).toBeGreaterThan(0);
      expect(raw.expectedAnswer.trim().length).toBeGreaterThan(0);
      expect(PERMITTED_TYPES.has(raw.type)).toBe(true);
      for (const tag of raw.commonErrorTags) {
        expect(knownErrorTagIds.has(tag)).toBe(true);
      }
    }
  });
});

// ── 1.4b Coverage of micro-objectives ─────────────────────────────────────

describe("mat.u1.logaritmos — coverage of micro-objectives", () => {
  const exercises = queryBySkill(SKILL_ID);

  test("at least 1 exercise covers definicion (meaning as exponent)", () => {
    const matches = exercises.filter(
      (e) => (e as unknown as { category?: string }).category === "definicion"
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  test("at least 2 exercises cover conversion log↔exponencial", () => {
    const matches = exercises.filter(
      (e) => (e as unknown as { category?: string }).category === "conversion"
    );
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  test("at least 1 exercise covers existencia (base>0, base≠1, argumento>0)", () => {
    const matches = exercises.filter(
      (e) => (e as unknown as { category?: string }).category === "existencia"
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  test("at least 1 exercise covers valor_simple", () => {
    const matches = exercises.filter(
      (e) => (e as unknown as { category?: string }).category === "valor_simple"
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  test("at least 1 exercise covers propiedades_basicas", () => {
    const matches = exercises.filter(
      (e) => (e as unknown as { category?: string }).category === "propiedades_basicas"
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  test("at least 1 exercise covers error_deteccion", () => {
    const matches = exercises.filter(
      (e) => (e as unknown as { category?: string }).category === "error_deteccion"
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

// ── 1.5 Feedback coverage ─────────────────────────────────────────────────

describe("mat.u1.logaritmos — feedback coverage", () => {
  test("every new logarithm error tag is defined in the taxonomy", () => {
    const taxonomyIds = new Set<string>(loadTaxonomy().map((t) => t.id));
    for (const tag of LOG_ERROR_TAGS) {
      expect(taxonomyIds.has(tag), `Tag ${tag} missing from taxonomy`).toBe(true);
    }
  });

  test("every new logarithm error tag has a feedback mapping", () => {
    const feedback = loadFeedbackContent("unit-1");
    const tags = new Set(feedback.map((f) => f.errorTag));
    for (const tag of LOG_ERROR_TAGS) {
      expect(tags.has(tag), `Feedback mapping missing for ${tag}`).toBe(true);
    }
  });

  test("every feedback mapping for the new tags has a valid type and points to recovery", () => {
    const feedback = loadFeedbackContent("unit-1");
    const validTypes = new Set(["corrective", "conceptual", "procedural"]);
    for (const tag of LOG_ERROR_TAGS) {
      const mapping = feedback.find((f) => f.errorTag === tag);
      expect(mapping).toBeDefined();
      expect(validTypes.has(mapping!.type)).toBe(true);
      expect(mapping!.message.trim().length).toBeGreaterThan(10);
      expect(mapping!.recoveryTarget).toBeTruthy();
    }
  });

  test("at least one feedback mapping recovers to theory-logaritmos", () => {
    const feedback = loadFeedbackContent("unit-1");
    const recoveringToTheory = feedback.filter(
      (f) =>
        LOG_ERROR_TAGS.includes(f.errorTag as typeof LOG_ERROR_TAGS[number]) &&
        f.recoveryTarget === "theory-logaritmos"
    );
    expect(recoveringToTheory.length).toBeGreaterThanOrEqual(1);
  });
});

// ── 1.6 Route resolution ──────────────────────────────────────────────────

describe("mat.u1.logaritmos — route resolution", () => {
  test("/learn/matematica/mat.u1.logaritmos resolves to a content-ready skill", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    expect(isSkillReady(SKILL_ID).ready).toBe(true);
  });

  test("/practice?skill=mat.u1.logaritmos is blocked until valor_absoluto is mastered", () => {
    expect(resolveInitialPracticeSkill(SKILL_ID)).toBe(SKILL_ID);
    const analysis = analyzeRequestedSkill(SKILL_ID, emptyProgress());
    expect(analysis.kind).toBe("blocked");
    if (analysis.kind === "blocked") {
      expect(analysis.reason).toBe("missing-prerequisite");
      expect(analysis.missingPrerequisite).toBe("mat.u1.valor_absoluto");
    }
  });

  test("/practice?skill=mat.u1.logaritmos opens once valor_absoluto is mastered", () => {
    const progress: PracticeProgress = {
      ...emptyProgress(),
      accuracyBySkill: { "mat.u1.valor_absoluto": 0.85 },
    };
    const analysis = analyzeRequestedSkill(SKILL_ID, progress);
    expect(analysis).toEqual({ kind: "ready", skillId: SKILL_ID });
  });
});

// ── Math rendering convention ─────────────────────────────────────────────

describe("mat.u1.logaritmos — math rendering convention", () => {
  test("all exercise prompts use $...$ KaTeX delimiters (no raw log_2(8) visibility)", () => {
    const exercises = queryBySkill(SKILL_ID);
    for (const exercise of exercises) {
      // If the prompt contains a logarithm expression, it must use $...$ delimiters
      const prompt = exercise.prompt;
      // Check for raw log patterns without KaTeX wrapping
      const rawLogPattern = /(?<![\$\\])log[_{]\d+[}(]/;
      expect(
        rawLogPattern.test(prompt),
        `exercise ${exercise.id} prompt has raw log expression without $...$ delimiters`
      ).toBe(false);
    }
  });

  test("all MC options with math use $...$ KaTeX delimiters", () => {
    const exercises = queryBySkill(SKILL_ID);
    for (const exercise of exercises) {
      if (exercise.type !== "multiple-choice" || !exercise.options) continue;
      for (const option of exercise.options) {
        const optionValue = getExerciseOptionValue(option);
        const rawLogPattern = /(?<![\$\\])log[_{]\d+[}(]/;
        expect(
          rawLogPattern.test(optionValue),
          `exercise ${exercise.id} option "${optionValue}" has raw log expression`
        ).toBe(false);
      }
    }
  });
});
