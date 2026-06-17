/**
 * Practice progress fixture — v2 student-scoped PracticeProgressMap builder.
 *
 * Produces a JSON-serializable object matching the storage shape used by
 * `src/lib/practice-progress.ts` (structurally `ProgressState<PracticeProgress>`
 * from `src/domain/student-profile/index`). A Playwright `addInitScript` can
 * JSON.stringify this and write it to localStorage before Next.js hydration,
 * seeding the canary skill (`mat.u1.potencias_raices`) with a deterministic
 * slice so E2E specs can assert against the real practice UI.
 *
 * The timestamp is a stable ISO constant so companion vitest tests can assert
 * exact equality without flakiness.
 */

import type {
  PracticeProgress,
  PracticeAttempt,
} from "../../../src/domain/progress/index";
import type { ProgressState } from "../../../src/domain/student-profile/index";
import type { SkillId } from "../../../src/domain/models/skill";

/**
 * Stable ISO timestamp shared by the challenge-smoke-e2e fixtures.
 * Chosen so companion tests can assert exact equality on `answeredAt` /
 * `lastPracticedBySkill` / profile timestamps.
 */
export const DEFAULT_FIXTURE_TIMESTAMP = "2026-06-17T10:00:00.000Z";

/** Default elapsed time (ms) attributed to each seeded attempt. */
const DEFAULT_ATTEMPT_TIME_MS = 5000;

export interface BuildPracticeProgressInput {
  readonly studentId: string;
  readonly skillId: SkillId;
  /** Exercise ids to materialize as correct PracticeAttempt entries. */
  readonly completedExerciseIds?: readonly string[];
  /** Extra per-skill accuracy entries merged over the `{ [skillId]: 1.0 }` default. */
  readonly accuracyBySkill?: Record<string, number>;
  /** Override the stable timestamp used for `answeredAt` / `lastPracticedBySkill`. */
  readonly timestamp?: string;
}

/**
 * Build a v2 student-scoped practice progress fixture.
 *
 * Defaults mirror the canary seed (`potencias_raices`) described in
 * `openspec/changes/challenge-smoke-e2e/design.md`:
 * - `accuracyBySkill` defaults to `{ [skillId]: 1.0 }` and merges any input.
 * - `trendBySkill` defaults to `{ [skillId]: "stable" }`.
 * - `lastPracticedBySkill` defaults to `{ [skillId]: timestamp }`.
 * - `diagnosticResult` and `studyPlan` are `null`.
 */
export function buildPracticeProgressFixture(
  input: BuildPracticeProgressInput,
): ProgressState<PracticeProgress> {
  const { studentId, skillId } = input;
  const timestamp = input.timestamp ?? DEFAULT_FIXTURE_TIMESTAMP;
  const completedExerciseIds = input.completedExerciseIds ?? [];

  const attempts: readonly PracticeAttempt[] = completedExerciseIds.map(
    (exerciseId, index): PracticeAttempt => ({
      exerciseId,
      skillId,
      correct: true,
      answeredAt: timestamp,
      timeMs: DEFAULT_ATTEMPT_TIME_MS,
      attemptIndex: index + 1,
      studentId,
    }),
  );

  const accuracyBySkill: Record<string, number> = {
    [skillId]: 1.0,
    ...(input.accuracyBySkill ?? {}),
  };

  const trendBySkill: PracticeProgress["trendBySkill"] = {
    [skillId]: "stable",
  };

  const lastPracticedBySkill: PracticeProgress["lastPracticedBySkill"] = {
    [skillId]: timestamp,
  };

  const slice: PracticeProgress = {
    attempts,
    accuracyBySkill,
    trendBySkill,
    lastPracticedBySkill,
    diagnosticResult: null,
    studyPlan: null,
  };

  return {
    students: { [studentId]: slice },
    activeStudentId: studentId,
  };
}
