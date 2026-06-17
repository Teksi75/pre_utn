"use client";

import { Button } from "@/components/ui/Button";
import { RichText } from "@/components/math/RichText";
import type { EvaluationResult } from "@/domain/evaluator/index";

interface ChallengeFeedbackProps {
  /** The exercise being answered (for display context) */
  exerciseId: string;
  /** The evaluation result from the evaluator */
  evaluation: EvaluationResult;
  /** The pedagogical note for this challenge */
  pedagogicalNote: string;
  /** Called when the user wants to continue (next challenge or done) */
  onContinue?: () => void;
  /** Label for the continue button (varies: next challenge vs volver al selector) */
  continueLabel?: string;
}

/**
 * Shows challenge feedback:
 * - Correct/incorrect result
 * - Pedagogical note (key value of the challenge — shown for BOTH correct and incorrect)
 * - Error tag category when present (for incorrect answers)
 * - Continue button
 *
 * Similar to PracticeFeedbackPhase but isolated for the challenge flow.
 * Does NOT show expectedAnswer.
 * Does NOT call base addAttempt.
 */
export function ChallengeFeedback({
  evaluation,
  pedagogicalNote,
  onContinue,
  continueLabel = "Siguiente desafío",
}: ChallengeFeedbackProps) {
  return (
    <div className="space-y-4" aria-live="polite" aria-atomic="false">
      {/* Result banner */}
      <div
        role="status"
        className={`rounded-[var(--radius-card)] p-4 border ${
          evaluation.correct
            ? "bg-green-50 border-green-300"
            : "bg-red-50 border-red-300"
        }`}
      >
        <div
          className={`font-semibold ${
            evaluation.correct ? "text-green-800" : "text-red-800"
          }`}
        >
          {evaluation.correct ? "¡Correcto!" : "Incorrecto"}
        </div>
      </div>

      {/* Pedagogical note — shown for both correct and incorrect */}
      <div className="rounded-[var(--radius-card)] border border-brand-200 bg-brand-50 p-4">
        <p className="text-sm text-brand-700">
          <RichText text={pedagogicalNote} />
        </p>
      </div>

      {/* Error tag (only for incorrect) */}
      {!evaluation.correct && evaluation.errorTag && (
        <div className="rounded-[var(--radius-card)] border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">Categoría del error:</p>
          <p className="text-sm text-red-600">{evaluation.errorTag}</p>
        </div>
      )}

      {/* Continue button */}
      {onContinue && (
        <Button variant="secondary" onClick={onContinue} className="w-full">
          {continueLabel}
        </Button>
      )}
    </div>
  );
}
