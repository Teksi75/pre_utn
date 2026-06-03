"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getPracticeHrefForSuggestion } from "./practice-link";
import type { SkillEstimate, PracticeSuggestion } from "@/domain/diagnostic/index";

interface ResultsDisplayProps {
  readonly estimates: readonly SkillEstimate[];
  readonly suggestions: readonly PracticeSuggestion[];
  readonly onRestart?: () => void;
  /**
   * Handler invoked when the student clicks "Crear plan de estudio".
   * The parent is responsible for computing the plan (from
   * `estimates` + `suggestions` + practice progress), persisting it,
   * and surfacing a success state. Returning `true` from the handler
   * causes the card to flip to its "plan created" state.
   */
  readonly onCreatePlan?: () => boolean;
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
export function ResultsDisplay({
  estimates,
  suggestions,
  onRestart,
  onCreatePlan,
}: ResultsDisplayProps) {
  const [planCreated, setPlanCreated] = useState(false);

  const handleCreatePlan = () => {
    if (!onCreatePlan) return;
    const ok = onCreatePlan();
    if (ok) setPlanCreated(true);
  };
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
                  {(() => {
                    const practiceHref = getPracticeHrefForSuggestion(s.skillId);

                    if (!practiceHref) {
                      return (
                        <span className="text-sm text-amber-700 bg-amber-100 min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)]">
                          Ruta en preparación
                        </span>
                      );
                    }

                    return (
                      <Link
                        href={practiceHref}
                        className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
                      >
                        Practicar →
                      </Link>
                    );
                  })()}
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

      {/* Create study plan — only offered when there's at least one signal
          (weak skills flagged OR something to plan around). Hidden once
          the plan has been created so we don't show the button twice. */}
      {onCreatePlan && !planCreated && suggestions.length > 0 && (
        <div
          className="border border-brand-300 bg-brand-50 rounded-[var(--radius-card)] p-4 space-y-3"
          data-testid="create-plan-card"
        >
          <div>
            <p className="text-sm font-semibold text-brand-900">
              Convertí tu diagnóstico en un plan
            </p>
            <p className="text-xs text-brand-700 mt-1">
              Vamos a generar un plan priorizado de práctica basado en lo
              que acabás de responder. Lo vas a ver en la página de inicio.
            </p>
          </div>
          <Button
            onClick={handleCreatePlan}
            className="w-full sm:w-auto"
            data-testid="create-plan-button"
          >
            Crear plan de estudio
          </Button>
        </div>
      )}

      {planCreated && (
        <div
          className="bg-green-50 border border-green-200 rounded-[var(--radius-card)] p-4 space-y-2"
          data-testid="plan-created-card"
        >
          <p className="text-sm font-semibold text-green-800">
            ¡Listo! Guardamos tu plan de estudio.
          </p>
          <p className="text-xs text-green-700">
            Lo encontrás en la página de inicio, con el orden sugerido y los
            conceptos a reforzar.
          </p>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center px-4 py-2 text-sm font-semibold rounded-[var(--radius-button)] bg-[var(--color-brand-900)] text-white hover:bg-[var(--color-brand-800)] transition-colors focus-visible:shadow-[var(--ring-focus)]"
          >
            Ver plan en inicio →
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/"
          className="flex-1 text-center bg-brand-100 text-brand-700 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-200 min-h-[44px] inline-flex items-center justify-center transition-colors focus-visible:shadow-[var(--ring-focus)]"
        >
          Volver al inicio
        </Link>
        <Button onClick={onRestart} className="flex-1">
          Repetir diagnóstico
        </Button>
      </div>
    </div>
  );
}
