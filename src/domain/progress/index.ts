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
 */
export interface PracticeAttempt {
  readonly exerciseId: string;
  readonly skillId: SkillId;
  readonly correct: boolean;
  readonly errorTag?: string;
  readonly answeredAt: string;
  readonly difficulty?: Difficulty;
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

/** Thresholds used by `computeMasteryLevel`. Pure constants — kept here so
 *  tests can assert against them if needed. */
const MASTERY_ACCURACY_THRESHOLD = 0.8;
const MASTERY_MIN_ATTEMPTS = 5;
const PRACTICING_ACCURACY_THRESHOLD = 0.7;

/**
 * Compute accuracy for a given skill from a list of attempts.
 * Returns 0 if no matching attempts exist.
 *
 * @param attempts - All practice attempts
 * @param skillId - Skill to filter by
 * @returns Accuracy ratio 0..1
 */
export function computeAccuracy(
  attempts: readonly PracticeAttempt[],
  skillId: SkillId
): number {
  const filtered = attempts.filter((a) => a.skillId === skillId);
  if (filtered.length === 0) return 0;
  const correct = filtered.filter((a) => a.correct).length;
  return correct / filtered.length;
}

/**
 * Compute trend for a given skill from a list of attempts.
 * Compares accuracy of the second half vs first half.
 * Returns 'stable' for fewer than 4 attempts.
 *
 * @param attempts - All practice attempts (should be ordered chronologically)
 * @param skillId - Skill to filter by
 * @returns Trend classification
 */
export function computeTrend(
  attempts: readonly PracticeAttempt[],
  skillId: SkillId
): Trend {
  const filtered = attempts.filter((a) => a.skillId === skillId);
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
  progress: PracticeProgress
): MasteryLevel {
  const attempts = progress.attempts.filter((a) => a.skillId === skillId);
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
