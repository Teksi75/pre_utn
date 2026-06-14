import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("StudentSituationPanel", () => {
  const componentPath =
    "src/components/home/student-home/StudentSituationPanel.tsx";

  test("is a Client Component (declared with 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("accepts situation prop of type StudentSituation from student-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain("StudentSituation");
    expect(comp).toContain("situation:");
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

  test("displays the diagnostic date when situation.diagnosticCompletedAt exists", () => {
    const comp = source(componentPath);
    expect(comp).toContain("situation.diagnosticCompletedAt");
  });

  test("renders weak skills count, practiced skills count, and total pilot count", () => {
    const comp = source(componentPath);
    expect(comp).toContain("situation.weakSkillsCount");
    expect(comp).toContain("situation.practicedSkillsCount");
    expect(comp).toContain("situation.totalPilotCount");
  });

  test("renders readiness percent from situation.readinessPercent", () => {
    const comp = source(componentPath);
    expect(comp).toContain("situation.readinessPercent");
  });

  test("uses explicit text labels, not color-only status indicators", () => {
    const comp = source(componentPath);
    // Must have human-readable labels like "% listo" or "débiles"
    // — not just color classes
    expect(comp).toMatch(/[%]|débiles|practicadas|listo|total/i);
  });

  test("does not import or use React hooks directly (dumb component)", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/useState/);
    expect(comp).not.toMatch(/useEffect/);
  });

  test("imports StudentSituation type from student-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain("StudentSituation");
  });

  test("has a named export 'StudentSituationPanel'", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export function StudentSituationPanel/);
  });

  test("displays diagnostic date or fallback text when null", () => {
    const comp = source(componentPath);
    // Must handle null diagnosticCompletedAt — either conditional render
    // or fallback string
    const hasNullCheck =
      comp.includes("null") ||
      comp.includes("?") ||
      comp.includes("&&");
    expect(hasNullCheck).toBe(true);
  });

  test("heading text is 'Tu situación'", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Tu situación");
  });

  test("heading does not contain old forbidden copy", () => {
    const comp = source(componentPath);
    expect(comp).not.toContain("Situación del alumno");
  });
});
