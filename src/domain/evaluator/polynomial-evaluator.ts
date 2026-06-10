/**
 * Polynomial evaluator — parses, expands, and compares single-variable polynomials.
 * No external dependencies. Pure TypeScript.
 * TDD coverage: src/domain/__tests__/polynomial-evaluator.test.ts.
 */

import type { Polynomial } from "./polynomial-types";
import { PolynomialParseError, UnsupportedPolynomialFormError } from "./polynomial-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize unicode minus to keyboard hyphen. */
function normMinus(s: string): string {
  return s.replace(/−/g, "-");
}

/** Strip leading zeros from a coefficient array. Returns [0] if all zeros. */
function stripLeadingZeros(coeffs: readonly number[]): number[] {
  let start = 0;
  while (start < coeffs.length - 1 && coeffs[start] === 0) {
    start++;
  }
  return coeffs.slice(start);
}

/** Build a Polynomial from a coefficient array, normalizing leading zeros. */
function fromCoefficients(coeffs: readonly number[], variable = "x"): Polynomial {
  return { coefficients: stripLeadingZeros(coeffs), variable };
}

// ---------------------------------------------------------------------------
// Tokenizer for expanded form
// ---------------------------------------------------------------------------

interface MonomialToken {
  coefficient: number;
  exponent: number;
}

/** Tokenize a raw (un-normalized) monomial string like "2x^2", "-5x", "+1". */
function tokenizeMonomial(raw: string, index: number): MonomialToken {
  // Normalize unicode minus and strip all whitespace
  const token = normMinus(raw).replace(/\s/g, "");
  if (token === "") {
    throw new PolynomialParseError(index, "empty monomial token");
  }

  // Check for multivariate FIRST (any letter except x/X) — before checking operators,
  // so that "x*y" is detected as multivariate, not as a syntax error.
  if (/[a-wyzA-WYZ]/.test(token)) {
    throw new UnsupportedPolynomialFormError("multivariate", `unexpected variable in "${token}"`);
  }

  // Transcendental functions (check before operators — "sin(x)" has parens but is not a polynomial factor)
  if (/\b(sin|cos|tan|log|exp|ln|sqrt|csc|sec|cot)\b/.test(token)) {
    throw new UnsupportedPolynomialFormError("transcendental", `transcendental function in "${token}"`);
  }

  // Rational exponents (x^(1/2), x^(a/b), etc.)
  if (/x\^\(.*\/.*\)/.test(token)) {
    throw new UnsupportedPolynomialFormError("rational_exponent", `rational exponent in "${token}"`);
  }

  // Fractional exponents (x^(0.5), etc. — non-integer)
  if (/x\^\(?\d+\.\d+/.test(token)) {
    throw new UnsupportedPolynomialFormError("rational_exponent", `non-integer exponent in "${token}"`);
  }

  // Check for invalid operators (*, /) — these are syntax errors after all form checks pass
  if (/[*/]/.test(token)) {
    const starPos = token.search(/[*/]/);
    throw new PolynomialParseError(index + starPos, `unexpected token '${token[starPos]}'`);
  }

  // Constant term (no 'x')
  if (!token.includes("x")) {
    const num = Number(token);
    if (Number.isNaN(num)) {
      throw new PolynomialParseError(index, `cannot parse constant "${token}"`);
    }
    return { coefficient: num, exponent: 0 };
  }

  // Monomial with 'x' — match pattern: [+-]?[digits]x[^digits]?
  const match = token.match(/^([+-]?\d*\.?\d*)x(?:\^(\d+))?$/);
  if (!match) {
    throw new PolynomialParseError(index, `cannot parse monomial "${token}"`);
  }

  const coeffStr = match[1];
  let coefficient: number;
  if (coeffStr === "" || coeffStr === "+") {
    coefficient = 1;
  } else if (coeffStr === "-") {
    coefficient = -1;
  } else {
    coefficient = Number(coeffStr);
    if (Number.isNaN(coefficient)) {
      throw new PolynomialParseError(index, `invalid coefficient in "${token}"`);
    }
  }

  const exponent = match[2] ? Number(match[2]) : 1;
  return { coefficient, exponent };
}

/**
 * Split an expanded polynomial string into monomial tokens.
 * Handles "+" and "-" as separators. The first token may not have a leading sign.
 */
function splitMonomials(expanded: string): string[] {
  const cleaned = normMinus(expanded).replace(/\s+/g, " ").trim();
  if (cleaned === "") {
    throw new PolynomialParseError(0, "empty input");
  }

  // Split on + or - but keep the sign with each token
  const tokens: string[] = [];
  let current = "";
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if ((ch === "+" || ch === "-") && i > 0 && cleaned[i - 1] !== "^" && cleaned[i - 1] !== "(") {
      // Check this sign isn't part of an exponent like "x^-2" (not supported but handle gracefully)
      if (current.trim() !== "") {
        tokens.push(current.trim());
      }
      current = ch;
    } else {
      current += ch;
    }
  }
  if (current.trim() !== "") {
    tokens.push(current.trim());
  }

  return tokens;
}

