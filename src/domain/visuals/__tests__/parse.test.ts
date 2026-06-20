import { describe, test, expect } from "vitest";
import { parsePedagogicalVisual, parseOptionalVisualExamples } from "../parse";
import {
  assertSignChart,
  assertDistanceOnLine,
  assertCartesianLine,
  assertSystemsOfLines,
} from "./helpers";
import { lineToStandardForm, solveLinearSystem, linearScale } from "../layout";
import type { CartesianLineData } from "../types";

const base: Record<string, string> = {
  id: "v", title: "T", ariaLabel: "A", description: "D",
};

const make = (extra: Record<string, unknown>) => ({ ...base, ...extra });

function makeSignChart(extra: Record<string, unknown> = {}) {
  return make({
    kind: "sign-chart",
    variable: "x",
    expression: "(x+2)(x-3)",
    zeros: [-2, 3],
    excludedPoints: [0],
    signZones: [
      { lowerBound: null, upperBound: -2, sign: "+" },
      { lowerBound: -2, upperBound: 0, sign: "-" },
      { lowerBound: 0, upperBound: 3, sign: "-" },
      { lowerBound: 3, upperBound: null, sign: "+" },
    ],
    ...extra,
  });
}

describe("parsePedagogicalVisual", () => {
  test("sign-chart: valid", () => {
    const v = assertSignChart(parsePedagogicalVisual(makeSignChart()));
    expect(v).toMatchObject({ kind: "sign-chart", variable: "x", expression: "(x+2)(x-3)", zeros: [-2, 3], excludedPoints: [0] });
    expect(v.criticalPoints).toEqual([-2, 0, 3]);
    expect(v.signZones).toHaveLength(4);
    expect(v.signZones[0]).toEqual({ lowerBound: null, upperBound: -2, sign: "+" });
    expect(v.signZones[1]).toEqual({ lowerBound: -2, upperBound: 0, sign: "-" });
    expect(v.signZones[2]).toEqual({ lowerBound: 0, upperBound: 3, sign: "-" });
    expect(v.signZones[3]).toEqual({ lowerBound: 3, upperBound: null, sign: "+" });
  });
  test("sign-chart: rejects non-numeric zero", () => {
    expect(() => parsePedagogicalVisual(makeSignChart({ zeros: ["a"] }))).toThrow(/zeros/);
  });
  test("sign-chart: rejects missing expression", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "sign-chart", variable: "x", zeros: [], excludedPoints: [], signZones: [] }))).toThrow(/expression/);
  });
  test("sign-chart: rejects empty signZones", () => {
    expect(() => parsePedagogicalVisual(makeSignChart({ signZones: [] }))).toThrow(/signZones/);
  });
  test("sign-chart: rejects invalid sign value", () => {
    expect(() => parsePedagogicalVisual(makeSignChart({ signZones: [{ lowerBound: null, upperBound: 0, sign: "?" }] }))).toThrow(/sign/);
  });
  test("sign-chart: rejects sign 0 on an open interval", () => {
    // A sign zone is an open interval; zero belongs at a critical point,
    // not inside a zone. Renderers use zeros/criticalPoints for that.
    expect(() =>
      parsePedagogicalVisual(
        makeSignChart({
          signZones: [
            { lowerBound: null, upperBound: -2, sign: "+" },
            { lowerBound: -2, upperBound: 0, sign: "-" },
            { lowerBound: 0, upperBound: 3, sign: "0" },
            { lowerBound: 3, upperBound: null, sign: "+" },
          ],
        })
      )
    ).toThrow(/sign/);
  });
  test("sign-chart: rejects wrong number of signZones for critical points", () => {
    // zeros [-2,3] + excluded [0] = 3 critical points → expects 4 zones, not 3
    expect(() =>
      parsePedagogicalVisual(
        makeSignChart({
          signZones: [
            { lowerBound: null, upperBound: -2, sign: "+" },
            { lowerBound: -2, upperBound: 3, sign: "-" },
            { lowerBound: 3, upperBound: null, sign: "+" },
          ],
        })
      )
    ).toThrow(/signZones/);
  });
  test("sign-chart: rejects overlapping zero and excluded point", () => {
    expect(() =>
      parsePedagogicalVisual(
        makeSignChart({ zeros: [0], excludedPoints: [0], signZones: [{ lowerBound: null, upperBound: 0, sign: "+" }, { lowerBound: 0, upperBound: null, sign: "-" }] })
      )
    ).toThrow(/overlap/);
  });
  test("sign-chart: rejects duplicate zeros", () => {
    expect(() =>
      parsePedagogicalVisual(
        makeSignChart({ zeros: [2, 2], excludedPoints: [], signZones: [{ lowerBound: null, upperBound: 2, sign: "+" }, { lowerBound: 2, upperBound: null, sign: "-" }] })
      )
    ).toThrow(/duplicate/);
  });
  test("sign-chart: rejects duplicate excluded points", () => {
    expect(() =>
      parsePedagogicalVisual(
        makeSignChart({ zeros: [], excludedPoints: [1, 1], signZones: [{ lowerBound: null, upperBound: 1, sign: "+" }, { lowerBound: 1, upperBound: null, sign: "-" }] })
      )
    ).toThrow(/duplicate/);
  });
  test("sign-chart: rejects zone with wrong lower bound", () => {
    // Critical points [-2, 0, 3]; zone 1 must start at -2.
    expect(() =>
      parsePedagogicalVisual(
        makeSignChart({
          signZones: [
            { lowerBound: null, upperBound: -2, sign: "+" },
            { lowerBound: -1, upperBound: 0, sign: "-" },
            { lowerBound: 0, upperBound: 3, sign: "-" },
            { lowerBound: 3, upperBound: null, sign: "+" },
          ],
        })
      )
    ).toThrow(/topology/);
  });
  test("sign-chart: rejects zone with wrong upper bound", () => {
    // Critical points [-2, 0, 3]; zone 2 must end at 3.
    expect(() =>
      parsePedagogicalVisual(
        makeSignChart({
          signZones: [
            { lowerBound: null, upperBound: -2, sign: "+" },
            { lowerBound: -2, upperBound: 0, sign: "-" },
            { lowerBound: 0, upperBound: 2, sign: "-" },
            { lowerBound: 3, upperBound: null, sign: "+" },
          ],
        })
      )
    ).toThrow(/topology/);
  });
  test("sign-chart: rejects zones with swapped bounds", () => {
    // lowerBound must be strictly less than upperBound.
    expect(() =>
      parsePedagogicalVisual(
        makeSignChart({
          signZones: [
            { lowerBound: null, upperBound: -2, sign: "+" },
            { lowerBound: 0, upperBound: -2, sign: "-" },
            { lowerBound: 0, upperBound: 3, sign: "-" },
            { lowerBound: 3, upperBound: null, sign: "+" },
          ],
        })
      )
    ).toThrow(/lowerBound/);
  });
  test("sign-chart: rejects non-numeric bound", () => {
    expect(() =>
      parsePedagogicalVisual(
        makeSignChart({
          signZones: [
            { lowerBound: "-∞", upperBound: -2, sign: "+" },
            { lowerBound: -2, upperBound: 0, sign: "-" },
            { lowerBound: 0, upperBound: 3, sign: "-" },
            { lowerBound: 3, upperBound: null, sign: "+" },
          ],
        })
      )
    ).toThrow(/lowerBound/);
  });
  test("sign-chart: rejects free-form intervalLabel", () => {
    expect(() =>
      parsePedagogicalVisual(
        makeSignChart({
          signZones: [
            { intervalLabel: "(-∞, -2)", sign: "+" },
            { lowerBound: -2, upperBound: 0, sign: "-" },
            { lowerBound: 0, upperBound: 3, sign: "-" },
            { lowerBound: 3, upperBound: null, sign: "+" },
          ],
        })
      )
    ).toThrow(/lowerBound/);
  });

  test.each([["lt"], ["le"], ["gt"], ["ge"]])("distance-on-line: accepts %s", (inequality) => {
    const v = assertDistanceOnLine(parsePedagogicalVisual(make({ kind: "distance-on-line", center: 2, distance: 3, inequality })));
    expect(v).toMatchObject({ kind: "distance-on-line", center: 2, distance: 3, inequality });
  });
  test("distance-on-line: rejects non-positive distance", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "distance-on-line", center: 1, distance: 0, inequality: "lt" }))).toThrow(/distance/);
    expect(() => parsePedagogicalVisual(make({ kind: "distance-on-line", center: 1, distance: -2, inequality: "lt" }))).toThrow(/distance/);
  });
  test("distance-on-line: rejects bad inequality", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "distance-on-line", center: 1, distance: 2, inequality: "neq" }))).toThrow(/inequality/);
  });

  test.each([
    { form: "slope-intercept", slope: 2, intercept: -1 },
    { form: "point-slope", slope: 1, point: { x: 2, y: 3 } },
    { form: "two-point", points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    { form: "horizontal", constant: 4 },
    { form: "vertical", constant: -3 },
  ] as const)("cartesian-line: $form", (extra) => {
    const v = assertCartesianLine(parsePedagogicalVisual(make({ kind: "cartesian-line", ...extra })));
    expect(v.kind).toBe("cartesian-line");
    expect(v.form).toBe(extra.form);
  });
  test("cartesian-line: rejects unknown form", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "cartesian-line", form: "polar" }))).toThrow(/form/);
  });
  test("cartesian-line: two-point requires exactly 2 points", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "cartesian-line", form: "two-point", points: [{ x: 0, y: 0 }] }))).toThrow(/points/);
    expect(() => parsePedagogicalVisual(make({ kind: "cartesian-line", form: "two-point", points: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }] }))).toThrow(/points/);
  });
  test("cartesian-line: two-point rejects identical points", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "cartesian-line", form: "two-point", points: [{ x: 1, y: 2 }, { x: 1, y: 2 }] }))).toThrow(/identical/);
  });

  test("systems-of-lines: secant", () => {
    const v = assertSystemsOfLines(parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "secant", lines: [{ form: "slope-intercept", slope: 1, intercept: 0 }, { form: "slope-intercept", slope: -1, intercept: 2 }], intersection: { x: 1, y: 1 } })));
    expect(v).toMatchObject({ kind: "systems-of-lines", classification: "secant", intersection: { x: 1, y: 1 } });
    expect(v.lines).toHaveLength(2);
    // Type-level guard: lines must be exactly a 2-tuple, not an arbitrary array.
    function expectTuple(lines: readonly [CartesianLineData, CartesianLineData]): void {
      expect(lines).toHaveLength(2);
    }
    expectTuple(v.lines);
    // Runtime discriminated-union guard: secant always carries intersection.
    expect("intersection" in v).toBe(true);
  });
  test("systems-of-lines: secant narrows intersection to a required Point", () => {
    const v = assertSystemsOfLines(parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "secant", lines: [{ form: "slope-intercept", slope: 1, intercept: 0 }, { form: "slope-intercept", slope: -1, intercept: 2 }], intersection: { x: 1, y: 1 } })));
    if (v.classification === "secant") {
      // This line only type-checks when the discriminated union makes
      // intersection required (not optional) for the secant branch.
      const point = v.intersection;
      expect(point.x).toBe(1);
      expect(point.y).toBe(1);
    } else {
      expect.fail("expected secant classification");
    }
  });
  test("systems-of-lines: parallel without intersection", () => {
    const v = assertSystemsOfLines(parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "parallel", lines: [{ form: "slope-intercept", slope: 2, intercept: 0 }, { form: "slope-intercept", slope: 2, intercept: 3 }] })));
    expect(v.classification).toBe("parallel");
    // Runtime discriminated-union guard: parallel must not carry an intersection key.
    expect("intersection" in v).toBe(false);
  });
  test("systems-of-lines: coincident", () => {
    const v = assertSystemsOfLines(parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "coincident", lines: [{ form: "slope-intercept", slope: 2, intercept: 1 }, { form: "slope-intercept", slope: 2, intercept: 1 }] })));
    expect(v.classification).toBe("coincident");
    // Runtime discriminated-union guard: coincident must not carry an intersection key.
    expect("intersection" in v).toBe(false);
  });
  test("systems-of-lines: rejects wrong line count", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "secant", lines: [{ form: "slope-intercept", slope: 1, intercept: 0 }], intersection: { x: 0, y: 0 } }))).toThrow(/lines/);
  });
  test("systems-of-lines: secant requires intersection", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "secant", lines: [{ form: "slope-intercept", slope: 1, intercept: 0 }, { form: "slope-intercept", slope: -1, intercept: 2 }] }))).toThrow(/intersection/);
  });
  test("systems-of-lines: rejects parallel classification for coincident lines", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "parallel", lines: [{ form: "slope-intercept", slope: 2, intercept: 1 }, { form: "slope-intercept", slope: 2, intercept: 1 }] }))).toThrow(/parallel|coincident/);
  });
  test("systems-of-lines: rejects coincident classification for non-coincident lines", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "coincident", lines: [{ form: "slope-intercept", slope: 2, intercept: 0 }, { form: "slope-intercept", slope: 2, intercept: 3 }] }))).toThrow(/coincident/);
  });
  test("systems-of-lines: rejects secant classification for parallel lines", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "secant", lines: [{ form: "slope-intercept", slope: 2, intercept: 0 }, { form: "slope-intercept", slope: 2, intercept: 3 }], intersection: { x: 0, y: 0 } }))).toThrow(/parallel|secant/);
  });
  test("systems-of-lines: rejects secant when declared intersection does not satisfy both lines", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "secant", lines: [{ form: "slope-intercept", slope: 1, intercept: 0 }, { form: "slope-intercept", slope: -1, intercept: 2 }], intersection: { x: 5, y: 5 } }))).toThrow(/intersection/);
  });
  test("systems-of-lines: rejects intersection declared for parallel lines", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "parallel", lines: [{ form: "slope-intercept", slope: 2, intercept: 0 }, { form: "slope-intercept", slope: 2, intercept: 3 }], intersection: { x: 0, y: 0 } }))).toThrow(/intersection/);
  });

  test("systems-of-lines: vertical + horizontal secant", () => {
    const v = assertSystemsOfLines(parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "secant", lines: [{ form: "vertical", constant: 2 }, { form: "horizontal", constant: 3 }], intersection: { x: 2, y: 3 } })));
    expect(v.classification).toBe("secant");
    expect("intersection" in v).toBe(true);
    if (v.classification === "secant") {
      expect(v.intersection).toEqual({ x: 2, y: 3 });
    }
  });
  test("systems-of-lines: two vertical parallel", () => {
    const v = assertSystemsOfLines(parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "parallel", lines: [{ form: "vertical", constant: 1 }, { form: "vertical", constant: 4 }] })));
    expect(v.classification).toBe("parallel");
    expect("intersection" in v).toBe(false);
  });
  test("systems-of-lines: two horizontal parallel", () => {
    const v = assertSystemsOfLines(parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "parallel", lines: [{ form: "horizontal", constant: -1 }, { form: "horizontal", constant: 2 }] })));
    expect(v.classification).toBe("parallel");
    expect("intersection" in v).toBe(false);
  });
  test("systems-of-lines: two vertical coincident", () => {
    const v = assertSystemsOfLines(parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "coincident", lines: [{ form: "vertical", constant: 5 }, { form: "vertical", constant: 5 }] })));
    expect(v.classification).toBe("coincident");
    expect("intersection" in v).toBe(false);
  });
  test("systems-of-lines: two horizontal coincident", () => {
    const v = assertSystemsOfLines(parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "coincident", lines: [{ form: "horizontal", constant: 2 }, { form: "horizontal", constant: 2 }] })));
    expect(v.classification).toBe("coincident");
    expect("intersection" in v).toBe(false);
  });
  test("systems-of-lines: vertical + slope-intercept secant", () => {
    const v = assertSystemsOfLines(parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "secant", lines: [{ form: "vertical", constant: 2 }, { form: "slope-intercept", slope: 1, intercept: 0 }], intersection: { x: 2, y: 2 } })));
    expect(v.classification).toBe("secant");
    expect("intersection" in v).toBe(true);
    if (v.classification === "secant") {
      expect(v.intersection).toEqual({ x: 2, y: 2 });
    }
  });
  test("systems-of-lines: horizontal + slope-intercept secant", () => {
    const v = assertSystemsOfLines(parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "secant", lines: [{ form: "horizontal", constant: 3 }, { form: "slope-intercept", slope: 2, intercept: -1 }], intersection: { x: 2, y: 3 } })));
    expect(v.classification).toBe("secant");
    expect("intersection" in v).toBe(true);
    if (v.classification === "secant") {
      expect(v.intersection).toEqual({ x: 2, y: 3 });
    }
  });
  test("systems-of-lines: rejects parallel classification for vertical + horizontal", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "parallel", lines: [{ form: "vertical", constant: 2 }, { form: "horizontal", constant: 3 }] }))).toThrow(/parallel/);
  });
  test("systems-of-lines: rejects secant without intersection for vertical + horizontal", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "systems-of-lines", classification: "secant", lines: [{ form: "vertical", constant: 2 }, { form: "horizontal", constant: 3 }] }))).toThrow(/intersection/);
  });

  test("rejects unsupported kind", () => {
    expect(() => parsePedagogicalVisual(make({ kind: "pie-chart" }))).toThrow(/kind/);
  });
  test.each(["id", "title", "ariaLabel", "description"])("rejects missing %s", (field) => {
    const chart = makeSignChart();
    const { [field]: _removed, ...withoutField } = chart;
    expect(() => parsePedagogicalVisual(withoutField)).toThrow(new RegExp(field));
  });
  test("rejects non-object input", () => {
    expect(() => parsePedagogicalVisual("x")).toThrow(/object/);
  });
});

