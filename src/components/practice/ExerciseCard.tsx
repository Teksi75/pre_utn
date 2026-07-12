"use client";

import { getExerciseTypeLabel } from "@/components/exercises/exercise-labels";
import { RichText } from "@/components/math/RichText";
import type { ExerciseBaseShape } from "@/domain/models/exercise";

interface ExerciseCardProps {
  readonly exercise: ExerciseBaseShape;
}

/**
 * Shows exercise prompt; never exposes expectedAnswer.
 */
export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <div className="app-glass-surface-strong rounded-[var(--radius-card)] p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block text-xs font-medium text-brand-600 bg-brand-100 px-2.5 py-1 rounded-[var(--radius-badge)]">
          {getExerciseTypeLabel(exercise.type)}
        </span>
        <span className="inline-block text-xs font-medium text-accent-600 bg-amber-50 px-2.5 py-1 rounded-[var(--radius-badge)]">
          Dificultad {exercise.difficulty}
        </span>
      </div>
      <div className="text-[var(--text-lg)] text-brand-900 leading-[var(--leading-relaxed)]">
        <RichText text={exercise.prompt} />
      </div>
    </div>
  );
}
