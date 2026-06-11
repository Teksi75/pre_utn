import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("page.tsx — Teacher Digital Home integration", () => {
  const pagePath = "src/app/page.tsx";

  test("does NOT import EngineeringHeroVisual (removed editorial hero)", () => {
    const page = source(pagePath);
    expect(page).not.toContain("EngineeringHeroVisual");
  });

  test("does NOT have USE_MATH_THEME_PLATE flag (removed editorial hero)", () => {
    const page = source(pagePath);
    expect(page).not.toContain("USE_MATH_THEME_PLATE");
  });

  test("does NOT render the editorial hero section with MathWatermark topic='sets' variant='hero'", () => {
    const page = source(pagePath);
    // The old hero used MathWatermark variant="hero" or the editorial section
    expect(page).not.toMatch(/variant\s*=\s*"hero"/);
  });

  test("does NOT render the editorial 'Tu camino al ingreso a Ingeniería' static h1", () => {
    const page = source(pagePath);
    expect(page).not.toContain("Tu camino al ingreso a Ingeniería");
  });

  test("still imports and renders HomeNextStepClient", () => {
    const page = source(pagePath);
    expect(page).toContain("HomeNextStepClient");
    expect(page).toMatch(/<HomeNextStepClient/);
  });

  test("keeps Zone 3 'Acciones rápidas' with /diagnostic and /practice links", () => {
    const page = source(pagePath);
    expect(page).toContain("Acciones rápidas");
    expect(page).toContain("/diagnostic");
    expect(page).toContain("/practice");
  });

  test("keeps 'Contexto del curso' section", () => {
    const page = source(pagePath);
    expect(page).toContain("Contexto del curso");
  });

  test("does NOT import MathWatermark directly in page.tsx (only in HomeNextStepClient)", () => {
    const page = source(pagePath);
    expect(page).not.toContain('import { MathWatermark }');
  });

  test("is a Server Component (no 'use client' directive)", () => {
    const page = source(pagePath);
    expect(page).not.toMatch(/["']use client["']/);
  });
});
