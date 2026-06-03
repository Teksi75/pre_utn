import { describe, test, expect } from "vitest";
import { getRoadmapVisuals } from "../roadmap-visuals";

describe("getRoadmapVisuals", () => {
  test("returns 'next' state when isNext is true, regardless of mastery", () => {
    const visuals = getRoadmapVisuals("not-started", true);
    expect(visuals.visualState).toBe("next");
    // A "next" marker uses the brand color
    expect(visuals.dotClass).toMatch(/brand/);
  });

  test("returns 'completed' state for mastered skill", () => {
    const visuals = getRoadmapVisuals("mastered", false);
    expect(visuals.visualState).toBe("completed");
    expect(visuals.dotClass).toMatch(/green/);
  });

  test("returns 'in-progress' state for practicing skill (amber)", () => {
    const visuals = getRoadmapVisuals("practicing", false);
    expect(visuals.visualState).toBe("in-progress");
    expect(visuals.dotClass).toMatch(/amber/);
  });

  test("returns 'in-progress' state for learning skill (lighter amber)", () => {
    const visuals = getRoadmapVisuals("learning", false);
    expect(visuals.visualState).toBe("in-progress");
    expect(visuals.dotClass).toMatch(/amber/);
  });

  test("returns 'in-progress' state with warning color for review", () => {
    const visuals = getRoadmapVisuals("review", false);
    expect(visuals.visualState).toBe("in-progress");
    expect(visuals.dotClass).toMatch(/red/);
  });

  test("returns 'blocked' state for not-started skill (gray)", () => {
    const visuals = getRoadmapVisuals("not-started", false);
    expect(visuals.visualState).toBe("blocked");
    expect(visuals.dotClass).toMatch(/brand-300|gray/);
  });

  test("next state wins over completed (the user must always see their next step)", () => {
    const visuals = getRoadmapVisuals("mastered", true);
    expect(visuals.visualState).toBe("next");
  });

  test("every state has a non-empty label and aria-label", () => {
    const states: Array<"not-started" | "learning" | "practicing" | "review" | "mastered"> = [
      "not-started",
      "learning",
      "practicing",
      "review",
      "mastered",
    ];
    for (const mastery of states) {
      const visuals = getRoadmapVisuals(mastery, false);
      expect(visuals.labelText.length).toBeGreaterThan(0);
      expect(visuals.ariaLabel.length).toBeGreaterThan(0);
    }
  });
});
