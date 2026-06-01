import Link from "next/link";
import { HomeNextStepClient } from "@/components/home/HomeNextStepClient";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <section className="rounded-[var(--radius-card)] border border-brand-200 bg-white p-6 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">
          Matemática · ingreso UTN Mendoza
        </p>
        <h1 className="mt-2 text-[var(--text-3xl)] font-bold text-brand-900 tracking-tight">
          Tablero de preparación UTN
        </h1>
        <p className="mt-3 max-w-2xl text-brand-600 text-[var(--text-lg)] leading-[var(--leading-relaxed)]">
          La app complementa las clases presenciales: primero diagnosticás,
          después practicás y luego revisás errores.
        </p>
      </section>

      <HomeNextStepClient />

      <section
        aria-labelledby="course-state-title"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <div className="rounded-[var(--radius-card)] border border-brand-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 id="course-state-title" className="text-[var(--text-lg)] font-semibold text-brand-900">
            Estado del curso
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-brand-600">Matemática</dt>
              <dd className="font-medium text-green-700">Activa</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-brand-600">Física</dt>
              <dd className="font-medium text-brand-500">Segunda etapa</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-brand-600">Unidad piloto</dt>
              <dd className="font-medium text-amber-700">Unidad 1 parcial</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[var(--radius-card)] border border-brand-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-[var(--text-lg)] font-semibold text-brand-900">
            Skills listas
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-brand-700">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-600" aria-hidden="true" />
              Números reales y operaciones
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-600" aria-hidden="true" />
              Intervalos
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-600" aria-hidden="true" />
              Potencias y raíces
            </li>
          </ul>
          <p className="mt-4 text-xs leading-[var(--leading-relaxed)] text-brand-500">
            El resto de las unidades no se presentan como curso completo hasta
            tener teoría, ejemplos, práctica, feedback y evaluación suficientes.
          </p>
        </div>
      </section>

      <nav
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        aria-label="Acciones principales"
      >
        <Link
          href="/diagnostic"
          className="group block shadow-[var(--shadow-card)] rounded-[var(--radius-card)] p-6 bg-white border border-brand-200 hover:shadow-[var(--shadow-elevated)] hover:border-brand-300 transition-all duration-[var(--duration-normal)]"
        >
          <span className="text-[var(--text-lg)] font-semibold text-brand-900 group-hover:text-accent-600 transition-colors">
            Hacer diagnóstico
          </span>
          <span className="block text-sm text-brand-500 mt-2 leading-[var(--leading-relaxed)]">
            Detectá qué habilidad conviene practicar primero.
          </span>
        </Link>
        <Link
          href="/learn"
          className="group block shadow-[var(--shadow-card)] rounded-[var(--radius-card)] p-6 bg-white border border-brand-200 hover:shadow-[var(--shadow-elevated)] hover:border-brand-300 transition-all duration-[var(--duration-normal)]"
        >
          <span className="text-[var(--text-lg)] font-semibold text-brand-900 group-hover:text-accent-600 transition-colors">
            Aprender Unidad 1
          </span>
          <span className="block text-sm text-brand-500 mt-2 leading-[var(--leading-relaxed)]">
            Revisá la teoría y ejemplos disponibles de la unidad piloto.
          </span>
        </Link>
        <Link
          href="/practice"
          className="group block shadow-[var(--shadow-card)] rounded-[var(--radius-card)] p-6 bg-white border border-brand-200 hover:shadow-[var(--shadow-elevated)] hover:border-brand-300 transition-all duration-[var(--duration-normal)]"
        >
          <span className="text-[var(--text-lg)] font-semibold text-brand-900 group-hover:text-accent-600 transition-colors">
            Práctica
          </span>
          <span className="block text-sm text-brand-500 mt-2 leading-[var(--leading-relaxed)]">
            Elegí una habilidad y practicá ejercicios con retroalimentación.
          </span>
        </Link>
        <div
          className="block shadow-[var(--shadow-card)] rounded-[var(--radius-card)] p-6 bg-brand-50 border border-brand-200"
          aria-disabled="true"
        >
          <span className="text-[var(--text-lg)] font-semibold text-brand-500">
            Simulacro
          </span>
          <span className="block text-sm text-brand-500 mt-2 leading-[var(--leading-relaxed)]">
            En preparación. Se desbloquea cuando exista una ruta evaluable más completa.
          </span>
        </div>
      </nav>
    </div>
  );
}
