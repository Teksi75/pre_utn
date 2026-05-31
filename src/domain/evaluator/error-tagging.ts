/**
 * Error tagging — deterministic pattern matcher for common student mistakes.
 * Pure TypeScript. No side effects. No external dependencies.
 *
 * Each rule checks whether the user's answer matches a known pedagogical
 * misconception pattern AND the exercise declares the matching tag in
 * commonErrorTags. If no declared tag matches, returns undefined.
 */

import type { Exercise } from "../models/exercise";

/** Tags that represent sign-related misconceptions. */
const SIGN_ERROR_TAGS = new Set([
  "u1_signo_racionalizacion",
  "u2_signo_al_mover",
  "u3_signo_desigualdad",
]);

/** Tags that represent order-of-operations misconceptions. */
const ORDER_OF_OPS_TAGS = new Set(["u1_orden_operaciones"]);

/** Tags that represent interval endpoint-inclusion misconceptions. */
const INTERVAL_ENDPOINT_TAGS = new Set(["u1_extremo_inclusion"]);

/**
 * Detect a sign-error pattern: the absolute value of the user's answer
 * equals the expected value, but the sign is negated.
 * Only applies to numerical exercises.
 */
function isSignError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "numerical") return false;

  const expectedNum = Number(exercise.expectedAnswer);
  const studentNum = Number(userAnswer.trim());

  if (Number.isNaN(expectedNum) || Number.isNaN(studentNum)) return false;
  if (expectedNum === 0) return false;

  return Math.abs(expectedNum) === Math.abs(studentNum) && expectedNum !== studentNum;
}

/**
 * Detect an order-of-operations pattern: the student evaluates strictly
 * left-to-right, ignoring PEMDAS (e.g., 2 + 3 × 4 → 5 × 4 = 20).
 * Only applies to numerical exercises.
 */
function isOrderOfOpsError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "numerical") return false;

  const expected = Number(exercise.expectedAnswer);
  const student = Number(userAnswer.trim());

  if (Number.isNaN(expected) || Number.isNaN(student)) return false;

  // Parse the prompt to detect mixed addition/multiplication pattern
  const prompt = exercise.prompt;
  // Pattern: a + b × c where student computes (a+b)×c
  const match = prompt.match(
    /(\d+)\s*\+\s*(\d+)\s*[×x*]\s*(\d+)/
  );
  if (match) {
    const a = Number(match[1]);
    const b = Number(match[2]);
    const c = Number(match[3]);
    const leftToRight = (a + b) * c;
    return student === leftToRight && leftToRight !== expected;
  }

  return false;
}

/**
 * Detect an interval endpoint-inclusion pattern: the student uses the wrong
 * bracket type (parenthesis vs square bracket) for endpoint inclusion.
 * Only applies to symbolic exercises with interval notation.
 */
function isIntervalEndpointError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "symbolic") return false;

  const expected = exercise.expectedAnswer.trim();
  const student = userAnswer.trim();

  // Both must look like intervals
  const intervalPattern = /^[\(\[][0-9.,\s]+[\)\]]$/;
  if (!intervalPattern.test(expected) || !intervalPattern.test(student)) return false;

  // Check if the student swapped bracket types at any endpoint
  if (expected.length !== student.length) return false;

  let bracketMismatch = false;
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== student[i]) {
      const isOpen = (c: string) => c === "(" || c === "[";
      const isClose = (c: string) => c === ")" || c === "]";
      if (
        (isOpen(expected[i]) && isOpen(student[i])) ||
        (isClose(expected[i]) && isClose(student[i]))
      ) {
        // Same bracket category but different type = mismatch
        bracketMismatch = true;
      } else if (expected[i] !== student[i]) {
        // Not a bracket difference (e.g., digit difference)
        return false;
      }
    }
  }

  return bracketMismatch;
}

/**
 * Match the user's answer against known error patterns and return a
 * declared commonErrorTag if one fits, or undefined.
 *
 * Deterministic, side-effect free. Only tags when:
 * 1. The answer matches a recognized pattern
 * 2. The exercise declares the matching tag in commonErrorTags
 *
 * @param exercise - The exercise being answered
 * @param userAnswer - The student's raw answer string
 * @returns A declared error tag string, or undefined if no match
 */
export function tagError(
  exercise: Exercise,
  userAnswer: string
): string | undefined {
  const tags = exercise.commonErrorTags;

  if (isSignError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (SIGN_ERROR_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isOrderOfOpsError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (ORDER_OF_OPS_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isIntervalEndpointError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (INTERVAL_ENDPOINT_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  return undefined;
}
