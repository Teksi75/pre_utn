import type { CartesianLineData, Point } from "./types";

export interface LinearEquation {
  readonly a: number;
  readonly b: number;
  readonly c: number;
}

export function linearScale(domain: readonly [number, number], range: readonly [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const finiteSpan = Number.isFinite(span) && span !== 0;
  const safeMidpoint = Number.isFinite(r0) && Number.isFinite(r1) ? (r0 + r1) / 2 : 0;
  return {
    valueToPx: (v: number) =>
      finiteSpan ? r0 + ((v - d0) / span) * (r1 - r0) : safeMidpoint,
  };
}

export function lineToStandardForm(line: CartesianLineData): LinearEquation {
  switch (line.form) {
    case "slope-intercept":
      return { a: line.slope, b: -1, c: -line.intercept };
    case "point-slope": {
      const { x, y } = line.point;
      const m = line.slope;
      return { a: m, b: -1, c: m * x - y };
    }
    case "two-point": {
      const [p1, p2] = line.points;
      return { a: p2.y - p1.y, b: p1.x - p2.x, c: p1.x * p2.y - p2.x * p1.y };
    }
    case "horizontal":
      return { a: 0, b: 1, c: line.constant };
    case "vertical":
      return { a: 1, b: 0, c: line.constant };
    default:
      throw new Error(`Unhandled cartesian-line form: ${(line as CartesianLineData).form}`);
  }
}

const EPS = 1e-9;

export function areLinesParallel(l1: CartesianLineData, l2: CartesianLineData): boolean {
  const e1 = lineToStandardForm(l1);
  const e2 = lineToStandardForm(l2);
  return Math.abs(e1.a * e2.b - e2.a * e1.b) < EPS;
}

export function areLinesCoincident(l1: CartesianLineData, l2: CartesianLineData): boolean {
  const e1 = lineToStandardForm(l1);
  const e2 = lineToStandardForm(l2);
  return (
    Math.abs(e1.a * e2.b - e2.a * e1.b) < EPS &&
    Math.abs(e1.a * e2.c - e2.a * e1.c) < EPS &&
    Math.abs(e1.b * e2.c - e2.b * e1.c) < EPS
  );
}

export function pointSatisfiesLine(point: Point, line: CartesianLineData): boolean {
  const eq = lineToStandardForm(line);
  return Math.abs(eq.a * point.x + eq.b * point.y - eq.c) < EPS;
}

export function solveLinearSystem(eq1: LinearEquation, eq2: LinearEquation): Point | null {
  const det = eq1.a * eq2.b - eq2.a * eq1.b;
  if (Math.abs(det) < EPS) return null;
  return { x: (eq1.c * eq2.b - eq2.c * eq1.b) / det, y: (eq1.a * eq2.c - eq2.a * eq1.c) / det };
}
