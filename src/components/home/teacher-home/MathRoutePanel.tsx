"use client";

import type { TeacherRouteUnit } from "@/domain/teacher-home";

interface MathRoutePanelProps {
  readonly routeUnits: readonly TeacherRouteUnit[];
}

const UNIT_STATUS_LABEL: Record<string, string> = {
  mastered: "Dominada",
  "in-progress": "En progreso",
  "not-started": "Sin empezar",
};

/**
 * Dumb route panel — renders the six routeUnits (U1–U6) as a vertical
 * ordered list with status badges. No horizontal skill roadmap, no
 * internal topic list. All data is pre-computed by the view-model.
 */
export function MathRoutePanel({ routeUnits }: MathRoutePanelProps) {
  return (
    <article
      aria-labelledby="tmr-route-title"
      className="app-glass-surface rounded-[var(--radius-card)] p-5"
    >
      <h3
        id="tmr-route-title"
        className="text-sm font-semibold uppercase tracking-wide text-[var(--color-brand-700)]"
      >
        Ruta Matemática
      </h3>

      <ol className="mt-4 space-y-3" aria-label="Unidades del camino">
        {routeUnits.map((unit) => (
          <li
            key={unit.unitKey}
            className="flex items-center justify-between text-sm"
          >
            <span className="font-medium text-[var(--color-brand-800)]">
              Unidad {unit.unitNumber}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                unit.status === "mastered"
                  ? "border-green-400 bg-green-50 text-green-700"
                  : unit.status === "in-progress"
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-[var(--color-brand-200)] bg-[var(--color-brand-50)] text-[var(--color-brand-500)]"
              }`}
            >
              {UNIT_STATUS_LABEL[unit.status] ?? unit.status}
              {unit.skillCount > 0 && ` (${unit.skillCount} habilidades)`}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}
