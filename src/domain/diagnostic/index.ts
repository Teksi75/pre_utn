import type { Exercise } from "../models/exercise";
import type { ExerciseId } from "../models/exercise";
import type { SkillId } from "../models/skill";
import type { PracticeProgress } from "../progress/index";
import { getExerciseOptionValue } from "../models/exercise";
import { PILOT_SKILLS } from "../catalog/pilot-skills";
import { SKILL_DEPENDENCIES } from "../models/skill-catalog";
import { isFiniteNumericAnswer } from "../utils/numeric";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Attempt {
  readonly exerciseId: ExerciseId;
  readonly skillId: SkillId;
  readonly correct: boolean;
  readonly errorTag?: string;
}

export type DiagnosticSelection =
  | { readonly ok: true; readonly exercises: readonly Exercise[] }
  | { readonly ok: false; readonly missingCoverage: readonly string[] };

export interface SkillEstimate {
  readonly skillId: SkillId;
  readonly accuracy: number;
  readonly attempts: number;
  readonly provisional: true;
  readonly errorTags: readonly string[];
}

export interface PracticeSuggestion {
  readonly skillId: SkillId;
  readonly accuracy: number;
  readonly errorTags: readonly string[];
}

/**
 * Persisted diagnostic snapshot — what was measured when the user completed
 * the diagnostic. Wraps the existing SkillEstimate / PracticeSuggestion so
 * downstream code can stay consistent with the live diagnostic engine.
 */
export interface DiagnosticResult {
  readonly completedAt: string; // ISO timestamp
  readonly estimates: readonly SkillEstimate[];
  readonly suggestions: readonly PracticeSuggestion[];
  readonly version: 1;
}

/**
 * Why a skill is queued in the study plan.
 * - "diagnostic-weak": flagged by the diagnostic
 * - "prerequisite-blocked": depends on a weak prerequisite
 * - "not-attempted": never practiced
 */
export type SkillPriorityReason =
  | "diagnostic-weak"
  | "prerequisite-blocked"
  | "not-attempted";

/** A single prioritized skill entry in a study plan. */
export interface SkillPriority {
  readonly skillId: SkillId;
  /** 1 = most urgent. */
  readonly priority: number;
  readonly reason: SkillPriorityReason;
  /** Error tags that mark the weak concepts for this skill. */
  readonly weakConcepts: readonly string[];
}

/**
 * Study plan derived from a DiagnosticResult.
 * Lets the UI plan future practice without re-running the diagnostic.
 */
