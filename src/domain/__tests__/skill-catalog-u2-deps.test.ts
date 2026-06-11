import { describe, test, expect } from "vitest";
import { SKILL_DEPENDENCIES, ALL_SKILLS } from "../models/skill-catalog";
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
