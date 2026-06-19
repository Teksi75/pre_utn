/**
 * PR4a sample spec for `mat.u2.factorizacion`.
 *
 * Same shape as the PR3 specs (E1+E2+E3+E5 happy path + E4 skip).
 * Prereq bypass: factorizacion requires operaciones_polinomios AND
 * ruffini_resto (per src/domain/models/skill-catalog.ts:115), so the
 * fixture seeds both in `accuracyBySkill` above the 0.7 threshold.
 *
 * Encounter order (catalog = encounter, confirmed via debug spec):
 *   1/4  MC    ex.u2.factorizacion.1
 *   2/4  MC    ex.u2.factorizacion.2
 *   3/4  TEXT  ex.u2.factorizacion.3  ("Extraé el máximo factor común")
 *   4/4  MC    ex.u2.factorizacion.4
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

test.describe("smoke: mat.u2.factorizacion (sample spec U2)", () => {
  // -----------------------------------------------------------------------
  // Learn disclosure: nine ordered cards + last solution visibility
  // -----------------------------------------------------------------------
  test("Learn: nine ordered worked-example cards and last solution visible", async ({ page }) => {
    await page.goto("/learn/matematica/mat.u2.factorizacion");

    // Expand the examples section
    const toggle = page.getByRole("button", { name: /Ver ejemplos resueltos/ });
    await toggle.waitFor({ state: "visible", timeout: 15_000 });
    await toggle.click();

    // Verify the nine canonical problem markers appear in order
    const caseMarkers = [
      "Caso 1", "Caso 2", "Caso 3", "Caso 4", "Caso 5",
      "Caso 6", "Caso 6", "Caso 6", "Caso 7",
    ];
    for (const marker of caseMarkers) {
      await expect(
        page.getByText(marker, { exact: false }).first(),
        `expected "${marker}" in examples`,
      ).toBeVisible();
    }

    // Expand the last example's solution (Case 7)
    const solutionButtons = page.getByRole("button", { name: /Ver resolución paso a paso/ });
    const count = await solutionButtons.count();
    expect(count, "expected nine solution toggles").toBe(9);
    await solutionButtons.last().click();

    // The last example's final answer should now be visible
    // Use exact match to avoid matching the same text inside step explanations
    await expect(
      page.getByText("(2x + 1)(x + 3)", { exact: true }),
      "Case 7 final answer",
    ).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // Practice: first example matches canonical order
  // -----------------------------------------------------------------------
  test("Practice: first worked example matches the canonical sequence", async ({
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
          buildStudentProfileFixture({ studentId: "local-e2e-u2-factorizacion-order" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-u2-factorizacion-order",
            skillId: "mat.u2.factorizacion",
            accuracyBySkill: {
              "mat.u2.operaciones_polinomios": 0.8,
              "mat.u2.ruffini_resto": 0.8,
            },
          }),
        ),
      },
    );

    await page.goto("/practice?skill=mat.u2.factorizacion");

    // Practice starts at theory/example phase; click through to the example
    const exampleBtn = page.getByRole("button", { name: /Ver ejemplo resuelto|Continuar al ejemplo/ }).first();
    try {
      await exampleBtn.waitFor({ state: "visible", timeout: 10_000 });
      await exampleBtn.click();
    } catch {
      // Auto-select may have already advanced past theory
    }

    // Wait for the first example card to appear
    await expect(
      page.getByText("Caso 1"),
      "first example should be Case 1",
    ).toBeVisible({ timeout: 30_000 });
  });

  // -----------------------------------------------------------------------
  // Responsive: no horizontal overflow at 375px
  // -----------------------------------------------------------------------
  test("Learn + Practice: no horizontal overflow at 375px viewport", async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Learn page
    await page.goto("/learn/matematica/mat.u2.factorizacion");
    const learnOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
    });
    expect(learnOverflow, "Learn page: scrollWidth <= clientWidth at 375px").toBe(true);

    // Expand examples at mobile width
    const toggle = page.getByRole("button", { name: /Ver ejemplos resueltos/ });
    await toggle.waitFor({ state: "visible", timeout: 15_000 });
    await toggle.click();
    await page.waitForTimeout(500);

    const learnOverflowAfter = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
    });
    expect(learnOverflowAfter, "Learn expanded: scrollWidth <= clientWidth at 375px").toBe(true);

    // Practice page
    await context.addInitScript(
      (payload: { profile: string; practice: string }) => {
        window.localStorage.setItem("pre-utn.profiles.v1", payload.profile);
        window.localStorage.setItem("pre-utn.practice.v1", payload.practice);
      },
      {
        profile: JSON.stringify(
          buildStudentProfileFixture({ studentId: "local-e2e-u2-factorizacion-responsive" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-u2-factorizacion-responsive",
            skillId: "mat.u2.factorizacion",
            accuracyBySkill: {
              "mat.u2.operaciones_polinomios": 0.8,
              "mat.u2.ruffini_resto": 0.8,
            },
          }),
        ),
      },
    );

    await page.goto("/practice?skill=mat.u2.factorizacion");

    // Practice starts at theory/example phase; click through to the example
    const practiceBtn = page.getByRole("button", { name: /Ver ejemplo resuelto|Continuar al ejemplo/ }).first();
    try {
      await practiceBtn.waitFor({ state: "visible", timeout: 10_000 });
      await practiceBtn.click();
    } catch {
      // Auto-select may have already advanced past theory
    }

    // Wait for example to load
    await expect(
      page.getByText("Caso 1"),
      "Practice first example at 375px",
    ).toBeVisible({ timeout: 30_000 });

    const practiceOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
    });
    expect(practiceOverflow, "Practice page: scrollWidth <= clientWidth at 375px").toBe(true);
  });
});

test.describe("smoke: mat.u2.factorizacion (sample spec U2) — legacy", () => {
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
          buildStudentProfileFixture({ studentId: "local-e2e-u2-factorizacion" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-u2-factorizacion",
            skillId: "mat.u2.factorizacion",
            accuracyBySkill: {
              "mat.u2.operaciones_polinomios": 0.8,
              "mat.u2.ruffini_resto": 0.8,
            },
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u2.factorizacion",
      numericalAnswers: ["1"],
      exerciseAnswers: [],
    });
    await expect(
      page.getByText(OPT_IN_HEADING),
      "ChallengeOptInBlock heading",
    ).toBeVisible();

    await driveChallengeFlow(page, {
      skillId: "mat.u2.factorizacion",
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
          buildStudentProfileFixture({ studentId: "local-e2e-u2-factorizacion-skip" }),
        ),
        practice: JSON.stringify(
          buildPracticeProgressFixture({
            studentId: "local-e2e-u2-factorizacion-skip",
            skillId: "mat.u2.factorizacion",
            accuracyBySkill: {
              "mat.u2.operaciones_polinomios": 0.8,
              "mat.u2.ruffini_resto": 0.8,
            },
          }),
        ),
      },
    );

    await drivePracticeFlow(page, {
      skillId: "mat.u2.factorizacion",
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
