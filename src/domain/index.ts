/**
 * Domain barrel — pure TypeScript logic only.
 * No React, Next.js, or Supabase imports allowed here.
 *
 * Exports all public contracts from the math domain layer.
 */

// ── Constants ────────────────────────────────────────────────────────────────

/** Current project phase — pilot with Unit 1 content, domain models, and guided practice. */
export const PROJECT_PHASE = "pilot" as const;

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

export type { ExerciseLinkage } from "./catalog/content-loaders";
export {
  loadTheoryContent,
  loadExampleContent,
  loadFeedbackContent,
  pilotExercisesWithLinks,
} from "./catalog/content-loaders";

export { isSkillReady, getSkillComponents } from "./catalog/readiness";

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

// ── Theory ──────────────────────────────────────────────────────────────────

export type {
  SourceUse,
  CanonicalTrace,
  ConceptBlock,
  TheoryNode,
  ValidationError as TheoryValidationError,
} from "./models/theory";
export { validateTheoryNode } from "./models/theory";

// ── Worked Example ──────────────────────────────────────────────────────────

export type {
  SolutionStep,
  WorkedExample,
  ValidationError as WorkedExampleValidationError,
} from "./models/worked-example";
export { validateWorkedExample } from "./models/worked-example";

// ── Feedback ────────────────────────────────────────────────────────────────

export type { FeedbackMapping, Feedback } from "./feedback/index";
export { generateFeedback } from "./feedback/index";

// ── Progress ────────────────────────────────────────────────────────────────

export type {
  PracticeAttempt,
  PracticeProgress,
  Trend,
} from "./progress/index";
export { computeAccuracy, computeTrend } from "./progress/index";

// ── Readiness ───────────────────────────────────────────────────────────────

export type {
  ReadinessComponent,
  ReadinessResult,
} from "./readiness/index";
export { computeReadiness } from "./readiness/index";
