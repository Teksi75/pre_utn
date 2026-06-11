import { describe, expect, it } from "vitest";
import { getPracticeHrefForSuggestion } from "../practice-link";

describe("getPracticeHrefForSuggestion", () => {
  it("returns a direct practice URL for ready guided-practice skills", () => {
    expect(getPracticeHrefForSuggestion("mat.u1.propiedades_operaciones_reales")).toBe(
      "/practice?skill=mat.u1.propiedades_operaciones_reales"
    );
  });

  it("does not link to skills without a complete guided-practice route", () => {
    expect(getPracticeHrefForSuggestion("mat.u3.ecuaciones_lineales")).toBeNull();
  });
});
