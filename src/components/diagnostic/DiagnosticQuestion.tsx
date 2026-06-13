"use client";

import { ExerciseAnswerInput } from "@/components/exercises/ExerciseAnswerInput";
import { ExerciseCard } from "@/components/practice/ExerciseCard";
import type { Exercise } from "@/domain/models/exercise";

interface DiagnosticQuestionProps {
  readonly exercise: Exercise;
  readonly questionNumber: number;
  readonly totalQuestions: number;
  readonly onSubmit: (answer: string) => void;
  readonly disabled: boolean;
}

/**
 * Shows exercise prompt + answer input for the diagnostic question
 * screen. The "Pregunta X de N" counter lives in <DiagnosticProgress>
 * (rendered by the parent page above this card) so it is NOT echoed
 * here — C3 of the redesign sprint.
 */
export function DiagnosticQuestion({
  exercise,
  onSubmit,
  disabled,
}: DiagnosticQuestionProps) {
  return (
    <div className="space-y-4">
      <div className="app-glass-surface rounded-[var(--radius-card)] p-5 md:p-6">
        <ExerciseCard exercise={exercise} />
      </div>

      {/* Answer input */}
      <ExerciseAnswerInput
        exercise={exercise}
        disabled={disabled}
        onSubmit={onSubmit}
        inputId="diagnostic-answer"
      />
    </div>
  );
}
