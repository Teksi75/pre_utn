/**
 * Numeric evaluator — tolerance-based comparison for numerical answers.
 * No external dependencies. Pure TypeScript.
 * TDD coverage: src/domain/__tests__/evaluator-numeric.test.ts.
 */

const TOLERANCE = 0.01;

function normalizeNumericInput(value: string): string {
  return value.trim().replace(/−/g, "-");
}

interface NumericResult {
  readonly correct: boolean;
}

/**
 * Evaluate a student's numerical answer against the expected answer.
 * Uses absolute tolerance of 0.01.
 *
 * @param expected - The expected numerical answer as a string
 * @param student - The student's answer as a string
 * @returns { correct: true } if within tolerance, { correct: false } otherwise
 */
export function evaluateNumeric(expected: string, student: string): NumericResult {
  const trimmed = normalizeNumericInput(student);
  if (trimmed === "") {
    return { correct: false };
  }

  const expectedNum = Number(normalizeNumericInput(expected));
  const studentNum = Number(trimmed);

  if (Number.isNaN(expectedNum) || Number.isNaN(studentNum)) {
    return { correct: false };
  }

  return { correct: Math.abs(expectedNum - studentNum) < TOLERANCE };
}
