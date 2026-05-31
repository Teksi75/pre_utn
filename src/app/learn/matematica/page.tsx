import Link from "next/link";
import { loadTheoryContent } from "@/domain/catalog/content-loaders";

const SKILL_DISPLAY_NAMES: Record<string, string> = {
  "mat.u1.reales_operaciones": "Números reales y operaciones",
  "mat.u1.intervalos": "Intervalos",
};

export default function LearnMatematicaPage() {
  const theoryNodes = loadTheoryContent("unit-1");

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link
          href="/learn"
          className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
        >
          ← Volver a materias
        </Link>
      </div>

      <h1 className="text-[var(--text-3xl)] font-bold text-brand-900 mb-3 tracking-tight">
        Matemática — Unidad 1
      </h1>
      <p className="text-brand-600 text-[var(--text-lg)] mb-8 max-w-md">
        Elegí un tema para estudiar la teoría.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        {theoryNodes.map((node) => {
          const displayName = SKILL_DISPLAY_NAMES[node.skillId] ?? node.skillId;
          return (
            <Link
              key={node.id}
              href={`/learn/matematica/${encodeURIComponent(node.skillId)}`}
              className="group block shadow-[var(--shadow-card)] rounded-[var(--radius-card)] p-6 bg-white border border-brand-200 hover:shadow-[var(--shadow-elevated)] hover:border-brand-300 transition-all duration-[var(--duration-normal)]"
            >
              <span className="text-[var(--text-lg)] font-semibold text-brand-900 group-hover:text-accent-600 transition-colors">
                {displayName}
              </span>
              <span className="block text-sm text-brand-500 mt-2 leading-[var(--leading-relaxed)]">
                {node.concepts[0]?.title ?? "Teoría del tema"}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <Link
          href="/practice"
          className="inline-flex items-center text-sm font-medium text-accent-600 hover:text-accent-700 min-h-[44px] px-3 py-2 rounded-[var(--radius-button)] hover:bg-accent-50 transition-colors focus-visible:shadow-[var(--ring-focus)]"
        >
          Ir a práctica →
        </Link>
      </div>
    </div>
  );
}
