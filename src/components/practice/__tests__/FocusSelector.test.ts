import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("FocusSelector", () => {
  const componentPath = "src/components/practice/FocusSelector.tsx";

  test("exports a FocusSelector component", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export\s+(?:function|const)\s+FocusSelector\b/);
  });

  test("is a Client Component (declared with 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("uses a native <select> element for unit selection (D1: no custom dropdown)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/<select\b/);
    expect(comp).toContain('id="unit-select"');
    expect(comp).toContain("<option");
  });

  test("select is keyboard and a11y friendly (D1 + F2)", () => {
    const comp = source(componentPath);
    // Native <select> is keyboard-accessible by default. We add an
    // explicit <label htmlFor="unit-select"> and a focus-visible
    // ring as the visual cue.
    expect(comp).toMatch(/<label[^>]*htmlFor="unit-select"/);
    expect(comp).toMatch(/<select[^>]*id="unit-select"/);
    expect(comp).toContain("focus-visible:shadow-[var(--ring-focus)]");
  });

  test("select has a 44px minimum touch target (D1 + DoD mobile)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/<select[^>]*min-h-\[44px\]/);
  });

  test("select uses brand tokens and no raw palette (D1 consistency with A1/A3)", () => {
    const comp = source(componentPath);
    // The select class string must reference brand-* tokens.
    expect(comp).toMatch(/<select[^>]*border-brand-300/);
    expect(comp).toMatch(/<select[^>]*bg-white/);
    expect(comp).toMatch(/<select[^>]*text-brand-900/);
    // No raw palette leak.
    expect(comp).not.toMatch(/<select[^>]*(?:amber|red|green|blue|emerald|orange|stone|yellow)-\d/);
  });

  test("select has a transition + cursor:pointer polish (D1)", () => {
    const comp = source(componentPath);
    // Hover and focus are smooth, not jumpy.
    expect(comp).toMatch(/<select[^>]*transition-colors/);
    expect(comp).toMatch(/<select[^>]*duration-\[var\(--duration-fast\)\]/);
    // Explicit cursor because the <select> is interactive.
    expect(comp).toMatch(/<select[^>]*cursor-pointer/);
    // Hover border lift matches the Button hover pattern.
    expect(comp).toMatch(/<select[^>]*hover:border-brand-400/);
  });

  test("select wrapper carries a custom caret indicator (D1) without breaking the native <select>", () => {
    // We add a small decorative caret next to the <select> so the
    // visual is consistent across browsers. The <select> itself
    // keeps its native dropdown behaviour (the caret is purely
    // decorative; aria-hidden on the span keeps it out of a11y).
    const comp = source(componentPath);
    // The <select> must be inside a `relative` wrapper so the caret
    // can be absolutely positioned over it.
    expect(comp).toMatch(/<div\s+className="relative">/);
    // The caret is a span with aria-hidden so screen readers ignore it.
    expect(comp).toMatch(/<span[^>]*aria-hidden="true"[^>]*>[^<]*[▾▼]\s*<\/span>/);
  });

  test("does not use any, console.log, or TODO", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/:\s*any\b/);
    expect(comp).not.toMatch(/<any\b/);
    expect(comp).not.toContain("console.log");
    expect(comp).not.toMatch(/\bTODO\b/);
  });

  // -------------------------------------------------------------------
  // Mastery pill tests (practice-skill-status-indicators)
  // -------------------------------------------------------------------

  test("getMasteryPillInfo returns null for not-started", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/case\s+["']not-started["']:\s*\n\s*return\s+null/);
  });

  test("getMasteryPillInfo returns 'Dominada' for mastered", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/case\s+["']mastered["']/);
    expect(comp).toContain('"Dominada"');
    expect(comp).toContain('variant: "success"');
  });

  test("getMasteryPillInfo returns 'Necesita repaso' for review", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/case\s+["']review["']/);
    expect(comp).toContain('"Necesita repaso"');
    expect(comp).toContain('variant: "weak"');
  });

  test("getMasteryPillInfo returns 'En práctica' for practicing", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/case\s+["']practicing["']/);
    expect(comp).toContain('"En práctica"');
    expect(comp).toContain('variant: "active"');
  });

  test("getMasteryPillInfo returns 'En práctica' for learning", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/case\s+["']learning["']/);
    // learning shares the same return as practicing
    expect(comp).toContain('"En práctica"');
  });

  test("mastery pill renders with data-testid='mastery-pill'", () => {
    const comp = source(componentPath);
    expect(comp).toContain('data-testid="mastery-pill"');
  });

  test("availability pill renders with data-testid='availability-pill'", () => {
    const comp = source(componentPath);
    expect(comp).toContain('data-testid="availability-pill"');
  });

  test("mastery pill and availability pill are separate elements", () => {
    const comp = source(componentPath);
    // Both testids must exist — they are on different StatusPill instances
    const masteryMatches = comp.match(/data-testid="mastery-pill"/g);
    const availabilityMatches = comp.match(/data-testid="availability-pill"/g);
    expect(masteryMatches).toBeTruthy();
    expect(availabilityMatches).toBeTruthy();
    expect(masteryMatches!.length).toBeGreaterThanOrEqual(1);
    expect(availabilityMatches!.length).toBeGreaterThanOrEqual(1);
  });
});
