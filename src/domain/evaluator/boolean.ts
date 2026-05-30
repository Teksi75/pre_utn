/**
 * Boolean evaluator — Spanish/English alias resolution for true/false answers.
 * No external dependencies. Pure TypeScript.
 * TDD coverage: src/domain/__tests__/evaluator-boolean.test.ts.
 */

const TRUE_ALIASES: ReadonlySet<string> = new Set([
  "v",
  "verdadero",
  "true",
  "sí",
  "si",
]);

const FALSE_ALIASES: ReadonlySet<string> = new Set([
  "f",
  "falso",
  "false",
  "no",
]);

interface BooleanResult {
  readonly correct: boolean;
}

/**
 * Evaluate a student's boolean answer against the expected answer.
 * Supports Spanish and English aliases for true/false.
 *
 * @param expected - "true" or "false"
 * @param student - The student's answer (any alias)
 * @returns { correct: true } if the answer matches the expected boolean value
 */
export function evaluateBoolean(expected: string, student: string): BooleanResult {
  const trimmed = student.trim().toLowerCase();
  if (trimmed === "") {
    return { correct: false };
  }

  const expectedBool = expected.trim().toLowerCase() === "true";
  const studentBool = TRUE_ALIASES.has(trimmed);

  // If student answer is not a recognized boolean alias, it's incorrect
  if (!TRUE_ALIASES.has(trimmed) && !FALSE_ALIASES.has(trimmed)) {
    return { correct: false };
  }

  return { correct: expectedBool === studentBool };
}
