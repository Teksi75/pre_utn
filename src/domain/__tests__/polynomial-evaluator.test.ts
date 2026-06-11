import { describe, test, expect } from "vitest";
import { PolynomialParseError, UnsupportedPolynomialFormError } from "../evaluator/polynomial-types";
import { parsePolynomial, expand, polynomialsEqual, areEquivalent } from "../evaluator/polynomial-evaluator";
import type { Polynomial } from "../evaluator/polynomial-types";

describe("Polynomial type", () => {
  test("U2-POLY-006: PolynomialParseError exposes position and reason", () => {
    const err = new PolynomialParseError(7, "unexpected token '*'");

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PolynomialParseError);
    expect(err.position).toBe(7);
    expect(err.reason).toBe("unexpected token '*'");
    expect(err.message).toContain("7");
    expect(err.message).toContain("unexpected token '*'");
  });

  test("U2-POLY-007: UnsupportedPolynomialFormError exposes formType and reason", () => {
    const err = new UnsupportedPolynomialFormError("multivariate", "only single-variable polynomials are supported");

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(UnsupportedPolynomialFormError);
    expect(err.formType).toBe("multivariate");
    expect(err.reason).toBe("only single-variable polynomials are supported");
  });

  test("PolynomialParseError has a descriptive name", () => {
    const err = new PolynomialParseError(0, "empty input");

    expect(err.name).toBe("PolynomialParseError");
  });

  test("UnsupportedPolynomialFormError has a descriptive name", () => {
    const err = new UnsupportedPolynomialFormError("multivariate", "not supported");

    expect(err.name).toBe("UnsupportedPolynomialFormError");
  });
});

describe("Polynomial interface shape", () => {
  test("Polynomial has readonly coefficients in descending degree order and variable", () => {
    // Type-level assertion: create an object matching the Polynomial interface.
    const poly: Polynomial = {
      coefficients: [2, -5, 1],
      variable: "x",
    };

    expect(poly.coefficients).toEqual([2, -5, 1]);
    expect(poly.variable).toBe("x");
  });

  test("Polynomial with zero degree (constant) has single coefficient", () => {
    const poly: Polynomial = {
      coefficients: [42],
      variable: "x",
    };

    expect(poly.coefficients).toEqual([42]);
    expect(poly.coefficients).toHaveLength(1);
  });

  test("Polynomial zero is represented as [0] with degree 0", () => {
    const poly: Polynomial = {
      coefficients: [0],
      variable: "x",
    };

    expect(poly.coefficients).toEqual([0]);
    expect(poly.coefficients).toHaveLength(1);
  });
});

// ============================================================================
// Task 1.2: parsePolynomial — coefficient array form
// ============================================================================

describe("parsePolynomial — array form (U2-POLY-003)", () => {
  test("parses [1, 0, -4] as 1*x² + 0*x − 4", () => {
    const result = parsePolynomial([1, 0, -4]);

    expect(result.coefficients).toEqual([1, 0, -4]);
    expect(result.variable).toBe("x");
  });

  test("parses constant polynomial [5] as degree 0", () => {
    const result = parsePolynomial([5]);

    expect(result.coefficients).toEqual([5]);
    expect(result.variable).toBe("x");
  });

  test("U2-POLY-009: strips leading zeros (normalization)", () => {
    const result = parsePolynomial([0, 0, 3, 1]);

    expect(result.coefficients).toEqual([3, 1]);
  });

  test("parses [0] as zero polynomial", () => {
    const result = parsePolynomial([0]);

    expect(result.coefficients).toEqual([0]);
  });

  test("parses single-element array [-2] as constant", () => {
    const result = parsePolynomial([-2]);

    expect(result.coefficients).toEqual([-2]);
  });
});

// ============================================================================
// Task 1.3: parsePolynomial — expanded monomial form
// ============================================================================

describe("parsePolynomial — expanded form (U2-POLY-001)", () => {
  test("parses 2x^2 - 5x + 1", () => {
    const result = parsePolynomial("2x^2 - 5x + 1");

    expect(result.coefficients).toEqual([2, -5, 1]);
    expect(result.variable).toBe("x");
  });

  test("parses x^2 + x - 6 (implicit coefficient 1)", () => {
    const result = parsePolynomial("x^2 + x - 6");

    expect(result.coefficients).toEqual([1, 1, -6]);
  });

  test("parses -3x + 1 (negative leading coefficient)", () => {
    const result = parsePolynomial("-3x + 1");

    expect(result.coefficients).toEqual([-3, 1]);
  });

  test("parses x (linear monomial)", () => {
    const result = parsePolynomial("x");

    expect(result.coefficients).toEqual([1, 0]);
  });

  test("parses 42 (constant)", () => {
    const result = parsePolynomial("42");

    expect(result.coefficients).toEqual([42]);
  });

  test("parses 0 (zero polynomial)", () => {
    const result = parsePolynomial("0");

    expect(result.coefficients).toEqual([0]);
  });

  test("parses x^2 (no linear or constant term)", () => {
    const result = parsePolynomial("x^2");

    expect(result.coefficients).toEqual([1, 0, 0]);
  });

  test("parses with unicode minus sign −x^2 + 3", () => {
    const result = parsePolynomial("−x^2 + 3");

    expect(result.coefficients).toEqual([-1, 0, 3]);
  });

  test("parses -x (negative linear)", () => {
    const result = parsePolynomial("-x");

    expect(result.coefficients).toEqual([-1, 0]);
  });

  test("parses 3x^3 - 2x^2 + 0x - 7 with explicit zero coefficient", () => {
    const result = parsePolynomial("3x^3 - 2x^2 + 0x - 7");

    expect(result.coefficients).toEqual([3, -2, 0, -7]);
  });

  test("parses polynomial with spacing variations", () => {
    const result = parsePolynomial("  2x^2   -   5x   +   1  ");

    expect(result.coefficients).toEqual([2, -5, 1]);
  });
});

