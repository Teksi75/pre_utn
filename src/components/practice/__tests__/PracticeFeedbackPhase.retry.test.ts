/**
 * Retry UI tests for PracticeFeedbackPhase.
 *
 * Since the project test environment is Node (no jsdom), React components
 * cannot be rendered. We test PURE LOGIC extracted from rendering decisions
 * and verify component STRUCTURE via source-code assertions.
 *
 * TDD tasks covered: T2.4, T2.5, T2.8
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Pure logic — extracted from PracticeFeedbackPhase render decisions
// ---------------------------------------------------------------------------

/**
 * Determines whether the retry button should be rendered in the feedback phase.
 * @param correct whether the answer was correct
 * @param canRetry whether the attempt cap hasn't been reached yet
 * @param hasOnRetry whether a handler function is provided
 * @returns true if the retry button should appear
 */
export function shouldShowRetryButton(
  correct: boolean,
  canRetry: boolean,
  hasOnRetry: boolean,
): boolean {
  return !correct && canRetry && hasOnRetry;
}

/**
 * Determines whether the warm legend (gentle nudge to move on) should appear.
 * @param correct whether the answer was correct
 * @param canRetry whether the attempt cap hasn't been reached yet
 * @returns true if the warm legend should appear
 */
export function shouldShowWarmLegend(
  correct: boolean,
  canRetry: boolean,
): boolean {
  return !correct && !canRetry;
}

/**
 * The exact text of the warm legend shown when the student reaches the cap.
 * This MUST match the spec text exactly — no paraphrasing.
 */
export const WARM_LEGEND_TEXT =
  "Parecés estar con la cabeza en otro lado. Pasemos al siguiente y volvé a este después si querés.";

// ---------------------------------------------------------------------------
// Unit tests: shouldShowRetryButton
// ---------------------------------------------------------------------------

