/**
 * TheoryCard — paragraph rendering contract.
 *
 * Behavior/rendering tests: render TheoryCard via react-dom/server
 * (renderToStaticMarkup) and assert the rendered HTML string contract.
 * Replaces @testing-library/react + jsdom dependency — no DOM environment needed.
 *
 * Spec anchor: openspec/changes/issue-36-theory-readability/specs/theory-paragraph-model/spec.md
 */

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TheoryCard } from "@/components/practice/TheoryCard";
import type { TheoryNode, CanonicalTrace, IntervalVisualExample } from "@/domain/models/theory";
import type { IntervalRepresentation } from "@/domain/intervals/representation";
import type { PedagogicalVisual } from "@/domain/visuals/types";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const trace: CanonicalTrace = {
  path: "test.pdf",
  sourceUse: "reference",
  pedagogicalIntent: "Test trace for rendering.",
};

function makeNode(overrides: Partial<TheoryNode> = {}): TheoryNode {
  return {
    id: "theory-test",
    skillId: "mat.u1.conjuntos_numericos",
    concepts: [
      {
        id: "concept-test",
        title: "Test concept",
        body: "Legacy body text.",
      },
    ],
    notation: ["a + b"],
    commonMistakes: ["Error test"],
    practicePrompts: [],
    canonicalTrace: [trace],
    ...overrides,
  } as TheoryNode;
}

/** Render TheoryCard to a static HTML string — no DOM/browser needed. */
function renderHtml(node: TheoryNode): string {
  return renderToStaticMarkup(<TheoryCard node={node} />);
}

/** Count non-overlapping occurrences of a substring or regex in the haystack. */
function countMatches(haystack: string, needle: string | RegExp): number {
  if (typeof needle === "string") {
    return haystack.split(needle).length - 1;
  }
  return (haystack.match(needle) || []).length;
}

/**
 * Count immediate-child <div> elements inside the container identified by
 * `containerClass` in the rendered HTML string.
 *
 * Strategy: after the container opening tag (`class="CONTAINER">`), the
 * structure is a sequence of `<div>CHILD</div>` groups followed by the
 * container's own `</div>`.  We find the container open, then advance
 * through the string counting `<div` that start at the top level (i.e. NOT
 * nested inside a child's content).
 *
 * Each child produces exactly one `<div` at level 1.  Nested `<div` inside
 * a child (e.g. BlockMath's display wrapper) are at level ≥ 2 and the
 * counter subtracts them via depth tracking.
 */
function countChildDivsInsideContainer(
  html: string,
  containerClass: string
): number {
  const escaped = containerClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const openRegex = new RegExp(`class="${escaped}"[^>]*>`);
  const openMatch = html.match(openRegex);
  if (!openMatch || openMatch.index === undefined) return 0;

  const start = openMatch.index + openMatch[0].length;

  // Walk the tag stream depth-first until the container's own </div> returns
  // us to level 0 (or we run out of string).
  let depth = 1; // inside the container
  let childCount = 0;
  let pos = start;

  // Simple tag scanner — handles the XML-like output from renderToStaticMarkup
  const tagRegex = /<(\/?)(\w+)[^>]*>/g;
  tagRegex.lastIndex = start;

  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(html)) !== null) {
    const isClose = m[1] === "/";
    const tagName = m[2].toLowerCase();

    if (tagName === "div") {
      if (!isClose) {
        if (depth === 1) childCount++;
        depth++;
      } else {
        depth--;
        if (depth === 0) break; // container's own </div>
      }
    }
  }

  return childCount;
}

// ---------------------------------------------------------------------------
// Disclosure controls visibility
// ---------------------------------------------------------------------------

describe("TheoryCard — disclosure controls", () => {
  test("shows 'Ver notación' control when notation has entries", () => {
    const node = makeNode({ notation: ["$a + b$", "$a - b$"], commonMistakes: [] });
    const html = renderHtml(node);
    expect(html).toContain("Ver notación");
    expect(html).toContain("a + b");
    expect(html).toContain("a - b");
  });

  test("hides 'Ver notación' control when notation is empty", () => {
    const node = makeNode({ notation: [], commonMistakes: ["Error test"] });
    const html = renderHtml(node);
    expect(html).not.toContain("Ver notación");
    expect(html).not.toContain("Ocultar notación");
  });

  test("shows only 'Ver errores comunes' when common mistakes exist but notation is empty", () => {
    const node = makeNode({
      notation: [],
      commonMistakes: ["Olvidar cambiar el signo al restar."],
    });
    const html = renderHtml(node);
    expect(html).not.toContain("Ver notación");
    expect(html).toContain("Ver errores comunes");
    expect(html).toContain("Olvidar cambiar el signo al restar.");
  });

  test("hides 'Ver errores comunes' control when commonMistakes is empty", () => {
    const node = makeNode({ notation: ["$a + b$"], commonMistakes: [] });
    const html = renderHtml(node);
    expect(html).not.toContain("Ver errores comunes");
    expect(html).not.toContain("Ocultar errores comunes");
  });

  test("hides both disclosure controls when notation and commonMistakes are empty", () => {
    const node = makeNode({ notation: [], commonMistakes: [] });
    const html = renderHtml(node);
    expect(html).not.toContain("Ver notación");
    expect(html).not.toContain("Ver errores comunes");
    expect(html).not.toContain("Ocultar notación");
    expect(html).not.toContain("Ocultar errores comunes");
  });
});

