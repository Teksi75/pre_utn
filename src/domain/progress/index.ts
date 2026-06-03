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
