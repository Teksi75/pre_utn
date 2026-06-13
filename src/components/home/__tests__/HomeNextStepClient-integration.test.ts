import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("HomeNextStepClient — integration with TeacherHomeViewModel", () => {
  const componentPath = "src/components/home/HomeNextStepClient.tsx";

  test("imports deriveTeacherHomeViewModel from teacher-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain("deriveTeacherHomeViewModel");
  });

  test("imports TeacherDigitalHero from teacher-home components", () => {
    const comp = source(componentPath);
    expect(comp).toContain("TeacherDigitalHero");
  });

  test("imports StudentSituationPanel from teacher-home components", () => {
    const comp = source(componentPath);
    expect(comp).toContain("StudentSituationPanel");
  });

  test("imports MathRoutePanel from teacher-home components", () => {
    const comp = source(componentPath);
    expect(comp).toContain("MathRoutePanel");
  });

  test("imports DecisionBoardPanel from teacher-home components", () => {
    const comp = source(componentPath);
    expect(comp).toContain("DecisionBoardPanel");
  });

  test("calls deriveTeacherHomeViewModel with TeacherHomeInput object", () => {
    const comp = source(componentPath);
    // Must call with a single object argument: deriveTeacherHomeViewModel({...})
    expect(comp).toMatch(/deriveTeacherHomeViewModel\s*\(\s*\{/);
    expect(comp).toContain("progress,");
    expect(comp).toContain("availableSkills:");
    expect(comp).toContain("pilotSkills:");
    expect(comp).toContain("nextStep:");
  });

  test("does NOT render SkillRoadmap as a direct child (only via MathRoutePanel)", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/<SkillRoadmap/);
  });

  test("does NOT import or render StudyPlanSection (removed from Home)", () => {
    const comp = source(componentPath);
    expect(comp).not.toContain("StudyPlanSection");
  });

  test("passes viewModel.mission to TeacherDigitalHero", () => {
    const comp = source(componentPath);
    // May be viewModel.mission or viewModel!.mission (non-null assertion in active-student branch)
    expect(comp).toMatch(/viewModel!\.mission|viewModel\.mission/);
  });

  test("passes viewModel.routeUnits to MathRoutePanel", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/viewModel!\.routeUnits|viewModel\.routeUnits/);
  });

  test("passes viewModel.primaryActions to DecisionBoardPanel", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/viewModel!\.primaryActions|viewModel\.primaryActions/);
  });

  test("keeps the loading skeleton with aria-busy and aria-live", () => {
    const comp = source(componentPath);
    expect(comp).toContain("aria-busy");
    expect(comp).toContain("aria-live");
  });

  test("does NOT render the old 'Tu estado' card inline", () => {
    const comp = source(componentPath);
    expect(comp).not.toContain('data-testid="home-state-card"');
  });

  test("does NOT render the old 'Tu camino' article wrapping SkillRoadmap", () => {
    const comp = source(componentPath);
    expect(comp).not.toContain('id="home-roadmap-title"');
  });
});
