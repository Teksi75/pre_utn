import type {
  CartesianLineData,
  CartesianLineVisual,
  DistanceOnLineVisual,
  PedagogicalVisual,
  Point,
  SignChartVisual,
  SignZone,
  SystemsOfLinesVisual,
  VisualBase,
} from "./types";
import { areLinesCoincident, areLinesParallel, pointSatisfiesLine } from "./layout";

function fail(context: string, detail: string): never {
  throw new Error(`Parse error at ${context}: ${detail}`);
}

function record(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(context, `expected object, got ${typeof value}`);
  }
  return value as Record<string, unknown>;
}

function str(raw: Record<string, unknown>, field: string, context: string): string {
  const v = raw[field];
  if (typeof v !== "string" || v.trim().length === 0) fail(context, `${field} must be a non-empty string`);
  return v;
}

function num(raw: Record<string, unknown>, field: string, context: string): number {
  const v = raw[field];
  if (typeof v !== "number" || !Number.isFinite(v)) fail(context, `${field} must be a finite number`);
  return v;
}

function nums(raw: Record<string, unknown>, field: string, context: string): readonly number[] {
  const v = raw[field];
  if (!Array.isArray(v)) fail(context, `${field} must be an array`);
  return v.map((item, i) => {
    if (typeof item !== "number" || !Number.isFinite(item)) fail(context, `${field}[${i}] must be a finite number`);
    return item;
  });
}

function base(raw: Record<string, unknown>, context: string): VisualBase {
  return {
    id: str(raw, "id", context),
    kind: str(raw, "kind", context),
    title: str(raw, "title", context),
    ariaLabel: str(raw, "ariaLabel", context),
    description: str(raw, "description", context),
  };
}

const DISTANCE_OPS = new Set(["lt", "le", "gt", "ge"]);
const SYSTEM_CLASSES = new Set(["secant", "parallel", "coincident"]);
const LINE_FORMS = new Set(["slope-intercept", "point-slope", "two-point", "horizontal", "vertical"]);

function point(raw: Record<string, unknown>, context: string): Point {
  return { x: num(raw, "x", context), y: num(raw, "y", context) };
}

const SIGNS = new Set(["+", "-"]);

function bound(raw: Record<string, unknown>, field: string, context: string): number | null {
  const v = raw[field];
  if (v === null) return null;
  if (typeof v !== "number" || !Number.isFinite(v)) fail(context, `${field} must be a finite number or null`);
  return v;
}

function signZone(raw: Record<string, unknown>, context: string): SignZone {
  const lowerBound = bound(raw, "lowerBound", context);
  const upperBound = bound(raw, "upperBound", context);
  const sign = str(raw, "sign", context);
  if (!SIGNS.has(sign)) fail(context, `sign must be + or -, got ${sign}`);
  if (lowerBound !== null && upperBound !== null && lowerBound >= upperBound) {
    fail(context, `lowerBound must be strictly less than upperBound`);
  }
  return { lowerBound, upperBound, sign: sign as SignZone["sign"] };
}

function signZones(raw: Record<string, unknown>, field: string, context: string): readonly SignZone[] {
  const v = raw[field];
  if (!Array.isArray(v) || v.length === 0) fail(context, `${field} must be a non-empty array`);
  return v.map((item, i) => signZone(record(item, `${context}.${field}[${i}]`), `${context}.${field}[${i}]`));
}

function lineData(raw: Record<string, unknown>, context: string): CartesianLineData {
  const form = str(raw, "form", context);
  if (!LINE_FORMS.has(form)) fail(context, `invalid form: ${form}`);
  switch (form) {
    case "slope-intercept":
      return { form, slope: num(raw, "slope", context), intercept: num(raw, "intercept", context) };
    case "point-slope":
      return { form, slope: num(raw, "slope", context), point: point(record(raw.point, `${context}.point`), `${context}.point`) };
    case "two-point": {
      const pts = raw.points;
      if (!Array.isArray(pts) || pts.length !== 2) fail(context, "two-point requires exactly 2 points");
      const p1 = point(record(pts[0], `${context}.points[0]`), `${context}.points[0]`);
      const p2 = point(record(pts[1], `${context}.points[1]`), `${context}.points[1]`);
      if (p1.x === p2.x && p1.y === p2.y) fail(context, "two-point points must not be identical");
      return { form, points: [p1, p2] as const };
    }
    case "horizontal":
    case "vertical":
      return { form, constant: num(raw, "constant", context) };
    default:
      fail(context, `unhandled form: ${form}`);
  }
}

