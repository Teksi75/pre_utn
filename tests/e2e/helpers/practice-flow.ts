/**
 * Practice + challenge flow drivers for the challenge-smoke E2E suite.
 * Heuristic (design.md "Practice Flow Driver"): the caller supplies one MC
 * answer label per exercise; the driver clicks the matching radio + submits.
 * Validated end-to-end by the PR2 canary, not by vitest.
 *
 * Design gap: the pseudocode uses `?skill=<id>` (auto-selects via
 * usePracticeFlow.ts:208-236 when ready) yet also describes a manual unit +
 * skill click. This driver handles both — manual selection only fires if
 * auto-select did not reach the theory phase (then `skillLabel` is required).
 */

import type { Page } from "@playwright/test";

import {
  ANSWER_FORM_MC,
  COUNTER_REGEX,
  CONTINUE_BTN,
  DONE_HEADER,
  INTENTAR_BTN,
  OPT_IN_HEADING,
  STATUS_BANNER_ROLE,
  UNIT_SELECT,
} from "./selectors";

const PRACTICE_FLOW_TIMEOUT_MS = 180_000;
const TRANSITION_SETTLE_MS = 350;

export interface DrivePracticeFlowInput {
  readonly skillId: string;
  /** Required only when the manual-selection fallback fires. */
  readonly skillLabel?: string;
  /** Answer labels per exercise, in order. Missing entries → first option. */
  readonly exerciseAnswers?: readonly string[];
}

export interface DriveChallengeFlowInput {
  readonly skillId: string;
  /** Answer labels per challenge. Defaults to the first MC option. */
  readonly challengeAnswers?: readonly string[];
}

function deriveUnitNumber(skillId: string): string {
  const match = skillId.match(/^mat\.u(\d+)\./);
  return match ? match[1] : "1";
}

async function clickIfVisible(page: Page, name: RegExp): Promise<boolean> {
  const button = page.getByRole("button", { name }).first();
  if (await button.isVisible()) {
    await button.click();
    await page.waitForTimeout(TRANSITION_SETTLE_MS);
    return true;
  }
  return false;
}

async function answerMultipleChoice(
  page: Page,
  answer: string | undefined,
): Promise<void> {
  const form = page.locator(ANSWER_FORM_MC);
  await form.waitFor({ state: "visible", timeout: 10_000 });
  if (answer) {
    // Match the enclosing <label> by text (robust vs RichText/KaTeX);
    // clicking the label toggles the radio.
    const label = form.locator("label", { hasText: answer }).first();
    if (await label.count() > 0) {
      await label.click();
    } else {
      console.warn(`[practice-flow] answer "${answer}" matched no option; picking the first.`);
      await form.getByRole("radio").first().click();
    }
  } else {
    await form.getByRole("radio").first().click();
  }
  await form.getByRole("button", { name: /Enviar respuesta/ }).click();
}

/** Drive the base practice flow for `skillId` until the challenge opt-in
 *  appears. Assumes `profiles.v1` was seeded via `addInitScript`. */
export async function drivePracticeFlow(
  page: Page,
  input: DrivePracticeFlowInput,
): Promise<void> {
  const { skillId, skillLabel, exerciseAnswers } = input;
  await page.goto(`/practice?skill=${skillId}`);

  // Post-hydration: select-phase options, or a theory/example button if
  // auto-select already fired.
  await page
    .getByRole("option")
    .first()
    .or(
      page
        .getByRole("button", { name: /Ver ejemplo resuelto|Continuar al ejemplo|Ir a ejercicios/ })
        .first(),
    )
    .waitFor({ state: "visible", timeout: 30_000 });

  if (await page.getByRole("option").first().isVisible()) {
    if (!skillLabel) {
      throw new Error(
        `drivePracticeFlow: page stayed on select for "${skillId}" (auto-select did not fire) but no skillLabel was provided.`,
      );
    }
    await page.locator(UNIT_SELECT).selectOption(deriveUnitNumber(skillId));
    await page.getByRole("option", { name: skillLabel }).first().click();
    await page.waitForTimeout(TRANSITION_SETTLE_MS);
  }

  const deadline = Date.now() + PRACTICE_FLOW_TIMEOUT_MS;
  let exerciseIndex = 0;
  while (Date.now() < deadline) {
    if (await page.getByText(OPT_IN_HEADING).first().isVisible()) return;
    if (await clickIfVisible(page, /Ver ejemplo resuelto|Continuar al ejemplo/)) continue;
    if (await clickIfVisible(page, /Ver siguiente ejemplo|Ir a ejercicios/)) continue;
    if (await page.locator(ANSWER_FORM_MC).first().isVisible()) {
      await answerMultipleChoice(page, exerciseAnswers?.[exerciseIndex]);
      exerciseIndex += 1;
      await page.waitForTimeout(TRANSITION_SETTLE_MS);
      continue;
    }
    // Feedback continue (skips "Reintentar este ejercicio").
    if (await clickIfVisible(page, /Siguiente ejercicio|Ver guía de recuperación|Volver a selección/)) continue;
    if (await clickIfVisible(page, /Intentar otro ejercicio/)) continue;
    await page.waitForTimeout(250);
  }
  throw new Error(`drivePracticeFlow: timed out before opt-in for "${skillId}".`);
}

/** Drive the challenge flow from the opt-in through all challenges to the
 *  done summary. Assumes the page is at the opt-in (practice complete). */
export async function driveChallengeFlow(
  page: Page,
  input: DriveChallengeFlowInput,
): Promise<void> {
  const { challengeAnswers } = input;
  await page.getByRole("button", { name: INTENTAR_BTN }).first().click();

  await page.getByText(COUNTER_REGEX).first().waitFor({ state: "visible", timeout: 10_000 });
  const firstCounter = (await page.getByText(COUNTER_REGEX).first().textContent()) ?? "";
  const total = firstCounter.match(/de (\d+)/) ? Number(firstCounter.match(/de (\d+)/)![1]) : 2;

  for (let i = 0; i < total; i += 1) {
    await page.getByText(COUNTER_REGEX).first().waitFor({ state: "visible", timeout: 10_000 });
    await answerMultipleChoice(page, challengeAnswers?.[i]);
    await page.getByRole(STATUS_BANNER_ROLE).first().waitFor({ state: "visible", timeout: 10_000 });
    await page.getByRole("button", { name: CONTINUE_BTN }).first().click();
    await page.waitForTimeout(TRANSITION_SETTLE_MS);
  }
  await page.getByText(DONE_HEADER).first().waitFor({ state: "visible", timeout: 15_000 });
}
