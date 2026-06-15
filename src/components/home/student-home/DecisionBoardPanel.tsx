"use client";

import Link from "next/link";
import type { StudentHomeAction } from "@/domain/student-home";

interface DecisionBoardPanelProps {
  readonly decisions: readonly StudentHomeAction[];
}

/**
 * Class string matching `Button` variant="secondary" (added in A3).
 * Kept in sync manually: the link here must use Next's client-side
 * navigation, so we can't reuse the <Button> component directly.
 * If `Button` ever changes its secondary class string, update this
 * constant too (or extract into a shared helper).
 */
const SECONDARY_LINK_CLASSES =
  "mt-4 inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-brand-100)] px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-[var(--color-brand-200)] focus-visible:shadow-[var(--ring-focus)] self-start";

/**
 * Dumb decision board — renders action cards in a responsive grid.
 * Each card shows a label, description, and a CTA link styled as
 * `secondary` so the Home's only `primary` CTA stays in the hero.
 *
 * No domain logic, no hooks.
 */
export function DecisionBoardPanel({ decisions }: DecisionBoardPanelProps) {
  // Determine kind from href for button label
  function actionLabel(action: StudentHomeAction): string {
    if (action.href.startsWith("/diagnostic")) return "Hacer diagnóstico →";
    if (action.href.startsWith("/practice")) return "Practicar →";
    if (action.href.startsWith("/learn")) return "Ver material →";
    return "Ir →";
  }

  return (
    <article
      aria-labelledby="mission-decisions-title"
      className="app-glass-surface rounded-[var(--radius-card)] p-5"
    >
      <h3
        id="mission-decisions-title"
        className="text-sm font-semibold uppercase tracking-wide text-[var(--color-brand-700)]"
      >
        Acciones sugeridas
      </h3>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {decisions.map((action, index) => (
          <div
            key={`action-${index}`}
            className="rounded-[var(--radius-card)] bg-[var(--color-brand-50)] p-4 flex flex-col"
          >
            <h4 className="text-sm font-semibold text-[var(--color-brand-900)]">
              {action.label}
            </h4>
            <p className="mt-2 flex-1 text-xs leading-[var(--leading-relaxed)] text-[var(--color-brand-600)]">
              {action.description}
            </p>
            <Link
              href={action.href}
              className={SECONDARY_LINK_CLASSES}
            >
              {actionLabel(action)}
            </Link>
          </div>
        ))}
      </div>
    </article>
  );
}
