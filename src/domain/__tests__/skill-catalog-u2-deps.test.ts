import { describe, test, expect } from "vitest";
import { SKILL_DEPENDENCIES, ALL_SKILLS, UNIT_2_SKILLS } from "../models/skill-catalog";
import type { SkillDependency } from "../models/skill-catalog";

/** Resolve prerequisites for a given skillId. */
function prereqsOf(skillId: string): readonly string[] {
  const dep = SKILL_DEPENDENCIES.find((d) => d.skillId === skillId);
  return dep?.prerequisites ?? [];
}

/** Check if a skill can reach another skill via transitive prerequisites. */
function canReach(from: string, to: string): boolean {
  const direct = prereqsOf(from);
  if (direct.includes(to)) return true;
  for (const prereq of direct) {
    if (canReach(prereq, to)) return true;
  }
  return false;
}

describe("U2 skill dependencies", () => {
  describe("U2-SKILL-001: gauss ← ruffini_resto", () => {
    test("gauss depends on ruffini_resto", () => {
      const prereqs = prereqsOf("mat.u2.gauss");
      expect(prereqs).toContain("mat.u2.ruffini_resto");
    });

    test("gauss transitively depends on ruffini_resto prerequisites", () => {
      // ruffini_resto depends on operaciones_polinomios, which depends on polinomios_basico
      expect(canReach("mat.u2.gauss", "mat.u2.operaciones_polinomios")).toBe(true);
      expect(canReach("mat.u2.gauss", "mat.u2.polinomios_basico")).toBe(true);
    });
  });

  describe("U2-SKILL-002: mcm_mcd ← factorizacion", () => {
    test("mcm_mcd_polinomios depends on factorizacion", () => {
      const prereqs = prereqsOf("mat.u2.mcm_mcd_polinomios");
      expect(prereqs).toContain("mat.u2.factorizacion");
    });
  });

  describe("No cycles in U2 dependency graph", () => {
    test("gauss does not depend on itself transitively", () => {
      expect(canReach("mat.u2.gauss", "mat.u2.gauss")).toBe(false);
    });

    test("mcm_mcd_polinomios does not create a cycle", () => {
      expect(canReach("mat.u2.mcm_mcd_polinomios", "mat.u2.mcm_mcd_polinomios")).toBe(false);
    });
  });

  describe("U2FAC-SKILL: factorizacion ← ruffini_resto", () => {
    test("factorizacion depends on ruffini_resto", () => {
      const prereqs = prereqsOf("mat.u2.factorizacion");
      expect(prereqs).toContain("mat.u2.ruffini_resto");
    });

    test("factorizacion also depends on operaciones_polinomios", () => {
      const prereqs = prereqsOf("mat.u2.factorizacion");
      expect(prereqs).toContain("mat.u2.operaciones_polinomios");
    });

    test("factorizacion transitively depends on polinomios_basico", () => {
      expect(canReach("mat.u2.factorizacion", "mat.u2.polinomios_basico")).toBe(true);
    });

    test("factorizacion has no cycles in dependency graph", () => {
      expect(canReach("mat.u2.factorizacion", "mat.u2.factorizacion")).toBe(false);
    });

    test("cadena factorizacion es mat.u2.factorizacion ← ruffini_resto ← operaciones_polinomios ← polinomios_basico", () => {
      // ruffini_resto is direct prereq of factorizacion
      expect(prereqsOf("mat.u2.factorizacion")).toContain("mat.u2.ruffini_resto");
      // operaciones_polinomios is direct prereq of ruffini_resto
      expect(prereqsOf("mat.u2.ruffini_resto")).toContain("mat.u2.operaciones_polinomios");
      // polinomios_basico is direct prereq of operaciones_polinomios
      expect(prereqsOf("mat.u2.operaciones_polinomios")).toContain("mat.u2.polinomios_basico");
    });
  });

  describe("Skills outside U2 slice are declared but not yet ready", () => {
    test("gauss is in ALL_SKILLS", () => {
      expect(ALL_SKILLS).toContain("mat.u2.gauss");
    });

    test("mcm_mcd_polinomios is in ALL_SKILLS", () => {
      expect(ALL_SKILLS).toContain("mat.u2.mcm_mcd_polinomios");
    });

    test("factorizacion is in ALL_SKILLS", () => {
      expect(ALL_SKILLS).toContain("mat.u2.factorizacion");
    });
  });

  describe("Dependency chain linearity", () => {
    test("U2 intra-unit chain: polinomios_basico → operaciones_polinomios → ruffini_resto → factorizacion → gauss", () => {
      expect(prereqsOf("mat.u2.operaciones_polinomios")).toContain("mat.u2.polinomios_basico");
      expect(prereqsOf("mat.u2.ruffini_resto")).toContain("mat.u2.operaciones_polinomios");
      expect(prereqsOf("mat.u2.factorizacion")).toContain("mat.u2.ruffini_resto");
      expect(prereqsOf("mat.u2.gauss")).toContain("mat.u2.ruffini_resto");
    });
  });

  describe("U2-SKILL-003: ecuaciones_fraccionarias ← mcm_mcd_polinomios", () => {
    test("ecuaciones_fraccionarias depends on mcm_mcd_polinomios", () => {
      const prereqs = prereqsOf("mat.u2.ecuaciones_fraccionarias");
      expect(prereqs).toContain("mat.u2.mcm_mcd_polinomios");
    });

    test("ecuaciones_fraccionarias also depends on factorizacion", () => {
      const prereqs = prereqsOf("mat.u2.ecuaciones_fraccionarias");
      expect(prereqs).toContain("mat.u2.factorizacion");
    });

    test("ecuaciones_fraccionarias transitively depends on ruffini_resto", () => {
      expect(canReach("mat.u2.ecuaciones_fraccionarias", "mat.u2.ruffini_resto")).toBe(true);
    });
  });
});

