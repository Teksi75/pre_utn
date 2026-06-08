import { describe, test, expect } from "vitest";
import { PILOT_SKILLS, PILOT_SKILL_UNIT_MAP } from "../catalog/pilot-skills";
import { SKILL_DEPENDENCIES } from "../models/skill-catalog";
import { isSkillReady, getSkillComponents } from "../catalog/readiness";
import { loadTheoryContent } from "../catalog/content-loaders";
import { loadExampleContent } from "../catalog/content-loaders";
import { loadFeedbackContent } from "../catalog/content-loaders";
import { queryBySkill } from "../catalog/index";
import { lookupTag } from "../error-taxonomy/index";

const SKILL_ID = "mat.u1.valor_absoluto";

const EXPECTED_TAGS = [
  "u1_abs_signo_incorrecto",
  "u1_abs_cero",
  "u1_abs_distancia_no_signo",
  "u1_abs_no_negativo",
  "u1_abs_confunde_opuesto",
  "u1_abs_distancia_entre_reales",
  "u1_abs_sqrt_cuadrado",
  "u1_abs_doble_solucion",
  "u1_abs_distributiva_falsa",
] as const;

// ── Task 1.2: Pilot order, prerequisite, readiness, content loading ────────

describe("valor_absoluto — pilot order and prerequisites", () => {
  test("valor_absoluto appears in PILOT_SKILLS", () => {
    const ids = PILOT_SKILLS.map((s) => s.skillId);
    expect(ids).toContain(SKILL_ID);
  });

  test("intervalos precedes valor_absoluto in PILOT_SKILLS", () => {
    const ids = PILOT_SKILLS.map((s) => s.skillId);
    const intervalosIdx = ids.indexOf("mat.u1.intervalos");
    const valorIdx = ids.indexOf(SKILL_ID);
    expect(intervalosIdx).toBeLessThan(valorIdx);
  });

  test("logaritmos follows valor_absoluto in PILOT_SKILLS", () => {
    const ids = PILOT_SKILLS.map((s) => s.skillId);
    const valorIdx = ids.indexOf(SKILL_ID);
    const logIdx = ids.indexOf("mat.u1.logaritmos");
    expect(valorIdx).toBeLessThan(logIdx);
  });

  test("valor_absoluto has unitKey unit-1 in PILOT_SKILLS", () => {
    const entry = PILOT_SKILLS.find((s) => s.skillId === SKILL_ID);
    expect(entry).toBeDefined();
    expect(entry!.unitKey).toBe("unit-1");
  });

  test("intervalos is prerequisite of valor_absoluto", () => {
    const dep = SKILL_DEPENDENCIES.find((d) => d.skillId === SKILL_ID);
    expect(dep).toBeDefined();
    expect(dep!.prerequisites).toContain("mat.u1.intervalos");
  });

  test("logaritmos lists valor_absoluto as prerequisite", () => {
    const logDep = SKILL_DEPENDENCIES.find(
      (d) => d.skillId === "mat.u1.logaritmos"
    );
    expect(logDep).toBeDefined();
    expect(logDep!.prerequisites).toContain(SKILL_ID);
  });

  test("PILOT_SKILL_UNIT_MAP maps valor_absoluto to unit-1", () => {
    expect(PILOT_SKILL_UNIT_MAP[SKILL_ID]).toBe("unit-1");
  });
});

// ── Task 1.2: Readiness and content loading ─────────────────────────────────

