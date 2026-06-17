import { describe, test, expect } from "vitest";

import { buildAdvancedPracticeFixture } from "../advanced-practice";
import type { ChallengeAttempt } from "../../../../src/lib/advanced-practice-progress";

describe("buildAdvancedPracticeFixture", () => {
  test("returns an empty AdvancedPracticeProgress by default", () => {
    const progress = buildAdvancedPracticeFixture({
      skillId: "mat.u1.potencias_raices",
    });

    expect(Array.isArray(progress.challengeAttempts)).toBe(true);
    expect(progress.challengeAttempts).toHaveLength(0);
    expect(progress.readinessBySkill).toEqual({});
  });

  test("passes challengeAttempts through into the result", () => {
    const attempt: ChallengeAttempt = {
      exerciseId: "ex.u1.potencias_raices.challenge.1",
      skillId: "mat.u1.potencias_raices",
      correct: true,
      answeredAt: "2026-06-17T10:00:00.000Z",
      timeMs: 4500,
      attemptIndex: 1,
    };

    const progress = buildAdvancedPracticeFixture({
      skillId: "mat.u1.potencias_raices",
      challengeAttempts: [attempt],
    });

    expect(progress.challengeAttempts).toHaveLength(1);
    expect(progress.challengeAttempts[0]).toEqual(attempt);
  });

  test("result is JSON-serializable so addInitScript can seed localStorage", () => {
    const progress = buildAdvancedPracticeFixture({
      skillId: "mat.u1.potencias_raices",
    });

    expect(() => JSON.stringify(progress)).not.toThrow();
    const round = JSON.parse(JSON.stringify(progress)) as ReturnType<
      typeof buildAdvancedPracticeFixture
    >;
    expect(round.challengeAttempts).toHaveLength(0);
    expect(round.readinessBySkill).toEqual({});
  });
});
