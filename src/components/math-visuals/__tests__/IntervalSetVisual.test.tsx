/**
 * IntervalSetVisual — render contract for U3 inequality solution sets.
 *
 * Behavior/rendering tests: render via react-dom/server (renderToStaticMarkup)
 * and assert the rendered HTML string contract.
 *
 * Spec anchor: openspec/changes/add-interval-set-visual/specs/pedagogical-visuals/spec.md
 */

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { IntervalSetVisual } from "../IntervalSetVisual";
import type { IntervalSetVisual as IntervalSetVisualType } from "@/domain/visuals/types";

const base = {
  id: "v",
  title: "Interval set title",
  ariaLabel: "Interval set aria label",
  description: "Visible textual description of the interval set.",
};

function bounded(): IntervalSetVisualType {
  return {
    ...base,
    kind: "interval-set",
    notation: "(-3, 7)",
    intervals: [
      {
        lower: { kind: "finite", value: -3 },
        upper: { kind: "finite", value: 7 },
        lowerInclusion: "open",
        upperInclusion: "open",
      },
    ],
  };
}

function rightRay(): IntervalSetVisualType {
  return {
    ...base,
    kind: "interval-set",
    notation: "[4, +∞)",
    intervals: [
      {
        lower: { kind: "finite", value: 4 },
        upper: { kind: "infinity", direction: "positive" },
        lowerInclusion: "closed",
        upperInclusion: "open",
      },
    ],
  };
}

function leftRay(): IntervalSetVisualType {
  return {
    ...base,
    kind: "interval-set",
    notation: "(-∞, -3)",
    intervals: [
      {
        lower: { kind: "infinity", direction: "negative" },
        upper: { kind: "finite", value: -3 },
        lowerInclusion: "open",
        upperInclusion: "open",
      },
    ],
  };
}

function exteriorUnion(): IntervalSetVisualType {
  return {
    ...base,
    kind: "interval-set",
    notation: "(-∞, -3) ∪ (7, +∞)",
    intervals: [
      {
        lower: { kind: "infinity", direction: "negative" },
        upper: { kind: "finite", value: -3 },
        lowerInclusion: "open",
        upperInclusion: "open",
      },
      {
        lower: { kind: "finite", value: 7 },
        upper: { kind: "infinity", direction: "positive" },
        lowerInclusion: "open",
        upperInclusion: "open",
      },
    ],
  };
}

function fractionLabel(): IntervalSetVisualType {
  return {
    ...base,
    kind: "interval-set",
    notation: "(-∞, -5/2) ∪ (7/2, +∞)",
    intervals: [
      {
        lower: { kind: "infinity", direction: "negative" },
        upper: { kind: "finite", value: -2.5, label: "-5/2" },
        lowerInclusion: "open",
        upperInclusion: "open",
      },
      {
        lower: { kind: "finite", value: 3.5, label: "7/2" },
        upper: { kind: "infinity", direction: "positive" },
        lowerInclusion: "open",
        upperInclusion: "open",
      },
    ],
  };
}

function renderHtml(visual: IntervalSetVisualType): string {
  return renderToStaticMarkup(<IntervalSetVisual visual={visual} />);
}

function assertVisualWrapper(html: string, visual: IntervalSetVisualType): void {
  expect(html).toContain('role="img"');
  expect(html).toContain(`aria-label="${visual.ariaLabel}"`);
  expect(html).toContain(`<title>${visual.title}</title>`);
  expect(html).toContain(`<desc>${visual.description}</desc>`);
  expect(html).toContain(visual.description);
  expect(html).toContain('class="h-auto w-full"');
  expect(html).toContain('viewBox="');
  expect(html).not.toMatch(/\swidth="\d+"/);
}

describe("IntervalSetVisual", () => {
  test("bounded interval renders accessible responsive figure with notation", () => {
    const visual = bounded();
    const html = renderHtml(visual);

    assertVisualWrapper(html, visual);
    expect(html).toContain(visual.notation);
    expect(html).toContain('data-interval-region="0"');
    expect(html).toContain('data-hatching="true"');
  });

  test("right ray renders arrow on the right side and closed endpoint", () => {
    const visual = rightRay();
    const html = renderHtml(visual);

    assertVisualWrapper(html, visual);
    expect(html).toContain('data-interval-side="right"');
    expect(html).toContain('data-endpoint="lower"');
    expect(html).toContain('data-interval-region="0"');
  });

  test("left ray renders arrow on the left side and open endpoint", () => {
    const visual = leftRay();
    const html = renderHtml(visual);

    assertVisualWrapper(html, visual);
    expect(html).toContain('data-interval-side="left"');
    expect(html).toContain('data-endpoint="upper"');
  });

  test("exterior union renders two disjoint regions on one shared axis", () => {
    const visual = exteriorUnion();
    const html = renderHtml(visual);

    assertVisualWrapper(html, visual);
    expect(html).toContain('data-interval-region="0"');
    expect(html).toContain('data-interval-region="1"');
    expect(html).toContain('data-interval-side="left"');
    expect(html).toContain('data-interval-side="right"');

    const regions = html.match(/data-hatching="true"/g) ?? [];
    expect(regions.length).toBe(2);
  });

  test("finite endpoints distinguish open from closed", () => {
    const visual = bounded();
    const html = renderHtml(visual);

    // Both endpoints are open: expect white fill with colored stroke.
    const openFillCount = (html.match(/fill="#ffffff"/g) ?? []).length;
    expect(openFillCount).toBeGreaterThanOrEqual(2);

    const closed = rightRay();
    const closedHtml = renderHtml(closed);
    // Closed lower endpoint uses the accent fill; the arrow side has no endpoint circle.
    expect(closedHtml).toContain('data-endpoint="lower"');
    expect(closedHtml).not.toContain('data-endpoint="upper"');
  });

  test("fraction labels render as text while geometry uses numeric value", () => {
    const visual = fractionLabel();
    const html = renderHtml(visual);

    assertVisualWrapper(html, visual);
    expect(html).toContain("-5/2");
    expect(html).toContain("7/2");
    expect(html).not.toContain("-2.5");
    expect(html).not.toContain("3.5");
  });

  test("renders optional set-builder label", () => {
    const visual: IntervalSetVisualType = {
      ...bounded(),
      setBuilderLabel: "-3 < x < 7",
    };
    const html = renderHtml(visual);

    expect(html).toContain("-3 &lt; x &lt; 7");
  });

  test("renders without NaN or Infinity coordinates", () => {
    const visuals = [bounded(), rightRay(), leftRay(), exteriorUnion(), fractionLabel()];
    for (const visual of visuals) {
      const html = renderHtml(visual);
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("Infinity");
    }
  });
});
