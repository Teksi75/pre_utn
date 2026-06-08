/**
 * Interval SVG Layout — pure computation for number line rendering.
 * No React or DOM dependencies. Pure TypeScript.
 *
 * Computes positions, ticks, and endpoint states for SVG rendering.
 */

import type { IntervalRepresentation, IntervalBound, EndpointInclusion } from "./representation";
import { formatIntervalRepresentation, generateAriaLabel } from "./representation";

/** SVG constants for layout computation. */
const SVG_WIDTH = 520;
const SVG_HEIGHT = 128;
const LINE_START = 52;
const LINE_END = 468;
const AXIS_Y = 66;
const TICK_TOP = 58;
const TICK_BOTTOM = 74;

/** A computed tick mark on the number line. */
export interface TickMark {
  readonly value: number;
  readonly x: number;
  readonly label: string;
}

/** Endpoint rendering state. */
export type EndpointState =
  | { readonly kind: "finite"; readonly x: number; readonly closed: boolean }
  | { readonly kind: "infinity" };

/** Computed layout for interval SVG rendering. */
export interface IntervalSvgLayout {
  readonly isValid: boolean;
  readonly formattedNotation: string;
  readonly ariaLabel: string;
  readonly ticks: readonly TickMark[];
  readonly leftEndpoint: EndpointState;
  readonly rightEndpoint: EndpointState;
  readonly showLeftArrow: boolean;
  readonly showRightArrow: boolean;
  readonly segmentStartX: number;
  readonly segmentEndX: number;
}

/**
 * Compute SVG layout for an interval representation.
 *
 * @param rep - The interval representation
 * @returns Computed layout for rendering
 */
export function computeIntervalSvgLayout(rep: IntervalRepresentation): IntervalSvgLayout {
  const formattedNotation = formatIntervalRepresentation(rep);
  const ariaLabel = generateAriaLabel(rep);

  // Determine range for ticks
  const finiteValues = extractFiniteValues(rep);
  const { min, max } = computeRange(finiteValues);

  // Compute tick positions
  const ticks = computeTicks(min, max);

  // Compute coordinate mapping
  const toX = (value: number): number =>
    LINE_START + ((value - min) / (max - min)) * (LINE_END - LINE_START);

  // Compute endpoint states
  const leftEndpoint = computeLeftEndpoint(rep.lower, rep.lowerInclusion, toX, min);
  const rightEndpoint = computeRightEndpoint(rep.upper, rep.upperInclusion, toX, max);

  // Compute segment boundaries
  const segmentStartX = rep.lower.kind === "finite" ? toX(rep.lower.value) : LINE_START;
  const segmentEndX = rep.upper.kind === "finite" ? toX(rep.upper.value) : LINE_END;

  return {
    isValid: true,
    formattedNotation,
    ariaLabel,
    ticks,
    leftEndpoint,
    rightEndpoint,
    showLeftArrow: rep.lower.kind === "infinity",
    showRightArrow: rep.upper.kind === "infinity",
    segmentStartX,
    segmentEndX,
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function extractFiniteValues(rep: IntervalRepresentation): number[] {
  const values: number[] = [];
  if (rep.lower.kind === "finite") values.push(rep.lower.value);
  if (rep.upper.kind === "finite") values.push(rep.upper.value);
  return values;
}

function computeRange(finiteValues: number[]): { min: number; max: number } {
  if (finiteValues.length === 0) return { min: -4, max: 4 };

  const minValue = Math.min(...finiteValues);
  const maxValue = Math.max(...finiteValues);
  return {
    min: Math.min(minValue - 2, -1),
    max: Math.max(maxValue + 2, 1),
  };
}

function computeTicks(min: number, max: number): TickMark[] {
  const start = Math.ceil(min);
  const end = Math.floor(max);
  const ticks: TickMark[] = [];

  for (let value = start; value <= end; value++) {
    const x = LINE_START + ((value - min) / (max - min)) * (LINE_END - LINE_START);
    ticks.push({
      value,
      x,
      label: formatTickLabel(value),
    });
  }

  return ticks;
}

function formatTickLabel(value: number): string {
  return String(value).replace("-", "−");
}

function computeLeftEndpoint(
  bound: IntervalBound,
  inclusion: EndpointInclusion,
  toX: (value: number) => number,
  min: number
): EndpointState {
  if (bound.kind === "infinity") {
    return { kind: "infinity" };
  }
  return {
    kind: "finite",
    x: toX(bound.value),
    closed: inclusion === "closed",
  };
}

function computeRightEndpoint(
  bound: IntervalBound,
  inclusion: EndpointInclusion,
  toX: (value: number) => number,
  max: number
): EndpointState {
  if (bound.kind === "infinity") {
    return { kind: "infinity" };
  }
  return {
    kind: "finite",
    x: toX(bound.value),
    closed: inclusion === "closed",
  };
}
