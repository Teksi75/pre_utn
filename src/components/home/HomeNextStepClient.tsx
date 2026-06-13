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
import { useActiveStudent } from "../../hooks/useActiveStudent";
import { StudentGate } from "../StudentGate";
import { StudentSwitcher } from "./StudentSwitcher";

/**
 * Home dashboard — PR2 extension:
 * - Student identity gate when no active profile.
 * - Active student chrome when profile exists.
 * - Cambiar alumno flow via StudentSwitcher.
 *
 * Client-side hydration:
 * 1. useActiveStudent loads the active profile from localStorage.
 *    If null, renders the StudentGate identification card.
 * 2. If active profile exists, the 4-panel dashboard renders.
 * 3. Progress is loaded from the per-student storage slice.
 */
export function HomeNextStepClient() {
  const { student, createAndActivate, refresh, isLoading } = useActiveStudent();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [nextStep, setNextStep] = useState<HomeNextStep | null>(null);
  const [viewModel, setViewModel] = useState<TeacherHomeViewModel | null>(null);

  // Reload progress when student changes (active profile switched or created)
  useEffect(() => {
    if (student === null) {
      setNextStep(null);
      setViewModel(null);
      return;
    }
    const progress = loadProgress();
    const readySkills = PILOT_SKILLS.filter(
      (skill) => isSkillReady(skill.skillId).ready
    ).map((skill) => ({
      skillId: skill.skillId,
      label: skill.label,
    }));

    const computedNextStep = deriveHomeNextStep(
      progress,
      readySkills,
      [...PILOT_SKILLS]
    );
    setNextStep(computedNextStep);

    setViewModel(
      deriveTeacherHomeViewModel({
        progress,
        diagnosticResult: progress.diagnosticResult ?? null,
        availableSkills: readySkills,
        pilotSkills: [...PILOT_SKILLS],
        nextStep: computedNextStep,
      })
    );
  }, [student]);

  // Loading skeleton — shown while hook initializes
  if (isLoading) {
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

  // No active profile — show the identification card
  if (student === null) {
    return (
      <section
        aria-labelledby="student-gate-heading"
        className="flex items-center justify-center min-h-[60vh]"
      >
        <StudentGate
          onSubmitProfile={(name) => {
            createAndActivate(name);
          }}
          externalError={null}
        />
      </section>
    );
  }

  if (viewModel === null) {
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

  // Active profile — render the student cockpit dashboard
  return (
    <>
      {showSwitcher && (
        <StudentSwitcher onClose={() => setShowSwitcher(false)} />
      )}
      <MathWatermark topic="sets" variant="background">
        <section
          aria-labelledby="tdh-hero-title"
          className="space-y-6"
        >
          {/* Active student chrome — within the dashboard zone */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--color-brand-600)] italic">
              Estás estudiando como <strong className="text-[var(--color-brand-800)] not-italic">{student.displayName}</strong>
            </p>
            <button
              onClick={() => setShowSwitcher(true)}
              className="text-sm text-[var(--color-brand-600)] hover:text-[var(--color-brand-800)] underline underline-offset-2 transition-colors"
            >
              Cambiar alumno
            </button>
          </div>

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
    </>
  );
}
