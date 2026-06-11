import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("DecisionBoardPanel", () => {
  const componentPath =
    "src/components/home/teacher-home/DecisionBoardPanel.tsx";

  test("is a Client Component (declared with 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("accepts decisions prop of type TeacherHomeAction[] from teacher-home domain", () => {
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

  test("imports TeacherHomeAction type from teacher-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain('from "@/domain/teacher-home"');
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
});
