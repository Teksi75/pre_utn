/**
 * Error tagging — deterministic pattern matcher for common student mistakes.
 * Pure TypeScript. No side effects. No external dependencies.
 *
 * Each rule checks whether the user's answer matches a known pedagogical
 * misconception pattern AND the exercise declares the matching tag in
 * commonErrorTags. If no declared tag matches, returns undefined.
 */

import type { Exercise } from "../models/exercise";
import { getExerciseOptionValue } from "../models/exercise";

/** Tags that represent sign-related misconceptions. */
const SIGN_ERROR_TAGS = new Set([
  "u1_signo_racionalizacion",
  "u1_signo_parentesis",
  "u2_signo_al_mover",
  "u2_signo_operacion",
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

// ── U2 Polynomial error tag sets ────────────────────────────────────────

/** Tags for combining unlike-degree terms (like-term confusion). */
const U2_LIKE_TERM_TAGS = new Set(["u2_termino_semejante"]);

/** Tags for Ruffini sign-of-a errors (evaluating at wrong divisor root). */
const U2_RUFFINI_SIGNO_A_TAGS = new Set(["u2_ruffini_signo_a"]);

/** Tags for incorrect polynomial degree determination. */
const U2_DEGREE_TAGS = new Set(["u2_grado_incorrecto"]);

/** Tags for missing zero-coefficient terms. */
const U2_MISSING_TERM_TAGS = new Set(["u2_termino_faltante"]);

/** Tags for incomplete factorization (still factorable). */
const U2_INCOMPLETE_FACTOR_TAGS = new Set(["u2_factorizacion_incompleta"]);

/** Tags for sign errors in factorization (wrong sign in factors). */
const U2_SIGNO_FACTORIZACION_TAGS = new Set(["u2_signo_factorizacion"]);

/** Tags for wrong factorization case identification. */
const U2_CASO_INCORRECTO_TAGS = new Set(["u2_caso_incorrecto"]);

// ── U2 Aplicaciones error tag sets ──────────────────────────────────────

/** Tags for denominator-zero errors in fractional equations. */
const U2_DENOMINADOR_CERO_TAGS = new Set(["u2_denominador_cero"]);

/** Tags for MCM/MCD operation confusion. */
const U2_CONFUNDE_MCM_MCD_TAGS = new Set(["u2_confunde_mcm_mcd"]);

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
 * Only applies to exercises with interval notation (currently unused — symbolic type removed).
 */
function isIntervalEndpointError(exercise: Exercise, userAnswer: string): boolean {
  // Symbolic type was removed; this detector is retained for future use
  // but currently never matches any exercise type.
  void exercise;
  void userAnswer;
  return false;

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

// ── U2 Polynomial error pattern detectors ───────────────────────────────

/**
 * Detect unlike-term combination: student merged terms of different degrees.
 * Applies to MC exercises where the expected answer has multiple-degree terms
 * but the student answer has a single term whose degree matches the expected
 * max degree and coefficient equals the sum of all expected coefficients.
 */
function isU2LikeTermError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "multiple-choice") return false;

  // Normalize superscripts for degree extraction
  const expectedClean = normalizeSuperscripts(exercise.expectedAnswer).replace(/\s/g, "");
  const studentClean = normalizeSuperscripts(userAnswer).replace(/\s/g, "");

  // Expected has multiple x terms separated by + or -
  const hasMultipleTerms = /[+\-]/.test(expectedClean.replace(/^[+\-]/, ""));
  if (!hasMultipleTerms) return false;

  // Student answer must be a single term (no + or - inside)
  if (/[+\-]/.test(studentClean.replace(/^[+\-]/, ""))) return false;

  // Extract degree from student answer
  const stuDegreeMatch = studentClean.match(/x\^?(\d+)/);
  const stuDegree = stuDegreeMatch ? Number(stuDegreeMatch[1]) : studentClean.includes("x") ? 1 : 0;

  // Extract max degree from expected answer
  const expDegrees = [...expectedClean.matchAll(/x\^?(\d+)/g)];
  const expMaxDegree = expDegrees.length > 0
    ? Math.max(...expDegrees.map(m => Number(m[1])))
    : expectedClean.includes("x") ? 1 : 0;

  // Student collapsed terms to same max degree → like-term confusion
  return stuDegree === expMaxDegree && stuDegree > 0;
}

/**
 * Detect Ruffini sign-of-a error: student evaluated P(-a) instead of P(a)
 * or vice versa. Detected in MC exercises where the prompt mentions Ruffini
 * or remainder theorem, and the student picked a distractor (numeric answer
 * that differs from expected but is in the options list).
 */
function isU2RuffiniSignoAError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "multiple-choice") return false;

  const prompt = exercise.prompt.toLowerCase();
  const isRuffiniContext =
    prompt.includes("ruffini") ||
    prompt.includes("teorema del resto") ||
    prompt.includes("resto") ||
    prompt.includes("residuo");

  if (!isRuffiniContext) return false;

  // Student answer must be a numeric value (not the expected one)
  const expected = exercise.expectedAnswer.trim();
  const student = userAnswer.trim();
  const studentNum = Number(student);
  const expectedNum = Number(expected);

  if (Number.isNaN(studentNum) || Number.isNaN(expectedNum)) return false;
  if (studentNum === expectedNum) return false;

  // The student answer should be in the options list (a declared distractor)
  const options = exercise.options ?? [];
  return options.some((opt) => getExerciseOptionValue(opt).trim() === student);
}

