/**
 * U5-02 visible-flow smoke spec.
 *
 * Manually invoked via `pnpm test:e2e`. NOT part of the standard
 * gates (test:run / typecheck / build). Boots a production server,
 * seeds an active student, and asserts the FLOW completes for the
 * first live Unit 5 skill (mat.u5.medicion_angulos_y_arcos).
 *
 * Notes:
 *  - The structured controls (PiRationalInput / AngleDmsInput) emit
 *    canonical JSON v1 via the helper's text-input fallback. We do
 *    not assert answer correctness — only that the flow renders the
 *    Unit 5 section card, the theory, the worked examples, the seven
 *    structured/numerical exercises, and reaches the readiness score.
 *  - U5 has no prerequisite skill (the new root is normative per
 *    spec unit-5-foundation), so the accuracyBySkill map is empty.
 */
import { expect, test } from "@playwright/test";

import { buildPracticeProgressFixture } from "../fixtures/practice-progress";
import { buildStudentProfileFixture } from "../fixtures/student-profile";
import { drivePracticeFlow } from "../helpers/practice-flow";
import {
  DONE_HEADER,
  OPT_IN_HEADING,
  READINESS_LABEL,
} from "../helpers/selectors";

test.describe("smoke: mat.u5.medicion_angulos_y_arcos (first live U5 skill)", () => {
  // The driver iterates theory → example → 7 exercises (3 structured +
  // 3 pi-rational + 1 angle-dms) → feedback. U5 has no challenges yet
  // (challenges live in a separate catalog), so we drive straight to
  // the readiness verdict.
  test.setTimeout(180_000);

  test("U5 visible flow: theory + examples + 7 traced interactions reach readiness", async ({
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
          buildStudentProfileFixture({ studentId: "local-e2e-u5" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-u5",
            skillId: "mat.u5.medicion_angulos_y_arcos",
            // U5 has no prerequisite skills (normative root), so the
            // accuracyBySkill map is empty.
          }),
        ),
      },
    );

    // Drive the standard practice flow. Numerical U5 items (1c, 1d, 2r)
    // take the text-input fallback (first option) of the helper; the
    // structured controls receive the first valid canonical JSON v1
    // submission via the helper's structured fallback (not yet wired
    // for arbitrary kinds — see TODO below). The spec asserts FLOW,
    // not answer correctness.
    await drivePracticeFlow(page, {
      skillId: "mat.u5.medicion_angulos_y_arcos",
      numericalAnswers: ["135", "134.392980", "0.2"],
      exerciseAnswers: [],
    });

    // U5 has no challenges in this slice; the flow ends at the
    // opt-in block (when the catalog exposes challenges for the
    // skill) or at the readiness verdict (when it does not).
    // We accept either terminal state to keep the spec robust.
    const optIn = page.getByText(OPT_IN_HEADING);
    const done = page.getByText(DONE_HEADER);
    const readiness = page.getByText(READINESS_LABEL);
    const reachedTerminal =
      (await optIn.isVisible().catch(() => false)) ||
      (await done.isVisible().catch(() => false)) ||
      (await readiness.isVisible().catch(() => false));
    expect(reachedTerminal, "U5 flow reached a terminal readiness state").toBe(
      true,
    );
  });
});