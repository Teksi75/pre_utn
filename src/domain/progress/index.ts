/**
 * Progress — pure reducers for practice attempt accuracy and trend computation.
 * No external dependencies. Pure TypeScript.
 */

import type { SkillId } from "../models/skill";
import type { Difficulty } from "../models/exercise";

/**
 * A single practice attempt.
 *
 * `difficulty` is optional for backward compatibility: attempts saved before
 * WU 5 do not have this field, so loading them must still type-check.
 * New attempts created via `addAttempt()` always include it.
 *
 * `timeMs` is the elapsed time in milliseconds for this single attempt
 * (measured via `performance.now()`). Required; legacy data without it is
 * normalized to 0 by `loadProgress`. Must be >= 0.
 *
 * `attemptIndex` is the 1-indexed retry count for this exercise within the
 * current browser session. Required; legacy data without it is normalized
 * to 1 by `loadProgress`. Must be >= 1.
 */
export interface PracticeAttempt {
  readonly exerciseId: string;
  readonly skillId: SkillId;
  readonly correct: boolean;
  readonly errorTag?: string;
  readonly answeredAt: string;
  readonly difficulty?: Difficulty;
  readonly timeMs: number;
  readonly attemptIndex: number;
  /**
   * Optional studentId — added in the student-identity-local-persistence-bridge
   * change. Attempts saved before this change do not have this field (backward
   * compat). New attempts created via addAttempt will always include it once
   * the storage adapter is switched over.
   */
  readonly studentId?: string;
}

/**
 * Full practice progress state.
 *
 * The three new fields (lastPracticedBySkill, diagnosticResult, studyPlan)
 * were added in WU 5 to support future features (skill mastery, difficulty
 * tracking, study plans). Old persisted data is missing them — `loadProgress`
 * in `src/lib/practice-progress.ts` provides defaults.
 */
export interface PracticeProgress {
  readonly attempts: readonly PracticeAttempt[];
  readonly accuracyBySkill: Record<string, number>;
  readonly trendBySkill: Record<string, "improving" | "stable" | "needs-review">;
  readonly lastPracticedBySkill: Record<string, string>;
  readonly diagnosticResult: import("../diagnostic/index").DiagnosticResult | null;
  readonly studyPlan: import("../diagnostic/index").StudyPlan | null;
}

/** Trend classification. */
export type Trend = "improving" | "stable" | "needs-review";

/**
 * Coarse mastery classification used by the home roadmap.
 * - "not-started" → no attempts yet for the skill
 * - "learning" → attempts exist but accuracy/trend are below promotion bars
 * - "practicing" → accuracy >= 0.7 and trend is "improving"
 * - "review" → trend is "needs-review" — the student is regressing
 * - "mastered" → accuracy >= 0.8 with 5+ attempts and trend is not "needs-review"
 */
export type MasteryLevel =
  | "not-started"
  | "learning"
  | "practicing"
  | "review"
  | "mastered";

/** Thresholds used by `computeMasteryLevel`. `MASTERY_MIN_ATTEMPTS` counts
 *  unique exercises (after deduplication by last attempt per exerciseId),
 *  not total submits. Retries on the same exercise do not inflate the count. */
const MASTERY_ACCURACY_THRESHOLD = 0.8;
const MASTERY_MIN_ATTEMPTS = 5;
const PRACTICING_ACCURACY_THRESHOLD = 0.7;

/**
 * Keep only the last chronological attempt per exerciseId.
 * Uses `answeredAt` as the primary sort key (most recent wins) and
 * `attemptIndex` as a tie-breaker when timestamps are equal.
 *
 * This prevents cross-session bugs: a newer browser session resets
 * `attemptIndex`, so a later chronological attempt with a lower
 * `attemptIndex` would be silently ignored by an index-only dedup.
 *
 * The output array is sorted chronologically (oldest → newest) so
 * that `computeTrend` splits the series in the correct order.
 *
 * @param attempts - All practice attempts for a skill
 * @returns Deduplicated attempts (one per exerciseId), sorted chronologically
 */
export function deduplicateByLastAttempt(
  attempts: readonly PracticeAttempt[]
): PracticeAttempt[] {
  const byExercise = new Map<string, PracticeAttempt>();
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
  // Sort chronologically so computeTrend splits first-half vs second-half correctly
  return [...byExercise.values()].sort((a, b) => {
    if (a.answeredAt < b.answeredAt) return -1;
    if (a.answeredAt > b.answeredAt) return 1;
    return a.attemptIndex - b.attemptIndex;
  });
}

