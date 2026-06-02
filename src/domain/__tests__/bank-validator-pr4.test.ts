/**
 * Verify the bank validator reports ZERO diagnostics for PR#4 completion.
 * PR#4 owns 2 of 6 categories: racionales-vs-irracionales and decimales.
 * After PR#4, the bank should still have pending work for errores-comunes
 * (PR#5) but rvi and dec should be complete.
 */

import { describe, test, expect } from "vitest";
import { loadSkillBank } from "../catalog/content-loaders";

const SKILL_ID = "mat.u1.conjuntos_numericos";

describe("PR#4 bank validator outcome", () => {
  const bank = loadSkillBank(SKILL_ID);
  const exs = bank.exercises;

  test("bank has at least 38 exercises (24 from PR#2/3 + 14 from PR#4)", () => {
    expect(exs.length).toBeGreaterThanOrEqual(38);
  });

  test("racionales-vs-irracionales category has at least 8 exercises (PR#4 minimum met)", () => {
    const rvi = exs.filter((e) => e.category === "racionales-vs-irracionales");
    expect(rvi.length).toBeGreaterThanOrEqual(8);
  });

  test("decimales category has at least 6 exercises (PR#4 minimum met)", () => {
    const dec = exs.filter((e) => e.category === "decimales");
    expect(dec.length).toBeGreaterThanOrEqual(6);
  });

  test("pertenencia, clasificacion, mapa still meet their minimums (no regression)", () => {
    const counts = new Map<string, number>();
    for (const ex of exs) {
      if (ex.category) {
        counts.set(ex.category, (counts.get(ex.category) ?? 0) + 1);
      }
    }
    expect(counts.get("pertenencia") ?? 0).toBeGreaterThanOrEqual(8);
    expect(counts.get("clasificacion") ?? 0).toBeGreaterThanOrEqual(12);
    expect(counts.get("mapa") ?? 0).toBeGreaterThanOrEqual(4);
  });

  test("only errores-comunes still falls short (owned by PR#5)", () => {
    // The errors category is the only one PR#4 doesn't own. After PR#4
    // the bank may still have a diagnostic for it; that's expected.
    const dec = exs.filter((e) => e.category === "errores-comunes");
    const diagnosticsAboutErr = bank.diagnostics.filter((d) =>
      d.includes("errores-comunes")
    );
    if (dec.length < 6) {
      expect(diagnosticsAboutErr.length).toBeGreaterThan(0);
    }
    // No diagnostic about rvi or dec (those are PR#4's responsibility)
    const diagnosticsAboutPr4 = bank.diagnostics.filter(
      (d) =>
        d.includes("racionales-vs-irracionales") || d.includes("decimales")
    );
    expect(diagnosticsAboutPr4).toEqual([]);
  });
});
