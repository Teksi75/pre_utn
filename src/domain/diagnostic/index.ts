import type { Exercise } from "../models/exercise";
import type { ExerciseId } from "../models/exercise";
import type { SkillId } from "../models/skill";

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

// ── Functions ────────────────────────────────────────────────────────────────

function extractUnit(skillId: string): number {
  const match = skillId.match(/^mat\.u(\d+)\./);
  return match ? Number(match[1]) : 0;
}

/**
 * Select a balanced set of exercises across units.
 * Deterministic: same catalog always produces the same selection.
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
    const sorted = [...exercises].sort((a, b) => {
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
