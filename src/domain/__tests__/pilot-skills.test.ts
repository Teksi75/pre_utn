import { describe, expect, test } from "vitest";
import {
  PILOT_SKILLS,
  PILOT_SKILL_UNIT_MAP,
} from "../catalog/pilot-skills";
import { SKILL_DEPENDENCIES } from "../models/skill-catalog";

describe("PILOT_SKILLS", () => {
  test("contains 24 pilot skills (8 unit-1 + 7 unit-2 + 9 unit-3)", () => {
    expect(PILOT_SKILLS).toHaveLength(24);
  });

  test("contains the 8 unit-1 pilot skills", () => {
    const u1 = PILOT_SKILLS.filter((s) => s.unitKey === "unit-1");
    expect(u1).toHaveLength(8);
    for (const skill of u1) {
      expect(skill.unitKey).toBe("unit-1");
    }
  });

  test("includes mat.u1.propiedades_operaciones_reales (renamed from reales_operaciones)", () => {
    const ids = PILOT_SKILLS.map((s) => s.skillId);
    expect(ids).toContain("mat.u1.propiedades_operaciones_reales");
  });

  test("uses the canonical PDF label (cap. 13 'Propiedades Operaciones de Numeros reales')", () => {
    const propOp = PILOT_SKILLS.find(
      (s) => s.skillId === "mat.u1.propiedades_operaciones_reales"
    );
    expect(propOp).toBeDefined();
    expect(propOp?.label).toBe("Propiedades Operaciones de Números reales");
  });
});

describe("PILOT_SKILLS — Unit 2", () => {
  const U2_SKILL_IDS = [
    "mat.u2.polinomios_basico",
    "mat.u2.operaciones_polinomios",
    "mat.u2.ruffini_resto",
    "mat.u2.factorizacion",
    "mat.u2.gauss",
    "mat.u2.mcm_mcd_polinomios",
    "mat.u2.ecuaciones_fraccionarias",
  ] as const;

  test("contains all 7 unit-2 pilot skills", () => {
    const u2 = PILOT_SKILLS.filter((s) => s.unitKey === "unit-2");
    expect(u2).toHaveLength(7);
    const u2Ids = u2.map((s) => s.skillId);
    for (const id of U2_SKILL_IDS) {
      expect(u2Ids).toContain(id);
    }
  });

  test("every unit-2 skill has unitKey 'unit-2'", () => {
    for (const id of U2_SKILL_IDS) {
      expect(PILOT_SKILL_UNIT_MAP[id]).toBe("unit-2");
    }
  });

  test("unit-2 skills appear after unit-1 skills in catalog order", () => {
    const lastU1Index = PILOT_SKILLS.findLastIndex((s) => s.unitKey === "unit-1");
    const firstU2Index = PILOT_SKILLS.findIndex((s) => s.unitKey === "unit-2");
    expect(firstU2Index).toBeGreaterThan(lastU1Index);
  });

  test("polinomios_basico is the first unit-2 skill (no prerequisites within U2)", () => {
    const u2 = PILOT_SKILLS.filter((s) => s.unitKey === "unit-2");
    expect(u2[0].skillId).toBe("mat.u2.polinomios_basico");
  });
});

describe("PILOT_SKILL_UNIT_MAP", () => {
  test("maps every pilot skill to its unit key", () => {
    for (const skill of PILOT_SKILLS) {
      expect(PILOT_SKILL_UNIT_MAP[skill.skillId]).toBe(skill.unitKey);
    }
  });

  test("returns undefined for unknown skills (tolerant of URL params)", () => {
    expect(PILOT_SKILL_UNIT_MAP["mat.u99.nonexistent"]).toBeUndefined();
  });
});

