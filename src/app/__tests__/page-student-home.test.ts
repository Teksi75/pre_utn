import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("page.tsx — Student Home integration", () => {
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

  // ── B5: Acciones rápidas con menor peso visual ────────────────────
  // The Home has one primary CTA in the hero. The Zone 3 quick
  // actions ("Hacer diagnóstico" / "Ir a práctica") must read as
  // secondary shortcuts, not as a second primary CTA surface. We
  // pin the lighter visual contract here.
  test("B5: Zone 3 section uses a lower-key h2 (text-xs, text-brand-500)", () => {
    const page = source(pagePath);
    // The h2 "Acciones rápidas" must be visually lighter than the
    // h3 inside the dashboard panels (text-sm font-semibold).
    // We assert the class string of the "home-actions-title" h2.
    const match = page.match(
      /id="home-actions-title"[\s\S]*?className="([^"]+)"/,
    );
    expect(match).not.toBeNull();
    const classes = match![1]!;
    expect(classes).toContain("text-xs");
    expect(classes).toContain("text-[var(--color-brand-500)]");
    // Forbid the bolder old combination.
    expect(classes).not.toMatch(/text-sm font-semibold/);
  });

  test("B5: Zone 3 section has an overall opacity dim (opacity-90 or similar)", () => {
    const page = source(pagePath);
    // The section must declare an opacity below 1 so the
    // shortcut row reads as a quiet helper, not a featured
    // action block. We assert the section class string contains
    // an opacity-* utility.
    const match = page.match(
      /aria-labelledby="home-actions-title"[\s\S]*?className="([^"]+)"/,
    );
    expect(match).not.toBeNull();
    const classes = match![1]!;
    expect(classes).toMatch(/opacity-\d/);
  });

  test("B5: Zone 3 quick-action links drop the app-glass-surface heavy style", () => {
    // The links should read as quiet outline buttons, not as
    // glass cards. They keep min-h-[44px] and focus-visible
    // for a11y, but the surface treatment must be lighter.
    const page = source(pagePath);
    // Find the Zone 3 <Link href="/diagnostic" ...> block.
    const match = page.match(
      /<Link\s+href="\/diagnostic"[\s\S]*?className="([^"]+)"/,
    );
    expect(match).not.toBeNull();
    const classes = match![1]!;
    // Must NOT carry the heavy glass surface.
    expect(classes).not.toContain("app-glass-surface");
    // Must keep the touch target and the focus cue.
    expect(classes).toContain("min-h-[44px]");
    expect(classes).toContain("focus-visible:shadow-[var(--ring-focus)]");
  });

  test("B5: Zone 3 quick-action link text uses the lighter brand-600", () => {
    // The labels in the shortcut links drop from brand-700 to
    // brand-600 (one notch lighter) so the visual weight of the
    // row matches the reduced h2.
    const page = source(pagePath);
    const match = page.match(
      /<Link\s+href="\/diagnostic"[\s\S]*?className="([^"]+)"/,
    );
    expect(match).not.toBeNull();
    const classes = match![1]!;
    expect(classes).toMatch(/text-\[var\(--color-brand-600\)\]/);
  });
});
