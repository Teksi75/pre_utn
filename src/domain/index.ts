/**
 * Domain barrel — pure TypeScript logic only.
 * No React, Next.js, or Supabase imports allowed here.
 *
 * Exports all public contracts from the math domain layer.
 */

// ── Constants ────────────────────────────────────────────────────────────────

/** Current project phase — scaffold only; math features not yet implemented. */
export const PROJECT_PHASE = "scaffold" as const;

/** Project scope — first subject is Matemática; Física deferred to phase 2. */
export const PROJECT_SCOPE = "matematica" as const;

// ── Models ───────────────────────────────────────────────────────────────────

export type { Result } from "./models/result";
export { ok, err } from "./models/result";

export type { SkillId, Skill, ValidationError as SkillValidationError } from "./models/skill";
export { validateSkill } from "./models/skill";

export {
  UNIT_1_SKILLS,
  UNIT_2_SKILLS,
  UNIT_3_SKILLS,
  UNIT_4_SKILLS,
  UNIT_5_SKILLS,
  UNIT_6_SKILLS,
  ALL_SKILLS,
  KNOWN_SKILL_IDS,
  SKILL_DEPENDENCIES,
} from "./models/skill-catalog";
export type { SkillDependency } from "./models/skill-catalog";

export type {
  ExerciseId,
  ExerciseType,
  Difficulty,
  Exercise,
  ValidationError as ExerciseValidationError,
} from "./models/exercise";
export { validateExercise } from "./models/exercise";

export type {
  ErrorTagId,
  ErrorUnit,
  ErrorTag,
  ValidationError as ErrorTagValidationError,
} from "./models/error-tag";
export { validateErrorTag } from "./models/error-tag";

// ── Evaluator ────────────────────────────────────────────────────────────────

export type { EvaluationResult } from "./evaluator/index";
export { evaluateAnswer } from "./evaluator/index";

// ── Catalog ──────────────────────────────────────────────────────────────────

export {
  detectPrerequisiteCycles,
  loadCatalog,
  queryByDifficultyRange,
  queryBySkill,
  queryByUnit,
} from "./catalog/index";

// ── Diagnostic ───────────────────────────────────────────────────────────────

export type {
  Attempt,
  DiagnosticSelection,
  SkillEstimate,
  PracticeSuggestion,
} from "./diagnostic/index";
export {
  selectBalancedSet,
  estimateSkills,
  suggestPractice,
} from "./diagnostic/index";

// ── Error Taxonomy ───────────────────────────────────────────────────────────

export { loadTaxonomy, lookupTag, filterByUnit } from "./error-taxonomy/index";
