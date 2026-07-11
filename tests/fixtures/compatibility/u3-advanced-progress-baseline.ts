/**
 * Frozen `pre-utn.advanced-practice.v1` baseline (as const, immutable).
 *
 * Captures the pre-change `AdvancedPracticeProgress` literal with
 * the EXACT field set documented in
 * `src/lib/advanced-practice-progress.ts`:
 *   - challengeAttempts: ChallengeAttempt[]
 *     Each ChallengeAttempt MUST have EXACTLY these fields:
 *       studentId, exerciseId, skillId, correct, answeredAt,
 *       timeMs, attemptIndex.
 *   - readinessBySkill: Record<SkillId, number | null>
 *     Values are finite numbers in [0, 100] or null (not started).
 *
 * This file is a FIXTURE — it MUST NOT import from
 * `src/domain/catalog/`, MUST be `as const`, and the expected values
 * MUST NOT be derived from the post-change parser.
 *
 * S0 owns creation + parse assertions; S10 re-applies the change and
 * asserts the same ChallengeAttempt fields + readiness keys parse.
 */
export const FROZEN_U3_ADVANCED_PROGRESS_BASELINE = {
  challengeAttempts: [
    {
      studentId: "u3-baseline-student-1",
      exerciseId: "ex.u3.traduccion_lenguaje_verbal.desafio-01",
      skillId: "mat.u3.traduccion_lenguaje_verbal",
      correct: true,
      answeredAt: "2026-06-13T10:05:00.000Z",
      timeMs: 12000,
      attemptIndex: 1,
    },
  ],
  readinessBySkill: {
    "mat.u3.traduccion_lenguaje_verbal": 100,
    "mat.u3.ecuaciones_lineales": null,
    "mat.u3.logaritmicas": null,
  },
} as const;

export type FrozenU3AdvancedProgressBaseline =
  (typeof FROZEN_U3_ADVANCED_PROGRESS_BASELINE);
