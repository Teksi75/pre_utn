/**
 * WorkedExamplesSection — disclosure contract tests.
 *
 * Behavior/rendering tests: render via react-dom/server (renderToStaticMarkup)
 * and assert the rendered HTML string contract.
 * Follows the same pattern as TheoryCard.test.tsx.
 *
 * Spec anchor: openspec/changes/expand-factorizacion-worked-examples/design.md
 */

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkedExamplesSection } from "@/components/practice/WorkedExamplesSection";
import type { WorkedExample } from "@/domain/models/worked-example";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeExample(overrides: Partial<WorkedExample> = {}): WorkedExample {
  return {
    id: "example-test-1",
    skillId: "mat.u2.factorizacion",
    problem: "Factorizar x² − 4",
    steps: [
      { order: 1, explanation: "Identificamos diferencia de cuadrados." },
      { order: 2, explanation: "Resultado: (x − 2)(x + 2)." },
    ],
    finalAnswer: "(x − 2)(x + 2)",
    pedagogicalNote: "Error frecuente: confundir con un trinomio.",
    canonicalTrace: [
      {
        path: "test.pdf",
        section: "Test section",
        sourceUse: "reference",
        pedagogicalIntent: "Test trace.",
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render WorkedExamplesSection to a static HTML string. */
function renderHtml(examples: readonly WorkedExample[]): string {
  return renderToStaticMarkup(<WorkedExamplesSection examples={examples} />);
}

// ---------------------------------------------------------------------------
// Disclosure contract
// ---------------------------------------------------------------------------

describe("WorkedExamplesSection — disclosure contract", () => {
  test("renders null when examples array is empty", () => {
    const html = renderHtml([]);
    expect(html).toBe("");
  });

  test("closed disclosure does NOT mount example bodies", () => {
    const html = renderHtml([makeExample()]);

    // The problem text from the example should NOT appear in the closed state
    expect(html).not.toContain("Factorizar x² − 4");
    // Step content should NOT be mounted
    expect(html).not.toContain("diferencia de cuadrados");
    expect(html).not.toContain("(x − 2)(x + 2)");
  });

  test("toggle button exposes aria-expanded=false when closed", () => {
    const html = renderHtml([makeExample()]);

    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('aria-expanded="true"');
  });

  test("toggle button label shows 'Ver ejemplos resueltos' when closed", () => {
    const html = renderHtml([makeExample()]);

    expect(html).toContain("Ver ejemplos resueltos");
    expect(html).not.toContain("Ocultar ejemplos resueltos");
  });

  test("rendered markup has no fixed-height ceiling (no maxHeight style)", () => {
    const html = renderHtml([makeExample()]);

    // No inline maxHeight style should exist on the disclosure container
    expect(html).not.toMatch(/maxHeight/);
    expect(html).not.toMatch(/max-height/);
  });

  test("rendered markup has no overflow-hidden on disclosure container", () => {
    const html = renderHtml([makeExample()]);

    // The disclosure wrapper should not use overflow-hidden
    // (WorkedExampleCard may use it internally for other reasons, but not the section container)
    // We check that the outer disclosure div does not have overflow-hidden
    // by verifying the examples content area doesn't clip
    expect(html).not.toMatch(/class="[^"]*overflow-hidden[^"]*transition-all/);
  });
});
