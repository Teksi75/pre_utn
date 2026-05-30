/**
 * Exact evaluator — trimmed, case-insensitive string comparison.
 * No external dependencies. Pure TypeScript.
 * TDD coverage: src/domain/__tests__/evaluator-exact.test.ts.
 */

interface ExactResult {
  readonly correct: boolean;
}

/**
 * Evaluate a student's answer against the expected answer using
 * trimmed, case-insensitive comparison.
 *
 * @param expected - The expected answer
 * @param student - The student's answer
 * @returns { correct: true } if normalized strings match
 */
export function evaluateExact(expected: string, student: string): ExactResult {
  const trimmed = student.trim();
  if (trimmed === "") {
    return { correct: false };
  }

  return { correct: expected.trim().toLowerCase() === trimmed.toLowerCase() };
}
