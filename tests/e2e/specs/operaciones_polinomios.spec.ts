/**
 * PR4a sample spec for `mat.u2.operaciones_polinomios`.
 *
 * Same shape as the PR3 specs (E1+E2+E3+E5 happy path + E4 skip).
 * Prereq bypass: operaciones_polinomios requires polinomios_basico
 * (per src/domain/models/skill-catalog.ts:113), so the fixture seeds
 * `accuracyBySkill: { "mat.u2.polinomios_basico": 0.8 }` (above the
 * 0.7 threshold used by start-skill.test.ts:142).
 *
 * Encounter order (catalog = encounter, confirmed via debug spec):
 *   1/5  MC    ex.u2.operaciones_polinomios.1
 *   2/5  MC    ex.u2.operaciones_polinomios.2
 *   3/5  MC    ex.u2.operaciones_polinomios.3
 *   4/5  TEXT  ex.u2.operaciones_polinomios.4  ("Multiplicá (2x² − 1)(x + 3)")
 *   5/5  MC    ex.u2.operaciones_polinomios.5
 *
 * `numericalAnswers: ["1"]` covers the single text-form exercise at
 * encounter index 0. `exerciseAnswers: []` works for the 4 MC exercises
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

test.describe("smoke: mat.u2.operaciones_polinomios (sample spec U2)", () => {
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
          buildStudentProfileFixture({ studentId: "local-e2e-u2-operaciones-polinomios" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-u2-operaciones-polinomios",
            skillId: "mat.u2.operaciones_polinomios",
            accuracyBySkill: { "mat.u2.polinomios_basico": 0.8 },
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u2.operaciones_polinomios",
      numericalAnswers: ["1"],
      exerciseAnswers: [],
    });
    await expect(
      page.getByText(OPT_IN_HEADING),
      "ChallengeOptInBlock heading",
    ).toBeVisible();

    await driveChallengeFlow(page, {
      skillId: "mat.u2.operaciones_polinomios",
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
          buildStudentProfileFixture({ studentId: "local-e2e-u2-operaciones-polinomios-skip" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-u2-operaciones-polinomios-skip",
            skillId: "mat.u2.operaciones_polinomios",
            accuracyBySkill: { "mat.u2.polinomios_basico": 0.8 },
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u2.operaciones_polinomios",
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
