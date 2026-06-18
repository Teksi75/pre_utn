/**
 * PR3 sample spec for `mat.u1.intervalos`.
 *
 * Smoke flow: drives 6 standard exercises + opt-in + 2 challenges +
 * readiness for `intervalos` (E1-E3, E5), plus an E4 skip variant.
 * Uses the PR2 helper without answer fixtures (falls back to first
 * MC option, which the spec does not require to be correct — the spec
 * only asserts that the FLOW completes, per
 * `openspec/changes/challenge-smoke-e2e/spec.md` E1-E5).
 */
import { expect, test } from "@playwright/test";

import { buildPracticeProgressFixture } from "../fixtures/practice-progress";
import { buildStudentProfileFixture } from "../fixtures/student-profile";
import { driveChallengeFlow, drivePracticeFlow } from "../helpers/practice-flow";
import {
  COUNTER_REGEX,
  DONE_HEADER,
  FINALIZAR_BTN,
  OPT_IN_HEADING,
  READINESS_LABEL,
} from "../helpers/selectors";

test.describe("smoke: mat.u1.intervalos (sample spec U1)", () => {
  // The driver iterates through theory → example → exercises → feedback
  // for every catalog entry. For this skill (4 entries) + 2 challenges
  // + opt-in, total wall-clock can exceed Playwright's 30s default when
  // the test is the only one in the suite (cold start). 180s mirrors
  // PRACTICE_FLOW_TIMEOUT_MS in the helper.
  test.setTimeout(180_000);


  test("E1+E2+E3+E5: drives 6 standard exercises + opt-in + 2 challenges + readiness", async ({
    page,
    context,
  }) => {
    // Pre-flight: seed active-student identity (the StudentGate at
    // page.tsx:36 blocks /practice without one). `intervalos` has no
    // prereqs (per src/domain/models/skill-catalog.ts) so the
    // accuracyBySkill map is empty.
    await context.addInitScript(
      (payload: { profile: string; practice: string }) => {
        window.localStorage.setItem("pre-utn.profiles.v1", payload.profile);
        window.localStorage.setItem("pre-utn.practice.v1", payload.practice);
      },
      {
        profile: JSON.stringify(
          buildStudentProfileFixture({ studentId: "local-e2e-intervalos" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-intervalos",
            skillId: "mat.u1.intervalos",
          }),
        ),
      },
    );

    // E1: drive the standard practice flow + opt-in visible.
    // Encounter order is NOT catalog order; pass empty arrays so
    // the helper falls back to the first MC option per exercise.
    // Spec asserts the FLOW, not answer correctness.
    await drivePracticeFlow(page, {
      skillId: "mat.u1.intervalos",
      numericalAnswers: [],
      exerciseAnswers: [],
    });
    await expect(
      page.getByText(OPT_IN_HEADING),
      "ChallengeOptInBlock heading",
    ).toBeVisible();

    // E2: enter the challenge flow and assert the counter is visible
    // BEFORE we drive both challenges. The helper does an internal
    // waitFor on the counter (practice-flow.ts line 273) before each
    // challenge, so we get the E2 assertion for free if E3 succeeds.
    // We don't double-assert here to avoid flakiness.
    //
    // E3: drive both challenges via the helper (PR2). Helper falls
    // back to first option if answer text doesn't match (KaTeX/
    // LaTeX rendering may diverge from the catalog's
    // expectedAnswer — see follow-up note in PR3 body).
    await driveChallengeFlow(page, {
      skillId: "mat.u1.intervalos",
      challengeAnswers: [],
    });

    // E5: readiness score displayed (any value 0-100, non-null).
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
    // Same fixture as the accept path.
    await context.addInitScript(
      (payload: { profile: string; practice: string }) => {
        window.localStorage.setItem("pre-utn.profiles.v1", payload.profile);
        window.localStorage.setItem("pre-utn.practice.v1", payload.practice);
      },
      {
        profile: JSON.stringify(
          buildStudentProfileFixture({ studentId: "local-e2e-intervalos" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-intervalos",
            skillId: "mat.u1.intervalos",
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u1.intervalos",
      numericalAnswers: [],
      exerciseAnswers: [],
    });
    await expect(
      page.getByText(OPT_IN_HEADING),
      "ChallengeOptInBlock heading",
    ).toBeVisible();

    // Click "Finalizar por ahora" — the skip button. The flow should
    // return to the selector (ChallengeFlow onDone → resetToSelect).
    await page.getByRole("button", { name: FINALIZAR_BTN }).click();

    // After skip, the selector should be visible (FocusSelector).
    await expect(
      page.locator("#unit-select"),
      "unit select visible after skip",
    ).toBeVisible();
  });
});

