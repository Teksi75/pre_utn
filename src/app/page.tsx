import Link from "next/link";
import { HomeNextStepClient } from "@/components/home/HomeNextStepClient";

/**
 * Home page — student dashboard for the Instituto.
 *
 * The editorial hero and MathWatermark wrapper have been moved into
 * the HomeNextStepClient component. This page now provides the
 * outer layout: dashboard, quick actions, and course context.
 *
 * B3 (redesign closeout): the dashboard is for the student.
 * The brand is carried by the top-left brand mark of the
 * header (mixed-case logo) and the hero wordmark (all-caps
 * INGENIUM). The institute's full name is NOT re-stated in
 * the hero subtitle. The future teacher-facing panel (where
 * the profesor can see each student's progress) is a
 * separate product with its own SDD; see AGENTS.md "Marca y
 * voz".
 */
export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Dashboard — HomeNextStepClient renders hero + situation + study plan + route + decisions */}
      <HomeNextStepClient />

      {/* Zone 3 — Acciones rápidas (B5: lower visual weight) */}
      <section
        aria-labelledby="home-actions-title"
        className="mt-8 space-y-3 opacity-90"
      >
        <h2
          id="home-actions-title"
          className="text-xs font-medium uppercase tracking-wide text-[var(--color-brand-500)]"
        >
          Acciones rápidas
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <li>
            <Link
              href="/diagnostic"
              className="flex items-center justify-between gap-3 rounded-[var(--radius-button)] border border-[var(--color-brand-200)] bg-transparent px-4 py-2.5 text-[var(--color-brand-600)] hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-900)] hover:bg-[var(--color-brand-50)] transition-colors focus-visible:shadow-[var(--ring-focus)] min-h-[44px]"
            >
              <span>Hacer diagnóstico</span>
              <span aria-hidden="true" className="text-[var(--color-brand-400)]">
                →
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/practice"
              className="flex items-center justify-between gap-3 rounded-[var(--radius-button)] border border-[var(--color-brand-200)] bg-transparent px-4 py-2.5 text-[var(--color-brand-600)] hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-900)] hover:bg-[var(--color-brand-50)] transition-colors focus-visible:shadow-[var(--ring-focus)] min-h-[44px]"
            >
              <span>Ir a práctica</span>
              <span aria-hidden="true" className="text-[var(--color-brand-400)]">
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
        <div className="app-glass-surface rounded-[var(--radius-card)] p-4">
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
                Unidades 1 y 2
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
