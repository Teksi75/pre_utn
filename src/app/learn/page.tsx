import Link from "next/link";

export default function LearnPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-[var(--text-3xl)] font-bold text-brand-900 mb-3 tracking-tight">
        Aprender
      </h1>
      <p className="text-brand-600 text-[var(--text-lg)] mb-8 max-w-md">
        Estudiá la teoría antes de practicar. Elegí una materia para comenzar.
      </p>

      <nav className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl" aria-label="Materias disponibles">
        <Link
          href="/learn/matematica"
          className="group block shadow-[var(--shadow-card)] rounded-[var(--radius-card)] p-6 bg-white border border-brand-200 hover:shadow-[var(--shadow-elevated)] hover:border-brand-300 transition-all duration-[var(--duration-normal)] transition-shadow duration-[var(--duration-normal)]"
        >
          <span className="text-[var(--text-lg)] font-semibold text-brand-900 group-hover:text-accent-600 transition-colors">
            Matemática
          </span>
          <span className="block text-sm text-brand-500 mt-2 leading-[var(--leading-relaxed)]">
            Unidad 1: Números reales, operaciones e intervalos.
          </span>
        </Link>
      </nav>
    </div>
  );
}
