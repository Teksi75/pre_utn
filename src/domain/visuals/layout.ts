import type { CartesianLineData, IntervalSetVisual, Point } from "./types";

const DEFAULT_INTERVAL_SET_WIDTH = 400;
const DEFAULT_INTERVAL_SET_HEIGHT = 80;
const DEFAULT_INTERVAL_SET_PADDING = 24;

export interface IntervalSetTick {
  readonly value: number;
  readonly label: string;
  readonly x: number;
}

export interface IntervalSetSegmentLayout {
  readonly lowerX: number;
  readonly upperX: number;
  readonly lowerInfinite: boolean;
  readonly upperInfinite: boolean;
  readonly lowerInclusion: "open" | "closed";
  readonly upperInclusion: "open" | "closed";
}

export interface IntervalSetArrow {
  readonly side: "left" | "right";
  readonly x: number;
  readonly y: number;
}

export interface IntervalSetLayout {
  readonly viewBox: { readonly minX: number; readonly minY: number; readonly width: number; readonly height: number };
  readonly axis: { readonly y: number; readonly x1: number; readonly x2: number };
  readonly domain: { readonly min: number; readonly max: number };
  readonly segments: readonly IntervalSetSegmentLayout[];
  readonly ticks: readonly IntervalSetTick[];
  readonly arrows: readonly IntervalSetArrow[];
}

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

function finiteDomain(values: readonly number[]): { readonly min: number; readonly max: number } {
  if (values.length === 0) return { min: -1, max: 1 };
  if (values.length === 1) return { min: values[0] - 1, max: values[0] + 1 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

function defaultTickLabel(value: number): string {
  return String(value);
}

function isExplicitLabel(label: string, value: number): boolean {
  return label !== defaultTickLabel(value);
}

function mergeTick(
  existing: IntervalSetTick | undefined,
  value: number,
  label: string | undefined,
  x: number
): IntervalSetTick {
  const candidate = label ?? defaultTickLabel(value);
  if (!existing) return { value, label: candidate, x };

  // Precedence for duplicate finite tick values:
  //   - explicit label wins over the default numeric string;
  //   - if both labels are explicit and differ, keep the first one encountered
  //     (lower before upper, segments in input order) so output is deterministic.
  if (!isExplicitLabel(existing.label, value) && isExplicitLabel(candidate, value)) {
    return { value, label: candidate, x };
  }
  return existing;
}

export function computeIntervalSetLayout(
  visual: IntervalSetVisual,
  options: { readonly width?: number; readonly height?: number; readonly padding?: number } = {}
): IntervalSetLayout {
  const width = options.width ?? DEFAULT_INTERVAL_SET_WIDTH;
  const height = options.height ?? DEFAULT_INTERVAL_SET_HEIGHT;
  const padding = options.padding ?? DEFAULT_INTERVAL_SET_PADDING;
  const axisY = height / 2;

  const finiteValues: number[] = [];
  for (const segment of visual.intervals) {
    if (segment.lower.kind === "finite") finiteValues.push(segment.lower.value);
    if (segment.upper.kind === "finite") finiteValues.push(segment.upper.value);
  }

  const { min: domainMin, max: domainMax } = finiteDomain(finiteValues);
  const finiteSpan = domainMax - domainMin;
  const pad = Math.max(finiteSpan * 0.15, 0.5);
  const scaleDomain: readonly [number, number] = [domainMin - pad, domainMax + pad];
  const scaleRange: readonly [number, number] = [padding, width - padding];
  const scale = linearScale(scaleDomain, scaleRange);
  const axisX1 = scaleRange[0];
  const axisX2 = scaleRange[1];

  const tickMap = new Map<number, IntervalSetTick>();
  const segments: IntervalSetSegmentLayout[] = [];
  const arrows: IntervalSetArrow[] = [];

  for (const segment of visual.intervals) {
    const lowerInfinite = segment.lower.kind === "infinity";
    const upperInfinite = segment.upper.kind === "infinity";
    const lowerX = lowerInfinite ? axisX1 : scale.valueToPx(segment.lower.value);
    const upperX = upperInfinite ? axisX2 : scale.valueToPx(segment.upper.value);

    segments.push({
      lowerX,
      upperX,
      lowerInfinite,
      upperInfinite,
      lowerInclusion: segment.lowerInclusion,
      upperInclusion: segment.upperInclusion,
    });

    if (lowerInfinite) arrows.push({ side: "left", x: axisX1, y: axisY });
    if (upperInfinite) arrows.push({ side: "right", x: axisX2, y: axisY });

    if (segment.lower.kind === "finite") {
      const value = segment.lower.value;
      tickMap.set(value, mergeTick(tickMap.get(value), value, segment.lower.label, scale.valueToPx(value)));
    }
    if (segment.upper.kind === "finite") {
      const value = segment.upper.value;
      tickMap.set(value, mergeTick(tickMap.get(value), value, segment.upper.label, scale.valueToPx(value)));
    }
  }

  return {
    viewBox: { minX: 0, minY: 0, width, height },
    axis: { y: axisY, x1: axisX1, x2: axisX2 },
    domain: { min: domainMin, max: domainMax },
    segments,
    ticks: Array.from(tickMap.values()).sort((a, b) => a.value - b.value),
    arrows,
  };
}
