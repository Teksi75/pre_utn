"use client";

import { Button } from "@/components/ui/Button";

interface ChallengeOptInBlockProps {
  /** Number of available challenges for this skill */
  challengeCount: number;
  /** Called when the user chooses to attempt challenges */
  onStart: () => void;
  /** Called when the user chooses to finish for now */
  onSkip: () => void;
}

/**
 * Shown inside PracticeCompletePhase when challenges exist for the current skill.
 * Presents challenges as optional and independent from base practice progress.
 *
 * Copy is neutral — does NOT claim tutoring voice or personalized plan.
 */
export function ChallengeOptInBlock({
  challengeCount,
  onStart,
  onSkip,
}: ChallengeOptInBlockProps) {
  // Guard: don't render if no challenges
  if (challengeCount <= 0) return null;

  return (
    <div className="app-glass-surface-strong rounded-[var(--radius-card)] p-5 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-brand-700">Terminaste la práctica base.</p>
        <p className="text-sm text-brand-600">
          Hay {challengeCount} ejercicios de desafío disponibles para profundizar.
        </p>
      </div>

      {/* Purpose + optional nature */}
      <p className="text-sm text-brand-600">
        Podés intentar algunos ejercicios más difíciles para practicar integración.
        Son opcionales y no afectan tu avance de la práctica.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button onClick={onStart} className="w-full">
          Intentar desafíos
        </Button>
        <Button variant="ghost" onClick={onSkip} className="w-full">
          Finalizar por ahora
        </Button>
      </div>
    </div>
  );
}
