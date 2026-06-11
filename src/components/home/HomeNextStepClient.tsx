"use client";

import { useEffect, useState } from "react";
import { isSkillReady } from "../../domain/catalog/readiness";
import { PILOT_SKILLS } from "../../domain/catalog/pilot-skills";
import {
  deriveHomeNextStep,
  type HomeNextStep,
} from "../../domain/next-step/index";
import { loadProgress } from "../../lib/practice-progress";
import { MathWatermark } from "../math-visuals";
import { TeacherDigitalHero } from "./teacher-home/TeacherDigitalHero";
import { StudentSituationPanel } from "./teacher-home/StudentSituationPanel";
import { MathRoutePanel } from "./teacher-home/MathRoutePanel";
import { DecisionBoardPanel } from "./teacher-home/DecisionBoardPanel";
import {
  deriveTeacherHomeViewModel,
  type TeacherHomeViewModel,
} from "../../domain/teacher-home/index";

/**
 * Home dashboard — replaced the old Zone 1 hero + Zone 2 roadmap
 * with the teacher-digital-home view-model and panels.
 *
 * Client-side hydration:
 * 1. Load progress from localStorage
 * 2. Filter ready skills via isSkillReady
 * 3. Compute nextStep with deriveHomeNextStep
 * 4. Build teacher view-model via deriveTeacherHomeViewModel
 * 5. Render 4 dumb panels from the view-model
 */
export function HomeNextStepClient() {
  const [nextStep, setNextStep] = useState<HomeNextStep | null>(null);
  const [viewModel, setViewModel] = useState<TeacherHomeViewModel | null>(null);

  useEffect(() => {
    const progress = loadProgress();
    const readySkills = PILOT_SKILLS.filter(
      (skill) => isSkillReady(skill.skillId).ready
    ).map((skill) => ({
      skillId: skill.skillId,
      label: skill.label,
    }));

    // Backward-compatible: keep deriveHomeNextStep for existing consumers
    const computedNextStep = deriveHomeNextStep(
      progress,
      readySkills,
      [...PILOT_SKILLS]
    );
    setNextStep(computedNextStep);

    // New teacher view-model drives the 4 panels
    setViewModel(
      deriveTeacherHomeViewModel({
        progress,
        diagnosticResult: progress.diagnosticResult ?? null,
        availableSkills: readySkills,
        pilotSkills: [...PILOT_SKILLS],
        nextStep: computedNextStep,
      })
    );
  }, []);

  if (!nextStep || !viewModel) {
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="app-glass-surface rounded-[var(--radius-card)] p-5"
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
    <MathWatermark topic="sets" variant="background">
      <section
        aria-labelledby="tdh-hero-title"
        className="space-y-6"
      >
        {/* Hero — MAX visual weight */}
        <TeacherDigitalHero hero={viewModel.mission} />

        {/* Grid: route + situation side by side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MathRoutePanel routeUnits={viewModel.routeUnits} />
          <StudentSituationPanel situation={viewModel.studentSituation} />
        </div>

        {/* Decision board — action cards */}
        <DecisionBoardPanel decisions={viewModel.primaryActions} />
      </section>
    </MathWatermark>
  );
}
