/**
 * Frozen `pre-utn.practice.v1` baseline (as const, immutable).
 *
 * Captures the pre-change full student-scoped PracticeProgressMap
 * (the v2 envelope `{ students, activeStudentId }`). The six
 * PracticeProgress fields documented in
 * `src/lib/practice-progress.ts` are all required:
 *   - attempts (array)
 *   - accuracyBySkill (record)
 *   - trendBySkill (record)
 *   - lastPracticedBySkill (record)
 *   - diagnosticResult (nullable)
 *   - studyPlan (nullable)
 *
 * This file is a FIXTURE — it MUST NOT import from
 * `src/domain/catalog/` or `src/domain/practice/`, MUST be `as const`,
 * and the expected values MUST NOT be derived from the post-change
 * parser.
 *
 * S0 owns creation + parse assertions; S10 re-applies the change and
 * asserts the same envelope still parses with the same keys/types.
 */
export const FROZEN_U3_PRACTICE_PROGRESS_BASELINE = {
  students: {
    "u3-baseline-student-1": {
      attempts: [
        {
          exerciseId: "ex.u3.traduccion_lenguaje_verbal.2",
          skillId: "mat.u3.traduccion_lenguaje_verbal",
          correct: true,
          answeredAt: "2026-06-13T10:00:00.000Z",
          timeMs: 4200,
          attemptIndex: 1,
          studentId: "u3-baseline-student-1",
        },
      ],
      accuracyBySkill: { "mat.u3.traduccion_lenguaje_verbal": 1.0 },
      trendBySkill: { "mat.u3.traduccion_lenguaje_verbal": "stable" },
      lastPracticedBySkill: {
        "mat.u3.traduccion_lenguaje_verbal": "2026-06-13T10:00:00.000Z",
      },
      diagnosticResult: null,
      studyPlan: null,
    },
  },
  activeStudentId: "u3-baseline-student-1",
} as const;

export type FrozenU3PracticeProgressBaseline =
  (typeof FROZEN_U3_PRACTICE_PROGRESS_BASELINE);
