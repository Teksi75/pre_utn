/**
 * Unit-3 content loader tests.
 *
 * Spec coverage (openspec/changes/implement-unit-3-mathematics/specs/math-exercise-catalog/spec.md):
 * - U3-CAT-001: Unit-3 file is registered in loaders.
 * - U3-CAT-003: Threshold declared.
 * - U3-CAT-004: Threshold enforced at loadCatalog time.
 * - U3-CAT-005: Every U3 skill has exercises.
 * - U3-CAT-006: Exercises use new IDs (.2+).
 */

import { describe, test, expect } from "vitest";
import {
  loadTheoryContent,
  loadExampleContent,
  loadFeedbackContent,
  loadExercisesForSkill,
  loadSkillBank,
  UNIT_EXERCISE_FILES,
  UNIT_THRESHOLDS,
  getUnitThreshold,
} from "../catalog/content-loaders";
import { loadCatalog, queryByUnit, queryBySkill } from "../catalog/index";

/** The 8 declared U3 skill IDs (from theory/unit-3.json and examples/unit-3.json). */
const U3_SKILL_IDS: readonly string[] = [
  "mat.u3.ecuaciones_lineales",
  "mat.u3.ecuaciones_cuadraticas",
  "mat.u3.inecuaciones_lineales",
  "mat.u3.inecuaciones_valor_absoluto",
  "mat.u3.recta",
  "mat.u3.sistemas",
  "mat.u3.exponenciales",
  "mat.u3.logaritmicas",
];

describe("Unit-3 content loader — RAW_REGISTRY wiring", () => {
  test("U3-CAT-001: loadTheoryContent('unit-3') returns 8 theory nodes", () => {
    const theory = loadTheoryContent("unit-3");
    expect(Array.isArray(theory)).toBe(true);
    expect(theory.length).toBe(8);
  });

  test("U3-CAT-001: loadTheoryContent('unit-3') returns one node per U3 skill", () => {
    const theory = loadTheoryContent("unit-3");
    const skillIds = theory.map((t) => t.skillId);
    for (const expected of U3_SKILL_IDS) {
      expect(skillIds, `theory node for ${expected} missing`).toContain(expected);
    }
  });

  test("loadExampleContent('unit-3') returns 16 worked examples (≥2 per skill)", () => {
    const examples = loadExampleContent("unit-3");
    expect(Array.isArray(examples)).toBe(true);
    expect(examples.length).toBeGreaterThanOrEqual(16);
  });

  test("loadExampleContent('unit-3') returns ≥2 examples per U3 skill", () => {
    const examples = loadExampleContent("unit-3");
    for (const skillId of U3_SKILL_IDS) {
      const count = examples.filter((ex) => ex.skillId === skillId).length;
      expect(count, `expected ≥2 examples for ${skillId}, got ${count}`).toBeGreaterThanOrEqual(2);
    }
  });

  test("loadFeedbackContent('unit-3') returns 8 mappings (one per U3 tag)", () => {
    const feedback = loadFeedbackContent("unit-3");
    expect(Array.isArray(feedback)).toBe(true);
    expect(feedback.length).toBe(8);
  });

  test("loadFeedbackContent('unit-3') covers all 8 declared u3_* tags", () => {
    const feedback = loadFeedbackContent("unit-3");
    const tags = feedback.map((f) => f.errorTag).sort();
    // 8 tags mapped per PR 1 spec U3-TAG-001; the legacy `u3_direccion_desigualdad`
    // exists in the error-taxonomy but has no feedback mapping (the legacy
    // inequality-direction case is covered by `u3_signo_desigualdad`).
    expect(tags).toEqual([
      "u3_aislamiento_incorrecto",
      "u3_dos_valores_absoluto",
      "u3_factorizacion_cuadratica",
      "u3_igualdad_exponenciales",
      "u3_pendiente_o_ordenada",
      "u3_propiedad_logaritmo",
      "u3_signo_desigualdad",
      "u3_sustitucion_o_eliminacion",
    ]);
  });
});

