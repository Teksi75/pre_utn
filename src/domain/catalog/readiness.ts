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

  // Feedback: check if feedback mappings exist for this skill's error tags.
  //
  // Two correctness rules are applied here:
  //
  // 1. Unit scope: tags are filtered to those belonging to the current
  //    unit's namespace (u{unit}_*). Legacy U3 monolith entries
  //    (exercises.json) carry `u2_*` tags from an older migration; those
  //    are an artifact of the legacy tagging era and must not block the
  //    U3 readiness verdict. Only this-unit tags count for coverage.
  //
  // 2. Vacuous truth: if the skill declares no in-scope error tags
  //    (every exercise has an empty `commonErrorTags` array, OR all
  //    declared tags are out-of-scope), there is nothing to cover and
  //    the feedback requirement is satisfied without needing a matching
  //    mapping. PR 3 (implement-unit-3-mathematics) relies on this — U3
  //    exercises deliberately declare empty tag arrays in their first
  //    wave, and the pilot activation contract requires those skills to
  //    be contentReady.
  const unitNumber = unitKey
    ? Number(unitKey.replace(/^unit-/, ""))
    : NaN;
  const allSkillTags = exercises.flatMap((e) => e.commonErrorTags);
  const inScopeTags = Number.isFinite(unitNumber)
    ? allSkillTags.filter((tag) => tag.startsWith(`u${unitNumber}_`))
    : allSkillTags;
  const hasFeedback =
    unitKey !== undefined &&
    (inScopeTags.length === 0 ||
      (() => {
        const feedbackTags = new Set(
          loadFeedbackContent(unitKey).map((m) => m.errorTag)
        );
        const distinctInScopeTags = [...new Set(inScopeTags)];
        return (
          distinctInScopeTags.length > 0 &&
          distinctInScopeTags.every((tag) => feedbackTags.has(tag))
        );
      })());

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
