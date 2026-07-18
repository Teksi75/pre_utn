/** Safety-net: loadCatalog baseline 226 (Pre-PR1 189 + U2 + U5-01 retirement + U5-02 +7 + U3LIN-PR1 +2 + U3LIN-PR2 +1). Unit-3=45. */
const BASELINE_TOTAL = 226;
const BASELINE_UNIT_1 = 101;
const BASELINE_UNIT_3 = 45;
const BASELINE_UNIT_5 = 7;
const BASELINE_CONJUNTOS_NUMERICOS = 44;
const BASELINE_U5_SKILL = 7;

import { describe, test, expect } from "vitest";
import { loadCatalog, queryBySkill, queryByUnit } from "../catalog/index";
import { loadExercisesForSkill } from "../catalog/content-loaders";

describe("catalog split equivalence — baseline snapshot", () => {
  test("loadCatalog returns exactly the baseline count (no leaked per-skill exercises)", () => {
    const catalog = loadCatalog();
    // Exact count catches regressions where per-skill exercises leak
    // from unit files into the composed catalog (e.g. 152 → 157).
    expect(catalog.length).toBe(BASELINE_TOTAL);
  });

  test("queryByUnit(1) returns exactly the baseline unit-1 count", () => {
    const results = queryByUnit(1);
    expect(results.length).toBe(BASELINE_UNIT_1);
  });

  test("queryByUnit(3) returns exactly the post-PR2 unit-3 count (new + legacy)", () => {
    const results = queryByUnit(3);
    expect(results.length).toBe(BASELINE_UNIT_3);
  });

  test("queryByUnit(5) returns exactly 7 U5-02 exercises (first live U5 packet)", () => {
    const results = queryByUnit(5);
    expect(results.length).toBe(BASELINE_UNIT_5);
  });

  test('queryBySkill("mat.u5.medicion_angulos_y_arcos") returns all 7 traced interactions', () => {
    const results = queryBySkill("mat.u5.medicion_angulos_y_arcos");
    expect(results.length).toBe(BASELINE_U5_SKILL);
  });

  test('dual-registration guard: content-loaders and catalog/index both expose U5', () => {
    // Per spec unit-5-foundation: "Wiring only one path leaves the skill
    // in an inconsistent state and MUST be guarded by an automated test
    // that loads both paths and asserts equal skill + exercise counts."
    const viaIndex = queryBySkill("mat.u5.medicion_angulos_y_arcos");
    const viaLoaders = loadExercisesForSkill("mat.u5.medicion_angulos_y_arcos");
    expect(viaIndex.length).toBe(viaLoaders.length);
    expect(viaIndex.length).toBe(BASELINE_U5_SKILL);
    const viaIndexIds = viaIndex.map((e) => e.id).sort();
    const viaLoadersIds = viaLoaders.map((e) => e.id).sort();
    expect(viaLoadersIds).toEqual(viaIndexIds);
  });

  test('queryBySkill("mat.u1.conjuntos_numericos") returns exactly the baseline count', () => {
    const results = queryBySkill("mat.u1.conjuntos_numericos");
    expect(results.length).toBe(BASELINE_CONJUNTOS_NUMERICOS);
  });

  test("loadCatalog returns exercises with unique IDs", () => {
    const catalog = loadCatalog();
    const ids = catalog.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("loadCatalog returns the same IDs on repeated calls (deterministic)", () => {
    const first = loadCatalog();
    const second = loadCatalog();
    expect(first.length).toBe(second.length);
    expect(first.map((e) => e.id)).toEqual(second.map((e) => e.id));
  });

  test("queryByUnit returns sorted results (difficulty then ID)", () => {
    const results = queryByUnit(1);
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const curr = results[i];
      if (prev.difficulty === curr.difficulty) {
        expect(curr.id.localeCompare(prev.id)).toBeGreaterThanOrEqual(0);
      } else {
        expect(curr.difficulty).toBeGreaterThanOrEqual(prev.difficulty);
      }
    }
  });

  test("queryBySkill returns consistent results across calls", () => {
    const first = queryBySkill("mat.u1.conjuntos_numericos");
    const second = queryBySkill("mat.u1.conjuntos_numericos");
    expect(first.length).toBe(second.length);
    expect(first.map((e) => e.id)).toEqual(second.map((e) => e.id));
  });
});
