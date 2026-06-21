export interface VisualBase {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly ariaLabel: string;
  readonly description: string;
}

export interface SignZone {
  readonly lowerBound: number | null;
  readonly upperBound: number | null;
  // A sign zone is an open interval between critical points.
  // Zero belongs at a critical point (zeros/excludedPoints), not inside a zone.
  readonly sign: "+" | "-";
}

export interface SignChartVisual extends VisualBase {
  readonly kind: "sign-chart";
  readonly variable: string;
  readonly expression: string;
  readonly zeros: readonly number[];
  readonly excludedPoints: readonly number[];
  readonly criticalPoints: readonly number[];
  readonly signZones: readonly SignZone[];
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

interface CartesianLineBase extends VisualBase {
  readonly kind: "cartesian-line";
}

export interface SlopeInterceptLine extends CartesianLineBase {
  readonly form: "slope-intercept";
  readonly slope: number;
  readonly intercept: number;
}

export interface PointSlopeLine extends CartesianLineBase {
  readonly form: "point-slope";
  readonly slope: number;
  readonly point: Point;
}

export interface TwoPointLine extends CartesianLineBase {
  readonly form: "two-point";
  readonly points: readonly [Point, Point];
}

export interface HorizontalLine extends CartesianLineBase {
  readonly form: "horizontal";
  readonly constant: number;
}

export interface VerticalLine extends CartesianLineBase {
  readonly form: "vertical";
  readonly constant: number;
}

export type CartesianLineVisual =
  | SlopeInterceptLine
  | PointSlopeLine
  | TwoPointLine
  | HorizontalLine
  | VerticalLine;

type DistributiveOmit<T, K extends PropertyKey> = T extends never ? never : Omit<T, K>;

export type CartesianLineData = DistributiveOmit<CartesianLineVisual, keyof VisualBase>;

export interface DistanceOnLineVisual extends VisualBase {
  readonly kind: "distance-on-line";
  readonly center: number;
  readonly distance: number;
  readonly inequality: "lt" | "le" | "gt" | "ge";
}

interface SystemsOfLinesVisualBase extends VisualBase {
  readonly kind: "systems-of-lines";
  readonly lines: readonly [CartesianLineData, CartesianLineData];
}

export interface SecantSystemsOfLinesVisual extends SystemsOfLinesVisualBase {
  readonly classification: "secant";
  readonly intersection: Point;
}

export interface ParallelSystemsOfLinesVisual extends SystemsOfLinesVisualBase {
  readonly classification: "parallel";
}

export interface CoincidentSystemsOfLinesVisual extends SystemsOfLinesVisualBase {
  readonly classification: "coincident";
}

import type { EndpointInclusion, IntervalBound } from "../intervals/representation";

export type SystemsOfLinesVisual =
  | SecantSystemsOfLinesVisual
  | ParallelSystemsOfLinesVisual
  | CoincidentSystemsOfLinesVisual;

export interface IntervalSegment {
  readonly lower: IntervalBound;
  readonly upper: IntervalBound;
  readonly lowerInclusion: EndpointInclusion;
  readonly upperInclusion: EndpointInclusion;
}

export interface IntervalSetVisual extends VisualBase {
  readonly kind: "interval-set";
  readonly notation: string;
  readonly setBuilderLabel?: string;
  readonly intervals: readonly IntervalSegment[];
}

export type PedagogicalVisual =
  | SignChartVisual
  | DistanceOnLineVisual
  | CartesianLineVisual
  | SystemsOfLinesVisual
  | IntervalSetVisual;
