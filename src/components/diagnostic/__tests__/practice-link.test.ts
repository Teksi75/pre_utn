import { describe, expect, it } from "vitest";
import { getPracticeHrefForSuggestion } from "../practice-link";

describe("getPracticeHrefForSuggestion", () => {
  it("returns a direct practice URL for ready guided-practice skills", () => {
    expect(getPracticeHrefForSuggestion("mat.u1.propiedades_operaciones_reales")).toBe(
      "/practice?skill=mat.u1.propiedades_operaciones_reales"
    );
  });

  it("does not link to skills without a complete guided-practice route", () => {
    // mat.u4.perimetro_area_volumen is a known Unit 4 skill but is not yet
    // registered for guided practice (Unit 4 is coming-soon). Replaced the
    // legacy U3 fixture after Unit 3 became a pilot unit in PR 3.
    expect(getPracticeHrefForSuggestion("mat.u4.perimetro_area_volumen")).toBeNull();
  });
});
