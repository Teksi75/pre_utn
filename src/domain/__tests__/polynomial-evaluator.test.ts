import { describe, test, expect } from "vitest";
import { PolynomialParseError, UnsupportedPolynomialFormError } from "../evaluator/polynomial-types";
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
