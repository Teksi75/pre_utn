"use client";

import { Button } from "@/components/ui/Button";

interface ChallengeDoneSummaryProps {
  /** The skill that was practiced */
  skillId: string;
  /** Total number of challenges attempted */
  challengeCount: number;
  /** Number of correct answers */
  correctCount: number;
  /** Advanced readiness score (0–100) or null if not started */
  advancedReadiness: number | null;
  /** Called when the user wants to return to the skill selector */
  onBackToSelect: () => void;
}

/**
 * Summary screen shown after all challenges are completed.
 *
 * Shows:
 * - Completion message
 * - Score (correct out of total)
 * - Advanced readiness score
 * - "Volver al selector" CTA
 *
 * Copy is neutral — no tutor voice, no personalization claims.
 */
export function ChallengeDoneSummary({
  challengeCount,
  correctCount,
  advancedReadiness,
  onBackToSelect,
}: ChallengeDoneSummaryProps) {
  return (
    <div className="app-glass-surface-strong rounded-[var(--radius-card)] p-5 space-y-5">
      {/* Completion header */}
      <div className="text-center space-y-1">
        <p className="text-lg font-semibold text-brand-900">
          Desafíos completados
        </p>
        <p className="text-sm text-brand-600">
          {challengeCount} ejercicios de desafío
        </p>
      </div>

      {/* Score */}
      <div className="flex justify-center gap-8 py-3 border-y border-brand-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-brand-900">{correctCount}</p>
          <p className="text-xs text-brand-500">correctas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brand-400">/</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brand-900">{challengeCount}</p>
          <p className="text-xs text-brand-500">total</p>
        </div>
      </div>

      {/* Advanced readiness */}
      {advancedReadiness !== null && (
        <div className="space-y-1 text-center">
          <p className="text-sm text-brand-600">Nivel de preparación en desafíos</p>
          <p className="text-3xl font-bold text-accent-600">{advancedReadiness}%</p>
        </div>
      )}

      {/* Encouragement note */}
      <p className="text-center text-sm text-brand-600">
        Los ejercicios de desafío ayudan a integrar conceptos para el examen.
        No reemplazan la práctica base.
      </p>

      {/* CTA */}
      <Button onClick={onBackToSelect} className="w-full">
        Volver al selector
      </Button>
    </div>
  );
}
