import { describe, test, expect } from "vitest";
import {
  areLinesCoincident,
  areLinesParallel,
  lineToStandardForm,
  pointSatisfiesLine,
  solveLinearSystem,
} from "../layout";
import type { CartesianLineData } from "../types";

describe("layout helpers", () => {
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
});
