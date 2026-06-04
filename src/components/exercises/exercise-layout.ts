import type { ExerciseType } from "@/domain/models/exercise";

/**
 * Returns the CSS class string for the options fieldset/list container.
 *
 * Multiple-choice exercises use a 2-column grid on sm+ screens so that
 * math options (e.g. "N, Z, Q, y R") sit side-by-side instead of stacking.
 * All other selectable types (true-false) and non-selectable types remain
 * single-column stacked.
 */
export function optionsContainerClassName(
  exerciseType: ExerciseType
): string {
  if (exerciseType === "multiple-choice") {
    return "grid grid-cols-1 sm:grid-cols-2 gap-2";
  }
  return "space-y-2";
}

/**
 * Returns the CSS class string for an individual option label wrapper.
 *
 * Adds `min-w-0` to prevent inline KaTeX/math content from overflowing
 * grid cells on desktop.
 */
export function optionLabelClassName(): string {
  return "min-w-0";
}

/**
 * Returns the CSS class string for the legend/label of the options fieldset.
 * Preserves existing editorial token styling.
 */
export function optionsLegendClassName(): string {
  return "text-sm font-semibold text-brand-700 mb-2";
}
