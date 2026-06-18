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
import type { TheoryNode, CanonicalTrace } from "@/domain/models/theory";

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
