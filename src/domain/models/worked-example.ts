/**
 * Worked example model — step-by-step solution demonstrations.
 * No external dependencies. Pure TypeScript.
 */

import type { Result } from "./result";
import { ok, err } from "./result";
import type { SkillId } from "./skill";
import type { CanonicalTrace } from "./theory";

export type { CanonicalTrace } from "./theory";

/** A single step in a worked example solution. */
export interface SolutionStep {
  readonly order: number;
  readonly explanation: string;
}

/** A worked example — a complete step-by-step solution for a skill. */
export interface WorkedExample {
  readonly id: string;
  readonly skillId: SkillId;
  readonly problem: string;
  readonly steps: readonly SolutionStep[];
  readonly finalAnswer: string;
  readonly pedagogicalNote: string;
  readonly canonicalTrace: readonly CanonicalTrace[];
}

/** Validation error with field and message. */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
}

/**
 * Validate a worked example.
 *
 * @param input - The worked example to validate
 * @returns Ok<WorkedExample> on success, Err<ValidationError> on failure
 */
export function validateWorkedExample(
  input: WorkedExample
): Result<WorkedExample, ValidationError> {
  // Validate id
  if (!input.id || input.id.trim().length === 0) {
    return err({ field: "id", message: "id is required" });
  }

  // Validate problem
  if (!input.problem || input.problem.trim().length === 0) {
    return err({ field: "problem", message: "problem is required" });
  }

  // Validate steps: at least 2 (not shallow)
  if (!input.steps || input.steps.length < 2) {
    return err({ field: "steps", message: "steps must have at least 2 entries (worked reasoning required)" });
  }

  // Validate step ordering: sequential starting at 1
  const sortedSteps = [...input.steps].sort((a, b) => a.order - b.order);
  for (let i = 0; i < sortedSteps.length; i++) {
    if (sortedSteps[i].order !== i + 1) {
      return err({
        field: "steps",
        message: `Steps must be sequential starting at 1. Found order ${sortedSteps[i].order} at position ${i + 1}`,
      });
    }
  }

  // Validate finalAnswer
  if (!input.finalAnswer || input.finalAnswer.trim().length === 0) {
    return err({ field: "finalAnswer", message: "finalAnswer is required" });
  }

  // Validate canonicalTrace
  if (!input.canonicalTrace || input.canonicalTrace.length === 0) {
    return err({ field: "canonicalTrace", message: "canonicalTrace must have at least one entry" });
  }

  return ok(input);
}
