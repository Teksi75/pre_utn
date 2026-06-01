"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isSkillReady } from "../../domain/catalog/readiness";
import { PILOT_SKILLS } from "../../domain/catalog/pilot-skills";
import { deriveHomeNextStep, type HomeNextStep } from "../../domain/next-step/index";
import { loadProgress } from "../../lib/practice-progress";

export function HomeNextStepClient() {
  const [nextStep, setNextStep] = useState<HomeNextStep | null>(null);

  useEffect(() => {
    const progress = loadProgress();
    const readySkills = PILOT_SKILLS.filter(
      (skill) => isSkillReady(skill.skillId).ready
    ).map((skill) => ({
      skillId: skill.skillId,
      label: skill.label,
    }));

    setNextStep(deriveHomeNextStep(progress, readySkills));
  }, []);

  if (!nextStep) {
    return (
      <div className="rounded-[var(--radius-card)] border border-brand-200 bg-white p-5 shadow-[var(--shadow-card)]">
        <p className="text-sm text-brand-500">Calculando próximo paso...</p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="next-step-title"
      className="rounded-[var(--radius-card)] border border-accent-500/30 bg-amber-50 p-5 shadow-[var(--shadow-card)]"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">
        Próximo paso recomendado
      </p>
      <h2 id="next-step-title" className="mt-2 text-[var(--text-xl)] font-bold text-brand-900">
        {nextStep.title}
      </h2>
      <p className="mt-2 text-sm leading-[var(--leading-relaxed)] text-brand-700">
        {nextStep.description}
      </p>
      <Link
        href={nextStep.href}
        className="mt-4 inline-flex min-h-[44px] items-center rounded-[var(--radius-button)] bg-brand-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800 focus-visible:shadow-[var(--ring-focus)]"
      >
        Ir ahora →
      </Link>
    </section>
  );
}
