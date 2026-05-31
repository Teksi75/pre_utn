import { describe, test, expect } from "vitest";
import { computeReadiness, type ReadinessComponent } from "../readiness/index";

describe("computeReadiness", () => {
  const ALL_PRESENT: ReadinessComponent[] = [
    { name: "theory", present: true },
    { name: "examples", present: true },
    { name: "exercises", present: true },
    { name: "feedback", present: true },
    { name: "evaluation", present: true },
  ];

  describe("ready skill", () => {
    test("returns ready=true when all components present", () => {
      const result = computeReadiness("mat.u1.reales_operaciones", ALL_PRESENT);
      expect(result.skillId).toBe("mat.u1.reales_operaciones");
      expect(result.ready).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });

  describe("incomplete skill", () => {
    test("returns ready=false with missing theory", () => {
      const components = ALL_PRESENT.map((c) =>
        c.name === "theory" ? { ...c, present: false } : c
      );
      const result = computeReadiness("mat.u1.reales_operaciones", components);
      expect(result.ready).toBe(false);
      expect(result.missing).toContain("theory");
    });

    test("returns ready=false with missing examples", () => {
      const components = ALL_PRESENT.map((c) =>
        c.name === "examples" ? { ...c, present: false } : c
      );
      const result = computeReadiness("mat.u1.reales_operaciones", components);
      expect(result.ready).toBe(false);
      expect(result.missing).toContain("examples");
    });

    test("returns ready=false with missing exercises", () => {
      const components = ALL_PRESENT.map((c) =>
        c.name === "exercises" ? { ...c, present: false } : c
      );
      const result = computeReadiness("mat.u1.reales_operaciones", components);
      expect(result.ready).toBe(false);
      expect(result.missing).toContain("exercises");
    });

    test("returns ready=false with missing feedback", () => {
      const components = ALL_PRESENT.map((c) =>
        c.name === "feedback" ? { ...c, present: false } : c
      );
      const result = computeReadiness("mat.u1.reales_operaciones", components);
      expect(result.ready).toBe(false);
      expect(result.missing).toContain("feedback");
    });

    test("returns ready=false with missing evaluation", () => {
      const components = ALL_PRESENT.map((c) =>
        c.name === "evaluation" ? { ...c, present: false } : c
      );
      const result = computeReadiness("mat.u1.reales_operaciones", components);
      expect(result.ready).toBe(false);
      expect(result.missing).toContain("evaluation");
    });

    test("returns all missing when multiple absent", () => {
      const components = ALL_PRESENT.map((c) =>
        c.name === "theory" || c.name === "examples"
          ? { ...c, present: false }
          : c
      );
      const result = computeReadiness("mat.u1.reales_operaciones", components);
      expect(result.ready).toBe(false);
      expect(result.missing).toEqual(
        expect.arrayContaining(["theory", "examples"])
      );
      expect(result.missing).toHaveLength(2);
    });
  });

  describe("empty components", () => {
    test("returns ready=false with all components missing", () => {
      const result = computeReadiness("mat.u1.reales_operaciones", []);
      expect(result.ready).toBe(false);
      expect(result.missing).toEqual(
        expect.arrayContaining(["theory", "examples", "exercises", "feedback", "evaluation"])
      );
    });
  });
});
