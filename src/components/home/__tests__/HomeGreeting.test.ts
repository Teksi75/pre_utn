import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("HomeGreeting", () => {
  const componentPath = "src/components/home/HomeGreeting.tsx";

  test("exports a HomeGreeting component", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export\s+(?:function|const)\s+HomeGreeting\b/);
  });

  test("accepts a required studentName prop of type string", () => {
    const comp = source(componentPath);
    // Must declare the prop with a string type (no `any`).
    expect(comp).toMatch(/studentName\s*:\s*string\b/);
  });

  test("is a Client Component (uses 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("hydrates today's date safely: useState<string | null>(null) + useEffect", () => {
    const comp = source(componentPath);
    // The state must be initialised to null (not undefined, not '') so the
    // server-rendered HTML and the first client render match exactly.
    expect(comp).toMatch(/useState<[^>]*string\s*\|\s*null[^>]*>\s*\(\s*null\s*\)/);
    // The date must be set inside a useEffect, not during initial render.
    expect(comp).toMatch(/useEffect\s*\(/);
    // The effect must call toLocaleDateString with the es-AR locale and the
    // weekday + day + month fields the spec v4 mandates.
    expect(comp).toMatch(/toLocaleDateString\s*\(\s*["']es-AR["']/);
    expect(comp).toMatch(/weekday\s*:\s*["']long["']/);
    expect(comp).toMatch(/day\s*:\s*["']numeric["']/);
    expect(comp).toMatch(/month\s*:\s*["']long["']/);
  });

  test("does NOT call toLocaleDateString during the initial render path", () => {
    const comp = source(componentPath);
    // We assert this indirectly: the setToday call must live inside the
    // useEffect body, not at the top of the component.
    // Find the useEffect block and the call to toLocaleDateString; the call
    // should appear inside the useEffect braces.
    const effectMatch = comp.match(/useEffect\s*\(\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[\s*\]\s*\)/);
    expect(effectMatch).not.toBeNull();
    const effectBody = effectMatch![1] ?? "";
    expect(effectBody).toContain("toLocaleDateString");
    expect(effectBody).toMatch(/setToday\s*\(/);
  });

  test("renders a visible 'Hola' greeting with the student name", () => {
    const comp = source(componentPath);
    // The visible greeting should say "Hola, {name}" — the spec v4 mandates
    // text-only (no emoji by default).
    expect(comp).toContain("Hola");
    // The student name must be interpolated into the JSX, not just stored.
    expect(comp).toMatch(/\{studentName\}/);
  });

  test("preserves the legacy 'Este es tu recorrido de aprendizaje' copy", () => {
    // HomeNextStepClient-student.test.ts asserts on this exact string. The
    // greeting sub-component keeps the legacy line so the assertion still
    // holds; we treat the line as a faithful historical artifact.
    const comp = source(componentPath);
    expect(comp).toContain("Este es tu recorrido de aprendizaje,");
  });

  test("does NOT default to emoji in the greeting (spec: no emoji by default)", () => {
    const comp = source(componentPath);
    // No emoji characters in the rendered greeting. We allow emoji in
    // comments (the spec only forbids rendering them). Common emoji ranges
    // we explicitly forbid: U+1F300-U+1FAFF (misc symbols, emoticons, etc.).
    const rendered = comp
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    expect(rendered).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  test("does not use any, console.log, or TODO", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/:\s*any\b/);
    expect(comp).not.toMatch(/<any\b/);
    expect(comp).not.toContain("console.log");
    expect(comp).not.toMatch(/\bTODO\b/);
  });

  test("uses brand typography tokens (no raw palette colors)", () => {
    const comp = source(componentPath);
    // No raw hex and no raw Tailwind palette in the rendered class names.
    expect(comp).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(comp).not.toMatch(/\b(?:bg|text|border)-(?:amber|red|green|blue|emerald|orange|stone|yellow)-\d/);
  });
});
