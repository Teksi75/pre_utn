import { describe, test, expect } from "vitest";
import {
  areLinesCoincident,
  areLinesParallel,
  lineToStandardForm,
  linearScale,
  pointSatisfiesLine,
  solveLinearSystem,
  computeIntervalSetLayout,
} from "../layout";
import type { CartesianLineData, IntervalSetVisual } from "../types";

function makeIntervalSet(notation: string, intervals: IntervalSetVisual["intervals"]): IntervalSetVisual {
  return {
    id: "v",
    kind: "interval-set",
    title: "T",
    ariaLabel: "A",
    description: "D",
    notation,
    intervals,
  };
}

function allLayoutNumbersFinite(layout: ReturnType<typeof computeIntervalSetLayout>): boolean {
  const values: unknown[] = [];
  const collect = (obj: unknown) => {
    if (obj === null || obj === undefined) return;
    if (typeof obj === "number") {
      values.push(obj);
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach(collect);
      return;
    }
    if (typeof obj === "object") {
      Object.values(obj).forEach(collect);
    }
  };
  collect(layout);
  return values.length > 0 && values.every((n) => typeof n === "number" && Number.isFinite(n));
}

describe("layout helpers", () => {
  describe("linearScale", () => {
    test("maps values across a finite domain", () => {
      const s = linearScale([0, 10], [0, 100]);
      expect(s.valueToPx(5)).toBe(50);
    });

    test("maps endpoints across a finite domain", () => {
      const s = linearScale([0, 10], [0, 100]);
      expect(s.valueToPx(0)).toBe(0);
      expect(s.valueToPx(10)).toBe(100);
    });

    test("returns the midpoint for a zero-length domain", () => {
      const s = linearScale([5, 5], [0, 100]);
      expect(s.valueToPx(5)).toBe(50);
      expect(s.valueToPx(7)).toBe(50);
    });

    test("returns a finite midpoint for an overflowed finite-extreme domain", () => {
      const s = linearScale([-Number.MAX_VALUE, Number.MAX_VALUE], [20, 80]);
      expect(Number.isFinite(s.valueToPx(-Number.MAX_VALUE))).toBe(true);
      expect(Number.isFinite(s.valueToPx(0))).toBe(true);
      expect(Number.isFinite(s.valueToPx(Number.MAX_VALUE))).toBe(true);
      expect(s.valueToPx(Number.MAX_VALUE)).toBe(50);
    });
  });

  describe("lineToStandardForm", () => {
    test.each([
      [{ form: "slope-intercept", slope: 2, intercept: -1 } as const, { a: 2, b: -1, c: 1 }],
      [{ form: "horizontal", constant: 5 } as const, { a: 0, b: 1, c: 5 }],
      [{ form: "vertical", constant: -3 } as const, { a: 1, b: 0, c: -3 }],
    ] as const)("converts %s to standard form", (line, expected) => {
      expect(lineToStandardForm(line as CartesianLineData)).toEqual(expected);
    });
  });

  describe("parallel detection", () => {
    test.each([
      [{ form: "vertical", constant: 1 } as const, { form: "vertical", constant: 4 } as const, true],
      [{ form: "horizontal", constant: -2 } as const, { form: "horizontal", constant: 3 } as const, true],
      [{ form: "vertical", constant: 1 } as const, { form: "horizontal", constant: 1 } as const, false],
      [{ form: "slope-intercept", slope: 2, intercept: 0 } as const, { form: "vertical", constant: 1 } as const, false],
    ] as const)("areLinesParallel(%s, %s) = %s", (a, b, expected) => {
      expect(areLinesParallel(a as CartesianLineData, b as CartesianLineData)).toBe(expected);
    });
  });

  describe("coincident detection", () => {
    test.each([
      [{ form: "vertical", constant: 5 } as const, { form: "vertical", constant: 5 } as const, true],
      [{ form: "vertical", constant: 5 } as const, { form: "vertical", constant: 2 } as const, false],
      [{ form: "horizontal", constant: 3 } as const, { form: "horizontal", constant: 3 } as const, true],
      [{ form: "horizontal", constant: 3 } as const, { form: "horizontal", constant: -3 } as const, false],
    ] as const)("areLinesCoincident(%s, %s) = %s", (a, b, expected) => {
      expect(areLinesCoincident(a as CartesianLineData, b as CartesianLineData)).toBe(expected);
    });
  });

  describe("point on line", () => {
    test.each([
      [{ x: 2, y: 5 }, { form: "vertical", constant: 2 } as const, true],
      [{ x: 3, y: 5 }, { form: "vertical", constant: 2 } as const, false],
      [{ x: 4, y: -1 }, { form: "horizontal", constant: -1 } as const, true],
      [{ x: 4, y: 0 }, { form: "horizontal", constant: -1 } as const, false],
    ] as const)("pointSatisfiesLine(%s, %s) = %s", (point, line, expected) => {
      expect(pointSatisfiesLine(point, line as CartesianLineData)).toBe(expected);
    });
  });

  describe("solveLinearSystem", () => {
    test("intersects vertical and horizontal lines", () => {
      expect(solveLinearSystem(lineToStandardForm({ form: "vertical", constant: 2 }), lineToStandardForm({ form: "horizontal", constant: 3 }))).toEqual({ x: 2, y: 3 });
    });
    test("returns null for two vertical lines", () => {
      expect(solveLinearSystem(lineToStandardForm({ form: "vertical", constant: 1 }), lineToStandardForm({ form: "vertical", constant: 4 }))).toBeNull();
    });
    test("returns null for two horizontal lines", () => {
      expect(solveLinearSystem(lineToStandardForm({ form: "horizontal", constant: 1 }), lineToStandardForm({ form: "horizontal", constant: 4 }))).toBeNull();
    });
  });

  describe("computeIntervalSetLayout", () => {
    test("computes union-wide finite domain from exterior union", () => {
      const layout = computeIntervalSetLayout(
        makeIntervalSet("(-∞, -3) ∪ (7, +∞)", [
          {
            lower: { kind: "infinity", direction: "negative" },
            upper: { kind: "finite", value: -3 },
            lowerInclusion: "open",
            upperInclusion: "open",
          },
          {
            lower: { kind: "finite", value: 7 },
            upper: { kind: "infinity", direction: "positive" },
            lowerInclusion: "open",
            upperInclusion: "open",
          },
        ])
      );
      expect(layout.domain.min).toBe(-3);
      expect(layout.domain.max).toBe(7);
      expect(layout.axis.x1).toBeLessThan(layout.ticks.find((t) => t.value === -3)!.x);
      expect(layout.axis.x2).toBeGreaterThan(layout.ticks.find((t) => t.value === 7)!.x);
    });

    test("uses fraction label for tick while positioning by numeric value", () => {
      const layout = computeIntervalSetLayout(
        makeIntervalSet("[-5/2, 1)", [
          {
            lower: { kind: "finite", value: -2.5, label: "-5/2" },
            upper: { kind: "finite", value: 1 },
            lowerInclusion: "closed",
            upperInclusion: "open",
          },
        ])
      );
      const tick = layout.ticks.find((t) => t.value === -2.5);
      expect(tick).toBeDefined();
      expect(tick!.label).toBe("-5/2");
      expect(Number.isFinite(tick!.x)).toBe(true);
      expect(tick!.x).toBeLessThan(layout.ticks.find((t) => t.value === 1)!.x);
    });

    test("prefers explicit tick label over default numeric string for a closed singleton", () => {
      const layout = computeIntervalSetLayout(
        makeIntervalSet("[-5/2, -5/2]", [
          {
            lower: { kind: "finite", value: -2.5, label: "-5/2" },
            upper: { kind: "finite", value: -2.5 },
            lowerInclusion: "closed",
            upperInclusion: "closed",
          },
        ])
      );
      const ticks = layout.ticks.filter((t) => t.value === -2.5);
      expect(ticks).toHaveLength(1);
      expect(ticks[0].label).toBe("-5/2");
    });

    test("prefers explicit upper label when lower bound has none", () => {
      const layout = computeIntervalSetLayout(
        makeIntervalSet("[5/2, 5/2]", [
          {
            lower: { kind: "finite", value: 2.5 },
            upper: { kind: "finite", value: 2.5, label: "5/2" },
            lowerInclusion: "closed",
            upperInclusion: "closed",
          },
        ])
      );
      const ticks = layout.ticks.filter((t) => t.value === 2.5);
      expect(ticks).toHaveLength(1);
      expect(ticks[0].label).toBe("5/2");
    });

    test("keeps first explicit label when both bounds provide different labels for the same value", () => {
      const layout = computeIntervalSetLayout(
        makeIntervalSet("[4, 4]", [
          {
            lower: { kind: "finite", value: 4, label: "cuatro" },
            upper: { kind: "finite", value: 4, label: "four" },
            lowerInclusion: "closed",
            upperInclusion: "closed",
          },
        ])
      );
      const ticks = layout.ticks.filter((t) => t.value === 4);
      expect(ticks).toHaveLength(1);
      expect(ticks[0].label).toBe("cuatro");
    });

    test("places a left arrow for a left ray", () => {
      const layout = computeIntervalSetLayout(
        makeIntervalSet("(-∞, 2]", [
          {
            lower: { kind: "infinity", direction: "negative" },
            upper: { kind: "finite", value: 2 },
            lowerInclusion: "open",
            upperInclusion: "closed",
          },
        ])
      );
      expect(layout.arrows).toEqual([{ side: "left", x: layout.axis.x1, y: layout.axis.y }]);
    });

    test("produces only finite coordinates for all-infinite rays", () => {
      const layout = computeIntervalSetLayout(
        makeIntervalSet("(-∞, -3) ∪ (7, +∞)", [
          {
            lower: { kind: "infinity", direction: "negative" },
            upper: { kind: "finite", value: -3 },
            lowerInclusion: "open",
            upperInclusion: "open",
          },
          {
            lower: { kind: "finite", value: 7 },
            upper: { kind: "infinity", direction: "positive" },
            lowerInclusion: "open",
            upperInclusion: "open",
          },
        ])
      );
      expect(allLayoutNumbersFinite(layout)).toBe(true);
    });

    test("provides deterministic gap-aware padding", () => {
      const layout = computeIntervalSetLayout(
        makeIntervalSet("[4, 7]", [
          {
            lower: { kind: "finite", value: 4 },
            upper: { kind: "finite", value: 7 },
            lowerInclusion: "closed",
            upperInclusion: "closed",
          },
        ])
      );
      expect(layout.axis.x1).toBeLessThan(layout.segments[0].lowerX);
      expect(layout.axis.x2).toBeGreaterThan(layout.segments[0].upperX);
      expect(layout.segments[0].lowerX).toBeLessThan(layout.segments[0].upperX);
    });
  });
});
