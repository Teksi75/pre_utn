"use client";

import { useState } from "react";
import { WorkedExampleCard } from "@/components/practice/WorkedExampleCard";
import type { WorkedExample } from "@/domain/models/worked-example";

interface WorkedExamplesSectionProps {
  readonly examples: readonly WorkedExample[];
}

export function WorkedExamplesSection({ examples }: WorkedExamplesSectionProps) {
  const [showExamples, setShowExamples] = useState(false);

  if (examples.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        onClick={() => setShowExamples(!showExamples)}
        className="w-full min-h-[44px] rounded-[var(--radius-button)] border border-brand-200 bg-white px-4 py-3 text-left text-[var(--text-xl)] font-semibold text-brand-900 shadow-sm transition-colors hover:bg-brand-50 focus-visible:shadow-[var(--ring-focus)]"
        aria-expanded={showExamples}
      >
        <span aria-hidden="true" className="mr-2">
          {showExamples ? "−" : "+"}
        </span>
        {showExamples ? "Ocultar ejemplos resueltos" : "Ver ejemplos resueltos"}
      </button>

      {showExamples ? (
        <div className="mt-4 space-y-4">
          {examples.map((example) => (
            <WorkedExampleCard key={example.id} example={example} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
