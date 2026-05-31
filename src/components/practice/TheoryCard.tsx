"use client";

import { useState } from "react";
import type { TheoryNode } from "@/domain/models/theory";

interface TheoryCardProps {
  readonly node: TheoryNode;
}

/**
 * Displays a theory node: concepts, notation, common mistakes, and practice prompts.
 * Concepts are expanded by default; notation and mistakes can be toggled.
 */
export function TheoryCard({ node }: TheoryCardProps) {
  const [showNotation, setShowNotation] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);

  return (
    <div className="shadow-[var(--shadow-card)] rounded-[var(--radius-card)] p-5 bg-white border border-brand-200">
      <div className="mb-4">
        <span className="inline-block text-xs font-medium text-accent-600 bg-amber-50 px-2.5 py-1 rounded-[var(--radius-badge)]">
          Teoría
        </span>
      </div>

      {/* Concepts */}
      <div className="space-y-3">
        {node.concepts.map((concept) => (
          <div key={concept.id}>
            <h3 className="text-[var(--text-lg)] font-semibold text-brand-900">
              {concept.title}
            </h3>
            <p className="mt-1 text-sm text-brand-700 leading-[var(--leading-relaxed)]">
              {concept.body}
            </p>
          </div>
        ))}
      </div>

      {/* Notation toggle */}
      <button
        onClick={() => setShowNotation(!showNotation)}
        className="mt-4 text-sm text-brand-600 hover:text-brand-800 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
      >
        {showNotation ? "Ocultar notación" : "Ver notación"}
      </button>

      {showNotation && (
        <ul className="mt-2 list-disc list-inside text-sm text-brand-700 space-y-1">
          {node.notation.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}

      {/* Common mistakes toggle */}
      <button
        onClick={() => setShowMistakes(!showMistakes)}
        className="mt-2 text-sm text-brand-600 hover:text-brand-800 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
      >
        {showMistakes ? "Ocultar errores comunes" : "Ver errores comunes"}
      </button>

      {showMistakes && (
        <ul className="mt-2 list-disc list-inside text-sm text-red-600 space-y-1">
          {node.commonMistakes.map((mistake, i) => (
            <li key={i}>{mistake}</li>
          ))}
        </ul>
      )}

      {/* Practice prompts */}
      {node.practicePrompts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-brand-100">
          <p className="text-xs font-medium text-brand-500 mb-1">
            Para practicar:
          </p>
          <ul className="text-sm text-brand-700 space-y-1">
            {node.practicePrompts.map((prompt, i) => (
              <li key={i}>• {prompt}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
