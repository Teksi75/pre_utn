/**
 * DistanceOnLineVisual — distance inequality contract.
 *
 * Asserts the accepted region (inside vs outside) and endpoint style
 * (open vs closed) for every supported inequality symbol.
 */

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DistanceOnLineVisual } from "../DistanceOnLineVisual";
import type { DistanceOnLineVisual as DistanceOnLineVisualType } from "@/domain/visuals/types";

const base: Omit<DistanceOnLineVisualType, "inequality"> = {
  id: "v",
  kind: "distance-on-line",
  title: "Distance visual",
  ariaLabel: "Distance on a number line",
  description: "Visible description",
  center: 2,
  distance: 3,
};

function renderFor(inequality: DistanceOnLineVisualType["inequality"]): string {
  return renderToStaticMarkup(
    <DistanceOnLineVisual visual={{ ...base, inequality }} />
  );
}

interface ParsedLine {
  readonly x1: number;
  readonly x2: number;
}

function extractAcceptedRegionLines(html: string): ParsedLine[] {
  const lines: ParsedLine[] = [];
  const regex = /<line\s+([^>]+)>/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    const attrs = m[1];
    if (!attrs.includes("color-accent-600")) continue;
    const parseAttr = (name: string) => {
      const match = new RegExp(`${name}="([^"]+)"`).exec(attrs);
      return match ? Number(match[1]) : NaN;
    };
    const x1 = parseAttr("x1");
    const x2 = parseAttr("x2");
    if (Number.isNaN(x1) || Number.isNaN(x2)) continue;
    lines.push({ x1, x2 });
  }
  return lines;
}

function extractEndpointFills(html: string): string[] {
  const fills: string[] = [];
  const regex = /<circle\s+([^>]+)>/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    const attrs = m[1];
    if (!attrs.includes("color-accent-600") || !attrs.includes('r="7"')) continue;
    const fillMatch = /fill="([^"]+)"/.exec(attrs);
    if (fillMatch) fills.push(fillMatch[1]);
  }
  return fills;
}

describe("DistanceOnLineVisual inequality contract", () => {
  test.each([
    { inequality: "lt" as const, region: "inside", closed: false },
    { inequality: "le" as const, region: "inside", closed: true },
    { inequality: "gt" as const, region: "outside", closed: false },
    { inequality: "ge" as const, region: "outside", closed: true },
  ])(
    "$inequality renders $region region with $closed endpoints",
    ({ inequality, region, closed }) => {
      const html = renderFor(inequality);

      // Accessible/testable metadata exposes the contract explicitly.
      expect(html).toContain(`data-region="${region}"`);
      expect(html).toContain(`data-endpoints="${closed ? "closed" : "open"}"`);

      const acceptedLines = extractAcceptedRegionLines(html);
      const endpointFills = extractEndpointFills(html);

      // Inside: one accepted segment between c-d and c+d.
      // Outside: two accepted rays away from c-d and c+d.
      if (region === "inside") {
        expect(acceptedLines).toHaveLength(1);
      } else {
        expect(acceptedLines).toHaveLength(2);
      }

      expect(endpointFills).toHaveLength(2);
      const expectedFill = closed
        ? "var(--color-accent-600)"
        : "#ffffff";
      expect(endpointFills.every((fill) => fill === expectedFill)).toBe(true);
    }
  );

  test("falls back to an empty axis when center ± distance overflows to non-finite values", () => {
    const html = renderToStaticMarkup(
      <DistanceOnLineVisual
        visual={{
          ...base,
          inequality: "le",
          center: Number.MAX_VALUE,
          distance: Number.MAX_VALUE,
        }}
      />
    );

    // The accessible wrapper and description must survive.
    expect(html).toContain('role="img"');
    expect(html).toContain(base.ariaLabel);
    expect(html).toContain(base.description);

    // No non-finite coordinate may leak into SVG attributes.
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("Infinity");

    // The accepted region is omitted rather than rendered with bad geometry.
    expect(extractAcceptedRegionLines(html)).toHaveLength(0);
    expect(extractEndpointFills(html)).toHaveLength(0);
  });

  test("falls back to an empty axis when finite opposite extremes overflow the domain span", () => {
    const html = renderToStaticMarkup(
      <DistanceOnLineVisual
        visual={{
          ...base,
          inequality: "le",
          center: 0,
          distance: Number.MAX_VALUE,
        }}
      />
    );

    // The accessible wrapper and description must survive.
    expect(html).toContain('role="img"');
    expect(html).toContain(base.ariaLabel);
    expect(html).toContain(base.description);

    // No non-finite coordinate may leak into SVG attributes.
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("Infinity");

    // Unsafe geometry is omitted rather than collapsed to a non-finite coordinate.
    expect(extractAcceptedRegionLines(html)).toHaveLength(0);
    expect(extractEndpointFills(html)).toHaveLength(0);
  });
});
