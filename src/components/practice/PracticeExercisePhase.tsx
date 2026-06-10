"use client";

import { BackButton } from "@/components/ui/BackButton";
import { AnswerForm } from "@/components/practice/AnswerForm";
import { ExerciseCard } from "@/components/practice/ExerciseCard";
import { SubmittedAnswerDisplay } from "@/components/exercises/SubmittedAnswerDisplay";
import { MathWatermark } from "@/components/math-visuals/MathWatermark";
import type { Exercise } from "@/domain/models/exercise";
import type { PreviousExerciseSnapshot } from "@/app/practice/previous-snapshot";

interface PracticeExercisePhaseProps {
  exercise: Exercise | null;
  skillId?: string;
  exerciseIndex: number;
  totalExercises: number;
  isEvaluating: boolean;
  onSubmit: (answer: string) => void;
  onBack: () => void;
  /** Session-scoped snapshot of the immediately previous submitted exercise. */
  previousSnapshot?: PreviousExerciseSnapshot | null;
  /** Whether the student is viewing the previous exercise (read-only). */
  isViewingPreviousExercise?: boolean;
  /** Switch to the read-only previous exercise view. */
  onViewPrevious?: () => void;
  /** Return to the current exercise from the previous view. */
  onReturnToCurrent?: () => void;
  /** Controlled draft: current text answer (text-input types). */
  draftAnswer?: string;
  /** Controlled draft: current selected option (selectable types). */
  draftSelectedOption?: string | null;
  /** Called on text change or option selection. */
  onDraftChange?: (answer: string, selectedOption: string | null) => void;
}

const prevButtonClassName =
  "inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 border border-brand-300 bg-white px-3 py-1.5 rounded-[var(--radius-button)] min-h-[36px] hover:bg-brand-50 hover:border-brand-400 transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]";

/**
 * Exercise phase: shows the current exercise card and answer form.
 * When a previous snapshot is available and the student activates
 * "Ver anterior", the phase renders the read-only previous submission
 * view instead.
 *
 * The inline counter pill uses the exercise-specific color tokens
 * (brand-100/brand-600) and is not a generic phase badge.
 */
export function PracticeExercisePhase({
  exercise,
  skillId,
  exerciseIndex,
  totalExercises,
  isEvaluating,
  onSubmit,
  onBack,
  previousSnapshot,
  isViewingPreviousExercise = false,
  onViewPrevious,
  onReturnToCurrent,
  draftAnswer,
  draftSelectedOption,
  onDraftChange,
}: PracticeExercisePhaseProps) {
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
                  Volver al ejercicio actual →
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

        {/* Current exercise form (hidden when viewing previous) */}
        {!isViewingPreviousExercise && exercise && (
          <>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-100 px-2.5 py-1 rounded-[var(--radius-badge)]">
                Ejercicio {exerciseIndex + 1} de {totalExercises}
              </div>
              {previousSnapshot && onViewPrevious && (
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
            <AnswerForm
              onSubmit={onSubmit}
              disabled={isEvaluating}
              exercise={exercise}
              draftAnswer={draftAnswer}
              draftSelectedOption={draftSelectedOption}
              onDraftChange={onDraftChange}
            />
          </>
        )}

        {/* Empty state */}
        {!isViewingPreviousExercise && !exercise && (
          <div className="text-center py-8 text-brand-500">
            No hay ejercicios disponibles para esta habilidad.
          </div>
        )}
      </div>
    </MathWatermark>
  );
}