describe("PILOT_SKILLS — Unit 3 (PR 3 / implement-unit-3-mathematics)", () => {
  const U3_SKILL_IDS = [
    "mat.u3.ecuaciones_lineales",
    "mat.u3.ecuaciones_cuadraticas",
    "mat.u3.inecuaciones_lineales",
    "mat.u3.inecuaciones_valor_absoluto",
    "mat.u3.recta",
    "mat.u3.sistemas",
    "mat.u3.exponenciales",
    "mat.u3.logaritmicas",
    "mat.u3.traduccion_lenguaje_verbal",
  ] as const;

  test("contains all 9 unit-3 pilot skills (U3-PILOT-001)", () => {
    const u3 = PILOT_SKILLS.filter((s) => s.unitKey === "unit-3");
    expect(u3).toHaveLength(9);
    const u3Ids = u3.map((s) => s.skillId);
    for (const id of U3_SKILL_IDS) {
      expect(u3Ids).toContain(id);
    }
  });

  test("no non-U3 entry is registered with unitKey 'unit-3' (U3-PILOT-001 strict)", () => {
    const u3 = PILOT_SKILLS.filter((s) => s.unitKey === "unit-3");
    const u3Ids = new Set(u3.map((s) => s.skillId));
    for (const id of u3Ids) {
      expect(U3_SKILL_IDS).toContain(id);
    }
  });

  test("every unit-3 skill has unitKey 'unit-3'", () => {
    for (const id of U3_SKILL_IDS) {
      expect(PILOT_SKILL_UNIT_MAP[id]).toBe("unit-3");
    }
  });

  test("U3-PILOT-002: PILOT_SKILL_UNIT_MAP['mat.u3.recta'] === 'unit-3'", () => {
    expect(PILOT_SKILL_UNIT_MAP["mat.u3.recta"]).toBe("unit-3");
  });

  test("U3-MOD-PR1: PILOT_SKILL_UNIT_MAP['mat.u3.traduccion_lenguaje_verbal'] === 'unit-3'", () => {
    // PR 1 of the fortalecer-u3-lenguaje-modelizacion-transferencia change
    // introduces the modeling leaf skill. It must be selectable from
    // /practice with the same unitKey as the other U3 skills.
    expect(PILOT_SKILL_UNIT_MAP["mat.u3.traduccion_lenguaje_verbal"]).toBe("unit-3");
  });

  test("unit-3 skills appear after unit-2 skills in catalog order", () => {
    const lastU2Index = PILOT_SKILLS.findLastIndex((s) => s.unitKey === "unit-2");
    const firstU3Index = PILOT_SKILLS.findIndex((s) => s.unitKey === "unit-3");
    expect(firstU3Index).toBeGreaterThan(lastU2Index);
  });

  test("U3-MOD-PR1: the new translation skill leads the U3 catalog (modeling first, then equations)", () => {
    // The translation skill is a pedagogical entry point: the student
    // models first and only then solves. Order in PILOT_SKILLS does
    // NOT make it a prerequisite; SKILL_DEPENDENCIES is the source of
    // truth for prereqs (and the translation skill has none).
    const u3 = PILOT_SKILLS.filter((s) => s.unitKey === "unit-3");
    expect(u3[0].skillId).toBe("mat.u3.traduccion_lenguaje_verbal");
  });

  test("every U3 pilot skill has a non-empty Spanish label", () => {
    const u3 = PILOT_SKILLS.filter((s) => s.unitKey === "unit-3");
    for (const skill of u3) {
      expect(typeof skill.label).toBe("string");
      expect(skill.label.length).toBeGreaterThan(0);
    }
  });

  test("U3-MOD-PR1: the new translation skill is a leaf (no new global prereq was introduced)", () => {
    // PR 1 must keep the new skill as a leaf so existing U3 skills are
    // not blocked when a student opens the modeling practice. The check
    // looks at SKILL_DEPENDENCIES via a catalog-level inspection.
    // We only assert that no existing U3 skill was made to depend on
    // the new one (a global prereq is the failure mode we want to avoid).
    const newSkill = "mat.u3.traduccion_lenguaje_verbal";
    const introduced = SKILL_DEPENDENCIES.filter(
      (d) => Array.isArray(d.prerequisites) && d.prerequisites.includes(newSkill as never),
    );
    expect(introduced, "no existing skill should depend on the new modeling skill").toHaveLength(0);
  });
});
