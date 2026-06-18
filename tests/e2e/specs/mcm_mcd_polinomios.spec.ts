/**
 * PR4b sample spec for `mat.u2.mcm_mcd_polinomios`.
 *
 * Same shape as the PR3/PR4a specs (E1+E2+E3+E5 happy path + E4 skip).
 * Prereq bypass: mcm_mcd_polinomios requires factorizacion (per
 * src/domain/models/skill-catalog.ts:117), so the fixture seeds
 * `accuracyBySkill: { "mat.u2.factorizacion": 0.8 }` (above the
 * 0.7 threshold used by start-skill.test.ts:142).
 *
 * Encounter order (catalog = encounter, confirmed via debug spec):
 *   1/4  MC    ex.u2.mcm_mcd_polinomios.1  (expectedAnswer = "x(x-2)(x+3)"
 *                                            — first option "x" is INCORRECT,
 *                                            so exerciseAnswers[0] supplies
 *                                            the correct label to avoid the
 *                                            recovery-loop timeout)
 *   2/4  MC    ex.u2.mcm_mcd_polinomios.2  ("(x-1)" — first option is correct)
 *   3/4  MC    ex.u2.mcm_mcd_polinomios.3  ("x(x-2)(x+2)" — first option
 *                                            is correct)
 *   4/4  MC    ex.u2.mcm_mcd_polinomios.4  ("x^3 - 4x^2 + x + 6" — first
 *                                            option is correct, KaTeX label)
 *
 * `numericalAnswers: []` (no text-form exercises).
 * `exerciseAnswers: ["x(x-2)(x+3)"]` — the helper matches by label hasText
 * substring, and the plain string option renders as <span>x(x-2)(x+3)</span>
 * (no $ delimiters → not parsed as math). exerciseIndex 1–3 fall through to
 * the first-option fallback.
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

test.describe("smoke: mat.u2.mcm_mcd_polinomios (sample spec U2)", () => {
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
          buildStudentProfileFixture({ studentId: "local-e2e-u2-mcm-mcd-polinomios" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-u2-mcm-mcd-polinomios",
            skillId: "mat.u2.mcm_mcd_polinomios",
            accuracyBySkill: { "mat.u2.factorizacion": 0.8 },
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u2.mcm_mcd_polinomios",
      numericalAnswers: [],
      exerciseAnswers: ["x(x-2)(x+3)"],
    });
    await expect(
      page.getByText(OPT_IN_HEADING),
      "ChallengeOptInBlock heading",
    ).toBeVisible();

    await driveChallengeFlow(page, {
      skillId: "mat.u2.mcm_mcd_polinomios",
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
          buildStudentProfileFixture({ studentId: "local-e2e-u2-mcm-mcd-polinomios-skip" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-u2-mcm-mcd-polinomios-skip",
            skillId: "mat.u2.mcm_mcd_polinomios",
            accuracyBySkill: { "mat.u2.factorizacion": 0.8 },
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u2.mcm_mcd_polinomios",
      numericalAnswers: [],
      exerciseAnswers: ["x(x-2)(x+3)"],
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
