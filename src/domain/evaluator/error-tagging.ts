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
  "u1_signo_parentesis",
  "u2_signo_al_mover",
  "u3_signo_desigualdad",
]);

/** Tags that represent order-of-operations misconceptions. */
const ORDER_OF_OPS_TAGS = new Set(["u1_orden_operaciones"]);

/** Tags that represent interval endpoint-inclusion misconceptions. */
const INTERVAL_ENDPOINT_TAGS = new Set(["u1_extremo_inclusion"]);

/** Tags that represent zero-exponent misconceptions (x^0 ≠ 0). */
const ZERO_EXPONENT_TAGS = new Set(["u1_exponente_cero"]);

/** Tags that represent principal-square-root misconceptions (√x ≥ 0). */
const PRINCIPAL_ROOT_TAGS = new Set(["u1_raiz_principal"]);

/** Tags that represent exponent-law misconceptions. */
const PRODUCT_OF_POWERS_TAGS = new Set(["u1_producto_potencias"]);
const QUOTIENT_OF_POWERS_TAGS = new Set(["u1_cociente_potencias"]);
const POWER_OF_POWER_TAGS = new Set(["u1_potencia_de_potencia"]);

/** Tags that represent invalid even roots of negative numbers in ℝ. */
const NEGATIVE_EVEN_ROOT_TAGS = new Set(["u1_raiz_negativa_par"]);

const SUPERSCRIPT_DIGITS: Readonly<Record<string, string>> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
};

function normalizeSuperscripts(value: string): string {
  // Supports both legacy Unicode prompts and KaTeX-delimited LaTeX prompts.
  // Regression coverage: src/domain/__tests__/evaluator-error-tagging.test.ts
  return value
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (digit) => SUPERSCRIPT_DIGITS[digit])
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷");
}

function numericAnswer(userAnswer: string): number | undefined {
  const student = Number(userAnswer.trim().replace(/−/g, "-"));
  return Number.isNaN(student) ? undefined : student;
}

function numericExpected(expectedAnswer: string): number {
  return Number(expectedAnswer.trim().replace(/−/g, "-"));
}

/**
 * Detect a sign-error pattern: the absolute value of the user's answer
 * equals the expected value, but the sign is negated.
 * Only applies to numerical exercises.
 */
function isSignError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "numerical") return false;

  const expectedNum = numericExpected(exercise.expectedAnswer);
  const studentNum = numericAnswer(userAnswer);

  if (Number.isNaN(expectedNum) || studentNum === undefined) return false;
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

  const expected = numericExpected(exercise.expectedAnswer);
  const student = numericAnswer(userAnswer);

  if (Number.isNaN(expected) || student === undefined) return false;

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
 * Detect a zero-exponent error: the expected answer is 1 (x^0 = 1) but the
 * student answered 0, a common misconception that anything to the power 0 is 0.
 * Only applies to numerical exercises.
 */
function isZeroExponentError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "numerical") return false;

  const expected = numericExpected(exercise.expectedAnswer);
  const student = numericAnswer(userAnswer);

  if (Number.isNaN(expected) || student === undefined) return false;

  // Classic misconception: x^0 = 0 instead of 1
  return expected === 1 && student === 0;
}

/**
 * Detect a principal-square-root error: the expected answer is positive (the
 * principal root) but the student answered its negation. For example, √9 = 3
 * but student writes -3.
 * Only applies to numerical exercises.
 */
function isPrincipalRootError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "numerical") return false;

  const expected = numericExpected(exercise.expectedAnswer);
  const student = numericAnswer(userAnswer);

  if (Number.isNaN(expected) || student === undefined) return false;
  if (expected <= 0) return false;

  return student === -expected;
}

/** Detect product-of-powers misconception: a^m × a^n treated as a^(m×n). */
function isProductOfPowersError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "numerical") return false;

  const prompt = normalizeSuperscripts(exercise.prompt);
  const match = prompt.match(/(\d+)\s*\^?\s*(\d+)\s*[×x*]\s*\1\s*\^?\s*(\d+)/);
  const student = numericAnswer(userAnswer);
  const expected = numericExpected(exercise.expectedAnswer);

  if (!match || student === undefined || Number.isNaN(expected)) return false;

  const base = Number(match[1]);
  const leftExponent = Number(match[2]);
  const rightExponent = Number(match[3]);
  const multiplyExponents = base ** (leftExponent * rightExponent);

  return student === multiplyExponents && student !== expected;
}

/** Detect quotient-of-powers misconception: a^m ÷ a^n treated as a^(m+n). */
function isQuotientOfPowersError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "numerical") return false;

  const prompt = normalizeSuperscripts(exercise.prompt);
  const match = prompt.match(/(\d+)\s*\^?\s*(\d+)\s*[÷/]\s*\1\s*\^?\s*(\d+)/);
  const student = numericAnswer(userAnswer);
  const expected = numericExpected(exercise.expectedAnswer);

  if (!match || student === undefined || Number.isNaN(expected)) return false;

  const base = Number(match[1]);
  const numeratorExponent = Number(match[2]);
  const denominatorExponent = Number(match[3]);
  const addedExponents = base ** (numeratorExponent + denominatorExponent);

  return student === addedExponents && student !== expected;
}

/** Detect power-of-power misconception: (a^m)^n treated as a^(m+n). */
function isPowerOfPowerError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "numerical") return false;

  const prompt = normalizeSuperscripts(exercise.prompt);
  const match = prompt.match(/\(\s*(\d+)\s*\^?\s*(\d+)\s*\)\s*\^?\s*(\d+)/);
  const student = numericAnswer(userAnswer);
  const expected = numericExpected(exercise.expectedAnswer);

  if (!match || student === undefined || Number.isNaN(expected)) return false;

  const base = Number(match[1]);
  const innerExponent = Number(match[2]);
  const outerExponent = Number(match[3]);
  const addedExponents = base ** (innerExponent + outerExponent);

  return student === addedExponents && student !== expected;
}

/** Detect answers that treat √(negative) as a real number in multiple choice. */
function isNegativeEvenRootError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "multiple-choice") return false;
  const prompt = normalizeSuperscripts(exercise.prompt);
  const hasNegativeEvenRoot =
    /[√] ?\( ?-\d+ ?\)/.test(prompt) || /\\sqrt\{\s*-\d+\s*\}/.test(prompt);
  if (!hasNegativeEvenRoot) return false;

  const expected = exercise.expectedAnswer.trim().toLowerCase();
  const student = userAnswer.trim().toLowerCase();

  return expected.includes("no tiene resultado real") && student !== expected;
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

  if (isZeroExponentError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (ZERO_EXPONENT_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isPrincipalRootError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (PRINCIPAL_ROOT_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isProductOfPowersError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (PRODUCT_OF_POWERS_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isQuotientOfPowersError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (QUOTIENT_OF_POWERS_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isPowerOfPowerError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (POWER_OF_POWER_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isNegativeEvenRootError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (NEGATIVE_EVEN_ROOT_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  return undefined;
}
