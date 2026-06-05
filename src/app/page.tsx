import Link from "next/link";
import { HomeNextStepClient } from "@/components/home/HomeNextStepClient";
import { MathThemePlate } from "@/components/math-visuals/MathThemePlate";

/**
 * Home page — editorial layout with hero, camino de aprendizaje, and
 * acciones rápidas. Left sidebar (Ingenium nav) lives in the Nav component;
 * this page uses a single-column editorial flow.
 *
 * Zones:
 *   Zone 1: "Tu estado"  — Hero via HomeNextStepClient (MathThemePlate bg)
 *   Zone 2: "Tu camino"  — Roadmap embedded in Zone 1
 *   Zone 3: "Acciones"   — Quick action links
 */
export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Editorial hero with MathThemePlate background */}
      <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-6 md:p-8 mb-8">
        <MathThemePlate
          topic="sets"
          variant="hero"
          opacity={0.1}
          className="absolute inset-0"
        />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-600)] mb-2">
            Preparación independiente
          </p>
          <h1 className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold text-[var(--color-brand-900)] tracking-tight mb-2">
            Tu camino al ingreso a Ingeniería
          </h1>
          <p className="text-sm leading-[var(--leading-relaxed)] text-[var(--color-brand-700)] max-w-2xl">
            Preparación independiente para ingreso a Ingenierías. Practicá,
            diagnosticá tu nivel y seguí tu camino personalizado.
          </p>
        </div>
      </section>

      {/* Zone 1 + Zone 2 — HomeNextStepClient (hero + roadmap + study plan) */}
      <HomeNextStepClient />

      {/* Zone 3 — Acciones rápidas */}
      <section
        aria-labelledby="home-actions-title"
        className="mt-8 space-y-3"
      >
        <h2
          id="home-actions-title"
          className="text-sm font-semibold uppercase tracking-wide text-[var(--color-brand-700)]"
        >
          Acciones rápidas
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <li>
            <Link
              href="/diagnostic"
              className="flex items-center justify-between gap-3 rounded-[var(--radius-button)] border border-[var(--color-brand-200)] bg-white px-4 py-2.5 text-[var(--color-brand-700)] hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)] transition-colors focus-visible:shadow-[var(--ring-focus)] min-h-[44px]"
            >
              <span>Hacer diagnóstico</span>
              <span aria-hidden="true" className="text-[var(--color-brand-500)]">
                →
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/practice"
              className="flex items-center justify-between gap-3 rounded-[var(--radius-button)] border border-[var(--color-brand-200)] bg-white px-4 py-2.5 text-[var(--color-brand-700)] hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)] transition-colors focus-visible:shadow-[var(--ring-focus)] min-h-[44px]"
            >
              <span>Ir a práctica</span>
              <span aria-hidden="true" className="text-[var(--color-brand-500)]">
                →
              </span>
            </Link>
          </li>
        </ul>
      </section>

      {/* Contexto del curso — low visual weight */}
      <section
        aria-labelledby="course-state-title"
        className="mt-8 opacity-80 space-y-3"
      >
        <h2
          id="course-state-title"
          className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand-500)]"
        >
          Contexto del curso
        </h2>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-brand-200)] bg-white p-4 shadow-[var(--shadow-card)]">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
              <dt className="text-[var(--color-brand-600)]">Matemática</dt>
              <dd className="font-medium text-green-700">Activa</dd>
            </div>
            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
              <dt className="text-[var(--color-brand-600)]">Física</dt>
              <dd className="font-medium text-[var(--color-brand-500)]">
                Segunda etapa
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
              <dt className="text-[var(--color-brand-600)]">Unidad piloto</dt>
              <dd className="font-medium text-amber-700">
                Unidad 1 parcial
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-[var(--leading-relaxed)] text-[var(--color-brand-500)]">
            El resto de las unidades no se presentan como curso completo hasta
            tener teoría, ejemplos, práctica, feedback y evaluación suficientes.
          </p>
        </div>
      </section>
    </div>
  );
}
