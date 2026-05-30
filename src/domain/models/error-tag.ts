/**
 * ErrorTag model — normalized mathematics error tags.
 * No external dependencies. Pure TypeScript.
 */

import type { Result } from "./result";
import { ok, err } from "./result";

/** Error tag ID format: u{1-6}_{slug} */
export type ErrorTagId = `u${1 | 2 | 3 | 4 | 5 | 6}_${string}`;

/** Unit number: 1 through 6. */
export type ErrorUnit = 1 | 2 | 3 | 4 | 5 | 6;

/** A validated error tag. */
export interface ErrorTag {
  readonly id: ErrorTagId;
  readonly unit: ErrorUnit;
  readonly description: string;
  readonly examples: readonly string[];
}

/** Validation error with field and message. */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
}

const ERROR_TAG_ID_PATTERN = /^u([1-6])_(.+)$/;

/**
 * Validate an error tag object.
 *
 * @param input - The error tag to validate
 * @returns Ok<ErrorTag> on success, Err<ValidationError> on failure
 */
export function validateErrorTag(input: ErrorTag): Result<ErrorTag, ValidationError> {
  // Validate ID format
  const idMatch = ERROR_TAG_ID_PATTERN.exec(input.id);
  if (!idMatch) {
    return err({ field: "id", message: `Invalid error tag ID format: ${input.id}. Expected u{1-6}_{slug}` });
  }

  // Validate unit matches the ID
  const idUnit = Number(idMatch[1]) as ErrorUnit;
  if (input.unit !== idUnit) {
    return err({ field: "unit", message: `Unit ${input.unit} does not match ID unit ${idUnit}` });
  }

  // Validate unit is in range
  if (input.unit < 1 || input.unit > 6) {
    return err({ field: "unit", message: `Unit must be 1-6, got ${input.unit}` });
  }

  // Validate description
  if (!input.description || input.description.trim().length === 0) {
    return err({ field: "description", message: "description is required and must be non-empty" });
  }

  // Validate examples
  if (!input.examples || input.examples.length === 0) {
    return err({ field: "examples", message: "examples must have at least one entry" });
  }

  return ok(input);
}
