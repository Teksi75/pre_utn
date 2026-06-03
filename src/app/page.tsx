import Link from "next/link";
import { HomeNextStepClient } from "@/components/home/HomeNextStepClient";
import { Card } from "@/components/ui/Card";

/**
 * Home page — 4 pedagogical zones, ordered by visual weight:
 *
 *   Zone 1: "Tu estado"        — HERO (max weight)  → HomeNextStepClient
 *   Zone 2: "Tu camino"        — embedded in Zone 1  → SkillRoadmap
 *   Zone 3: "Acciones"         — low weight         → contextual links
 *   Zone 4: "Contexto del curso" — very low weight   → demoted to bottom
 *
 * The 4 equal cards from the previous design are gone: links are
 * reorganized by relevance to the user's current state instead of by
 * visual parity.
 */
export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Zone 1 + Zone 2 — the hero rendered by the client component */}
      <HomeNextStepClient />

      {/* Zone 3 — Acciones (low visual weight) */}
      <section
        aria-labelledby="home-actions-title"
        className="space-y-3"
      >
        <h2
          id="home-actions-title"
          className="text-sm font-semibold uppercase tracking-wide text-brand-700"
        >
          Acciones
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <li>
            <Link
              href="/diagnostic"
              className="flex items-center justify-between gap-3 rounded-[var(--radius-button)] border border-brand-200 bg-white px-4 py-2.5 text-brand-700 hover:border-brand-300 hover:text-brand-900 hover:bg-brand-50 transition-colors focus-visible:shadow-[var(--ring-focus)] min-h-[44px]"
            >
              <span>Hacer diagnóstico</span>
              <span aria-hidden="true" className="text-brand-500">→</span>
            </Link>
          </li>
          <li>
            <Link
              href="/learn"
              className="flex items-center justify-between gap-3 rounded-[var(--radius-button)] border border-brand-200 bg-white px-4 py-2.5 text-brand-700 hover:border-brand-300 hover:text-brand-900 hover:bg-brand-50 transition-colors focus-visible:shadow-[var(--ring-focus)] min-h-[44px]"
            >
              <span>Explorar temas</span>
              <span aria-hidden="true" className="text-brand-500">→</span>
            </Link>
          </li>
          <li>
            <Link
              href="/practice"
              className="flex items-center justify-between gap-3 rounded-[var(--radius-button)] border border-brand-200 bg-white px-4 py-2.5 text-brand-700 hover:border-brand-300 hover:text-brand-900 hover:bg-brand-50 transition-colors focus-visible:shadow-[var(--ring-focus)] min-h-[44px]"
            >
              <span>Ir a práctica</span>
              <span aria-hidden="true" className="text-brand-500">→</span>
            </Link>
          </li>
          <li>
            <span
              aria-disabled="true"
              className="flex items-center justify-between gap-3 rounded-[var(--radius-button)] border border-dashed border-brand-200 bg-brand-50 px-4 py-2.5 text-brand-500 min-h-[44px] cursor-not-allowed"
            >
              <span>Simulacro (en preparación)</span>
              <span aria-hidden="true" className="text-xs uppercase">Pronto</span>
            </span>
          </li>
        </ul>
      </section>

      {/* Zone 4 — Contexto del curso (very low visual weight) */}
      <section
        aria-labelledby="course-state-title"
        className="opacity-80 space-y-3"
      >
        <h2
          id="course-state-title"
          className="text-xs font-semibold uppercase tracking-wide text-brand-500"
        >
          Contexto del curso
        </h2>
        <Card className="p-4">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
              <dt className="text-brand-600">Matemática</dt>
              <dd className="font-medium text-green-700">Activa</dd>
            </div>
            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
              <dt className="text-brand-600">Física</dt>
              <dd className="font-medium text-brand-500">Segunda etapa</dd>
            </div>
            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
              <dt className="text-brand-600">Unidad piloto</dt>
              <dd className="font-medium text-amber-700">Unidad 1 parcial</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-[var(--leading-relaxed)] text-brand-500">
            El resto de las unidades no se presentan como curso completo hasta
            tener teoría, ejemplos, práctica, feedback y evaluación suficientes.
          </p>
        </Card>
      </section>
    </main>
  );
}
