import { describe, test, expect } from "vitest";
import {
  computeAccuracy,
  computeTrend,
  computeMasteryLevel,
  deduplicateByLastAttempt,
  type PracticeAttempt,
  type PracticeProgress,
} from "../progress/index";
import type { SkillId } from "../models/skill";

describe("PracticeAttempt / PracticeProgress", () => {
  const makeAttempt = (overrides: Partial<PracticeAttempt> = {}): PracticeAttempt => ({
    exerciseId: "ex.u1.propiedades_operaciones_reales.1",
    skillId: "mat.u1.propiedades_operaciones_reales",
    correct: true,
    answeredAt: "2026-01-15T10:00:00Z",
    timeMs: 0,
    attemptIndex: 1,
    ...overrides,
  });

  describe("PracticeAttempt model", () => {
    test("has required timeMs field with default 0", () => {
      const attempt = makeAttempt();
      expect(attempt.timeMs).toBe(0);
    });

    test("has required attemptIndex field with default 1", () => {
      const attempt = makeAttempt();
      expect(attempt.attemptIndex).toBe(1);
    });

    test("allows overriding timeMs and attemptIndex", () => {
      const attempt = makeAttempt({ timeMs: 45000, attemptIndex: 3 });
      expect(attempt.timeMs).toBe(45000);
      expect(attempt.attemptIndex).toBe(3);
    });
  });

  describe("deduplicateByLastAttempt", () => {
    test("returns only last attempt per exercise (highest attemptIndex)", () => {
      const attempts = [
        makeAttempt({ exerciseId: "ex.1", attemptIndex: 1, correct: false }),
        makeAttempt({ exerciseId: "ex.1", attemptIndex: 2, correct: false }),
        makeAttempt({ exerciseId: "ex.1", attemptIndex: 3, correct: true }),
      ];
      const result = deduplicateByLastAttempt(attempts);
      expect(result).toHaveLength(1);
      expect(result[0].attemptIndex).toBe(3);
      expect(result[0].correct).toBe(true);
    });

    test("preserves one attempt per distinct exerciseId", () => {
      const attempts = [
        makeAttempt({ exerciseId: "ex.A", attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.A", attemptIndex: 2, correct: false }),
        makeAttempt({ exerciseId: "ex.B", attemptIndex: 1, correct: true }),
      ];
      const result = deduplicateByLastAttempt(attempts);
      expect(result).toHaveLength(2);
      // ex.A: last attempt is attemptIndex 2 (correct: false)
      const a = result.find((r) => r.exerciseId === "ex.A")!;
      expect(a.attemptIndex).toBe(2);
      expect(a.correct).toBe(false);
      // ex.B: only one attempt (correct: true)
      const b = result.find((r) => r.exerciseId === "ex.B")!;
      expect(b.attemptIndex).toBe(1);
      expect(b.correct).toBe(true);
    });

    test("returns empty array for empty input", () => {
      const result = deduplicateByLastAttempt([]);
      expect(result).toHaveLength(0);
    });

    // GGA fix: chronological deduplication — answeredAt wins over attemptIndex
    test("picks chronologically last attempt (answeredAt), not highest attemptIndex", () => {
      // Session 2 (newer browser session, reset attemptIndex to 1)
      // happens after Session 1 (older, attemptIndex=2)
      // but attemptIndex-only logic would keep the older attempt
      const attempts = [
        makeAttempt({
          exerciseId: "ex.chrono",
          attemptIndex: 2, // older session, higher index
          answeredAt: "2026-01-15T10:00:00Z",
          correct: false,
        }),
        makeAttempt({
          exerciseId: "ex.chrono",
          attemptIndex: 1, // newer session, lower index
          answeredAt: "2026-01-16T14:30:00Z",
          correct: true,
        }),
      ];
      const result = deduplicateByLastAttempt(attempts);
      expect(result).toHaveLength(1);
      expect(result[0].answeredAt).toBe("2026-01-16T14:30:00Z");
      expect(result[0].correct).toBe(true);
    });

    test("uses attemptIndex as tie-breaker when answeredAt is equal", () => {
      const attempts = [
        makeAttempt({
          exerciseId: "ex.same-time",
          attemptIndex: 1,
          answeredAt: "2026-01-15T10:00:00Z",
          correct: false,
        }),
        makeAttempt({
          exerciseId: "ex.same-time",
          attemptIndex: 3,
          answeredAt: "2026-01-15T10:00:00Z",
          correct: true,
        }),
        makeAttempt({
          exerciseId: "ex.same-time",
          attemptIndex: 2,
          answeredAt: "2026-01-15T10:00:00Z",
          correct: false,
        }),
      ];
      const result = deduplicateByLastAttempt(attempts);
      expect(result).toHaveLength(1);
      expect(result[0].attemptIndex).toBe(3);
      expect(result[0].correct).toBe(true);
    });

    // GGA fix: output must be chronologically sorted so computeTrend splits correctly
    test("output is sorted chronologically by answeredAt", () => {
      const attempts = [
        makeAttempt({
          exerciseId: "ex.B",
          attemptIndex: 1,
          answeredAt: "2026-01-20T10:00:00Z",
          correct: true,
        }),
        makeAttempt({
          exerciseId: "ex.A",
          attemptIndex: 1,
          answeredAt: "2026-01-10T10:00:00Z",
          correct: false,
        }),
        makeAttempt({
          exerciseId: "ex.C",
          attemptIndex: 1,
          answeredAt: "2026-01-15T10:00:00Z",
          correct: true,
        }),
      ];
      const result = deduplicateByLastAttempt(attempts);
      expect(result).toHaveLength(3);
      expect(result[0].exerciseId).toBe("ex.A"); // earliest
      expect(result[1].exerciseId).toBe("ex.C"); // middle
      expect(result[2].exerciseId).toBe("ex.B"); // latest
    });

    test("chronological sort preserves cross-session dedup: older session vs newer with retries", () => {
      // Exercise A: 3 attempts across 2 sessions
      // Session 1: attemptIndex=1, answeredAt T1, incorrect
      // Session 1: attemptIndex=2, answeredAt T2, incorrect
      // Session 2: attemptIndex=1, answeredAt T3, correct (newest chronologically, lowest index)
      // Exercise B: 1 attempt at T4
      const attempts = [
        makeAttempt({
          exerciseId: "ex.xcross.A",
          attemptIndex: 1,
          answeredAt: "2026-02-01T10:00:00Z",
          correct: false,
        }),
        makeAttempt({
          exerciseId: "ex.xcross.A",
          attemptIndex: 2,
          answeredAt: "2026-02-01T10:05:00Z",
          correct: false,
        }),
        makeAttempt({
          exerciseId: "ex.xcross.A",
          attemptIndex: 1, // session 2 resets
          answeredAt: "2026-02-02T09:00:00Z",
          correct: true,
        }),
        makeAttempt({
          exerciseId: "ex.xcross.B",
          attemptIndex: 1,
          answeredAt: "2026-02-01T10:10:00Z",
          correct: true,
        }),
      ];
      const result = deduplicateByLastAttempt(attempts);
      expect(result).toHaveLength(2);
      // ex.xcross.A: should be the Feb 2 version (correct)
      const a = result.find((r) => r.exerciseId === "ex.xcross.A")!;
      expect(a.correct).toBe(true);
      expect(a.answeredAt).toBe("2026-02-02T09:00:00Z");
      // Order: A (Feb 1, 10:10) before ex.xcross.A's latest (Feb 2, 09:00) — wait no
      // Actually ex.xcross.B at Feb 1 10:10 comes before ex.xcross.A (Feb 2 09:00) chronologically
      expect(result[0].exerciseId).toBe("ex.xcross.B");
      expect(result[1].exerciseId).toBe("ex.xcross.A");
    });
  });

  describe("computeAccuracy", () => {
    // Helper: valid default timeMs for tests that don't test the time filter
    const t = 5000;

    test("returns 1.0 for all correct attempts", () => {
      const attempts = [
        makeAttempt({ exerciseId: "ex.1", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.2", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.3", timeMs: t, correct: true }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(accuracy).toBe(1.0);
    });

    test("returns 0.0 for all incorrect attempts", () => {
      const attempts = [
        makeAttempt({ exerciseId: "ex.1", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.2", timeMs: t, correct: false }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(accuracy).toBe(0.0);
    });

    test("returns 0.5 for half correct", () => {
      const attempts = [
        makeAttempt({ exerciseId: "ex.1", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.2", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.3", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.4", timeMs: t, correct: false }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(accuracy).toBe(0.5);
    });

    test("filters by skillId", () => {
      const attempts = [
        makeAttempt({ exerciseId: "ex.1", skillId: "mat.u1.propiedades_operaciones_reales", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.2", skillId: "mat.u1.intervalos", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.3", skillId: "mat.u1.propiedades_operaciones_reales", timeMs: t, correct: false }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(accuracy).toBe(0.5);
    });

    test("returns 0 for no matching attempts", () => {
      const attempts = [
        makeAttempt({ skillId: "mat.u1.intervalos", timeMs: t, correct: true }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(accuracy).toBe(0);
    });

    // T1.4: deduplication by last attempt per exercise
    test("deduplicates retries: 3 attempts same exercise, last correct → accuracy 1.0", () => {
      const attempts = [
        makeAttempt({ exerciseId: "ex.retry.1", timeMs: t, attemptIndex: 1, correct: false }),
        makeAttempt({ exerciseId: "ex.retry.1", timeMs: t, attemptIndex: 2, correct: false }),
        makeAttempt({ exerciseId: "ex.retry.1", timeMs: t, attemptIndex: 3, correct: true }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(accuracy).toBe(1.0);
    });

    test("excludes attempts with timeMs < 100 (timer bug)", () => {
      const attempts = [
        makeAttempt({ exerciseId: "ex.fast.1", timeMs: 50, correct: true }),
        makeAttempt({ exerciseId: "ex.normal.1", timeMs: 3000, correct: false }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      // ex.fast.1 excluded → only ex.normal.1 counted → 0/1 = 0
      expect(accuracy).toBe(0);
    });

    test("excludes attempts with timeMs > 600000 (tab abandoned)", () => {
      const attempts = [
        makeAttempt({ exerciseId: "ex.long.1", timeMs: 700_000, correct: true }),
        makeAttempt({ exerciseId: "ex.normal.1", timeMs: 5000, correct: true }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      // ex.long.1 excluded → only ex.normal.1 counted → 1/1 = 1
      expect(accuracy).toBe(1);
    });

    test("allows timeMs exactly at boundaries (100 and 600000)", () => {
      const attempts = [
        makeAttempt({ exerciseId: "ex.a", timeMs: 100, correct: true }),
        makeAttempt({ exerciseId: "ex.b", timeMs: 600_000, correct: false }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      // Both within range → 1/2 = 0.5
      expect(accuracy).toBe(0.5);
    });

    test("deduplicates independently across exercises", () => {
      // Ex A: 2 attempts (last incorrect), Ex B: 1 attempt (correct)
      const attempts = [
        makeAttempt({ exerciseId: "ex.A", timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.A", timeMs: t, attemptIndex: 2, correct: false }),
        makeAttempt({ exerciseId: "ex.B", timeMs: t, attemptIndex: 1, correct: true }),
      ];
      const accuracy = computeAccuracy(attempts, "mat.u1.propiedades_operaciones_reales");
      // 1 correct (ex.B) / 2 exercises = 0.5
      expect(accuracy).toBe(0.5);
    });
  });

  describe("computeTrend", () => {
    const t = 5000;

    test("returns 'improving' when accuracy increases", () => {
      // First half: 2 incorrect out of 4 (0.0), second half: 4 correct out of 4 (1.0)
      const attempts: PracticeAttempt[] = [
        makeAttempt({ exerciseId: "ex.1", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.2", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.3", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.4", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.5", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.6", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.7", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.8", timeMs: t, correct: true }),
      ];
      const trend = computeTrend(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(trend).toBe("improving");
    });

    test("returns 'stable' when accuracy is constant", () => {
      const attempts: PracticeAttempt[] = [
        makeAttempt({ exerciseId: "ex.1", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.2", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.3", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.4", timeMs: t, correct: true }),
      ];
      const trend = computeTrend(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(trend).toBe("stable");
    });

    test("returns 'needs-review' when accuracy decreases", () => {
      const attempts: PracticeAttempt[] = [
        makeAttempt({ exerciseId: "ex.1", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.2", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.3", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.4", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.5", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.6", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.7", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.8", timeMs: t, correct: false }),
      ];
      const trend = computeTrend(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(trend).toBe("needs-review");
    });

    test("returns 'stable' for fewer than 4 attempts", () => {
      const attempts = [
        makeAttempt({ exerciseId: "ex.1", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.2", timeMs: t, correct: false }),
      ];
      const trend = computeTrend(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(trend).toBe("stable");
    });

    test("filters by skillId", () => {
      const attempts: PracticeAttempt[] = [
        makeAttempt({ exerciseId: "ex.1", skillId: "mat.u1.propiedades_operaciones_reales", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.2", skillId: "mat.u1.propiedades_operaciones_reales", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.3", skillId: "mat.u1.propiedades_operaciones_reales", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.4", skillId: "mat.u1.propiedades_operaciones_reales", timeMs: t, correct: false }),
        makeAttempt({ exerciseId: "ex.5", skillId: "mat.u1.propiedades_operaciones_reales", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.6", skillId: "mat.u1.propiedades_operaciones_reales", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.7", skillId: "mat.u1.propiedades_operaciones_reales", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.8", skillId: "mat.u1.propiedades_operaciones_reales", timeMs: t, correct: true }),
        // Other skill attempts — should not affect trend
        makeAttempt({ exerciseId: "ex.9", skillId: "mat.u1.intervalos", timeMs: t, correct: true }),
        makeAttempt({ exerciseId: "ex.10", skillId: "mat.u1.intervalos", timeMs: t, correct: true }),
      ];
      const trend = computeTrend(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(trend).toBe("improving");
    });

    // T1.5: deduplication — only last attempt per exercise counts
    test("deduplicates retries before trend split", () => {
      // 8 unique exercises: first 4 incorrect, last 4 correct → improving
      const attempts: PracticeAttempt[] = [
        makeAttempt({ exerciseId: "ex.1", timeMs: t, attemptIndex: 1, correct: false }),
        makeAttempt({ exerciseId: "ex.2", timeMs: t, attemptIndex: 1, correct: false }),
        makeAttempt({ exerciseId: "ex.3", timeMs: t, attemptIndex: 1, correct: false }),
        makeAttempt({ exerciseId: "ex.4", timeMs: t, attemptIndex: 1, correct: false }),
        makeAttempt({ exerciseId: "ex.5", timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.6", timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.7", timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.8", timeMs: t, attemptIndex: 1, correct: true }),
      ];
      const trend = computeTrend(attempts, "mat.u1.propiedades_operaciones_reales");
      expect(trend).toBe("improving");
    });
  });

  describe("computeMasteryLevel", () => {
    // Helper: build a progress with N attempts for a skill, all correct.
    // Each attempt gets a unique exerciseId so deduplication preserves count.
    // Uses valid timeMs (5000) so attempts pass the time filter.
    const buildProgress = (
      skillId: SkillId,
      correctCount: number,
      totalCount: number,
      trend: "improving" | "stable" | "needs-review" = "stable"
    ): PracticeProgress => {
      const attempts: PracticeAttempt[] = [];
      for (let i = 0; i < totalCount; i++) {
        attempts.push(
          makeAttempt({
            exerciseId: `ex.test.${i}`,
            skillId,
            correct: i < correctCount,
            timeMs: 5000,
            answeredAt: `2026-01-01T10:${String(i).padStart(2, "0")}:00Z`,
          })
        );
      }
      const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
      return {
        attempts,
        accuracyBySkill: { [skillId]: accuracy },
        trendBySkill: { [skillId]: trend },
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };
    };

    test("returns 'not-started' when there are no attempts for the skill", () => {
      const progress: PracticeProgress = {
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("not-started");
    });

    test("returns 'mastered' when accuracy >= 0.8 with 5+ attempts and stable trend", () => {
      // 5 attempts, 5 correct (1.0 accuracy) — meets mastered threshold
      const progress = buildProgress("mat.u1.propiedades_operaciones_reales", 5, 5, "stable");
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("mastered");
    });

    test("returns 'mastered' at the 0.8 / 5-attempts boundary", () => {
      // 4 correct out of 5 = 0.8 accuracy, 5 attempts, stable → mastered
      const progress = buildProgress("mat.u1.propiedades_operaciones_reales", 4, 5, "stable");
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("mastered");
    });

    test("returns 'learning' when accuracy is high but fewer than 5 attempts", () => {
      // 3 correct out of 3 = 1.0 accuracy, but only 3 attempts → not mastered
      const progress = buildProgress("mat.u1.propiedades_operaciones_reales", 3, 3, "stable");
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("learning");
    });

    test("returns 'practicing' when accuracy >= 0.7 and trend is improving", () => {
      // 7 correct out of 10 = 0.7 accuracy, improving trend
      const progress = buildProgress("mat.u1.propiedades_operaciones_reales", 7, 10, "improving");
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("practicing");
    });

    test("returns 'review' when trend is needs-review, regardless of accuracy", () => {
      // 9 correct out of 10 = 0.9 accuracy, but trend is needs-review
      const progress = buildProgress("mat.u1.propiedades_operaciones_reales", 9, 10, "needs-review");
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("review");
    });

    test("returns 'learning' as the default for low accuracy and stable trend", () => {
      // 3 correct out of 10 = 0.3 accuracy, stable trend
      const progress = buildProgress("mat.u1.propiedades_operaciones_reales", 3, 10, "stable");
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      expect(level).toBe("learning");
    });

    test("falls back to 'learning' when accuracy/trend maps are missing entries", () => {
      // Attempts exist for the skill but accuracy/trend maps are empty —
      // should not throw and should return 'learning' (or higher)
      const progress: PracticeProgress = {
        attempts: [
          makeAttempt({ skillId: "mat.u1.propiedades_operaciones_reales", correct: true, timeMs: 5000 }),
        ],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };
      const level = computeMasteryLevel("mat.u1.propiedades_operaciones_reales", progress);
      // Accuracy defaults to 0 → not mastered/practicing; trend defaults to
      // 'stable' (not 'needs-review') → not review → 'learning'
      expect(level).toBe("learning");
    });

    // T1.6: mastery counts unique exercises, not total submits
    test("retries do not inflate mastery count: 2 exercises × 3 retries ≠ mastered", () => {
      // 6 attempts total, but only 2 unique exercises → count 2 < 5 → learning
      const skillId = "mat.u1.propiedades_operaciones_reales";
      const t = 5000;
      const attempts: PracticeAttempt[] = [
        makeAttempt({ exerciseId: "ex.A", skillId, timeMs: t, attemptIndex: 1, correct: false, answeredAt: "2026-01-01T10:00:00Z" }),
        makeAttempt({ exerciseId: "ex.A", skillId, timeMs: t, attemptIndex: 2, correct: false, answeredAt: "2026-01-01T10:01:00Z" }),
        makeAttempt({ exerciseId: "ex.A", skillId, timeMs: t, attemptIndex: 3, correct: true, answeredAt: "2026-01-01T10:02:00Z" }),
        makeAttempt({ exerciseId: "ex.B", skillId, timeMs: t, attemptIndex: 1, correct: false, answeredAt: "2026-01-01T10:03:00Z" }),
        makeAttempt({ exerciseId: "ex.B", skillId, timeMs: t, attemptIndex: 2, correct: false, answeredAt: "2026-01-01T10:04:00Z" }),
        makeAttempt({ exerciseId: "ex.B", skillId, timeMs: t, attemptIndex: 3, correct: true, answeredAt: "2026-01-01T10:05:00Z" }),
      ];
      // Accuracy: 2/6 = 0.33 (last attempt per exercise: 2/2 = 1.0)
      const progress: PracticeProgress = {
        attempts,
        accuracyBySkill: { [skillId]: 1.0 },
        trendBySkill: { [skillId]: "stable" },
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };
      const level = computeMasteryLevel(skillId, progress);
      // 2 unique exercises < MASTERY_MIN_ATTEMPTS (5) → learning
      expect(level).toBe("learning");
    });

    // GGA fix: computeMasteryLevel must filter invalid timing like accuracy/trend
    test("excludes attempts with timeMs < 100 from mastery attempt count", () => {
      const skillId = "mat.u1.propiedades_operaciones_reales";
      const t = 5000; // valid
      const attempts: PracticeAttempt[] = [
        makeAttempt({ exerciseId: "ex.1", skillId, timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.2", skillId, timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.3", skillId, timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.4", skillId, timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.5", skillId, timeMs: 50, attemptIndex: 1, correct: true }), // invalid timing
      ];
      // 5 total attempts, but only 4 with valid timing → count 4 < 5 → not mastered.
      // 4 valid attempts with 1.0 accuracy + improving → practicing (not learning!)
      const progress: PracticeProgress = {
        attempts,
        accuracyBySkill: { [skillId]: 1.0 },
        trendBySkill: { [skillId]: "improving" },
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };
      const level = computeMasteryLevel(skillId, progress);
      expect(level).toBe("practicing");
    });

    test("excludes attempts with timeMs > 600000 from mastery attempt count", () => {
      const skillId = "mat.u1.propiedades_operaciones_reales";
      const t = 5000; // valid
      const attempts: PracticeAttempt[] = [
        makeAttempt({ exerciseId: "ex.1", skillId, timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.2", skillId, timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.3", skillId, timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.4", skillId, timeMs: 700_000, attemptIndex: 1, correct: true }), // abandoned tab
        makeAttempt({ exerciseId: "ex.5", skillId, timeMs: t, attemptIndex: 1, correct: true }),
      ];
      // 5 total, 1 invalid → 4 valid → not mastered → but 4 valid + 1.0 accuracy + improving = practicing
      const progress: PracticeProgress = {
        attempts,
        accuracyBySkill: { [skillId]: 1.0 },
        trendBySkill: { [skillId]: "improving" },
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };
      const level = computeMasteryLevel(skillId, progress);
      expect(level).toBe("practicing");
    });

    test("timing filter in mastery: valid attempts at boundary pass", () => {
      const skillId = "mat.u1.propiedades_operaciones_reales";
      const attempts: PracticeAttempt[] = [
        makeAttempt({ exerciseId: "ex.1", skillId, timeMs: 100, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.2", skillId, timeMs: 600_000, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.3", skillId, timeMs: 5000, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.4", skillId, timeMs: 5000, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.5", skillId, timeMs: 5000, attemptIndex: 1, correct: true }),
      ];
      const progress: PracticeProgress = {
        attempts,
        accuracyBySkill: { [skillId]: 1.0 },
        trendBySkill: { [skillId]: "improving" },
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };
      const level = computeMasteryLevel(skillId, progress);
      // 5 valid attempts (boundary 100 and 600000 included) → mastered
      expect(level).toBe("mastered");
    });

    test("5 unique exercises (some with retries) → mastery achievable", () => {
      // Build manually: 5 unique exerciseIds, all correct, 5+ total attempts
      const skillId = "mat.u1.propiedades_operaciones_reales";
      const t = 5000;
      const attempts: PracticeAttempt[] = [
        makeAttempt({ exerciseId: "ex.1", skillId, timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.1", skillId, timeMs: t, attemptIndex: 2, correct: true }),
        makeAttempt({ exerciseId: "ex.2", skillId, timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.3", skillId, timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.4", skillId, timeMs: t, attemptIndex: 1, correct: true }),
        makeAttempt({ exerciseId: "ex.5", skillId, timeMs: t, attemptIndex: 1, correct: true }),
      ];
      const progress: PracticeProgress = {
        attempts,
        accuracyBySkill: { [skillId]: 1.0 },
        trendBySkill: { [skillId]: "improving" },
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };
      const level = computeMasteryLevel(skillId, progress);
      // 5 unique exercises, 1.0 accuracy, improving → master or practicing
      expect(level).toBe("mastered");
    });
  });
});
