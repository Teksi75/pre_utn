import { describe, test, expect } from "vitest";

import { buildPracticeProgressFixture } from "../practice-progress";
import type { PracticeAttempt } from "../../../../src/domain/progress/index";

describe("buildPracticeProgressFixture", () => {
  test("returns a v2 student-scoped PracticeProgressMap with the correct shape", () => {
    const studentId = "local-test-1";
    const skillId = "mat.u1.potencias_raices";
    const map = buildPracticeProgressFixture({ studentId, skillId });

    // Top-level wiring
    expect(map.activeStudentId).toBe(studentId);
    const slice = map.students[studentId];
    expect(slice).toBeDefined();

    // attempts is an array (readonly at the type level)
    expect(Array.isArray(slice.attempts)).toBe(true);

    // accuracyBySkill[skillId] is a number in [0, 1]
    const accuracy = slice.accuracyBySkill[skillId];
    expect(typeof accuracy).toBe("number");
    expect(accuracy).toBeGreaterThanOrEqual(0);
    expect(accuracy).toBeLessThanOrEqual(1);

    // trendBySkill[skillId] is one of the allowed classifications
    const trend = slice.trendBySkill[skillId];
    expect(["improving", "stable", "needs-review"]).toContain(trend);

    // lastPracticedBySkill has an entry for the skill
    expect(typeof slice.lastPracticedBySkill[skillId]).toBe("string");

    // diagnosticResult and studyPlan default to null
    expect(slice.diagnosticResult).toBeNull();
    expect(slice.studyPlan).toBeNull();
  });

  test("completedExerciseIds become PracticeAttempt entries with stable values", () => {
    const studentId = "local-test-1";
    const skillId = "mat.u1.potencias_raices";
    const completedExerciseIds = [
      "ex.u1.potencias_raices.1",
      "ex.u1.potencias_raices.2",
    ];
    const map = buildPracticeProgressFixture({
      studentId,
      skillId,
      completedExerciseIds,
    });

    const slice = map.students[studentId];
    expect(slice.attempts).toHaveLength(2);

    slice.attempts.forEach((attempt: PracticeAttempt, index: number) => {
      expect(attempt.exerciseId).toBe(completedExerciseIds[index]);
      expect(attempt.skillId).toBe(skillId);
      expect(attempt.correct).toBe(true);
      expect(typeof attempt.answeredAt).toBe("string");
      // answeredAt must be a valid ISO string
      expect(new Date(attempt.answeredAt).toISOString()).toBe(attempt.answeredAt);
      expect(attempt.timeMs).toBeGreaterThan(0);
      expect(attempt.attemptIndex).toBe(index + 1);
      expect(attempt.studentId).toBe(studentId);
    });
  });

  test("accuracyBySkill input merges with the per-skill default", () => {
    const map = buildPracticeProgressFixture({
      studentId: "local-test-1",
      skillId: "mat.u1.potencias_raices",
      accuracyBySkill: { "mat.u2.operaciones_polinomios": 0.8 },
    });

    const slice = map.students["local-test-1"];
    // default for the active skill is preserved
    expect(slice.accuracyBySkill["mat.u1.potencias_raices"]).toBe(1.0);
    // caller-provided entry is merged in
    expect(slice.accuracyBySkill["mat.u2.operaciones_polinomios"]).toBe(0.8);
  });

  test("result is JSON-serializable so addInitScript can seed localStorage", () => {
    const map = buildPracticeProgressFixture({
      studentId: "local-test-1",
      skillId: "mat.u1.potencias_raices",
      completedExerciseIds: ["ex.u1.potencias_raices.1"],
    });

    expect(() => JSON.stringify(map)).not.toThrow();
    const round = JSON.parse(JSON.stringify(map)) as ReturnType<
      typeof buildPracticeProgressFixture
    >;
    expect(round.activeStudentId).toBe("local-test-1");
    expect(round.students["local-test-1"].attempts).toHaveLength(1);
  });
});
