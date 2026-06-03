"use client";

import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PhaseBadge } from "@/components/ui/PhaseBadge";
import { FeedbackDisplay } from "@/components/practice/FeedbackDisplay";
import type { FeedbackMapping } from "@/domain/feedback/index";

interface PracticeRecoveryPhaseProps {
  errorTag: string | undefined;
  feedback: string;
  feedbackMappings: readonly FeedbackMapping[];
  hasNextExercise: boolean;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Recovery phase: shown after a wrong answer with a tagged error.
 * Surfaces the recovery target (when one exists for the error tag)
 * and a button to retry the next exercise or return to selection.
 */
export function PracticeRecoveryPhase({
  errorTag,
  feedback,
  feedbackMappings,
  hasNextExercise,
  onContinue,
  onBack,
}: PracticeRecoveryPhaseProps) {
  const mapping = errorTag
    ? feedbackMappings.find((m) => m.errorTag === errorTag)
    : undefined;

  return (
    <div className="space-y-4" aria-live="polite" aria-atomic="false">
      <BackButton onClick={onBack} />

      <PhaseBadge label="Guía de recuperación" />

      <Card variant="accent" className="p-4">
        <p className="text-sm font-semibold text-amber-800 mb-2">
          Revisá el material antes de continuar
        </p>
        <p className="text-sm text-amber-700 leading-[var(--leading-relaxed)]">
          Tu respuesta tiene un error detectado. Te recomendamos revisar la
          teoría y el ejemplo resuelto antes de intentar otro ejercicio.
        </p>
      </Card>

      <FeedbackDisplay correct={false} errorTag={errorTag} feedback={feedback} />

      {mapping?.recoveryTarget ? (
        <Card className="p-4">
          <p className="text-xs font-medium text-brand-500 mb-1">
            Revisá este contenido:
          </p>
          <p className="text-sm text-brand-700 font-medium">
            {mapping.recoveryTarget}
          </p>
        </Card>
      ) : null}

      <Button variant="secondary" onClick={onContinue} className="w-full">
        {hasNextExercise ? "Intentar otro ejercicio" : "Volver a selección"}
      </Button>
    </div>
  );
}
