"use client";

import { ExerciseAnswerInput } from "@/components/exercises/ExerciseAnswerInput";
import { ExerciseCard } from "@/components/practice/ExerciseCard";
import { MathThemePlate } from "@/components/math/MathThemePlate";
import type { Exercise } from "@/domain/models/exercise";

/**
 * Maps exercise skillId prefixes to MathThemePlate topics for
 * decorative visual identity on the diagnostic question screen.
 */
function skillIdToThemeTopic(skillId: string): string {
  if (skillId.includes("conjuntos") || skillId.includes("numeros")) return "sets";
  if (skillId.includes("irracional")) return "irrationals";
  if (skillId.includes("potencia") || skillId.includes("exponente")) return "powers";
  if (skillId.includes("raiz") || skillId.includes("radical")) return "roots";
  if (skillId.includes("intervalo")) return "intervals";
  if (skillId.includes("valor_absoluto") || skillId.includes("absoluto")) return "absolute";
  if (skillId.includes("logaritmo")) return "logs";
  if (skillId.includes("complejo")) return "complex";
  return "sets";
}

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
  const themeTopic = skillIdToThemeTopic(exercise.skillId);

  return (
    <div className="space-y-4">
      {/* Question area with decorative background */}
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-brand-200)] bg-white p-5 md:p-6 shadow-[var(--shadow-card)]">
        <MathThemePlate
          topic={themeTopic}
          variant="background"
          className="absolute inset-0 opacity-10 pointer-events-none"
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
