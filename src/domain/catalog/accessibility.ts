/**
 * Catalog accessibility — derives per-skill accessibility from progress + prereq graph.
 * Pure TypeScript. No I/O, no React, no localStorage.
 *
 * A skill is "accessible" for guided practice when:
 *   1. Its content is ready (theory, examples, exercises, feedback, evaluation
 *      all present — delegated to `isSkillReady`), AND
 *   2. Every declared prerequisite in `SKILL_DEPENDENCIES` has reached
 *      `PREREQUISITE_ACCURACY_THRESHOLD` accuracy for the student.
 *
 * The function operates over `PILOT_SKILLS` only — the upstream guided-
 * practice surface. Other catalog skills remain reachable through the
 * `isSkillReady` path and the existing "Próximamente" UX.
 */

import { SKILL_DEPENDENCIES } from "../models/skill-catalog";
import type { SkillId } from "../models/skill";
import {
  computeMasteryLevel,
  type MasteryLevel,
  type PracticeProgress,
} from "../progress/index";
import { PILOT_SKILLS, type PilotSkill } from "./pilot-skills";
import { isSkillReady } from "./readiness";

/**
 * Minimum accuracy required for a prerequisite to be considered satisfied.
 * Picked to match the "practicing" mastery bar in `computeMasteryLevel`.
 */
export const PREREQUISITE_ACCURACY_THRESHOLD = 0.7;

/**
 * Per-skill accessibility record returned by `getAccessibleSkills`.
 *
 * - `accessible` is the high-level boolean the UI consumes.
 * - `missingPrerequisites` lists the prerequisite skillIds whose accuracy
 *   is below the threshold (empty when the skill is accessible or has no
 *   declared prerequisites).
 * - `contentReady` exposes the underlying `isSkillReady` verdict so the
 *   UI can distinguish "blocked by prereq" from "no content yet".
 * - `masteryLevel` and `accuracy` describe the student's own progress
 *   for this skill (mirrors `computeMasteryLevel` / `accuracyBySkill`).
 */
export interface AccessibleSkill {
  readonly skillId: SkillId;
  readonly name: string;
  readonly accessible: boolean;
  readonly missingPrerequisites: readonly SkillId[];
  readonly masteryLevel: MasteryLevel;
  readonly accuracy: number;
  readonly contentReady: boolean;
}

/**
 * Look up the declared prerequisites for a skill.
 * Returns an empty array when the skill is not in the dependency graph
 * (e.g. a "root" skill like `conjuntos_numericos` or `intervalos`).
 */
function prerequisitesFor(skillId: SkillId): readonly SkillId[] {
  const dep = SKILL_DEPENDENCIES.find((d) => d.skillId === skillId);
  return dep?.prerequisites ?? [];
}

/**
 * Compute accessibility for every pilot skill given the student's progress.
 * Pure function: same input → same output, no side effects.
 *
 * @param progress - Student's persisted practice progress
 * @returns One `AccessibleSkill` per `PILOT_SKILLS` entry, in catalog order
 */
export function getAccessibleSkills(
  progress: PracticeProgress
): readonly AccessibleSkill[] {
  return PILOT_SKILLS.map((pilot: PilotSkill) =>
    buildAccessibleSkill(pilot, progress)
  );
}

/**
 * Build the accessibility record for a single pilot skill.
 * Exported for testability and reuse by callers that already have a
 * single `PilotSkill` in hand.
 */
export function buildAccessibleSkill(
  pilot: PilotSkill,
  progress: PracticeProgress
): AccessibleSkill {
  const { skillId } = pilot;

  const contentReady = isSkillReady(skillId).ready;
  const prereqs = prerequisitesFor(skillId);
  const missingPrerequisites = prereqs.filter(
    (prereqId) =>
      (progress.accuracyBySkill[prereqId] ?? 0) < PREREQUISITE_ACCURACY_THRESHOLD
  );

  const accessible = contentReady && missingPrerequisites.length === 0;
  const masteryLevel = computeMasteryLevel(skillId, progress);
  const accuracy = progress.accuracyBySkill[skillId] ?? 0;

  return {
    skillId,
    name: pilot.label,
    accessible,
    missingPrerequisites,
    masteryLevel,
    accuracy,
    contentReady,
  };
}
