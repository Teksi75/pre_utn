/**
 * Practice + challenge flow drivers for the challenge-smoke E2E suite.
 * Heuristic (design.md "Practice Flow Driver"): the caller supplies one
 * answer per exercise in encounter order. The driver detects the answer
 * form type (multiple-choice or text-based for numerical/fill-blank) and
 * routes to the appropriate responder.
 * Validated end-to-end by the PR2 canary, not by vitest.
 *
 * Design gap (PR1b): the original driver only handled multiple-choice.
 * PR2 extended it to handle text-based (numerical) exercises because
 * `mat.u1.potencias_raices` mixes 4 numerical + 2 MC standard exercises.
 *
 * Design gap: the pseudocode uses `?skill=<id>` (auto-selects via
 * usePracticeFlow.ts:208-236 when ready) yet also describes a manual unit +
 * skill click. This driver handles both — manual selection only fires if
 * auto-select did not reach the theory phase (then `skillLabel` is required).
 *
 * Observability (PR2): every submit verifies that the active student's
 * `attempts.length` increased in `localStorage["pre-utn.practice.v1"]`
 * after a 1.5s settle (the 300ms evaluateAnswer setTimeout +
 * usePracticeFlow state update + React re-render). If the count did not
 * increase, the helper dumps the full localStorage state and a DOM
 * snippet, then throws — no silent 180s wait. This is the only way to
 * know whether the submit was accepted by the flow at all.
 */

import type { Page } from "@playwright/test";

import {
  ANSWER_FORM_MC,
  ANSWER_FORM_TEXT,
  ANSWER_FORM_TRUE_FALSE,
  ANSWER_INPUT,
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
const SUBMIT_SETTLE_MS = 1_500;

interface FixtureState {
  readonly hasProfiles: boolean;
  readonly hasPractice: boolean;
  readonly hasAdvanced: boolean;
  readonly profilesActiveId: string | null;
  readonly practiceActiveId: string | null;
  readonly practiceStudentIds: readonly string[];
  readonly activeAttempts: number;
}

interface DebugSnapshot {
  readonly url: string;
  readonly practiceRaw: string | null;
  readonly profilesRaw: string | null;
  readonly advancedRaw: string | null;
  readonly mainTextPreview: string;
}

async function readFixtureState(page: Page): Promise<FixtureState> {
  return page.evaluate(() => {
    const safeParse = (raw: string | null) => {
      if (!raw) return null;
      try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
    };
    const profiles = safeParse(localStorage.getItem("pre-utn.profiles.v1"));
    const practice = safeParse(localStorage.getItem("pre-utn.practice.v1"));
    const advanced = safeParse(localStorage.getItem("pre-utn.advanced-practice.v1"));
    const activePracticeId = (practice?.["activeStudentId"] as string | null) ?? null;
    const students = (practice?.["students"] as Record<string, { attempts?: unknown[] }> | undefined) ?? {};
    const activeSlice = activePracticeId ? students[activePracticeId] : undefined;
    return {
      hasProfiles: profiles !== null,
      hasPractice: practice !== null,
      hasAdvanced: advanced !== null,
      profilesActiveId: (profiles?.["activeStudentId"] as string | null) ?? null,
      practiceActiveId: activePracticeId,
      practiceStudentIds: Object.keys(students),
      activeAttempts: Array.isArray(activeSlice?.["attempts"]) ? activeSlice!.attempts!.length : -1,
    };
  });
}

interface AdvancedState {
  readonly hasAdvanced: boolean;
  readonly challengeAttempts: number;
}

async function readAdvancedState(page: Page): Promise<AdvancedState> {
  return page.evaluate(() => {
    const raw = localStorage.getItem("pre-utn.advanced-practice.v1");
    if (!raw) return { hasAdvanced: false, challengeAttempts: -1 };
    try {
      const parsed = JSON.parse(raw) as { challengeAttempts?: unknown[] };
      return {
        hasAdvanced: true,
        challengeAttempts: Array.isArray(parsed.challengeAttempts) ? parsed.challengeAttempts.length : -1,
      };
    } catch {
      return { hasAdvanced: false, challengeAttempts: -1 };
    }
  });
}

async function readDebugSnapshot(page: Page): Promise<DebugSnapshot> {
  return page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      url: window.location.href,
      practiceRaw: localStorage.getItem("pre-utn.practice.v1"),
      profilesRaw: localStorage.getItem("pre-utn.profiles.v1"),
      advancedRaw: localStorage.getItem("pre-utn.advanced-practice.v1"),
      mainTextPreview: (main?.textContent ?? "").slice(0, 240),
    };
  });
}

