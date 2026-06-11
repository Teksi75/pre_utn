/**
 * Gauss routing helper — parse rational roots, normalize, and compare sets.
 *
 * Pure TypeScript. No side effects. No external dependencies.
 * Used by evaluator/index.ts to route Gauss numerical exercises (U2FAC-EVAL-006).
 *
 * TDD coverage: src/domain/__tests__/gauss-routing-helper.test.ts
 */

/** Parse a comma-separated list of rational root strings into numbers.
 *
 *  Supported formats:
 *    - Integer: "4", "-3"
 *    - Fraction: "1/2", "-3/2"
 *    - Decimal: "0.5", "-1.5"
 *
 *  Tokens are separated by comma, whitespace, or both.
 *  Trailing commas are allowed (ignored).
 *  Division by zero ("1/0"), multiple slashes ("1/2/3"), and non-numeric
 *    tokens ("abc") throw GaussParseError.
 *  Empty input returns [].
 */
export function parseRationalRoots(input: string): number[] {
  if (input.trim() === "") return [];

  // Split by commas first, then by whitespace within each chunk
  const tokens: string[] = [];
  for (const chunk of input.split(",")) {
    const trimmed = chunk.trim();
    if (trimmed === "") continue;
    // Handle space-separated tokens within a comma chunk
    const subTokens = trimmed.split(/\s+/);
    for (const t of subTokens) {
      const s = t.trim();
      if (s !== "") tokens.push(s);
    }
  }

  if (tokens.length === 0) return [];

  return tokens.map((token, index) => parseToken(token, index));
}

/** Parse a single rational token: "a/b", decimal, or integer.
 *  Throws GaussParseError on invalid input.
 */
function parseToken(token: string, position: number): number {
  // Check for multiple slashes "1/2/3"
  const slashCount = (token.match(/\//g) ?? []).length;
  if (slashCount > 1) {
    throw new GaussParseError(position, `multiple slashes in token "${token}"`);
  }

  // Fraction: "a/b" or "-a/b"
  if (slashCount === 1) {
    const parts = token.split("/");
    const numStr = parts[0].trim();
    const denStr = parts[1].trim();

    const numerator = Number(numStr);
    const denominator = Number(denStr);

    if (Number.isNaN(numerator) || Number.isNaN(denominator)) {
      throw new GaussParseError(position, `invalid fraction parts in "${token}"`);
    }

    if (denominator === 0) {
      throw new GaussParseError(position, `division by zero in "${token}"`);
    }

    return numerator / denominator;
  }

  // Integer or decimal
  const num = Number(token);
  if (Number.isNaN(num)) {
    throw new GaussParseError(position, `unparseable token "${token}"`);
  }
  return num;
}

/** Normalize a list of roots: deduplicate and sort ascending.
 *  Returns a new array (does not mutate input).
 */
export function normalizeRoots(roots: readonly number[]): number[] {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const r of roots) {
    if (!seen.has(r)) {
      seen.add(r);
      result.push(r);
    }
  }
  result.sort((a, b) => a - b);
  return result;
}

/** Compare two lists of roots for equivalence (set equality, order-insensitive).
 *
 *  Uses tolerance for floating-point comparison (default 1e-9).
 *
 *  Both lists must contain the SAME set of values (order irrelevant,
 *  deduplication applied). Extra or missing roots in either direction
 *  returns false.
 */
export function areEquivalentRoots(
  expected: readonly number[],
  student: readonly number[],
  tolerance: number = 1e-9,
): boolean {
  const expectedNorm = normalizeRoots(expected);
  const studentNorm = normalizeRoots(student);

  if (expectedNorm.length !== studentNorm.length) return false;

  for (let i = 0; i < expectedNorm.length; i++) {
    const diff = Math.abs(expectedNorm[i] - studentNorm[i]);
    if (diff > tolerance) {
      // Before rejecting, check if there's a matching root elsewhere
      // (floating-point sort instability for very close values)
      // Since we sorted, this should be a 1:1 comparison.
      // But let's be safe and check tolerance pair-wise.
      let found = false;
      for (let j = 0; j < studentNorm.length; j++) {
        if (Math.abs(expectedNorm[i] - studentNorm[j]) <= tolerance) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
  }

  return true;
}

export class GaussParseError extends Error {
  constructor(
    public readonly position: number,
    public readonly reason: string,
  ) {
    super(`Gauss parse error at position ${position}: ${reason}`);
    this.name = "GaussParseError";
  }
}

export class GaussEquivalenceError extends Error {
  constructor(reason: string) {
    super(`Gauss equivalence error: ${reason}`);
    this.name = "GaussEquivalenceError";
  }
}
