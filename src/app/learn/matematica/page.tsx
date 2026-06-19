import Link from "next/link";
import { loadTheoryContent } from "@/domain/catalog/content-loaders";
import { PILOT_SKILLS } from "@/domain/catalog/pilot-skills";
import { MathWatermark } from "@/components/math-visuals";
import { DirectionalTransition } from "@/components/ui/DirectionalTransition";

const SKILL_DISPLAY_NAMES: Readonly<Record<string, string>> = Object.fromEntries(
  PILOT_SKILLS.map((skill) => [skill.skillId, skill.label])
);

const UNIT_LABELS: Readonly<Record<string, string>> = {
  "unit-1": "Unidad 1 — Aritmética y números",
  "unit-2": "Unidad 2 — Polinomios y álgebra",
};

const UNIT_KEYS = ["unit-1", "unit-2"] as const;

export default function LearnMatematicaPage() {
  const theoryByUnit = UNIT_KEYS.map((key) => ({
    unitKey: key,
    label: UNIT_LABELS[key],
    nodes: loadTheoryContent(key),
  }));

  return (
    <DirectionalTransition>
      <MathWatermark topic="sets" variant="background">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="mb-6">
            <Link
              href="/learn"
              transitionTypes={["nav-back"]}
              className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
            >
              ← Volver a materias
            </Link>
          </div>

          <h1 className="text-[var(--text-3xl)] font-bold text-brand-900 mb-3 tracking-tight">
            Matemática
          </h1>
          <p className="text-brand-600 text-[var(--text-lg)] mb-8 max-w-md">
            Elegí un tema para estudiar la teoría.
          </p>

          {theoryByUnit.map(({ unitKey, label, nodes }) => (
            <section key={unitKey} className="mb-8">
              <h2 className="text-[var(--text-xl)] font-semibold text-brand-800 mb-4">
                {label}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                {nodes.map((node) => {
                  const displayName = SKILL_DISPLAY_NAMES[node.skillId] ?? node.skillId;
                  return (
                    <Link
                      key={node.id}
                      href={`/learn/matematica/${encodeURIComponent(node.skillId)}`}
                      transitionTypes={["nav-forward"]}
                      className="group block shadow-[var(--shadow-card)] rounded-[var(--radius-card)] p-6 bg-white border border-brand-200 hover:shadow-[var(--shadow-elevated)] hover:border-brand-300 transition-shadow transition-colors duration-[var(--duration-normal)] focus-visible:shadow-[var(--ring-focus)]"
                    >
                      <span className="text-[var(--text-lg)] font-semibold text-brand-900 group-hover:text-accent-600 transition-colors">
                        {displayName}
                      </span>
                      <span className="block text-sm text-brand-500 mt-2 leading-[var(--leading-relaxed)]">
                        {node.concepts.length === 1 ? "1 tema" : `${node.concepts.length} temas`}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="mt-8">
            <Link
              href="/practice"
              transitionTypes={["nav-forward"]}
              className="inline-flex items-center text-sm font-medium text-accent-600 hover:text-accent-700 min-h-[44px] px-3 py-2 rounded-[var(--radius-button)] hover:bg-accent-50 transition-colors focus-visible:shadow-[var(--ring-focus)]"
            >
              Ir a práctica →
            </Link>
          </div>
        </div>
      </MathWatermark>
    </DirectionalTransition>
  );
}
