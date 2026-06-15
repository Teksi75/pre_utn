import { describe, expect, it, vi, beforeEach } from "vitest";
import { getSkillAvailability } from "../catalog/skill-availability";
import * as readiness from "../catalog/readiness";

// Use a real pilot skillId for in-pilot tests so the Object.hasOwn check
// against PILOT_SKILL_UNIT_MAP passes. The mocked readiness functions
// determine the actual returned state, decoupling the precedence tests
// from the real catalog content.
const PILOT_SKILL = "mat.u1.propiedades_operaciones_reales";
const NON_PILOT_SKILL = "mat.u9.fake_for_test";

const allComponentsPresent = [
  { name: "theory" as const, present: true },
  { name: "examples" as const, present: true },
  { name: "exercises" as const, present: true },
  { name: "feedback" as const, present: true },
  { name: "evaluation" as const, present: true },
];

const noComponentsPresent = [
  { name: "theory" as const, present: false },
  { name: "examples" as const, present: false },
  { name: "exercises" as const, present: false },
  { name: "feedback" as const, present: false },
  { name: "evaluation" as const, present: true },
];

const onlyTheoryPresent = [
  { name: "theory" as const, present: true },
  { name: "examples" as const, present: false },
  { name: "exercises" as const, present: false },
  { name: "feedback" as const, present: false },
  { name: "evaluation" as const, present: true },
];

const onlyExamplesPresent = [
  { name: "theory" as const, present: false },
  { name: "examples" as const, present: true },
  { name: "exercises" as const, present: false },
  { name: "feedback" as const, present: false },
  { name: "evaluation" as const, present: true },
];

describe("getSkillAvailability — strict precedence (mocked state)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rule 1: returns coming-soon for any non-pilot skillId (regardless of mocked state)", () => {
    // The Object.hasOwn(PILOT_SKILL_UNIT_MAP, ...) check is the first gate.
    // Even if mocked state would suggest ready, non-pilot always wins.
    vi.spyOn(readiness, "isSkillReady").mockReturnValue({
      skillId: NON_PILOT_SKILL,
      ready: true,
      missing: [],
    });
    vi.spyOn(readiness, "getSkillComponents").mockReturnValue(allComponentsPresent);
    expect(getSkillAvailability(NON_PILOT_SKILL)).toBe("coming-soon");
  });

  it("rule 2: returns in-preparation when all key components are false (in pilot)", () => {
    vi.spyOn(readiness, "isSkillReady").mockReturnValue({
      skillId: PILOT_SKILL,
      ready: false,
      missing: ["theory", "examples", "exercises", "feedback"],
    });
    vi.spyOn(readiness, "getSkillComponents").mockReturnValue(noComponentsPresent);
    expect(getSkillAvailability(PILOT_SKILL)).toBe("in-preparation");
  });

  it("rule 3: returns theory-ready when hasTheory is true and isSkillReady is false", () => {
    vi.spyOn(readiness, "isSkillReady").mockReturnValue({
      skillId: PILOT_SKILL,
      ready: false,
      missing: ["exercises"],
    });
    vi.spyOn(readiness, "getSkillComponents").mockReturnValue(onlyTheoryPresent);
    expect(getSkillAvailability(PILOT_SKILL)).toBe("theory-ready");
  });

  it("rule 4: returns practice-ready when isSkillReady is true", () => {
    vi.spyOn(readiness, "isSkillReady").mockReturnValue({
      skillId: PILOT_SKILL,
      ready: true,
      missing: [],
    });
    vi.spyOn(readiness, "getSkillComponents").mockReturnValue(allComponentsPresent);
    expect(getSkillAvailability(PILOT_SKILL)).toBe("practice-ready");
  });

  it("fallback guard: pilot skill with NO theory but other components is in-preparation, not theory-ready", () => {
    // Pins spec discipline: rule 3 requires hasTheory === true.
    // A pilot skill with examples=true but theory=false must NOT be theory-ready
    // (because /learn/matematica/{skillId} would 404 without theory).
    // This test would have caught the buggy fallback that returned "theory-ready".
    vi.spyOn(readiness, "isSkillReady").mockReturnValue({
      skillId: PILOT_SKILL,
      ready: false,
      missing: ["theory", "exercises", "feedback"],
    });
    vi.spyOn(readiness, "getSkillComponents").mockReturnValue(onlyExamplesPresent);
    expect(getSkillAvailability(PILOT_SKILL)).toBe("in-preparation");
  });
});
