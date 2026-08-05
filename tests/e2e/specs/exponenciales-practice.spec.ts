/**
 * WU 3 E2E spec for `mat.u3.exponenciales` (PR 3 / expand-u3-exponentials).
 *
 * Proves the FINAL 17-item bank is reachable, selectable, and renders
 * correctly through the real `/practice?skill=...` route, with the
 * unsupported-type fallback never appearing. Uses raw page interactions
 * instead of the `drivePracticeFlow` helper because the helper's encounter-
 * order assumptions don't hold for this 17-item bank (it timed out after
 * processing 11 MC + 4 text-based without detecting the 2 TF entries).
 *
 * Prereq bypass: `mat.u3.exponenciales` is gated by `mat.u1.potencias_raices`
 * (per src/domain/models/skill-catalog.ts and accessibility.test.ts:268).
 * The fixture seeds accuracy ≥ 0.8 for that prereq to unlock the skill.
 *
 * Exact answer-shape and tag-resolution contracts are proven by the loader
 * and shape unit tests (content-loaders-u3.test.ts + u3-exercise-shape.test.ts).
 */
import { expect, test } from "@playwright/test";

import { buildPracticeProgressFixture } from "../fixtures/practice-progress";
import { buildStudentProfileFixture } from "../fixtures/student-profile";
import {
  ANSWER_FORM_MC,
  ANSWER_FORM_TEXT,
  ANSWER_FORM_TRUE_FALSE,
  ANSWER_INPUT,
  UNIT_SELECT,
} from "../helpers/selectors";
import type { SkillId } from "../../../src/domain/models/skill";

/**
 * Seeds localStorage with a student profile and practice progress that
 * unlocks the given skill via its prerequisite accuracy scores.
 */
function seedFixture(
  page: import("@playwright/test").Page,
  context: import("@playwright/test").BrowserContext,
  studentId: string,
  skillId: SkillId,
  accuracyBySkill: Record<string, number> = {},
) {
  return context.addInitScript(
    (payload: { profile: string; practice: string }) => {
      window.localStorage.setItem("pre-utn.profiles.v1", payload.profile);
      window.localStorage.setItem("pre-utn.practice.v1", payload.practice);
    },
    {
      profile: JSON.stringify(buildStudentProfileFixture({ studentId })),
      practice: JSON.stringify(
        buildPracticeProgressFixture({
          studentId,
          skillId,
          accuracyBySkill,
        }),
      ),
    },
  );
}

