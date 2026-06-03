import { isSkillReady } from "../../domain/catalog/readiness";
import { getAccessibleSkills, type AccessibleSkill } from "../../domain/catalog/accessibility";
import { PILOT_SKILL_UNIT_MAP } from "../../domain/catalog/pilot-skills";
import { SKILL_DEPENDENCIES } from "../../domain/models/skill-catalog";
import type { PracticeProgress } from "../../domain/progress/index";
import type { SkillId } from "../../domain/models/skill";

/**
 * OpenSpec: `unit-1-pedagogical-slice`, Phase 13.
 * TDD coverage: `src/app/practice/__tests__/start-skill.test.ts`.
 */
export const PRACTICE_SKILL_UNIT_MAP: Readonly<Record<string, string>> = {
  ...PILOT_SKILL_UNIT_MAP,
};

/**
 * Legacy resolver — kept for backward compat with existing tests.
 * Returns the skillId if the skill is content-ready, otherwise null.
 * Does NOT consider prerequisite mastery.
 */
export function resolveInitialPracticeSkill(
  skillParam: string | null
): SkillId | null {
  if (!skillParam) return null;
  if (!PRACTICE_SKILL_UNIT_MAP[skillParam]) return null;
  const readiness = isSkillReady(skillParam);
  if (!readiness.ready) return null;
  return skillParam as SkillId;
}

/**
 * Why a requested skill could not be opened for practice.
 * Used to surface a clear, actionable message in the UI.
 */
export type BlockedReason =
  | "unknown-skill"
  | "no-content"
  | "missing-prerequisite";

/**
 * Result of analyzing a `?skill=` URL parameter against the student's
 * current progress. Distinguishes between "no skill requested",
 * "ready to practice", and the various reasons a known skill might
 * still be blocked (no content yet, prerequisite not yet mastered).
 */
export type SkillRequestAnalysis =
  | { readonly kind: "none" }
  | { readonly kind: "ready"; readonly skillId: SkillId }
  | { readonly kind: "blocked"; readonly skillId: string; readonly reason: BlockedReason; readonly missingPrerequisite?: SkillId };

/**
 * Analyze a `?skill=` query parameter against the student's progress.
 * Pure function — same input → same output.
 */
export function analyzeRequestedSkill(
  skillParam: string | null,
  progress: PracticeProgress
): SkillRequestAnalysis {
  if (!skillParam) return { kind: "none" };
  if (!PRACTICE_SKILL_UNIT_MAP[skillParam]) {
    return { kind: "blocked", skillId: skillParam, reason: "unknown-skill" };
  }
  const skillId = skillParam as SkillId;

  const contentReady = isSkillReady(skillId).ready;
  if (!contentReady) {
    return { kind: "blocked", skillId, reason: "no-content" };
  }

  const dep = SKILL_DEPENDENCIES.find((d) => d.skillId === skillId);
  const missingPrereq = dep?.prerequisites.find(
    (prereqId) => (progress.accuracyBySkill[prereqId] ?? 0) < 0.7
  );
  if (missingPrereq) {
    return {
      kind: "blocked",
      skillId,
      reason: "missing-prerequisite",
      missingPrerequisite: missingPrereq,
    };
  }

  return { kind: "ready", skillId };
}

/**
 * Build the accessibility map for the FocusSelector.
 * Pure helper — wraps `getAccessibleSkills()` so the hook stays thin.
 */
export function buildAccessibleSkillMap(
  progress: PracticeProgress
): ReadonlyMap<SkillId, AccessibleSkill> {
  const entries = getAccessibleSkills(progress).map(
    (s): [SkillId, AccessibleSkill] => [s.skillId, s]
  );
  return new Map(entries);
}
