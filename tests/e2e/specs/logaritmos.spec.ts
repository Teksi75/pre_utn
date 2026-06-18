/**
 * PR3 sample spec for `mat.u1.logaritmos`.
 *
 * Same shape as `intervalos.spec.ts` and `conjuntos_numericos.spec.ts`
 * (E1+E2+E3+E5 happy path + E4 skip). `logaritmos` has 11 catalog
 * entries and `valor_absoluto` is a prereq (per
 * src/domain/models/skill-catalog.ts), so the fixture seeds an
 * accuracy score above the prereq threshold (0.8) for `valor_absoluto`.
 *
 * Encounter order (NOT catalog order) per debug spec:
 *   1/11  MC    ex.u1.logaritmos.1
 *   2/11  TF    ex.u1.logaritmos.11
 *   3/11  MC    ex.u1.logaritmos.2
 *   4/11  TEXT  ex.u1.logaritmos.6
 *   5/11  TEXT  ex.u1.logaritmos.7
 *   6/11  TEXT  ex.u1.logaritmos.8
 *   7/11  TEXT  ex.u1.logaritmos.9
 *   8/11  MC    ex.u1.logaritmos.10
 *   9/11  MC    ex.u1.logaritmos.3
 *   10/11 MC    ex.u1.logaritmos.4
 *   11/11 MC    ex.u1.logaritmos.5
 *
 * Per spec rules, the spec only asserts FLOW, not correctness.
 * `numericalAnswers` is required (the helper does NOT have a "first
 * option" fallback for text-based forms — only for MC and TF), so we
 * pass dummy values in encounter order. `exerciseAnswers` is empty
 * because the MC/TF fallback is fine for flow-only assertions.
 *
 * Encounter order recap (from the debug spec):
 *   exerciseIndex 0: MC    ex.u1.logaritmos.1   (fallback: first option)
 *   exerciseIndex 1: TF    ex.u1.logaritmos.11  (fallback: first radio)
 *   exerciseIndex 2: MC    ex.u1.logaritmos.2   (fallback: first option)
 *   exerciseIndex 3: MC    ex.u1.logaritmos.10  (fallback: first option)
 *   exerciseIndex 4: MC    ex.u1.logaritmos.3   (fallback: first option)
 *   exerciseIndex 5: MC    ex.u1.logaritmos.4   (fallback: first option)
 *   exerciseIndex 6: MC    ex.u1.logaritmos.5   (fallback: first option)
 *   numericalIndex 0: TEXT ex.u1.logaritmos.6   (answer: "1")
 *   numericalIndex 1: TEXT ex.u1.logaritmos.7   (answer: "1")
 *   numericalIndex 2: TEXT ex.u1.logaritmos.8   (answer: "1")
 *   numericalIndex 3: TEXT ex.u1.logaritmos.9   (answer: "1")
 */
import { expect, test } from "@playwright/test";

import { buildPracticeProgressFixture } from "../fixtures/practice-progress";
import { buildStudentProfileFixture } from "../fixtures/student-profile";
import { driveChallengeFlow, drivePracticeFlow } from "../helpers/practice-flow";
import {
  DONE_HEADER,
  FINALIZAR_BTN,
  OPT_IN_HEADING,
  READINESS_LABEL,
} from "../helpers/selectors";

test.describe("smoke: mat.u1.logaritmos (sample spec U1)", () => {
  // 11 catalog entries (6 MC + 4 numerical + 1 TF) + theory + 2 challenges
  // + opt-in + skip-path; well over Playwright's 30s default. 180s mirrors
  // PRACTICE_FLOW_TIMEOUT_MS in the helper.
  test.setTimeout(180_000);

  test("E1+E2+E3+E5: drives 11 standard exercises + opt-in + 2 challenges + readiness", async ({
    page,
    context,
  }) => {
    await context.addInitScript(
      (payload: { profile: string; practice: string }) => {
        window.localStorage.setItem("pre-utn.profiles.v1", payload.profile);
        window.localStorage.setItem("pre-utn.practice.v1", payload.practice);
      },
      {
        profile: JSON.stringify(
          buildStudentProfileFixture({ studentId: "local-e2e-log" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-log",
            skillId: "mat.u1.logaritmos",
            // Prereq bypass: logaritmos requires valor_absoluto (per
            // src/domain/models/skill-catalog.ts:110), which requires
            // intervalos. Seed above the 0.7 threshold to unlock.
            accuracyBySkill: { "mat.u1.valor_absoluto": 0.8 },
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u1.logaritmos",
      numericalAnswers: ["1", "1", "1", "1"],
      exerciseAnswers: [],
    });
    await expect(
      page.getByText(OPT_IN_HEADING),
      "ChallengeOptInBlock heading",
    ).toBeVisible();

    await driveChallengeFlow(page, {
      skillId: "mat.u1.logaritmos",
      challengeAnswers: [],
    });

    await expect(
      page.getByText(DONE_HEADER),
      "ChallengeDoneSummary header",
    ).toBeVisible();
    await expect(
      page.getByText(READINESS_LABEL),
      "Readiness score label",
    ).toBeVisible();
  });

  test("E4: skipping challenges closes opt-in without persisting attempts", async ({
    page,
    context,
  }) => {
    await context.addInitScript(
      (payload: { profile: string; practice: string }) => {
        window.localStorage.setItem("pre-utn.profiles.v1", payload.profile);
        window.localStorage.setItem("pre-utn.practice.v1", payload.practice);
      },
      {
        profile: JSON.stringify(
          buildStudentProfileFixture({ studentId: "local-e2e-log-skip" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-log-skip",
            skillId: "mat.u1.logaritmos",
            accuracyBySkill: { "mat.u1.valor_absoluto": 0.8 },
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u1.logaritmos",
      numericalAnswers: ["1", "1", "1", "1"],
      exerciseAnswers: [],
    });
    await expect(
      page.getByText(OPT_IN_HEADING),
      "ChallengeOptInBlock heading",
    ).toBeVisible();

    await page.getByRole("button", { name: FINALIZAR_BTN }).click();
    await expect(
      page.locator("#unit-select"),
      "unit select visible after skip",
    ).toBeVisible();
  });
});
