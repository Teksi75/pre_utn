/**
 * cartesian-layout — rendering math helpers.
 *
 * Tests the component-level layout utilities that turn domain line data into
 * SVG viewport bounds and clipped segments. Kept separate from the pure domain
 * layout.ts helpers tested in src/domain/visuals/__tests__/layout.test.ts.
 */

import { describe, expect, test } from "vitest";
import {
  CARTESIAN_VIEWBOX,
  clipLineToRect,
  computeCartesianLayout,
} from "../cartesian-layout";
import type { CartesianLineData } from "@/domain/visuals/types";

const DEFAULT_VIEWPORT = {
  xMin: CARTESIAN_VIEWBOX.xMin,
  xMax: CARTESIAN_VIEWBOX.xMax,
  yMin: CARTESIAN_VIEWBOX.yMin,
  yMax: CARTESIAN_VIEWBOX.yMax,
};

describe("clipLineToRect", () => {
  test("clips a diagonal line to the viewport corners", () => {
    const line: CartesianLineData = { form: "slope-intercept", slope: 1, intercept: 0 };
    const segment = clipLineToRect(line, DEFAULT_VIEWPORT);

    expect(segment).not.toBeNull();
    const [a, b] = segment!;
    expect(a).toEqual({ x: -6, y: -6 });
    expect(b).toEqual({ x: 6, y: 6 });
  });

  test("returns null for a line completely outside the viewport", () => {
    const line: CartesianLineData = { form: "horizontal", constant: 10 };
    expect(clipLineToRect(line, DEFAULT_VIEWPORT)).toBeNull();
  });

  test("returns null for a vertical line outside the viewport", () => {
    const line: CartesianLineData = { form: "vertical", constant: 10 };
    expect(clipLineToRect(line, DEFAULT_VIEWPORT)).toBeNull();
  });

  test("returns a non-zero segment for a line passing through a corner and crossing the viewport", () => {
    // y = -0.5x + 3 crosses (-6, 6) and exits at (6, 0).
    const line: CartesianLineData = { form: "slope-intercept", slope: -0.5, intercept: 3 };
    const segment = clipLineToRect(line, DEFAULT_VIEWPORT);

    expect(segment).not.toBeNull();
    const [a, b] = segment!;
    expect(a.x).not.toBe(b.x);
    expect(a.y).not.toBe(b.y);
  });

  test("does not return a zero-length segment when a line is tangent at a viewport corner", () => {
    // y = -x - 12 touches (-6, -6) only and immediately leaves the viewport.
    const line: CartesianLineData = { form: "slope-intercept", slope: -1, intercept: -12 };
    const segment = clipLineToRect(line, DEFAULT_VIEWPORT);

    expect(segment).toBeNull();
  });

  test("handles a line that intersects two adjacent edges at the same corner", () => {
    // y = x + 12 intersects the left and top edges both at (-6, 6).
    const line: CartesianLineData = { form: "slope-intercept", slope: 1, intercept: 12 };
    const segment = clipLineToRect(line, DEFAULT_VIEWPORT);

    // The line only touches the viewport at the single corner point.
    expect(segment).toBeNull();
  });
});

describe("computeCartesianLayout", () => {
  test("keeps the default viewport when data fits inside [-6, 6]", () => {
    const layout = computeCartesianLayout([{ form: "slope-intercept", slope: 1, intercept: 0 }]);

    expect(layout.xMin).toBeLessThanOrEqual(-6);
    expect(layout.xMax).toBeGreaterThanOrEqual(6);
    expect(layout.yMin).toBeLessThanOrEqual(-6);
    expect(layout.yMax).toBeGreaterThanOrEqual(6);
  });

  test("expands the viewport to include a vertical line at x = 10", () => {
    const layout = computeCartesianLayout([{ form: "vertical", constant: 10 }]);

    expect(layout.xMin).toBeLessThan(10);
    expect(layout.xMax).toBeGreaterThan(10);
    expect(layout.yMin).toBeLessThanOrEqual(-6);
    expect(layout.yMax).toBeGreaterThanOrEqual(6);
  });

  test("expands the viewport to include a horizontal line at y = 8", () => {
    const layout = computeCartesianLayout([{ form: "horizontal", constant: 8 }]);

    expect(layout.yMin).toBeLessThan(8);
    expect(layout.yMax).toBeGreaterThan(8);
    expect(layout.xMin).toBeLessThanOrEqual(-6);
    expect(layout.xMax).toBeGreaterThanOrEqual(6);
  });

  test("expands to include both lines and an intersection point in a system", () => {
    const lines: CartesianLineData[] = [
      { form: "slope-intercept", slope: 1, intercept: 0 },
      { form: "slope-intercept", slope: -1, intercept: 2 },
    ];
    const layout = computeCartesianLayout(lines, { intersection: { x: 1, y: 1 } });

    expect(layout.xMin).toBeLessThanOrEqual(1);
    expect(layout.xMax).toBeGreaterThanOrEqual(1);
    expect(layout.yMin).toBeLessThanOrEqual(1);
    expect(layout.yMax).toBeGreaterThanOrEqual(1);
  });

  test("falls back to a finite default viewport when opposite two-point extremes overflow the span", () => {
    const lines: CartesianLineData[] = [
      {
        form: "two-point",
        points: [
          { x: -Number.MAX_VALUE, y: 0 },
          { x: Number.MAX_VALUE, y: 0 },
        ],
      },
    ];
    const layout = computeCartesianLayout(lines);

    expect(Number.isFinite(layout.xMin)).toBe(true);
    expect(Number.isFinite(layout.xMax)).toBe(true);
    expect(Number.isFinite(layout.yMin)).toBe(true);
    expect(Number.isFinite(layout.yMax)).toBe(true);
    expect(Number.isFinite(layout.xToPx(0))).toBe(true);
    expect(Number.isFinite(layout.yToPx(0))).toBe(true);
  });

  test("falls back to a finite default viewport when a vertical line is at an extreme constant", () => {
    const layout = computeCartesianLayout([{ form: "vertical", constant: Number.MAX_VALUE }]);

    expect(Number.isFinite(layout.xMin)).toBe(true);
    expect(Number.isFinite(layout.xMax)).toBe(true);
    expect(Number.isFinite(layout.xToPx(0))).toBe(true);
  });
});
