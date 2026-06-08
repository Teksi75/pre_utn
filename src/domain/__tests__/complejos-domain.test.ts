/**
 * Domain tests for `mat.u1.complejos` — Unit 1 Números complejos.
 *
 * Validates the skill is fully traversable:
 *  - It exists in the catalog with the correct dependency.
 *  - It is registered as the 8th pilot skill (after logaritmos).
 *  - It has the complete error taxonomy.
 *  - It is content-ready (theory, examples, exercises, feedback).
 *  - Every exercise uses a permitted type (no free-text a+bi).
 *  - Every exercise references the theory node and at least one error tag.
 *  - The /learn and /practice routes resolve correctly.
 *
 * PR 1 (RED): Tests reference production code; the pilot entry and taxonomy
 * tags do NOT exist yet. Content tests remain RED until PR 2–3.
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

const SKILL_ID = "mat.u1.complejos" as const;

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
  "symbolic",
  "fill-blank",
  "free-response",
  "graphical",
  "matching",
  "ordering",
]);

const PERMITTED_TYPES: ReadonlySet<ExerciseType> = new Set<ExerciseType>([
  "multiple-choice",
  "true-false",
  "numerical",
]);

const COMPLEJOS_ERROR_TAGS = [
  "u1_complejo_i_definicion",
  "u1_complejo_partes_confusion",
  "u1_complejo_suma_real",
  "u1_complejo_i_cuadrado_signo",
  "u1_complejo_conjugado_signo",
  "u1_complejo_division_sin_conjugado",
  "u1_complejo_potencia_ciclo",
  "u1_complejo_igualdad_parcial",
] as const;

// ── 1.1 Catalog identity ──────────────────────────────────────────────────

describe("mat.u1.complejos — catalog identity", () => {
  test("the skill ID is registered in the known skill catalog", () => {
    expect(KNOWN_SKILL_IDS.has(SKILL_ID)).toBe(true);
  });

  test("the skill depends on mat.u1.reales_operaciones (and only that)", () => {
    const dep = SKILL_DEPENDENCIES.find((d) => d.skillId === SKILL_ID);
    expect(dep).toBeDefined();
    expect(dep!.prerequisites).toEqual(["mat.u1.reales_operaciones"]);
  });

  test("the skill is registered as a pilot skill", () => {
    const pilotIds = PILOT_SKILLS.map((p) => p.skillId);
    expect(pilotIds).toContain(SKILL_ID);
    const pilot = PILOT_SKILLS.find((p) => p.skillId === SKILL_ID);
    expect(pilot!.unitKey).toBe("unit-1");
  });

  test("mat.u1.complejos is the 8th pilot entry, after logaritmos", () => {
    const pilotIds = PILOT_SKILLS.map((p) => p.skillId);
    const complejosIndex = pilotIds.indexOf(SKILL_ID);
    const logIndex = pilotIds.indexOf("mat.u1.logaritmos");
    expect(complejosIndex).toBe(7); // 0-indexed → 8th entry
    expect(logIndex).toBe(6);
    expect(complejosIndex).toBeGreaterThan(logIndex);
  });

  test("mat.u5.complejos_forma_polar depends on mat.u1.complejos", () => {
    const dep = SKILL_DEPENDENCIES.find(
      (d) => d.skillId === "mat.u5.complejos_forma_polar"
    );
    expect(dep).toBeDefined();
    expect(dep!.prerequisites).toContain(SKILL_ID);
  });
});

// ── 1.2 Readiness ─────────────────────────────────────────────────────────

describe("mat.u1.complejos — readiness", () => {
  test.todo("isSkillReady reports ready=true for the skill", () => {
    const result = isSkillReady(SKILL_ID);
    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test.todo("getSkillComponents reports all 5 components present", () => {
    const components = getSkillComponents(SKILL_ID);
    expect(components).toHaveLength(5);
    for (const component of components) {
      expect(component.present).toBe(true);
    }
  });
});

// ── 1.3 Theory and examples ───────────────────────────────────────────────

describe("mat.u1.complejos — theory and examples", () => {
  test.todo("a theory node exists for the skill with the expected id", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    expect(node!.id).toBe("theory-complejos");
  });

  test.todo("the theory node covers the core complex number concepts", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    const titles = node!.concepts.map((c) => c.id);
    // Spec requires 9 concepts — verify the essential ones are present
    expect(titles).toContain("concept-i-definicion");
    expect(titles).toContain("concept-forma-estandar");
    expect(titles).toContain("concept-partes-real-imaginaria");
    expect(titles).toContain("concept-igualdad");
    expect(titles).toContain("concept-suma-resta");
    expect(titles).toContain("concept-multiplicacion");
    expect(titles).toContain("concept-conjugado");
    expect(titles).toContain("concept-division");
    expect(titles).toContain("concept-potencias-i");
  });

  test.todo("the theory node validates as a TheoryNode with sufficient depth", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    expect(node!.concepts.length).toBeGreaterThanOrEqual(8);
    expect(node!.notation.length).toBeGreaterThanOrEqual(3);
    expect(node!.commonMistakes.length).toBeGreaterThanOrEqual(3);
    expect(node!.practicePrompts.length).toBeGreaterThanOrEqual(3);
    expect(node!.canonicalTrace.length).toBeGreaterThanOrEqual(1);
  });

  test.todo("the theory node does NOT mention polar form or Unit 5 depth", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    const allText = JSON.stringify(node!).toLowerCase();
    expect(allText).not.toContain("polar");
    expect(allText).not.toContain("moivre");
    expect(allText).not.toContain("argand");
    expect(allText).not.toContain("trigonométrica");
  });

  test.todo("at least 5 worked examples exist for the skill", () => {
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

describe("mat.u1.complejos — exercises", () => {
  const exercises = queryBySkill(SKILL_ID);

  test.todo("the skill has at least 10 exercises", () => {
    expect(exercises.length).toBeGreaterThanOrEqual(10);
  });

  test("exercise count is at most 14", () => {
    expect(exercises.length).toBeLessThanOrEqual(14);
  });

  test("every exercise uses a permitted type (no free-text a+bi)", () => {
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

  test("no exercise uses free-response type (prohibited for complex expressions)", () => {
    for (const exercise of exercises) {
      expect(
        exercise.type,
        `exercise ${exercise.id} uses free-response — prohibited for complex numbers`
      ).not.toBe("free-response");
    }
  });

  test.todo("every exercise references the complex numbers theory node", () => {
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
      expect(link.relatedTheoryIds).toContain("theory-complejos");
    }
  });

  test.todo("every exercise has at least one error tag", () => {
    for (const exercise of exercises) {
      expect(
        exercise.commonErrorTags.length,
        `exercise ${exercise.id} has no commonErrorTags`
      ).toBeGreaterThan(0);
    }
  });

  test.todo("every error tag references a real taxonomy entry", () => {
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

  test.todo("every exercise error tag is a u1_complejo_* tag", () => {
    for (const exercise of exercises) {
      for (const tag of exercise.commonErrorTags) {
        expect(
          tag,
          `exercise ${exercise.id} tag ${tag} is not a u1_complejo_* tag`
        ).toMatch(/^u1_complejo_/);
      }
    }
  });

  test.todo("every multiple-choice exercise has >=3 options and expectedAnswer in options", () => {
    for (const exercise of exercises) {
      if (exercise.type !== "multiple-choice") continue;
      expect(exercise.options).toBeDefined();
      expect(exercise.options!.length).toBeGreaterThanOrEqual(3);
      expect(exercise.options).toContain(exercise.expectedAnswer);
    }
  });

  test.todo("every true-false exercise uses the standard Verdadero/Falso options", () => {
    const tfExercises = exercises.filter((e) => e.type === "true-false");
    if (tfExercises.length === 0) return; // some skills may not have TF, skip gracefully
    for (const exercise of tfExercises) {
      expect(exercise.options).toBeDefined();
      expect(exercise.options!.length).toBe(2);
      expect(exercise.options).toContain("Verdadero");
      expect(exercise.options).toContain("Falso");
    }
  });

  test.todo("numerical exercises ask one scalar at a time (no multi-value or free-form)", () => {
    const numExercises = exercises.filter((e) => e.type === "numerical");
    for (const exercise of numExercises) {
      expect(
        exercise.expectedAnswer,
        `numerical exercise ${exercise.id} has multi-value expected answer: ${exercise.expectedAnswer}`
      ).not.toContain(",");
      // Expected answer should be a single finite scalar
      const parsed = Number(exercise.expectedAnswer);
      expect(
        Number.isFinite(parsed),
        `numerical exercise ${exercise.id} expectedAnswer "${exercise.expectedAnswer}" is not a finite scalar`
      ).toBe(true);
    }
  });

  test.todo("every exercise validates against the domain validator", () => {
    const taxonomy = loadTaxonomy();
    const knownErrorTagIds = new Set<string>(taxonomy.map((t) => t.id));
    for (const raw of loadCatalog()) {
      if (raw.skillId !== SKILL_ID) continue;
      expect(raw.id).toMatch(/^ex\.u1\.complejos\.\d+$/);
      expect(raw.prompt.trim().length).toBeGreaterThan(0);
      expect(raw.expectedAnswer.trim().length).toBeGreaterThan(0);
      expect(PERMITTED_TYPES.has(raw.type)).toBe(true);
      for (const tag of raw.commonErrorTags) {
        expect(knownErrorTagIds.has(tag)).toBe(true);
      }
    }
  });
});

// ── 1.4b Exercise difficulty graduation ────────────────────────────────────

describe("mat.u1.complejos — difficulty graduation", () => {
  const exercises = queryBySkill(SKILL_ID);

  test("all difficulties are between 1 and 4 inclusive", () => {
    for (const exercise of exercises) {
      expect(exercise.difficulty).toBeGreaterThanOrEqual(1);
      expect(exercise.difficulty).toBeLessThanOrEqual(4);
    }
  });

  test.todo("at least one exercise has difficulty 1 (entry level)", () => {
    const easy = exercises.filter((e) => e.difficulty === 1);
    expect(easy.length).toBeGreaterThanOrEqual(1);
  });

  test.todo("at least one exercise has difficulty 4 (challenging)", () => {
    const hard = exercises.filter((e) => e.difficulty === 4);
    expect(hard.length).toBeGreaterThanOrEqual(1);
  });
});

// ── 1.5 Feedback coverage ─────────────────────────────────────────────────

describe("mat.u1.complejos — feedback coverage", () => {
  test("every new complex number error tag is defined in the taxonomy", () => {
    const taxonomyIds = new Set<string>(loadTaxonomy().map((t) => t.id));
    for (const tag of COMPLEJOS_ERROR_TAGS) {
      expect(taxonomyIds.has(tag), `Tag ${tag} missing from taxonomy`).toBe(true);
    }
  });

  test.todo("every new complex number error tag has a feedback mapping", () => {
    const feedback = loadFeedbackContent("unit-1");
    const tags = new Set(feedback.map((f) => f.errorTag));
    for (const tag of COMPLEJOS_ERROR_TAGS) {
      expect(tags.has(tag), `Feedback mapping missing for ${tag}`).toBe(true);
    }
  });

  test.todo("every feedback mapping for the new tags has a valid type and points to recovery", () => {
    const feedback = loadFeedbackContent("unit-1");
    const validTypes = new Set(["corrective", "conceptual", "procedural"]);
    for (const tag of COMPLEJOS_ERROR_TAGS) {
      const mapping = feedback.find((f) => f.errorTag === tag);
      expect(mapping).toBeDefined();
      expect(validTypes.has(mapping!.type)).toBe(true);
      expect(mapping!.message.trim().length).toBeGreaterThan(10);
      expect(mapping!.recoveryTarget).toBeTruthy();
    }
  });

  test.todo("at least one feedback mapping recovers to theory-complejos", () => {
    const feedback = loadFeedbackContent("unit-1");
    const recoveringToTheory = feedback.filter(
      (f) =>
        COMPLEJOS_ERROR_TAGS.includes(
          f.errorTag as (typeof COMPLEJOS_ERROR_TAGS)[number]
        ) && f.recoveryTarget === "theory-complejos"
    );
    expect(recoveringToTheory.length).toBeGreaterThanOrEqual(1);
  });

  test.todo("each error tag feedback explains the specific misconception pedagogically", () => {
    const feedback = loadFeedbackContent("unit-1");
    const feedbackMap = new Map(feedback.map((f) => [f.errorTag, f]));
    // i_definicion should explain why i is not a real number
    const iDef = feedbackMap.get("u1_complejo_i_definicion");
    if (iDef) {
      expect(iDef.message.toLowerCase()).toMatch(/defin|i\^2|imaginaria|real/);
    }
    // i_cuadrado_signo should explain i^2 = -1 substitution
    const iCuad = feedbackMap.get("u1_complejo_i_cuadrado_signo");
    if (iCuad) {
      expect(iCuad.message.toLowerCase()).toMatch(/-1|i\^2|sustit/);
    }
  });
});

// ── 1.6 Route resolution ──────────────────────────────────────────────────

describe("mat.u1.complejos — route resolution", () => {
  test.todo("/learn/matematica/mat.u1.complejos resolves to a content-ready skill", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    expect(isSkillReady(SKILL_ID).ready).toBe(true);
  });

  test.todo("/practice?skill=mat.u1.complejos is blocked until reales_operaciones is mastered", () => {
    expect(resolveInitialPracticeSkill(SKILL_ID)).toBe(SKILL_ID);
    const analysis = analyzeRequestedSkill(SKILL_ID, emptyProgress());
    expect(analysis.kind).toBe("blocked");
    if (analysis.kind === "blocked") {
      expect(analysis.reason).toBe("missing-prerequisite");
      expect(analysis.missingPrerequisite).toBe("mat.u1.reales_operaciones");
    }
  });

  test.todo("/practice?skill=mat.u1.complejos opens once reales_operaciones is mastered", () => {
    const progress: PracticeProgress = {
      ...emptyProgress(),
      accuracyBySkill: { "mat.u1.reales_operaciones": 0.85 },
    };
    const analysis = analyzeRequestedSkill(SKILL_ID, progress);
    expect(analysis).toEqual({ kind: "ready", skillId: SKILL_ID });
  });
});

// ── 1.7 Error taxonomy structure ──────────────────────────────────────────

describe("mat.u1.complejos — error taxonomy structure", () => {
  test("all 8 u1_complejo_* tags have unit: 1", () => {
    const taxonomy = loadTaxonomy();
    for (const tag of COMPLEJOS_ERROR_TAGS) {
      const entry = taxonomy.find((t) => t.id === tag);
      expect(entry, `Tag ${tag} missing from taxonomy`).toBeDefined();
      expect(entry!.unit).toBe(1);
    }
  });

  test("each u1_complejo_* tag has a non-empty description and ≥ 2 examples", () => {
    const taxonomy = loadTaxonomy();
    for (const tag of COMPLEJOS_ERROR_TAGS) {
      const entry = taxonomy.find((t) => t.id === tag);
      expect(entry, `Tag ${tag} missing`).toBeDefined();
      expect(entry!.description.trim().length).toBeGreaterThan(0);
      expect(entry!.examples.length).toBeGreaterThanOrEqual(2);
    }
  });

  test("no duplicate u1_complejo_* tag IDs exist", () => {
    const taxonomy = loadTaxonomy();
    const complejoTags = taxonomy.filter((t) => t.id.startsWith("u1_complejo_"));
    const ids = complejoTags.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ── 1.8 Math rendering convention ─────────────────────────────────────────

describe("mat.u1.complejos — math rendering convention", () => {
  test.todo("all exercise prompts use $...$ KaTeX delimiters for math expressions", () => {
    const exercises = queryBySkill(SKILL_ID);
    for (const exercise of exercises) {
      const prompt = exercise.prompt;
      // Check for raw a+bi patterns without KaTeX wrapping
      const rawComplexPattern = /(?<![\$\\])(?:\d*\+?\d*[iI](?!\s*\$))/;
      // A more robust check: if prompt contains i (imaginary unit) it should be inside $...$
      if (/\b[iI]\b/.test(prompt)) {
        const hasKaTeX = /\$.*\$/.test(prompt);
        expect(
          hasKaTeX,
          `exercise ${exercise.id} prompt has imaginary unit reference without $...$ delimiters`
        ).toBe(true);
      }
    }
  });

  test.todo("all MC options with math use $...$ KaTeX delimiters", () => {
    const exercises = queryBySkill(SKILL_ID);
    for (const exercise of exercises) {
      if (exercise.type !== "multiple-choice" || !exercise.options) continue;
      for (const option of exercise.options) {
        const optionValue = getExerciseOptionValue(option);
        if (/\b[iI]\b/.test(optionValue)) {
          const hasKaTeX = /\$.*\$/.test(optionValue);
          expect(
            hasKaTeX,
            `exercise ${exercise.id} option "${optionValue}" has complex expression without $...$ delimiters`
          ).toBe(true);
        }
      }
    }
  });
});

// ── 1.9 Pilot label convention ────────────────────────────────────────────

describe("mat.u1.complejos — pilot label convention", () => {
  test("the pilot entry uses the label 'Números complejos'", () => {
    const pilot = PILOT_SKILLS.find((p) => p.skillId === SKILL_ID);
    expect(pilot).toBeDefined();
    expect(pilot!.label).toBe("Números complejos");
  });
});