/**
 * PR 8 task 8.3 — No-new-U2-skill guard. The align-u2-practice-official-
 * exercises change (PR 1-7) deliberately kept U2 at exactly 7 skills; the
 * PR 7 family split (rational-expression vs fractional-equation) is
 * captured via the `category` field on individual exercises — NOT via
 * splitting `mat.u2.ecuaciones_fraccionarias` into two skills. If a
 * future change introduces a new U2 skill (e.g. `mat.u2.expresiones_
 * racionales`), this guard catches it.
 */
describe("U2 skill catalog — no-new-skill guard", () => {
  test("UNIT_2_SKILLS contains exactly the 7 declared skills (no new skill can be added without PR review)", () => {
    expect(UNIT_2_SKILLS.length).toBe(7);
  });

  test("UNIT_2_SKILLS is the canonical 7-skill set (set equality, order-stable)", () => {
    const expected = [
      "mat.u2.polinomios_basico",
      "mat.u2.operaciones_polinomios",
      "mat.u2.ruffini_resto",
      "mat.u2.factorizacion",
      "mat.u2.gauss",
      "mat.u2.mcm_mcd_polinomios",
      "mat.u2.ecuaciones_fraccionarias",
    ] as const;
    expect(UNIT_2_SKILLS).toEqual([...expected]);
  });

  test("rational-expression and fractional-equation families do NOT split into separate skills", () => {
    // The PR 7 family split lives in the `category` field, not in
    // distinct skills. The two families share the same prerequisite
    // chain (factorizacion + mcm_mcd_polinomios). Guard against a
    // future PR splitting them into distinct skills.
    expect(ALL_SKILLS).not.toContain("mat.u2.expresiones_racionales");
    expect(ALL_SKILLS).not.toContain("mat.u2.rational_expressions");
    expect(ALL_SKILLS).not.toContain("mat.u2.fractional_equations");
  });

  test("no U2 skill has been silently added beyond the declared 7 (full U2 namespace audit)", () => {
    // Every U2 skill in ALL_SKILLS MUST already be in UNIT_2_SKILLS.
    // A new skill would have to land in both; the guard ensures drift
    // in either surface is caught.
    const declaredSet = new Set(UNIT_2_SKILLS);
    const u2SkillsInAll = ALL_SKILLS.filter((id) => id.startsWith("mat.u2."));
    for (const id of u2SkillsInAll) {
      expect(declaredSet.has(id), `${id} is in ALL_SKILLS but missing from UNIT_2_SKILLS`).toBe(true);
    }
    expect(u2SkillsInAll.length).toBe(7);
  });
});