describe("valor_absoluto — readiness", () => {
  test("isSkillReady returns ready: true", () => {
    const result = isSkillReady(SKILL_ID);
    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test("getSkillComponents returns 5 components all present", () => {
    const components = getSkillComponents(SKILL_ID);
    expect(components).toHaveLength(5);
    for (const component of components) {
      expect(component.present).toBe(true);
    }
  });
});

describe("valor_absoluto — content loads without error", () => {
  test("theory content exists for valor_absoluto", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
  });

  test("example content exists for valor_absoluto", () => {
    const examples = loadExampleContent("unit-1");
    const skillExamples = examples.filter((e) => e.skillId === SKILL_ID);
    expect(skillExamples.length).toBeGreaterThan(0);
  });

  test("exercises exist for valor_absoluto (≥4 for readiness)", () => {
    const exercises = queryBySkill(SKILL_ID);
    expect(exercises.length).toBeGreaterThanOrEqual(4);
  });

  test("feedback content exists referencing valor_absoluto error tags", () => {
    const feedback = loadFeedbackContent("unit-1");
    const exercises = queryBySkill(SKILL_ID);
    const allTags = exercises.flatMap((e) => e.commonErrorTags);
    const hasFeedback = feedback.some((m) => allTags.includes(m.errorTag));
    expect(hasFeedback).toBe(true);
  });
});

// ── Task 1.3: Theory concepts, examples, exercises ──────────────────────────

describe("valor_absoluto — theory content", () => {
  test("theory has ≥9 concepts", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    expect(node!.concepts.length).toBeGreaterThanOrEqual(9);
  });

  test("theory covers definition by cases", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    const body = node!.concepts
      .map((c) => `${c.title} ${c.body}`)
      .join(" ")
      .toLowerCase();
    expect(body).toMatch(/casos|definición por casos|definicion por casos/);
  });

  test("theory covers distance to zero", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    const body = node!.concepts
      .map((c) => `${c.title} ${c.body}`)
      .join(" ")
      .toLowerCase();
    expect(body).toMatch(/distancia|recta numérica|recta numerica/);
  });

  test("theory covers non-negative result", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    const body = node!.concepts
      .map((c) => `${c.title} ${c.body}`)
      .join(" ")
      .toLowerCase();
    expect(body).toMatch(/no.?negativ|siempre.*mayor|≥\s*0|>=\s*0/);
  });

  test("theory covers opposites property", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    const body = node!.concepts
      .map((c) => `${c.title} ${c.body}`)
      .join(" ")
      .toLowerCase();
    expect(body).toMatch(/opuest|\\|a\\|.*=.*\\|-a\\|/);
  });

  test("theory covers distance between reals", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    const body = node!.concepts
      .map((c) => `${c.title} ${c.body}`)
      .join(" ")
      .toLowerCase();
    expect(body).toMatch(/entre.*reales|\\|a\s*-\s*b\\|/);
  });

  test("theory covers product/quotient properties", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    const body = node!.concepts
      .map((c) => `${c.title} ${c.body}`)
      .join(" ")
      .toLowerCase();
    expect(body).toMatch(/producto|cociente|\\|ab\\|.*=.*\\|a\\|.*\\|b\\|/);
  });

  test("theory covers |x| = a two-solution", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    const body = node!.concepts
      .map((c) => `${c.title} ${c.body}`)
      .join(" ")
      .toLowerCase();
    expect(body).toMatch(/dos soluciones|dos casos|x\s*=\s*a|x\s*=\s*-\s*a/);
  });

  test("theory covers √(x²) = |x|", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    const body = node!.concepts
      .map((c) => `${c.title} ${c.body}`)
      .join(" ")
      .toLowerCase();
    expect(body).toMatch(/sqrt.*cuadrado|√.*²|x²|cuadrado.*valor absoluto/);
  });

  test("theory covers non-distributive over sum", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    const body = node!.concepts
      .map((c) => `${c.title} ${c.body}`)
      .join(" ")
      .toLowerCase();
    expect(body).toMatch(
      /distribut|\\|a\s*\+\s*b\\|.*≠.*\\|a\\|.*\+.*\\|b\\||no.*distribuye/
    );
  });

  test("theory does not reference modular inequalities or Unit 3 depth", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    const body = node!.concepts
      .map((c) => `${c.title} ${c.body}`)
      .join(" ")
      .toLowerCase();
    expect(body).not.toMatch(/\|x\s*-\s*\d\|\s*[<>]\s*\d/);
    expect(body).not.toMatch(/inecuación.*valor absoluto|inecuacion.*valor absoluto/);
  });
});

describe("valor_absoluto — worked examples", () => {
  test("has ≥5 worked examples", () => {
    const examples = loadExampleContent("unit-1");
    const skillExamples = examples.filter((e) => e.skillId === SKILL_ID);
    expect(skillExamples.length).toBeGreaterThanOrEqual(5);
  });

  test("includes a numeric computation example", () => {
    const examples = loadExampleContent("unit-1");
    const skillExamples = examples.filter((e) => e.skillId === SKILL_ID);
    const allText = skillExamples
      .map((e) => `${e.problem} ${e.finalAnswer}`)
      .join(" ")
      .toLowerCase();
    expect(allText).toMatch(/\|.*\|/);
  });

  test("includes a distance between reals example", () => {
    const examples = loadExampleContent("unit-1");
    const skillExamples = examples.filter((e) => e.skillId === SKILL_ID);
    const allText = skillExamples
      .map((e) => `${e.problem} ${e.finalAnswer}`)
      .join(" ")
      .toLowerCase();
    expect(allText).toMatch(/distancia|entre.*reales|\\|a\s*-\s*b\\|/);
  });
});