function signChart(raw: Record<string, unknown>, b: VisualBase, ctx: string): SignChartVisual {
  const variable = str(raw, "variable", ctx);
  const expression = str(raw, "expression", ctx);
  const zeros = nums(raw, "zeros", ctx);
  const excludedPoints = nums(raw, "excludedPoints", ctx);
  const zones = signZones(raw, "signZones", ctx);

  const zeroSet = new Set(zeros);
  if (zeroSet.size !== zeros.length) fail(ctx, "zeros contains duplicates");
  const excludedSet = new Set(excludedPoints);
  if (excludedSet.size !== excludedPoints.length) fail(ctx, "excludedPoints contains duplicates");

  for (const z of zeros) {
    if (excludedSet.has(z)) fail(ctx, `zero ${z} overlaps with excluded points`);
  }

  const criticalPoints = Array.from(new Set([...zeros, ...excludedPoints])).sort((a, b) => a - b);
  const expectedZones = criticalPoints.length + 1;
  if (zones.length !== expectedZones) {
    fail(ctx, `expected ${expectedZones} signZones for ${criticalPoints.length} critical points, got ${zones.length}`);
  }

  for (let i = 0; i < zones.length; i++) {
    const expectedLower = i === 0 ? null : criticalPoints[i - 1];
    const expectedUpper = i === criticalPoints.length ? null : criticalPoints[i];
    const zone = zones[i];
    if (zone.lowerBound !== expectedLower || zone.upperBound !== expectedUpper) {
      fail(ctx, `signZones[${i}] bounds do not match critical point topology: expected (${expectedLower}, ${expectedUpper})`);
    }
  }

  return {
    ...b,
    kind: "sign-chart",
    variable,
    expression,
    zeros: zeros.slice().sort((a, b) => a - b),
    excludedPoints: excludedPoints.slice().sort((a, b) => a - b),
    criticalPoints,
    signZones: zones,
  };
}

function distanceOnLine(raw: Record<string, unknown>, b: VisualBase, ctx: string): DistanceOnLineVisual {
  const ineq = str(raw, "inequality", ctx);
  if (!DISTANCE_OPS.has(ineq)) fail(ctx, `invalid inequality: ${ineq}`);
  const distance = num(raw, "distance", ctx);
  if (distance <= 0) fail(ctx, `distance must be positive, got ${distance}`);
  return { ...b, kind: "distance-on-line", center: num(raw, "center", ctx), distance, inequality: ineq as DistanceOnLineVisual["inequality"] };
}

function cartesianLine(raw: Record<string, unknown>, b: VisualBase, ctx: string): CartesianLineVisual {
  return { ...b, kind: "cartesian-line", ...lineData(raw, ctx) };
}

function systemsOfLines(raw: Record<string, unknown>, b: VisualBase, ctx: string): SystemsOfLinesVisual {
  const cls = str(raw, "classification", ctx);
  if (!SYSTEM_CLASSES.has(cls)) fail(ctx, `invalid classification: ${cls}`);
  const linesRaw = raw.lines;
  if (!Array.isArray(linesRaw) || linesRaw.length !== 2) fail(ctx, "systems-of-lines requires exactly 2 lines");
  const lines: readonly [CartesianLineData, CartesianLineData] = [
    lineData(record(linesRaw[0], `${ctx}.lines[0]`), `${ctx}.lines[0]`),
    lineData(record(linesRaw[1], `${ctx}.lines[1]`), `${ctx}.lines[1]`),
  ];

  const coincident = areLinesCoincident(lines[0], lines[1]);
  const parallel = areLinesParallel(lines[0], lines[1]);
  const baseResult = { ...b, kind: "systems-of-lines" as const, lines };

  if (cls === "parallel") {
    if (coincident) fail(ctx, "parallel classification requires non-coincident lines");
    if (!parallel) fail(ctx, "parallel classification requires parallel lines");
    if (raw.intersection !== undefined) fail(ctx, "parallel lines must not declare an intersection");
    return { ...baseResult, classification: "parallel" as const };
  }

  if (cls === "coincident") {
    if (!coincident) fail(ctx, "coincident classification requires coincident lines");
    if (raw.intersection !== undefined) fail(ctx, "coincident lines must not declare an intersection");
    return { ...baseResult, classification: "coincident" as const };
  }

  // cls === "secant"
  if (parallel) fail(ctx, "secant classification requires non-parallel lines");
  const intersectionRaw = raw.intersection;
  if (intersectionRaw === undefined) fail(ctx, "secant system requires intersection");
  const intersection = point(record(intersectionRaw, `${ctx}.intersection`), `${ctx}.intersection`);
  if (!pointSatisfiesLine(intersection, lines[0]) || !pointSatisfiesLine(intersection, lines[1])) {
    fail(ctx, "declared intersection does not satisfy both lines");
  }
  return { ...baseResult, classification: "secant" as const, intersection };
}

export function parsePedagogicalVisual(raw: unknown, context = "visual"): PedagogicalVisual {
  const r = record(raw, context);
  const b = base(r, context);
  switch (b.kind) {
    case "sign-chart": return signChart(r, b, context);
    case "distance-on-line": return distanceOnLine(r, b, context);
    case "cartesian-line": return cartesianLine(r, b, context);
    case "systems-of-lines": return systemsOfLines(r, b, context);
    default: fail(context, `unsupported kind: ${b.kind}`);
  }
}

export function parseOptionalVisualExamples(raw: unknown, context: string): readonly PedagogicalVisual[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) fail(context, "visualExamples must be an array when present");
  if (raw.length === 0) return undefined;
  return raw.map((item, i) => parsePedagogicalVisual(item, `${context}.visualExamples[${i}]`));
}
