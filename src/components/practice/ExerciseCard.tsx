"use client";

import type { Exercise } from "@/domain/models/exercise";

interface ExerciseCardProps {
  readonly exercise: Exercise;
}

/**
 * Shows exercise prompt; never exposes expectedAnswer.
 */
export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <div className="shadow-[var(--shadow-card)] rounded-[var(--radius-card)] p-5 bg-white border border-brand-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block text-xs font-medium text-brand-600 bg-brand-100 px-2.5 py-1 rounded-[var(--radius-badge)]">
          {exercise.type}
        </span>
        <span className="inline-block text-xs font-medium text-accent-600 bg-amber-50 px-2.5 py-1 rounded-[var(--radius-badge)]">
          Dificultad {exercise.difficulty}
        </span>
      </div>
      <p className="text-[var(--text-lg)] text-brand-900 leading-[var(--leading-relaxed)]">
        {exercise.prompt}
      </p>
    </div>
  );
}