describe("valor_absoluto — exercises", () => {
  test("has 8–12 exercises", () => {
    const exercises = queryBySkill(SKILL_ID);
    expect(exercises.length).toBeGreaterThanOrEqual(8);
    expect(exercises.length).toBeLessThanOrEqual(12);
  });

  test("all exercises are multiple-choice or numerical", () => {
    const exercises = queryBySkill(SKILL_ID);
    for (const ex of exercises) {
      expect(["multiple-choice", "numerical"]).toContain(ex.type);
    }
  });

  test("no exercise uses prohibited types", () => {
    const exercises = queryBySkill(SKILL_ID);
    for (const ex of exercises) {
      expect(ex.type).not.toBe("symbolic");
      expect(ex.type).not.toBe("free-response");
    }
  });

  test("all exercises have difficulty 1–4", () => {
    const exercises = queryBySkill(SKILL_ID);
    for (const ex of exercises) {
      expect(ex.difficulty).toBeGreaterThanOrEqual(1);
      expect(ex.difficulty).toBeLessThanOrEqual(4);
    }
  });

  test("MC exercises have ≥3 options", () => {
    const exercises = queryBySkill(SKILL_ID);
    const mcExercises = exercises.filter((e) => e.type === "multiple-choice");
    for (const ex of mcExercises) {
      expect(ex.options).toBeDefined();
      expect(ex.options!.length).toBeGreaterThanOrEqual(3);
    }
  });

  test("MC exercises have expectedAnswer matching exactly one option", () => {
    const exercises = queryBySkill(SKILL_ID);
    const mcExercises = exercises.filter((e) => e.type === "multiple-choice");
    for (const ex of mcExercises) {
      const matches = ex.options!.filter((o) => o === ex.expectedAnswer);
      expect(matches.length).toBe(1);
    }
  });

  test("exercises reference only tags with feedback coverage", () => {
    const exercises = queryBySkill(SKILL_ID);
    const feedback = loadFeedbackContent("unit-1");
    const feedbackTags = new Set(feedback.map((m) => m.errorTag));
    for (const ex of exercises) {
      for (const tag of ex.commonErrorTags) {
        expect(feedbackTags.has(tag)).toBe(true);
      }
    }
  });
});

// ── Task 1.4: Feedback tags and KaTeX delimiters ───────────────────────────

describe("valor_absoluto — error taxonomy tags", () => {
  test.each(EXPECTED_TAGS)("tag %s exists in taxonomy", (tagId) => {
    const tag = lookupTag(tagId);
    expect(tag).toBeDefined();
    expect(tag!.id).toBe(tagId);
    expect(tag!.unit).toBe(1);
  });

  test.each(EXPECTED_TAGS)("tag %s has non-empty description", (tagId) => {
    const tag = lookupTag(tagId);
    expect(tag!.description).toBeTruthy();
    expect(tag!.description.length).toBeGreaterThan(10);
  });

  test.each(EXPECTED_TAGS)("tag %s has ≥1 example", (tagId) => {
    const tag = lookupTag(tagId);
    expect(tag!.examples.length).toBeGreaterThanOrEqual(1);
  });
});

describe("valor_absoluto — feedback mappings", () => {
  test.each(EXPECTED_TAGS)(
    "feedback exists for %s with pedagogical explanation",
    (tagId) => {
      const feedback = loadFeedbackContent("unit-1");
      const mapping = feedback.find((m) => m.errorTag === tagId);
      expect(mapping).toBeDefined();
      expect(mapping!.message).toBeTruthy();
      expect(mapping!.message.length).toBeGreaterThan(10);
    }
  );

  test("all exercise error tags have feedback coverage", () => {
    const exercises = queryBySkill(SKILL_ID);
    const feedback = loadFeedbackContent("unit-1");
    const feedbackTags = new Set(feedback.map((m) => m.errorTag));
    for (const ex of exercises) {
      for (const tag of ex.commonErrorTags) {
        expect(feedbackTags.has(tag)).toBe(true);
      }
    }
  });
});

describe("valor_absoluto — KaTeX delimiter safety", () => {
  test("theory body uses safe KaTeX delimiters (no bare pipes outside math)", () => {
    const nodes = loadTheoryContent("unit-1");
    const node = nodes.find((n) => n.skillId === SKILL_ID);
    expect(node).toBeDefined();
    for (const concept of node!.concepts) {
      // Every pipe character should be inside $...$ or $$...$$ delimiters
      const parts = concept.body.split(/\$/);
      // Odd-indexed parts (1, 3, 5, ...) are inside math delimiters
      // Even-indexed parts (0, 2, 4, ...) are outside — check no bare |
      for (let i = 0; i < parts.length; i += 2) {
        expect(parts[i]).not.toMatch(/\|/);
      }
    }
  });
});

// ── Task 1.5: Catalog readiness integration ────────────────────────────────

describe("valor_absoluto — catalog readiness integration", () => {
  test("valor_absoluto has ≥4 exercises in catalog", () => {
    const exercises = queryBySkill(SKILL_ID);
    expect(exercises.length).toBeGreaterThanOrEqual(4);
  });

  test("valor_absoluto has theory content with ≥1 concept", () => {
    const nodes = loadTheoryContent("unit-1");
    const skillNode = nodes.find((n) => n.skillId === SKILL_ID);
    expect(skillNode).toBeDefined();
    expect(skillNode!.concepts.length).toBeGreaterThanOrEqual(1);
  });

  test("valor_absoluto has ≥2 worked examples", () => {
    const examples = loadExampleContent("unit-1");
    const skillExamples = examples.filter((e) => e.skillId === SKILL_ID);
    expect(skillExamples.length).toBeGreaterThanOrEqual(2);
  });
});
