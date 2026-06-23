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
import { getActiveProfileId } from "./active-session";

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
  readonly studentId: string;
  readonly exerciseId: string;
  readonly skillId: SkillId;
  readonly correct: boolean;
  readonly answeredAt: string;
  readonly timeMs: number;
  readonly attemptIndex: number;
}

/**
 * Input for addChallengeAttempt — omits studentId because the adapter
 * stamps it from the active profile. Callers (hooks, UI) should not
 * supply studentId; the storage layer owns that field.
 */
export type ChallengeAttemptInput = Omit<ChallengeAttempt, "studentId">;

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
 * When activeStudentId is provided, only attempts matching that student
 * contribute to the score. Legacy anonymous attempts (no studentId) are
 * excluded when filtering is active.
 *
 * @param skillId - The skill to compute readiness for
 * @param attempts - All challenge attempts to evaluate
 * @param activeStudentId - If provided, filter to this student only
 * @returns Score 0–100 or null when no attempts exist
 */
export function computeAdvancedReadiness(
  skillId: SkillId,
  attempts: readonly ChallengeAttempt[],
  activeStudentId?: string
): number | null {
  const skillAttempts = attempts.filter((a) => a.skillId === skillId);
  const filtered = activeStudentId
    ? skillAttempts.filter((a) => a.studentId === activeStudentId)
    : skillAttempts;
  const deduplicated = deduplicateByLastAttempt(filtered);

  if (deduplicated.length === 0) return null;

  const correct = deduplicated.filter((a) => a.correct).length;
  const accuracy = correct / deduplicated.length;
  return Math.round(accuracy * 100);
}

// ---------------------------------------------------------------------------
// Readiness recomputation (pure)
// ---------------------------------------------------------------------------

/**
 * Recompute readinessBySkill for ALL skills present in the given attempts.
 * This is the single source of truth for readiness — never trust persisted maps.
 *
 * @param attempts - Filtered attempts (active student only)
 * @returns Record mapping each skillId to its readiness score (0–100) or null
 */
function recomputeAllReadiness(
  attempts: readonly ChallengeAttempt[]
): Record<SkillId, number | null> {
  const skillIds = new Set(attempts.map((a) => a.skillId));
  const result: Record<string, number | null> = {};
  for (const skillId of skillIds) {
    result[skillId] = computeAdvancedReadiness(skillId, attempts);
  }
  return result as Record<SkillId, number | null>;
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
 * Filters challengeAttempts to the active student only.
 * Legacy anonymous attempts (no studentId) are excluded from reads.
 */
export function loadAdvancedProgress(): AdvancedPracticeProgress {
  try {
    const activeStudentId = getActiveProfileId();
    if (!activeStudentId) return EMPTY_ADVANCED_PROGRESS;

    const raw = localStorage.getItem(ADVANCED_PRACTICE_STORAGE_KEY);
    if (!raw) return EMPTY_ADVANCED_PROGRESS;

    const parsed = JSON.parse(raw);
    const progress = parseAdvancedProgress(parsed);
    if (!progress) return EMPTY_ADVANCED_PROGRESS;

    // Ensure readinessBySkill is present (backward compat with older stores)
    // Filter to active student only; exclude legacy anonymous attempts
    const filtered = (progress.challengeAttempts ?? []).filter(
      (a) => a.studentId === activeStudentId
    );

    // Recompute readiness from filtered attempts — never trust persisted map
    // (may contain stale cross-student or anonymous readiness entries)
    return {
      challengeAttempts: filtered,
      readinessBySkill: recomputeAllReadiness(filtered),
    };
  } catch {
    return EMPTY_ADVANCED_PROGRESS;
  }
}

/**
 * Add a single challenge attempt and persist.
 * Recomputes readiness for ALL skills from active student's attempts
 * (never trusts persisted readinessBySkill — it may contain stale entries).
 * Requires an active student profile; returns blocked result if none exists.
 *
 * @param attempt - The challenge attempt to record
 * @returns Persistence result with updated progress
 */
export function addChallengeAttempt(
  attempt: ChallengeAttemptInput
): { ok: true; value: AdvancedPracticeProgress } | { ok: false; reason: "missing-active-profile" | "storage-error" } {
  try {
    const activeStudentId = getActiveProfileId();
    if (!activeStudentId) {
      return { ok: false, reason: "missing-active-profile" };
    }

    // Load ALL attempts from storage (not filtered), then append the new one
    const raw = localStorage.getItem(ADVANCED_PRACTICE_STORAGE_KEY);
    const parsed = raw ? parseAdvancedProgress(JSON.parse(raw)) : null;
    const allAttempts = parsed?.challengeAttempts ?? [];

    const stampedAttempt: ChallengeAttempt = { ...attempt, studentId: activeStudentId };
    const updatedAttempts = [...allAttempts, stampedAttempt];

    // Filter to active student for readiness computation
    const activeStudentAttempts = updatedAttempts.filter(
      (a) => a.studentId === activeStudentId
    );

    // Recompute ALL readiness from active student's attempts
    // (never spread persisted readinessBySkill — it may contain stale entries)
    const updatedReadiness = recomputeAllReadiness(activeStudentAttempts);

    const updated: AdvancedPracticeProgress = {
      challengeAttempts: updatedAttempts,
      readinessBySkill: updatedReadiness as Record<SkillId, number | null>,
    };

    localStorage.setItem(
      ADVANCED_PRACTICE_STORAGE_KEY,
      JSON.stringify(updated)
    );

    // Return filtered view for the active student
    return {
      ok: true,
      value: {
        challengeAttempts: activeStudentAttempts,
        readinessBySkill: updatedReadiness as Record<SkillId, number | null>,
      },
    };
  } catch {
    return { ok: false, reason: "storage-error" };
  }
}
