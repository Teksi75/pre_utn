/**
 * PedagogicalVisualRenderer — rendering contract for U3 visual examples.
 *
 * Behavior/rendering tests: render via react-dom/server (renderToStaticMarkup)
 * and assert the rendered HTML string contract.
 *
 * Spec anchor: sdd/u3-visualizaciones-pedagogicas/spec + design
 */

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PedagogicalVisualRenderer } from "../PedagogicalVisualRenderer";
import type {
  CartesianLineVisual,
  DistanceOnLineVisual,
  IntervalSetVisual,
  PedagogicalVisual,
  SignChartVisual,
  SystemsOfLinesVisual,
} from "@/domain/visuals/types";

const base = {
  id: "v",
  title: "Visual title",
  ariaLabel: "Visual aria label",
  description: "Visible textual description of the visual.",
};

const signChart: SignChartVisual = {
  ...base,
  kind: "sign-chart",
  variable: "x",
  expression: "(x-1)(x-3)",
  zeros: [1],
  excludedPoints: [3],
  criticalPoints: [1, 3],
  signZones: [
    { lowerBound: null, upperBound: 1, sign: "+" },
    { lowerBound: 1, upperBound: 3, sign: "-" },
    { lowerBound: 3, upperBound: null, sign: "+" },
  ],
};

function distance(inequality: DistanceOnLineVisual["inequality"]): DistanceOnLineVisual {
  return {
    ...base,
    kind: "distance-on-line",
    center: 2,
    distance: 3,
    inequality,
    description: `Distance visual ${inequality}`,
  };
}

const cartesianLine = (form: CartesianLineVisual["form"]): CartesianLineVisual => {
  const common = { ...base, kind: "cartesian-line" as const };
  switch (form) {
    case "slope-intercept":
      return { ...common, form, slope: 1, intercept: 0 };
    case "point-slope":
      return { ...common, form, slope: 2, point: { x: 1, y: 1 } };
    case "two-point":
      return { ...common, form, points: [{ x: 0, y: 0 }, { x: 2, y: 2 }] };
    case "horizontal":
      return { ...common, form, constant: 2 };
    case "vertical":
      return { ...common, form, constant: -1 };
  }
};

const systems = (classification: SystemsOfLinesVisual["classification"]): SystemsOfLinesVisual => {
  const common = {
    ...base,
    kind: "systems-of-lines" as const,
    lines: [{ form: "slope-intercept" as const, slope: 1, intercept: 0 }, { form: "slope-intercept" as const, slope: -1, intercept: 2 }] as const,
  };
  switch (classification) {
    case "secant":
      return { ...common, classification, intersection: { x: 1, y: 1 } };
    case "parallel":
      return { ...common, classification, lines: [{ form: "slope-intercept" as const, slope: 2, intercept: 0 }, { form: "slope-intercept" as const, slope: 2, intercept: 3 }] };
    case "coincident":
      return { ...common, classification, lines: [{ form: "slope-intercept" as const, slope: 2, intercept: 1 }, { form: "slope-intercept" as const, slope: 2, intercept: 1 }] };
  }
};

const intervalSet = (notation: string, intervals: IntervalSetVisual["intervals"]): IntervalSetVisual => ({
  ...base,
  kind: "interval-set",
  notation,
  intervals,
});

function renderHtml(visual: PedagogicalVisual): string {
  return renderToStaticMarkup(<PedagogicalVisualRenderer visual={visual} />);
}

function assertVisualWrapper(html: string, visual: PedagogicalVisual): void {
  expect(html).toContain('role="img"');
  expect(html).toContain(`aria-label="${visual.ariaLabel}"`);
  expect(html).toContain(`<title>${visual.title}</title>`);
  expect(html).toContain(`<desc>${visual.description}</desc>`);
  expect(html).toContain(visual.description);
  expect(html).toContain('class="h-auto w-full"');
  expect(html).toContain('viewBox="');
}

