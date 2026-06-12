"use client";

import Link from "next/link";
import type { TeacherHomeAction } from "@/domain/teacher-home";

interface DecisionBoardPanelProps {
  readonly decisions: readonly TeacherHomeAction[];
}

/**
 * Dumb decision board — renders action cards in a responsive grid.
 * Each card shows a label, description, and a safe CTA link.
 * No domain logic, no hooks.
 */
export function DecisionBoardPanel({ decisions }: DecisionBoardPanelProps) {
  // Determine kind from href for button label
  function actionLabel(action: TeacherHomeAction): string {
    if (action.href.startsWith("/diagnostic")) return "Hacer diagnóstico →";
    if (action.href.startsWith("/practice")) return "Practicar →";
    if (action.href.startsWith("/learn")) return "Ver material →";
    return "Ir →";
  }

  return (
    <article
      aria-labelledby="tdb-decisions-title"
      className="app-glass-surface rounded-[var(--radius-card)] p-5"
    >
      <h3
        id="tdb-decisions-title"
        className="text-sm font-semibold uppercase tracking-wide text-[var(--color-brand-700)]"
      >
        Plan de hoy
      </h3>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {decisions.map((action, index) => (
          <div
            key={`action-${index}`}
            className="rounded-[var(--radius-card)] border border-[var(--color-brand-200)] bg-white p-4 flex flex-col"
          >
            <h4 className="text-sm font-semibold text-[var(--color-brand-900)]">
              {action.label}
            </h4>
            <p className="mt-2 flex-1 text-xs leading-[var(--leading-relaxed)] text-[var(--color-brand-600)]">
              {action.description}
            </p>
            <Link
              href={action.href}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-brand-900)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-800)] focus-visible:shadow-[var(--ring-focus)] self-start"
            >
              {actionLabel(action)}
            </Link>
          </div>
        ))}
      </div>
    </article>
  );
}
