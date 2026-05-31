/**
 * Practice phase machine — pure transition logic for the guided practice flow.
 * No React, no side effects. Pure TypeScript.
 */

/** All possible practice phases in the guided flow. */
export type PracticePhase =
  | "select"
  | "theory"
  | "example"
  | "exercise"
  | "feedback"
  | "recovery";

/**
 * Determine the next phase based on current state.
 *
 * @param current - Current practice phase
 * @param errorTag - Error tag from the most recent evaluation (if feedback phase)
 * @param lastExercise - Whether this was the last exercise in the queue
 * @returns The next phase to transition to
 */
export function nextPhase(
  current: PracticePhase,
  errorTag: string | null,
  lastExercise: boolean
): PracticePhase {
  switch (current) {
    case "select":
      return "theory";

    case "theory":
      return "example";

    case "example":
      return "exercise";

    case "exercise":
      return "feedback";

    case "feedback":
      // If there was a tagged error, show recovery guidance
      if (errorTag) return "recovery";
      // Otherwise go to next exercise or back to select
      return lastExercise ? "select" : "exercise";

    case "recovery":
      return lastExercise ? "select" : "exercise";
  }
}
