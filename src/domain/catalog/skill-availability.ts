/**
 * Skill Availability — maps a skillId to one of 4 honest readiness states.
 *
 * Precedence (strict order):
 *   1. skillId NOT in PILOT_SKILL_UNIT_MAP → "coming-soon"
 *   2. in pilot + all key components (theory/examples/exercises/feedback) false → "in-preparation"
 *   3. in pilot + has theory + isSkillReady(skillId).ready === false → "theory-ready"
 *   4. isSkillReady(skillId).ready === true → "practice-ready"
 *   5. in pilot + some components present + no theory + not ready → "in-preparation"
 *
 * Rule 3 requires hasTheory === true. A pilot skill that has examples
 * (or any other component) but NO theory cannot be "theory-ready" — the
 * /learn/matematica/{skillId} page would 404 for it. Such a skill falls
 * through to "in-preparation". This is the spec discipline that prevents
 * the UI from showing a "Leer teoría" pill linked to a 404.
 *
 * Pure of catalog: no progress input, no React, no Next.js.
 * Coexists with src/domain/catalog/accessibility.ts (which combines
 * readiness + prereqs + mastery + progress). The division of responsibility
 * is: skill-availability is static catalog truth; accessibility is dynamic
 * student-truth.
 */

import { PILOT_SKILL_UNIT_MAP } from "./pilot-skills";
import { isSkillReady, getSkillComponents } from "./readiness";

export type SkillAvailabilityStatus =
  | "practice-ready"
  | "theory-ready"
  | "in-preparation"
  | "coming-soon";

/**
 * Map a skillId to one of 4 honest readiness states.
 *
 * @param skillId - The skill to evaluate
 * @returns One of the four SkillAvailabilityStatus values
 */
export function getSkillAvailability(skillId: string): SkillAvailabilityStatus {
  // Precedence 1: not in pilot → coming-soon
  if (!Object.hasOwn(PILOT_SKILL_UNIT_MAP, skillId)) {
    return "coming-soon";
  }

  const components = getSkillComponents(skillId);
  const hasTheory = components.some((c) => c.name === "theory" && c.present);
  const hasExamples = components.some((c) => c.name === "examples" && c.present);
  const hasExercises = components.some((c) => c.name === "exercises" && c.present);
  const hasFeedback = components.some((c) => c.name === "feedback" && c.present);

  // Precedence 2: in pilot but all key components absent → in-preparation
  if (!hasTheory && !hasExamples && !hasExercises && !hasFeedback) {
    return "in-preparation";
  }

  // Precedence 3: has theory + not ready → theory-ready
  if (hasTheory) {
    const { ready } = isSkillReady(skillId);
    if (!ready) {
      return "theory-ready";
    }
  }

  // Precedence 4: isSkillReady says ready → practice-ready
  const { ready } = isSkillReady(skillId);
  if (ready) {
    return "practice-ready";
  }

  // Rule 5: in pilot + some components present + no theory + not ready
  // → in-preparation (cannot honestly show "Leer teoría" without theory).
  return "in-preparation";
}
