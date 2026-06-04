/**
 * Numeric utilities — shared pure helpers for numeric answer validation.
 * No external dependencies. Pure TypeScript.
 */

/**
 * Check if a string represents a single finite number.
 * Handles unicode minus (−) normalization and surrounding whitespace.
 *
 * @param value - The string to check
 * @returns true if the string parses to a finite number
 */
export function isFiniteNumericAnswer(value: string): boolean {
  const normalized = value.replace(/−/g, "-").trim();
  const num = Number(normalized);
  return !Number.isNaN(num) && Number.isFinite(num);
}
