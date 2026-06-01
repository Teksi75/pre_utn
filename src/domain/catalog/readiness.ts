/**
 * Catalog readiness — checks whether a skill has all components for practice.
 * Pure TypeScript. Delegates to domain readiness computation.
 */

import { computeReadiness, type ReadinessComponent } from "../readiness/index";
import { loadTheoryContent, loadExampleContent, loadFeedbackContent } from "./content-loaders";
import { queryBySkill } from "./index";
import { PILOT_SKILL_UNIT_MAP } from "./pilot-skills";

/**
 * Get readiness components for a skill.
 * Checks theory, examples, exercises, feedback, and evaluation.
 * @param skillId - The skill to check
 * @returns Array of ReadinessComponent with presence status
 */
export function getSkillComponents(skillId: string): readonly ReadinessComponent[] {
  const unitKey = PILOT_SKILL_UNIT_MAP[skillId];

  // Theory: check if theory content exists for this skill
  const hasTheory = unitKey
    ? loadTheoryContent(unitKey).some((n) => n.skillId === skillId)
    : false;

  // Examples: check if example content exists for this skill
  const hasExamples = unitKey
    ? loadExampleContent(unitKey).some((e) => e.skillId === skillId)
    : false;

  // Exercises: check if exercises exist in the catalog
  const exercises = queryBySkill(skillId);
  const hasExercises = exercises.length >= 4;

  // Feedback: check if feedback mappings exist for this skill's error tags
  const skillErrorTags = exercises.flatMap((e) => e.commonErrorTags);
  const hasFeedback = unitKey
    ? loadFeedbackContent(unitKey).some((m) => skillErrorTags.includes(m.errorTag))
    : false;

  // Evaluation: always available for pilot skills (evaluateAnswer exists)
  const hasEvaluation = true;

  return [
    { name: "theory", present: hasTheory },
    { name: "examples", present: hasExamples },
    { name: "exercises", present: hasExercises },
    { name: "feedback", present: hasFeedback },
    { name: "evaluation", present: hasEvaluation },
  ];
}

/**
 * Check whether a skill is ready for guided practice.
 * @param skillId - The skill to check
 * @returns ReadinessResult with ready flag and missing component names
 */
export function isSkillReady(skillId: string) {
  const components = getSkillComponents(skillId);
  return computeReadiness(skillId, components);
}