// ---------------------------------------------------------------------------
// Multi-paragraph rendering (bodyParagraphs)
// ---------------------------------------------------------------------------

describe("TheoryCard — bodyParagraphs rendering", () => {
  test("renders one <div> per bodyParagraphs chunk (3-paragraph concept → 3 <div>)", () => {
    const node = makeNode({
      concepts: [
        {
          id: "concept-multi",
          title: "Multi-paragraph concept",
          body: "fallback",
          bodyParagraphs: [
            "First paragraph.",
            "Second paragraph.",
            "Third paragraph.",
          ],
        },
      ],
    });

    const html = renderHtml(node);

    // Each paragraph chunk is wrapped in its own <div> inside a space-y-2 container
    expect(html).toContain("class=\"space-y-2\"");
    const childDivs = countChildDivsInsideContainer(html, "space-y-2");
    expect(childDivs).toBe(3);

    // Text content is present and in order
    expect(html).toContain("First paragraph.");
    expect(html).toContain("Second paragraph.");
    expect(html).toContain("Third paragraph.");
  });

  test("multi-paragraph concept renders each chunk through RichText (rich text wrapper present)", () => {
    const node = makeNode({
      concepts: [
        {
          id: "concept-multi",
          title: "Multi concept",
          body: "fallback",
          bodyParagraphs: ["Plain text.", "$x^2$ math."],
        },
      ],
    });

    const html = renderHtml(node);

    // Plain text paragraph is wrapped in <span> by RichText
    expect(html).toContain("Plain text.");

    // The $x^2$ math paragraph produces KaTeX markup (.katex class)
    expect(html).toContain("class=\"katex\"");

    // Both paragraphs are inside the space-y-2 container (multi-paragraph path)
    expect(html).toContain("class=\"space-y-2\"");
    const childDivs = countChildDivsInsideContainer(html, "space-y-2");
    expect(childDivs).toBe(2);
  });

  test("bodyParagraphs preferred over body when both present (conditional contract)", () => {
    const node = makeNode({
      concepts: [
        {
          id: "concept-both",
          title: "Both fields",
          body: "This should NOT render.",
          bodyParagraphs: ["This should render."],
        },
      ],
    });

    const html = renderHtml(node);

    // bodyParagraphs path wins — the bodyParagraphs text appears
    expect(html).toContain("This should render.");
    // body text must NOT appear
    expect(html).not.toContain("This should NOT render.");
  });
});

// ---------------------------------------------------------------------------
// Legacy body fallback
// ---------------------------------------------------------------------------

describe("TheoryCard — legacy body fallback", () => {
  test("renders legacy body content when bodyParagraphs is absent", () => {
    const node = makeNode({
      concepts: [
        {
          id: "concept-legacy",
          title: "Legacy concept",
          body: "Single body text.",
        },
      ],
    });

    const html = renderHtml(node);

    // Legacy path renders the body text directly
    expect(html).toContain("Single body text.");

    // No space-y-2 container (only used for multi-paragraph path)
    expect(html).not.toContain("class=\"space-y-2\"");
  });

  test("empty bodyParagraphs array falls back to body", () => {
    const node = makeNode({
      concepts: [
        {
          id: "concept-empty-arr",
          title: "Empty array",
          body: "Fallback body.",
          bodyParagraphs: [],
        },
      ],
    });

    const html = renderHtml(node);

    // Empty array is falsy → falls back to body
    expect(html).toContain("Fallback body.");
    expect(html).not.toContain("class=\"space-y-2\"");
  });
});

// ---------------------------------------------------------------------------
// KaTeX math rendering per paragraph
// ---------------------------------------------------------------------------

