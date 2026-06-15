"use client";

import Link from "next/link";
import type { StudentRouteUnit } from "@/domain/student-home";
import { StatusPill, type StatusPillVariant } from "@/components/ui/StatusPill";
import type { SkillAvailabilityStatus } from "@/domain/catalog/skill-availability";

interface MathRoutePanelProps {
  readonly routeUnits: readonly StudentRouteUnit[];
}

const UNIT_STATUS_LABEL: Record<StudentRouteUnit["status"], string> = {
  mastered: "Dominada",
  "in-progress": "En progreso",
  "not-started": "Sin empezar",
};

// Hardcoded unit titles for U1–U2 (the only units with real content today).
// Future titles should move to the catalog; this is a small in-component
// constant to keep this PR scoped to UI honesty.
const UNIT_TITLE: Record<number, string> = {
  1: "Conjuntos numéricos y operaciones",
  2: "Polinomios y ecuaciones",
};

const MAX_VISIBLE_CHIPS = 3;

const AVAILABILITY_LABEL: Record<SkillAvailabilityStatus, string> = {
  "practice-ready": "Práctica disponible",
  "theory-ready": "Teoría disponible",
  "in-preparation": "En preparación",
  "coming-soon": "Próximamente",
};

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
 * Compact route panel — 1 card per unit, no per-skill sub-list.
 *
 * The Home is a study dashboard, not a catalog. We render 1 card per
 * unit (U1–U6) with: unit number, optional title, mastery pill, progress
 * text (X/Y superados · availability label), up to 3 chips of attempted
 * skills with "+N más" overflow, and a single "Repasar teoría" CTA
 * pointing to /learn/matematica (the full topic catalog).
 *
 * For units with no pilot skills (U3–U6 today), a compact "Próximamente"
 * row is rendered instead — no mastery pill, no progress, no count, no
 * CTA. Future units do not have progress state.
 *
 * "Libre navegación sí. Práctica falsa no. Home clara, no catálogo
 * saturado. Detalle disponible, pero bajo demanda."
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
        {routeUnits.map((unit) =>
          unit.skills.length === 0 ? (
            <ComingSoonRow key={unit.unitKey} unit={unit} />
          ) : (
            <UnitCard key={unit.unitKey} unit={unit} />
          ),
        )}
      </ol>
    </article>
  );
}

function ComingSoonRow({ unit }: { readonly unit: StudentRouteUnit }) {
  // U3–U6 today: no mastery pill, no progress, no count, no CTA.
  // Just the unit number and the "Próximamente" pill.
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-medium text-[var(--color-brand-800)]">
        Unidad {unit.unitNumber}
      </span>
      <StatusPill variant="neutral">Próximamente</StatusPill>
    </div>
  );
}

function UnitCard({ unit }: { readonly unit: StudentRouteUnit }) {
  const attempted = unit.skills.filter((s) => s.hasAttempted);
  const total = unit.skills.length;
  const visible = attempted.slice(0, MAX_VISIBLE_CHIPS);
  const hidden = attempted.length - visible.length;
  const title = UNIT_TITLE[unit.unitNumber];

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="font-medium text-[var(--color-brand-800)]">
            Unidad {unit.unitNumber}
          </span>
          {title && (
            <span className="ml-1 text-[var(--color-brand-600)]">
              · {title}
            </span>
          )}
        </div>
        <StatusPill variant={variantForStatus(unit.status)}>
          {UNIT_STATUS_LABEL[unit.status]}
        </StatusPill>
      </div>

      <p className="text-xs text-[var(--color-brand-600)]">
        {attempted.length}/{total} temas superados ·{" "}
        {AVAILABILITY_LABEL[unit.availability]}
      </p>

      {attempted.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[var(--color-brand-700)]">
            Temas superados:
          </span>
          {visible.map((s) => (
            <span
              key={s.skillId}
              className="inline-flex items-center rounded-full bg-[var(--color-brand-100)] px-2 py-0.5 text-xs text-[var(--color-brand-800)]"
            >
              {s.label}
            </span>
          ))}
          {hidden > 0 && (
            <span className="text-xs text-[var(--color-brand-600)]">
              +{hidden} más
            </span>
          )}
        </div>
      ) : (
        <p className="text-xs italic text-[var(--color-brand-600)]">
          Aún sin temas superados
        </p>
      )}

      <Link
        href="/learn/matematica"
        className="inline-flex items-center text-xs font-medium text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)] underline underline-offset-2 transition-colors min-h-[32px]"
      >
        Repasar teoría →
      </Link>
    </div>
  );
}
