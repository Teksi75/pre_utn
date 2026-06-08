import { describe, expect, it } from "vitest";
import {
  computeIntervalSvgLayout,
  type IntervalSvgLayout,
} from "../intervals/svg-layout";
import type { IntervalRepresentation } from "../intervals/representation";

function makeRep(overrides: Partial<IntervalRepresentation> & Pick<IntervalRepresentation, "lower" | "upper" | "lowerInclusion" | "upperInclusion">): IntervalRepresentation {
  return {
    id: "test",
    notation: "test",
    setBuilderLabel: "test",
    ariaLabel: "test",
    ...overrides,
  };
}

describe("computeIntervalSvgLayout", () => {
  it("computes layout for bounded closed interval", () => {
    const rep = makeRep({
      lower: { kind: "finite", value: -2 },
      upper: { kind: "finite", value: 3 },
      lowerInclusion: "closed",
      upperInclusion: "closed",
    });
    const layout = computeIntervalSvgLayout(rep);

    expect(layout.isValid).toBe(true);
    expect(layout.showLeftArrow).toBe(false);
    expect(layout.showRightArrow).toBe(false);
    expect(layout.leftEndpoint.kind).toBe("finite");
    expect(layout.rightEndpoint.kind).toBe("finite");
    if (layout.leftEndpoint.kind === "finite") {
      expect(layout.leftEndpoint.closed).toBe(true);
    }
    if (layout.rightEndpoint.kind === "finite") {
      expect(layout.rightEndpoint.closed).toBe(true);
    }
  });

  it("computes layout for bounded open interval", () => {
    const rep = makeRep({
      lower: { kind: "finite", value: -3 },
      upper: { kind: "finite", value: 2 },
      lowerInclusion: "open",
      upperInclusion: "open",
    });
    const layout = computeIntervalSvgLayout(rep);

    expect(layout.isValid).toBe(true);
    expect(layout.showLeftArrow).toBe(false);
    expect(layout.showRightArrow).toBe(false);
    if (layout.leftEndpoint.kind === "finite") {
      expect(layout.leftEndpoint.closed).toBe(false);
    }
    if (layout.rightEndpoint.kind === "finite") {
      expect(layout.rightEndpoint.closed).toBe(false);
    }
  });

  it("computes layout for interval with negative infinity", () => {
    const rep = makeRep({
      lower: { kind: "infinity", direction: "negative" },
      upper: { kind: "finite", value: 4 },
      lowerInclusion: "open",
      upperInclusion: "closed",
    });
    const layout = computeIntervalSvgLayout(rep);

    expect(layout.isValid).toBe(true);
    expect(layout.showLeftArrow).toBe(true);
    expect(layout.showRightArrow).toBe(false);
    expect(layout.leftEndpoint.kind).toBe("infinity");
  });

  it("computes layout for interval with positive infinity", () => {
    const rep = makeRep({
      lower: { kind: "finite", value: -2 },
      upper: { kind: "infinity", direction: "positive" },
      lowerInclusion: "closed",
      upperInclusion: "open",
    });
    const layout = computeIntervalSvgLayout(rep);

    expect(layout.isValid).toBe(true);
    expect(layout.showLeftArrow).toBe(false);
    expect(layout.showRightArrow).toBe(true);
    expect(layout.rightEndpoint.kind).toBe("infinity");
  });

  it("computes layout for total real interval", () => {
    const rep = makeRep({
      lower: { kind: "infinity", direction: "negative" },
      upper: { kind: "infinity", direction: "positive" },
      lowerInclusion: "open",
      upperInclusion: "open",
    });
    const layout = computeIntervalSvgLayout(rep);

    expect(layout.isValid).toBe(true);
    expect(layout.showLeftArrow).toBe(true);
    expect(layout.showRightArrow).toBe(true);
    expect(layout.leftEndpoint.kind).toBe("infinity");
    expect(layout.rightEndpoint.kind).toBe("infinity");
  });

  it("generates ticks for bounded interval", () => {
    const rep = makeRep({
      lower: { kind: "finite", value: -2 },
      upper: { kind: "finite", value: 3 },
      lowerInclusion: "closed",
      upperInclusion: "closed",
    });
    const layout = computeIntervalSvgLayout(rep);

    expect(layout.ticks.length).toBeGreaterThan(0);
    // Should include ticks for -2, -1, 0, 1, 2, 3
    const tickValues = layout.ticks.map((t) => t.value);
    expect(tickValues).toContain(-2);
    expect(tickValues).toContain(0);
    expect(tickValues).toContain(3);
  });

  it("includes formatted notation in layout", () => {
    const rep = makeRep({
      lower: { kind: "finite", value: -2 },
      upper: { kind: "finite", value: 3 },
      lowerInclusion: "closed",
      upperInclusion: "closed",
      notation: "[−2, 3]",
    });
    const layout = computeIntervalSvgLayout(rep);

    expect(layout.formattedNotation).toBe("[−2, 3]");
  });

  it("includes aria label in layout", () => {
    const rep = makeRep({
      lower: { kind: "finite", value: -2 },
      upper: { kind: "finite", value: 3 },
      lowerInclusion: "closed",
      upperInclusion: "closed",
      ariaLabel: "Intervalo cerrado [−2, 3]",
    });
    const layout = computeIntervalSvgLayout(rep);

    expect(layout.ariaLabel).toContain("[−2, 3]");
    expect(layout.ariaLabel).toContain("cerrado");
    expect(layout.ariaLabel).toContain("test"); // setBuilderLabel
  });

  it("computes segment endpoints for bounded interval", () => {
    const rep = makeRep({
      lower: { kind: "finite", value: -2 },
      upper: { kind: "finite", value: 3 },
      lowerInclusion: "closed",
      upperInclusion: "closed",
    });
    const layout = computeIntervalSvgLayout(rep);

    expect(layout.segmentStartX).toBeDefined();
    expect(layout.segmentEndX).toBeDefined();
    expect(layout.segmentStartX).toBeLessThan(layout.segmentEndX);
  });

  it("handles half-open interval correctly", () => {
    const rep = makeRep({
      lower: { kind: "finite", value: -2 },
      upper: { kind: "finite", value: 5 },
      lowerInclusion: "closed",
      upperInclusion: "open",
    });
    const layout = computeIntervalSvgLayout(rep);

    expect(layout.isValid).toBe(true);
    if (layout.leftEndpoint.kind === "finite") {
      expect(layout.leftEndpoint.closed).toBe(true);
    }
    if (layout.rightEndpoint.kind === "finite") {
      expect(layout.rightEndpoint.closed).toBe(false);
    }
  });
});