/**
 * Parse a polynomial from expanded monomial form.
 * Example: "2x^2 - 5x + 1" → Polynomial with coefficients [2, -5, 1]
 */
function parseExpanded(input: string, originalInput: string): Polynomial {
  const tokens = splitMonomials(input);
  if (tokens.length === 0) {
    throw new PolynomialParseError(0, "empty input");
  }

  // Handle single constant or single monomial
  // Find maximum exponent to determine polynomial degree
  const monomials: MonomialToken[] = [];
  for (const token of tokens) {
    monomials.push(tokenizeMonomial(token, originalInput.indexOf(token)));
  }

  const maxExp = Math.max(...monomials.map((m) => m.exponent), 0);
  const coeffs = new Array<number>(maxExp + 1).fill(0);

  for (const m of monomials) {
    coeffs[maxExp - m.exponent] += m.coefficient;
  }

  return fromCoefficients(coeffs);
}

// ---------------------------------------------------------------------------
// Parser for factored form
// ---------------------------------------------------------------------------

/**
 * Multiply two binomials in coefficient form (descending order).
 * e.g., [1, a] * [1, b] → [1, a+b, a*b]
 */
function multiplyBinomials(a: number[], b: number[]): number[] {
  const result = new Array<number>(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] += a[i] * b[j];
    }
  }
  return result;
}

/**
 * Extract a root from a single factor like "(x-2)", "(x+3)", or "(x)".
 * Returns the factor as a coefficient array [1, -root].
 */
function extractFactor(factor: string): number[] {
  const cleaned = normMinus(factor.trim());
  // Remove outer parentheses
  const inner = cleaned.replace(/^\(|\)$/g, "").trim();

  // Check for plain "(x)" = [1, 0]
  if (inner === "x") {
    return [1, 0];
  }

  // Check for "(kx)" — constant times x
  const constXMatch = inner.match(/^(-?\d*\.?\d+)\s*\*?\s*x$/);
  if (constXMatch) {
    const k = Number(constXMatch[1]);
    return [k, 0];
  }

  // Match patterns: "x-a", "x+a", "-x+a", etc.
  // Normalized: sign + coefficient + x sign number
  // First check: "x sign number" → [1, sign * number]
  const match1 = inner.match(/^x\s*([+-])\s*(\d+\.?\d*)$/);
  if (match1) {
    const sign = match1[1] === "+" ? 1 : -1;
    const value = Number(match1[2]);
    return [1, sign * value];
  }

  // Check: "sign number x sign number" or reversed
  // Pattern: "ax + b" or "ax - b"
  const match2 = inner.match(/^([+-]?\d*\.?\d*)\s*\*?\s*x\s*([+-])\s*(\d+\.?\d*)$/);
  if (match2) {
    const aStr = match2[1];
    const a = aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : Number(aStr);
    const sign = match2[2] === "+" ? 1 : -1;
    const b = Number(match2[3]);
    return [a, sign * b];
  }

  // Pattern: "b sign ax" or number + x
  const match3 = inner.match(/^([+-]?\d+\.?\d*)\s*([+-])\s*(\d*\.?\d*)\s*\*?\s*x$/);
  if (match3) {
    const b = Number(match3[1]);
    const sign = match3[2] === "+" ? 1 : -1;
    const aStr = match3[3];
    const a = aStr === "" ? 1 : Number(aStr);
    return [sign * a, b];
  }

  throw new PolynomialParseError(0, `cannot parse factor "${factor}"`);
}

