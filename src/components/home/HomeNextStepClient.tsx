/**
 * HomeNextStepClient — Home dashboard.
 *
 * Loads the student's progress + diagnostic via the persistence layer,
 * derives a view-model via the domain logic, and renders the dashboard
 * (mission card, route units, situation panel, decision board).
 *
 * The loader path MUST NEVER leave `viewModel === null` after the async
 * work settles. Any rejected
 * `loadProgress()` / `loadDiagnosticResult()` MUST still produce an
 * actionable local-fallback VM (EMPTY_PROGRESS + null diagnostic) so
 * the dashboard renders instead of staying on the loading skeleton.
 *
 * The load → handleResults protocol is extracted into
 * `runHomeLoader(deps, handleResults)` so the catch-path invariants
 * are unit-testable without a DOM. The component is a thin wrapper
 * that wires the production loaders + setViewModel and calls the
 * protocol from a `useEffect` keyed on the active student.
 *
 * @module components/home/HomeNextStepClient
 */

"use client";

import { useEffect, useState } from "react";
import { isSkillReady } from "../../domain/catalog/readiness";
import { PILOT_SKILLS } from "../../domain/catalog/pilot-skills";
import { deriveHomeNextStep } from "../../domain/next-step/index";
import { EMPTY_PROGRESS, loadProgress } from "../../lib/practice-progress";
import { loadDiagnosticResult } from "../../lib/diagnostic-storage";
import type { PracticeProgress } from "../../domain/progress/index";
import type { DiagnosticResult } from "../../domain/diagnostic";
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
import { StudentSwitcher } from "./StudentSwitcher";

// ---------------------------------------------------------------------------
// Loader protocol — extracted so the catch-path invariant is testable.
// ---------------------------------------------------------------------------

export interface HomeLoaderDeps {
  /**
   * Loads the active student's progress. May be sync or async
   * (returns the result, or a Promise resolving to the result, or
   * a rejecting Promise — the protocol handles all three shapes).
   */
  loadProgress: () => PracticeProgress | Promise<PracticeProgress>;
  /**
   * Loads the active student's diagnostic result, or null if not
   * taken. Same sync/async/reject shapes as `loadProgress`.
   */
  loadDiagnosticResult: () => DiagnosticResult | null | Promise<DiagnosticResult | null>;
}

/**
 * Type accepted by the protocol — anything that can be `await`ed
 * resolves to the result, or throws on rejection.
 */
type MaybePromise<T> = T | Promise<T>;

/**
 * Home loader protocol — the single source of truth for the
 * "never leave `viewModel === null`" invariant.
 *
 * Starts both loaders eagerly and settles them with `Promise.allSettled`,
 * so EVERY promise has an explicit handler. This eliminates the
 * floating-diagnostic-promise race: previously, when `loadProgress`
 * rejected first, its catch returned the fallback VM while
 * `loadDiagnosticResult` was still pending; if that diagnostic promise
 * later rejected, nothing was listening → an unhandledrejection event.
 * `allSettled` attaches a handler to each promise up front, so a
 * late rejection is always observed and never floats.
 *
 * Every code path calls `handleResults(progress, diag)` so the caller
 * can build the view model. The fallback inputs are `EMPTY_PROGRESS` +
 * `null` so the dashboard renders the no-attempts local-fallback VM
 * ("Empezá por el diagnóstico inicial", "Hacer diagnóstico inicial")
 * instead of a permanent skeleton.
 */
export async function runHomeLoader(
  deps: HomeLoaderDeps,
  handleResults: (progress: PracticeProgress, diag: DiagnosticResult | null) => void,
): Promise<void> {
  // Wrap both results in Promise.resolve so allSettled handles the
  // sync | async shapes uniformly. A sync value wrapped here can never
  // reject, so allSettled always reports "fulfilled" for it; an async
  // rejecting loader is observed and reported as "rejected" — never
  // unhandled.
  const results = await Promise.allSettled([
    Promise.resolve(deps.loadProgress()),
    Promise.resolve(deps.loadDiagnosticResult()),
  ]);
  const progressSettled = results[0] as PromiseSettledResult<PracticeProgress>;
  const diagSettled = results[1] as PromiseSettledResult<DiagnosticResult | null>;

  const progress =
    progressSettled.status === "fulfilled"
      ? progressSettled.value
      : EMPTY_PROGRESS;
  // Preserve the documented fallback contract: when progress fails the
  // dashboard renders the EMPTY_PROGRESS fallback VM and the diagnostic
  // is dropped (null) — matching the pre-fix observable behavior on the
  // progress-failure path so the view model is unchanged.
  const diag =
    progressSettled.status === "fulfilled" && diagSettled.status === "fulfilled"
      ? diagSettled.value
      : null;

  handleResults(progress, diag);
}

// Suppress unused warnings for the shared type (used for documentation
// purposes only; re-exporting keeps the type accessible to test files).
export type { MaybePromise };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HomeNextStepClient() {
  const { student, isLoading } = useActiveStudent();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [viewModel, setViewModel] = useState<StudentHomeViewModel | null>(null);

  // Reload progress when student changes (active profile switched or created).
  // Cancellation guard: when the student changes mid-flight, drop the
  // previous effect's result so a stale resolve does not overwrite the
  // new active student's view model.
  useEffect(() => {
    if (student === null) {
      setViewModel(null);
      return;
    }

    let cancelled = false;
    const readySkills = PILOT_SKILLS.filter(
      (skill) => isSkillReady(skill.skillId).ready
    ).map((skill) => ({
      skillId: skill.skillId,
      label: skill.label,
    }));

    const handleResults = (
      progress: PracticeProgress,
      activeDiagnosticResult: DiagnosticResult | null
    ) => {
      if (cancelled) return;
      const computedNextStep = deriveHomeNextStep(
        progress,
        readySkills,
        [...PILOT_SKILLS],
        activeDiagnosticResult ?? progress.diagnosticResult ?? null
      );
      setViewModel(
        deriveStudentHomeViewModel({
          progress,
          diagnosticResult: activeDiagnosticResult ?? progress.diagnosticResult ?? null,
          availableSkills: readySkills,
          pilotSkills: [...PILOT_SKILLS],
          nextStep: computedNextStep,
        })
      );
    };

    void runHomeLoader(
      { loadProgress, loadDiagnosticResult },
      handleResults,
    );

    return () => {
      cancelled = true;
    };
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
    // The global StudentGate in the root layout is responsible for
    // redirecting users without a profile or session to /cuenta/ingresar.
    // Reaching this branch means the user has neither; the redirect is
    // already in flight. Render a stable loading placeholder so the home
    // does not flash empty content while the navigation completes.
    return (
      <section
        aria-labelledby="student-gate-heading"
        aria-busy="true"
        aria-live="polite"
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="animate-pulse text-sm text-[var(--color-brand-500)]">
          …
        </div>
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
        <section aria-label="Tu recorrido de aprendizaje" className="space-y-6">
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
