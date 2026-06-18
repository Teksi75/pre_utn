/**
 * Canary spec for `mat.u1.potencias_raices`.
 *
 * Validates the `practice-flow.ts` helper end-to-end against the production
 * bundle in a real Chromium browser. Drives:
 *   - /practice?skill=mat.u1.potencias_raices deep-link
 *   - 6 standard exercises (4 numerical + 2 multiple-choice) in encounter order
 *   - Challenge opt-in via ChallengeOptInBlock
 *   - 2 challenges (Desafio 1 de 2, Desafio 2 de 2)
 *   - ChallengeDoneSummary with readiness score
 *
 * No fixture (fresh localStorage); no data-testid added; no source code
 * changes. This is the canary that surfaces real issues with the helper
 * before the 8 sample specs (PR3, PR4a, PR4b) consume it.
 *
 * Why potencias_raices: it mixes 4 numerical + 2 MC standard exercises, so
 * the canary exercises BOTH branches of `answerMultipleChoice` and
 * `answerNumerical` in `practice-flow.ts`. Switching to an all-MC skill
 * would validate only the easy path.
 */

import { expect, test } from "@playwright/test";

import { buildPracticeProgressFixture } from "../fixtures/practice-progress";
import { buildStudentProfileFixture } from "../fixtures/student-profile";
import { driveChallengeFlow, drivePracticeFlow } from "../helpers/practice-flow";
import {
  COUNTER_REGEX,
  DONE_HEADER,
  INTENTAR_BTN,
  OPT_IN_HEADING,
  READINESS_LABEL,
} from "../helpers/selectors";

test.describe("canary: mat.u1.potencias_raices (real flow, no fixture)", () => {
  test("drives 4 numerical + 2 MC standard exercises, then 2 challenges, then readiness", async ({
    page,
    context,
  }) => {
    // 1. Seed only what's needed to REACH the practice flow.
    //    We seed THREE things, but each is for a different gate:
    //
    //    a) `pre-utn.profiles.v1` — active student identity. Without this,
    //       the StudentGate at src/app/practice/page.tsx:36 blocks the page.
    //
    //    b) `pre-utn.practice.v1` with `accuracyBySkill['propiedades_operaciones_reales'] >= 0.7`.
    //       `potencias_raices` has `propiedades_operaciones_reales` as a
    //       prerequisite, and the FocusSelector renders the skill option
    //       as `aria-disabled="true"` until the prereq is met. This is
    //       a PRODUCT-LEVEL rule (analyzeRequestedSkill), not a test
    //       shortcut — the canary is not skipping the 6 standard
    //       exercises; it's unlocking the skill that contains them.
    //       The 6 standard exercises are answered for real, in order.
    //
    //    c) `pre-utn.advanced-practice.v1` is NOT seeded; it remains
    //       `{"challengeAttempts":[], "readinessBySkill":{}}` (default).
    //       The challenge flow will write to it for real.
    //
    //    The 8 sample specs in PR3/4a/4b will follow the same pattern
    //    (identity + prereq accuracy seeds) and drive the rest of the
    //    flow for real.
    await context.addInitScript(
      (payload: { profile: string; practice: string }) => {
        window.localStorage.setItem("pre-utn.profiles.v1", payload.profile);
        window.localStorage.setItem("pre-utn.practice.v1", payload.practice);
      },
      {
        profile: JSON.stringify(
          buildStudentProfileFixture({ studentId: "local-e2e-canary" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-canary",
            skillId: "mat.u1.potencias_raices",
            accuracyBySkill: {
              "mat.u1.propiedades_operaciones_reales": 0.8,
            },
          }),
        ),
      },
    );

    // 2. Standard practice: theory -> example -> 6 exercises -> feedback -> complete.
    //    Encounter order is NOT catalog order. The flow presents exercises
    //    in the order returned by `queryBySkill(skillId)`, which for
    //    `potencias_raices` is: 2, 5, 1, 3, 4, 6 (verified empirically
    //    with `tests/e2e/specs/_debug_dump.spec.ts` debug v3, commit
    //    immediately before this canary landed). Each entry's correct
    //    answer comes from `content/matematica/exercises/unit-1.json`.
    //
    //    Encoded as:
    //      text-form exercises in encounter order: 2, 1, 3, 4 (answers 8, 7, 9, 128)
    //      mc-form exercises in encounter order:    5, 6 (answers "1", "No tiene resultado real")
    //
    //    `skillLabel` is passed because... (kept from earlier draft, no
    //    longer strictly required since the auto-select now fires
    //    reliably, but it's a safety net if the auto-select regresses).
    await drivePracticeFlow(page, {
      skillId: "mat.u1.potencias_raices",
      skillLabel: "Potencias Raices",
      numericalAnswers: ["8", "7", "9", "128"],
      exerciseAnswers: ["1", "No tiene resultado real"],
    });

    // 2. Opt-in visible (assertion, not action — the click is inside
    //    driveChallengeFlow, which is responsible for entering the
    //    challenge flow). Asserting here ensures we don't race past the
    //    opt-in rendering.
    await expect(
      page.getByText(OPT_IN_HEADING),
      "ChallengeOptInBlock heading",
    ).toBeVisible();

    // 3. Enter challenge flow AND drive both challenges. The helper
    //    clicks "Intentar desafíos" once and walks through the 2
    //    challenges. We deliberately do NOT click "Intentar desafíos"
    //    here because that click triggers an immediate re-render that
    //    unmounts the button before Playwright can finish; the helper
    //    handles the click with proper waitFor timing.
    //
    //    The two desafios for potencias_raices (desafio-01, desafio-02)
    //    are both multiple-choice with LaTeX options. The correct
    //    options are $-16$ and $a^{5/6}$ respectively.
    await driveChallengeFlow(page, {
      skillId: "mat.u1.potencias_raices",
      challengeAnswers: ["$-16$", "$a^{5/6}$"],
    });

    // 4. Done summary + readiness score
    await expect(
      page.getByText(DONE_HEADER),
      "ChallengeDoneSummary header",
    ).toBeVisible();
    await expect(
      page.getByText(READINESS_LABEL),
      "Readiness score label",
    ).toBeVisible();
  });
});