/**
 * Detect incorrect degree determination: student confused degree with
 * number of terms or other property. Applies to MC exercises asking
 * about polynomial degree.
 */
function isU2DegreeError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "multiple-choice") return false;

  const prompt = exercise.prompt.toLowerCase();
  const isDegreeContext =
    prompt.includes("grado") || prompt.includes("degree");

  if (!isDegreeContext) return false;

  // Expected answer is the correct degree (numeric)
  const expected = exercise.expectedAnswer.trim();
  const student = userAnswer.trim();

  // Student answer differs from expected
  if (expected === student) return false;

  // Check if student answer is numeric (a plausible wrong degree)
  const studentNum = Number(student);
  return !Number.isNaN(studentNum) && studentNum > 0;
}

/**
 * Detect missing zero-coefficient terms: student omitted coefficient
 * positions that should be zero. Applies to exercises where the expected
 * answer is a coefficient array (currently unused — symbolic type removed).
 */
function isU2MissingTermError(exercise: Exercise, userAnswer: string): boolean {
  // Symbolic type was removed; this detector is retained for future use
  // but currently never matches any exercise type.
  void exercise;
  void userAnswer;
  return false;

  // Both expected and student look like coefficient arrays
  const arrayPattern = /^\[[\d,\s.\-]+\]$/;
  if (!arrayPattern.test(exercise.expectedAnswer) || !arrayPattern.test(userAnswer)) return false;

  const parseCoeffs = (s: string): number[] => {
    const inner = s.replace(/[\[\]]/g, "").trim();
    return inner.split(",").map(Number);
  };

  const expectedCoeffs = parseCoeffs(exercise.expectedAnswer);
  const studentCoeffs = parseCoeffs(userAnswer);

  // Student omitted zero coefficients: has fewer coefficients than expected
  // AND the difference is exactly the count of zeros in expected that
  // are missing in student
  if (studentCoeffs.length >= expectedCoeffs.length) return false;

  // Check that student coefficients are a subset (some zeros removed)
  const expectedZeros = expectedCoeffs.filter(c => c === 0).length;
  const studentZeros = studentCoeffs.filter(c => c === 0).length;

  return studentZeros < expectedZeros;
}

/**
 * Detect incomplete factorization: student gave a partially factored
 * expression that still contains factorable sub-expressions.
 * Applies to MC exercises about factorization.
 */
