import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("DecisionBoardPanel", () => {
  const componentPath =
    "src/components/home/student-home/DecisionBoardPanel.tsx";

  test("is a Client Component (declared with 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("accepts decisions prop of type TeacherHomeAction[] from student-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain("TeacherHomeAction");
    expect(comp).toContain("decisions");
  });

  test("renders an <article> element with aria-labelledby", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/<article\b/);
    expect(comp).toMatch(/aria-labelledby/);
  });

  test("renders a heading with an id for aria-labelledby", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/<h3\b/);
    expect(comp).toMatch(/id=/);
  });

  test("renders cards in a grid with responsive columns (grid-cols-1 md:grid-cols-3)", () => {
    const comp = source(componentPath);
    expect(comp).toContain("grid-cols-1");
    expect(comp).toContain("md:grid-cols-3");
  });

  test("iterates over decisions array and renders each action label, description, and link", () => {
    const comp = source(componentPath);
    // Iterates over decisions directly (flat array of TeacherHomeAction)
    expect(comp).toMatch(/decisions\.map/);
    expect(comp).toContain("action.label");
    expect(comp).toContain("action.description");
    expect(comp).toContain("action.href");
  });

  test("each card link uses Next.js <Link> with min-h-[44px] touch target", () => {
    const comp = source(componentPath);
    expect(comp).toContain("<Link");
    expect(comp).toContain("min-h-[44px]");
  });

  test("each card link uses focus-visible ring for keyboard accessibility", () => {
    const comp = source(componentPath);
    expect(comp).toContain("focus-visible");
  });

  test("imports TeacherHomeAction type from student-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain('from "@/domain/student-home"');
    expect(comp).toContain("TeacherHomeAction");
  });

  test("imports Link from next/link", () => {
    const comp = source(componentPath);
    expect(comp).toContain('from "next/link"');
  });

  test("does not import or use React hooks directly (dumb component)", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/useState/);
    expect(comp).not.toMatch(/useEffect/);
  });

  test("has a named export 'DecisionBoardPanel'", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export function DecisionBoardPanel/);
  });

  test("heading text must be 'Plan de hoy' (not 'Decisiones recomendadas')", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Plan de hoy");
    expect(comp).not.toContain("Decisiones recomendadas");
  });

  // B2 — single primary CTA on Home. The decision board is no longer
  // a primary CTA surface; its links must read as secondary.

  test("does NOT use the primary CTA style (bg-brand-900 + text-white) for its links", () => {
    const comp = source(componentPath);
    // The primary fingerprint from Button.variant="primary" is
    //   bg-[var(--color-brand-900)] ... text-white
    // The decision board links must not paint themselves primary anymore.
    expect(comp).not.toMatch(/bg-\[var\(--color-brand-900\)\][^"]*text-white/);
    expect(comp).not.toMatch(/text-white/);
  });

  test("links render with the secondary CTA style (bg-brand-100 + text-brand-700)", () => {
    const comp = source(componentPath);
    // Secondary fingerprint from Button.variant="secondary":
    //   bg-[var(--color-brand-100)] text-brand-700 hover:bg-[var(--color-brand-200)]
    expect(comp).toMatch(/bg-\[var\(--color-brand-100\)\]/);
    expect(comp).toMatch(/text-brand-700/);
    expect(comp).toMatch(/hover:bg-\[var\(--color-brand-200\)\]/);
  });

  test("card containers use the subtle brand surface (no strong white surface)", () => {
    const comp = source(componentPath);
    // The inner action card used to be `bg-white border-brand-200` which
    // made each card feel like a CTA on its own. B2 lowers them to a
    // softer `bg-brand-50` so the button inside is the focal point.
    expect(comp).toMatch(/bg-\[var\(--color-brand-50\)\]/);
    // And we drop the strong `border-brand-200` outline.
    expect(comp).not.toMatch(/border-\[var\(--color-brand-200\)\][^"]*bg-white/);
  });
});