// ============================================================================
// Task 1.4: parsePolynomial — factored form
// ============================================================================

describe("parsePolynomial — factored form (U2-POLY-002)", () => {
  test("parses (x-2)(x+3) as x² + x − 6", () => {
    const result = parsePolynomial("(x-2)(x+3)");

    expect(result.coefficients).toEqual([1, 1, -6]);
  });

  test("parses (x-1)(x-1) as x² − 2x + 1 (repeated root)", () => {
    const result = parsePolynomial("(x-1)(x-1)");

    expect(result.coefficients).toEqual([1, -2, 1]);
  });

  test("parses (x+2)(x-3)(x+1) as product of three binomials", () => {
    const result = parsePolynomial("(x+2)(x-3)(x+1)");

    // (x+2)(x-3) = x² - x - 6; (x² - x - 6)(x+1) = x³ - 7x - 6
    expect(result.coefficients).toEqual([1, 0, -7, -6]);
  });

  test("parses (x-2)(x+3) irrespective of factor order (commutativity)", () => {
    const result = parsePolynomial("(x+3)(x-2)");

    expect(result.coefficients).toEqual([1, 1, -6]);
  });

  test("parses 2(x-1)(x+1) with constant factor", () => {
    const result = parsePolynomial("2(x-1)(x+1)");

    // (x-1)(x+1) = x² - 1; 2 * [1, 0, -1] = [2, 0, -2]
    expect(result.coefficients).toEqual([2, 0, -2]);
  });

  test("parses (x) as linear factor", () => {
    const result = parsePolynomial("(x)");

    expect(result.coefficients).toEqual([1, 0]);
  });

  test("parses (x-0)(x+0) as x²", () => {
    const result = parsePolynomial("(x-0)(x+0)");

    expect(result.coefficients).toEqual([1, 0, 0]);
  });
});

// ============================================================================
// Task 1.8: Error model — parse errors + unsupported forms
// ============================================================================

describe("parsePolynomial — error model (U2-POLY-006, U2-POLY-007)", () => {
  test("throws PolynomialParseError for invalid token '*'", () => {
    expect(() => parsePolynomial("x^2 + *3")).toThrow(PolynomialParseError);
    try {
      parsePolynomial("x^2 + *3");
    } catch (e) {
      expect(e).toBeInstanceOf(PolynomialParseError);
      const err = e as PolynomialParseError;
      expect(err.position).toBeGreaterThan(0);
      expect(err.reason).toBeTruthy();
    }
  });

  test("throws UnsupportedPolynomialFormError for multivariate x*y + 3", () => {
    expect(() => parsePolynomial("x*y + 3")).toThrow(UnsupportedPolynomialFormError);
    try {
      parsePolynomial("x*y + 3");
    } catch (e) {
      expect(e).toBeInstanceOf(UnsupportedPolynomialFormError);
      const err = e as UnsupportedPolynomialFormError;
      expect(err.formType).toBe("multivariate");
    }
  });

  test("throws PolynomialParseError for empty string", () => {
    expect(() => parsePolynomial("")).toThrow(PolynomialParseError);
  });

  test("throws UnsupportedPolynomialFormError for sin(x) + 1 (transcendental)", () => {
    expect(() => parsePolynomial("sin(x) + 1")).toThrow(UnsupportedPolynomialFormError);
    try {
      parsePolynomial("sin(x) + 1");
    } catch (e) {
      expect(e).toBeInstanceOf(UnsupportedPolynomialFormError);
      const err = e as UnsupportedPolynomialFormError;
      expect(err.formType).toBeTruthy();
    }
  });

  test("throws PolynomialParseError for syntax error: x^2 +", () => {
    expect(() => parsePolynomial("x^2 +")).toThrow(PolynomialParseError);
  });

  test("throws UnsupportedPolynomialFormError for x^(1/2) (rational exponent)", () => {
    expect(() => parsePolynomial("x^(1/2) + 1")).toThrow(UnsupportedPolynomialFormError);
    try {
      parsePolynomial("x^(1/2) + 1");
    } catch (e) {
      expect(e).toBeInstanceOf(UnsupportedPolynomialFormError);
      const err = e as UnsupportedPolynomialFormError;
      expect(err.formType).toBeTruthy();
    }
  });

  test("BUG-1: rejects factored form with trailing content ((x+1)+2)", () => {
    // parseFactored() should throw when there is content AFTER the last parenthesis,
    // e.g., "(x+1)+2" should NOT be treated as equivalent to "(x+1)".
    expect(() => parsePolynomial("(x+1)+2")).toThrow(PolynomialParseError);
    try {
      parsePolynomial("(x+1)+2");
    } catch (e) {
      expect(e).toBeInstanceOf(PolynomialParseError);
      const err = e as PolynomialParseError;
      expect(err.reason).toBeTruthy();
    }
  });

  test("BUG-1: rejects factored form with trailing content ((x-2)(x+3)x)", () => {
    // Another variant: trailing content that is not a valid factor.
    expect(() => parsePolynomial("(x-2)(x+3)x")).toThrow(PolynomialParseError);
    try {
      parsePolynomial("(x-2)(x+3)x");
    } catch (e) {
      expect(e).toBeInstanceOf(PolynomialParseError);
      const err = e as PolynomialParseError;
      expect(err.reason).toBeTruthy();
    }
  });
});

