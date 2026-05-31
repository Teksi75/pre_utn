import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTheoryContent, loadExampleContent } from "@/domain/catalog/content-loaders";
import { TheoryCard } from "@/components/practice/TheoryCard";
import { WorkedExampleCard } from "@/components/practice/WorkedExampleCard";
import type { SkillId } from "@/domain/models/skill";

const SKILL_UNIT_MAP: Record<string, string> = {
  "mat.u1.reales_operaciones": "unit-1",
  "mat.u1.intervalos": "unit-1",
};

interface LearnSkillPageProps {
  params: Promise<{ skillId: string }>;
}

export default async function LearnSkillPage({ params }: LearnSkillPageProps) {
  const { skillId } = await params;
  const decodedSkillId = decodeURIComponent(skillId) as SkillId;
  const unitKey = SKILL_UNIT_MAP[decodedSkillId];

  if (!unitKey) {
    notFound();
  }

  const theoryNode = loadTheoryContent(unitKey).find((t) => t.skillId === decodedSkillId) ?? null;
  const examples = loadExampleContent(unitKey).filter((e) => e.skillId === decodedSkillId);

  if (!theoryNode) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link
          href="/learn/matematica"
          className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
        >
          ← Volver a temas
        </Link>
      </div>

      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 bg-amber-50 px-2.5 py-1 rounded-[var(--radius-badge)] mb-4">
        Teoría
      </div>

      <TheoryCard node={theoryNode} />

      {/* Worked examples section */}
      {examples.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[var(--text-xl)] font-semibold text-brand-900 mb-4">
            Ejemplos resueltos
          </h2>
          <div className="space-y-4">
            {examples.map((example) => (
              <WorkedExampleCard key={example.id} example={example} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/practice"
          className="flex-1 text-center bg-brand-900 text-white px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-800 min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
        >
          Ir a práctica
        </Link>
        <Link
          href="/learn/matematica"
          className="flex-1 text-center bg-brand-100 text-brand-700 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-200 min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
        >
          Ver otros temas
        </Link>
      </div>
    </div>
  );
}