export interface StudyPlan {
  readonly createdAt: string; // ISO timestamp
  readonly diagnosticResult: DiagnosticResult;
  readonly skillPriorities: readonly SkillPriority[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const WEAK_THRESHOLD = 0.7;
const TARGET_PER_UNIT = 2;
/** Below this accuracy, a prereq is considered "met" for unlocking a downstream skill. */
const PREREQ_MET_ACCURACY = 0.7;

// ── Functions ────────────────────────────────────────────────────────────────

function extractUnit(skillId: string): number {
  const match = skillId.match(/^mat\.u(\d+)\./);
  return match ? Number(match[1]) : 0;
}

/**
 * Check whether an exercise can be reliably evaluated.
 * Unreliable exercises are excluded from diagnostic assessment.
 *
 * Reliability rules:
 * - `numerical` exercises must have a parseable finite numeric expected answer
 * - `multiple-choice` exercises must have ≥3 options containing the expected answer
 * - `structured` exercises are excluded from placement (placement is a
 *   placement-only flow; structured controls require per-item multi-field
 *   input that placement does not exercise)
 * - All other types are considered reliable by default
 */
export function isExerciseReliable(exercise: Exercise): boolean {
  if (exercise.type === "numerical") {
    return isFiniteNumericAnswer(exercise.expectedAnswer);
  }

  if (exercise.type === "multiple-choice") {
    if (!exercise.options || exercise.options.length < 3) {
      return false;
    }
    if (!exercise.options.map(getExerciseOptionValue).includes(exercise.expectedAnswer)) {
      return false;
    }
  }

  if (exercise.type === "structured") {
    return false;
  }

  return true;
}

/**
 * Select a balanced set of exercises across units.
 * Deterministic: same catalog always produces the same selection.
 * Excludes exercises that cannot be reliably evaluated.
 */
export function selectBalancedSet(
  catalog: readonly Exercise[]
): DiagnosticSelection {
  const byUnit = new Map<number, Exercise[]>();
  for (const exercise of catalog) {
    const unit = extractUnit(exercise.skillId);
    if (unit === 0) continue;
    const existing = byUnit.get(unit) ?? [];
    existing.push(exercise);
    byUnit.set(unit, existing);
  }

  const availableUnits = Array.from(byUnit.keys()).sort((a, b) => a - b);
  const missingUnits: string[] = [];

  for (let unit = 1; unit <= 6; unit++) {
    const exercises = byUnit.get(unit);
    if (!exercises || exercises.length === 0) {
      missingUnits.push(`u${unit}`);
    }
  }

  if (missingUnits.length > 3) {
    return { ok: false, missingCoverage: missingUnits };
  }

  const selected: Exercise[] = [];
  for (const unit of availableUnits) {
    const exercises = byUnit.get(unit) ?? [];
    const reliable = exercises.filter(isExerciseReliable);
    const sorted = [...reliable].sort((a, b) => {
      if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
      return a.id.localeCompare(b.id);
    });
    const count = Math.min(TARGET_PER_UNIT, sorted.length);
    for (let i = 0; i < count; i++) {
      selected.push(sorted[i]);
    }
  }

  selected.sort((a, b) => a.id.localeCompare(b.id));
  return { ok: true, exercises: selected };
}

/** Estimate skill strength from diagnostic attempts. Estimates are provisional. */
export function estimateSkills(attempts: readonly Attempt[]): SkillEstimate[] {
  if (attempts.length === 0) return [];

  const bySkill = new Map<SkillId, { correct: number; total: number; errorTags: Set<string> }>();

  for (const attempt of attempts) {
    // Config-error attempts are unreliable — exclude from accuracy
    if (attempt.errorTag === "configuration_error") continue;

    const existing = bySkill.get(attempt.skillId) ?? {
      correct: 0,
      total: 0,
      errorTags: new Set<string>(),
    };
    existing.total++;
    if (attempt.correct) existing.correct++;
    if (attempt.errorTag) existing.errorTags.add(attempt.errorTag);
    bySkill.set(attempt.skillId, existing);
  }

  const estimates: SkillEstimate[] = [];
  for (const [skillId, stats] of bySkill) {
    estimates.push({
      skillId,
      accuracy: stats.correct / stats.total,
      attempts: stats.total,
      provisional: true,
      errorTags: Array.from(stats.errorTags),
    });
  }

  estimates.sort((a, b) => a.accuracy - b.accuracy);
  return estimates;
}

/** Suggest practice targets for skills below WEAK_THRESHOLD. */
export function suggestPractice(
  estimates: readonly SkillEstimate[]
): PracticeSuggestion[] {
  if (estimates.length === 0) return [];

  const suggestions: PracticeSuggestion[] = [];
  for (const estimate of estimates) {
    if (estimate.accuracy < WEAK_THRESHOLD) {
      suggestions.push({
        skillId: estimate.skillId,
        accuracy: estimate.accuracy,
        errorTags: [...estimate.errorTags],
      });
    }
  }

  suggestions.sort((a, b) => a.accuracy - b.accuracy);
  return suggestions;
}

// ── Study plan generation ───────────────────────────────────────────────────

/**
 * Build a study plan from a completed diagnostic and the student's current
 * practice progress. Pure function — no I/O.
 *
 * For every pilot skill, the plan assigns a priority and a reason:
 *
 *   1. If the student has already practiced the skill to >= 0.7 accuracy
 *      (`accuracyBySkill`), the skill is considered mastered enough and
 *      is omitted from the plan.
 *   2. Otherwise, if the skill was flagged as weak in the diagnostic
 *      (accuracy < WEAK_THRESHOLD), it is included with reason
 *      "diagnostic-weak":
 *        - prereqs met → priority 1
 *        - prereqs blocked → priority 3
 *   3. Otherwise (skill was never tested in the diagnostic and has no
 *      practice attempts), it is included with reason "not-attempted":
 *        - prereqs met → priority 2
 *        - prereqs blocked → priority 4
 *
 * "Prereqs met" means: every prerequisite skill has either (a) practice
 * accuracy >= PREREQ_MET_ACCURACY, or (b) a strong diagnostic estimate
 * (>= PREREQ_MET_ACCURACY and not flagged in the suggestions list).
 * A prereq that was never tested and never practiced is NOT met — we
 * have no positive evidence of readiness.
 *
 * `weakConcepts` for a planned skill is the deduplicated union of:
 *   - the skill's diagnostic error tags (from SkillEstimate)
 *   - the skill's practice error tags (from PracticeProgress.attempts)
 *
 * @param diagnosticResult - The completed diagnostic, or null if the user
 *                           hasn't taken one yet.
 * @param progress - The student's current practice progress.
 * @returns A `StudyPlan` sorted ascending by priority (1 = most urgent),
 *          or `null` when no diagnostic is available.
 */
export function createStudyPlan(
  diagnosticResult: DiagnosticResult | null,
  progress: PracticeProgress
): StudyPlan | null {
  if (!diagnosticResult) return null;

  const skillPriorities: SkillPriority[] = [];

  for (const pilot of PILOT_SKILLS) {
    const skillId = pilot.skillId;

    // 1. Already strong via practice → skip
    const practiceAccuracy = progress.accuracyBySkill[skillId];
    if (practiceAccuracy !== undefined && practiceAccuracy >= PREREQ_MET_ACCURACY) {
      continue;
    }

    // 2. Look up the diagnostic data for this skill
    const suggestion = diagnosticResult.suggestions.find((s) => s.skillId === skillId);
    const estimate = diagnosticResult.estimates.find((e) => e.skillId === skillId);
    const prereqsMet = arePrerequisitesMet(skillId, diagnosticResult, progress);

    if (suggestion) {
      // Weak in the diagnostic
      skillPriorities.push({
        skillId,
        priority: prereqsMet ? 1 : 3,
        reason: "diagnostic-weak",
        weakConcepts: collectWeakConcepts(skillId, estimate, progress),
      });
    } else if (!estimate) {
      // Never tested in the diagnostic AND not strong in practice
      skillPriorities.push({
        skillId,
        priority: prereqsMet ? 2 : 4,
        reason: "not-attempted",
        weakConcepts: [],
      });
    }
    // else: was in the diagnostic but accuracy >= WEAK_THRESHOLD → strong
    // (handled by step 1 via practice OR step 2 via absence from suggestions
    // combined with having an estimate).
  }

  skillPriorities.sort((a, b) => a.priority - b.priority);
  return {
    createdAt: new Date().toISOString(),
    diagnosticResult,
    skillPriorities,
  };
}

// ── Study plan helpers ──────────────────────────────────────────────────────

/**
 * A prerequisite is "met" when there is positive evidence the student can
 * handle the downstream skill. We accept either:
 *   - practice accuracy >= PREREQ_MET_ACCURACY (live progress), OR
 *   - a diagnostic estimate with accuracy >= PREREQ_MET_ACCURACY
 *     (i.e., the skill was tested AND was not flagged in suggestions).
 *
 * Unknown prereqs (never tested AND never practiced) are NOT met.
 */
function isPrerequisiteMet(
  prereqId: SkillId,
  diagnosticResult: DiagnosticResult,
  progress: PracticeProgress
): boolean {
  const practiceAccuracy = progress.accuracyBySkill[prereqId];
  if (practiceAccuracy !== undefined && practiceAccuracy >= PREREQ_MET_ACCURACY) {
    return true;
  }

  const estimate = diagnosticResult.estimates.find((e) => e.skillId === prereqId);
  if (estimate && estimate.accuracy >= PREREQ_MET_ACCURACY) {
    return true;
  }

  return false;
}

/** True when every prerequisite of `skillId` is met, or the skill has none. */
function arePrerequisitesMet(
  skillId: SkillId,
  diagnosticResult: DiagnosticResult,
  progress: PracticeProgress
): boolean {
  const dep = SKILL_DEPENDENCIES.find((d) => d.skillId === skillId);
  if (!dep || dep.prerequisites.length === 0) return true;
  return dep.prerequisites.every((p) =>
    isPrerequisiteMet(p, diagnosticResult, progress)
  );
}

/**
 * Collect weak concepts (error tags) for a planned skill from both
 * the diagnostic snapshot and live practice attempts. Deduped while
 * preserving the order: diagnostic tags first, then new practice tags.
 */
function collectWeakConcepts(
  skillId: SkillId,
  estimate: SkillEstimate | undefined,
  progress: PracticeProgress
): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of estimate?.errorTags ?? []) {
    if (!seen.has(tag)) {
      seen.add(tag);
      result.push(tag);
    }
  }

  for (const attempt of progress.attempts) {
    if (attempt.skillId !== skillId || !attempt.errorTag) continue;
    if (!seen.has(attempt.errorTag)) {
      seen.add(attempt.errorTag);
      result.push(attempt.errorTag);
    }
  }

  return result;
}
