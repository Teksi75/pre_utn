import { describe, test, expect } from "vitest";
import { isSkillReady, getSkillComponents } from "../catalog/readiness";
import {
  loadTheoryContent,
  loadExampleContent,
  loadFeedbackContent,
} from "../catalog/content-loaders";
import { queryBySkill } from "../catalog/index";
import { PILOT_SKILLS } from "../catalog/pilot-skills";

const PILOT_SKILL_IDS = [
  "mat.u1.conjuntos_numericos",
  "mat.u1.reales_operaciones",
  "mat.u1.potencias_raices",
  "mat.u1.racionalizacion",
  "mat.u1.intervalos",
  "mat.u1.valor_absoluto",
  "mat.u1.logaritmos",
  "mat.u1.complejos",
] as const;

describe("getSkillComponents", () => {
  test("returns 5 component statuses for a pilot skill", () => {
    const components = getSkillComponents("mat.u1.reales_operaciones");
    expect(components).toHaveLength(5);
  });

  test("theory component is present when theory content exists", () => {
    const components = getSkillComponents("mat.u1.reales_operaciones");
    const theory = components.find((c) => c.name === "theory");
    expect(theory?.present).toBe(true);
  });

  test("examples component is present when example content exists", () => {
    const components = getSkillComponents("mat.u1.reales_operaciones");
    const examples = components.find((c) => c.name === "examples");
    expect(examples?.present).toBe(true);
  });

  test("exercises component is present when exercises exist", () => {
    const components = getSkillComponents("mat.u1.reales_operaciones");
    const exercises = components.find((c) => c.name === "exercises");
    expect(exercises?.present).toBe(true);
  });

  test("feedback component is present when feedback mappings exist", () => {
    const components = getSkillComponents("mat.u1.reales_operaciones");
    const feedback = components.find((c) => c.name === "feedback");
    expect(feedback?.present).toBe(true);
  });

  test("evaluation component is present (always true for pilot)", () => {
    const components = getSkillComponents("mat.u1.reales_operaciones");
    const evaluation = components.find((c) => c.name === "evaluation");
    expect(evaluation?.present).toBe(true);
  });

  test("potencias_raices has all 5 components present", () => {
    const components = getSkillComponents("mat.u1.potencias_raices");
    expect(components).toHaveLength(5);
    for (const component of components) {
      expect(component.present).toBe(true);
    }
  });
});

describe("isSkillReady", () => {
  test.each(PILOT_SKILL_IDS)("pilot skill %s is ready", (skillId) => {
    const result = isSkillReady(skillId);
    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test("potencias_raices is ready with all components", () => {
    const result = isSkillReady("mat.u1.potencias_raices");
    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test("complejos está ready: ejercicios y feedback linkage completos (PR 3)", () => {
    const result = isSkillReady("mat.u1.complejos");
    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
  });
});

describe("complejos component readiness (PR 3 — all components present)", () => {
  test("mat.u1.complejos has theory content present", () => {
    const components = getSkillComponents("mat.u1.complejos");
    const theory = components.find((c) => c.name === "theory");
    expect(theory?.present).toBe(true);
  });

  test("mat.u1.complejos has examples content present", () => {
    const components = getSkillComponents("mat.u1.complejos");
    const examples = components.find((c) => c.name === "examples");
    expect(examples?.present).toBe(true);
  });

  test("mat.u1.complejos feedback está vinculado (exercises con error tags activan linkage)", () => {
    const components = getSkillComponents("mat.u1.complejos");
    const feedback = components.find((c) => c.name === "feedback");
    // Feedback mappings exist in JSON and are now activated by
    // exercise error-tag references (PR 3).
    expect(feedback?.present).toBe(true);
  });

  test("mat.u1.complejos está completamente ready", () => {
    const result = isSkillReady("mat.u1.complejos");
    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
  });
});

describe("pilot skill readiness integration", () => {
  test.each(PILOT_SKILL_IDS)(
    "%s has ≥4 exercises in catalog",
    (skillId) => {
      const exercises = queryBySkill(skillId);
      expect(exercises.length).toBeGreaterThanOrEqual(4);
    }
  );

  test.each(PILOT_SKILL_IDS)(
    "%s has theory content with ≥1 concept",
    (skillId) => {
      const nodes = loadTheoryContent("unit-1");
      const skillNode = nodes.find((n) => n.skillId === skillId);
      expect(skillNode).toBeDefined();
      expect(skillNode!.concepts.length).toBeGreaterThanOrEqual(1);
    }
  );

  test.each(PILOT_SKILL_IDS)(
    "%s has ≥2 worked examples",
    (skillId) => {
      const examples = loadExampleContent("unit-1");
      const skillExamples = examples.filter((e) => e.skillId === skillId);
      expect(skillExamples.length).toBeGreaterThanOrEqual(2);
    }
  );
});

describe("recommendation safety", () => {
  test("PILOT_SKILLS does not contain downstream not-ready skills", () => {
    // mat.u1.complejos is now a pilot skill (PR 1 add-complex-numbers-skill)
    const downstreamSkills = [
      "mat.u1.exponenciales",
    ];
    const pilotSkillIds = PILOT_SKILLS.map((s) => s.skillId);
    for (const downstream of downstreamSkills) {
      expect(pilotSkillIds).not.toContain(downstream);
    }
  });

  test("not-ready downstream skills are not recommended via readiness", () => {
    const downstreamSkills = [
      "mat.u1.exponenciales",
    ];
    for (const skillId of downstreamSkills) {
      const result = isSkillReady(skillId);
      expect(result.ready).toBe(false);
    }
  });
});
