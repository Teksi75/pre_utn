"use client";

import type { StudentRouteUnit } from "@/domain/student-home";
import { StatusPill, type StatusPillVariant } from "@/components/ui/StatusPill";

interface MathRoutePanelProps {
  readonly routeUnits: readonly StudentRouteUnit[];
}

const UNIT_STATUS_LABEL: Record<string, string> = {
  mastered: "Dominada",
  "in-progress": "En progreso",
  "not-started": "Sin empezar",
};

/**
 * Map the route-unit status (mastered | in-progress | not-started) to
 * a StatusPill variant. Anything unrecognised falls back to `neutral`
 * so the panel still renders rather than throwing.
 */
function variantForStatus(
  status: StudentRouteUnit["status"],
): StatusPillVariant {
  switch (status) {
    case "mastered":
      return "success";
    case "in-progress":
      return "active";
    case "not-started":
      return "neutral";
  }
}

/**
 * Dumb route panel — renders the six routeUnits (U1–U6) as a vertical
 * ordered list with status badges. No horizontal skill roadmap, no
 * internal topic list. All data is pre-computed by the view-model.
 */
export function MathRoutePanel({ routeUnits }: MathRoutePanelProps) {
  return (
    <article
      aria-labelledby="mission-route-title"
      className="app-glass-surface rounded-[var(--radius-card)] p-5"
    >
      <h3
        id="mission-route-title"
        className="text-sm font-semibold uppercase tracking-wide text-[var(--color-brand-700)]"
      >
        Ruta Matemática
      </h3>

      <ol className="mt-4 space-y-3" aria-label="Unidades del camino">
        {routeUnits.map((unit) => (
          <li
            key={unit.unitKey}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="font-medium text-[var(--color-brand-800)]">
              Unidad {unit.unitNumber}
            </span>
            <StatusPill variant={variantForStatus(unit.status)}>
              {UNIT_STATUS_LABEL[unit.status] ?? unit.status}
              {unit.skillCount > 0 && ` (${unit.skillCount} habilidades)`}
            </StatusPill>
          </li>
        ))}
      </ol>
    </article>
  );
}
