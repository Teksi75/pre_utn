import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <section className="text-center mb-10">
        <h1 className="text-[var(--text-3xl)] font-bold text-brand-900 mb-3 tracking-tight">
          Pre UTN
        </h1>
        <p className="text-brand-600 text-[var(--text-lg)] max-w-md mx-auto">
          Preparación para el ingreso a Ingeniería UTN Mendoza.
        </p>
      </section>

      <nav
        className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto"
        aria-label="Acciones principales"
      >
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
        <Link
          href="/diagnostic"
          className="group block shadow-[var(--shadow-card)] rounded-[var(--radius-card)] p-6 bg-white border border-brand-200 hover:shadow-[var(--shadow-elevated)] hover:border-brand-300 transition-all duration-[var(--duration-normal)]"
        >
          <span className="text-[var(--text-lg)] font-semibold text-brand-900 group-hover:text-accent-600 transition-colors">
            Diagnóstico
          </span>
          <span className="block text-sm text-brand-500 mt-2 leading-[var(--leading-relaxed)]">
            Descubrí qué habilidades necesitás reforzar.
          </span>
        </Link>
      </nav>
    </div>
  );
}
