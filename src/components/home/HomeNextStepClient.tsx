"use client";

import { useEffect, useState } from "react";
import { isSkillReady } from "../../domain/catalog/readiness";
import { PILOT_SKILLS } from "../../domain/catalog/pilot-skills";
import { deriveHomeNextStep } from "../../domain/next-step/index";
import { loadProgress } from "../../lib/practice-progress";
import { MathWatermark } from "../math-visuals";
import { HomeGreeting } from "./HomeGreeting";
import { MissionCard } from "./student-home/MissionCard";
import { StudentSituationPanel } from "./student-home/StudentSituationPanel";
import { MathRoutePanel } from "./student-home/MathRoutePanel";
import { DecisionBoardPanel } from "./student-home/DecisionBoardPanel";
import {
  deriveStudentHomeViewModel,
  type StudentHomeViewModel,
} from "../../domain/student-home/index";
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
  const [viewModel, setViewModel] = useState<StudentHomeViewModel | null>(null);

  // Reload progress when student changes (active profile switched or created)
  useEffect(() => {
    if (student === null) {
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
    setViewModel(
      deriveStudentHomeViewModel({
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
        <section className="space-y-6">
          {/* Active student chrome — within the dashboard zone */}
          <div className="flex items-center justify-between">
            <HomeGreeting studentName={student.displayName} />
            <button
              onClick={() => setShowSwitcher(true)}
              className="text-sm text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)] underline underline-offset-2 transition-colors focus-visible:shadow-[var(--ring-focus)] rounded-[var(--radius-button)] px-2 py-1 self-start min-h-[44px] inline-flex items-center"
            >
              Cambiar alumno
            </button>
          </div>

          {/* Hero — MAX visual weight */}
          <MissionCard mission={viewModel.mission} />

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