describe("PedagogicalVisualRenderer", () => {
  test("sign-chart renders accessible figure with visible description", () => {
    const html = renderHtml(signChart);
    assertVisualWrapper(html, signChart);
    expect(html).toContain(signChart.expression);
  });

  test.each([
    { ineq: "lt" as const, label: "inside" },
    { ineq: "gt" as const, label: "outside" },
  ])("distance-on-line $inequality renders $label region", ({ ineq }) => {
    const visual = distance(ineq);
    const html = renderHtml(visual);
    assertVisualWrapper(html, visual);
  });

  test.each([
    { form: "slope-intercept" as const, label: "y =" },
    { form: "horizontal" as const, label: "y =" },
    { form: "vertical" as const, label: "x =" },
  ])("cartesian-line $form renders line label", ({ form, label }) => {
    const visual = cartesianLine(form);
    const html = renderHtml(visual);
    assertVisualWrapper(html, visual);
    expect(html).toContain(label);
  });

  test.each(["secant", "parallel", "coincident"] as const)(
    "systems-of-lines %s renders accessible figure",
    (classification) => {
      const visual = systems(classification);
      const html = renderHtml(visual);
      assertVisualWrapper(html, visual);
      expect(html).toContain(classification);
    }
  );

  test("sign-chart renders an excluded zero as an open circle without a cross", () => {
    const visual: SignChartVisual = {
      ...base,
      kind: "sign-chart",
      variable: "x",
      expression: "-2x - 6",
      zeros: [-3],
      excludedPoints: [-3],
      criticalPoints: [-3],
      signZones: [
        { lowerBound: null, upperBound: -3, sign: "+" },
        { lowerBound: -3, upperBound: null, sign: "-" },
      ],
    };
    const html = renderHtml(visual);
    assertVisualWrapper(html, visual);

    // The point must be drawn as an open circle (excluded root), not with the
    // cross marker reserved for undefined/asymptote points.
    expect(html).toContain('fill="#ffffff"');
    expect(html).not.toMatch(/M\d+ \d+ L\d+ \d+ M\d+ \d+ L\d+ \d+/);
  });

  test.each([
    {
      name: "bounded open interval",
      visual: intervalSet("(-3, 7)", [
        {
          lower: { kind: "finite", value: -3 },
          upper: { kind: "finite", value: 7 },
          lowerInclusion: "open",
          upperInclusion: "open",
        },
      ]),
    },
    {
      name: "right ray",
      visual: intervalSet("[4, +∞)", [
        {
          lower: { kind: "finite", value: 4 },
          upper: { kind: "infinity", direction: "positive" },
          lowerInclusion: "closed",
          upperInclusion: "open",
        },
      ]),
    },
    {
      name: "two-segment exterior union",
      visual: intervalSet("(-∞, -3) ∪ (7, +∞)", [
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
      ]),
    },
    {
      name: "fraction label endpoint",
      visual: intervalSet("(-∞, -5/2)", [
        {
          lower: { kind: "infinity", direction: "negative" },
          upper: { kind: "finite", value: -2.5, label: "-5/2" },
          lowerInclusion: "open",
          upperInclusion: "open",
        },
      ]),
    },
  ])("interval-set $name renders accessible figure with stable data attributes", ({ visual }) => {
    const html = renderHtml(visual);
    assertVisualWrapper(html, visual);
    expect(html).toContain(visual.notation);
    expect(html).toContain('data-interval-region="0"');
  });

  test("interval-set two-segment union renders both regions and both arrows", () => {
    const visual = intervalSet("(-∞, -3) ∪ (7, +∞)", [
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
    ]);
    const html = renderHtml(visual);

    assertVisualWrapper(html, visual);
    expect(html).toContain('data-interval-region="0"');
    expect(html).toContain('data-interval-region="1"');
    expect(html).toContain('data-interval-side="left"');
    expect(html).toContain('data-interval-side="right"');
  });

  test("unknown kind throws at render time", () => {
    const unknown = { ...base, kind: "unknown" } as unknown as PedagogicalVisual;
    expect(() => renderHtml(unknown)).toThrow();
  });

  test("rendered SVG is responsive and has no fixed pixel width", () => {
    const html = renderHtml(signChart);

    expect(html).toContain('class="h-auto w-full"');
    expect(html).toContain('viewBox="');
    expect(html).not.toMatch(/\swidth="\d+"/);
  });

  test("cartesian-line vertical x=10 renders a visible line segment with an expanded viewport", () => {
    const visual: CartesianLineVisual = { ...base, kind: "cartesian-line", form: "vertical", constant: 10 };
    const html = renderHtml(visual);

    // The line equation must still be communicated to the student.
    expect(html).toContain("x = 10");

    // A data line (not just grid/axes) should be present and vertical.
    const dataLines = extractDataLines(html);
    expect(dataLines.length).toBeGreaterThanOrEqual(1);
    const verticalLine = dataLines.find((l) => l.x1 === l.x2);
    expect(verticalLine).toBeDefined();
  });

  test("cartesian-line horizontal y=8 renders a visible line segment with an expanded viewport", () => {
    const visual: CartesianLineVisual = { ...base, kind: "cartesian-line", form: "horizontal", constant: 8 };
    const html = renderHtml(visual);

    expect(html).toContain("y = 8");

    const dataLines = extractDataLines(html);
    expect(dataLines.length).toBeGreaterThanOrEqual(1);
    const horizontalLine = dataLines.find((l) => l.y1 === l.y2);
    expect(horizontalLine).toBeDefined();
  });

  test("systems-of-lines uses non-color cues to distinguish the two lines", () => {
    const visual = systems("secant");
    const html = renderHtml(visual);

    // Both line equations are visible as text labels.
    expect(html).toContain("L1:");
    expect(html).toContain("L2:");

    const dataLines = extractDataLines(html);
    expect(dataLines.length).toBe(2);

    // At least one line uses a dashed/dotted stroke pattern, and at least one
    // remains solid so the two are distinguishable without relying only on hue.
    const dashedCount = dataLines.filter((l) => l.strokeDasharray !== undefined).length;
    const solidCount = dataLines.filter((l) => l.strokeDasharray === undefined).length;
    expect(dashedCount).toBeGreaterThanOrEqual(1);
    expect(solidCount).toBeGreaterThanOrEqual(1);
  });

  test.each([
    {
      name: "cartesian-line vertical x=1e308",
      visual: { ...base, kind: "cartesian-line" as const, form: "vertical" as const, constant: 1e308 },
    },
    {
      name: "sign-chart with extreme critical point",
      visual: {
        ...base,
        kind: "sign-chart" as const,
        variable: "x",
        expression: "x - 1e308",
        zeros: [1e308],
        excludedPoints: [],
        criticalPoints: [1e308],
        signZones: [{ lowerBound: null, upperBound: 1e308, sign: "-" }, { lowerBound: 1e308, upperBound: null, sign: "+" }],
      },
    },
    {
      name: "systems-of-lines with extreme intersection",
      visual: {
        ...base,
        kind: "systems-of-lines" as const,
        classification: "secant" as const,
        lines: [{ form: "slope-intercept" as const, slope: 1, intercept: 0 }, { form: "slope-intercept" as const, slope: -1, intercept: 1e308 }] as const,
        intersection: { x: 5e307, y: 5e307 },
      },
    },
    {
      name: "sign-chart with opposite extreme critical points",
      visual: {
        ...base,
        kind: "sign-chart" as const,
        variable: "x",
        expression: "x² - M²",
        zeros: [-Number.MAX_VALUE],
        excludedPoints: [Number.MAX_VALUE],
        criticalPoints: [-Number.MAX_VALUE, Number.MAX_VALUE],
        signZones: [
          { lowerBound: null, upperBound: -Number.MAX_VALUE, sign: "+" },
          { lowerBound: -Number.MAX_VALUE, upperBound: Number.MAX_VALUE, sign: "-" },
          { lowerBound: Number.MAX_VALUE, upperBound: null, sign: "+" },
        ],
      },
    },
    {
      name: "cartesian-line two-point at opposite horizontal extremes",
      visual: {
        ...base,
        kind: "cartesian-line" as const,
        form: "two-point" as const,
        points: [
          { x: -Number.MAX_VALUE, y: 0 },
          { x: Number.MAX_VALUE, y: 0 },
        ],
      },
    },
  ])("$name renders without non-finite SVG coordinates", ({ visual }) => {
    const html = renderHtml(visual as PedagogicalVisual);
    expect(html).toContain('role="img"');
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("Infinity");
  });
});

interface ParsedLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeDasharray?: string;
}

function extractDataLines(html: string): ParsedLine[] {
  const lines: ParsedLine[] = [];
  const regex = /<line\s+([^>]+)>/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    const attrs = m[1];
    const stroke = /stroke="([^"]+)"/.exec(attrs)?.[1];
    if (!stroke || !stroke.includes("accent")) continue;
    const parseAttr = (name: string) => {
      const match = new RegExp(`${name}="([^"]+)"`).exec(attrs);
      return match ? Number(match[1]) : NaN;
    };
    const x1 = parseAttr("x1");
    const y1 = parseAttr("y1");
    const x2 = parseAttr("x2");
    const y2 = parseAttr("y2");
    if ([x1, y1, x2, y2].some(Number.isNaN)) continue;
    lines.push({
      x1,
      y1,
      x2,
      y2,
      strokeDasharray: /stroke-dasharray="([^"]+)"/.exec(attrs)?.[1],
    });
  }
  return lines;
}
