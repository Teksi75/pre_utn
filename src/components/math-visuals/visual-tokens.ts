/**
 * Shared visual tokens for pedagogical number-line and cartesian visuals.
 *
 * Centralizing stroke/fill/className values keeps the three renderer variants
 * (sign-chart, distance-on-line, interval-set) consistent and makes future
 * theme updates safer.
 */

export const AXIS_STROKE = "var(--color-brand-400)";
export const AXIS_STROKE_WIDTH = 2;

export const TICK_STROKE = "var(--color-brand-400)";
export const TICK_STROKE_WIDTH = 1.5;
export const TICK_SIZE = 6;

export const TICK_LABEL_FILL = "var(--color-brand-600)";
export const TICK_LABEL_CLASS = "text-[12px]";

export const REGION_STROKE = "var(--color-accent-600)";
export const REGION_STROKE_WIDTH = 6;

export const ENDPOINT_STROKE = "var(--color-accent-600)";
export const CLOSED_ENDPOINT_FILL = "var(--color-accent-600)";
export const OPEN_ENDPOINT_FILL = "#ffffff";
export const ENDPOINT_RADIUS = 5;

export const NOTATION_FILL = "var(--color-brand-900)";
export const NOTATION_CLASS = "text-[15px] font-semibold";
