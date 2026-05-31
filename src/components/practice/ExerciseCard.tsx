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
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="text-xs text-gray-500 mb-2">
        {exercise.type} • Dificultad {exercise.difficulty}
      </div>
      <p className="text-lg text-gray-900">{exercise.prompt}</p>
    </div>
  );
}