/**
 * Compute accuracy for a given skill from a list of attempts.
 * Deduplicates by last attempt per exerciseId (accuracy measures
 * comprehension, not persistence). Excludes attempts with invalid
 * timing (< 100ms or > 10min) as those indicate timer bugs or
 * abandoned tabs.
 *
 * @param attempts - All practice attempts
 * @param skillId - Skill to filter by
 * @returns Accuracy ratio 0..1
 */
export function computeAccuracy(
  attempts: readonly PracticeAttempt[],
  skillId: SkillId
): number {
  const filtered = deduplicateByLastAttempt(
    attempts.filter((a) => a.skillId === skillId)
  ).filter((a) => a.timeMs >= 100 && a.timeMs <= 600_000);
  if (filtered.length === 0) return 0;
  const correct = filtered.filter((a) => a.correct).length;
  return correct / filtered.length;
}

/**
 * Compute trend for a given skill from a list of attempts.
 * Compares accuracy of the second half vs first half after
 * deduplicating by last attempt per exerciseId. Returns 'stable'
 * for fewer than 4 unique valid attempts.
 *
 * @param attempts - All practice attempts (should be ordered chronologically)
 * @param skillId - Skill to filter by
 * @returns Trend classification
 */
export function computeTrend(
  attempts: readonly PracticeAttempt[],
  skillId: SkillId
): Trend {
  const filtered = deduplicateByLastAttempt(
    attempts.filter((a) => a.skillId === skillId)
  ).filter((a) => a.timeMs >= 100 && a.timeMs <= 600_000);
  if (filtered.length < 4) return "stable";

  const mid = Math.floor(filtered.length / 2);
  const firstHalf = filtered.slice(0, mid);
  const secondHalf = filtered.slice(mid);

  const firstCorrect = firstHalf.filter((a) => a.correct).length / firstHalf.length;
  const secondCorrect = secondHalf.filter((a) => a.correct).length / secondHalf.length;

  if (secondCorrect > firstCorrect) return "improving";
  if (secondCorrect < firstCorrect) return "needs-review";
  return "stable";
}

/**
 * Compute the coarse mastery level for a single skill from the full
 * practice progress state. Pure function — no I/O.
 *
 * The function reads `accuracyBySkill` and `trendBySkill` as pre-computed
 * summaries; callers are expected to keep those in sync via `addAttempt`
 * (or equivalent). Missing entries are treated as 0 / "stable".
 *
 * The order of checks matters and is the documented contract:
 *   1. No attempts → "not-started"
 *   2. trend === "needs-review" wins over accuracy (a regressing student
 *      should not be marked "practicing" or "mastered" just because their
 *      lifetime average is high)
 *   3. High accuracy + 5+ attempts + non-regressing trend → "mastered"
 *   4. Decent accuracy + improving trend → "practicing"
 *   5. Otherwise → "learning"
 *
 * @param skillId - The skill to classify
 * @param progress - Full practice progress (only accuracy/trend maps are read)
 * @returns MasteryLevel for the given skill
 */
export function computeMasteryLevel(
  skillId: string,
  progress: Pick<PracticeProgress, "attempts" | "accuracyBySkill" | "trendBySkill">
): MasteryLevel {
  const attempts = deduplicateByLastAttempt(
    progress.attempts.filter((a) => a.skillId === skillId)
  ).filter((a) => a.timeMs >= 100 && a.timeMs <= 600_000);
  if (attempts.length === 0) return "not-started";

  const accuracy = progress.accuracyBySkill[skillId] ?? 0;
  const trend = (progress.trendBySkill[skillId] ?? "stable") as Trend;

  // Regression wins over accuracy — a downward trend always surfaces.
  if (trend === "needs-review") return "review";

  if (
    accuracy >= MASTERY_ACCURACY_THRESHOLD &&
    attempts.length >= MASTERY_MIN_ATTEMPTS
  ) {
    return "mastered";
  }

  if (accuracy >= PRACTICING_ACCURACY_THRESHOLD && trend === "improving") {
    return "practicing";
  }

  return "learning";
}