export interface DrivePracticeFlowInput {
  readonly skillId: string;
  /** Required only when the manual-selection fallback fires. */
  readonly skillLabel?: string;
  /**
   * Answer labels per MC exercise, in encounter order (NOT catalog order).
   * The driver tracks the index of MC exercises it has answered and pulls
   * the next entry from this array. Missing entries → first option.
   */
  readonly exerciseAnswers?: readonly string[];
  /**
   * Answer strings per numerical (or other text-based) exercise, in
   * encounter order. The driver tracks the index of text-based exercises
   * it has answered and pulls the next entry from this array. Missing
   * entries → fail fast with a clear error (no silent 180s timeout).
   */
  readonly numericalAnswers?: readonly string[];
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
  // Scope to <main> so we don't accidentally click header buttons like
  // "← Volver a selección" (which would match the regex's "Volver a
  // selección" branch and reset the flow to the select phase).
  const main = page.locator("main");
  const button = main.getByRole("button", { name }).first();
  if (await button.isVisible().catch(() => false)) {
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
  const before = await readFixtureState(page);
  await form.getByRole("button", { name: /Enviar respuesta/ }).click();
  await page.waitForTimeout(SUBMIT_SETTLE_MS);
  const after = await readFixtureState(page);
  if (after.activeAttempts <= before.activeAttempts) {
    const debug = await readDebugSnapshot(page);
    throw new Error(
      `answerMultipleChoice: submit did not register an attempt. beforeAttempts=${before.activeAttempts}, afterAttempts=${after.activeAttempts}, practiceActiveId=${after.practiceActiveId}, url=${debug.url}, mainTextPreview=${JSON.stringify(debug.mainTextPreview)}`,
    );
  }
}

async function answerNumerical(
  page: Page,
  answer: string,
  ordinal: number,
): Promise<void> {
  const form = page.locator(ANSWER_FORM_TEXT);
  await form.waitFor({ state: "visible", timeout: 10_000 });
  // Use `pressSequentially` over `fill` because the input is React-controlled
  // (`value={answer}` + `onChange`) and the React onChange handler must fire
  // to update internal state and unblock the "Enviar respuesta" button
  // (which stays `disabled` while `canSubmit === false`, i.e. while
  // `answer.trim() === ""`). `pressSequentially` types character-by-
  // character and triggers the native input event that React listens to.
  const input = form.locator(ANSWER_INPUT).first();
  await input.click();
  await input.pressSequentially(answer, { delay: 20 });
  // The submit button is "Enviar respuesta". It is disabled while
  // `canSubmit === false` (i.e. while `answer.trim() === ""`). After
  // the last keystroke, React re-renders and the button becomes enabled.
  // The click below will fail (actionability timeout) if the button is
  // still disabled, which is the right signal — fail fast.
  const submitButton = form.getByRole("button", { name: /Enviar respuesta/ });
  await submitButton.click();
  await page.waitForTimeout(SUBMIT_SETTLE_MS);
  // Verify the attempt registered. If not, fail fast with full state.
  const after = await readFixtureState(page);
  if (after.activeAttempts <= ordinal) {
    const debug = await readDebugSnapshot(page);
    throw new Error(
      `answerNumerical: submit did not register an attempt for exercise #${ordinal} (expected attempts > ${ordinal}). activeAttempts=${after.activeAttempts}, practiceActiveId=${after.practiceActiveId}, url=${debug.url}, mainTextPreview=${JSON.stringify(debug.mainTextPreview)}`,
    );
  }
}

async function answerTrueFalse(
  page: Page,
  answer: "Verdadero" | "Falso" | undefined,
  ordinal: number,
): Promise<void> {
  const form = page.locator(ANSWER_FORM_TRUE_FALSE);
  await form.waitFor({ state: "visible", timeout: 10_000 });
  // True/false form renders two radios named "Verdadero" / "Falso"
  // (per src/components/exercises/ExerciseAnswerInput.tsx:220-235). If the
  // caller passed a specific answer, click that one. Otherwise fall back
  // to the first radio (Verdadero). The spec only asserts FLOW, not
  // correctness, so the fallback is acceptable.
  if (answer === "Verdadero" || answer === "Falso") {
    const radio = form.getByRole("radio", { name: new RegExp(`^${answer}$`) });
    await radio.click();
  } else {
    await form.getByRole("radio").first().click();
  }
  const submitButton = form.getByRole("button", { name: /Enviar respuesta/ });
  await submitButton.click();
  await page.waitForTimeout(SUBMIT_SETTLE_MS);
  // Verify the attempt registered. If not, fail fast with full state.
  const after = await readFixtureState(page);
  if (after.activeAttempts <= ordinal) {
    const debug = await readDebugSnapshot(page);
    throw new Error(
      `answerTrueFalse: submit did not register an attempt for exercise #${ordinal} (expected attempts > ${ordinal}). activeAttempts=${after.activeAttempts}, practiceActiveId=${after.practiceActiveId}, url=${debug.url}, mainTextPreview=${JSON.stringify(debug.mainTextPreview)}`,
    );
  }
}

/** Drive the base practice flow for `skillId` until the challenge opt-in
 *  appears. Assumes `profiles.v1` was seeded via `addInitScript`. */
export async function drivePracticeFlow(
  page: Page,
  input: DrivePracticeFlowInput,
): Promise<void> {
  const { skillId, skillLabel, exerciseAnswers, numericalAnswers } = input;

  await page.goto(`/practice?skill=${skillId}`);

  // Pre-flight (post-navigation): confirm addInitScript seeded the right
  // keys and that activeStudentId of profiles.v1 matches practice.v1.
  // Must run AFTER goto (localStorage is not accessible on about:blank).
  const preFlight = await readFixtureState(page);
  if (!preFlight.hasProfiles || !preFlight.hasPractice) {
    throw new Error(
      `drivePracticeFlow: addInitScript missing keys. hasProfiles=${preFlight.hasProfiles}, hasPractice=${preFlight.hasPractice}. The canary must seed pre-utn.profiles.v1 AND pre-utn.practice.v1 BEFORE navigation.`,
    );
  }
  if (
    preFlight.profilesActiveId === null ||
    preFlight.practiceActiveId === null ||
    preFlight.profilesActiveId !== preFlight.practiceActiveId
  ) {
    throw new Error(
      `drivePracticeFlow: fixture activeStudentId mismatch. profiles.activeStudentId=${preFlight.profilesActiveId}, practice.activeStudentId=${preFlight.practiceActiveId}. They must match.`,
    );
  }
  if (preFlight.activeAttempts < 0) {
    throw new Error(
      `drivePracticeFlow: practice.v1 is malformed — no attempts array on the active student slice. State=${JSON.stringify(preFlight)}`,
    );
  }

  // Post-hydration: either the FocusSelector's <select id="unit-select">
  // (auto-select did not fire — we need to select manually) OR a
  // theory/example button (auto-select already fired and we're past the
  // select phase). We deliberately do NOT wait on `getByRole("option")`
  // because Playwright considers <option> children of <select> as "hidden"
  // even when the <select> itself is visible — the check would always
  // time out. We wait on the <select> directly.
  await page
    .locator(UNIT_SELECT)
    .or(
      page
        .getByRole("button", { name: /Ver ejemplo resuelto|Continuar al ejemplo|Ir a ejercicios/ })
        .first(),
    )
    .waitFor({ state: "visible", timeout: 30_000 });

  if (await page.locator(UNIT_SELECT).isVisible()) {
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
  let exerciseIndex = 0; // MC exercise index
  let numericalIndex = 0; // numerical (text-based) exercise index
  let stuckSince = 0; // iteration counter for stuck-state diagnostic
  while (Date.now() < deadline) {
    if (await page.getByText(OPT_IN_HEADING).first().isVisible()) return;
    if (await clickIfVisible(page, /Ver ejemplo resuelto|Continuar al ejemplo/)) { stuckSince = 0; continue; }
    if (await clickIfVisible(page, /Ver siguiente ejemplo|Ir a ejercicios/)) { stuckSince = 0; continue; }

    // Text-based (numerical) form takes priority — it appears before MC
    // in the DOM tree, and a numerical exercise must NOT be answered as MC.
    if (await page.locator(ANSWER_FORM_TEXT).first().isVisible()) {
      const answer = numericalAnswers?.[numericalIndex];
      if (answer === undefined) {
        throw new Error(
          `drivePracticeFlow: encountered a text-based (numerical) exercise at encounter index ${numericalIndex} for "${skillId}" but no numericalAnswers[${numericalIndex}] was provided. Pass the numericalAnswers array in encounter order to fix.`,
        );
      }
      await answerNumerical(page, answer, numericalIndex);
      numericalIndex += 1;
      stuckSince = 0;
      await page.waitForTimeout(TRANSITION_SETTLE_MS);
      continue;
    }

    // True/false form. Same priority as MC/text — appears standalone,
    // not nested inside the other forms. Falls back to first radio
    // (Verdadero) if no answer is supplied.
    if (await page.locator(ANSWER_FORM_TRUE_FALSE).first().isVisible()) {
      const answer = exerciseAnswers?.[exerciseIndex];
      // Allow "Verdadero" or "Falso" (with a fallback to first radio).
      const tf: "Verdadero" | "Falso" | undefined =
        answer === "Verdadero" || answer === "Falso" ? answer : undefined;
      await answerTrueFalse(page, tf, exerciseIndex);
      exerciseIndex += 1;
      stuckSince = 0;
      await page.waitForTimeout(TRANSITION_SETTLE_MS);
      continue;
    }

    if (await page.locator(ANSWER_FORM_MC).first().isVisible()) {
      await answerMultipleChoice(page, exerciseAnswers?.[exerciseIndex]);
      exerciseIndex += 1;
      stuckSince = 0;
      await page.waitForTimeout(TRANSITION_SETTLE_MS);
      continue;
    }

    // Feedback continue button. The continue button is one of the
    // <button>s inside <main> with `className="w-full"` (per
    // src/components/practice/PracticeFeedbackPhase.tsx:194). Its label
    // changes per state ("Ver guía de recuperación →" / "Siguiente
    // ejercicio" / "Volver a selección") so we identify it by class
    // instead of text. The submit button inside an answer form also
    // has `className="w-full"` AND `type="submit"`, so we exclude it
    // via `:not([type="submit"])`. The retry button (when shown) also
    // has `w-full` but appears BEFORE the continue button in the DOM
    // (the continue button is rendered last per
    // PracticeFeedbackPhase.tsx:194), so `.last()` picks the right
    // one. We also exclude the BackButton ("← Volver a selección").
    {
      const continueButtons = page
        .locator("main")
        .locator('button.w-full:not([type="submit"])');
      const lastIdx = (await continueButtons.count()) - 1;
      if (lastIdx >= 0) {
        const continueButton = continueButtons.nth(lastIdx);
        if (await continueButton.isVisible().catch(() => false)) {
          const text = (await continueButton.textContent().catch(() => ""))?.trim() ?? "";
          if (text !== "← Volver a selección") {
            console.log(`[drivePracticeFlow][clicking continue button text="${text}"]`);
            await continueButton.click();
            await page.waitForTimeout(TRANSITION_SETTLE_MS);
            stuckSince = 0;
            continue;
          }
        }
      }
    }

    // Stuck-state diagnostic. After 5 consecutive iterations without
    // any of the above branches firing, dump full state so the canary
    // failure explains WHERE the flow is.
    stuckSince += 1;
    if (stuckSince === 5) {
      const snapshot = await readDebugSnapshot(page);
      const phaseHints = await page.evaluate(() => ({
        hasUnitSelect: !!document.querySelector("#unit-select"),
        hasAnswerFormText: !!document.querySelector('[data-testid="answer-form-text"]'),
        hasAnswerFormMC: !!document.querySelector('[data-testid="answer-form-multiple-choice"]'),
        hasOptIn: /Terminaste la pr\u00e1ctica base\./.test(document.body.textContent ?? ""),
        hasFeedbackStatus: !!document.querySelector('[role="status"]'),
        hasTheoryButtons: !!document.querySelector('button'),
        buttonsInMain: Array.from(document.querySelectorAll("main button")).map((b) => b.textContent?.trim().slice(0, 50) ?? "").slice(0, 10),
        mainPreview: (document.querySelector("main")?.textContent ?? "").slice(0, 400),
      }));
      console.log(
        `[drivePracticeFlow][stuck at iter] mc=${exerciseIndex} numerical=${numericalIndex} state=${JSON.stringify(snapshot)} phaseHints=${JSON.stringify(phaseHints)}`,
      );
    }
    await page.waitForTimeout(250);
  }
  throw new Error(
    `drivePracticeFlow: timed out before opt-in for "${skillId}" (mc=${exerciseIndex}, numerical=${numericalIndex}).`,
  );
}

/** Drive the challenge flow from the opt-in through all challenges to the
 *  done summary. Assumes the page is at the opt-in (practice complete).
 *
 *  Verification note: challenges persist attempts to the ADVANCED store
 *  (`pre-utn.advanced-practice.v1`), not the base practice store. So we
 *  read `readAdvancedState` instead of `readFixtureState` for the
 *  per-submit attempt-count check. */
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
    const before = await readAdvancedState(page);
    await answerChallengeMultipleChoice(page, challengeAnswers?.[i]);
    await page.getByRole(STATUS_BANNER_ROLE).first().waitFor({ state: "visible", timeout: 10_000 });
    await page.waitForTimeout(SUBMIT_SETTLE_MS);
    const after = await readAdvancedState(page);
    if (after.challengeAttempts <= before.challengeAttempts) {
      const debug = await readDebugSnapshot(page);
      throw new Error(
        `driveChallengeFlow: challenge submit did not register an attempt. beforeAttempts=${before.challengeAttempts}, afterAttempts=${after.challengeAttempts}, url=${debug.url}, mainTextPreview=${JSON.stringify(debug.mainTextPreview)}`,
      );
    }
    await page.getByRole("button", { name: CONTINUE_BTN }).first().click();
    await page.waitForTimeout(TRANSITION_SETTLE_MS);
  }
  await page.getByText(DONE_HEADER).first().waitFor({ state: "visible", timeout: 15_000 });
}

async function answerChallengeMultipleChoice(
  page: Page,
  answer: string | undefined,
): Promise<void> {
  const form = page.locator(ANSWER_FORM_MC);
  await form.waitFor({ state: "visible", timeout: 10_000 });
  if (answer) {
    const label = form.locator("label", { hasText: answer }).first();
    if (await label.count() > 0) {
      await label.click();
    } else {
      console.warn(`[practice-flow] challenge answer "${answer}" matched no option; picking the first.`);
      await form.getByRole("radio").first().click();
    }
  } else {
    await form.getByRole("radio").first().click();
  }
  await form.getByRole("button", { name: /Enviar respuesta/ }).click();
}