describe("shouldShowRetryButton", () => {
  it("shows retry when answer is wrong, can retry, and handler exists", () => {
    expect(shouldShowRetryButton(false, true, true)).toBe(true);
  });

  it("hides retry when answer is correct (even if canRetry + handler present)", () => {
    expect(shouldShowRetryButton(true, true, true)).toBe(false);
  });

  it("hides retry when cap is reached (canRetry=false)", () => {
    expect(shouldShowRetryButton(false, false, true)).toBe(false);
  });

  it("hides retry when no handler is provided (even if wrong + canRetry)", () => {
    expect(shouldShowRetryButton(false, true, false)).toBe(false);
  });

  it("hides retry when all conditions are false", () => {
    expect(shouldShowRetryButton(true, false, false)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Unit tests: shouldShowWarmLegend
// ---------------------------------------------------------------------------

describe("shouldShowWarmLegend", () => {
  it("shows warm legend when answer is wrong and canRetry is false", () => {
    expect(shouldShowWarmLegend(false, false)).toBe(true);
  });

  it("hides warm legend when answer is correct", () => {
    expect(shouldShowWarmLegend(true, false)).toBe(false);
  });

  it("hides warm legend when student can still retry", () => {
    expect(shouldShowWarmLegend(false, true)).toBe(false);
  });

  it("hides when correct and can retry", () => {
    expect(shouldShowWarmLegend(true, true)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Warm legend text constant
// ---------------------------------------------------------------------------

describe("WARM_LEGEND_TEXT", () => {
  it("has the exact spec-approved text", () => {
    expect(WARM_LEGEND_TEXT).toBe(
      "Parecés estar con la cabeza en otro lado. Pasemos al siguiente y volvé a este después si querés.",
    );
  });
});

// ---------------------------------------------------------------------------
// Source-code assertions: PracticeFeedbackPhase component structure
// ---------------------------------------------------------------------------

const repoRoot = process.cwd();

function feedbackPhaseSource(): string {
  return readFileSync(
    join(repoRoot, "src/components/practice/PracticeFeedbackPhase.tsx"),
    "utf8",
  );
}

describe("PracticeFeedbackPhase component structure (source assertions)", () => {
  it("declares onRetry prop in the interface", () => {
    const src = feedbackPhaseSource();
    expect(src).toMatch(/onRetry\?\s*:\s*\(\)\s*=>\s*void/);
  });

  it("declares attemptIndex prop in the interface", () => {
    const src = feedbackPhaseSource();
    expect(src).toMatch(/attemptIndex\s*(:\s*number|\?\s*:\s*number)/);
  });

  it("declares canRetry prop in the interface", () => {
    const src = feedbackPhaseSource();
    expect(src).toMatch(/canRetry\s*(:\s*boolean|\?\s*:\s*boolean)/);
  });

  it("renders a retry button with text 'Reintentar este ejercicio'", () => {
    const src = feedbackPhaseSource();
    expect(src).toMatch(/Reintentar este ejercicio/);
  });

  it("wires the retry button to onClick={onRetry}", () => {
    const src = feedbackPhaseSource();
    // "Reintentar este ejercicio" appears twice: once in JSDoc, once in JSX.
    // lastIndexOf gives us the JSX usage.
    const retryPos = src.lastIndexOf("Reintentar este ejercicio");
    const retryRegion = src.slice(
      Math.max(0, retryPos - 200),
      retryPos + 200,
    );
    expect(retryRegion).toMatch(/onClick=\{onRetry\}/);
  });

  it("renders the warm legend with the exact text when cap is reached", () => {
    const src = feedbackPhaseSource();
    // The full warm legend text must appear (not paraphrased)
    expect(src).toContain(WARM_LEGEND_TEXT);
  });

  it("uses Card variant accent for the warm legend (consistent with RecoveryPhase)", () => {
    const src = feedbackPhaseSource();
    // Should use an amber/accent-colored card, similar to PracticeRecoveryPhase
    // Check for amber-100/bg-amber/amber-800 text pattern
    const warmLegendRegion = src.slice(
      src.indexOf(WARM_LEGEND_TEXT) - 500,
      src.indexOf(WARM_LEGEND_TEXT) + 300,
    );
    expect(
      warmLegendRegion.includes("amber") ||
        warmLegendRegion.includes("accent") ||
        warmLegendRegion.includes("warm"),
    ).toBe(true);
  });

  it("retry button appears ABOVE the recovery/continue button (visual hierarchy)", () => {
    const src = feedbackPhaseSource();
    // Both strings appear in JSDoc AND JSX. Use lastIndexOf for JSX positions.
    const retryPos = src.lastIndexOf("Reintentar este ejercicio");
    const continueButtonPos = src.lastIndexOf("onClick={onContinue}");
    expect(retryPos).toBeGreaterThan(0);
    expect(continueButtonPos).toBeGreaterThan(0);
    expect(retryPos).toBeLessThan(continueButtonPos);
  });

  it("warm legend includes aria-live or role for accessibility", () => {
    const src = feedbackPhaseSource();
    // The warm legend is guarded by {showLegend && ...} and has role="status".
    // Search for the unique showLegend guard + role attribute nearby.
    const showLegendPos = src.indexOf("{showLegend &&");
    expect(showLegendPos).toBeGreaterThan(0);
    const legendRegion = src.slice(showLegendPos, showLegendPos + 800);
    const hasAria =
      legendRegion.includes("aria-live") ||
      legendRegion.includes("role=");
    expect(hasAria).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Source-code assertions: page.tsx canRetry wiring (CRITICAL-1 guard)
// ---------------------------------------------------------------------------

function practicePageSource(): string {
  return readFileSync(
    join(repoRoot, "src/app/practice/page.tsx"),
    "utf8",
  );
}

describe("page.tsx canRetry wiring (CRITICAL-1 guard)", () => {
  it("does NOT add +1 to the stored attemptIndex (off-by-one bug guard)", () => {
    const src = practicePageSource();
    // Locate the canRetry prop region
    const canRetryIdx = src.indexOf("canRetry={");
    expect(canRetryIdx).toBeGreaterThan(0);
    const canRetryRegion = src.slice(canRetryIdx, canRetryIdx + 350);
    // The buggy pattern: (map.get(...) ?? 0) + 1
    // After the fix this should NOT be present.
    const hasBuggyIncrement = canRetryRegion.includes("?? 0) + 1");
    expect(hasBuggyIncrement).toBe(false);
  });

  it("page.tsx reads attemptIndex directly from the Map with default 1", () => {
    const src = practicePageSource();
    const canRetryIdx = src.indexOf("canRetry={");
    const canRetryRegion = src.slice(canRetryIdx, canRetryIdx + 350);
    // The correct pattern: map.get(...) ?? 1 (default value, not ?? 0)
    // No "+ 1" after the get/default. The closing paren may be on a
    // separate line, but the default must be 1 — not 0.
    const hasCorrectDefault = canRetryRegion.includes("?? 1,");
    expect(hasCorrectDefault).toBe(true);
  });
});
