/**
 * Challenge catalog public API.
 *
 * Provides read-only access to challenge exercises filtered by skill or unit.
 * Challenge data lives in parallel JSON files under content/matematica/challenges/.
 */

import type { ChallengeCanonicalTrace, ChallengeExercise, ChallengeSourceUse } from "./types";
import { loadChallengesForSkill, loadChallengesForUnit, validateChallengeEntry } from "@/lib/challenges/loader";

// ---------------------------------------------------------------------------
// Types re-export
// ---------------------------------------------------------------------------

export type { ChallengeCanonicalTrace, ChallengeExercise, ChallengeSourceUse };

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/**
 * Return all challenge exercises for a given skillId.
 * Returns an empty array if the skill has no challenges.
 *
 * @param skillId - e.g. "mat.u1.complejos"
 */
export function queryChallengesBySkill(skillId: string): readonly ChallengeExercise[] {
  return loadChallengesForSkill(skillId);
}

/**
 * Return all challenge exercises for a given unit number.
 * Returns an empty array if the unit has no challenges.
 *
 * @param unit - Unit number (1–6)
 */
export function queryChallengesByUnit(unit: number): readonly ChallengeExercise[] {
  return loadChallengesForUnit(unit);
}

/**
 * Check whether any challenges exist for a given skillId.
 *
 * @param skillId - e.g. "mat.u1.complejos"
 */
export function hasChallengesForSkill(skillId: string): boolean {
  return loadChallengesForSkill(skillId).length > 0;
}

// Re-export for callers that need to validate raw entries
export { validateChallengeEntry };
export { loadChallengesForSkill, loadChallengesForUnit };
