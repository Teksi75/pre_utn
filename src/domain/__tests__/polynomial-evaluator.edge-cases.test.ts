import { describe, test, expect } from "vitest";
import { parsePolynomial, expand, polynomialsEqual, areEquivalent } from "../evaluator/polynomial-evaluator";
import { PolynomialParseError } from "../evaluator/polynomial-types";
import type { Polynomial } from "../evaluator/polynomial-types";

describe("Polynomial evaluator — edge cases (U2-POLY-008, U2-POLY-009)", () => {
  describe("zero polynomial", () => {
    test("parsePolynomial('0') returns [0]", () => {
      const result = parsePolynomial("0");
      expect(result.coefficients).toEqual([0]);
      expect(result.coefficients).toHaveLength(1);
    });

    test("parsePolynomial([0]) returns [0]", () => {
      const result = parsePolynomial([0]);
      expect(result.coefficients).toEqual([0]);
    });

    test("parsePolynomial([0, 0, 0]) normalizes to [0]", () => {
      const result = parsePolynomial([0, 0, 0]);
      expect(result.coefficients).toEqual([0]);
      expect(result.coefficients).toHaveLength(1);
    });

    test("zero polynomial is idempotent under expand", () => {
      const zero = parsePolynomial("0");
      const expanded = expand(zero);
      expect(expanded.coefficients).toEqual([0]);
    });
  });

  describe("leading zeros normalization", () => {
    test("[0, 0, 3, 1] strips to [3, 1]", () => {
      const result = parsePolynomial([0, 0, 3, 1]);
      expect(result.coefficients).toEqual([3, 1]);
    });

    test("[0, 1] strips to [1]", () => {
      const result = parsePolynomial([0, 1]);
      expect(result.coefficients).toEqual([1]);
    });

    test("[0, 0, 1, 2, 3] strips to [1, 2, 3]", () => {
      const result = parsePolynomial([0, 0, 1, 2, 3]);
      expect(result.coefficients).toEqual([1, 2, 3]);
    });
  });

  describe("Number.MAX_SAFE_INTEGER boundary", () => {
    test("coefficients at MAX_SAFE_INTEGER are preserved exactly", () => {
      const max = Number.MAX_SAFE_INTEGER;
      const result = parsePolynomial([max, 1]);
      expect(result.coefficients).toEqual([max, 1]);
      expect(result.coefficients[0]).toBe(max);
    });

    test("polynomials with MAX_SAFE_INTEGER coefficients compare correctly", () => {
      const max = Number.MAX_SAFE_INTEGER;
      const a = parsePolynomial([max, 1]);
      const b = parsePolynomial([max, 1]);
      expect(polynomialsEqual(a, b)).toBe(true);
    });

    test("MAX_SAFE_INTEGER + 1 crosses boundary (floating-point caveat)", () => {
      // This documents the behavior: JS can't represent MAX_SAFE_INTEGER + 1 exactly
      // The polynomial evaluator should still work correctly for all values ≤ MAX_SAFE_INTEGER
      const maxPlusOne = Number.MAX_SAFE_INTEGER + 1;
      expect(maxPlusOne).not.toBe(Number.MAX_SAFE_INTEGER);
      // It should still parse and represent the coefficient
      const result = parsePolynomial([maxPlusOne, 1]);
      expect(result.coefficients[0]).toBe(maxPlusOne);
    });
  });

  describe("negative coefficients", () => {
    test("parsePolynomial with all negative coefficients", () => {
      const result = parsePolynomial("-x^2 - 3x - 5");
      expect(result.coefficients).toEqual([-1, -3, -5]);
    });

    test("areEquivalent with negative coefficients in factored form", () => {
      // (x+2)(-x+1) expands to -x² - x + 2
      expect(areEquivalent("(x+2)(-x+1)", "-x^2 - x + 2")).toBe(true);
    });
  });

  describe("constant polynomial", () => {
    test("constant 42 from string", () => {
      const result = parsePolynomial("42");
      expect(result.coefficients).toEqual([42]);
    });

    test("constant -7 from string with unicode minus", () => {
      const result = parsePolynomial("−7");
      expect(result.coefficients).toEqual([-7]);
    });

    test("two constants are equivalent when equal", () => {
      expect(areEquivalent("42", [42])).toBe(true);
    });

    test("two constants are not equivalent when different", () => {
      expect(areEquivalent("42", "43")).toBe(false);
    });
  });

  describe("degree 1 (linear) polynomial", () => {
    test("linear polynomial x + 1", () => {
      const result = parsePolynomial("x + 1");
      expect(result.coefficients).toEqual([1, 1]);
    });

    test("linear polynomial 3x - 7", () => {
      const result = parsePolynomial("3x - 7");
      expect(result.coefficients).toEqual([3, -7]);
    });

    test("linear polynomial from factored form (x-5)", () => {
      const result = parsePolynomial("(x-5)");
      expect(result.coefficients).toEqual([1, -5]);
    });
  });

  describe("floating-point coefficient edge cases", () => {
    test("float coefficient 0.5x^2 + 1.5x - 2.5", () => {
      const result = parsePolynomial("0.5x^2 + 1.5x - 2.5");
      expect(result.coefficients).toEqual([0.5, 1.5, -2.5]);
    });

    test("float coefficients equivalence", () => {
      expect(areEquivalent("0.5x + 1", "0.50x + 1")).toBe(true);
    });
  });

  describe("empty or degenerate inputs", () => {
    test("empty string throws PolynomialParseError", () => {
      expect(() => parsePolynomial("")).toThrow(PolynomialParseError);
    });

    test("whitespace-only string throws", () => {
      expect(() => parsePolynomial("   ")).toThrow(PolynomialParseError);
    });

    test("empty coefficient array throws PolynomialParseError", () => {
      expect(() => parsePolynomial([])).toThrow(PolynomialParseError);
    });
  });

  describe("polynomial with only zero-coefficient terms", () => {
    test("0x^2 + 0x + 0 normalizes to [0]", () => {
      const result = parsePolynomial("0x^2 + 0x + 0");
      expect(result.coefficients).toEqual([0]);
    });
  });
});
