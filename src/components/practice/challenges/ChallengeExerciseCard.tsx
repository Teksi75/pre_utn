"use client";

import { useState } from "react";
import { getExerciseTypeLabel } from "@/components/exercises/exercise-labels";
import { ExerciseCard } from "@/components/practice/ExerciseCard";
import { ExerciseAnswerInput } from "@/components/exercises/ExerciseAnswerInput";
import type { ChallengeExercise } from "@/domain/catalog/challenges/types";

interface ChallengeExerciseCardProps {
  /** The challenge exercise to display */
  exercise: ChallengeExercise;
  /** 1-indexed current challenge number */
  currentNumber: number;
  /** Total number of challenges in this flow */
  totalCount: number;
  /** Called when the user submits an answer */
  onSubmit: (answer: string) => void;
  /** Whether the input is disabled (e.g., while evaluating) */
  disabled?: boolean;
}

/**
 * Renders a challenge exercise with:
 * - "Desafío N de M" counter
 * - "Desafío" badge
 * - Exercise type badge
 * - Challenge prompt (from ExerciseCard)
 * - Answer input (reuses ExerciseAnswerInput)
 *
 * Does NOT show expectedAnswer.
 * Does NOT call base addAttempt — calls onSubmit for the parent to handle.
 */
export function ChallengeExerciseCard({
  exercise,
  currentNumber,
  totalCount,
  onSubmit,
  disabled = false,
}: ChallengeExerciseCardProps) {
  const [draftAnswer, setDraftAnswer] = useState("");
  const [draftSelectedOption, setDraftSelectedOption] = useState<string | null>(null);

  function handleSubmit(answer: string) {
    // Clear input state for next challenge (answer is already captured in the argument)
    setDraftAnswer("");
    setDraftSelectedOption(null);
    onSubmit(answer);
  }

  return (
    <div className="space-y-4">
      {/* Challenge header with counter and badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-block text-xs font-semibold text-accent-700 bg-accent-100 px-2.5 py-1 rounded-[var(--radius-badge)]">
          Desafío {currentNumber} de {totalCount}
        </span>
        <span className="inline-block text-xs font-medium text-accent-600 bg-amber-50 px-2.5 py-1 rounded-[var(--radius-badge)]">
          Desafío
        </span>
        <span className="inline-block text-xs font-medium text-brand-600 bg-brand-100 px-2.5 py-1 rounded-[var(--radius-badge)]">
          {getExerciseTypeLabel(exercise.type)}
        </span>
        <span className="inline-block text-xs font-medium text-accent-600 bg-amber-50 px-2.5 py-1 rounded-[var(--radius-badge)]">
          Dificultad {exercise.difficulty}
        </span>
      </div>

      {/* Exercise prompt */}
      <ExerciseCard exercise={exercise} />

      {/* Answer input */}
      <ExerciseAnswerInput
        exercise={exercise}
        disabled={disabled}
        onSubmit={handleSubmit}
        draftAnswer={draftAnswer}
        draftSelectedOption={draftSelectedOption}
        onDraftChange={(answer, selected) => {
          setDraftAnswer(answer);
          setDraftSelectedOption(selected);
        }}
      />
    </div>
  );
}
