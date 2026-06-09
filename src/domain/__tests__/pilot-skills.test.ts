import { describe, expect, test } from "vitest";
import {
  PILOT_SKILLS,
  PILOT_SKILL_UNIT_MAP,
} from "../catalog/pilot-skills";

describe("PILOT_SKILLS", () => {
  test("contains the 8 unit-1 pilot skills", () => {
    expect(PILOT_SKILLS).toHaveLength(8);
    for (const skill of PILOT_SKILLS) {
      expect(skill.unitKey).toBe("unit-1");
    }
  });

  test("includes mat.u1.propiedades_operaciones_reales (renamed from reales_operaciones)", () => {
    // This test guards against accidental reverts of the rename in
    // openspec/changes/refactor-rename-reales-operaciones/.
    const ids = PILOT_SKILLS.map((s) => s.skillId);
    expect(ids).toContain("mat.u1.propiedades_operaciones_reales");
    expect(ids).not.toContain("mat.u1.reales_operaciones");
  });

  test("uses the canonical PDF label (cap. 13 'Propiedades Operaciones de Numeros reales')", () => {
    const propOp = PILOT_SKILLS.find(
      (s) => s.skillId === "mat.u1.propiedades_operaciones_reales"
    );
    expect(propOp).toBeDefined();
    expect(propOp?.label).toBe("Propiedades Operaciones de Números reales");
  });
});

describe("PILOT_SKILL_UNIT_MAP", () => {
  test("maps every pilot skill to unit-1", () => {
    for (const skill of PILOT_SKILLS) {
      expect(PILOT_SKILL_UNIT_MAP[skill.skillId]).toBe("unit-1");
    }
  });

  test("returns undefined for unknown skills (tolerant of URL params)", () => {
    expect(PILOT_SKILL_UNIT_MAP["mat.u99.nonexistent"]).toBeUndefined();
  });
});