describe("TheoryCard — KaTeX math in paragraphs", () => {
  test("inline math $...$ renders as .katex element in each paragraph", () => {
    const node = makeNode({
      concepts: [
        {
          id: "concept-math",
          title: "Math concept",
          body: "fallback",
          bodyParagraphs: [
            "Para dividir $P(x)$ por $(x-a)$:",
            "El resto es $P(a)$.",
          ],
        },
      ],
    });

    const html = renderHtml(node);

    // Each paragraph should contain rendered KaTeX output
    // $P(x)$ and $(x-a)$ → 2 KaTeX elements in first paragraph
    // $P(a)$ → 1 KaTeX element in second paragraph
    // Total: 3 KaTeX elements across 2 paragraphs
    const katexCount = countMatches(html, "class=\"katex\"");
    expect(katexCount).toBe(3);

    // Verify the paragraphs are in distinct <div> wrappers within space-y-2
    const childDivs = countChildDivsInsideContainer(html, "space-y-2");
    expect(childDivs).toBe(2);

    // Verify text content includes the math symbol "P" rendered by KaTeX
    expect(html).toContain("P(x)");
    expect(html).toContain("P(a)");
  });

  test("display math $$...$$ renders BlockMath (div.katex-display)", () => {
    const node = makeNode({
      concepts: [
        {
          id: "concept-display",
          title: "Display math",
          body: "fallback",
          bodyParagraphs: ["Identity: $$x^2 + y^2 = 1$$."],
        },
      ],
    });

    const html = renderHtml(node);

    // BlockMath uses displayMode=true → KaTeXBlock renders with .katex-display class
    expect(html).toContain("katex-display");

    // The wrapper is a <div> (not <p>) → no <p> tags wrapping block math
    const childDivs = countChildDivsInsideContainer(html, "space-y-2");
    expect(childDivs).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Pedagogical visual examples wiring
// ---------------------------------------------------------------------------

const signChartVisual: PedagogicalVisual = {
  id: "theory-sign-chart",
  kind: "sign-chart",
  title: "Sign chart",
  ariaLabel: "Sign chart for linear inequality",
  description: "The expression is positive before the zero and negative after it.",
  variable: "x",
  expression: "x - 2",
  zeros: [2],
  excludedPoints: [],
  criticalPoints: [2],
  signZones: [
    { lowerBound: null, upperBound: 2, sign: "-" },
    { lowerBound: 2, upperBound: null, sign: "+" },
  ],
};

describe("TheoryCard — pedagogical visuals wiring", () => {
  test("concept-level visualExamples render after the concept body", () => {
    const node = makeNode({
      concepts: [
        {
          id: "concept-visual",
          title: "Visual concept",
          body: "Concept body.",
          visualExamples: [signChartVisual],
        },
      ],
    });

    const html = renderHtml(node);

    expect(html).toContain("Concept body.");
    expect(html).toContain('role="img"');
    expect(html).toContain(signChartVisual.ariaLabel);
    expect(html).toContain(signChartVisual.description);
  });

  test("node-level visualExamples render near legacy interval visuals", () => {
    const node = makeNode({
      visualExamples: [signChartVisual],
    });

    const html = renderHtml(node);

    expect(html).toContain('role="img"');
    expect(html).toContain(signChartVisual.ariaLabel);
    expect(html).toContain(signChartVisual.description);
  });

  test("responsive smoke test: visual inside a narrow card container uses viewBox and relative width (jsdom cannot measure real overflow)", () => {
    const html = renderToStaticMarkup(
      <div style={{ width: 320 }}>
        <TheoryCard node={makeNode({ visualExamples: [signChartVisual] })} />
      </div>
    );

    // The SVG must scale to the card width; a fixed pixel width would break
    // narrow screens. jsdom cannot compute layout overflow, so we assert the
    // structural preconditions that make responsive scaling possible.
    expect(html).toContain('viewBox="');
    expect(html).toContain('class="h-auto w-full"');
    expect(html).not.toMatch(/<svg[^>]*\swidth="\d+"/);
    expect(html).not.toMatch(/<figure[^>]*style="[^"]*width/);
  });

  test("no visualExamples renders without resolver markup", () => {
    const html = renderHtml(makeNode());

    expect(html).not.toContain('role="img"');
    expect(html).not.toContain(signChartVisual.ariaLabel);
  });

  test("concept-level visualExamples render after intervalRepresentations", () => {
    const intervalRep: IntervalRepresentation = {
      id: "concept-interval",
      notation: "[1, 4]",
      setBuilderLabel: "1 ≤ x ≤ 4",
      lower: { kind: "finite", value: 1 },
      upper: { kind: "finite", value: 4 },
      lowerInclusion: "closed",
      upperInclusion: "closed",
      ariaLabel: "Interval one to four closed",
    };

    const node = makeNode({
      concepts: [
        {
          id: "concept-ordered",
          title: "Ordered concept",
          body: "Body text.",
          intervalRepresentations: [intervalRep],
          visualExamples: [signChartVisual],
        },
      ],
    });

    const html = renderHtml(node);
    const intervalPos = html.indexOf(intervalRep.setBuilderLabel);
    const visualPos = html.indexOf(signChartVisual.ariaLabel);

    expect(intervalPos).toBeGreaterThan(-1);
    expect(visualPos).toBeGreaterThan(-1);
    expect(visualPos).toBeGreaterThan(intervalPos);
  });

  test("node-level visualExamples render after legacy interval visuals", () => {
    const intervalVisual: IntervalVisualExample = {
      id: "node-interval",
      title: "Node interval title",
      description: "Node interval description.",
      interval: {
        left: { kind: "finite", value: 1, closed: true },
        right: { kind: "finite", value: 4, closed: true },
      },
    };

    const node = makeNode({
      intervalVisuals: [intervalVisual],
      visualExamples: [signChartVisual],
    });

    const html = renderHtml(node);
    const intervalPos = html.indexOf(intervalVisual.title);
    const visualPos = html.indexOf(signChartVisual.ariaLabel);

    expect(intervalPos).toBeGreaterThan(-1);
    expect(visualPos).toBeGreaterThan(-1);
    expect(visualPos).toBeGreaterThan(intervalPos);
  });
});
