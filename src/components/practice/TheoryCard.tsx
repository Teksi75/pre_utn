"use client";

import { useState } from "react";
import { NumberLineInterval } from "@/components/math/NumberLineInterval";
import { RichText } from "@/components/math/RichText";
import type { TheoryNode } from "@/domain/models/theory";

interface TheoryCardProps {
  readonly node: TheoryNode;
}

function conceptCardClass(id: string): string {
  if (id === "concept-atencion-cero-naturales") {
    return "border-amber-300 bg-amber-50";
  }

  if (id === "concept-error-comun-correccion") {
    return "border-red-200 bg-red-50";
  }

  if (id === "concept-cierre-dominio") {
    return "border-green-200 bg-green-50";
  }

  return "border-brand-200 bg-brand-50";
}

function conceptTitleClass(id: string): string {
  if (id === "concept-atencion-cero-naturales") return "text-amber-900";
  if (id === "concept-error-comun-correccion") return "text-red-800";
  if (id === "concept-cierre-dominio") return "text-green-800";
  return "text-brand-900";
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
          <section
            key={concept.id}
            className={`rounded-[var(--radius-card)] border p-4 shadow-sm ${conceptCardClass(concept.id)}`}
          >
            <h3 className={`text-[var(--text-lg)] font-semibold ${conceptTitleClass(concept.id)}`}>
              <RichText text={concept.title} />
            </h3>
            <div className="mt-1 text-sm text-brand-700 leading-[var(--leading-relaxed)]">
              <RichText text={concept.body} />
            </div>
          </section>
        ))}
      </div>

      {node.intervalVisuals && node.intervalVisuals.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="text-xs font-medium text-brand-500">
            Representación en recta numérica:
          </div>
          {node.intervalVisuals.map((visual) => (
            <NumberLineInterval
              key={visual.id}
              interval={visual.interval}
              title={visual.title}
              description={<RichText text={visual.description} />}
            />
          ))}
        </div>
      )}

      {/* Notation toggle */}
      <button
        onClick={() => setShowNotation(!showNotation)}
        className="mt-4 min-h-[44px] inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm transition-colors hover:border-brand-400 hover:bg-brand-100 focus-visible:shadow-[var(--ring-focus)]"
      >
        <span aria-hidden="true">{showNotation ? "−" : "+"}</span>
        {showNotation ? "Ocultar notación" : "Ver notación"}
      </button>

      <div
        className="overflow-hidden transition-all duration-[var(--duration-normal)]"
        style={{ maxHeight: showNotation ? '500px' : '0px' }}
        aria-hidden={!showNotation}
      >
        <ul className="mt-2 list-disc list-inside text-sm text-brand-700 space-y-1">
          {node.notation.map((item, i) => (
            <li key={i}><RichText text={item} /></li>
          ))}
        </ul>
      </div>

      {/* Common mistakes toggle */}
      <button
        onClick={() => setShowMistakes(!showMistakes)}
        className="mt-2 min-h-[44px] inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100 focus-visible:shadow-[var(--ring-focus)]"
      >
        <span aria-hidden="true">{showMistakes ? "−" : "+"}</span>
        {showMistakes ? "Ocultar errores comunes" : "Ver errores comunes"}
      </button>

      <div
        className="overflow-hidden transition-all duration-[var(--duration-normal)]"
        style={{ maxHeight: showMistakes ? '500px' : '0px' }}
        aria-hidden={!showMistakes}
      >
        <ul className="mt-2 list-disc list-inside text-sm text-red-600 space-y-1">
          {node.commonMistakes.map((mistake, i) => (
            <li key={i}><RichText text={mistake} /></li>
          ))}
        </ul>
      </div>

      {/* Practice prompts */}
      {node.practicePrompts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-brand-100">
          <div className="text-xs font-medium text-brand-500 mb-1">
            {node.skillId === "mat.u1.conjuntos_numericos"
              ? "Antes de pasar a la práctica:"
              : "Para practicar:"}
          </div>
          <ul className="text-sm text-brand-700 space-y-1">
            {node.practicePrompts.map((prompt, i) => (
              <li key={i}>• <RichText text={prompt} /></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
