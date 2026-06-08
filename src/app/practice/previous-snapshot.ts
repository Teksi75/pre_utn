import type { Exercise } from "@/domain/models/exercise";
import type { EvaluationResult } from "@/domain/evaluator/index";

/** Session-scoped read-only snapshot of a completed exercise submission. */
export interface PreviousExerciseSnapshot {
  readonly exercise: Exercise;
  readonly submittedAnswer: string;
  readonly evaluation: EvaluationResult;
  readonly feedback: string;
}

/** Controlled draft state for the current exercise's answer input. */
export interface ExerciseDraftState {
  readonly answer: string;
  readonly selectedOption: string | null;
}

/**
 * Create a read-only snapshot of a completed exercise submission.
 * Pure function — no side effects. Called inside `handleAnswerSubmit`
 * before the answer string is discarded and the phase transitions
 * to feedback.
 */
export function createPreviousExerciseSnapshot(
  exercise: Exercise,
  submittedAnswer: string,
  evaluation: EvaluationResult,
  feedback: string,
): PreviousExerciseSnapshot {
  return { exercise, submittedAnswer, evaluation, feedback };
}
