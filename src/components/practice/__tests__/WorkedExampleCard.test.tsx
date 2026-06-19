/**
 * WorkedExampleCard — disclosure contract tests.
 *
 * Behavior/rendering tests: render via react-dom/server (renderToStaticMarkup)
 * and assert the rendered HTML string contract.
 * Follows the same pattern as TheoryCard.test.tsx.
 *
 * Spec anchor: openspec/changes/expand-factorizacion-worked-examples/design.md
 */

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkedExampleCard } from "@/components/practice/WorkedExampleCard";
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
      { order: 2, explanation: "Aplicamos la fórmula." },
      { order: 3, explanation: "Resultado: (x − 2)(x + 2). Verificación: ✓" },
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

/** Render WorkedExampleCard to a static HTML string. */
function renderHtml(example: WorkedExample): string {
  return renderToStaticMarkup(<WorkedExampleCard example={example} />);
}

// ---------------------------------------------------------------------------
// Disclosure contract
// ---------------------------------------------------------------------------

describe("WorkedExampleCard — disclosure contract", () => {
  test("problem text is always visible (not inside closed disclosure)", () => {
    const html = renderHtml(makeExample());

    // The problem should always be visible, not inside the collapsed section
    expect(html).toContain("Factorizar x² − 4");
  });

  test("closed solution does NOT mount step content", () => {
    const html = renderHtml(makeExample());

    // Step explanations should NOT be rendered when closed
    expect(html).not.toContain("diferencia de cuadrados");
    expect(html).not.toContain("Aplicamos la fórmula");
  });

  test("closed solution does NOT mount final answer", () => {
    const html = renderHtml(makeExample());

    expect(html).not.toContain("(x − 2)(x + 2)");
  });

  test("closed solution does NOT mount pedagogical note", () => {
    const html = renderHtml(makeExample());

    expect(html).not.toContain("confundir con un trinomio");
  });

  test("solution toggle button exposes aria-expanded=false when closed", () => {
    const html = renderHtml(makeExample());

    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('aria-expanded="true"');
  });

  test("solution toggle button label shows 'Ver resolución paso a paso' when closed", () => {
    const html = renderHtml(makeExample());

    expect(html).toContain("Ver resolución paso a paso");
    expect(html).not.toContain("Ocultar resolución");
  });

  test("rendered markup has no fixed-height ceiling on solution container", () => {
    const html = renderHtml(makeExample());

    // No inline maxHeight style should exist
    expect(html).not.toMatch(/maxHeight/);
    expect(html).not.toMatch(/max-height/);
  });

  test("rendered markup has no overflow-hidden on solution container", () => {
    const html = renderHtml(makeExample());

    // The solution disclosure wrapper should not use overflow-hidden
    expect(html).not.toMatch(/class="[^"]*overflow-hidden[^"]*transition-all/);
  });

  test("example without pedagogical note still renders correctly", () => {
    const example = makeExample({ pedagogicalNote: "" });
    const html = renderHtml(example);

    // Problem is visible
    expect(html).toContain("Factorizar x² − 4");
    // Toggle is present
    expect(html).toContain('aria-expanded="false"');
    // No step content mounted
    expect(html).not.toContain("diferencia de cuadrados");
  });
});
