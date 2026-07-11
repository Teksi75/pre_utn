/**
 * Safety-net test for catalog split equivalence.
 *
 * Captures the pre-split loadCatalog output as a baseline so that
 * content-split work (Phase 3) can prove no regression: same count, same IDs,
 * same ordering. Exact baseline assertions catch regressions that weak
 * thresholds (>= 30) would miss.
 *
* Baseline values updated through the align-u2-practice-official-exercises change:
 *   post-PR1 baseline (184 + 5 unit-3 translation exercises) = 189
 *   +4 PR 3 polinomios_basico aligned exercises (02_ej_utn_1..5, slot .6-.9) = 193
 *   +6 PR 4 operaciones_polinomios aligned exercises (02_ej_utn_7 long div,
 *     02_ej_utn_9 productos notables, slots .6-.11) = 199
 *   +10 PR 5 factorizacion aligned exercises (02_ej_utn_10_* covering all 7 cases,
 *     slots .5-.14) = 209
 *   +4 PR 6 ruffini_resto + mcm_mcd_polinomios aligned exercises
 *     (02_ej_utn_8 Ruffini cociente .6-.7 + 02_ej_utn_11 3-poly/param .5-.6) = 213
 *   +8 PR 7 expresiones_racionales + ecuaciones_fraccionarias aligned exercises
 *     (02_ej_utn_12a + 12c + 13a + 14a rational-expression .5-.8
 *      + 02_ej_utn_15a + 15b + 15c + 15g fractional-equation .9-.12) = 221
 *
 * Baseline values (current — post-S5 P9 sign-chart content):
 *   loadCatalog().length = 239        (233 + 6 S5 P9 base exercises)
 *   queryByUnit(1).length = 101
 *   queryByUnit(3).length = 60        (54 + 6 S5 P9 .2-.7 exercises)
 *   queryBySkill("mat.u1.conjuntos_numericos").length = 44
 */

/** Pre-PR1 baseline counts, incremented by PR 3 (+4), PR 4 (+6), PR 5 (+10), PR 6 (+4), PR 7 (+8), S1a (+1), S1b (+3), S3 (+8), S5 (+6), S6 (+4). */
const BASELINE_TOTAL = 243;
const BASELINE_UNIT_1 = 101;
const BASELINE_UNIT_3 = 64;
const BASELINE_CONJUNTOS_NUMERICOS = 44;

import { describe, test, expect } from "vitest";
import { loadCatalog, queryBySkill, queryByUnit } from "../catalog/index";

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

  // ---------------------------------------------------------------------------
  // GGA BLOCKER FIX — domain purity: no module-level mutable cache
  // ---------------------------------------------------------------------------
  //
  // The previous `getComposedExercises()` cached its result in a module-level
  // mutable (`let _composedExercises`). AGENTS.md requires `src/domain/` to be
  // free of side effects, so the cache was removed. These tests pin the
  // post-fix contract: catalog queries are deterministic and equivalent
  // across repeated calls under the same module state — behavior preserved,
  // cache gone.

  describe("domain purity — no module-level mutable cache", () => {
    test("loadCatalog returns equivalent content across many repeated calls", () => {
      const ids: readonly string[] = loadCatalog().map((e) => e.id);
      for (let i = 0; i < 5; i++) {
        const again = loadCatalog();
        expect(again.length).toBe(ids.length);
        expect(again.map((e) => e.id)).toEqual(ids);
      }
    });

    test("loadCatalog returns independent arrays — no shared module-level cache", () => {
      // GGA BLOCKER FIX contract: there is no module-level mutable cache in
      // src/domain/catalog/index.ts. loadCatalog builds a fresh array via
      // `[...validated]`. Mutating one result must not affect any other call.
      const first = loadCatalog();
      const firstLength = first.length;
      const firstFirstId = first[0]?.id;

      // Mutate the first result in place. If a module-level cache shared
      // a reference to this array, subsequent reads would observe the mutation.
      first.length = 0;
      first.push({} as (typeof first)[number]);

      const second = loadCatalog();
      expect(second.length).toBe(firstLength);
      expect(second[0]?.id).toBe(firstFirstId);
    });

    test("queryByUnit returns equivalent results across many repeated calls", () => {
      const unit1 = queryByUnit(1).map((e) => e.id);
      for (let i = 0; i < 5; i++) {
        expect(queryByUnit(1).map((e) => e.id)).toEqual(unit1);
      }
    });
  });
});
