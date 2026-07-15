import { isSkillReady } from "../../domain/catalog/readiness";
import { getAccessibleSkills, type AccessibleSkill } from "../../domain/catalog/accessibility";
import { PILOT_SKILL_UNIT_MAP } from "../../domain/catalog/pilot-skills";
import {
  SKILL_DEPENDENCIES,
  UNIT_1_SKILLS,
  UNIT_2_SKILLS,
  UNIT_3_SKILLS,
  UNIT_4_SKILLS,
  UNIT_5_SKILLS,
  UNIT_6_SKILLS,
} from "../../domain/models/skill-catalog";
import type { PracticeProgress } from "../../domain/progress/index";
import type { SkillId } from "../../domain/models/skill";

/**
 * OpenSpec: `unit-1-pedagogical-slice`, Phase 13.
 * TDD coverage: `src/app/practice/__tests__/start-skill.test.ts`.
 */
export const PRACTICE_SKILL_UNIT_MAP: Readonly<Record<string, string | undefined>> = {
  ...PILOT_SKILL_UNIT_MAP,
};

/**
 * U5-01: live read of the active-skill count per unit, mirroring the
 * `SKILLS_BY_UNIT` map used by `FocusSelector`. Defined here (rather
 * than imported from the component) so the practice-flow layer can
 * reason about unit availability without dragging in React/UI deps.
 * Availability follows the same length>0 contract the selector uses.
 */
const SKILLS_BY_UNIT: Record<number, readonly SkillId[]> = {
  1: UNIT_1_SKILLS,
  2: UNIT_2_SKILLS,
  3: UNIT_3_SKILLS,
  4: UNIT_4_SKILLS,
  5: UNIT_5_SKILLS,
  6: UNIT_6_SKILLS,
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
 * Check whether content QA mode is enabled via the env flag.
 * Accepts an explicit value for testability; defaults to the runtime env var.
 */
export function isContentQaModeEnabled(
  value: string | undefined = process.env.NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE
): boolean {
  return value === "true";
}

export interface AnalyzeRequestedSkillOptions {
  readonly qaContentModeEnabled?: boolean;
}

/**
 * Analyze a `?skill=` query parameter against the student's progress.
 * Pure function — same input → same output.
 */
export function analyzeRequestedSkill(
  skillParam: string | null,
  progress: PracticeProgress,
  options?: AnalyzeRequestedSkillOptions
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

  // QA content mode: skip prerequisite check for direct URL access
  if (options?.qaContentModeEnabled) {
    return { kind: "ready", skillId };
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

// ---------------------------------------------------------------------------
// U5-01: unit-level availability analysis (UI-layer, not persistence)
// ---------------------------------------------------------------------------

/**
 * Outcome of `analyzeRequestedUnit` — pure derivation from the live
 * `SKILLS_BY_UNIT` map. This is a UI-layer contract only; it does not
 * touch persistence, URL, localStorage, SQL, or any persisted surface.
 *
 * - `"none"`            → no unit was requested (or the request could
 *                         not be parsed into an integer).
 * - `"unavailable-unit"` → the unit was requested but its
 *                          `SKILLS_BY_UNIT[unit].length === 0`,
 *                          meaning the practice flow MUST NOT transition
 *                          to theory/example, MUST render the
 *                          unavailable-unit banner, and MUST NOT mutate
 *                          progress. The contract intentionally reuses
 *                          zero-skill semantics so the
 *                          "automatic re-enable" requirement follows
 *                          from the next render after active skills
 *                          are added to `SKILLS_BY_UNIT`.
 *
 * Future slices that re-populate Unit 5 (or any other empty unit) get
 * automatic re-enable for free: nothing here has to change.
 */
export type UnitRequestAnalysis =
  | { readonly kind: "none" }
  | { readonly kind: "unavailable-unit"; readonly unit: string };

/**
 * Analyze a unit request (e.g. `?unit=...`, an in-memory selection, or
 * any other transient carry-over) against the live `SKILLS_BY_UNIT`
 * map. Pure function — same input → same output, no side effects on
 * URL, localStorage, or remote storage.
 *
 * U5-01 contract:
 *   - availability is derived from `SKILLS_BY_UNIT[unit].length > 0`,
 *     not from a hardcoded per-unit toggle;
 *   - a unit that gains active skills in a future slice stops
 *     returning `"unavailable-unit"` on the same call — no flag
 *     mutation, persistence change, or new component is needed;
 *   - the function introduces no new URL parameter, localStorage key,
 *     persistence seam, or storage adapter.
 */
export function analyzeRequestedUnit(
  unitParam: string | null
): UnitRequestAnalysis {
  if (unitParam === null || unitParam === "") {
    return { kind: "none" };
  }
  const parsed = Number(unitParam);
  if (!Number.isInteger(parsed)) {
    return { kind: "none" };
  }
  // Derive availability directly from the catalog map. Lookup falls
  // back to length 0 for unknown unit numbers — this preserves the
  // "unavailable" classification for malformed requests rather than
  // silently letting them through to the practice phases.
  const activeSkillCount = SKILLS_BY_UNIT[parsed]?.length ?? 0;
  if (activeSkillCount === 0) {
    return { kind: "unavailable-unit", unit: unitParam };
  }
  return { kind: "none" };
}
