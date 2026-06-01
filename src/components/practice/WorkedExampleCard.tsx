"use client";

import { useState } from "react";
import { RichText } from "@/components/math/RichText";
import type { WorkedExample } from "@/domain/models/worked-example";

interface WorkedExampleCardProps {
  readonly example: WorkedExample;
}

/**
 * Displays a worked example with collapsible solution steps.
 * Steps are hidden by default and revealed on user action.
 */
export function WorkedExampleCard({ example }: WorkedExampleCardProps) {
  const [showSteps, setShowSteps] = useState(false);
  const sortedSteps = [...example.steps].sort((a, b) => a.order - b.order);

  return (
    <div className="shadow-[var(--shadow-card)] rounded-[var(--radius-card)] p-5 bg-white border border-brand-200">
      <div className="mb-3">
        <span className="inline-block text-xs font-medium text-accent-600 bg-amber-50 px-2.5 py-1 rounded-[var(--radius-badge)]">
          Ejemplo resuelto
        </span>
      </div>

      <div className="text-[var(--text-lg)] text-brand-900 font-medium leading-[var(--leading-relaxed)]">
        <RichText text={example.problem} />
      </div>

      {/* Steps toggle */}
      <button
        onClick={() => setShowSteps(!showSteps)}
        className="mt-4 w-full text-sm font-medium text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 min-h-[44px] px-4 py-2.5 rounded-[var(--radius-button)] transition-colors focus-visible:shadow-[var(--ring-focus)]"
      >
        {showSteps ? "Ocultar resolución" : "Ver resolución paso a paso"}
      </button>

      {showSteps && (
        <div className="mt-3 space-y-2">
          {sortedSteps.map((step) => (
            <div
              key={step.order}
              className="flex gap-3 text-sm text-brand-700"
            >
              <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-medium">
                {step.order}
              </span>
              <div className="leading-[var(--leading-relaxed)]">
                <RichText text={step.explanation} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Final answer */}
      {showSteps && (
        <div className="mt-3 pt-3 border-t border-brand-100">
          <div className="text-sm font-semibold text-brand-900">
            Respuesta: <RichText text={example.finalAnswer} />
          </div>
        </div>
      )}

      {/* Pedagogical note */}
      {showSteps && example.pedagogicalNote && (
        <div className="mt-2 p-3 bg-amber-50 rounded-[var(--radius-card)] border border-amber-200">
          <div className="text-xs font-medium text-amber-800 mb-1">
            Tip pedagógico:
          </div>
          <div className="text-sm text-amber-700 leading-[var(--leading-relaxed)]">
            <RichText text={example.pedagogicalNote} />
          </div>
        </div>
      )}
    </div>
  );
}
