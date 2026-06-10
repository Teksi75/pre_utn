"use client";

import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { MathWatermark } from "@/components/math-visuals/MathWatermark";
import { ExerciseCard } from "@/components/practice/ExerciseCard";
import { FeedbackDisplay } from "@/components/practice/FeedbackDisplay";
import { SubmittedAnswerDisplay } from "@/components/exercises/SubmittedAnswerDisplay";
import type { Exercise } from "@/domain/models/exercise";
import type { EvaluationResult } from "@/domain/evaluator/index";
import type { PreviousExerciseSnapshot } from "@/app/practice/previous-snapshot";

// ---------------------------------------------------------------------------
// Pure render-decision helpers (tested, no side effects)
// ---------------------------------------------------------------------------

/**
 * Whether the retry button should be rendered in the feedback phase.
 * Requires: wrong answer + under the attempt cap + a handler is wired.
 */
export function shouldShowRetryButton(
  correct: boolean,
  canRetry: boolean,
  hasOnRetry: boolean,
): boolean {
  return !correct && canRetry && hasOnRetry;
}

/**
 * Whether the warm legend (gentle nudge to move on) should appear.
 * Shown when the student is wrong AND has exhausted the retry cap.
 */
export function shouldShowWarmLegend(
  correct: boolean,
  canRetry: boolean,
): boolean {
  return !correct && !canRetry;
}

/** Exact text per spec — do not paraphrase. */
export const WARM_LEGEND_TEXT =
  "Parecés estar con la cabeza en otro lado. Pasemos al siguiente y volvé a este después si querés.";

// ---------------------------------------------------------------------------

interface PracticeFeedbackPhaseProps {
  exercise: Exercise;
  skillId?: string;
  evaluation: EvaluationResult;
  feedback: string;
  hasErrorTag: boolean;
  hasNextExercise: boolean;
  onContinue: () => void;
  onBack: () => void;
  /** Session-scoped snapshot of the immediately previous submitted exercise. */
  previousSnapshot?: PreviousExerciseSnapshot | null;
  /** Whether the student is viewing the previous exercise (read-only). */
  isViewingPreviousExercise?: boolean;
  /** Switch to the read-only previous exercise view. */
  onViewPrevious?: () => void;
  /** Return to the feedback view from the previous view. */
  onReturnToCurrent?: () => void;
  // ── PR2: retry support ───────────────────────────────────────────
  /** Handler to retry the current exercise (resets to exercise phase). */
  onRetry?: () => void;
  /** 1-indexed attempt counter for the current exercise (1 = first try). */
  attemptIndex?: number;
  /** Whether the student is still within the retry cap for this exercise. */
  canRetry?: boolean;
}

const prevButtonClassName =
  "inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 border border-brand-300 bg-white px-3 py-1.5 rounded-[var(--radius-button)] min-h-[36px] hover:bg-brand-50 hover:border-brand-400 transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]";

/**
 * Feedback phase: shows the exercise + correctness feedback after the
 * learner submits an answer. The continue button label adapts to the
 * outcome (error → recovery; correct + more → next; correct + last → done).
 *
 * When the answer is incorrect, a "← Volver al enunciado" button lets the
 * student review the previous exercise submission without leaving the
 * feedback context.
 *
 * PR2: Adds a "Reintentar este ejercicio" button (secondary) when the
 * answer is wrong and the retry cap hasn't been reached. When the cap IS
 * reached, shows a warm legend nudging the student to advance.
 */
export function PracticeFeedbackPhase({
  exercise,
  skillId,
  evaluation,
  feedback,
  hasErrorTag,
  hasNextExercise,
  onContinue,
  onBack,
  previousSnapshot,
  isViewingPreviousExercise = false,
  onViewPrevious,
  onReturnToCurrent,
  onRetry,
  attemptIndex = 1,
  canRetry = true,
}: PracticeFeedbackPhaseProps) {
  const continueLabel = hasErrorTag
    ? "Ver guía de recuperación →"
    : hasNextExercise
      ? "Siguiente ejercicio"
      : "Volver a selección";

  const showRetry = shouldShowRetryButton(
    evaluation.correct,
    canRetry,
    Boolean(onRetry),
  );
  const showLegend = shouldShowWarmLegend(evaluation.correct, canRetry);

  return (
    <MathWatermark skillId={skillId} variant="card" opacity={0.12}>
      <div className="space-y-4" aria-live="polite" aria-atomic="false">
        <BackButton onClick={onBack} />

        {/* Previous exercise read-only view */}
        {isViewingPreviousExercise && previousSnapshot && (
          <>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-100 px-2.5 py-1 rounded-[var(--radius-badge)]">
                Ejercicio anterior
              </div>
              {onReturnToCurrent && (
                <button
                  type="button"
                  onClick={onReturnToCurrent}
                  className={prevButtonClassName}
                >
                  Volver al resultado actual →
                </button>
              )}
            </div>

            <ExerciseCard exercise={previousSnapshot.exercise} />
            <SubmittedAnswerDisplay
              exercise={previousSnapshot.exercise}
              submittedAnswer={previousSnapshot.submittedAnswer}
              evaluation={previousSnapshot.evaluation}
              feedback={previousSnapshot.feedback}
            />
          </>
        )}

        {/* Feedback view (hidden when viewing previous) */}
        {!isViewingPreviousExercise && (
          <>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-100 px-2.5 py-1 rounded-[var(--radius-badge)]">
                Resultado
              </div>
              {!evaluation.correct && previousSnapshot && onViewPrevious && (
                <button
                  type="button"
                  onClick={onViewPrevious}
                  className={prevButtonClassName}
                >
                  ← Volver al enunciado
                </button>
              )}
            </div>

            <ExerciseCard exercise={exercise} />

            <FeedbackDisplay
              correct={evaluation.correct}
              errorTag={evaluation.errorTag}
              feedback={feedback}
            />

            {/* Retry button — shown when answer is wrong, cap not reached */}
            {showRetry && (
              <Button variant="secondary" onClick={onRetry} className="w-full">
                Reintentar este ejercicio
              </Button>
            )}

            {/* Warm legend — shown when answer is wrong AND cap reached */}
            {showLegend && (
              <div
                role="status"
                className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-[var(--shadow-card)]"
              >
                <p>{WARM_LEGEND_TEXT}</p>
              </div>
            )}

            <Button variant="secondary" onClick={onContinue} className="w-full">
              {continueLabel}
            </Button>
          </>
        )}
      </div>
    </MathWatermark>
  );
}