/**
 * Parse a polynomial from factored form.
 * Example: "(x-2)(x+3)" → Polynomial with coefficients [1, 1, -6]
 */
function parseFactored(input: string): Polynomial {
  const cleaned = normMinus(input).replace(/\s+/g, "");

  // Extract constant multiplier at the start if present
  let constantFactor = 1;
  let remaining = cleaned;

  const leadingConstMatch = remaining.match(/^(-?\d+\.?\d*)(\(.+)/);
  if (leadingConstMatch) {
    constantFactor = Number(leadingConstMatch[1]);
    remaining = leadingConstMatch[2];
  }

  // Split into individual factors by matching parentheses pairs
  const factors: string[] = [];
  let depth = 0;
  let current = "";

  for (let i = 0; i < remaining.length; i++) {
    const ch = remaining[i];
    current += ch;
    if (ch === "(") {
      depth++;
    } else if (ch === ")") {
      depth--;
      if (depth === 0) {
        factors.push(current);
        current = "";
      }
    }
  }

  if (depth !== 0) {
    throw new PolynomialParseError(remaining.length - 1, "unbalanced parentheses");
  }

  if (factors.length === 0) {
    throw new PolynomialParseError(0, "no factors found in factored form");
  }

  // Multiply all factors
  let result = [1]; // Start with 1 (multiplying identity)
  for (const factor of factors) {
    const factorCoeffs = extractFactor(factor);
    result = multiplyBinomials(result, factorCoeffs);
  }

  // Apply constant factor
  if (constantFactor !== 1) {
    result = result.map((c) => c * constantFactor);
  }

  return fromCoefficients(result);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a polynomial from a string (expanded or factored form) or a coefficient array.
 *
 * Accepted string forms:
 * - Expanded: "2x^2 - 5x + 1"
 * - Factored: "(x-2)(x+3)"
 *
 * Accepted array form: [1, -5, 6] (coefficients in descending degree order)
 *
 * @param input - The polynomial input (string or coefficient array)
 * @returns A normalized Polynomial with stripped leading zeros
 * @throws {PolynomialParseError} if the input cannot be parsed
 * @throws {UnsupportedPolynomialFormError} if the form is not supported
 */
export function parsePolynomial(input: string | readonly number[]): Polynomial {
  // Array form: coefficients in descending degree order
  if (Array.isArray(input)) {
    if (input.length === 0) {
      throw new PolynomialParseError(0, "empty coefficient array");
    }
    return fromCoefficients(input);
  }

  // String form (TS narrows input to string after the Array.isArray guard above)
  const trimmed = (input as string).trim();
  if (trimmed === "") {
    throw new PolynomialParseError(0, "empty input");
  }

  // Detect factored form: contains parentheses
  if (trimmed.includes("(")) {
    // Guard: check for non-polynomial content before attempting factored parse
    const noSpaces = trimmed.replace(/\s/g, "");
    if (/[a-wyzA-WYZ]/.test(noSpaces)) {
      throw new UnsupportedPolynomialFormError("multivariate", `unexpected variable in "${trimmed}"`);
    }
    if (/\b(sin|cos|tan|log|exp|ln|sqrt|csc|sec|cot)\b/.test(noSpaces)) {
      throw new UnsupportedPolynomialFormError("transcendental", `transcendental function in "${trimmed}"`);
    }
    if (/x\^\(.*\/.*\)/.test(noSpaces)) {
      throw new UnsupportedPolynomialFormError("rational_exponent", `rational exponent in "${trimmed}"`);
    }
    return parseFactored(trimmed);
  }

  // Expanded form
  return parseExpanded(trimmed, trimmed);
}
