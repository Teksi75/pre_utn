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
 *   -5 U5-01 static retirement (ex.u5.angulos.1, ex.u5.radianes.1,
 *     ex.u5.circunferencia_trigonometrica.1, ex.u5.identidades.1,
 *     ex.u5.ecuaciones_trigonometricas.1) = 216
 *   +7 U5-02 first live Unit 5 packet (medicion_angulos_y_arcos:
 *     1a, 1b, 1c, 1d, 2r, 2d, 3) = 223
 *
 * Baseline values (current — post-PR7 + post-U5-01 retirement + U5-02):
 *   loadCatalog().length = 223
 *   queryByUnit(1).length = 101
 *   queryByUnit(3).length = 42
 *   queryByUnit(5).length = 7
 *   queryBySkill("mat.u1.conjuntos_numericos").length = 44
 *   queryBySkill("mat.u5.medicion_angulos_y_arcos").length = 7
 */

/** Pre-PR1 baseline + U2-aligned + U5-01 retirement + U5-02 (+7). */
const BASELINE_TOTAL = 223;
const BASELINE_UNIT_1 = 101;
const BASELINE_UNIT_3 = 42;
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
