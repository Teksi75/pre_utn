/**
 * LearnMatematicaPage — section card content (behavior-level rendering tests).
 *
 * Replaces the previous source-level read+regex test with actual page
 * rendering via `react-dom/server`. The page is a Server Component that
 * performs no async work (`loadTheoryContent` is sync), so we can render
 * it to a static HTML string and assert on the externally visible contract:
 *
 *   1. The card for "Operaciones con polinomios" shows "3 temas".
 *   2. The first subtopic title (e.g. "1. Suma y resta de polinomios") is
 *      NOT shown in the section-card view (it belongs to the detail view).
 *   3. No textual CTA such as "Estudiar" / "Estudiar →" appears inside the
 *      cards — the whole card is the link surface.
 *   4. The card remains a clickable `<a>` with the subject-scoped href.
 *   5. The singular branch renders "1 tema" when a node has exactly one
 *      concept. (No production node has 1 concept, so we exercise this
 *      branch through a small, targeted mock of the loader.)
 *
 * Mocks:
 *   - `next/link` → plain `<a>` passthrough (we still want the `href`).
 *   - `@/components/math-visuals` → `MathWatermark` passthrough (its visual
 *     layer is asserted in `math-watermark.test.ts`, not here).
 *   - `@/components/ui/DirectionalTransition` → passthrough (it's a
 *     `ViewTransition` wrapper with no testable static markup).
 *   - `@/domain/catalog/content-loaders` → only for the singular branch,
 *     to inject a synthetic 1-concept node into the rendered tree.
 *
 * Spec anchor: openspec/changes/archive/2026-06-19-section-card-topic-count/
 * Review follow-up: findings 1 (behavior-level coverage) and 3 (honest
 * assertion scope) of the post-apply review.
 */
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/math-visuals", () => ({
  MathWatermark: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/ui/DirectionalTransition", () => ({
  DirectionalTransition: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

// The loader mock is the seam for the singular pluralization test
// (Finding 1: "smallest maintainable behavior-level seam"). The default
// implementation stays untouched; we override it per-test as needed.
vi.mock("@/domain/catalog/content-loaders", async () => {
  const actual =
    await vi.importActual<typeof import("@/domain/catalog/content-loaders")>(
      "@/domain/catalog/content-loaders",
    );
  return {
    ...actual,
    loadTheoryContent: vi.fn(actual.loadTheoryContent),
  };
});

import LearnMatematicaPage from "../page";
import { loadTheoryContent } from "@/domain/catalog/content-loaders";

function renderPage(): string {
  return renderToStaticMarkup(<LearnMatematicaPage />);
}

/**
 * Extract the section-card <a> for a given skillId. Returns the HTML
 * string of the matching <a>...</a> element, or null if not found.
 * Uses a non-greedy match bounded by the first `</a>`.
 */
function extractCard(html: string, skillId: string): string | null {
  const re = new RegExp(
    `<a[^>]*href="/learn/matematica/${skillId.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    )}"[^>]*>[\\s\\S]*?<\\/a>`,
  );
  const m = html.match(re);
  return m ? m[0] : null;
}

describe("LearnMatematicaPage — section card visible contract", () => {
  test("card for 'Operaciones con polinomios' shows the visible count '3 temas'", () => {
    const html = renderPage();
    const card = extractCard(html, "mat.u2.operaciones_polinomios");
    expect(card).not.toBeNull();
    // The card's visible content is the title + the count line. The
    // count line lives in a <span class="block text-sm ..."> right after
    // the title <span>. The visible text is exactly `3 temas` followed
    // by the closing `</span>` of the count line.
    expect(card).toContain("Operaciones con polinomios");
    expect(card).toMatch(/>3 temas<\/span>/);
  });

  test("the count is computed from `node.concepts.length` (triangulation across nodes with different counts)", () => {
    // Triangulation: a hardcoded `3 temas` would pass the previous test
    // but fail this one. We sample three real nodes with distinct counts
    // (3, 5, 8) and assert each renders the count that matches its
    // concepts array. This proves the count is derived, not literal.
    const html = renderPage();
    const three = extractCard(html, "mat.u2.operaciones_polinomios");
    const five = extractCard(html, "mat.u2.polinomios_basico");
    const eight = extractCard(html, "mat.u2.factorizacion");
    expect(three).toMatch(/>3 temas<\/span>/);
    expect(five).toMatch(/>5 temas<\/span>/);
    expect(eight).toMatch(/>8 temas<\/span>/);
  });

  test("the first subtopic '1. Suma y resta de polinomios' is NOT shown in the section-card view", () => {
    const html = renderPage();
    // The detail view lists subtopics; the section-card view must not.
    expect(html).not.toContain("1. Suma y resta de polinomios");
  });

  test("no textual CTA 'Estudiar' / 'Estudiar →' appears anywhere in the page", () => {
    const html = renderPage();
    // The whole card is the link surface; a textual CTA would duplicate
    // the navigation affordance and add visual weight the spec forbids.
    expect(html).not.toMatch(/Estudiar/);
  });

  test("the section card remains a clickable <a> with the subject-scoped href", () => {
    const html = renderPage();
    const card = extractCard(html, "mat.u2.operaciones_polinomios");
    expect(card).not.toBeNull();
    // The href must point at the detail view for the same skillId.
    expect(card).toMatch(/href="\/learn\/matematica\/mat\.u2\.operaciones_polinomios"/);
    // The card's visible content lives inside the <a>:
    expect(card).toContain("Operaciones con polinomios");
    expect(card).toContain("3 temas");
  });
});

