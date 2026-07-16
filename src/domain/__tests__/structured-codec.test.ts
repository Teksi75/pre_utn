import { describe, expect, test } from "vitest";
import {
  parseStructuredSubmissionV1,
  serializeStructuredSubmissionV1,
  normalizePiRational,
  normalizeAngleDms,
} from "../evaluator/structured";

describe("parseStructuredSubmissionV1 + serializeStructuredSubmissionV1 round-trip", () => {
  test("valid pi-rational JSON v1 parses to a typed submission", () => {
    const raw = JSON.stringify({
      v: 1,
      kind: "pi-rational",
      numerator: 1,
      denominator: 5,
      decimal: 0.6283,
    });
    const parsed = parseStructuredSubmissionV1(raw);
    expect(parsed.kind).toBe("pi-rational");
    if (parsed.kind === "pi-rational") {
      expect(parsed.numerator).toBe(1);
      expect(parsed.denominator).toBe(5);
      expect(parsed.decimal).toBe(0.6283);
    }
  });

  test("valid angle-dms JSON v1 parses to a typed submission", () => {
    const raw = JSON.stringify({
      v: 1,
      kind: "angle-dms",
      degrees: 11,
      minutes: 27,
      seconds: 33,
    });
    const parsed = parseStructuredSubmissionV1(raw);
    expect(parsed.kind).toBe("angle-dms");
    if (parsed.kind === "angle-dms") {
      expect(parsed.degrees).toBe(11);
      expect(parsed.minutes).toBe(27);
      expect(parsed.seconds).toBe(33);
    }
  });

  test("serialize then parse round-trips a pi-rational submission (parsing normalizes the fraction)", () => {
    // The parser canonicalizes — 2/10 reduces to 1/5 after parse. The
    // envelope (v=1, kind, decimal) is preserved verbatim.
    const obj = { v: 1, kind: "pi-rational", numerator: 2, denominator: 10, decimal: 0.6283 };
    const serialized = serializeStructuredSubmissionV1(obj);
    const parsed = parseStructuredSubmissionV1(serialized);
    expect(parsed).toEqual({ v: 1, kind: "pi-rational", numerator: 1, denominator: 5, decimal: 0.6283 });
  });

  test("serialize then parse round-trips an angle-dms submission", () => {
    const obj = { v: 1, kind: "angle-dms", degrees: 11, minutes: 27, seconds: 33 };
    const serialized = serializeStructuredSubmissionV1(obj);
    const parsed = parseStructuredSubmissionV1(serialized);
    expect(parsed).toEqual(obj);
  });

  test("malformed JSON throws", () => {
    expect(() => parseStructuredSubmissionV1("not-json")).toThrow();
    expect(() => parseStructuredSubmissionV1("")).toThrow();
    expect(() => parseStructuredSubmissionV1("{}")).toThrow();
  });

  test("unknown kind is rejected", () => {
    const raw = JSON.stringify({ v: 1, kind: "set-tuple", payload: [] });
    expect(() => parseStructuredSubmissionV1(raw)).toThrow();
  });

  test("version != 1 is rejected", () => {
    expect(() =>
      parseStructuredSubmissionV1(
        JSON.stringify({ v: 2, kind: "pi-rational", numerator: 1, denominator: 5, decimal: 0.6283 })
      )
    ).toThrow();
  });

  test("missing v is rejected", () => {
    expect(() =>
      parseStructuredSubmissionV1(
        JSON.stringify({ kind: "pi-rational", numerator: 1, denominator: 5, decimal: 0.6283 })
      )
    ).toThrow();
  });

  test("pi-rational missing denominator is rejected", () => {
    expect(() =>
      parseStructuredSubmissionV1(
        JSON.stringify({ v: 1, kind: "pi-rational", numerator: 1, decimal: 0.6283 })
      )
    ).toThrow();
  });
});

describe("normalizePiRational", () => {
  test("reduces a fraction by GCD", () => {
    expect(normalizePiRational({ numerator: 2, denominator: 10, decimal: 0.6283 })).toEqual({
      numerator: 1,
      denominator: 5,
      decimal: 0.6283,
    });
  });

  test("places sign on the numerator when denominator would go negative", () => {
    expect(normalizePiRational({ numerator: 1, denominator: -5, decimal: 0.6283 })).toEqual({
      numerator: -1,
      denominator: 5,
      decimal: 0.6283,
    });
  });

  test("preserves an already-reduced fraction", () => {
    expect(normalizePiRational({ numerator: 5, denominator: 4, decimal: 3.9269 })).toEqual({
      numerator: 5,
      denominator: 4,
      decimal: 3.9269,
    });
  });

  test("zero numerator reduces to {0, 1}", () => {
    expect(normalizePiRational({ numerator: 0, denominator: 7, decimal: 0 })).toEqual({
      numerator: 0,
      denominator: 1,
      decimal: 0,
    });
  });

  test("reduces a larger fraction", () => {
    expect(normalizePiRational({ numerator: 12, denominator: 30, decimal: 0 })).toEqual({
      numerator: 2,
      denominator: 5,
      decimal: 0,
    });
  });

  test("rejects denominator = 0", () => {
    expect(() => normalizePiRational({ numerator: 1, denominator: 0, decimal: 0 })).toThrow();
  });

  test("rejects non-integer numerator", () => {
    expect(() => normalizePiRational({ numerator: 1.5, denominator: 2, decimal: 0 })).toThrow();
  });

  test("rejects non-integer denominator", () => {
    expect(() => normalizePiRational({ numerator: 1, denominator: 2.5, decimal: 0 })).toThrow();
  });
});

describe("normalizeAngleDms", () => {
  test("accepts canonical {11, 27, 33}", () => {
    expect(normalizeAngleDms({ degrees: 11, minutes: 27, seconds: 33 })).toEqual({
      degrees: 11,
      minutes: 27,
      seconds: 33,
    });
  });

  test("accepts fractional seconds (32.7)", () => {
    expect(normalizeAngleDms({ degrees: 11, minutes: 27, seconds: 32.7 })).toEqual({
      degrees: 11,
      minutes: 27,
      seconds: 32.7,
    });
  });

  test("rejects minutes = 60", () => {
    expect(() => normalizeAngleDms({ degrees: 11, minutes: 60, seconds: 33 })).toThrow();
  });

  test("rejects seconds = 60", () => {
    expect(() => normalizeAngleDms({ degrees: 11, minutes: 27, seconds: 60 })).toThrow();
  });

  test("rejects negative minutes", () => {
    expect(() => normalizeAngleDms({ degrees: 11, minutes: -1, seconds: 33 })).toThrow();
  });

  test("rejects negative seconds", () => {
    expect(() => normalizeAngleDms({ degrees: 11, minutes: 27, seconds: -0.1 })).toThrow();
  });

  test("rejects non-integer minutes", () => {
    expect(() => normalizeAngleDms({ degrees: 11, minutes: 27.5, seconds: 33 })).toThrow();
  });
});