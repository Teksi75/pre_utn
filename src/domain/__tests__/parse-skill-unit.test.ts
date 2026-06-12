/**
 * Tests for shared parseSkillUnit helper.
 * RED phase — these tests reference code that does not exist yet.
 */

import { describe, test, expect } from "vitest";
import { parseSkillUnit } from "../shared/skill-id";

describe("parseSkillUnit", () => {
  test("extracts unit 2 from mat.u2.polinomios_basico", () => {
    expect(parseSkillUnit("mat.u2.polinomios_basico")).toBe(2);
  });

  test("extracts unit 1 from mat.u1.conjuntos_numericos", () => {
    expect(parseSkillUnit("mat.u1.conjuntos_numericos")).toBe(1);
  });

  test("extracts unit 6 from mat.u6.funcion_concepto", () => {
    expect(parseSkillUnit("mat.u6.funcion_concepto")).toBe(6);
  });

  test("defaults to 1 for unknown pattern", () => {
    expect(parseSkillUnit("unknown.skill.id")).toBe(1);
  });

  test("defaults to 1 for empty string", () => {
    expect(parseSkillUnit("")).toBe(1);
  });
});
