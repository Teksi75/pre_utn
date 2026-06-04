"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getPracticeHrefForSuggestion } from "@/components/diagnostic/practice-link";
import { computeMasteryLevel } from "@/domain/progress/index";
import type { MasteryLevel, PracticeProgress } from "@/domain/progress/index";
import type { StudyPlan, SkillPriority } from "@/domain/diagnostic/index";

// ── Visual helpers ──────────────────────────────────────────────────────────

interface PriorityBadge {
  readonly label: string;
  readonly className: string;
}

function priorityBadge(priority: SkillPriority["priority"]): PriorityBadge {
  switch (priority) {
    case 1:
      return {
        label: "Urgente",
        className:
          "text-red-700 bg-red-50 border border-red-200",
      };
    case 2:
      return {
        label: "Siguiente",
        className:
          "text-amber-700 bg-amber-50 border border-amber-200",
      };
    case 3:
      return {
        label: "Bloqueado",
        className:
          "text-[var(--color-brand-600)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)]",
      };
    case 4:
    default:
      return {
        label: "Más adelante",
        className:
          "text-[var(--color-brand-500)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)]",
      };
  }
}

const MASTERY_LABEL: Record<MasteryLevel, string> = {
  "not-started": "Sin empezar",
  learning: "Aprendiendo",
  practicing: "En práctica",
  review: "Necesita repaso",
  mastered: "Dominada",
};

const MASTERY_CLASS: Record<MasteryLevel, string> = {
  "not-started": "text-[var(--color-brand-600)] bg-[var(--color-brand-50)] border-[var(--color-brand-200)]",
  learning: "text-amber-700 bg-amber-50 border-amber-200",
  practicing: "text-amber-800 bg-amber-100 border-amber-300",
  review: "text-red-700 bg-red-50 border-red-200",
  mastered: "text-green-700 bg-green-50 border-green-200",
};

function reasonLabel(reason: SkillPriority["reason"]): string {
  switch (reason) {
    case "diagnostic-weak":
      return "Detectada en el diagnóstico";
    case "not-attempted":
      return "Sin practicar aún";
    case "prerequisite-blocked":
      return "Falta un prerrequisito";
  }
}

function formatPlanDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
    });
  } catch {
    return iso;
  }
}

// ── Component ───────────────────────────────────────────────────────────────

interface StudyPlanCardProps {
  readonly studyPlan: StudyPlan;
  readonly skillNames: Readonly<Record<string, string>>;
  readonly progress: PracticeProgress;
}

/**
 * Card that renders the student's prioritized study plan on the home page.
 * Pure presentation: receives the plan and pre-resolved skill labels and
 * computes each row's mastery level from `progress` via the existing
 * `computeMasteryLevel` domain function.
 *
 * The card is hidden when the plan is empty (callers should check
 * `studyPlan.skillPriorities.length > 0` before rendering this component).
 */
export function StudyPlanCard({
  studyPlan,
  skillNames,
  progress,
}: StudyPlanCardProps) {
  if (studyPlan.skillPriorities.length === 0) return null;

  return (
    <Card
      data-testid="study-plan-card"
      className="p-5"
    >
      <header className="mb-4 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand-700)]">
            Tu plan de estudio
          </p>
          <h3 className="mt-1 text-sm font-semibold text-[var(--color-brand-900)]">
            Priorizado según tu diagnóstico
          </h3>
        </div>
        <span className="text-xs text-[var(--color-brand-500)]">
          Creado el {formatPlanDate(studyPlan.createdAt)}
        </span>
      </header>

      <ol className="space-y-3" aria-label="Plan de estudio priorizado">
        {studyPlan.skillPriorities.map((priority) => {
          const badge = priorityBadge(priority.priority);
          const mastery = computeMasteryLevel(priority.skillId, progress);
          const practiceHref = getPracticeHrefForSuggestion(priority.skillId);
          const skillLabel =
            skillNames[priority.skillId] ?? priority.skillId;

          return (
            <li
              key={priority.skillId}
              data-testid="study-plan-row"
              data-skill-id={priority.skillId}
              data-priority={priority.priority}
              className="rounded-[var(--radius-card)] border border-[var(--color-brand-200)] bg-white p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-[var(--radius-badge)] ${badge.className}`}
                      data-testid="priority-badge"
                    >
                      Prioridad {priority.priority} · {badge.label}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-[var(--radius-badge)] border ${MASTERY_CLASS[mastery]}`}
                      data-testid="mastery-badge"
                    >
                      {MASTERY_LABEL[mastery]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-brand-900)]">
                    {skillLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-brand-500)]">
                    {reasonLabel(priority.reason)}
                  </p>
                  {priority.weakConcepts.length > 0 && (
                    <ul
                      className="mt-2 flex flex-wrap gap-1.5"
                      aria-label="Conceptos débiles"
                    >
                      {priority.weakConcepts.map((tag) => (
                        <li
                          key={tag}
                          className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-[var(--radius-badge)]"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="shrink-0">
                  {practiceHref ? (
                    <Link
                      href={practiceHref}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-brand-900)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-800)] focus-visible:shadow-[var(--ring-focus)]"
                    >
                      Practicar →
                    </Link>
                  ) : (
                    <span className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-button)] border border-dashed border-[var(--color-brand-300)] bg-[var(--color-brand-50)] px-4 py-2 text-sm text-[var(--color-brand-500)]">
                      Practicar (próximamente)
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex justify-end">
        <Link
          href="/diagnostic"
          className="text-sm text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)] font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-[var(--color-brand-100)] transition-colors focus-visible:shadow-[var(--ring-focus)]"
        >
          Repetir diagnóstico →
        </Link>
      </div>
    </Card>
  );
}
