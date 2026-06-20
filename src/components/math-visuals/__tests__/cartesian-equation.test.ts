/**
 * cartesian-equation — shared label formatting for Cartesian line visuals.
 */

import { describe, expect, test } from "vitest";
import { formatCartesianLineEquation } from "../cartesian-equation";
import type { CartesianLineData } from "@/domain/visuals/types";

describe("formatCartesianLineEquation", () => {
  test.each([
    {
      line: { form: "slope-intercept" as const, slope: 1, intercept: 0 },
      label: "y = 1x + 0",
    },
    {
      line: { form: "slope-intercept" as const, slope: -2, intercept: 5 },
      label: "y = -2x + 5",
    },
    {
      line: { form: "slope-intercept" as const, slope: 3, intercept: -4 },
      label: "y = 3x - 4",
    },
    {
      line: { form: "point-slope" as const, slope: 2, point: { x: 1, y: 1 } },
      label: "y - 1 = 2(x - 1)",
    },
    {
      line: {
        form: "two-point" as const,
        points: [
          { x: 0, y: 0 },
          { x: 2, y: 2 },
        ],
      },
      label: "por (0, 0) y (2, 2)",
    },
    { line: { form: "horizontal" as const, constant: 2 }, label: "y = 2" },
    { line: { form: "vertical" as const, constant: -1 }, label: "x = -1" },
  ])("formats $label", ({ line, label }) => {
    expect(formatCartesianLineEquation(line as CartesianLineData)).toBe(label);
  });
});
