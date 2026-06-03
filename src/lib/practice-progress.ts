/**
 * Practice progress — localStorage adapter for persistence outside domain.
 * Domain only receives/returns PracticeProgress; this module handles storage.
 *
 * Backward compatibility: data saved before WU 5 lacks lastPracticedBySkill,
 * diagnosticResult, and studyPlan. `loadProgress()` fills these in with
 * sensible defaults so old data keeps working.
 */

import type { PracticeProgress, PracticeAttempt } from "../domain/progress/index";
import { computeAccuracy, computeTrend } from "../domain/progress/index";
import type { DiagnosticResult, StudyPlan } from "../domain/diagnostic";

/** Versioned localStorage key to avoid collisions across experiments. */
export const PRACTICE_STORAGE_KEY = "pre-utn.practice.v1";

/** Empty initial state with all new fields defaulted. */
export const EMPTY_PROGRESS: PracticeProgress = {
  attempts: [],
  accuracyBySkill: {},
  trendBySkill: {},
  lastPracticedBySkill: {},
  diagnosticResult: null,
  studyPlan: null,
};

/**
 * Load practice progress from localStorage.
 * Returns empty progress if nothing stored or data is invalid.
 * Fills in defaults for any new field that the stored data lacks.
 */
export function loadProgress(): PracticeProgress {
  try {
    const raw = localStorage.getItem(PRACTICE_STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;

    const parsed = JSON.parse(raw) as Partial<PracticeProgress>;

    // Validate required shape — attempts must be an array
    if (!Array.isArray(parsed.attempts)) return EMPTY_PROGRESS;

    return {
      attempts: parsed.attempts,
      accuracyBySkill: (parsed.accuracyBySkill as Record<string, number>) ?? {},
      trendBySkill:
        (parsed.trendBySkill as Record<string, "improving" | "stable" | "needs-review">) ?? {},
      // New fields — default when missing (backward compat for WU<5 data)
      lastPracticedBySkill:
        (parsed.lastPracticedBySkill as Record<string, string>) ?? {},
      diagnosticResult: (parsed.diagnosticResult as DiagnosticResult | null) ?? null,
      studyPlan: (parsed.studyPlan as StudyPlan | null) ?? null,
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

/**
 * Save practice progress to localStorage.
 */
export function saveProgress(progress: PracticeProgress): void {
  localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(progress));
}

/**
 * Remove practice progress from localStorage.
 */
export function resetProgress(): void {
  localStorage.removeItem(PRACTICE_STORAGE_KEY);
}

/**
 * Add a single attempt to existing progress and persist.
 * Recomputes accuracy and trend for the affected skill, and updates
 * `lastPracticedBySkill` with the attempt's timestamp.
 * Preserves diagnosticResult and studyPlan from the existing progress.
 *
 * @returns Updated PracticeProgress
 */
export function addAttempt(attempt: PracticeAttempt): PracticeProgress {
  const current = loadProgress();
  const updatedAttempts = [...current.attempts, attempt];

  const accuracyBySkill: Record<string, number> = {
    ...current.accuracyBySkill,
  };
  const trendBySkill: Record<string, "improving" | "stable" | "needs-review"> = {
    ...current.trendBySkill,
  };
  const lastPracticedBySkill: Record<string, string> = {
    ...current.lastPracticedBySkill,
  };

  accuracyBySkill[attempt.skillId] = computeAccuracy(
    updatedAttempts,
    attempt.skillId
  );
  trendBySkill[attempt.skillId] = computeTrend(
    updatedAttempts,
    attempt.skillId
  );
  lastPracticedBySkill[attempt.skillId] = attempt.answeredAt;

  const updated: PracticeProgress = {
    attempts: updatedAttempts,
    accuracyBySkill,
    trendBySkill,
    lastPracticedBySkill,
    diagnosticResult: current.diagnosticResult,
    studyPlan: current.studyPlan,
  };

  saveProgress(updated);
  return updated;
}