function isU2IncompleteFactorError(exercise: Exercise, userAnswer: string): boolean {
  if (exercise.type !== "multiple-choice") return false;

  const prompt = exercise.prompt.toLowerCase();
  const isFactorContext =
    prompt.includes("factoriza") || prompt.includes("factorizar") ||
    prompt.includes("factorización");

  if (!isFactorContext) return false;

  // Complete factorization tends to have more factors (more parentheses pairs)
  const expParenCount = (exercise.expectedAnswer.match(/\(/g) ?? []).length;
  const stuParenCount = (userAnswer.match(/\(/g) ?? []).length;

  // Student answer has fewer parentheses = fewer factors = incomplete
  if (stuParenCount >= expParenCount) return false;

  // Student answer DOES contain parentheses (at least attempted factoring)
  if (stuParenCount === 0) return false;

  // Student answer looks like a partial factorization:
  // fewer factors than fully-factored expected answer
  return stuParenCount < expParenCount;
}

/**
 * Detect sign errors in factorization: student gives factors with correct
 * absolute form but wrong sign in one or more factors.
 *
 * MC: compares the student's selected option's factor pattern with the
 * expected answer's factor pattern. If the option has the same factors
 * but with a sign difference in at least one, flags it.
 *
 * Symbolic branch removed (symbolic type no longer supported).
 */
function isU2SignoFactorizacionError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  // For MC: compare selected option with expected, check factor sign differences
  if (exercise.type === "multiple-choice") {
    const expected = exercise.expectedAnswer.trim();
    const student = userAnswer.trim();

    if (!expected.includes("(") || !student.includes("(")) return false;

    // Extract parenthesized factors from each string
    const extractFactors = (s: string): string[] => {
      const matches = s.match(/\([^)]+\)/g);
      return matches ? matches.map((m) => m.replace(/\s/g, "")) : [];
    };

    const expFactors = extractFactors(expected);
    const stuFactors = extractFactors(student);

    if (expFactors.length === 0 || stuFactors.length === 0) return false;
    if (expFactors.length !== stuFactors.length) return false;

    // Track which student factors have been matched
    const used = new Array<boolean>(stuFactors.length).fill(false);
    const stripSigns = (s: string): string =>
      s.replace(/\+/g, "").replace(/-/g, "");

    // For each expected factor, find a matching student factor
    for (const ef of expFactors) {
      const efNorm = ef.replace(/\(|\)/g, "");
      let foundExact = false;
      let foundSignDiff = false;

      for (let j = 0; j < stuFactors.length; j++) {
        if (used[j]) continue;
        const sf = stuFactors[j];
        const sfNorm = sf.replace(/\(|\)/g, "");

        if (stripSigns(efNorm) === stripSigns(sfNorm)) {
          // Same structure — check if signs match exactly
          if (ef === sf) {
            foundExact = true;
            used[j] = true;
            break;
          } else {
            foundSignDiff = true;
            used[j] = true;
            break;
          }
        }
      }

      // If this expected factor found a sign difference, flag it
      if (foundSignDiff && !foundExact) return true;
      if (!foundExact && !foundSignDiff) return false; // Factor not found at all
    }
    return false;
  }

  return false;
}

/**
 * Detect wrong factorization case identification: student chose a factor case
 * label that doesn't match the correct one.
 *
 * Applies to MC exercises where the prompt asks which factorization case
 * applies. The detector checks if the selected option's case label differs
 * from the expected case label.
 */
function isU2CasoIncorrectoError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;

  const prompt = exercise.prompt.toLowerCase();
  const isCaseContext =
    prompt.includes("caso") ||
    prompt.includes("factoriza") ||
    prompt.includes("factorización") ||
    prompt.includes("tipo de factoreo") ||
    prompt.includes("qué caso aplica") ||
    prompt.includes("que caso aplica");

  if (!isCaseContext) return false;

  const expected = exercise.expectedAnswer.trim().toLowerCase();
  const student = userAnswer.trim().toLowerCase();

  if (expected === student) return false;

  // Define known case keywords (in Spanish)
  const caseKeywords = [
    { keyword: "factor común", display: "factor comun" },
    { keyword: "diferencia de cuadrados", display: "diferencia de cuadrados" },
    { keyword: "trinomio cuadrado perfecto", display: "trinomio cuadrado perfecto" },
    { keyword: "cubo perfecto", display: "cubo perfecto" },
    { keyword: "potencia", display: "potencia" },
    { keyword: "trinomio de segundo grado", display: "trinomio de segundo grado" },
    { keyword: "grupos", display: "grupos" },
  ];

  // Find which case the expected and student answers map to
  const findCase = (answer: string): string | undefined => {
    for (const c of caseKeywords) {
      if (answer.includes(c.keyword)) return c.display;
    }
    return undefined;
  };

  const expCase = findCase(expected);
  const stuCase = findCase(student);

  // If we can identify both cases and they differ, it's a case error
  if (expCase != null && stuCase != null && expCase !== stuCase) {
    return true;
  }

  return false;
}

/**
 * Normalize Unicode minus sign (U+2212) to ASCII hyphen-minus.
 * Also handles other common Unicode variants that might appear in
 * LaTeX-rendered or copy-pasted text.
 */
function normalizeMinus(value: string): string {
  return value.replace(/[−\u2212]/g, "-");
}

/**
 * Detect denominator-zero error: student picks a value that zeroes a
 * denominator in a fractional equation. Applies to MC exercises only.
 * Numerical detector is deferred (see design.md).
 *
 * Detection logic:
 * 1. Scan the prompt for all (x±N) patterns and treat them as potential
 *    denominator factors (broad scan — does NOT check actual denominator
 *    context; see design rationale in design.md).
 * 2. Compute the excluded values (roots of denominator factors).
 * 3. Normalize Unicode minus in the student answer to ASCII.
 * 4. Check if the student's answer contains any EXACT excluded value.
 */
