import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("ExerciseAnswerInput", () => {
  const componentPath = "src/components/exercises/ExerciseAnswerInput.tsx";

  test("exports an ExerciseAnswerInput component", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export\s+(?:function|const)\s+ExerciseAnswerInput\b/);
  });

  test("is a Client Component (declared with 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("defines a pure optionClassName helper that branches on `selected`", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/function\s+optionClassName\s*\(\s*selected\s*:\s*boolean\s*\)/);
  });

  test("selected option uses accent tokens, NOT the primary button fingerprint (D4)", () => {
    // D4 says: "Estado seleccionado: usar accent o brand fuerte de forma
    // consistente." We use the accent tokens we added in A1. The previous
    // style made the selection look like a primary button (bg-brand-900
    // + text-white) which competed visually with the screen's primary
    // CTA. The new style is accent-soft + accent-700 + accent-500 border.
    const comp = source(componentPath);

    // Find the `selected: "..."` ternary branch. We sample the classes
    // by checking what follows the `selected` key.
    const selectedMatch = comp.match(/selected\s*\?\s*"([^"]+)"/);
    expect(selectedMatch).not.toBeNull();
    const selectedClasses = selectedMatch![1]!;
    expect(selectedClasses).toContain("var(--color-accent-soft)");
    expect(selectedClasses).toContain("var(--color-accent-700)");
    expect(selectedClasses).toContain("var(--color-accent-500)");

    // The primary fingerprint must not be used for the selected option.
    expect(selectedClasses).not.toMatch(/var\(--color-brand-900\)/);
    expect(selectedClasses).not.toMatch(/text-white/);
  });

  test("unselected option keeps a brand surface, a soft hover, and no backdrop-blur (D4)", () => {
    // The previous "bg-white/90 ... backdrop-blur-sm" had no visible
    // blur (nothing behind the label) and a too-soft surface. We
    // clean it up: keep the brand surface, the hover lift, drop the
    // backdrop-blur that did nothing.
    const comp = source(componentPath);

    // The ternary has two branches; the unselected is the second one
    // after the colon. We assert via source that the unselected
    // class string no longer contains backdrop-blur-sm.
    const branches = comp.match(/selected\s*\?\s*"([^"]+)"\s*:\s*"([^"]+)"/);
    expect(branches).not.toBeNull();
    const unselectedClasses = branches![2]!;
    expect(unselectedClasses).not.toContain("backdrop-blur");
    // Keep the hover lift to brand-50.
    expect(unselectedClasses).toContain("hover:bg-[var(--color-brand-50)]");
    // Keep the white-ish background and brand text.
    expect(unselectedClasses).toMatch(/bg-white/);
    expect(unselectedClasses).toContain("var(--color-brand-900)");
  });

  test("preserves focus-within ring (a11y: F2)", () => {
    // F2 audit requires visible focus on radio inputs and labels.
    // The optionClassName keeps `focus-within:shadow-[var(--ring-focus)]`.
    const comp = source(componentPath);
    expect(comp).toContain("focus-within:shadow-[var(--ring-focus)]");
  });

  test("preserves the :disabled styles so the option still reads as not-clickable", () => {
    const comp = source(componentPath);
    // The previous class string had several `has-[:disabled]:...`
    // modifiers. We keep them (the option's underlying <input
    // disabled flag controls these via the :has() selector).
    expect(comp).toContain("has-[:disabled]:cursor-not-allowed");
    expect(comp).toContain("has-[:disabled]:bg-[var(--color-brand-100)]");
  });

  test("uses a real <input type=\"radio\"> (a11y: keeps native radio semantics)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/<input\s+type="radio"/);
  });

  test("does not use any, console.log, or TODO", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/:\s*any\b/);
    expect(comp).not.toMatch(/<any\b/);
    expect(comp).not.toContain("console.log");
    expect(comp).not.toMatch(/\bTODO\b/);
  });
});
