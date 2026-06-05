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
 * Editorial visual shell with MathThemePlate decorative background,
 * large question area, and conceptual background hint.
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
      <div className="app-glass-surface rounded-[var(--radius-card)] p-5 md:p-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-brand-600)] bg-[var(--color-brand-100)] px-2.5 py-1 rounded-[var(--radius-badge)] mb-4">
          Pregunta {questionNumber} de {totalQuestions}
        </div>

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