function isU2DenominadorCeroError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;

  const expected = exercise.expectedAnswer.trim();
  const studentRaw = userAnswer.trim();

  // Not an error if the student picked the correct answer
  if (studentRaw === expected) return false;

  // Normalize Unicode minus in student answer to avoid false-positives
  // where x=−2 (opposite sign) would match the wrong excluded value.
  const student = normalizeMinus(studentRaw);

  // Scan all (x±N) patterns in the prompt as potential denominators.
  // This is a broad scan — does not limit to actual denominator context.
  // Rationale: in MC exercises with denominator-zero distractors, every
  // (x±N) factor in the prompt is typically a denominator.
  const prompt = exercise.prompt;
  const denominatorPattern = /\(x\s*([+-])\s*(\d+)\)/g;
  const excludedValues: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = denominatorPattern.exec(prompt)) !== null) {
    const sign = match[1];
    const value = Number(match[2]);
    // (x - N) → excluded value is +N
    // (x + N) → excluded value is -N
    const excluded = sign === "-" ? value : -value;
    excludedValues.push(excluded);
  }

  if (excludedValues.length === 0) return false;

  // Check if the student answer contains any EXACT excluded value.
  // Student answer is Unicode-normalized; comparison uses ASCII minus only.
  // Student answer may be in form "2", "x=2", "x = 2", "-3", "x=-3", "x = -3".
  return excludedValues.some((val) => {
    const valStr = String(val);
    return (
      student === valStr ||
      student === `x=${valStr}` ||
      student === `x = ${valStr}`
    );
  });
}

/**
 * Detect MCM/MCD operation confusion: student picks the result of the
 * opposite operation. Applies to MC exercises.
 *
 * Detection logic:
 * 1. Check if prompt mentions MCM or MCD keywords
 * 2. If asking for MCM: student answer has FEWER parenthesized factors
 *    than the expected answer (picked the MCD-like distractor)
 * 3. If asking for MCD: student answer has MORE parenthesized factors
 *    than the expected answer (picked the MCM-like distractor)
 */
function isU2ConfundeMcmMcdError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;

  const promptLower = exercise.prompt.toLowerCase();
  const expected = exercise.expectedAnswer.trim();
  const student = userAnswer.trim();

  // Not an error if the student picked the correct answer
  if (student === expected) return false;

  // Check if the prompt is about MCM/MCD
  const isMcmPrompt =
    promptLower.includes("mcm") ||
    promptLower.includes("mínimo común múltiplo") ||
    promptLower.includes("minimo comun multiplo");
  const isMcdPrompt =
    promptLower.includes("mcd") ||
    promptLower.includes("máximo común divisor") ||
    promptLower.includes("maximo comun divisor");

  if (!isMcmPrompt && !isMcdPrompt) return false;

  // Count parenthesized factors as a proxy for "size" of the answer
  const countFactors = (s: string): number => {
    const matches = s.match(/\(/g);
    return matches ? matches.length : 0;
  };

  const expFactorCount = countFactors(expected);
  const stuFactorCount = countFactors(student);

  if (isMcmPrompt) {
    // Asking for MCM → student picked answer with FEWER factors (MCD-like).
    // Primary: fewer parenthesized factors. Secondary: shorter string
    // (MCD uses min exponents, producing more compact expressions than MCM).
    if (stuFactorCount <= 0) return false;
    return (
      stuFactorCount < expFactorCount ||
      (stuFactorCount === expFactorCount && student.length < expected.length)
    );
  }

  if (isMcdPrompt) {
    // Asking for MCD → student picked answer with MORE factors (MCM-like).
    // Primary: significantly more parenthesized factors (gap ≥ 2) to avoid
    //   false-positives when the distractor is just one of the original
    //   polynomials (which has more factors than MCD but is NOT the MCM).
    // Secondary: same factor count but longer string (higher exponents,
    //   typical of MCM vs MCD expressions with same factor structure).
    return (
      stuFactorCount >= expFactorCount + 2 ||
      (stuFactorCount === expFactorCount && student.length > expected.length)
    );
  }

  return false;
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

  // ── U2 polynomial error patterns ───────────────────────────

  if (isU2LikeTermError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U2_LIKE_TERM_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU2RuffiniSignoAError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U2_RUFFINI_SIGNO_A_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU2DegreeError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U2_DEGREE_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU2MissingTermError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U2_MISSING_TERM_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU2IncompleteFactorError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U2_INCOMPLETE_FACTOR_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU2SignoFactorizacionError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U2_SIGNO_FACTORIZACION_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU2CasoIncorrectoError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U2_CASO_INCORRECTO_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  // ── U2 Aplicaciones error patterns ────────────────────────

  if (isU2DenominadorCeroError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U2_DENOMINADOR_CERO_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU2ConfundeMcmMcdError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U2_CONFUNDE_MCM_MCD_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  return undefined;
}
