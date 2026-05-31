/**
 * Feedback engine — maps correctness + error tags to pedagogical feedback.
 * No external dependencies. Pure TypeScript.
 */

/** A mapping from error tag to feedback type and message. */
export interface FeedbackMapping {
  readonly errorTag: string;
  readonly type: "corrective" | "conceptual" | "procedural";
  readonly message: string;
  readonly recoveryTarget?: string;
}

/** Generated feedback result. */
export interface Feedback {
  readonly type: "corrective" | "conceptual" | "procedural";
  readonly message: string;
}

const CORRECT_MESSAGE = "¡Correcto! Seguí practicando para afianzar.";

const GENERAL_RETRY_MESSAGE =
  "Revisá tu proceso. Identificá en qué paso estás cometiendo el error y volvé a intentar.";

/**
 * Generate feedback from correctness and optional error tag.
 *
 * @param correct - Whether the answer was correct
 * @param errorTag - Optional error tag from evaluation
 * @param mappings - Available feedback mappings for this content
 * @returns Feedback with type and message
 */
export function generateFeedback(
  correct: boolean,
  errorTag: string | undefined,
  mappings: readonly FeedbackMapping[]
): Feedback {
  if (correct) {
    return { type: "corrective", message: CORRECT_MESSAGE };
  }

  // Try to find a matching mapping for the error tag
  if (errorTag) {
    const mapping = mappings.find((m) => m.errorTag === errorTag);
    if (mapping) {
      return { type: mapping.type, message: mapping.message };
    }
  }

  // Fallback: general retry guidance
  return { type: "corrective", message: GENERAL_RETRY_MESSAGE };
}
