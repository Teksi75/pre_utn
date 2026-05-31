/**
 * Practice progress — localStorage adapter for persistence outside domain.
 * Domain only receives/returns PracticeProgress; this module handles storage.
 */

import type { PracticeProgress, PracticeAttempt } from "../domain/progress/index";
import { computeAccuracy, computeTrend } from "../domain/progress/index";

/** Versioned localStorage key to avoid collisions across experiments. */
export const PRACTICE_STORAGE_KEY = "pre-utn.practice.v1";

/** Empty initial state. */
const EMPTY_PROGRESS: PracticeProgress = {
  attempts: [],
  accuracyBySkill: {},
  trendBySkill: {},
};

/**
 * Load practice progress from localStorage.
 * Returns empty progress if nothing stored or data is invalid.
 */
export function loadProgress(): PracticeProgress {
  try {
    const raw = localStorage.getItem(PRACTICE_STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;

    const parsed = JSON.parse(raw) as Partial<PracticeProgress>;

    // Validate required shape
    if (!Array.isArray(parsed.attempts)) return EMPTY_PROGRESS;

    return {
      attempts: parsed.attempts,
      accuracyBySkill: (parsed.accuracyBySkill as Record<string, number>) ?? {},
      trendBySkill:
        (parsed.trendBySkill as Record<string, "improving" | "stable" | "needs-review">) ?? {},
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
 * Recomputes accuracy and trend for the affected skill.
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

  accuracyBySkill[attempt.skillId] = computeAccuracy(
    updatedAttempts,
    attempt.skillId
  );
  trendBySkill[attempt.skillId] = computeTrend(
    updatedAttempts,
    attempt.skillId
  );

  const updated: PracticeProgress = {
    attempts: updatedAttempts,
    accuracyBySkill,
    trendBySkill,
  };

  saveProgress(updated);
  return updated;
}