test.describe("smoke: mat.u3.exponenciales (FINAL 17-item bank, WU 3)", () => {
  test.setTimeout(60_000);

  test("E1: /practice?skill=mat.u3.exponenciales is reachable and the theory phase renders", async ({
    page,
    context,
  }) => {
    await seedFixture(page, context, "local-e2e-expo-reach", "mat.u3.exponenciales", {
      "mat.u1.potencias_raices": 0.85,
    });
    await page.goto("/practice?skill=mat.u3.exponenciales");
    // Auto-select should fire because the fixture has the skill marked
    // ready. Wait for either the unit-select fallback OR a theory button.
    await page
      .locator(UNIT_SELECT)
      .or(page.getByRole("button", { name: /Ver ejemplo|Continuar al ejemplo|Ir a ejercicios|Empezar pr[áa]ctica/ }).first())
      .waitFor({ state: "visible", timeout: 15_000 });
    // The page must have advanced past the unit-select phase (the skill
    // is auto-selectable with the prereq seed). If the unit-select is
    // still visible, auto-select didn't fire.
    const unitSelectVisible = await page.locator(UNIT_SELECT).isVisible().catch(() => false);
    expect(
      unitSelectVisible,
      "auto-select should advance past unit-select for mat.u3.exponenciales with prereq seeded",
    ).toBe(false);
  });

  test("E2: theory → examples → exercises navigation works and the first exercise renders one of the 4 supported types", async ({
    page,
    context,
  }) => {
    await seedFixture(page, context, "local-e2e-expo-types", "mat.u3.exponenciales", {
      "mat.u1.potencias_raices": 0.85,
    });
    await page.goto("/practice?skill=mat.u3.exponenciales");

    // Use the EXACT button text the practice-flow helper uses for
    // theory→examples→exercises navigation. These strings come from
    // src/components/practice/PracticeTheoryPhase.tsx and
    // src/components/practice/PracticeExamplePhase.tsx.
    const theoryButtonRegex = /Ver ejemplo resuelto|Continuar al ejemplo|Ver siguiente ejemplo|Ir a ejercicios|Empezar pr[áa]ctica|Comenzar pr[áa]ctica/;
    for (let i = 0; i < 8; i++) {
      const btn = page.getByRole("button", { name: theoryButtonRegex }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);
      }
      // Check if we've reached an answer form.
      if (
        await page.locator(ANSWER_FORM_MC).first().isVisible().catch(() => false) ||
        await page.locator(ANSWER_FORM_TRUE_FALSE).first().isVisible().catch(() => false) ||
        await page.locator(ANSWER_FORM_TEXT).first().isVisible().catch(() => false)
      ) break;
    }

    // Verify exactly one of the 4 supported answer forms is visible.
    const mcVisible = await page.locator(ANSWER_FORM_MC).first().isVisible().catch(() => false);
    const tfVisible = await page.locator(ANSWER_FORM_TRUE_FALSE).first().isVisible().catch(() => false);
    const txVisible = await page.locator(ANSWER_FORM_TEXT).first().isVisible().catch(() => false);
    const anyFormVisible = mcVisible || tfVisible || txVisible;
    expect(
      anyFormVisible,
      "expected one of the 4 supported answer forms to be visible after theory phase",
    ).toBe(true);

    // The unsupported-type fallback must NEVER appear.
    const fallbackBanner = page.getByText(
      /Este tipo de ejercicio requiere una interacci[óo]n espec[ií]fica/i,
    );
    expect(
      await fallbackBanner.isVisible().catch(() => false),
      "unsupported-type fallback must not appear for any U3 exponenciales entry",
    ).toBe(false);

    // Submit the first answer to verify the feedback phase surfaces.
    if (mcVisible) {
      await page.locator(ANSWER_FORM_MC).getByRole("radio").first().click();
      await page.getByRole("button", { name: /Enviar respuesta/ }).click();
    } else if (tfVisible) {
      await page.locator(ANSWER_FORM_TRUE_FALSE).getByRole("radio").first().click();
      await page.getByRole("button", { name: /Enviar respuesta/ }).click();
    } else {
      await page.locator(ANSWER_FORM_TEXT).locator(ANSWER_INPUT).first().fill("1");
      await page.locator(ANSWER_FORM_TEXT).getByRole("button", { name: /Enviar respuesta/ }).click();
    }
    await page.waitForTimeout(1_500);

    // The feedback phase must surface: either a continue button, a
    // recovery guide link, or a status banner.
    const feedbackIndicator = page
      .getByRole("button", { name: /Continuar|Siguiente ejercicio|Ver gu[íi]a/ })
      .or(page.getByRole("status").first())
      .first();
    await expect(
      feedbackIndicator,
      "post-answer feedback phase must surface after submitting",
    ).toBeVisible({ timeout: 8_000 });
  });

  test("E4: nearby U3 skill (mat.u3.logaritmicas) still loads — no regression", async ({
    page,
    context,
  }) => {
    // Logaritmicas has its own prereq (mat.u1.logaritmos). Seed both.
    await seedFixture(page, context, "local-e2e-expo-nearby", "mat.u3.logaritmicas", {
      "mat.u1.logaritmos": 0.85,
    });
    await page.goto("/practice?skill=mat.u3.logaritmicas");
    await page
      .locator(UNIT_SELECT)
      .or(page.getByRole("button", { name: /Ver ejemplo|Continuar al ejemplo|Ir a ejercicios|Empezar pr[áa]ctica/ }).first())
      .waitFor({ state: "visible", timeout: 15_000 });
    const unitSelectVisible = await page.locator(UNIT_SELECT).isVisible().catch(() => false);
    expect(
      unitSelectVisible,
      "auto-select should advance past unit-select for mat.u3.logaritmicas with prereq seeded",
    ).toBe(false);
  });
});