// ============================================================================
// Task 1.5: expand to canonical coefficient form
// ============================================================================

describe("expand — canonical form (U2-POLY-004)", () => {
  test("expand is idempotent on already-expanded polynomial", () => {
    const poly = parsePolynomial("2x^2 - 5x + 1");
    const expanded = expand(poly);

    expect(expanded.coefficients).toEqual([2, -5, 1]);
  });

  test("expand normalizes factored polynomial", () => {
    const poly = parsePolynomial("(x-2)(x-3)");
    const expanded = expand(poly);

    expect(expanded.coefficients).toEqual([1, -5, 6]);
  });

  test("expand on constant polynomial returns itself", () => {
    const poly = parsePolynomial("42");
    const expanded = expand(poly);

    expect(expanded.coefficients).toEqual([42]);
  });

  test("expand strips leading zeros", () => {
    const poly = parsePolynomial([0, 1, 0]);
    const expanded = expand(poly);

    expect(expanded.coefficients).toEqual([1, 0]);
  });

  test("double expand is idempotent", () => {
    const poly = parsePolynomial("(x-2)(x+3)");
    const once = expand(poly);
    const twice = expand(once);

    expect(twice.coefficients).toEqual(once.coefficients);
  });
});

// ============================================================================
// Task 1.6: polynomialsEqual + areEquivalent
// ============================================================================

describe("polynomialsEqual (U2-POLY-010)", () => {
  test("identical polynomials are equal", () => {
    const a = parsePolynomial("2x^2 - 5x + 1");
    const b = parsePolynomial("2x^2 - 5x + 1");

    expect(polynomialsEqual(a, b)).toBe(true);
  });

  test("polynomials with different coefficients are not equal", () => {
    const a = parsePolynomial("x^2 + x - 6");
    const b = parsePolynomial("x^2 + x + 6");

    expect(polynomialsEqual(a, b)).toBe(false);
  });

  test("polynomials with different degrees are not equal", () => {
    const a = parsePolynomial("x^2 + 1");
    const b = parsePolynomial("x^3 + 1");

    expect(polynomialsEqual(a, b)).toBe(false);
  });

  test("polynomials equal regardless of leading zeros (normalized)", () => {
    const a = parsePolynomial([1, 2, 3]);
    const b = parsePolynomial([0, 1, 2, 3]); // normalized to [1, 2, 3]

    expect(polynomialsEqual(a, b)).toBe(true);
  });
});

describe("areEquivalent — string-based equivalence (U2-POLY-004, U2-POLY-005)", () => {
  test("(x-2)(x+3) is equivalent to x^2 + x - 6", () => {
    expect(areEquivalent("(x-2)(x+3)", "x^2 + x - 6")).toBe(true);
  });

  test("x^2 + x - 6 is NOT equivalent to x^2 + x + 6", () => {
    expect(areEquivalent("x^2 + x - 6", "x^2 + x + 6")).toBe(false);
  });

  test("factored form is equivalent regardless of factor order", () => {
    expect(areEquivalent("(x-2)(x+3)", "(x+3)(x-2)")).toBe(true);
  });

  test("coefficient array is equivalent to expanded string", () => {
    // [1, -5, 6] is x² - 5x + 6
    expect(areEquivalent([1, -5, 6], "x^2 - 5x + 6")).toBe(true);
  });

  test("non-equivalent polynomials return false", () => {
    expect(areEquivalent("x^2", "x")).toBe(false);
  });
});
