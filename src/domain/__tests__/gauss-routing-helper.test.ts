/**
 * Gauss routing helper — parse rational roots, normalize, and compare sets.
 * Strict TDD: RED phase first (this file written before implementation exists).
 *
 * Spec coverage: U2FAC-EVAL-006, U2FAC-EVAL-007, U2FAC-EVAL-008
 */
import { describe, test, expect } from "vitest";
import {
  parseRationalRoots,
  normalizeRoots,
  areEquivalentRoots,
  GaussParseError,
  GaussEquivalenceError,
} from "../evaluator/gauss-routing-helper";

// ---------------------------------------------------------------------------
// parseRationalRoots
// ---------------------------------------------------------------------------

describe("parseRationalRoots", () => {
  test("parses a comma-separated list of whole roots", () => {
    const result = parseRationalRoots("1, -3, 4");
    expect(result).toEqual([1, -3, 4]);
  });

  test("parses a comma-separated list with fractions", () => {
    const result = parseRationalRoots("1/2, -3/2, 4");
    expect(result).toEqual([0.5, -1.5, 4]);
  });

  test("handles a single decimal root", () => {
    const result = parseRationalRoots("0.5");
    expect(result).toEqual([0.5]);
  });

  test("handles a mix of integers, fractions, and decimals", () => {
    const result = parseRationalRoots("1.5, 1/2, -3/2, 2");
    expect(result).toEqual([1.5, 0.5, -1.5, 2]);
  });

  test("handles spaces around tokens", () => {
    const result = parseRationalRoots(" 1/2 , -3/2 ,  4 ");
    expect(result).toEqual([0.5, -1.5, 4]);
  });

  test("handles whitespace-separated tokens without commas", () => {
    const result = parseRationalRoots("1/2 -3/2 4");
    expect(result).toEqual([0.5, -1.5, 4]);
  });

  test("returns empty array for empty string", () => {
    const result = parseRationalRoots("");
    expect(result).toEqual([]);
  });

  test("returns empty array for whitespace-only string", () => {
    const result = parseRationalRoots("   ");
    expect(result).toEqual([]);
  });

  test("trims trailing comma gracefully", () => {
    const result = parseRationalRoots("1/2,");
    expect(result).toEqual([0.5]);
  });

  test("throws GaussParseError on invalid token", () => {
    expect(() => parseRationalRoots("abc")).toThrow(GaussParseError);
  });

  test("throws GaussParseError on division by zero", () => {
    expect(() => parseRationalRoots("1/0")).toThrow(GaussParseError);
  });

  test("throws GaussParseError on multiple slashes", () => {
    expect(() => parseRationalRoots("1/2/3")).toThrow(GaussParseError);
  });
});

// ---------------------------------------------------------------------------
// normalizeRoots
// ---------------------------------------------------------------------------

describe("normalizeRoots", () => {
  test("sorts ascending", () => {
    const result = normalizeRoots([3, 1, 2]);
    expect(result).toEqual([1, 2, 3]);
  });

  test("deduplicates identical roots", () => {
    const result = normalizeRoots([0.5, -1.5, 0.5]);
    expect(result).toEqual([-1.5, 0.5]);
  });

  test("handles single element", () => {
    const result = normalizeRoots([42]);
    expect(result).toEqual([42]);
  });

  test("handles empty array", () => {
    const result = normalizeRoots([]);
    expect(result).toEqual([]);
  });

  test("does not mutate input", () => {
    const input: readonly number[] = [3, 1, 2];
    const copy = [...input];
    normalizeRoots(input);
    expect(input).toEqual(copy);
  });
});

// ---------------------------------------------------------------------------
// areEquivalentRoots
// ---------------------------------------------------------------------------

describe("areEquivalentRoots", () => {
  test("same roots in same order are equivalent", () => {
    expect(areEquivalentRoots([1, -1.5, 0.5], [0.5, -1.5, 1])).toBe(true);
  });

  test("same roots in different order are equivalent", () => {
    expect(areEquivalentRoots([1, -3, 0.5], [-3, 0.5, 1])).toBe(true);
  });

  test("extra root in student makes sets not equivalent", () => {
    expect(areEquivalentRoots([1, -3], [1, -3, 2])).toBe(false);
  });

  test("missing root in student makes sets not equivalent", () => {
    expect(areEquivalentRoots([1, -3, 2], [1, -3])).toBe(false);
  });

  test("completely different roots are not equivalent", () => {
    expect(areEquivalentRoots([1, 2], [3, 4])).toBe(false);
  });

  test("sign difference makes sets not equivalent", () => {
    expect(areEquivalentRoots([1, -3], [1, 3])).toBe(false);
  });

  test("both empty sets are equivalent", () => {
    expect(areEquivalentRoots([], [])).toBe(true);
  });

  test("recurring decimal within tolerance is equivalent (1/3 ≈ 0.333333333)", () => {
    expect(areEquivalentRoots([1 / 3], [0.333333333])).toBe(true);
  });

  test("recurring decimal outside tolerance is not equivalent", () => {
    // 0.3333 differs from 1/3 by ~0.0000333 which is > 1e-9
    expect(areEquivalentRoots([1 / 3], [0.33])).toBe(false);
  });

  test("custom tolerance can be provided", () => {
    // 0.33 vs 1/3 with tolerance 0.1 is close enough
    expect(areEquivalentRoots([1 / 3], [0.33], 0.1)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// GaussParseError
// ---------------------------------------------------------------------------

describe("GaussParseError", () => {
  test("is instance of Error", () => {
    const err = new GaussParseError(0, "invalid character");
    expect(err).toBeInstanceOf(Error);
  });

  test("has position and reason", () => {
    const err = new GaussParseError(5, "division by zero");
    expect(err.message).toContain("5");
    expect(err.message).toContain("division by zero");
  });
});

// ---------------------------------------------------------------------------
// GaussEquivalenceError
// ---------------------------------------------------------------------------

describe("GaussEquivalenceError", () => {
  test("is instance of Error", () => {
    const err = new GaussEquivalenceError("root count mismatch");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain("root count mismatch");
  });
});