describe("LearnMatematicaPage — Unit 3 section card visible contract", () => {
  const U3_SKILL_IDS: readonly string[] = [
    "mat.u3.traduccion_lenguaje_verbal",
    "mat.u3.ecuaciones_lineales",
    "mat.u3.ecuaciones_cuadraticas",
    "mat.u3.inecuaciones_lineales",
    "mat.u3.inecuaciones_valor_absoluto",
    "mat.u3.recta",
    "mat.u3.sistemas",
    "mat.u3.exponenciales",
    "mat.u3.logaritmicas",
  ];

  /**
   * Extract the Unit 3 <section> block by finding its h2 heading text
   * and matching from that point to the closing </section> tag.
   * Returns the section HTML string, or null if not found.
   */
  function extractUnit3Section(html: string): string | null {
    const headingMarker = "Unidad 3 — Ecuaciones y sistemas";
    const idx = html.indexOf(headingMarker);
    if (idx === -1) return null;
    // Walk backward to find the nearest opening <section> before this h2.
    const before = html.substring(0, idx);
    const sectionStart = before.lastIndexOf("<section");
    if (sectionStart === -1) return null;
    // Walk forward from the heading to find the matching </section>.
    const after = html.substring(idx);
    // Find the closing </section> — count depth for nested sections
    // (not needed here since sections are siblings, but keeps it robust).
    let depth = 0;
    let pos = idx;
    // The opening <section> before the heading is part of the section
    // we need; scan from sectionStart.
    for (let i = sectionStart; i < html.length; i++) {
      if (html.substring(i, i + 8) === "<section") depth++;
      else if (html.substring(i, i + 10) === "</section>") {
        depth--;
        if (depth === 0) {
          return html.substring(sectionStart, i + 10);
        }
      }
    }
    return null;
  }

  test("Unidad 3 — Ecuaciones y sistemas heading is rendered", () => {
    const html = renderPage();
    expect(html).toContain("Unidad 3 — Ecuaciones y sistemas");
  });

  test("Unit 3 section has exactly 9 rendered cards", () => {
    const html = renderPage();
    const u3Section = extractUnit3Section(html);
    expect(u3Section, "Unit 3 section not found").not.toBeNull();
    // Count <a> elements linking to /learn/matematica/mat.u3.*
    // These are the section cards; other links (like the back button)
    // do NOT match the U3 path prefix.
    const u3Cards =
      u3Section!.match(
        /<a[^>]*href="\/learn\/matematica\/mat\.u3\.[^"]*"/g,
      ) ?? [];
    expect(
      u3Cards,
      `expected 9 U3 card links, got ${u3Cards.length}`,
    ).toHaveLength(9);
  });

  test("each U3 card links to /learn/matematica/{skillId}", () => {
    const html = renderPage();
    for (const skillId of U3_SKILL_IDS) {
      const card = extractCard(html, skillId);
      expect(card, `U3 card for ${skillId} missing`).not.toBeNull();
      // The href must point at the detail view for the same skillId.
      const escaped = skillId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(card).toMatch(new RegExp(`href="/learn/matematica/${escaped}"`));
    }
  });
});

describe("LearnMatematicaPage — singular pluralization (smallest behavior-level seam)", () => {
  test("renders '1 tema' (singular) when a node has exactly one concept", () => {
    // No production node has 1 concept (current minimum is 3), so we
    // exercise the singular branch by injecting a synthetic 1-concept
    // node through the loader mock. This is the smallest seam that
    // pushes the `=== 1` branch of the ternary end-to-end through the
    // React renderer.
    const syntheticNode = {
      id: "synthetic-single",
      skillId: "mat.u2.synthetic_single_concept",
      concepts: [
        {
          id: "c-only",
          title: "Solo concepto",
          body: "Body",
          bodyParagraphs: ["Body"],
        },
      ],
      notation: ["n"],
      commonMistakes: ["m"],
      practicePrompts: [],
      canonicalTrace: [
        { path: "p", sourceUse: "reference" as const, pedagogicalIntent: "i" },
      ],
    };

    vi.mocked(loadTheoryContent).mockReturnValue([syntheticNode] as never);

    const html = renderPage();
    const card = extractCard(html, "mat.u2.synthetic_single_concept");
    expect(card).not.toBeNull();
    expect(card).toContain(">1 tema</span>");
    // And the singular branch must NOT use the plural literal.
    expect(card).not.toMatch(/1\s*temas/);
  });
});
