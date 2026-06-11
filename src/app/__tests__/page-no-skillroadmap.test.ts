import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("SkillRoadmap is NOT rendered on Home", () => {
  test("page.tsx does NOT import SkillRoadmap", () => {
    const page = source("src/app/page.tsx");
    expect(page).not.toContain("SkillRoadmap");
  });

  test("HomeNextStepClient does NOT render SkillRoadmap directly", () => {
    const client = source("src/components/home/HomeNextStepClient.tsx");
    // The JSX tag must not appear
    expect(client).not.toMatch(/<SkillRoadmap/);
  });

  test("SkillRoadmap component file still exists (not deleted)", () => {
    const roadmap = source("src/components/home/SkillRoadmap.tsx");
    expect(roadmap).toContain("export function SkillRoadmap");
  });

  test("MathRoutePanel does NOT render SkillRoadmap (routes display routeUnits only)", () => {
    const panel = source(
      "src/components/home/teacher-home/MathRoutePanel.tsx"
    );
    expect(panel).not.toMatch(/<SkillRoadmap/);
    expect(panel).not.toContain('import { SkillRoadmap }');
  });
});
