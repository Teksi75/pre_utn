"use client";

import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { PhaseBadge } from "@/components/ui/PhaseBadge";
import { MathWatermark } from "@/components/math-visuals/MathWatermark";
import { WorkedExampleCard } from "@/components/practice/WorkedExampleCard";

interface PracticeExamplePhaseProps {
  example: import("@/domain/models/worked-example").WorkedExample;
  skillId?: string;
  hasNextExample: boolean;
  onNextExample: () => void;
  onBack: () => void;
  step: number;
  total: number;
}

/**
 * Example phase: shows a worked example and advances to the next
 * example (if any) or to the exercise phase.
 */
export function PracticeExamplePhase({
  example,
  skillId,
  hasNextExample,
  onNextExample,
  onBack,
  step,
  total,
}: PracticeExamplePhaseProps) {
  return (
    <MathWatermark skillId={skillId} variant="background" opacity={0.18}>
      <div className="space-y-4" aria-live="polite" aria-atomic="false">
        <BackButton onClick={onBack} />

        <PhaseBadge step={step} total={total} label="Ejemplo resuelto" />

        <WorkedExampleCard example={example} />

        <Button variant="secondary" onClick={onNextExample} className="w-full">
          {hasNextExample ? "Ver siguiente ejemplo →" : "Ir a ejercicios →"}
        </Button>
      </div>
    </MathWatermark>
  );
}
