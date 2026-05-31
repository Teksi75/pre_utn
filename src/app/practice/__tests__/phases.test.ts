import { describe, it, expect } from "vitest";
import { nextPhase, type PracticePhase } from "../phases";

describe("practice phase machine", () => {
  describe("nextPhase", () => {
    it("transitions from select to theory", () => {
      expect(nextPhase("select", null, false)).toBe("theory");
    });

    it("transitions from theory to example", () => {
      expect(nextPhase("theory", null, false)).toBe("example");
    });

    it("transitions from example to exercise", () => {
      expect(nextPhase("example", null, false)).toBe("exercise");
    });

    it("transitions from exercise to feedback (always after answering)", () => {
      expect(nextPhase("exercise", null, false)).toBe("feedback");
    });

    it("transitions from feedback to exercise when more exercises remain", () => {
      expect(nextPhase("feedback", null, false)).toBe("exercise");
    });

    it("transitions from feedback to recovery when errorTag is present", () => {
      expect(nextPhase("feedback", "u1_orden_operaciones", false)).toBe(
        "recovery"
      );
    });

    it("transitions from feedback to select when no recovery and no more exercises", () => {
      expect(nextPhase("feedback", null, true)).toBe("select");
    });

    it("transitions from feedback to exercise when no recovery and more exercises remain", () => {
      expect(nextPhase("feedback", null, false)).toBe("exercise");
    });

    it("transitions from recovery to select when no more exercises", () => {
      expect(nextPhase("recovery", null, true)).toBe("select");
    });

    it("transitions from recovery to exercise when more exercises remain", () => {
      expect(nextPhase("recovery", null, false)).toBe("exercise");
    });
  });

  describe("phase type", () => {
    it("includes all required phases", () => {
      const phases: PracticePhase[] = [
        "select",
        "theory",
        "example",
        "exercise",
        "feedback",
        "recovery",
      ];
      expect(phases).toHaveLength(6);
    });
  });
});
