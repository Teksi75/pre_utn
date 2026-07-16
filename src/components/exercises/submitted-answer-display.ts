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
 * Try to parse a structured (canonical JSON v1) submission and render it
 * as one or more human-readable rows. Returns null when the input is not
 * a structured v1 envelope (e.g. a numerical or MC submission string).
 *
 * Two kinds are supported:
 *   - `pi-rational`: returns Coeficiente (`n/d`) + Decimal rows
 *   - `angle-dms`:   returns Grados / Minutos / Segundos rows
 */
function parseStructuredRows(submittedAnswer: string): DisplayRow[] | null {
  let value: unknown;
  try {
    value = JSON.parse(submittedAnswer);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const obj = value as Record<string, unknown>;
  if (obj.v !== 1) return null;

  if (obj.kind === "pi-rational") {
    const num = obj.numerator;
    const den = obj.denominator;
    const dec = obj.decimal;
    if (typeof num !== "number" || typeof den !== "number" || typeof dec !== "number") {
      return null;
    }
    return [
      { label: "Coeficiente", value: `${num}/${den}` },
      { label: "Decimal", value: String(dec) },
    ];
  }

  if (obj.kind === "angle-dms") {
    const d = obj.degrees;
    const m = obj.minutes;
    const s = obj.seconds;
    if (typeof d !== "number" || typeof m !== "number" || typeof s !== "number") {
      return null;
    }
    return [
      { label: "Grados", value: `${d}°` },
      { label: "Minutos", value: `${m}′` },
      { label: "Segundos", value: `${s}″` },
    ];
  }

  return null;
}

/**
 * Map a submitted answer to display rows suitable for a read-only view.
 *
 * - structured (pi-rational): renders Coeficiente (`n/d`) + Decimal
 * - structured (angle-dms):   renders Grados / Minutos / Segundos
 * - true-false: maps `"true"` → `"Verdadero"`, `"false"` → `"Falso"`
 * - multiple-choice: resolves the stored value back to its option label
 *   (handles shuffle correctly). Falls back to the raw value when the
 *   option is not found in the exercise.
 * - text types (numerical, fill-blank): single row with label "Respuesta"
 * - graphical, matching, ordering: single row with label "Respuesta"
 *
 * @param exercise - The exercise the student answered
 * @param submittedAnswer - The raw answer string submitted by the student
 * @returns Display rows (currently always a single-element array for
 *          non-structured types, multiple rows for structured)
 */
export function mapSubmittedAnswer(
  exercise: Exercise,
  submittedAnswer: string,
): DisplayRow[] {
  // Structured answer → multi-row read-only display. The parse is
  // defensive: a malformed structured submission falls through to the
  // default single-row "Respuesta" display.
  if (exercise.type === "structured") {
    const structuredRows = parseStructuredRows(submittedAnswer);
    if (structuredRows) return structuredRows;
  }

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
      // Text types (numerical, fill-blank) +
      // graphical, matching, ordering — all get "Respuesta"
      return [{ label: DEFAULT_ANSWER_LABEL, value: submittedAnswer }];
    }
  }
}