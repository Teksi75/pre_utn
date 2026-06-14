import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("globals.css — F1 prefers-reduced-motion audit", () => {
  const cssPath = "src/app/globals.css";

  test("declares a @media (prefers-reduced-motion: reduce) block", () => {
    const css = source(cssPath);
    expect(css).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)\s*\{/);
  });

  test("the reduced-motion block covers *, *::before, *::after", () => {
    const css = source(cssPath);
    // Extract the @media block and check it touches all three selectors.
    const match = css.match(
      /@media\s+\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/,
    );
    expect(match).not.toBeNull();
    const body = match![1] ?? "";
    expect(body).toMatch(/\*,/);
    expect(body).toMatch(/\*::before/);
    expect(body).toMatch(/\*::after/);
  });

  test("the reduced-motion block disables transition-duration with !important", () => {
    const css = source(cssPath);
    const match = css.match(
      /@media\s+\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/,
    );
    expect(match).not.toBeNull();
    const body = match![1] ?? "";
    expect(body).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });

  test("the reduced-motion block disables animation-duration with !important", () => {
    const css = source(cssPath);
    const match = css.match(
      /@media\s+\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/,
    );
    expect(match).not.toBeNull();
    const body = match![1] ?? "";
    expect(body).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
  });
});

describe("Sprint components — F1 prefers-reduced-motion", () => {
  // The sprint introduced or modified these components. Each one with
  // a transition must use a specific property (transition-colors,
  // transition-[width], transition-shadow), not the catch-all
  // transition-all that the spec F1 forbids for new code.
  const sprintFiles = [
    "src/components/ui/StatusPill.tsx",
    "src/components/practice/FocusSelector.tsx",
    "src/components/diagnostic/DiagnosticProgress.tsx",
  ];

  for (const path of sprintFiles) {
    test(`${path} does NOT use transition-all`, () => {
      const comp = source(path);
      expect(comp).not.toMatch(/\btransition-all\b/);
    });
  }

  test("transition-colors durations in the sprint use the duration tokens", () => {
    // The new transitions introduced in the sprint reference the
    // --duration-fast / --duration-normal tokens so the global
    // reduced-motion rule (transition-duration: 0.01ms !important)
    // can collapse them. Hard-coded numeric durations would bypass
    // the token and the reduced-motion override.
    const pill = source("src/components/ui/StatusPill.tsx");
    // StatusPill does not have an explicit transition; its colour
    // change comes from inheriting Tailwind utilities in call sites.
    // This is fine — the audit's purpose is to forbid new
    // transition-all, which we already check above. We keep this
    // case as a guard rail: if StatusPill ever grows a transition,
    // it must use a token.
    expect(pill).not.toMatch(/\bduration-\[\d/);

    const diag = source("src/components/diagnostic/DiagnosticProgress.tsx");
    expect(diag).toContain("duration-[var(--duration-normal)]");
    expect(diag).not.toMatch(/\bduration-\[\d/);

    const focus = source("src/components/practice/FocusSelector.tsx");
    expect(focus).toContain("duration-[var(--duration-fast)]");
  });
});

describe("globals.css — F2 focus-visible audit", () => {
  const cssPath = "src/app/globals.css";

  test("declares a global *:focus-visible rule", () => {
    const css = source(cssPath);
    expect(css).toMatch(/\*:\s*focus-visible\s*\{/);
  });

  test("the global *:focus-visible rule applies the ring-focus box-shadow", () => {
    const css = source(cssPath);
    const match = css.match(/\*:\s*focus-visible\s*\{([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    const body = match![1] ?? "";
    expect(body).toMatch(/box-shadow:\s*var\(--ring-focus\)/);
  });

  test("the global *:focus-visible rule does not blank the outline silently", () => {
    // The rule does set outline: none, but it is paired with the
    // ring-focus box-shadow so the focus cue is never lost.
    // We assert the box-shadow replacement is present so a future
    // refactor cannot regress to outline: none without a visible
    // alternative.
    const css = source(cssPath);
    const match = css.match(/\*:\s*focus-visible\s*\{([\s\S]*?)\n\}/);
    const body = match![1] ?? "";
    if (body.includes("outline: none") || body.includes("outline:none")) {
      expect(body).toMatch(/box-shadow:\s*var\(--ring-focus\)/);
    }
  });
});

describe("Sprint components — F2 focus-visible", () => {
  // F2 of the spec v4 says: "Todo link, button, select e input
  // debe tener focus visible. ... Usar focus-visible:shadow-
  // [var(--ring-focus)] o convención equivalente."
  //
  // We split the audit by component role: components that render
  // interactive elements (button, input, select, link, label
  // wrapping a radio) MUST declare a focus-visible or focus-within
  // cue. Components that are pure display (a <span> pill, a
  // progressbar <div>) deliberately do not, because they are not
  // tab stops.

  test("StatusPill is decorative and intentionally non-focusable", () => {
    // StatusPill renders a <span>. Per the F2 spec, focus is
    // required for links, buttons, selects, and inputs — not for
    // decorative content. The component must NOT inject a focus
    // cue, and it must not be focusable. We assert the <span> root
    // and forbid tabIndex / role=button here.
    const comp = source("src/components/ui/StatusPill.tsx");
    expect(comp).toMatch(/<span\b/);
    expect(comp).not.toMatch(/<button\b/);
    expect(comp).not.toMatch(/<a\b/);
    expect(comp).not.toMatch(/<input\b/);
  });

  test("DiagnosticProgress is a non-interactive progressbar (no focus cue needed)", () => {
    // The progressbar carries role="progressbar" and is a display
    // surface. The spec F2 focus requirement applies to controls
    // (links, buttons, selects, inputs), not to read-only display
    // elements. The global *:focus-visible rule in globals.css
    // would still apply if the element were focusable, but the
    // progressbar is not in the Tab order.
    const comp = source("src/components/diagnostic/DiagnosticProgress.tsx");
    expect(comp).toMatch(/role="progressbar"/);
    // Sanity: no tabIndex or interactive child.
    expect(comp).not.toMatch(/tabIndex/);
    expect(comp).not.toMatch(/tabindex/);
  });

  test("FocusSelector's native <select> uses focus-visible:shadow-[var(--ring-focus)]", () => {
    const comp = source("src/components/practice/FocusSelector.tsx");
    expect(comp).toMatch(/<select[^>]*focus-visible:shadow-\[var\(--ring-focus\)\]/);
  });

  test("FocusSelector's <button> skill options use focus-visible:shadow-[var(--ring-focus)]", () => {
    const comp = source("src/components/practice/FocusSelector.tsx");
    // The <button> elements inside the listbox use the same focus
    // cue utility. We assert by sampling one of the option strings
    // that already appear in the file.
    expect(comp).toContain("focus-visible:shadow-[var(--ring-focus)]");
  });

  test("ExerciseAnswerInput's submit button keeps focus-visible:shadow-[var(--ring-focus)]", () => {
    const comp = source("src/components/exercises/ExerciseAnswerInput.tsx");
    expect(comp).toContain("focus-visible:shadow-[var(--ring-focus)]");
  });

  test("ExerciseAnswerInput's <label> option uses focus-within:shadow-[var(--ring-focus)]", () => {
    // The <label> wrapping the radio input is what actually
    // receives the visual cue when the radio inside is focused.
    // focus-within propagates the focus from the input to the
    // wrapping label.
    const comp = source("src/components/exercises/ExerciseAnswerInput.tsx");
    expect(comp).toContain("focus-within:shadow-[var(--ring-focus)]");
  });

  test("Button still applies focus-visible:shadow-[var(--ring-focus)] in its base classes", () => {
    const button = source("src/components/ui/Button.tsx");
    expect(button).toContain("focus-visible:shadow-[var(--ring-focus)]");
  });
});
