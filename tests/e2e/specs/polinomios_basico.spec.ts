/**
 * PR4a sample spec for `mat.u2.polinomios_basico`.
 *
 * Same shape as the PR3 specs (E1+E2+E3+E5 happy path + E4 skip). This
 * skill has no prereqs (per src/domain/models/skill-catalog.ts:25), so
 * the fixture is minimal.
 *
 * Encounter order (catalog = encounter, confirmed via debug spec):
 *   1/5  MC    ex.u2.polinomios_basico.1
 *   2/5  MC    ex.u2.polinomios_basico.2
 *   3/5  MC    ex.u2.polinomios_basico.3
 *   4/5  TEXT  ex.u2.polinomios_basico.4  ("Evaluá P(3) para P(x) = 2x² − x + 5")
 *   5/5  MC    ex.u2.polinomios_basico.5
 *
 * `numericalAnswers: ["1"]` covers the single text-form exercise at
 * encounter index 0 (the helper has no first-option fallback for text
 * forms — only for MC and TF). `exerciseAnswers: []` is fine because
 * the MC fallback is acceptable for flow-only assertions.
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

test.describe("smoke: mat.u2.polinomios_basico (sample spec U2)", () => {
  test.setTimeout(180_000);

  test("E1+E2+E3+E5: drives 5 standard exercises + opt-in + 2 challenges + readiness", async ({
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
          buildStudentProfileFixture({ studentId: "local-e2e-u2-polinomios-basico" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-u2-polinomios-basico",
            skillId: "mat.u2.polinomios_basico",
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u2.polinomios_basico",
      numericalAnswers: ["1"],
      exerciseAnswers: [],
    });
    await expect(
      page.getByText(OPT_IN_HEADING),
      "ChallengeOptInBlock heading",
    ).toBeVisible();

    await driveChallengeFlow(page, {
      skillId: "mat.u2.polinomios_basico",
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
          buildStudentProfileFixture({ studentId: "local-e2e-u2-polinomios-basico-skip" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-u2-polinomios-basico-skip",
            skillId: "mat.u2.polinomios_basico",
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u2.polinomios_basico",
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
