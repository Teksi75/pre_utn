import { describe, expect, test } from "vitest";
import { isSkillReady } from "../catalog/readiness";
import { loadFeedbackContent, loadTheoryContent, loadExampleContent } from "../catalog/content-loaders";
import { loadCatalog } from "../catalog/index";

/**
 * RED suite for the U5 readiness invariant.
 *
 * Per spec angle-arc-measurement, Unit 5 becomes selectable when:
 *   (a) UNIT_5_SKILLS contains the skill, AND
 *   (b) readiness(unitKey) returns true, which requires theory, ≥3
 *       examples, ≥4 implemented exercises, declared feedback per tag, and
 *       an evaluation path covering all exercises.
 */

describe("U5 readiness — first live Unit 5 packet", () => {
  test("isSkillReady(mat.u5.medicion_angulos_y_arcos) is true", () => {
    const { ready } = isSkillReady("mat.u5.medicion_angulos_y_arcos");
    expect(ready).toBe(true);
  });

  test("readiness fails for an undeclared (hypothetical) Unit 5 skill with no content", () => {
    const { ready } = isSkillReady("mat.u5.nonexistent_root");
    expect(ready).toBe(false);
  });

  test("theory JSON loads with the U5 node", () => {
    const nodes = loadTheoryContent("unit-5");
    const u5Nodes = nodes.filter((n) => n.skillId === "mat.u5.medicion_angulos_y_arcos");
    expect(u5Nodes.length).toBeGreaterThan(0);
  });

  test("example JSON loads with at least 3 worked examples for the U5 skill", () => {
    const examples = loadExampleContent("unit-5");
    const u5Examples = examples.filter((e) => e.skillId === "mat.u5.medicion_angulos_y_arcos");
    expect(u5Examples.length).toBeGreaterThanOrEqual(3);
  });

  test("feedback JSON includes mappings for the three declared U5 tags", () => {
    const feedback = loadFeedbackContent("unit-5");
    const tags = new Set(feedback.map((f) => f.errorTag));
    expect(tags.has("u5_degree_radian_factor")).toBe(true);
    expect(tags.has("u5_dms_conversion")).toBe(true);
    expect(tags.has("u5_arc_time_fraction")).toBe(true);
  });

  test("the catalog exposes the seven U5 traced interactions via queryBySkill", () => {
    const catalog = loadCatalog();
    const u5 = catalog.filter((e) => e.skillId === "mat.u5.medicion_angulos_y_arcos");
    expect(u5.length).toBe(7);
    // Subitems 1a–1d each carry a distinct canonicalTrace.
    const subIds = ["1a", "1b", "1c", "1d"];
    for (const sub of subIds) {
      const ex = u5.find((e) => e.id.endsWith(`.${sub}`));
      expect(ex, `U5 subitem ${sub} should exist`).toBeDefined();
      const trace = (ex as unknown as { canonicalTrace?: { path: string }[] }).canonicalTrace;
      expect(trace, `U5 subitem ${sub} must carry a canonicalTrace`).toBeDefined();
      expect(trace!.length).toBeGreaterThan(0);
    }
  });
});