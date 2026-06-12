/**
 * Domain tests for `mat.u1.racionalizacion` — Unit 1 Racionalización.
 *
 * Validates the skill is fully traversable:
 *  - It exists in the catalog with the correct dependency.
 *  - It is content-ready (theory, examples, exercises, feedback).
 *  - Every exercise uses a permitted type (no free-text roots).
 *  - Every exercise references the theory node and at least one error tag.
 *  - The /learn and /practice routes resolve correctly.
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
import type { PracticeProgress } from "../progress/index";

const SKILL_ID = "mat.u1.racionalizacion" as const;

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

describe("mat.u1.racionalizacion — catalog identity", () => {
  test("the skill ID is registered in the known skill catalog", () => {
    expect(KNOWN_SKILL_IDS.has(SKILL_ID)).toBe(true);
  });

  test("the skill depends on mat.u1.potencias_raices (and only that)", () => {
    const dep = SKILL_DEPENDENCIES.find((d) => d.skillId === SKILL_ID);
    expect(dep).toBeDefined();
    expect(dep!.prerequisites).toEqual(["mat.u1.potencias_raices"]);
  });

  test("the skill is registered as a pilot skill", () => {
    const pilotIds = PILOT_SKILLS.map((p) => p.skillId);
    expect(pilotIds).toContain(SKILL_ID);
    const pilot = PILOT_SKILLS.find((p) => p.skillId === SKILL_ID);
    expect(pilot!.unitKey).toBe("unit-1");
  });
});

describe("mat.u1.racionalizacion — readiness", () => {
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

describe("mat.u1.racionalizacion — theory and examples", () => {
  test("a theory node exists for the skill with the expected id", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    expect(node!.id).toBe("theory-racionalizacion");
  });

  test("the theory node covers the core rationalization concepts", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    const titles = node!.concepts.map((c) => c.id);
    expect(titles).toContain("concept-que-es-racionalizar");
    expect(titles).toContain("concept-caso-raiz-cuadrada");
    expect(titles).toContain("concept-coeficiente-en-denominador");
    expect(titles).toContain("concept-binomio-conjugado");
    expect(titles).toContain("concept-error-multiplicar-solo-denominador");
    expect(titles).toContain("concept-error-exponente-negativo");
  });

  test("the theory node validates as a TheoryNode", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    expect(node!.concepts.length).toBeGreaterThanOrEqual(5);
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

describe("mat.u1.racionalizacion — exercises", () => {
  const exercises = queryBySkill(SKILL_ID);

  test("the skill has at least 8 exercises", () => {
    expect(exercises.length).toBeGreaterThanOrEqual(8);
  });

  test("every exercise uses a permitted type (no free-text roots)", () => {
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

  test("every exercise references the rationalization theory node", () => {
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
      expect(link.relatedTheoryIds).toContain("theory-racionalizacion");
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
    for (const exercise of exercises) {
      if (exercise.type !== "true-false") continue;
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
      // The validator was already run inside loadCatalog; if we got here, the
      // exercise is valid. Triangulate by re-running the shape contract.
      expect(raw.id).toMatch(/^ex\.u1\.racionalizacion\.\d+$/);
      expect(raw.prompt.trim().length).toBeGreaterThan(0);
      expect(raw.expectedAnswer.trim().length).toBeGreaterThan(0);
      expect(PERMITTED_TYPES.has(raw.type)).toBe(true);
      for (const tag of raw.commonErrorTags) {
        expect(knownErrorTagIds.has(tag)).toBe(true);
      }
    }
  });
});

describe("mat.u1.racionalizacion — coverage of micro-objectives", () => {
  const exercises = queryBySkill(SKILL_ID);

  test("at least 2 exercises cover choosing the correct rationalizing factor", () => {
    const matches = exercises.filter(
      (e) => (e as unknown as { category?: string }).category === "factor_racionalizante"
    );
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  test("at least 2 exercises cover simple square-root rationalization", () => {
    const matches = exercises.filter(
      (e) => (e as unknown as { category?: string }).category === "racionalizacion_simple"
    );
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  test("at least 2 exercises cover rationalization with a coefficient in the denominator", () => {
    const matches = exercises.filter(
      (e) => (e as unknown as { category?: string }).category === "racionalizacion_coeficiente"
    );
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  test("at least 2 exercises cover choosing the correct conjugate", () => {
    const matches = exercises.filter(
      (e) => (e as unknown as { category?: string }).category === "conjugado"
    );
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  test("at least 2 exercises cover binomial rationalization", () => {
    const matches = exercises.filter(
      (e) => (e as unknown as { category?: string }).category === "binomio"
    );
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  test("at least 1 exercise covers error detection in the procedure", () => {
    const matches = exercises.filter(
      (e) => (e as unknown as { category?: string }).category === "error_deteccion"
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

describe("mat.u1.racionalizacion — feedback coverage", () => {
  const RAC_TAGS = [
    "u1_rac_multiplica_solo_denominador",
    "u1_rac_factor_incorrecto",
    "u1_rac_conjugado_incorrecto",
    "u1_rac_signo_conjugado",
    "u1_rac_no_simplifica",
    "u1_rac_confunde_raiz_potencia",
    "u1_rac_usa_exponente_negativo",
    "u1_rac_pierde_equivalencia",
  ];

  test("every new rationalization error tag is defined in the taxonomy", () => {
    const taxonomyIds = new Set<string>(loadTaxonomy().map((t) => t.id));
    for (const tag of RAC_TAGS) {
      expect(taxonomyIds.has(tag), `Tag ${tag} missing from taxonomy`).toBe(true);
    }
  });

  test("every new rationalization error tag has a feedback mapping", () => {
    const feedback = loadFeedbackContent("unit-1");
    const tags = new Set(feedback.map((f) => f.errorTag));
    for (const tag of RAC_TAGS) {
      expect(tags.has(tag), `Feedback mapping missing for ${tag}`).toBe(true);
    }
  });

  test("every feedback mapping for the new tags has a valid type and points to recovery", () => {
    const feedback = loadFeedbackContent("unit-1");
    const validTypes = new Set(["corrective", "conceptual", "procedural"]);
    for (const tag of RAC_TAGS) {
      const mapping = feedback.find((f) => f.errorTag === tag);
      expect(mapping).toBeDefined();
      expect(validTypes.has(mapping!.type)).toBe(true);
      expect(mapping!.message.trim().length).toBeGreaterThan(10);
      expect(mapping!.recoveryTarget).toBeTruthy();
    }
  });

  test("at least one feedback mapping recovers to theory-racionalizacion", () => {
    const feedback = loadFeedbackContent("unit-1");
    const recoveringToTheory = feedback.filter(
      (f) =>
        RAC_TAGS.includes(f.errorTag) &&
        f.recoveryTarget === "theory-racionalizacion"
    );
    expect(recoveringToTheory.length).toBeGreaterThanOrEqual(1);
  });
});

describe("mat.u1.racionalizacion — route resolution", () => {
  test("/learn/matematica/mat.u1.racionalizacion resolves to a content-ready skill", () => {
    // The /learn/[skillId] page uses loadTheoryContent to look up the node.
    // If the node is missing, the page calls notFound(). We assert the node
    // exists and the skill is ready, which is what the page gates on.
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    expect(isSkillReady(SKILL_ID).ready).toBe(true);
  });

  test("/practice?skill=mat.u1.racionalizacion resolves to a ready skill", () => {
    // resolveInitialPracticeSkill is the legacy gate used by the practice
    // page; analyzeRequestedSkill is the readiness-aware gate.
    expect(resolveInitialPracticeSkill(SKILL_ID)).toBe(SKILL_ID);
    const analysis = analyzeRequestedSkill(SKILL_ID, emptyProgress());
    expect(analysis.kind).toBe("blocked");
    if (analysis.kind === "blocked") {
      // The skill is content-ready but blocked on its prereq until the
      // student masters potencias_raices. The page should surface a clear
      // banner instead of silently no-oping.
      expect(analysis.reason).toBe("missing-prerequisite");
      expect(analysis.missingPrerequisite).toBe("mat.u1.potencias_raices");
    }
  });

  test("/practice?skill=mat.u1.racionalizacion opens once potencias_raices is mastered", () => {
    const progress: PracticeProgress = {
      ...emptyProgress(),
      accuracyBySkill: { "mat.u1.potencias_raices": 0.85 },
    };
    const analysis = analyzeRequestedSkill(SKILL_ID, progress);
    expect(analysis).toEqual({ kind: "ready", skillId: SKILL_ID });
  });
});
