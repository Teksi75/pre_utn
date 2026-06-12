import type { Exercise, ExerciseOption } from "@/domain/models/exercise";
import { getOptionLabel, getOptionValue } from "./exercise-option-shuffle";

/** A single display row for the submitted answer table. */
export interface DisplayRow {
  readonly label: string;
  readonly value: string;
}

const TRUE_LABEL = "Verdadero";
const FALSE_LABEL = "Falso";
const DEFAULT_ANSWER_LABEL = "Respuesta";

/**
 * Look up a submitted value in the exercise options and return its
 * display label. Falls back to the raw value when the option is not
 * found (defensive edge case or corrupted data).
 */
function resolveOptionLabel(
  options: readonly ExerciseOption[] | undefined,
  submittedValue: string,
): string {
  if (!options) return submittedValue;
  for (const option of options) {
    if (getOptionValue(option) === submittedValue) {
      return getOptionLabel(option);
    }
  }
  return submittedValue;
}

/**
 * Map a submitted answer to display rows suitable for a read-only view.
 *
 * - true-false: maps `"true"` → `"Verdadero"`, `"false"` → `"Falso"`
 * - multiple-choice: resolves the stored value back to its option label
 *   (handles shuffle correctly). Falls back to the raw value when the
 *   option is not found in the exercise.
 * - text types (numerical, fill-blank): single row with label "Respuesta"
 * - graphical, matching, ordering: single row with label "Respuesta"
 *
 * @param exercise - The exercise the student answered
 * @param submittedAnswer - The raw answer string submitted by the student
 * @returns Display rows (currently always a single-element array)
 */
export function mapSubmittedAnswer(
  exercise: Exercise,
  submittedAnswer: string,
): DisplayRow[] {
  switch (exercise.type) {
    case "true-false": {
      const label =
        submittedAnswer === "true" ? TRUE_LABEL : FALSE_LABEL;
      return [{ label, value: submittedAnswer }];
    }

    case "multiple-choice": {
      const label = resolveOptionLabel(exercise.options, submittedAnswer);
      return [{ label, value: submittedAnswer }];
    }

    default: {
      // Text types (numerical, symbolic, fill-blank) +
      // graphical, matching, ordering — all get "Respuesta"
      return [{ label: DEFAULT_ANSWER_LABEL, value: submittedAnswer }];
    }
  }
}
