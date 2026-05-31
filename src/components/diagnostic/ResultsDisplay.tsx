"use client";

import Link from "next/link";
import type { SkillEstimate, PracticeSuggestion } from "@/domain/diagnostic/index";

interface ResultsDisplayProps {
  readonly estimates: readonly SkillEstimate[];
  readonly suggestions: readonly PracticeSuggestion[];
  readonly onRestart?: () => void;
}

function skillLabel(skillId: string): string {
  const parts = skillId.split(".");
  if (parts.length < 2) return skillId;
  const raw = parts[parts.length - 1];
  return raw
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function accuracyColor(accuracy: number): string {
  if (accuracy >= 0.7) return "text-green-700 bg-green-50";
  if (accuracy >= 0.4) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

/**
 * Ranked skill estimates + practice links for weakest skills.
 */
export function ResultsDisplay({ estimates, suggestions, onRestart }: ResultsDisplayProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-[var(--text-xl)] font-bold text-brand-900">
        Resultados del diagnóstico
      </h2>
      <p className="text-xs text-brand-500">
        Estimaciones provisionales basadas en tus respuestas.
      </p>

      {/* All skill estimates */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-brand-700">
          Habilidades evaluadas
        </h3>
        <div className="shadow-[var(--shadow-card)] rounded-[var(--radius-card)] divide-y divide-brand-200 bg-white border border-brand-200">
          {estimates.map((est) => (
            <div key={est.skillId} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-2">
              <div className="min-w-0">
                <span className="text-sm font-medium text-brand-900">
                  {skillLabel(est.skillId)}
                </span>
                <span className="text-xs text-brand-500 ml-2">
                  ({est.attempts} intento{est.attempts !== 1 ? "s" : ""})
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {est.errorTags.length > 0 && (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-[var(--radius-badge)]">
                    {est.errorTags.length} error{est.errorTags.length !== 1 ? "es" : ""}
                  </span>
                )}
                <span
                  className={`text-sm font-bold px-2 py-0.5 rounded-[var(--radius-badge)] ${accuracyColor(est.accuracy)}`}
                >
                  {Math.round(est.accuracy * 100)}%
                </span>
              </div>
            </div>
          ))}
          {estimates.length === 0 && (
            <div className="px-4 py-3 text-sm text-brand-500">
              No hay datos para mostrar.
            </div>
          )}
        </div>
      </div>

      {/* Weak-area suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-brand-700">
            Áreas para practicar
          </h3>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div
                key={s.skillId}
                className="border border-amber-200 bg-amber-50 rounded-[var(--radius-card)] p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium text-amber-800">
                      {skillLabel(s.skillId)}
                    </span>
                    <span className="text-xs text-amber-600 ml-2">
                      {Math.round(s.accuracy * 100)}% precisión
                    </span>
                  </div>
                  <Link
                    href={`/practice?skill=${s.skillId}`}
                    className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
                  >
                    Practicar →
                  </Link>
                </div>
                {s.errorTags.length > 0 && (
                  <div className="mt-2 text-xs text-amber-700">
                    Errores observados: {s.errorTags.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions.length === 0 && estimates.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-[var(--radius-card)] p-4 text-sm text-green-800">
          ¡No se detectaron habilidades débiles! Seguí practicando para mantener
          el nivel.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/"
          className="flex-1 text-center bg-brand-100 text-brand-700 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-200 min-h-[44px] inline-flex items-center justify-center transition-colors focus-visible:shadow-[var(--ring-focus)]"
        >
          Volver al inicio
        </Link>
        <button
          onClick={onRestart}
          className="flex-1 bg-brand-900 text-white px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-800 min-h-[44px] transition-colors focus-visible:shadow-[var(--ring-focus)]"
        >
          Repetir diagnóstico
        </button>
      </div>
    </div>
  );
}
