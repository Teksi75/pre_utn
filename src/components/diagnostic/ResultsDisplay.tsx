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

/**
 * Ranked skill estimates + practice links for weakest skills.
 */
export function ResultsDisplay({ estimates, suggestions, onRestart }: ResultsDisplayProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Resultados del diagnóstico
      </h2>
      <p className="text-xs text-gray-500">
        Estimaciones provisionales basadas en tus respuestas.
      </p>

      {/* All skill estimates */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">
          Habilidades evaluadas
        </h3>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
          {estimates.map((est) => (
            <div key={est.skillId} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-sm font-medium text-gray-900">
                  {skillLabel(est.skillId)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({est.attempts} intento{est.attempts !== 1 ? "s" : ""})
                </span>
              </div>
              <div className="flex items-center gap-3">
                {est.errorTags.length > 0 && (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    {est.errorTags.length} error{est.errorTags.length !== 1 ? "es" : ""}
                  </span>
                )}
                <span
                  className={`text-sm font-semibold ${
                    est.accuracy >= 0.7
                      ? "text-green-700"
                      : est.accuracy >= 0.4
                        ? "text-yellow-700"
                        : "text-red-700"
                  }`}
                >
                  {Math.round(est.accuracy * 100)}%
                </span>
              </div>
            </div>
          ))}
          {estimates.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              No hay datos para mostrar.
            </div>
          )}
        </div>
      </div>

      {/* Weak-area suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Áreas para practicar
          </h3>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div
                key={s.skillId}
                className="border border-amber-200 bg-amber-50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
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
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          ¡No se detectaron habilidades débiles! Seguí practicando para mantener
          el nivel.
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Link
          href="/"
          className="flex-1 text-center bg-gray-100 text-gray-700 px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
        >
          Volver al inicio
        </Link>
        <button
          onClick={onRestart}
          className="flex-1 bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Repetir diagnóstico
        </button>
      </div>
    </div>
  );
}