describe("parseOptionalVisualExamples", () => {
  test("returns undefined for missing/empty", () => {
    expect(parseOptionalVisualExamples(undefined, "ctx")).toBeUndefined();
    expect(parseOptionalVisualExamples([], "ctx")).toBeUndefined();
  });
  test("throws when explicit null", () => {
    expect(() => parseOptionalVisualExamples(null, "ctx")).toThrow(/visualExamples/);
  });
  test("throws when present but not an array", () => {
    expect(() => parseOptionalVisualExamples("not-an-array", "ctx")).toThrow(/visualExamples/);
    expect(() => parseOptionalVisualExamples({ kind: "sign-chart" }, "ctx")).toThrow(/visualExamples/);
  });
  test("parses array and preserves order", () => {
    const result = parseOptionalVisualExamples(
      [
        makeSignChart({
          zeros: [1],
          excludedPoints: [],
          signZones: [
            { lowerBound: null, upperBound: 1, sign: "-" },
            { lowerBound: 1, upperBound: null, sign: "+" },
          ],
        }),
        make({ kind: "distance-on-line", center: 0, distance: 2, inequality: "lt" }),
      ],
      "ctx"
    );
    expect(result).toHaveLength(2);
    if (result) {
      expect(result[0].kind).toBe("sign-chart");
      expect(result[1].kind).toBe("distance-on-line");
    }
  });
  test("throws with indexed context", () => {
    const raw = [make({ kind: "sign-chart", variable: "x", zeros: ["bad"], excludedPoints: [] })];
    expect(() => parseOptionalVisualExamples(raw, "ctx")).toThrow(/visualExamples\[0\]/);
  });
});

describe("layout helpers", () => {
  test("linearScale maps values", () => {
    const s = linearScale([0, 10], [0, 100]);
    expect(s.valueToPx(5)).toBe(50);
  });
  test("solveLinearSystem intersects two secant lines", () => {
    expect(solveLinearSystem(lineToStandardForm({ form: "slope-intercept", slope: 1, intercept: 0 }), lineToStandardForm({ form: "slope-intercept", slope: -1, intercept: 2 }))).toEqual({ x: 1, y: 1 });
  });
  test("solveLinearSystem returns null for parallel lines", () => {
    expect(solveLinearSystem(lineToStandardForm({ form: "slope-intercept", slope: 2, intercept: 0 }), lineToStandardForm({ form: "slope-intercept", slope: 2, intercept: 3 }))).toBeNull();
  });
});
