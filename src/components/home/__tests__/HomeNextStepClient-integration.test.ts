import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("HomeNextStepClient — integration with StudentHomeViewModel", () => {
  const componentPath = "src/components/home/HomeNextStepClient.tsx";

  test("imports deriveStudentHomeViewModel from student-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain("deriveStudentHomeViewModel");
  });

  test("imports MissionCard from student-home components", () => {
    const comp = source(componentPath);
    expect(comp).toContain("MissionCard");
  });

  test("imports StudentSituationPanel from student-home components", () => {
    const comp = source(componentPath);
    expect(comp).toContain("StudentSituationPanel");
  });

  test("imports MathRoutePanel from student-home components", () => {
    const comp = source(componentPath);
    expect(comp).toContain("MathRoutePanel");
  });

  test("imports DecisionBoardPanel from student-home components", () => {
    const comp = source(componentPath);
    expect(comp).toContain("DecisionBoardPanel");
  });

  test("calls deriveStudentHomeViewModel with StudentHomeInput object", () => {
    const comp = source(componentPath);
    // Must call with a single object argument: deriveStudentHomeViewModel({...})
    expect(comp).toMatch(/deriveStudentHomeViewModel\s*\(\s*\{/);
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

  test("passes viewModel.mission to MissionCard", () => {
    const comp = source(componentPath);
    // May be viewModel.mission or viewModel!.mission (non-null assertion in active-student branch)
    expect(comp).toMatch(/viewModel!\.mission|viewModel\.mission/);
  });

  test("does not reference a missing MissionCard heading id", () => {
    const comp = source(componentPath);
    expect(comp).not.toContain('aria-labelledby="mission-card-title"');
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
