import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTheoryContent, loadExampleContent } from "@/domain/catalog/content-loaders";
import { TheoryCard } from "@/components/practice/TheoryCard";
import { WorkedExamplesSection } from "@/components/practice/WorkedExamplesSection";
import { DirectionalTransition } from "@/components/ui/DirectionalTransition";
import { PILOT_SKILL_UNIT_MAP } from "@/domain/catalog/pilot-skills";
import type { SkillId } from "@/domain/models/skill";

interface LearnSkillPageProps {
  params: Promise<{ skillId: string }>;
}

export default async function LearnSkillPage({ params }: LearnSkillPageProps) {
  const { skillId } = await params;
  const decodedSkillId = decodeURIComponent(skillId) as SkillId;
  const unitKey = PILOT_SKILL_UNIT_MAP[decodedSkillId];

  if (!unitKey) {
    notFound();
  }

  const theoryNode = loadTheoryContent(unitKey).find((t) => t.skillId === decodedSkillId) ?? null;
  const examples = loadExampleContent(unitKey).filter((e) => e.skillId === decodedSkillId);

  if (!theoryNode) {
    notFound();
  }

  return (
    <DirectionalTransition>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link
            href="/learn/matematica"
            transitionTypes={["nav-back"]}
            className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
          >
            ← Volver a temas
          </Link>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 bg-amber-50 px-2.5 py-1 rounded-[var(--radius-badge)] mb-4">
          Teoría
        </div>

        <TheoryCard node={theoryNode} />

        <WorkedExamplesSection examples={examples} />

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/practice"
            transitionTypes={["nav-forward"]}
            className="flex-1 text-center bg-brand-900 text-white px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-800 min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
          >
            Ir a práctica
          </Link>
          <Link
            href="/learn/matematica"
            transitionTypes={["nav-back"]}
            className="flex-1 text-center bg-brand-100 text-brand-700 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-200 min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
          >
            Ver otros temas
          </Link>
        </div>
      </div>
    </DirectionalTransition>
  );
}
