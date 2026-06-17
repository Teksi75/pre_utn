/**
 * Advanced practice progress — localStorage adapter for challenge attempts.
 *
 * Storage key: pre-utn.advanced-practice.v1
 * Separate from base pre-utn.practice.v1 to keep challenge and base
 * progress flows fully independent.
 *
 * Storage shape:
 * {
 *   challengeAttempts: readonly ChallengeAttempt[];
 *   readinessBySkill: Record<SkillId, number | null>;
 * }
 */

import type { SkillId } from "../domain/models/skill";

/** Versioned localStorage key for advanced (challenge) practice progress. */
export const ADVANCED_PRACTICE_STORAGE_KEY = "pre-utn.advanced-practice.v1";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/**
 * A single challenge attempt.
 * Similar to PracticeAttempt but scoped to challenge exercises.
 * attemptIndex is the 1-indexed retry count for this exercise within the
 * current session. Used as tie-breaker when answeredAt timestamps are equal.
 */
export interface ChallengeAttempt {
  readonly exerciseId: string;
  readonly skillId: SkillId;
  readonly correct: boolean;
  readonly answeredAt: string;
  readonly timeMs: number;
  readonly attemptIndex: number;
}

/**
 * Full advanced practice progress state.
 * readinessBySkill uses null to mean "not started" (no attempts yet).
 */
export interface AdvancedPracticeProgress {
  readonly challengeAttempts: readonly ChallengeAttempt[];
  readonly readinessBySkill: Record<SkillId, number | null>;
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

const EMPTY_ADVANCED_PROGRESS: AdvancedPracticeProgress = {
  challengeAttempts: [],
  readinessBySkill: {},
};

// ---------------------------------------------------------------------------
// Deduplication (same pattern as base progress)
// ---------------------------------------------------------------------------

/**
 * Keep only the last chronological attempt per exerciseId.
 * Uses answeredAt as primary sort key (most recent wins) and
 * attemptIndex as tie-breaker when timestamps are equal.
 */
function deduplicateByLastAttempt(
  attempts: readonly ChallengeAttempt[]
): ChallengeAttempt[] {
  const byExercise = new Map<string, ChallengeAttempt>();
  for (const a of attempts) {
    const existing = byExercise.get(a.exerciseId);
    if (
      !existing ||
      a.answeredAt > existing.answeredAt ||
      (a.answeredAt === existing.answeredAt && a.attemptIndex > existing.attemptIndex)
    ) {
      byExercise.set(a.exerciseId, a);
    }
  }
  return [...byExercise.values()];
}

// ---------------------------------------------------------------------------
// Computed readiness
// ---------------------------------------------------------------------------

/**
 * Compute the advanced readiness score for a skill.
 *
 * - No attempts → null (not started)
 * - With attempts → round(accuracy * 100)
 *   where accuracy = correct_deduplicated / total_deduplicated
 *   (last attempt per exerciseId wins)
 *
 * @param skillId - The skill to compute readiness for
 * @param attempts - All challenge attempts to evaluate
 * @returns Score 0–100 or null when no attempts exist
 */
export function computeAdvancedReadiness(
  skillId: SkillId,
  attempts: readonly ChallengeAttempt[]
): number | null {
  const skillAttempts = attempts.filter((a) => a.skillId === skillId);
  const deduplicated = deduplicateByLastAttempt(skillAttempts);

  if (deduplicated.length === 0) return null;

  const correct = deduplicated.filter((a) => a.correct).length;
  const accuracy = correct / deduplicated.length;
  return Math.round(accuracy * 100);
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function parseAdvancedProgress(raw: unknown): AdvancedPracticeProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.challengeAttempts)) return null;
  return raw as AdvancedPracticeProgress;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load advanced practice progress from localStorage.
 * Returns empty progress if nothing stored or data is invalid/corrupt.
 */
export function loadAdvancedProgress(): AdvancedPracticeProgress {
  try {
    const raw = localStorage.getItem(ADVANCED_PRACTICE_STORAGE_KEY);
    if (!raw) return EMPTY_ADVANCED_PROGRESS;

    const parsed = JSON.parse(raw);
    const progress = parseAdvancedProgress(parsed);
    if (!progress) return EMPTY_ADVANCED_PROGRESS;

    // Ensure readinessBySkill is present (backward compat with older stores)
    return {
      challengeAttempts: progress.challengeAttempts ?? [],
      readinessBySkill: progress.readinessBySkill ?? {},
    };
  } catch {
    return EMPTY_ADVANCED_PROGRESS;
  }
}

/**
 * Add a single challenge attempt and persist.
 * Recomputes readiness for the affected skill.
 *
 * @param attempt - The challenge attempt to record
 * @returns Persistence result with updated progress
 */
export function addChallengeAttempt(
  attempt: ChallengeAttempt
): { ok: true; value: AdvancedPracticeProgress } | { ok: false; reason: string } {
  try {
    const current = loadAdvancedProgress();
    const updatedAttempts = [...current.challengeAttempts, attempt];

    // Compute updated readiness for the affected skill
    const updatedReadiness: Record<string, number | null> = {
      ...current.readinessBySkill,
    };
    updatedReadiness[attempt.skillId] = computeAdvancedReadiness(
      attempt.skillId,
      updatedAttempts
    );

    const updated: AdvancedPracticeProgress = {
      challengeAttempts: updatedAttempts,
      readinessBySkill: updatedReadiness as Record<SkillId, number | null>,
    };

    localStorage.setItem(
      ADVANCED_PRACTICE_STORAGE_KEY,
      JSON.stringify(updated)
    );

    return { ok: true, value: updated };
  } catch {
    return { ok: false, reason: "storage-error" };
  }
}
