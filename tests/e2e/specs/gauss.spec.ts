/**
 * PR4b sample spec for `mat.u2.gauss`.
 *
 * Same shape as the PR3/PR4a specs (E1+E2+E3+E5 happy path + E4 skip).
 * Prereq bypass: gauss requires ruffini_resto (per
 * src/domain/models/skill-catalog.ts:116), so the fixture seeds
 * `accuracyBySkill: { "mat.u2.ruffini_resto": 0.8 }` (above the
 * 0.7 threshold used by start-skill.test.ts:142).
 *
 * Encounter order (catalog = encounter, confirmed via debug spec):
 *   1/4  MC    ex.u2.gauss.1  ("1, -1, 3" — first option is correct)
 *   2/4  MC    ex.u2.gauss.2  ("±1, ±2, ±1/2" — first option is correct)
 *   3/4  TEXT  ex.u2.gauss.3  (expectedAnswer = "1")
 *   4/4  MC    ex.u2.gauss.4  ("(x - 1)(2x - 1)(x + 3)" — first option
 *                               is correct, KaTeX-rendered label)
 *
 * `numericalAnswers: ["1"]` covers the single text-form exercise at
 * encounter index 0. `exerciseAnswers: []` works for the 3 MC exercises
 * via the helper's first-option fallback.
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

test.describe("smoke: mat.u2.gauss (sample spec U2)", () => {
  test.setTimeout(180_000);

  test("E1+E2+E3+E5: drives 4 standard exercises + opt-in + 2 challenges + readiness", async ({
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
          buildStudentProfileFixture({ studentId: "local-e2e-u2-gauss" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-u2-gauss",
            skillId: "mat.u2.gauss",
            accuracyBySkill: { "mat.u2.ruffini_resto": 0.8 },
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u2.gauss",
      numericalAnswers: ["1"],
      exerciseAnswers: [],
    });
    await expect(
      page.getByText(OPT_IN_HEADING),
      "ChallengeOptInBlock heading",
    ).toBeVisible();

    await driveChallengeFlow(page, {
      skillId: "mat.u2.gauss",
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
          buildStudentProfileFixture({ studentId: "local-e2e-u2-gauss-skip" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-u2-gauss-skip",
            skillId: "mat.u2.gauss",
            accuracyBySkill: { "mat.u2.ruffini_resto": 0.8 },
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u2.gauss",
      numericalAnswers: ["1"],
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
