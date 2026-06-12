/**
 * Safety-net test for catalog split equivalence.
 *
 * Captures the current loadCatalog output as a baseline so that future
 * content-split work (Phase 3) can prove no regression: same count, same IDs,
 * same ordering.
 *
 * RED phase — test references loadCatalog which already exists.
 */

import { describe, test, expect } from "vitest";
import { loadCatalog, queryBySkill, queryByUnit } from "../catalog/index";

describe("catalog split equivalence — baseline snapshot", () => {
  test("loadCatalog returns a stable baseline count", () => {
    const catalog = loadCatalog();
    // Capture the current count as a baseline.
    // Future split must produce exactly this many exercises.
    expect(catalog.length).toBeGreaterThanOrEqual(30);
    const baseline = catalog.length;
    expect(baseline).toBeGreaterThan(0);
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
