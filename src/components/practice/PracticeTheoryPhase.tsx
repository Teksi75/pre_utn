"use client";

import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { PhaseBadge } from "@/components/ui/PhaseBadge";
import { MathWatermark } from "@/components/math-visuals/MathWatermark";
import { TheoryCard } from "@/components/practice/TheoryCard";
import type { TheoryNode } from "@/domain/models/theory";

interface PracticeTheoryPhaseProps {
  theoryNode: TheoryNode;
  skillId?: string;
  onNext: () => void;
  onBack: () => void;
  step: number;
  total: number;
}

/**
 * Theory phase: shows the theory card for the selected skill and a
 * "next" button to advance to the worked example.
 */
export function PracticeTheoryPhase({
  theoryNode,
  skillId,
  onNext,
  onBack,
  step,
  total,
}: PracticeTheoryPhaseProps) {
  return (
    <MathWatermark skillId={skillId} variant="background" opacity={0.18}>
      <div className="space-y-4" aria-live="polite" aria-atomic="false">
        <BackButton onClick={onBack} />

        <PhaseBadge step={step} total={total} label="Teoría" />

        <TheoryCard node={theoryNode} />

        <Button variant="secondary" onClick={onNext} className="w-full">
          Ver ejemplo resuelto →
        </Button>
      </div>
    </MathWatermark>
  );
}
