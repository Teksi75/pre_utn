import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("MathRoutePanel", () => {
  const componentPath =
    "src/components/home/teacher-home/MathRoutePanel.tsx";

  test("is a Client Component (declared with 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("accepts routeUnits prop of type TeacherRouteUnit[] from teacher-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain("TeacherRouteUnit");
    expect(comp).toContain("routeUnits");
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

  test("does NOT import or render SkillRoadmap", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/<SkillRoadmap/);
    expect(comp).not.toContain('import { SkillRoadmap }');
  });

  test("renders routeUnits as a vertical list (ol or ul)", () => {
    const comp = source(componentPath);
    // Must iterate routeUnits in a list
    expect(comp).toMatch(/routeUnits/);
    // Should use a list element
    const hasList = comp.includes("<ol") || comp.includes("<ul");
    expect(hasList).toBe(true);
  });

  test("displays unit status with explicit Spanish labels", () => {
    const comp = source(componentPath);
    const hasLabels =
      comp.includes("Dominada") ||
      comp.includes("En progreso") ||
      comp.includes("Sin empezar") ||
      comp.includes("dominada") ||
      comp.includes("en progreso") ||
      comp.includes("sin empezar") ||
      comp.includes("Mastered") ||
      comp.includes("In progress") ||
      comp.includes("Not started");
    expect(hasLabels).toBe(true);
  });

  test("does not import or use React hooks directly (dumb component)", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/useState/);
    expect(comp).not.toMatch(/useEffect/);
  });

  test("imports TeacherRouteUnit type from teacher-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain('from "@/domain/teacher-home"');
    expect(comp).toContain("TeacherRouteUnit");
  });

  test("has a named export 'MathRoutePanel'", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export function MathRoutePanel/);
  });

  test("heading text is 'Ruta Matemática'", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Ruta Matemática");
  });

  test("heading does not contain old forbidden copy", () => {
    const comp = source(componentPath);
    expect(comp).not.toContain("Tu camino de aprendizaje");
  });
});
