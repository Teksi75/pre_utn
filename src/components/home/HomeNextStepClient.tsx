"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isSkillReady } from "../../domain/catalog/readiness";
import { PILOT_SKILLS } from "../../domain/catalog/pilot-skills";
import {
  deriveHomeNextStep,
  type HomeNextStep,
} from "../../domain/next-step/index";
import { loadProgress } from "../../lib/practice-progress";
import { SkillRoadmap } from "./SkillRoadmap";
import { StudyPlanSection } from "./StudyPlanSection";

/**
 * Home hero — Zone 1 ("Tu estado") + Zone 2 ("Tu camino") of the home page.
 *
 * The client-side hydration reads progress + readiness, then delegates all
 * decision logic to `deriveHomeNextStep` in the domain layer. The component
 * itself only renders the data the domain returns.
 */
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

    setNextStep(deriveHomeNextStep(progress, readySkills, [...PILOT_SKILLS]));
  }, []);

  if (!nextStep) {
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="rounded-[var(--radius-card)] border border-[var(--color-brand-200)] bg-white p-5 shadow-[var(--shadow-card)]"
      >
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-[var(--color-brand-200)] rounded w-1/3" />
          <div className="h-5 bg-[var(--color-brand-200)] rounded w-3/4" />
          <div className="h-4 bg-[var(--color-brand-200)] rounded w-full" />
          <div className="h-10 bg-[var(--color-brand-200)] rounded-[var(--radius-button)] w-40" />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="home-hero-title"
      className="space-y-4"
    >
      {/* Zone 1 — Tu estado (MAX visual weight) */}
      <article
        data-testid="home-state-card"
        className="rounded-[var(--radius-card)] border-2 border-[var(--color-brand-300)] bg-[var(--color-brand-50)] p-6 shadow-[var(--shadow-elevated)]"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-600)]">
          Tu estado
        </p>
        <h2
          id="home-hero-title"
          className="mt-2 text-[var(--text-2xl)] font-bold text-[var(--color-brand-900)] tracking-tight"
        >
          {nextStep.title}
        </h2>
        <p className="mt-2 text-sm leading-[var(--leading-relaxed)] text-[var(--color-brand-700)] max-w-2xl">
          {nextStep.description}
        </p>
        <Link
          href={nextStep.href}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-[var(--radius-button)] bg-[var(--color-brand-900)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-800)] focus-visible:shadow-[var(--ring-focus)]"
        >
          {nextStep.kind === "diagnostic" ? "Hacer diagnóstico →" : "Continuar →"}
        </Link>
      </article>

      {/* Study plan */}
      <StudyPlanSection />

      {/* Zone 2 — Tu camino (MEDIUM visual weight) */}
      {nextStep.roadmapSkills.length > 0 && (
        <article
          aria-labelledby="home-roadmap-title"
          className="rounded-[var(--radius-card)] border border-[var(--color-brand-200)] bg-white p-5 shadow-[var(--shadow-card)]"
        >
          <div className="mb-4 flex items-baseline justify-between gap-3 flex-wrap">
            <h3
              id="home-roadmap-title"
              className="text-sm font-semibold uppercase tracking-wide text-[var(--color-brand-700)]"
            >
              Tu camino
            </h3>
            {nextStep.diagnosticSummary && (
              <span className="text-xs text-[var(--color-brand-500)]">
                Diagnóstico: {nextStep.diagnosticSummary.weakSkills} de{" "}
                {nextStep.diagnosticSummary.totalSkills} habilidades por
                reforzar
              </span>
            )}
          </div>
          <SkillRoadmap
            skills={nextStep.roadmapSkills}
            nextSkillId={nextStep.skillId}
          />
        </article>
      )}
    </section>
  );
}
