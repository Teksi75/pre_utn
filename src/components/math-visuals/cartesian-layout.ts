import type { CartesianLineData, Point } from "@/domain/visuals/types";
import { lineToStandardForm } from "@/domain/visuals/layout";

export const CARTESIAN_VIEWBOX = {
  width: 520,
  height: 320,
  left: 60,
  right: 460,
  top: 40,
  bottom: 280,
  xMin: -6,
  xMax: 6,
  yMin: -6,
  yMax: 6,
} as const;

export interface CartesianViewport {
  readonly xMin: number;
  readonly xMax: number;
  readonly yMin: number;
  readonly yMax: number;
}

export interface CartesianLayout extends CartesianViewport {
  readonly width: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly xToPx: (x: number) => number;
  readonly yToPx: (y: number) => number;
}

const EPS = 1e-9;
const PADDING = 1;

function makeScale(domain: readonly [number, number], range: readonly [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  return (v: number) => {
    if (span === 0 || !Number.isFinite(span)) return (r0 + r1) / 2;
    return r0 + ((v - d0) / span) * (r1 - r0);
  };
}

function pointsEqual(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS;
}

export function clipLineToRect(
  line: CartesianLineData,
  viewport: CartesianViewport = CARTESIAN_VIEWBOX
): readonly [Point, Point] | null {
  const { a, b, c } = lineToStandardForm(line);
  const { xMin, xMax, yMin, yMax } = viewport;
  const candidates: Point[] = [];

  if (Math.abs(b) < EPS) {
    const x = c / a;
    if (x >= xMin - EPS && x <= xMax + EPS) {
      candidates.push({ x, y: yMin }, { x, y: yMax });
    }
  } else if (Math.abs(a) < EPS) {
    const y = c / b;
    if (y >= yMin - EPS && y <= yMax + EPS) {
      candidates.push({ x: xMin, y }, { x: xMax, y });
    }
  } else {
    const left: Point = { x: xMin, y: (c - a * xMin) / b };
    const right: Point = { x: xMax, y: (c - a * xMax) / b };
    const bottom: Point = { x: (c - b * yMin) / a, y: yMin };
    const top: Point = { x: (c - b * yMax) / a, y: yMax };
    candidates.push(left, right, bottom, top);
  }

  const inside = candidates.filter(
    (p) =>
      p.x >= xMin - EPS &&
      p.x <= xMax + EPS &&
      p.y >= yMin - EPS &&
      p.y <= yMax + EPS
  );

  // Deduplicate corner/tangent points so a line touching a single corner does
  // not collapse into a zero-length segment.
  const unique: Point[] = [];
  for (const p of inside) {
    if (!unique.some((u) => pointsEqual(u, p))) {
      unique.push(p);
    }
  }

  if (unique.length < 2) return null;
  const sorted = [...unique].sort((p1, p2) =>
    Math.abs(p1.x - p2.x) < EPS ? p1.y - p2.y : p1.x - p2.x
  );
  return [sorted[0], sorted[sorted.length - 1]];
}

function includePoint(
  point: Point,
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number }
): void {
  bounds.xMin = Math.min(bounds.xMin, point.x);
  bounds.xMax = Math.max(bounds.xMax, point.x);
  bounds.yMin = Math.min(bounds.yMin, point.y);
  bounds.yMax = Math.max(bounds.yMax, point.y);
}

function expandForLine(
  line: CartesianLineData,
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number }
): void {
  switch (line.form) {
    case "slope-intercept":
      includePoint({ x: 0, y: line.intercept }, bounds);
      break;
    case "point-slope":
      includePoint(line.point, bounds);
      break;
    case "two-point":
      includePoint(line.points[0], bounds);
      includePoint(line.points[1], bounds);
      break;
    case "horizontal":
      includePoint({ x: CARTESIAN_VIEWBOX.xMin, y: line.constant }, bounds);
      includePoint({ x: CARTESIAN_VIEWBOX.xMax, y: line.constant }, bounds);
      break;
    case "vertical":
      includePoint({ x: line.constant, y: CARTESIAN_VIEWBOX.yMin }, bounds);
      includePoint({ x: line.constant, y: CARTESIAN_VIEWBOX.yMax }, bounds);
      break;
  }
}

/**
 * Compute a responsive Cartesian layout that adapts to the supplied lines.
 * The default viewport is [-6, 6] on both axes; if any defining point or line
 * segment falls outside that window, the bounds expand and pad so the visual
 * still draws the line instead of silently showing an empty grid.
 */
export function computeCartesianLayout(
  lines: readonly CartesianLineData[],
  options?: { intersection?: Point }
): CartesianLayout {
  const bounds = {
    xMin: CARTESIAN_VIEWBOX.xMin,
    xMax: CARTESIAN_VIEWBOX.xMax,
    yMin: CARTESIAN_VIEWBOX.yMin,
    yMax: CARTESIAN_VIEWBOX.yMax,
  };

  for (const line of lines) {
    expandForLine(line, bounds);
  }
  if (options?.intersection) {
    includePoint(options.intersection, bounds);
  }

  // Authored coordinates can be finite yet produce an infinite span (e.g.
  // -Number.MAX_VALUE and Number.MAX_VALUE). Fall back to the default viewport
  // so the scale remains finite and the accessible figure/caption survive.
  const spanIsFinite =
    Number.isFinite(bounds.xMin) &&
    Number.isFinite(bounds.xMax) &&
    Number.isFinite(bounds.yMin) &&
    Number.isFinite(bounds.yMax) &&
    Number.isFinite(bounds.xMax - bounds.xMin) &&
    Number.isFinite(bounds.yMax - bounds.yMin);

  if (!spanIsFinite) {
    bounds.xMin = CARTESIAN_VIEWBOX.xMin;
    bounds.xMax = CARTESIAN_VIEWBOX.xMax;
    bounds.yMin = CARTESIAN_VIEWBOX.yMin;
    bounds.yMax = CARTESIAN_VIEWBOX.yMax;
  }

  // Add breathing room around the data and guarantee a non-zero range.
  bounds.xMin -= PADDING;
  bounds.xMax += PADDING;
  bounds.yMin -= PADDING;
  bounds.yMax += PADDING;

  if (Math.abs(bounds.xMax - bounds.xMin) < EPS) {
    bounds.xMin -= 1;
    bounds.xMax += 1;
  }
  if (Math.abs(bounds.yMax - bounds.yMin) < EPS) {
    bounds.yMin -= 1;
    bounds.yMax += 1;
  }

  // Pull in the clipped segment endpoints so the viewport exactly frames the
  // visible portion of each line.
  const viewport: CartesianViewport = { ...bounds };
  for (const line of lines) {
    const segment = clipLineToRect(line, viewport);
    if (segment) {
      includePoint(segment[0], bounds);
      includePoint(segment[1], bounds);
    }
  }

  const { width, height, left, right, top, bottom } = CARTESIAN_VIEWBOX;
  return {
    ...bounds,
    width,
    height,
    left,
    right,
    top,
    bottom,
    xToPx: makeScale([bounds.xMin, bounds.xMax], [left, right]),
    yToPx: makeScale([bounds.yMax, bounds.yMin], [top, bottom]),
  };
}

export function gridStepForRange(min: number, max: number): number {
  const span = max - min;
  if (!Number.isFinite(span)) return 1;
  if (span <= 20) return 1;
  return Math.max(1, Math.ceil(span / 20));
}
