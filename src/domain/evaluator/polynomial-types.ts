/**
 * Polynomial types for the polynomial evaluator module.
 * No external dependencies. Pure TypeScript.
 * TDD coverage: src/domain/__tests__/polynomial-evaluator.test.ts.
 */

/**
 * Represents a single-variable polynomial as an array of coefficients
 * in descending degree order (index 0 = highest-degree term).
 *
 * Examples:
 *   x² - 5x + 6  → { coefficients: [1, -5, 6], variable: "x" }
 *   3x + 1        → { coefficients: [3, 1], variable: "x" }
 *   0             → { coefficients: [0], variable: "x" }
 */
export interface Polynomial {
  readonly coefficients: readonly number[];
  readonly variable: string;
}

/**
 * Error thrown when a polynomial string cannot be parsed.
 * Includes the position where parsing failed and a human-readable reason.
 */
export class PolynomialParseError extends Error {
  readonly position: number;
  readonly reason: string;

  constructor(position: number, reason: string) {
    super(`Parse error at position ${position}: ${reason}`);
    this.name = "PolynomialParseError";
    this.position = position;
    this.reason = reason;
  }
}

/**
 * Error thrown when the polynomial is in a form not yet supported
 * (e.g. multivariate, transcendental functions, rational exponents).
 */
export class UnsupportedPolynomialFormError extends Error {
  readonly formType: string;
  readonly reason: string;

  constructor(formType: string, reason: string) {
    super(`Unsupported form "${formType}": ${reason}`);
    this.name = "UnsupportedPolynomialFormError";
    this.formType = formType;
    this.reason = reason;
  }
}
