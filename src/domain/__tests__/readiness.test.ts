import { describe, test, expect } from "vitest";
import { computeReadiness, type ReadinessComponent } from "../readiness/index";
import { getSkillComponents, isSkillReady } from "../catalog/readiness";

describe("computeReadiness", () => {
  const ALL_PRESENT: ReadinessComponent[] = [
    { name: "theory", present: true },
    { name: "examples", present: true },
    { name: "exercises", present: true },
    { name: "feedback", present: true },
    { name: "evaluation", present: true },
  ];

  describe("ready skill", () => {
    test("returns ready=true when all components present", () => {
      const result = computeReadiness("mat.u1.propiedades_operaciones_reales", ALL_PRESENT);
      expect(result.skillId).toBe("mat.u1.propiedades_operaciones_reales");
      expect(result.ready).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });

  describe("incomplete skill", () => {
    test("returns ready=false with missing theory", () => {
      const components = ALL_PRESENT.map((c) =>
        c.name === "theory" ? { ...c, present: false } : c
      );
      const result = computeReadiness("mat.u1.propiedades_operaciones_reales", components);
      expect(result.ready).toBe(false);
      expect(result.missing).toContain("theory");
    });

    test("returns ready=false with missing examples", () => {
      const components = ALL_PRESENT.map((c) =>
        c.name === "examples" ? { ...c, present: false } : c
      );
      const result = computeReadiness("mat.u1.propiedades_operaciones_reales", components);
      expect(result.ready).toBe(false);
      expect(result.missing).toContain("examples");
    });

    test("returns ready=false with missing exercises", () => {
      const components = ALL_PRESENT.map((c) =>
        c.name === "exercises" ? { ...c, present: false } : c
      );
      const result = computeReadiness("mat.u1.propiedades_operaciones_reales", components);
      expect(result.ready).toBe(false);
      expect(result.missing).toContain("exercises");
    });

    test("returns ready=false with missing feedback", () => {
      const components = ALL_PRESENT.map((c) =>
        c.name === "feedback" ? { ...c, present: false } : c
      );
      const result = computeReadiness("mat.u1.propiedades_operaciones_reales", components);
      expect(result.ready).toBe(false);
      expect(result.missing).toContain("feedback");
    });

    test("returns ready=false with missing evaluation", () => {
      const components = ALL_PRESENT.map((c) =>
        c.name === "evaluation" ? { ...c, present: false } : c
      );
      const result = computeReadiness("mat.u1.propiedades_operaciones_reales", components);
      expect(result.ready).toBe(false);
      expect(result.missing).toContain("evaluation");
    });

    test("returns all missing when multiple absent", () => {
      const components = ALL_PRESENT.map((c) =>
        c.name === "theory" || c.name === "examples"
          ? { ...c, present: false }
          : c
      );
      const result = computeReadiness("mat.u1.propiedades_operaciones_reales", components);
      expect(result.ready).toBe(false);
      expect(result.missing).toEqual(
        expect.arrayContaining(["theory", "examples"])
      );
      expect(result.missing).toHaveLength(2);
    });
  });

  describe("empty components", () => {
    test("returns ready=false with all components missing", () => {
      const result = computeReadiness("mat.u1.propiedades_operaciones_reales", []);
      expect(result.ready).toBe(false);
      expect(result.missing).toEqual(
        expect.arrayContaining(["theory", "examples", "exercises", "feedback", "evaluation"])
      );
    });
  });
});

describe("getSkillComponents — vacuous truth for empty commonErrorTags (PR 3 / implement-unit-3-mathematics)", () => {
  // Per spec U3-FB-RULE-001: exercises with empty `commonErrorTags` arrays
  // pass validation silently. This must propagate to readiness: a skill with
  // no declared error tags should NOT be flagged as missing feedback just
  // because no feedback mapping matches an empty tag set.
  //
  // Before this fix, getSkillComponents returned hasFeedback=false for any
  // skill whose exercises all had commonErrorTags=[], which made U3 skills
  // (which legitimately declare empty tag arrays in their first wave) appear
  // not-ready and gated `accessible` in accessibility.ts even when content
  // (theory + examples + exercises) was fully present.
  test("mat.u3.ecuaciones_lineales is contentReady when its exercises declare empty commonErrorTags", () => {
    const result = isSkillReady("mat.u3.ecuaciones_lineales");
    expect(result.ready).toBe(true);
    expect(result.missing).not.toContain("feedback");
  });

  test("feedback component is present=true for a skill whose exercises all have empty commonErrorTags", () => {
    const components = getSkillComponents("mat.u3.ecuaciones_lineales");
    const feedback = components.find((c) => c.name === "feedback");
    expect(feedback?.present).toBe(true);
  });

  test("feedback component is present=true for a U3 skill whose populated tags have matching feedback mappings", () => {
    // mat.u3.recta exercises declare at least one populated u3_* tag that
    // IS mapped in the feedback library. This test verifies the positive
    // path: when tags exist AND are covered, feedback is present. The
    // negative path (tags exist but none are mapped) is not currently
    // exercised by any U3 production content because the U3 feedback
    // library covers all 8 u3_* tags declared in production exercises.
    const components = getSkillComponents("mat.u3.recta");
    const feedback = components.find((c) => c.name === "feedback");
    expect(feedback?.present).toBe(true);
  });

  test("u3.inecuaciones_lineales is contentReady (already worked pre-fix because it has populated tag)", () => {
    const result = isSkillReady("mat.u3.inecuaciones_lineales");
    expect(result.ready).toBe(true);
    expect(result.missing).not.toContain("feedback");
  });

  test("every U3 pilot skill is contentReady=true after the vacuous-truth fix", () => {
    const U3_IDS = [
      "mat.u3.ecuaciones_lineales",
      "mat.u3.ecuaciones_cuadraticas",
      "mat.u3.inecuaciones_lineales",
      "mat.u3.inecuaciones_valor_absoluto",
      "mat.u3.recta",
      "mat.u3.sistemas",
      "mat.u3.exponenciales",
      "mat.u3.logaritmicas",
    ] as const;
    for (const id of U3_IDS) {
      const result = isSkillReady(id);
      expect(result.ready, `${id} expected contentReady=true, missing=${result.missing.join(",")}`).toBe(true);
    }
  });
});
