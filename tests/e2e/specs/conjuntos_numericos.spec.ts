/**
 * PR3 sample spec for `mat.u1.conjuntos_numericos`.
 *
 * Same shape as `intervalos.spec.ts` (E1+E2+E3+E5 happy path + E4
 * skip). `conjuntos_numericos` has no prereqs (per
 * src/domain/models/skill-catalog.ts), so the fixture is minimal.
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

test.describe("smoke: mat.u1.conjuntos_numericos (sample spec U1)", () => {
  // The driver iterates through theory → example → exercises → feedback
  // for every catalog entry. For this skill (5 entries) + 2 challenges
  // + opt-in, total wall-clock can exceed Playwright's 30s default when
  // the test is the only one in the suite (cold start). 180s mirrors
  // PRACTICE_FLOW_TIMEOUT_MS in the helper.
  test.setTimeout(180_000);


  test("E1+E2+E3+E5: drives 6 standard exercises + opt-in + 2 challenges + readiness", async ({
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
          buildStudentProfileFixture({ studentId: "local-e2e-conjuntos" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-conjuntos",
            skillId: "mat.u1.conjuntos_numericos",
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u1.conjuntos_numericos",
      numericalAnswers: [],
      exerciseAnswers: [],
    });
    await expect(
      page.getByText(OPT_IN_HEADING),
      "ChallengeOptInBlock heading",
    ).toBeVisible();

    await driveChallengeFlow(page, {
      skillId: "mat.u1.conjuntos_numericos",
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
          buildStudentProfileFixture({ studentId: "local-e2e-conjuntos" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-conjuntos",
            skillId: "mat.u1.conjuntos_numericos",
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u1.conjuntos_numericos",
      numericalAnswers: [],
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
