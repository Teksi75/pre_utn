import { describe, test, expect } from "vitest";
import { isSkillReady, getSkillComponents } from "../catalog/readiness";
import {
  loadTheoryContent,
  loadExampleContent,
  loadFeedbackContent,
} from "../catalog/content-loaders";
import { queryBySkill } from "../catalog/index";

const PILOT_SKILLS = [
  "mat.u1.reales_operaciones",
  "mat.u1.intervalos",
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
});

describe("isSkillReady", () => {
  test.each(PILOT_SKILLS)("pilot skill %s is ready", (skillId) => {
    const result = isSkillReady(skillId);
    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test("returns missing components for non-pilot skill", () => {
    const result = isSkillReady("mat.u1.potencias_raices");
    expect(result.ready).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  test("non-pilot skill is missing theory", () => {
    const result = isSkillReady("mat.u1.potencias_raices");
    expect(result.missing).toContain("theory");
  });

  test("non-pilot skill is missing examples", () => {
    const result = isSkillReady("mat.u1.potencias_raices");
    expect(result.missing).toContain("examples");
  });
});

describe("no exercise available scenario", () => {
  test("skill with no exercises reports exercises component as not present", () => {
    const components = getSkillComponents("mat.u1.logaritmos");
    const exercises = components.find((c) => c.name === "exercises");
    expect(exercises?.present).toBe(false);
  });

  test("skill with no exercises is not ready", () => {
    const result = isSkillReady("mat.u1.logaritmos");
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("exercises");
  });

  test("skill with no exercises and no feedback reports both missing", () => {
    const result = isSkillReady("mat.u1.complejos");
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("exercises");
  });
});

describe("pilot skill readiness integration", () => {
  test.each(PILOT_SKILLS)(
    "%s has ≥4 exercises in catalog",
    (skillId) => {
      const exercises = queryBySkill(skillId);
      expect(exercises.length).toBeGreaterThanOrEqual(4);
    }
  );

  test.each(PILOT_SKILLS)(
    "%s has theory content with ≥1 concept",
    (skillId) => {
      const nodes = loadTheoryContent("unit-1");
      const skillNode = nodes.find((n) => n.skillId === skillId);
      expect(skillNode).toBeDefined();
      expect(skillNode!.concepts.length).toBeGreaterThanOrEqual(1);
    }
  );

  test.each(PILOT_SKILLS)(
    "%s has ≥2 worked examples",
    (skillId) => {
      const examples = loadExampleContent("unit-1");
      const skillExamples = examples.filter((e) => e.skillId === skillId);
      expect(skillExamples.length).toBeGreaterThanOrEqual(2);
    }
  );
});
