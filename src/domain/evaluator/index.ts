/**
 * Evaluator dispatcher — routes exercise answers to the correct comparison module.
 * No external dependencies. Pure TypeScript.
 * TDD coverage: src/domain/__tests__/evaluator-index.test.ts.
 */

import type { Exercise } from "../models/exercise";
import { evaluateNumeric } from "./numeric";
import { evaluateExact } from "./exact";
import { evaluateBoolean } from "./boolean";
import { tagError } from "./error-tagging";
import { isFiniteNumericAnswer } from "../utils/numeric";

/** The result of evaluating a student's answer. */
export interface EvaluationResult {
  readonly correct: boolean;
  readonly errorTag?: string;
  readonly feedback?: string;
}

/** Types that require manual review (no automated comparison). */
const MANUAL_REVIEW_TYPES: ReadonlySet<string> = new Set([
  "free-response",
  "graphical",
  "matching",
  "ordering",
]);

/** Result returned when the exercise type is not supported by automated grading. */
const UNSUPPORTED_TYPE_RESULT: EvaluationResult = {
  correct: false,
  errorTag: "unsupported_type",
  feedback: "manual-review",
};

/** Result returned when a numerical exercise has a non-numeric expected answer. */
const CONFIGURATION_ERROR_RESULT: EvaluationResult = {
  correct: false,
  errorTag: "configuration_error",
};

/**
 * Evaluate a student's answer against an exercise's expected answer.
 * Dispatches to the appropriate comparison module based on exercise type.
 *
 * @param exercise - The exercise being answered
 * @param userAnswer - The student's answer
 * @returns EvaluationResult with correctness, optional error tag, and optional feedback
 */
export function evaluateAnswer(
  exercise: Exercise,
  userAnswer: string
): EvaluationResult {
  // Unsupported types require manual review
  if (MANUAL_REVIEW_TYPES.has(exercise.type)) {
    return UNSUPPORTED_TYPE_RESULT;
  }

  // Dispatch to type-specific evaluator
  let result: EvaluationResult;
  switch (exercise.type) {
    case "numerical":
      // Config guard: non-numeric expected answer is a content error, not a student error
      if (!isFiniteNumericAnswer(exercise.expectedAnswer)) {
        return CONFIGURATION_ERROR_RESULT;
      }
      result = evaluateNumeric(exercise.expectedAnswer, userAnswer);
      break;

    case "true-false":
      result = evaluateBoolean(exercise.expectedAnswer, userAnswer);
      break;

    case "symbolic":
    case "fill-blank":
    case "multiple-choice":
      result = evaluateExact(exercise.expectedAnswer, userAnswer);
      break;

    default:
      // Exhaustiveness guard — should never reach here
      return UNSUPPORTED_TYPE_RESULT;
  }

  // For incorrect supported answers, attempt error-tag assignment
  if (!result.correct) {
    const errorTag = tagError(exercise, userAnswer);
    if (errorTag) {
      return { ...result, errorTag };
    }
  }

  return result;
}
