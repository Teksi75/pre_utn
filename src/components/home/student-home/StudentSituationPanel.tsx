"use client";

import type { StudentSituation } from "@/domain/student-home";

interface StudentSituationPanelProps {
  readonly situation: StudentSituation;
}

/**
 * Dumb situation panel — displays diagnostic date, readiness
 * percentage, and skill counts with explicit text (no color-only
 * status). No domain hooks or logic.
 */
export function StudentSituationPanel({
  situation,
}: StudentSituationPanelProps) {
  const diagnosticLabel = situation.diagnosticCompletedAt
    ? new Date(situation.diagnosticCompletedAt).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
      })
    : "Sin diagnóstico";

  return (
    <article
      aria-labelledby="tss-situation-title"
      className="app-glass-surface rounded-[var(--radius-card)] p-5"
    >
      <h3
        id="tss-situation-title"
        className="text-sm font-semibold uppercase tracking-wide text-[var(--color-brand-700)]"
      >
        Tu situación
      </h3>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-[var(--color-brand-500)]">
            Diagnóstico
          </dt>
          <dd className="font-medium text-[var(--color-brand-800)]">
            {diagnosticLabel}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-[var(--color-brand-500)]">
            Preparación
          </dt>
          <dd className="font-medium text-[var(--color-brand-800)]">
            {situation.readinessPercent}% listo
          </dd>
        </div>

        <div>
          <dt className="text-xs text-[var(--color-brand-500)]">
            Habilidades débiles
          </dt>
          <dd className="font-medium text-red-700">
            {situation.weakSkillsCount} de {situation.totalSkillsCount}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-[var(--color-brand-500)]">
            Habilidades practicadas
          </dt>
          <dd className="font-medium text-[var(--color-brand-800)]">
            {situation.practicedSkillsCount} de {situation.totalPilotCount}
          </dd>
        </div>
      </dl>
    </article>
  );
}
