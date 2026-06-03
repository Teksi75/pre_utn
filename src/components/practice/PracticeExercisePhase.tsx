"use client";

import { BackButton } from "@/components/ui/BackButton";
import { AnswerForm } from "@/components/practice/AnswerForm";
import { ExerciseCard } from "@/components/practice/ExerciseCard";
import type { Exercise } from "@/domain/models/exercise";

interface PracticeExercisePhaseProps {
  exercise: Exercise | null;
  exerciseIndex: number;
  totalExercises: number;
  isEvaluating: boolean;
  onSubmit: (answer: string) => void;
  onBack: () => void;
}

/**
 * Exercise phase: shows the current exercise card and answer form.
 * The inline counter pill uses the exercise-specific color tokens
 * (brand-100/brand-600) and is not a generic phase badge.
 */
export function PracticeExercisePhase({
  exercise,
  exerciseIndex,
  totalExercises,
  isEvaluating,
  onSubmit,
  onBack,
}: PracticeExercisePhaseProps) {
  return (
    <div className="space-y-4" aria-live="polite" aria-atomic="false">
      <BackButton onClick={onBack} />

      {exercise ? (
        <>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-100 px-2.5 py-1 rounded-[var(--radius-badge)]">
            Ejercicio {exerciseIndex + 1} de {totalExercises}
          </div>
          <ExerciseCard exercise={exercise} />
          <AnswerForm
            onSubmit={onSubmit}
            disabled={isEvaluating}
            exercise={exercise}
          />
        </>
      ) : (
        <div className="text-center py-8 text-brand-500">
          No hay ejercicios disponibles para esta habilidad.
        </div>
      )}
    </div>
  );
}
