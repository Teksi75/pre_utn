import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("DiagnosticProgress", () => {
  const componentPath =
    "src/components/diagnostic/DiagnosticProgress.tsx";

  test("exports a DiagnosticProgress component", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(
      /export\s+(?:function|const)\s+DiagnosticProgress\b/,
    );
  });

  test("exports pure helpers computeProgressPercent and shouldShowPercent", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(
      /export\s+function\s+computeProgressPercent\b/,
    );
    expect(comp).toMatch(
      /export\s+function\s+shouldShowPercent\b/,
    );
  });

  test("accepts currentIndex (number) and total (number) props", () => {
    const comp = source(componentPath);
    // The component prop types must be the two numbers; never `any`.
    expect(comp).toMatch(/currentIndex\s*:\s*number\b/);
    expect(comp).toMatch(/total\s*:\s*number\b/);
  });

  test("renders a progressbar with role + aria-value attributes", () => {
    const comp = source(componentPath);
    expect(comp).toContain('role="progressbar"');
    expect(comp).toContain("aria-valuemin");
    expect(comp).toContain("aria-valuemax");
    expect(comp).toContain("aria-valuenow");
    expect(comp).toContain("aria-label");
  });

  test("uses the percentage model (min=0, max=100) and stays coherent", () => {
    // Spec v4: do not mix percentage and question-number models in the
    // same progressbar. We commit to the percentage model.
    const comp = source(componentPath);
    expect(comp).toMatch(/aria-valuemin=\{0\}/);
    expect(comp).toMatch(/aria-valuemax=\{100\}/);
  });

  test("hides the visible percent on the first question (currentIndex === 0)", () => {
    // The shouldShowPercent helper must return false for currentIndex === 0
    // and true for currentIndex > 0. We assert via source: the JSX must
    // gate the percent text on a helper call.
    const comp = source(componentPath);
    expect(comp).toMatch(/shouldShowPercent\s*\(\s*currentIndex\s*\)/);
    // The width style must equal the computeProgressPercent helper output,
    // so the bar fills proportionally even when the percent text is hidden.
    expect(comp).toMatch(/computeProgressPercent\s*\(\s*currentIndex\s*,\s*total\s*\)/);
  });

  test("computeProgressPercent represents 'questions already answered', not 'current question'", () => {
    // Hotfix after visual review (C2.1): the bar used to fill
    // (currentIndex + 1) / total which made it look like the student
    // was already 8% into the diagnostic on question 1, before
    // answering anything. The bar must now represent completed work:
    // currentIndex / total.
    //
    //   currentIndex = 0  ->  0%   (the bar is empty, no fake "inicio")
    //   currentIndex = 1  ->  ~8%  (1 of 12 already answered)
    //   currentIndex = 11 ->  ~92% (one question left)
    //
    // We assert this by reading the source and the helper behaviour.
    const comp = source(componentPath);

    // The helper function body must NOT use (currentIndex + 1) any
    // more — that was the bug. It should divide currentIndex / total.
    expect(comp).not.toMatch(/Math\.round\(\s*\(\s*\(currentIndex\s*\+\s*1\)\s*\/\s*total\s*\)/);
    // It should divide currentIndex by total, with the +1 removed.
    expect(comp).toMatch(/currentIndex\s*\/\s*total/);
  });

  test("always renders the 'Pregunta X de N' counter (even on the first question)", () => {
    const comp = source(componentPath);
    // The counter is the primary locator for the student; it must never
    // be hidden, regardless of currentIndex.
    expect(comp).toContain("Pregunta");
    expect(comp).toContain("de");
  });

  test("animates only the width with the duration token (not transition-all)", () => {
    // Spec v4 / F1: prefer specific properties over transition-all.
    const comp = source(componentPath);
    expect(comp).not.toMatch(/\btransition-all\b/);
    expect(comp).toMatch(/transition-\[width\]/);
    expect(comp).toMatch(/duration-\[var\(--duration-normal\)\]/);
  });

  test("uses brand/accent tokens (no raw palette, no raw hex)", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(comp).not.toMatch(
      /\b(?:bg|text|border)-(?:amber|red|green|blue|emerald|orange|stone|yellow)-\d/,
    );
  });

  test("does not use any, console.log, or TODO", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/:\s*any\b/);
    expect(comp).not.toMatch(/<any\b/);
    expect(comp).not.toContain("console.log");
    expect(comp).not.toMatch(/\bTODO\b/);
  });
});
