/**
 * Evaluator dispatcher — routes exercise answers to the correct comparison module.
 * No external dependencies. Pure TypeScript.
 * TDD coverage: src/domain/__tests__/evaluator-index.test.ts and
 * src/domain/__tests__/structured-evaluator.test.ts.
 */

import type { EvaluableExercise } from "../models/exercise";
import { evaluateNumeric } from "./numeric";
import { evaluateExact } from "./exact";
import { evaluateBoolean } from "./boolean";
import { tagError } from "./error-tagging";
import { isFiniteNumericAnswer } from "../utils/numeric";
import {
  parseStructuredSubmissionV1,
  evaluateStructuredAnswer,
} from "./structured";

/** The result of evaluating a student's answer. */
export interface EvaluationResult {
  readonly correct: boolean;
  readonly errorTag?: string;
  readonly feedback?: string;
}

/** Types that require manual review (no automated comparison). */
const MANUAL_REVIEW_TYPES: ReadonlySet<string> = new Set([
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
 * Accepts the structural `EvaluableExercise` contract so both general
 * (`Exercise`) and challenge (`ChallengeExercise`) surfaces can be
 * evaluated without being mutually assignable.
 *
 * @param exercise - The exercise being answered
 * @param userAnswer - The student's answer
 * @returns EvaluationResult with correctness, optional error tag, and optional feedback
 */
export function evaluateAnswer(
  exercise: EvaluableExercise,
  userAnswer: string
): EvaluationResult {
  // Unsupported types require manual review
  if (MANUAL_REVIEW_TYPES.has(exercise.type)) {
    return UNSUPPORTED_TYPE_RESULT;
  }

  // Dispatch to type-specific evaluator
  let result: EvaluationResult;

  switch (exercise.type) {
    case "structured": {
      // Structured branch runs FIRST (before numerical/true-false/etc.).
      // The expected spec is validated at load time; if it is missing
      // here we treat it as a configuration error (the student cannot
      // recover from a malformed expected spec).
      if (!exercise.answerSpec) {
        return CONFIGURATION_ERROR_RESULT;
      }
      let parsed: ReturnType<typeof parseStructuredSubmissionV1>;
      try {
        parsed = parseStructuredSubmissionV1(userAnswer);
      } catch {
        // Malformed submission → incorrect, never a runtime error.
        result = { correct: false, feedback: "submission-malformed" };
        if (!result.correct) {
          const errorTag = tagError(exercise, userAnswer);
          if (errorTag) {
            return { ...result, errorTag };
          }
        }
        return result;
      }
      // Re-shape the parsed envelope into the dispatcher input shape.
      if (parsed.kind === "pi-rational") {
        result = evaluateStructuredAnswer(exercise.answerSpec, {
          numerator: parsed.numerator,
          denominator: parsed.denominator,
          decimal: parsed.decimal,
        });
      } else {
        result = evaluateStructuredAnswer(exercise.answerSpec, {
          degrees: parsed.degrees,
          minutes: parsed.minutes,
          seconds: parsed.seconds,
        });
      }
      break;
    }

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
