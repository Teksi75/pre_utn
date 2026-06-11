import { describe, expect, test } from "vitest";
import {
  PILOT_SKILLS,
  PILOT_SKILL_UNIT_MAP,
} from "../catalog/pilot-skills";

describe("PILOT_SKILLS", () => {
  test("contains 15 pilot skills (8 unit-1 + 7 unit-2)", () => {
    expect(PILOT_SKILLS).toHaveLength(15);
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
