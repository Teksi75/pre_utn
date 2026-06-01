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
 * Shows exercise prompt + answer input for diagnostic.
 * Pattern mirrors practice AnswerForm but includes question counter.
 */
export function DiagnosticQuestion({
  exercise,
  questionNumber,
  totalQuestions,
  onSubmit,
  disabled,
}: DiagnosticQuestionProps) {
  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-100 px-2.5 py-1 rounded-[var(--radius-badge)]">
        Pregunta {questionNumber} de {totalQuestions}
      </div>

      <ExerciseCard exercise={exercise} />

      <ExerciseAnswerInput
        exercise={exercise}
        disabled={disabled}
        onSubmit={onSubmit}
        inputId="diagnostic-answer"
      />
    </div>
  );
}
