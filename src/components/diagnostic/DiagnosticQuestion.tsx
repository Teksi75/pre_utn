"use client";

import { ExerciseAnswerInput } from "@/components/exercises/ExerciseAnswerInput";
import { ExerciseCard } from "@/components/practice/ExerciseCard";
import { MathThemePlate } from "@/components/math-visuals/MathThemePlate";
import { mathThemeForSkill } from "@/components/math-visuals/topic-map";
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
  const themeTopic = mathThemeForSkill(exercise.skillId);

  return (
    <div className="space-y-4">
      {/* Question area with decorative background */}
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-brand-200)] bg-white p-5 md:p-6 shadow-[var(--shadow-card)]">
        <MathThemePlate
          topic={themeTopic}
          variant="background"
          opacity={0.08}
          className="absolute inset-0"
        />

        {/* Topic badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-brand-600)] bg-[var(--color-brand-100)] px-2.5 py-1 rounded-[var(--radius-badge)] mb-4">
            Pregunta {questionNumber} de {totalQuestions}
          </div>

          <ExerciseCard exercise={exercise} />
        </div>
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