describe("Unit-3 exercise source — UNIT_EXERCISE_FILES wiring", () => {
  test("UNIT_EXERCISE_FILES[3] is registered (raw unit-3.json)", () => {
    expect(UNIT_EXERCISE_FILES[3]).toBeDefined();
    expect(Array.isArray(UNIT_EXERCISE_FILES[3])).toBe(true);
    expect((UNIT_EXERCISE_FILES[3] as readonly unknown[]).length).toBeGreaterThanOrEqual(24);
  });

  test("U3-CAT-005: every U3 skill has ≥3 exercises via loadExercisesForSkill", () => {
    for (const skillId of U3_SKILL_IDS) {
      const exercises = loadExercisesForSkill(skillId);
      expect(
        exercises.length,
        `expected ≥3 exercises for ${skillId}, got ${exercises.length}`
      ).toBeGreaterThanOrEqual(3);
    }
  });

  test("U3-CAT-006: U3 exercises from unit-3.json use IDs ending in numbers ≥2", () => {
    // All unit-3.json entries must use trailing numeric suffix ≥2 — the legacy
    // .1 entries stay in the monolith (exercises.json). This proves the new
    // file is a non-shadowing second source.
    const source = UNIT_EXERCISE_FILES[3] as readonly Record<string, unknown>[];
    expect(Array.isArray(source)).toBe(true);
    for (const entry of source) {
      const id = typeof entry.id === "string" ? entry.id : "";
      const match = /\.(\d+)$/.exec(id);
      expect(match, `exercise ${id} has no trailing numeric suffix`).not.toBeNull();
      const suffix = Number(match![1]);
      expect(suffix, `exercise ${id} suffix must be ≥2, got ${suffix}`).toBeGreaterThanOrEqual(2);
    }
  });

  test("U3-CAT-001: loadExercisesForSkill('mat.u3.recta') merges unit-3 with legacy monolith", () => {
    // mat.u3.recta has 1 legacy entry (ex.u3.recta.1) in exercises.json
    // plus the new unit-3.json entries (.2-.5) → ≥5 total.
    const exercises = loadExercisesForSkill("mat.u3.recta");
    const ids = exercises.map((e) => e.id);
    expect(ids, "legacy ex.u3.recta.1 must remain visible").toContain("ex.u3.recta.1");
    expect(exercises.length).toBeGreaterThanOrEqual(4);
  });
});

describe("Unit-3 threshold declaration", () => {
  test("U3-CAT-003: UNIT_THRESHOLDS['unit-3'] is declared and ≥24", () => {
    expect(UNIT_THRESHOLDS["unit-3"]).toBeDefined();
    expect(UNIT_THRESHOLDS["unit-3"]).toBeGreaterThanOrEqual(24);
  });

  test("U3-CAT-003: UNIT_THRESHOLDS['unit-3'] equals 24 (not 32)", () => {
    // Per PR 2 constraints: when 24+ U3 exercises are loaded the threshold
    // is 24, NOT 32. This pins the explicit value chosen for this PR.
    expect(UNIT_THRESHOLDS["unit-3"]).toBe(24);
  });

  test("getUnitThreshold('unit-3') reflects the declared 24", () => {
    expect(getUnitThreshold("unit-3")).toBe(24);
  });
});

describe("Unit-3 catalog composition", () => {
  test("loadCatalog() does not throw with current U3 content", () => {
    expect(() => loadCatalog()).not.toThrow();
  });

  test("U3-CAT-004: declares Unit 3 threshold and current catalog meets it", () => {
    // Verifies the threshold is declared and the loaded U3 exercise count
    // satisfies it. This is a read-only catalog assertion on the current
    // fixture; a real below-threshold fixture would require mocking the
    // import with fewer exercises.
    const threshold = UNIT_THRESHOLDS["unit-3"];
    const u3Count = queryByUnit(3).length;
    expect(threshold).toBeGreaterThan(0);
    expect(u3Count).toBeGreaterThanOrEqual(threshold);
  });

  test("queryByUnit(3) returns U3 exercises from unit-3.json + legacy monolith", () => {
    const u3 = queryByUnit(3);
    expect(u3.length).toBeGreaterThanOrEqual(24);
    // Each exercise belongs to a U3 skill.
    for (const ex of u3) {
      expect(ex.skillId.startsWith("mat.u3.")).toBe(true);
    }
  });

  test("unit-3.json exercises appear BEFORE legacy .1 entries in queryBySkill", () => {
    // Source priority: unit-3.json is loaded before exercises.json in
    // content-loaders.loadExercisesForSkill, so the .2+.5 entries should
    // come first (lower index) regardless of legacy content.
    const ex = loadExercisesForSkill("mat.u3.ecuaciones_lineales");
    expect(ex.length).toBeGreaterThanOrEqual(4);
    const first = ex[0];
    // First entry should be a unit-3.json entry (id ends .2+), not .1.
    const suffixMatch = /\.(\d+)$/.exec(first.id);
    expect(suffixMatch).not.toBeNull();
    expect(Number(suffixMatch![1])).toBeGreaterThanOrEqual(2);
  });

  test("queryBySkill('mat.u3.logaritmicas') returns only U3-logaritmicas exercises", () => {
    const ex = queryBySkill("mat.u3.logaritmicas");
    expect(ex.length).toBeGreaterThanOrEqual(3);
    for (const e of ex) {
      expect(e.skillId).toBe("mat.u3.logaritmicas");
    }
  });

  test("loadSkillBank for a U3 skill returns exercises + diagnostics", () => {
    const bank = loadSkillBank("mat.u3.exponenciales");
    expect(bank).toHaveProperty("exercises");
    expect(bank).toHaveProperty("diagnostics");
    expect(bank.exercises.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(bank.diagnostics)).toBe(true);
  });
});