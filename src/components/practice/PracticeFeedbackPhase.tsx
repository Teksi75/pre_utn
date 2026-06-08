"use client";

import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { MathWatermark } from "@/components/math-visuals/MathWatermark";
import { ExerciseCard } from "@/components/practice/ExerciseCard";
import { FeedbackDisplay } from "@/components/practice/FeedbackDisplay";
import type { Exercise } from "@/domain/models/exercise";
import type { EvaluationResult } from "@/domain/evaluator/index";

interface PracticeFeedbackPhaseProps {
  exercise: Exercise;
  skillId?: string;
  evaluation: EvaluationResult;
  feedback: string;
  hasErrorTag: boolean;
  hasNextExercise: boolean;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Feedback phase: shows the exercise + correctness feedback after the
 * learner submits an answer. The continue button label adapts to the
 * outcome (error → recovery; correct + more → next; correct + last → done).
 */
export function PracticeFeedbackPhase({
  exercise,
  skillId,
  evaluation,
  feedback,
  hasErrorTag,
  hasNextExercise,
  onContinue,
  onBack,
}: PracticeFeedbackPhaseProps) {
  const continueLabel = hasErrorTag
    ? "Ver guía de recuperación →"
    : hasNextExercise
      ? "Siguiente ejercicio"
      : "Volver a selección";

  return (
    <MathWatermark skillId={skillId} variant="card" opacity={0.12}>
      <div className="space-y-4" aria-live="polite" aria-atomic="false">
        <BackButton onClick={onBack} />

        <ExerciseCard exercise={exercise} />

        <FeedbackDisplay
          correct={evaluation.correct}
          errorTag={evaluation.errorTag}
          feedback={feedback}
        />

        <Button variant="secondary" onClick={onContinue} className="w-full">
          {continueLabel}
        </Button>
      </div>
    </MathWatermark>
  );
}
