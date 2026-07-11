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

// ── U3 (Ecuaciones y sistemas) error tag sets ────────────────────────────

/** Tags for incorrect variable isolation in linear equations. */
const U3_AISLAMIENTO_INCORRECTO_TAGS = new Set(["u3_aislamiento_incorrecto"]);

/** Tags for quadratic factorization errors (sign flip, missing root, etc.). */
const U3_FACTORIZACION_CUADRATICA_TAGS = new Set(["u3_factorizacion_cuadratica"]);

/** Tags for inequality sign-flip errors when multiplying/dividing by negative. */
const U3_SIGNO_DESIGUALDAD_TAGS = new Set(["u3_signo_desigualdad"]);

/** Tags for absolute-value inequation errors (treating single-value instead of interval). */
const U3_DOS_VALORES_ABSOLUTO_TAGS = new Set(["u3_dos_valores_absoluto"]);

/** Tags for line slope/intercept confusion or slope computed with swapped coordinates. */
const U3_PENDIENTE_O_ORDENADA_TAGS = new Set(["u3_pendiente_o_ordenada"]);

/** Tags for substitution/elimination errors in systems (dropped term, sign flip). */
const U3_SUSTITUCION_O_ELIMINACION_TAGS = new Set(["u3_sustitucion_o_eliminacion"]);

/** Tags for exponential equations that confuse bases or fail to equate exponents. */
const U3_IGUALDAD_EXPONENCIALES_TAGS = new Set(["u3_igualdad_exponenciales"]);

/** Tags for log-property misuse (log(a+b) ≠ log a + log b, etc.). */
const U3_PROPIEDAD_LOGARITMO_TAGS = new Set(["u3_propiedad_logaritmo"]);

/** Tags for incorrect translation from verbal language to algebraic language. */
const U3_TRADUCCION_INCORRECTA_TAGS = new Set(["u3_traduccion_incorrecta"]);

/**
 * Tags for rationalization errors on irrational-coefficient linear equations.
 *
 * S1a scope: tightly bound to the P1l signature
 * `2·(√2 − (√5/2)·x) = (√2/2) + (√5/2)·x`. The detector MUST NOT match
 * unrelated radical exercises (e.g. radical isolation `√(x − 2) = 4`,
 * absolute-value inequation `|x| < 3`, log equations `log_2(8)`).
 *
 * See `isU3RacionalizacionIrracionalError` for the prompt+type+skill guard.
 */
const U3_RACIONALIZACION_IRRACIONAL_TAGS = new Set([
  "u3_racionalizacion_irracional",
]);

/**
 * Tags for discriminant-sign-evaluation errors on parameter-k quadratic
 * classification problems (S1b — P6b/P6f).
 *
 * Scope: tightly bound to the P6 parameter-k signature
 * (prompt must reference `kx²` or `-kx²` AND a classification word like
 * `complejos|reales|iguales`). The detector MUST NOT match P5d
 * `(7x²−3)/4 = 141` (numeric coefficient, no k), numeric-coefficient
 * P5-style quadratics, or unrelated absolute-value / log / exponential
 * equations.
 *
 * See `isU3DiscriminanteSignoIncorrectoError` for the prompt+type+skill
 * guard.
 */
const U3_DISCRIMINANTE_SIGNO_INCORRECTO_TAGS = new Set([
  "u3_discriminante_signo_incorrecto",
]);

/**
 * Tags for absolute-value equation misconceptions (S3 — P8 family).
 *
 * Scope: tightly bound to the `mat.u3.ecuaciones_valor_absoluto` skill
 * (cross-skill bleed guard). The detectors MUST NOT match
 * `inecuaciones_valor_absoluto` (where `u3_dos_valores_absoluto` lives)
 * or any other U3 surface.
 *
 * Three tags cover the three spec-required cases:
 *   - `u3_abs_eq_signo_negativo_incorrecto`: student concludes 'no hay
 *     solución' or single value on P8g (-|x| = -k) — must multiply by -1
 *     in both members to cancel the external signs.
 *   - `u3_abs_eq_suma_constante_fuera`: student treats |x| + c = d as
 *     |x + c| = d (sum inside vs outside the bars) on P8b.
 *   - `u3_abs_eq_rama_unica`: student forgets one branch of the
 *     |ax+b| = ±c decomposition and reports a single root on P8a/c/d/e/h.
 *
 * See the three detector functions for the prompt+type+skill guard.
 */
const U3_ABS_EQ_SIGNO_NEGATIVO_INCORRECTO_TAGS = new Set([
  "u3_abs_eq_signo_negativo_incorrecto",
]);
const U3_ABS_EQ_SUMA_CONSTANTE_FUERA_TAGS = new Set([
  "u3_abs_eq_suma_constante_fuera",
]);
const U3_ABS_EQ_RAMA_UNICA_TAGS = new Set([
  "u3_abs_eq_rama_unica",
]);

/**
 * Tags for product/quotient sign-chart misconceptions (S5 — P9 family).
 *
 * Scope: tightly bound to the `mat.u3.inecuaciones_producto_cociente` skill
 * (cross-skill bleed guard). The detectors MUST NOT match linear
 * inequalities (`inecuaciones_lineales`), value-absolute inequalities
 * (`inecuaciones_valor_absoluto`), or any other U3 surface.
 *
 * Three tags cover the three spec-required cases:
 *   - `u3_signchart_factor_signo_incorrecto`: student inverted the sign of
 *     one factor in some interval (or forgot to flip the inequality when
 *     multiplying by -1).
 *   - `u3_signchart_critical_root_omitido`: student cancelled or simplified
 *     a factor before building the sign chart and lost a critical root
 *     (P9p factor-x trap is the canonical example).
 *   - `u3_signchart_dominio_denominador`: student included in the solution
 *     a point that zeros the denominator — domain exclusion that must
 *     always remain excluded.
 *
 * See the three detector functions for the prompt+type+skill guard.
 */
const U3_SIGNCHART_FACTOR_SIGNO_INCORRECTO_TAGS = new Set([
  "u3_signchart_factor_signo_incorrecto",
]);
const U3_SIGNCHART_CRITICAL_ROOT_OMITIDO_TAGS = new Set([
  "u3_signchart_critical_root_omitido",
]);
const U3_SIGNCHART_DOMINIO_DENOMINADOR_TAGS = new Set([
  "u3_signchart_dominio_denominador",
]);

/**
 * Tags for perpendicular-by-point perpendicularity misconceptions (S6 — P12/P20 family).
 *
 * Per the spec: `u3_recta_pendiente_perpendicular` fires when the student
 * uses the RECIPROCAL of the reference slope (m_perp = 1/m) instead of the
 * NEGATIVE RECIPROCAL (m_perp = −1/m). For reference slope 1/4, the trap
 * produces y = 4x; for reference slope 2/3, the trap produces y = (3/2)x + …
 *
 * See `isU3RectaPendientePerpendicularError` for the prompt+type+skill guard.
 */
const U3_RECTA_PENDIENTE_PERPENDICULAR_TAGS = new Set([
  "u3_recta_pendiente_perpendicular",
]);

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

/**
 * Extract a numeric value from a string that may be in forms like:
 *   - "5"        (raw number)
 *   - "x = 5"    (variable assignment)
 *   - "x=−3"     (Unicode minus assignment)
 *   - "−3"       (signed value)
 *
 * Returns the numeric value or undefined if no number is present.
 */
function extractNumericFromAnswer(value: string): number | undefined {
  // Try direct numeric parse first (catches plain numbers and signed numbers).
  const direct = numericAnswer(value);
  if (direct !== undefined) return direct;

  // Fall back to regex: find first signed or unsigned integer/decimal in the
  // string. This handles "x = 5", "x=−3", "x = 12.5", "Pendiente 3, ordenada 2".
  const normalized = value.replace(/−/g, "-");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const num = Number(match[0]);
  return Number.isNaN(num) ? undefined : num;
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
 * Detect variable-isolation errors: student picked the post-subtraction value
 * instead of the post-division value (i.e., they performed the addition/
 * subtraction step but forgot to divide by the leading coefficient).
 *
 * Pattern detection:
 *   - Prompt matches `ax ± b = c` where a, b, c are small positive integers
 *     (with optional negative sign on a).
 *   - Student's picked option equals the post-subtraction value (c - b)
 *     but NOT the expected answer.
 *
 * Applies to MC exercises whose prompt is a linear equation.
 */
function isU3AislamientoIncorrectoError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;

  // Normalize Unicode minus in the prompt so the regex matches both ASCII
  // and LaTeX-style hyphens.
  const prompt = exercise.prompt.replace(/−/g, "-");

  // Match linear equation of the form `ax ± b = c` (a may be negative).
  // Examples: "2x + 5 = 13", "3x - 2 = 10", "-2x + 4 = 10"
  const linearMatch = prompt.match(
    /(-?\d+)\s*[xX]\s*([+-])\s*(\d+)\s*=\s*(-?\d+)/
  );
  if (!linearMatch) return false;

  const a = Number(linearMatch[1]);
  const op = linearMatch[2];
  const b = Number(linearMatch[3]);
  const c = Number(linearMatch[4]);
  if (a === 0 || b === 0) return false;

  // Compute the post-subtraction intermediate value the student would have
  // arrived at if they forgot the final division by |a|.
  // For "ax + b = c": intermediate = c - b
  // For "ax - b = c": intermediate = c + b
  const intermediate = op === "+" ? c - b : c + b;
  if (intermediate === 0) return false;

  // Compare numerically against the student's selected option value.
  const studentNum = extractNumericFromAnswer(userAnswer);
  if (studentNum === undefined) return false;

  const expectedNum = extractNumericFromAnswer(exercise.expectedAnswer);
  if (expectedNum === undefined || studentNum === expectedNum) return false;

  return studentNum === intermediate;
}

/**
 * Detect rationalization-of-irrational-coefficient errors on the P1l
 * signature: student picked a wrong rational value where the correct
 * answer is `√10/5`.
 *
 * P1l canonical surface:
 *   `2·(√2 − (√5/2)·x) = (√2/2) + (√5/2)·x`
 * Algebraic resolution: `(3√2/2) = (3√5/2)·x` ⇒ `x = √2/√5 = √10/5`.
 * Canonical misconceptions that yield a wrong rational value:
 *   - `x = -2/5`  (sign lost when multiplying by √5/√5)
 *   - `x = √5/5`  (forgot to multiply numerator by √5)
 *   - `x = 2/5`   (sign error in a different direction, no rationalization)
 *
 * SCOPE (S1a): This detector MUST only fire for exercises whose prompt
 * carries the P1l surd signature. Unrelated radical exercises (e.g.
 * `√(x − 2) = 4` radical isolation, `|x| < 3` absolute-value inequation,
 * log equations `log₂(8)`) MUST NEVER be tagged.
 *
 * The four guard rails that enforce the no-bleed contract:
 *   1. `exercise.type === "multiple-choice"` (numerical form MUST NOT match)
 *   2. `exercise.skillId === "mat.u3.ecuaciones_lineales"` (skill-scoped)
 *   3. Prompt contains BOTH `√2` AND `√5/2` (the P1l surd pattern)
 *   4. Prompt contains `x` AND `=` (linear structure check)
 * On top of those: the student's picked option must match ONE of the
 * canonical wrong values (rational form, not the correct `√10/5`).
 */
function isU3RacionalizacionIrracionalError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;
  // Skill-scoped: only fires for the lineales skill. Cross-skill bleed
  // guard: a P1i-style `√(x − 2) = 4` on the lineales skill is excluded
  // by the prompt signature check, but a P9h `|x − 2| ≤ 5` on the
  // `mat.u3.inecuaciones_valor_absoluto` skill is excluded outright by
  // this skill-id guard.
  if (exercise.skillId !== "mat.u3.ecuaciones_lineales") return false;

  // Normalize Unicode minus in prompt (consistency with sibling detectors).
  const prompt = exercise.prompt.replace(/−/g, "-");

  // P1l signature: BOTH √2 AND √5/2 must appear in the prompt, plus `x`
  // and `=`. This excludes any non-P1l radical pattern (e.g. `√(x − 2)
  // = 4` does NOT contain `√2` literal — the `√` only opens a `√(`
  // group). It also excludes `|x| = a` (no `√2` or `√5/2`).
  const hasSqrt2 = /√2/.test(prompt);
  const hasSqrt5Over2 = /√5\s*\/\s*2/.test(prompt);
  const hasXVar = /x/.test(prompt);
  const hasEquals = /=/.test(prompt);
  if (!(hasSqrt2 && hasSqrt5Over2 && hasXVar && hasEquals)) return false;

  // Don't tag the correct answer (defensive: even if the canonical right
  // option is `x = √10/5`, we want to return undefined, not `…`).
  const student = userAnswer.trim();
  if (student === exercise.expectedAnswer.trim()) return false;

  // Recognize the canonical misconception values. Each is a documented
  // "rationalization mistake" derived from the P1l algebraic step
  // (`x = √2/√5`):
  //   - `x = -2/5`  → sign flipped
  //   - `x = 2/5`   → sign flipped in the other direction
  //   - `x = √5/5`  → forgot to multiply numerator by √5
  //   - `x = √10/5` (correct) is filtered by the equality check above.
  //
  // Match the symbolic portion with a tolerant pattern that allows
  // optional spaces and the literal `-` or `−` Unicode minus.
  const SANE = String.raw`(?:−|-)`;
  const POSITIVE_MISS_VALUES = [/\b2\s*\/\s*5\b/, /\b√5\s*\/\s*5\b/];
  for (const pat of POSITIVE_MISS_VALUES) {
    if (pat.test(student)) return true;
  }
  // Negative miss values need a leading `-` (or `−`) separator that
  // is NOT the start of a different word. The previous regex used a
  // leading `\b${SANE}` which works for ASCII `-` in `x = -2/5` (the
  // boundary sits between `x` and `-`, and the regex then walks `-`,
  // `2`, `/`, `5` with a trailing `\b`). The same regex silently
  // FAILS for `x = −2/5` (Unicode minus): `\b` requires a `\w` ↔
  // non-`\w` transition, and `−` is non-`\w` — when `−` is preceded
  // by another non-`\w` char (e.g. `=`, `(`, or a space) there is no
  // `\b` to consume at the engine-relative position BEFORE `−`. The
  // regex then tries every later boundary and finds nothing that
  // matches `${SANE}` followed by the rational portion.
  //
  // Same failure mode for `x = -√5/5` / `x = −√5/5`: the `√` is
  // non-`\w`, so the `\b` between the leading `-`/`−` and the `√`
  // does not exist either.
  //
  // Fix: replace the leading `\b${SANE}` with `(?<![0-9])${SANE}` —
  // a negative lookbehind that rejects the leading `-`/`−` ONLY when
  // it is immediately preceded by a digit (which would make it look
  // like arithmetic subtraction, e.g. `5-2/5`). All other separators
  // (` = `, ` (`, start-of-string, etc.) now allow the match. The
  // trailing `\b` after `5` is preserved.
  const NEGATIVE_MISS_PATTERNS = [
    new RegExp(String.raw`(?<![0-9])${SANE}\s*2\s*\/\s*5\b`),
    new RegExp(String.raw`(?<![0-9])${SANE}\s*√5\s*\/\s*5\b`),
  ];
  for (const pat of NEGATIVE_MISS_PATTERNS) {
    if (pat.test(student)) return true;
  }
  return false;
}

/**
 * Detect discriminant-sign-evaluation errors on parameter-k quadratic
 * classification problems (P6b/P6f in 03_ej_utn.pdf, ejercitación 6).
 *
 * Canonical misconceptions yield a set with the BOUNDARY-DIRECTION
 * FLIPPED (e.g., expected `(-∞, -1/4)` but student picks `(-1/4, ∞)`):
 *   - Inverting the inequality when solving Δ < 0 ⇒ k > -1/4 instead of
 *     k < -1/4, OR expanding `-4·(-k)·4` as `-16k` instead of `+16k`.
 *
 * SCOPE (S1b): tightly bound to the P6 parameter-k signature. MUST NOT
 * match P5d `(7x²−3)/4 = 141` (numeric coefficient, no `k`), numeric-
 * coefficient P5-style quadratics, or unrelated absolute-value / log /
 * exponential / sistemas equations.
 *
 * The four guard rails enforcing the no-bleed contract:
 *   1. `exercise.type === "multiple-choice"`.
 *   2. `exercise.skillId === "mat.u3.ecuaciones_cuadraticas"` (skill-scoped).
 *   3. Prompt contains `kx²` or `-kx²` (parameter-k quadratic signature).
 *   4. Prompt contains a classification word (`complejos|reales|iguales`).
 *
 * Direction-flip detection: the student keeps the SAME finite boundary
 * value(s) but FLIPS the position of infinity (`-∞` ↔ `∞`).
 */
function isU3DiscriminanteSignoIncorrectoError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;
  // Skill-scoped: only fires for the cuadraticas skill.
  if (exercise.skillId !== "mat.u3.ecuaciones_cuadraticas") return false;
  // Normalize Unicode minus + superscript so the kx² regex matches both
  // Unicode `kx²` and ASCII `kx^2`.
  const prompt = normalizeSuperscripts(exercise.prompt.replace(/−/g, "-"));
  // P6 parameter-k signature. Excludes numeric-coefficient P5d / P5-style.
  const hasParameterK = /[-]?\s*k\s*x\s*\^?\s*2/.test(prompt);
  if (!hasParameterK) return false;
  // Classification context (complejos | reales | iguales).
  if (!/\bcompleja?s?\b|\breales?\b|\biguales?\b/i.test(prompt)) return false;
  // Equality guard.
  const student = normalizeSuperscripts(userAnswer.trim().replace(/−/g, "-"));
  const expected = normalizeSuperscripts(exercise.expectedAnswer.trim().replace(/−/g, "-"));
  if (student === expected) return false;
  if (!/[([]/.test(student)) return false;
  // Direction-flip: expected has `-∞`, student has `∞` (no `-`).
  // - Expected `(-∞, -1/4)` vs Student `(-1/4, ∞)`: -∞ ↔ ∞.
  // - Expected `(-∞,0)∪(0,1/4)` vs Student `(0,-1/4)∪(-1/4,∞)`: -∞ ↔ ∞.
  if (!/-\s*∞/.test(expected)) return false;
  if (!/(?<!-)\s*∞/.test(student)) return false;
  if (/-\s*∞/.test(student)) return false;
  return true;
}

/**
 * Detect absolute-value-equation `-|x| = -k` (P8g) misconception: student
 * concluded 'no hay solución' or single value when the right-hand side is
 * negative on BOTH sides of the bars.
 *
 * Canonical resolution for P8g: multiply by -1 in both members to cancel
 * the external signs and obtain |x| = k with k > 0, which has TWO solutions
 * x = ±k. Student's misconception collapses the two-value set into either
 * 'no solution' (misreading the negative sign as k < 0) or a single value
 * (forgetting the symmetric root).
 *
 * SCOPE (S3): tightly bound to the P8g signature. MUST NOT match P8c/d/e/f/h
 * (no external negative bars), P8b (sum outside the bars), or any other
 * U3 surface.
 *
 * Guard rails (no-bleed contract):
 *   1. `exercise.type === "multiple-choice"`.
 *   2. `exercise.skillId === "mat.u3.ecuaciones_valor_absoluto"` (skill-scoped;
 *      cross-skill bleed guard for `inecuaciones_valor_absoluto`).
 *   3. Prompt carries the `-|x| = -k` signature with k > 0 AND the expected
 *      answer is the compound two-root form (`x = -k o x = k` or `x = ±k`).
 *      Without both anchors the detector cannot reason about ±k and MUST
 *      stay silent.
 *   4. Student answer is "no hay solución" / "sin solución" form, OR a SINGLE
 *      numeric value whose magnitude equals k (one of the two valid roots —
 *      the documented P8g distractor "x = -10.5" or "x = 10.5" for k = 10.5).
 *      Anything else (e.g. an arbitrary single-value wrong answer) does NOT
 *      match the documented misconception and is intentionally NOT tagged.
 */
function isU3AbsEqSignoNegativoIncorrectoError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;
  if (exercise.skillId !== "mat.u3.ecuaciones_valor_absoluto") return false;
  const prompt = exercise.prompt.replace(/−/g, "-");
  // P8g signature: leading "-", "|x|", "=", and a negative RHS value (-k).
  // We parse the RHS so the detector can reason about ±k and stay silent
  // on prompts that happen to have a stray `-` (e.g. prompt text mentioning
  // a separate unrelated negation).
  const p8gMatch = prompt.match(/-\s*\|x\|\s*=\s*(-?\d+(?:\.\d+)?)/);
  if (!p8gMatch) return false;
  const rhsSigned = Number(p8gMatch[1]);
  // The canonical P8g surface has RHS = -k with k > 0, i.e. rhsSigned < 0.
  // If rhsSigned ≥ 0 the equation is not the documented P8g shape and we
  // stay silent rather than guessing ±k.
  if (rhsSigned >= 0) return false;
  const k = -rhsSigned;
  const expected = exercise.expectedAnswer.trim();
  // The expected answer MUST be the compound two-root form (`x = -k o x = k`
  // or `x = ±k`-style). Without this anchor the single-value trap cannot
  // be distinguished from any other wrong answer.
  const expectedIsCompound = /(\bo\b|\u00b1|,\s*[xy])/i.test(expected);
  if (!expectedIsCompound) return false;
  // Equality guard: never tag the correct two-root answer.
  const student = userAnswer.trim();
  if (student === expected) return false;
  // Distractor A: "no hay solución" / "sin solución" collapse. Misreads -k
  // as k < 0 and concludes the canonical equation is impossible.
  const studentLower = student.toLowerCase();
  if (/(no\s+hay|sin)\s+soluci[oó]n/.test(studentLower)) return true;
  // Distractor B: a SINGLE value matching one root of the symmetric set.
  // The student's answer must be a single value (no compound markers) AND
  // its numeric magnitude must equal k. Arbitrary wrong single values
  // (e.g. "x = 0", "x = 100") are intentionally NOT tagged.
  const studentIsCompound = /(\bo\b|\u00b1|,\s*[xy])/i.test(student);
  if (studentIsCompound) return false;
  const studentNum = extractNumericFromAnswer(student);
  if (studentNum === undefined) return false;
  return Math.abs(studentNum) === k;
}

/**
 * Detect absolute-value-equation `|x| + c = d` (P8b) misconception: student
 * treated the sum as INSIDE the bars (`|x + c| = d`) or skipped the
 * isolation step before opening the two branches.
 *
 * Canonical resolution for P8b: isolate |x| = d - c FIRST, then open into
 * two branches. Student's misconception places the constant c INSIDE the
 * bars (yielding different roots).
 *
 * SCOPE (S3): tightly bound to the P8b signature. MUST NOT match P8c/d/e/f/h
 * (no constant outside the bars).
 *
 * Guard rails (no-bleed contract):
 *   1. `exercise.type === "multiple-choice"`.
 *   2. `exercise.skillId === "mat.u3.ecuaciones_valor_absoluto"`.
 *   3. Prompt carries `|x|` AND `+ ` (a positive integer constant) on the
 *      LEFT side of the equation (P8b signature: |x| + c = d with c > 0).
 *   4. Student's answer treats the constant as inside the bars
 *      (`|x + c| = d` form, yielding shifted roots).
 */
function isU3AbsEqSumaConstanteFueraError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;
  if (exercise.skillId !== "mat.u3.ecuaciones_valor_absoluto") return false;
  const prompt = exercise.prompt.replace(/−/g, "-");
  // P8b signature: |x| followed by + and a small positive integer, then =.
  // Allow optional spaces and Unicode minus.
  const hasSumaConstanteFuera = /\|x\|\s*\+\s*\d+\s*=/.test(prompt);
  if (!hasSumaConstanteFuera) return false;
  // Equality guard.
  const student = userAnswer.trim();
  if (student === exercise.expectedAnswer.trim()) return false;
  // Distractor: answer is in `|x + c| = d` form, i.e. the student answer
  // produces roots x = -c ± k (shifted by c) instead of x = ±(d - c).
  // We detect by checking that the student's answer carries a '+' inside the
  // bars OR the root magnitudes differ from the correct ±(d-c) by exactly c.
  // Simpler proxy: if the student answer contains a single "+" between x and
  // another variable or value AND no "|", it's the P8b misconception.
  // Use a robust numeric check: parse the prompt to recover c, then verify
  // the student answer's roots are x = -c ± k.
  const sumaMatch = prompt.match(/\|x\|\s*\+\s*(\d+)\s*=\s*(-?\d+)/);
  if (!sumaMatch) return false;
  const c = Number(sumaMatch[1]);
  const d = Number(sumaMatch[2]);
  const correctRoot = d - c;
  // Student's answer must NOT match the correct ±(d-c) pair.
  // Extract any number from the student answer; if it equals c ± correctRoot
  // (the P8b misconception root), flag.
  const studentNum = extractNumericFromAnswer(student);
  if (studentNum === undefined) return false;
  // P8b misconception roots: x = -(c ± (d-c)) = -2c+d or just -c ± correctRoot
  // For |x| + c = d: the P8b distractor "|x + c| = d" gives roots x = -c ± d.
  // Reject if the student picked x = -c + d or x = -c - d.
  return studentNum === -c + d || studentNum === -c - d;
}

/**
 * Detect absolute-value-equation `|ax + b| = c` (P8a/c/d/e/h) misconception:
 * student reported only ONE branch of the two-branch decomposition
 * (`ax + b = c` OR `ax + b = -c`) instead of the full union.
 *
 * Canonical resolution for P8 |ax+b|=c: open into TWO branches and union
 * the roots. Student's misconception reports just one root (either the
 * positive branch or the negative branch).
 *
 * SCOPE (S3): tightly bound to the P8 |ax+b|=c signature. MUST NOT match
 * P8g (-|x| = -k), P8b (|x| + c = d), or non-P8 surfaces.
 *
 * Guard rails (no-bleed contract):
 *   1. `exercise.type === "multiple-choice"`.
 *   2. `exercise.skillId === "mat.u3.ecuaciones_valor_absoluto"`.
 *   3. Prompt carries `|` ... `|` AND `=` AND a single numeric value on
 *      the RIGHT (P8 |ax+b|=c form).
 *   4. Prompt does NOT have a leading `-` before the bars (P8g guard).
 *   5. Prompt does NOT have `+ c` outside the bars (P8b guard).
 *   6. Student answer is a SINGLE value (not "x = a o x = b" or `±` form).
 */
function isU3AbsEqRamaUnicaError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;
  if (exercise.skillId !== "mat.u3.ecuaciones_valor_absoluto") return false;
  const prompt = exercise.prompt.replace(/−/g, "-");
  // P8g guard: leading negative before bars.
  if (/-\s*\|/.test(prompt)) return false;
  // P8b guard: |x| + c = d form.
  if (/\|x\|\s*\+\s*\d+\s*=/.test(prompt)) return false;
  // P8 |ax+b|=c signature: a `|` ... `|` block followed by `=` and a number.
  if (!/\|[^|]+\|\s*=\s*-?\d+/.test(prompt)) return false;
  // Equality guard.
  const student = userAnswer.trim();
  if (student === exercise.expectedAnswer.trim()) return false;
  // Distractor: a single value (no "o", no "±", no ",").
  // Compound answer forms carry "o" / "±" / "," between two values.
  if (/(\bo\b|\u00b1|,)/.test(student)) return false;
  // The single-value student answer must be in the options list (a declared
  // distractor, not arbitrary input).
  const options = exercise.options ?? [];
  return options.some((opt) => getExerciseOptionValue(opt).trim() === student);
}

/**
 * Detect sign-chart factor-sign-evaluation errors (S5 — P9 family).
 *
 * Canonical misconception: student inverted the sign of one factor in some
 * interval of the sign chart (e.g. claimed `(2x − 1)` is positive for
 * `x ∈ (-∞, 1/2)` when it is actually negative). The result is that the
 * student selects a wrong interval set — typically the closed complement
 * of the canonical union of two open/closed rays (e.g. picking `[1/2, 3]`
 * instead of `(-∞, 1/2] ∪ [3, +∞)` for `(2x − 1)(x − 3) ≥ 0`).
 *
 * Distinguishing feature vs. critical_root_omitido: the student's collapsed
 * interval has the SAME finite endpoints as the canonical union's finite
 * endpoints (no root was lost — only the sign was inverted on some interval).
 * For P9w, canonical `(-∞, ½] ∪ [3, +∞)` has finite endpoints {½, 3};
 * the student's `[½, 3]` also has {½, 3}. For P9p factor-x trap, the
 * student answer `[-½, ½]` has only {−½, ½}, which is a STRICT SUBSET of
 * the canonical `[-½, 0] ∪ [½, +∞)` finite endpoints {−½, 0, ½} — that
 * case is captured by `critical_root_omitido` instead.
 *
 * SCOPE (S5): tightly bound to the `mat.u3.inecuaciones_producto_cociente`
 * skill. MUST NOT match unrelated linear inequalities (`inecuaciones_lineales`),
 * absolute-value inequalities (`inecuaciones_valor_absoluto`), or any
 * non-P9 surface.
 *
 * Guard rails:
 *   1. `exercise.type === "multiple-choice"`.
 *   2. `exercise.skillId === "mat.u3.inecuaciones_producto_cociente"`.
 *   3. Prompt carries a sign-chart inequality shape: product/quotient of
 *      linear factors + inequality operator.
 *   4. Student's answer is a SINGLE closed interval (no `∪`); the
 *      canonical expected answer is a UNION of two intervals; and the
 *      student's finite endpoint set equals the canonical's finite
 *      endpoint set (sign-flip signature: same endpoints, no root lost).
 */
function isU3SignchartFactorSignoIncorrectoError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;
  if (exercise.skillId !== "mat.u3.inecuaciones_producto_cociente") return false;
  const prompt = exercise.prompt.replace(/−/g, "-");
  const hasProductForm =
    /\(.*\)\s*\(/.test(prompt) || /\\frac\s*\{/.test(prompt) || /\)\s*\/\s*\(/.test(prompt);
  if (!hasProductForm) return false;
  const hasInequality = /(<|>|≤|≥|\\leq|\\geq|<=|>=)/.test(prompt);
  if (!hasInequality) return false;
  const student = userAnswer.trim();
  const expected = exercise.expectedAnswer.trim();
  if (student === expected) return false;
  if (!/∪/.test(expected)) return false;
  if (/∪/.test(student)) return false;
  if (!/^[\[\(].+,.+[\]\)]\s*$/.test(student)) return false;
  // Same finite endpoints as the canonical union — that is the sign-flip
  // signature. If the student's endpoints are a STRICT SUBSET, the trap is
  // a critical-root omission (sibling detector) — not a factor-sign flip.
  const expectedEndpoints = extractFiniteEndpoints(expected);
  const studentEndpoints = extractFiniteEndpoints(student);
  if (expectedEndpoints.length !== studentEndpoints.length) return false;
  const sortedExpected = [...expectedEndpoints].sort((a, b) => a - b);
  const sortedStudent = [...studentEndpoints].sort((a, b) => a - b);
  for (let i = 0; i < sortedExpected.length; i++) {
    if (Math.abs(sortedExpected[i] - sortedStudent[i]) > 1e-9) return false;
  }
  return true;
}

/**
 * Detect sign-chart critical-root-omission errors (S5 — P9 family).
 *
 * Canonical misconception (P9p factor-x trap): student cancels or simplifies
 * a factor before building the sign chart, losing a critical root. For
 * `(x − 2x²)(x + ½) ≤ 0`, the wrong simplification yields a sign chart with
 * only two roots (`-½` and `½`) instead of three (`-½`, `0`, `½`), giving the
 * incorrect closed interval `[-½, ½]` instead of the canonical union
 * `[-½, 0] ∪ [½, +∞)`.
 *
 * Distinguishing feature vs. factor_signo_incorrecto: the student's
 * collapsed interval ends up with FEWER distinct finite endpoints than the
 * canonical union. For P9p, canonical `[-½, 0] ∪ [½, +∞)` has THREE finite
 * endpoints (`-½`, `0`, `½`); the student's `[-½, ½]` has only TWO
 * (`-½`, `½`) — the middle root `0` is lost. For P9w, canonical
 * `(-∞, ½] ∪ [3, +∞)` has TWO finite endpoints (`½`, `3`); the student's
 * `[½, 3]` ALSO has two — same set, just closed instead of unioned.
 *
 * SCOPE (S5): tightly bound to the P9 sign-chart leaf. MUST NOT match
 * quadratic-equation problems (e.g. `x² = 9`) that happen to carry two
 * roots — those are not sign-chart exercises.
 *
 * Guard rails:
 *   1. `exercise.type === "multiple-choice"`.
 *   2. `exercise.skillId === "mat.u3.inecuaciones_producto_cociente"`.
 *   3. The prompt must be a SIGN-CHART INEQUALITY (not an equation):
 *      inequality operator present AND product form (two `(...)` groups
 *      or `\frac{...}{...}`).
 *   4. The canonical expected answer is a UNION of two intervals (so it has
 *      2 or 3 finite endpoints when split), and the student's answer
 *      collapses those into a single closed interval whose finite endpoints
 *      form a STRICT SUBSET of the canonical's finite endpoints
 *      (factor-collapse signal).
 *   5. Equality guard.
 */
function isU3SignchartCriticalRootOmitidoError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;
  if (exercise.skillId !== "mat.u3.inecuaciones_producto_cociente") return false;
  const prompt = exercise.prompt.replace(/−/g, "-");
  // Sign-chart inequality (NOT equation): must have inequality operator.
  const hasInequality = /(<|>|≤|≥|\\leq|\\geq|<=|>=)/.test(prompt);
  if (!hasInequality) return false;
  // Must have product/quotient shape (not a bare quadratic equation).
  const hasProductForm =
    /\(.*\)\s*\(/.test(prompt) || /\\frac\s*\{/.test(prompt) || /\)\s*\/\s*\(/.test(prompt);
  if (!hasProductForm) return false;
  // Equality guard.
  const student = userAnswer.trim();
  const expected = exercise.expectedAnswer.trim();
  if (student === expected) return false;
  // Expected answer is a union of two intervals.
  if (!/∪/.test(expected)) return false;
  // Student's answer collapses to a single closed interval (the trap).
  if (/∪/.test(student)) return false;
  if (!/^[\[\(].+,.+[\]\)]\s*$/.test(student)) return false;
  // Extract finite endpoints from both sides. The canonical union `(-∞, a]
  // ∪ [b, +∞)` has finite endpoints {a, b}; `[-1/2, 0] ∪ [1/2, +∞)` has
  // {−1/2, 0, 1/2}. We strip infinity symbols and brackets.
  const expectedEndpoints = extractFiniteEndpoints(expected);
  const studentEndpoints = extractFiniteEndpoints(student);
  if (expectedEndpoints.length < 2) return false;
  // factor_x collapse: student loses at least one endpoint from the canonical.
  // Equality of the endpoint multisets means the student's collapse is NOT a
  // critical-root omission — it's a sign inversion (handled by the sibling
  // detector).
  if (studentEndpoints.length >= expectedEndpoints.length) return false;
  return true;
}

/**
 * Helper: extract the distinct finite endpoint values from an interval
 * expression like `(-∞, 1/2] ∪ [3, +∞)` or `[-1/2, 0] ∪ [1/2, +∞)`.
 *
 * Infinity symbols are dropped (the trap detectors are about finite
 * critical roots). Endpoints are normalized as decimals or rationals
 * (e.g. `1/2`, `-1/2`, `0`); for ordering purposes we compare as
 * decimal values.
 */
function extractFiniteEndpoints(expression: string): number[] {
  // Normalize Unicode minus + infinity.
  const norm = expression.replace(/−/g, "-").replace(/∞/g, "");
  // Match any rational `a/b` or signed integer / signed decimal adjacent
  // to a `,` or at the boundary.
  const values: number[] = [];
  const rationalRe = /(-?\s*\d+)\s*\/\s*(-?\s*\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = rationalRe.exec(norm)) !== null) {
    const num = Number(m[1].replace(/\s+/g, ""));
    const den = Number(m[2].replace(/\s+/g, ""));
    if (den !== 0) values.push(num / den);
  }
  // Match isolated integers/decimals (NOT preceded by `/` or followed by `/`).
  // We use a heuristic: any `±N` adjacent to a `,` or at boundary.
  const isolatedRe = /([\[\(,]\s*)(-?\s*\d+(?:\.\d+)?)\s*([\]\)\,])/g;
  while ((m = isolatedRe.exec(norm)) !== null) {
    const v = Number(m[2].replace(/\s+/g, ""));
    if (Number.isFinite(v) && !values.includes(v)) values.push(v);
  }
  return values;
}

/**
 * Detect sign-chart denominator-zero (domain exclusion) errors (S5 — P9 family).
 *
 * Canonical misconception (P9u / P9v): student includes in the solution a
 * point that zeros the denominator — `x = 2` for `(x + 2)/(2 − x) ≥ 1`,
 * or `x = -1` / `x = 2` for `(x² − x)/((x + 1)(2 − x)) ≥ 0`. The expression
 * is NOT defined at those points, so they MUST remain excluded from the
 * solution regardless of whether the inequality is strict or not.
 *
 * SCOPE (S5): tightly bound to the P9 sign-chart leaf. MUST NOT match
 * domain-only questions (e.g. "find the domain of f(x) = 1/(x − 3)") —
 * those are not sign-chart exercises.
 *
 * Guard rails:
 *   1. `exercise.type === "multiple-choice"`.
 *   2. `exercise.skillId === "mat.u3.inecuaciones_producto_cociente"`.
 *   3. The expected answer is OPEN at a critical endpoint (denominator zero
 *      exclusion). Specifically: `, a)` or `(a, ` forms.
 *   4. Student's answer CLOSES that endpoint (the trap): `, a]` or `[a, `.
 */
function isU3SignchartDominioDenominadorError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;
  if (exercise.skillId !== "mat.u3.inecuaciones_producto_cociente") return false;
  // The expected answer must be open at an endpoint (sign of denominator exclusion).
  const expected = exercise.expectedAnswer.trim();
  // Detect: expected has `, a)` or `(a, ` or `, a)` etc — meaning it
  // closes some endpoints and opens others. We want to flag when the
  // student closes an endpoint that the canonical answer opens.
  // Simple invariant: if the expected answer ends with `, a)` or contains
  // `, a)` for some finite a, then the student must NOT close that endpoint.
  // Equality guard: must differ from canonical.
  const student = userAnswer.trim();
  if (student === expected) return false;
  // Find any `, a)` boundary in the expected answer (a finite open endpoint).
  const openEndpoint = /,\s*([+-]?\s*\d+(?:\s*\/\s*\d+)?)\)/.exec(expected);
  if (!openEndpoint) return false;
  const a = openEndpoint[1].replace(/\s+/g, "");
  // The student closes that endpoint: replace `, a)` with `, a]` in the
  // expected answer and check if the resulting string equals the student
  // answer (canonical closing the open endpoint).
  const closedAtA = expected.replace(/,\s*([+-]?\s*\d+(?:\s*\/\s*\d+)?)\)/, ", $1]");
  if (student === closedAtA) return true;
  // Also detect the symmetric trap: student opens where expected closes
  // (less common for denominator trap; mainly checks for symmetric cases).
  return false;
}

/**
 * Detect perpendicular-by-point perpendicularity misconception (S6 — P12d/P20b).
 *
 * Canonical misconception: when constructing a perpendicular line through a
 * point, the student uses the RECIPROCAL of the reference slope instead of
 * the NEGATIVE RECIPROCAL.
 *
 * For reference slope `m_ref`, the perpendicular slope must be `m_perp = -1/m_ref`
 * (negative reciprocal). The trap produces `m_perp = 1/m_ref` (just the reciprocal,
 * missing the negative sign). For example, with `y = (1/4)x - 5` as the reference
 * line, the correct perpendicular through the origin is `y = -4x`, but the trap
 * produces `y = 4x`.
 *
 * SCOPE (S6): tightly bound to the `mat.u3.recta` perpendicular-by-point signature.
 * MUST NOT match:
 *   - Parallel-by-point recta problems (the reciprocal is the perpendicular
 *     trap, NOT a parallel trap; parallel problems don't carry the "perpendicular"
 *     prompt signal so they fall out of the guard).
 *   - Slope-intercept problems without a parallel/perpendicular signal
 *     (no perpendicular signature in the prompt).
 *   - Exercises on other U3 skills (no skill-bleed).
 *
 * Guard rails:
 *   1. `exercise.type === "multiple-choice"`.
 *   2. `exercise.skillId === "mat.u3.recta"`.
 *   3. The prompt must signal "perpendicular" (Unicode `⊥`, ASCII `\perp`,
 *      or the literal Spanish "perpendicular" / "perpendiculares").
 *   4. The student must have selected an option whose slope is the RECIPROCAL
 *      (positive sign) of the negative reciprocal that the canonical answer
 *      uses — i.e., the student's slope differs from the canonical by exactly
 *      a sign flip on the slope (not the intercept).
 *   5. Equality guard (correct answer must NOT tag).
 */
function isU3RectaPendientePerpendicularError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;
  if (exercise.skillId !== "mat.u3.recta") return false;
  const prompt = exercise.prompt.replace(/−/g, "-");
  // Perpendicular signal in the prompt. Catches "perpendicular", "⊥",
  // "\\perp", "perpendiculares" (plural), and "perpendicular a".
  const hasPerpendicularSignal =
    /perpendicular/i.test(prompt) || /⊥/.test(prompt) || /\\perp/.test(prompt);
  if (!hasPerpendicularSignal) return false;
  // Equality guard.
  const student = userAnswer.trim();
  const expected = exercise.expectedAnswer.trim();
  if (student === expected) return false;
  // Extract slope from student answer and canonical answer.
  // Forms: "y = mx + b" or "y = (a/b)x + c" or "y = a·x + b".
  // The signature is "y = <slope>x ..." with optional "+ b" or "- b" tail.
  const slopeRe = /y\s*=\s*(-?\s*\(?\s*-?\s*\d+(?:\s*\/\s*\d+)?\s*\)?|0)\s*[·*]?\s*x/;
  const studentMatch = slopeRe.exec(student.replace(/−/g, "-"));
  const expectedMatch = slopeRe.exec(expected.replace(/−/g, "-"));
  if (!studentMatch || !expectedMatch) return false;
  // Parse slope as a number, supporting `a/b` rationals and parenthesized
  // forms like `(3/2)` or `-(3/2)`. Unicode minus has already been normalized
  // to `-`. The function strips a leading sign and an outer pair of parens,
  // in either order, before parsing as a rational or decimal.
  const parseSlope = (raw: string): number | undefined => {
    let cleaned = raw.replace(/\s+/g, "");
    // Strip outer parens (e.g., "(3/2)" -> "3/2", "-(3/2)" stays as-is
    // because it does NOT start with "(").
    if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
      cleaned = cleaned.slice(1, -1);
    }
    // Handle negative parenthesized rationals: "-(3/2)" -> "-3/2".
    if (cleaned.startsWith("-(") && cleaned.endsWith(")")) {
      cleaned = "-" + cleaned.slice(2, -1);
    }
    if (cleaned === "0" || cleaned === "-0") return 0;
    const rational = cleaned.match(/^(-?\d+)\/(\d+)$/);
    if (rational) {
      const num = Number(rational[1]);
      const den = Number(rational[2]);
      if (den === 0) return undefined;
      return num / den;
    }
    const direct = Number(cleaned);
    return Number.isFinite(direct) ? direct : undefined;
  };
  const studentSlope = parseSlope(studentMatch[1]);
  const expectedSlope = parseSlope(expectedMatch[1]);
  if (studentSlope === undefined || expectedSlope === undefined) return false;
  // Both slopes must be non-zero (otherwise the negative-reciprocal relation
  // doesn't apply and we have no signal to compare).
  if (studentSlope === 0 || expectedSlope === 0) return false;
  // The documented perpendicular-by-point trap: the student picks the slope
  // m_s = +1/m_ref while the canonical answer is m_c = -1/m_ref. By
  // construction, m_s and m_c have OPPOSITE SIGNS and EQUAL MAGNITUDE.
  if (Math.abs(Math.abs(studentSlope) - Math.abs(expectedSlope)) > 1e-9) return false;
  if (Math.sign(studentSlope) === Math.sign(expectedSlope)) return false;
  return true;
}

/**
 * Detect quadratic-factorization errors: student picked a single root when
 * the equation x² = a² has two roots ±√a².
 *
 * Pattern detection:
 *   - Prompt is `x² = n` (with or without spaces, with Unicode or LaTeX superscript)
 *   - Expected answer contains "±" (compound two-root form)
 *   - Student's picked option is a single value (no "±")
 *
 * Applies to MC exercises about square-root equations.
 */
function isU3FactorizacionCuadraticaError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;

  // normalizeSuperscripts converts Unicode ² → 2. After normalization,
  // both `x² = 9` and `x^2 = 9` become `x2 = 9`. We match either with a
  // regex that allows optional "^" so both forms work after normalization.
  const prompt = normalizeSuperscripts(exercise.prompt);
  const expected = exercise.expectedAnswer.trim();

  // Match `x^2 = n`, `x 2 = n`, or `x^2=n` (post-normalization).
  const squareMatch = prompt.match(/x\s*\^?\s*2\s*=\s*(-?\d+)/);
  if (!squareMatch) return false;

  const n = Number(squareMatch[1]);
  // Only positive n produces real two-root solutions ±√n.
  if (n <= 0) return false;

  // Expected must be the two-root form
  if (!/±/.test(expected)) return false;

  // Student's picked option must NOT contain "±" (otherwise it's the correct
  // two-root answer) and must look like a single value.
  if (/±/.test(userAnswer)) return false;

  // Student picked a single value. Only tag when that value is actually
  // one of the two valid roots (±√n) and the student omitted the other.
  const studentNum = extractNumericFromAnswer(userAnswer);
  if (studentNum === undefined) return false;

  const root = Math.sqrt(n);
  return Math.abs(studentNum) === root;
}

/**
 * Detect inequality-sign-flip errors: student picked an inequality that did
 * NOT flip the sign when the leading coefficient was negative.
 *
 * Pattern detection:
 *   - Prompt contains an inequality (`<`, `>`, `≤`, `≥`) with a negative
 *     leading coefficient on `x`.
 *   - The prompt direction and expected direction differ (flipped).
 *   - Student's picked option matches the PROMPT direction (not flipped).
 *
 * Applies to MC exercises solving linear inequalities.
 */
function isU3SignoDesigualdadError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;

  const prompt = normalizeSuperscripts(exercise.prompt);
  const expected = exercise.expectedAnswer.trim();
  const student = userAnswer.trim();

  if (expected === student) return false;

  // Detect prompt pattern: "(-N)x [op] M" — negative leading coefficient.
  // Match: leading "-" or "−", digit(s), x, then comparison.
  const promptInequalityMatch = prompt.match(
    /(-|−)\s*(\d+)\s*[xX]\s*([<>=≤≥]+)\s*(-?\d+)/
  );
  if (!promptInequalityMatch) return false;

  const promptOp = promptInequalityMatch[3];

  // Expected and student must contain comparison operators
  const expectedOp = expected.match(/[<>=≤≥]+/)?.[0];
  const studentOp = student.match(/[<>=≤≥]+/)?.[0];
  if (!expectedOp || !studentOp) return false;

  // The expected direction should be the FLIPPED form of the prompt direction.
  // E.g., prompt ">" with negative coefficient → expected "<".
  const flipped = flipInequalityOp(promptOp);
  if (expectedOp !== flipped) return false;

  // The student picked the NON-flipped direction (matched prompt as-is).
  if (studentOp !== promptOp) return false;

  // Boundary-value check: the student's numeric boundary must match the
  // expected boundary (correct value after dividing by the negative
  // coefficient). If the student has a different boundary altogether,
  // this is a purely wrong answer, not a sign-direction error.
  const studentNum = extractNumericFromAnswer(student);
  const expectedNum = extractNumericFromAnswer(expected);
  if (studentNum === undefined || expectedNum === undefined) return false;

  return studentNum === expectedNum;
}

/** Flip an inequality operator: < ↔ >, ≤ ↔ ≥. */
function flipInequalityOp(op: string): string {
  if (op === "<") return ">";
  if (op === ">") return "<";
  if (op === "≤" || op === "<=") return "≥";
  if (op === "≥" || op === ">=") return "≤";
  return op;
}

/**
 * Detect absolute-value inequation errors: student picked a single value
 * (e.g., "x = 7") when the correct answer is a compound interval/inequality
 * (e.g., "−3 < x < 7").
 *
 * Pattern detection:
 *   - Prompt contains an absolute value (Unicode |x − a| or LaTeX \vert ... \vert)
 *     followed by a comparison operator and a number.
 *   - Expected answer is a compound expression (contains "<" twice or "−"
 *     between two parts, i.e., "−3 < x < 7").
 *   - Student's picked option is a single value or simple equality.
 */
function isU3DosValoresAbsolutoError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;

  const prompt = exercise.prompt;
  const expected = exercise.expectedAnswer.trim();

  // Detect absolute value in prompt (Unicode |...| or LaTeX \vert ... \vert)
  // followed by a comparison.
  const hasAbsValue =
    /\|[^|]+\|\s*[<>]=?\s*-?\d+/.test(prompt) ||
    /\\vert[^\\]*\\vert\s*[<>]=?\s*-?\d+/.test(prompt);
  if (!hasAbsValue) return false;

  // Expected must be a compound expression (two comparison operators).
  const expectedComparisons = (expected.match(/[<>]=?/g) ?? []).length;
  if (expectedComparisons < 2) return false;

  // Student's picked option must NOT have two comparisons (single value form).
  const studentComparisons = (userAnswer.match(/[<>]=?/g) ?? []).length;
  if (studentComparisons >= 2) return false;

  // Defensive: the student answer should be a declared distractor (in options).
  const options = exercise.options ?? [];
  return options.some((opt) => getExerciseOptionValue(opt).trim() === userAnswer.trim());
}

/**
 * Detect line slope/intercept confusion: student picked an option that swaps
 * the slope and y-intercept of a line given in slope-intercept form y = mx + b.
 *
 * Pattern detection:
 *   - Prompt matches `y = mx + b` where m, b are small integers.
 *   - Expected answer mentions "Pendiente" and "ordenada" in correct order.
 *   - Student's picked option mentions them in SWAPPED order.
 *
 * Applies to MC exercises about line slope/intercept.
 */
function isU3PendienteOOrdenadaError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;

  const prompt = exercise.prompt;
  const expected = exercise.expectedAnswer.trim().toLowerCase();
  const student = userAnswer.trim().toLowerCase();

  if (expected === student) return false;

  // Match `y = mx + b` (or y = mx − b)
  const lineMatch = prompt.match(/[yY]\s*=\s*(-?\d+)\s*[xX]\s*([+-])\s*(\d+)/);
  if (!lineMatch) return false;

  const m = Number(lineMatch[1]);
  const b = Number(lineMatch[3]);

  // Both expected and student must contain "pendiente" and "ordenada"
  if (!expected.includes("pendiente") || !expected.includes("ordenada")) return false;
  if (!student.includes("pendiente") || !student.includes("ordenada")) return false;

  // Extract the numbers from each
  const extractNumbers = (s: string): number[] => {
    const matches = s.match(/-?\d+/g);
    return matches ? matches.map(Number).filter((n) => !Number.isNaN(n)) : [];
  };

  const expNums = extractNumbers(expected);
  const stuNums = extractNumbers(student);
  if (expNums.length < 2 || stuNums.length < 2) return false;

  // Expected: [m, b] (slope, intercept)
  // Student's numbers may be in same or different order.
  // Find the student number that should be the slope (m) and the one that
  // should be the intercept (b). If they are swapped relative to the
  // expected first/last positions, flag it.

  // Defensive: m and b must be different for swap to be detectable.
  if (m === b) return false;

  // Expected should have m first, b second.
  if (expNums[0] !== m || expNums[1] !== b) return false;

  // Student's first number should be b, second should be m (swap detected).
  return stuNums[0] === b && stuNums[1] === m;
}

/**
 * Detect substitution/elimination errors in systems: student picked an
 * option whose coordinates differ from the expected by a sign flip on ONE
 * coordinate (typical sign-error in elimination).
 *
 * Pattern detection:
 *   - Prompt mentions "sistema" OR contains two equations with two variables.
 *   - Expected answer is an ordered pair "x = a, y = b".
 *   - Student's picked option is an ordered pair where exactly one coordinate
 *     has the wrong sign.
 *
 * Applies to MC exercises about systems of equations.
 */
function isU3SustitucionOEliminacionError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;

  const prompt = exercise.prompt.toLowerCase();
  const expected = exercise.expectedAnswer.trim();
  const student = userAnswer.trim();

  if (expected === student) return false;

  // Detect system context: "sistema" or two equations with two variables.
  const hasSystemContext =
    prompt.includes("sistema") ||
    (prompt.includes(" y ") && /\bx\s*[+\-=]/.test(prompt) && /\by\s*[+\-=]/.test(prompt));
  if (!hasSystemContext) return false;

  // Extract numbers from expected and student (handle "x = 2, y = 3" pattern)
  const extractOrderedPair = (s: string): { x: number; y: number } | null => {
    const xMatch = s.match(/x\s*=\s*(-?\d+(?:\.\d+)?)/);
    const yMatch = s.match(/y\s*=\s*(-?\d+(?:\.\d+)?)/);
    if (!xMatch || !yMatch) return null;
    return { x: Number(xMatch[1]), y: Number(yMatch[1]) };
  };

  const expPair = extractOrderedPair(expected);
  const stuPair = extractOrderedPair(student);
  if (!expPair || !stuPair) return false;

  // Defensive: must be different pairs.
  if (expPair.x === stuPair.x && expPair.y === stuPair.y) return false;

  // Detect sign flip on exactly one coordinate (typical elimination mistake).
  const xSignFlip = -expPair.x === stuPair.x && expPair.y === stuPair.y;
  const ySignFlip = expPair.x === stuPair.x && -expPair.y === stuPair.y;

  return xSignFlip || ySignFlip;
}

/**
 * Detect exponential-equation base confusion: student picked an option that
 * treats the BASE as the answer (e.g., for 2^x = 8, picks x = 8) or picks
 * the base value instead of the exponent.
 *
 * Pattern detection:
 *   - Prompt matches `a^x = b` or similar (also LaTeX forms).
 *   - Expected answer is "x = some_exponent".
 *   - Student's picked option equals b (RHS, base-as-answer confusion) or
 *     equals a (the base, treated as the answer).
 *
 * Applies to MC exercises about exponential equations.
 */
function isU3IgualdadExponencialesError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;

  const prompt = normalizeSuperscripts(exercise.prompt);
  const expected = exercise.expectedAnswer.trim();

  // Detect prompt pattern: `a^x = b` (also handles Unicode ² superscript)
  const expMatch = prompt.match(/(-?\d+)\s*\^\s*[xX]\s*=\s*(-?\d+)/);
  if (!expMatch) return false;

  const a = Number(expMatch[1]);
  const b = Number(expMatch[2]);

  const studentNum = extractNumericFromAnswer(userAnswer);
  const expectedNum = extractNumericFromAnswer(expected);
  if (studentNum === undefined || expectedNum === undefined) return false;

  // Student answer must differ from the expected
  if (studentNum === expectedNum) return false;

  // Base confusion: student picked a (the base) or b (the RHS)
  return studentNum === a || studentNum === b;
}

/**
 * Detect logarithmic-property misuse: student picked a distractor that
 * misapplies a log property (e.g., log(a · b) → log a · log b instead of
 * log a + log b).
 *
 * Pattern detection:
 *   - Prompt mentions "logaritmo" + a property keyword ("producto", "cociente",
 *     "potencia") OR explicitly asks to apply a log property.
 *   - Expected answer matches the correct property application.
 *   - Student's picked option matches a known misapplication pattern.
 *
 * Applies to MC exercises about logarithmic properties.
 */
function isU3PropiedadLogaritmoError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;

  const promptLower = exercise.prompt.toLowerCase();
  const expected = exercise.expectedAnswer.trim();
  const student = userAnswer.trim();

  if (expected === student) return false;

  // Detect log-property context
  const hasLogContext =
    promptLower.includes("logaritmo") ||
    promptLower.includes("propiedad") ||
    promptLower.includes("\\log") ||
    promptLower.includes("\\ln");
  if (!hasLogContext) return false;

  // Known misapplication patterns. Each pattern matches a specific distractor
  // form that is the common misconception for that property.
  // Pattern A: log(a · b) → log a · log b (sum ↔ product confusion)
  const productConfusion = /log\s*\S+\s*[·*×x]\s*log\s*\S+/.test(student);
  // Pattern B: log(a^n) → (log a)^n (coefficient → exponent confusion)
  const powerConfusion = /\(\s*log\s+\S+\s*\)\s*\^/.test(student);

  return productConfusion || powerConfusion;
}

function isU3VerificacionOmitidaError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;
  if (userAnswer.trim() === exercise.expectedAnswer.trim()) return false;
  const prompt = exercise.prompt.toLowerCase();
  const student = userAnswer.toLowerCase();
  return (
    prompt.includes("verifica") && prompt.includes("interpreta") &&
    (student.includes("falta resolver") || student.includes("falta verificar"))
  );
}

function isU3InterpretacionContextualIncorrectaError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;
  if (userAnswer.trim() === exercise.expectedAnswer.trim()) return false;
  const student = userAnswer.toLowerCase();
  return (
    exercise.prompt.toLowerCase().includes("interpreta") &&
    (student.includes("perímetro mide") || student.includes("verificación actual") ||
      student.includes("confunde edades futuras"))
  );
}

function isU3TraduccionIncorrectaError(
  exercise: Exercise,
  userAnswer: string,
): boolean {
  if (exercise.type !== "multiple-choice") return false;
  if (exercise.skillId !== "mat.u3.traduccion_lenguaje_verbal") return false;
  const expected = exercise.expectedAnswer.trim();
  const student = userAnswer.trim();
  if (expected === student) return false;

  // Defensible misconception-pattern constraint #1: the student MUST have
  // picked a DECLARED option (one of `exercise.options`). The previous
  // buggy implementation accepted arbitrary wrong text and labeled every
  // answer as `u3_traduccion_incorrecta`. Restricting to declared options
  // bounds the detector to actual distractor options the student could
  // have picked, not free-form typos or arbitrary input.
  const options = exercise.options ?? [];
  const optValues = options.map(getExerciseOptionValue).map((s) => s.trim());
  if (!optValues.includes(student)) return false;

  // Defensible misconception-pattern constraint #2: both expected and student
  // options contain an explicit algebraic equation (`A = B`). We extract the
  // first equation from each option and compare the LHS / RHS operator
  // classes. The detector fires ONLY when the classes differ in one of the
  // documented translation-misinterpretation pairs (e.g. sum_times: the
  // student's LHS uses coefficient multiplication where the expected uses
  // sum, or vice versa).
  const expEq = extractFirstAlgebraicEquation(expected);
  const stuEq = extractFirstAlgebraicEquation(student);
  if (!expEq || !stuEq) return false;

  const expLhsClass = classifyAlgebraicExpression(expEq.lhs);
  const stuLhsClass = classifyAlgebraicExpression(stuEq.lhs);
  if (
    isTranslationMisconceptionPair(expLhsClass, stuLhsClass)
  ) {
    return true;
  }
  const expRhsClass = classifyAlgebraicExpression(expEq.rhs);
  const stuRhsClass = classifyAlgebraicExpression(stuEq.rhs);
  if (
    isTranslationMisconceptionPair(expRhsClass, stuRhsClass)
  ) {
    return true;
  }
  return false;
}

/**
 * Algebraic structure classes for translation-misinterpretation detection.
 * Used ONLY for `isU3TraduccionIncorrectaError` (declared-option constraint).
 */
type AlgebraicExpressionClass =
  | "empty"
  | "simple" // just a single variable, e.g. "x", "y"
  | "coeff_mult" // coefficient × variable, e.g. "4x", "12x"
  | "sum_diff" // variable ± number, e.g. "x + 12", "x - 4"
  | "exponent" // variable raised to a power, e.g. "x²", "x^4"
  | "fraction" // variable over a number or vice versa, e.g. "2/x", "x/3"
  | "compound"; // anything with ≥2 operators or compound structure

/**
 * Pairs of structure classes that signal a documented translation
 * misinterpretation on the `mat.u3.traduccion_lenguaje_verbal` skill.
 * The detector MUST only fire when expected and student answers fall
 * into one of these pairs on EITHER the LHS or RHS of the modeled
 * equation. This restricts the tag to actual translation-related
 * errors (e.g. "se le suman 12" misread as 12x instead of x + 12).
 */
const TRANSLATION_MISCONCEPTION_PAIRS: ReadonlySet<string> = new Set([
  // Sum-times confusion (the canonical P2 misconception):
  //   "x + 12" misread as "12x" / vice versa.
  ["sum_diff", "coeff_mult"].join("\u0000"),
  ["coeff_mult", "sum_diff"].join("\u0000"),
  // Coefficient-vs-fraction confusion:
  //   "2x" misread as "2/x" or vice versa.
  ["coeff_mult", "fraction"].join("\u0000"),
  ["fraction", "coeff_mult"].join("\u0000"),
  // Coefficient-vs-exponent confusion:
  //   "4x" misread as "x^4" (perímetro vs área in P3).
  ["coeff_mult", "exponent"].join("\u0000"),
  ["exponent", "coeff_mult"].join("\u0000"),
  // Inverse-direction pattern (simple variable on LHS vs sum/coefficient):
  //   "x + 12 = 31" expected vs "x = 12 + 31" picked (student moved the
  //   sum to the wrong side of the equation).
  ["sum_diff", "simple"].join("\u0000"),
  ["simple", "sum_diff"].join("\u0000"),
  ["coeff_mult", "simple"].join("\u0000"),
  ["simple", "coeff_mult"].join("\u0000"),
  // Sum-vs-compound-confusion (the "split" inverse — student collapsed
  // a multi-term LHS into a single term):
  //   "x + x/3" misread as "3x" / etc.
  ["compound", "coeff_mult"].join("\u0000"),
  ["coeff_mult", "compound"].join("\u0000"),
  ["compound", "simple"].join("\u0000"),
  ["simple", "compound"].join("\u0000"),
]);

function isTranslationMisconceptionPair(
  a: AlgebraicExpressionClass,
  b: AlgebraicExpressionClass,
): boolean {
  return TRANSLATION_MISCONCEPTION_PAIRS.has(`${a}\u0000${b}`);
}

/**
 * Extract the FIRST explicit algebraic equation (`A = B`) from a piece of
 * text. Skips non-algebraic text and any leading narrative words
 * (`Planteo`, `resuelvo`, `Defino`, `traduzco`, `verifico`, `interpreto`).
 *
 * Returns null when no equation is found.
 */
function extractFirstAlgebraicEquation(
  text: string,
): { readonly lhs: string; readonly rhs: string } | null {
  const stripped = text.replace(
    /^\s*(?:planteo|resuelvo|defino|traduzco|verifico|interpreto|el número pedido|planteamos)\s+/i,
    "",
  );
  // Match an algebraic LHS of digits / letters / operators (no second `=`),
  // anchored to a `=`, then any non-`=`-content RHS up to `;` or end.
  const match = stripped.match(
    /([a-zA-Z0-9·*×+\-/\^\\().,²³⁴⁵⁶⁷⁸⁹⁰¹\s]+?)\s*=\s*([^=;]+?)(?=[;.]|$)/,
  );
  if (!match) return null;
  const lhs = match[1].trim();
  const rhs = match[2].trim();
  if (!lhs || !rhs) return null;
  return { lhs, rhs };
}

/**
 * Classify an algebraic expression into one of the documented
 * `AlgebraicExpressionClass` categories. Used by the
 * `u3_traduccion_incorrecta` detector to compare expected and student
 * modeled equations. This is intentionally a coarse structural classifier
 * — it cares about whether the expression represents `Nx`, `x ± N`,
 * `x^n`, `x / N`, `N / x`, or a simple/compound form, NOT about numeric
 * values.
 */
function classifyAlgebraicExpression(
  expr: string,
): AlgebraicExpressionClass {
  // Strip narrative prefixes that often appear in pedagogical option text.
  const cleaned = expr
    .trim()
    .replace(/^\s*(planteo|resuelvo|defino|traduzco|verifico|interpreto)\s+/i, "")
    .trim();
  if (!cleaned) return "empty";
  // Normalize Unicode math operators to ASCII.
  const norm = cleaned.replace(/×/g, "*").replace(/·/g, "*");

  // Compound first (it overrides). A compound expression contains ≥2
  // operators OR multiple variable letters OR explicit multiplication of
  // two parentheses groups OR a slash with variable on both sides.
  const operatorCount = (norm.match(/[+\-*/^]/g) ?? []).length;
  const distinctVariableCount = new Set(
    norm.replace(/[^a-zA-Z]/g, "").split(""),
  ).size;
  if (operatorCount >= 2) return "compound";
  if (distinctVariableCount >= 2) return "compound";
  if (/\([^)]*\)\s*[\(]/.test(norm)) return "compound";

  // Exponent: x^2, x^4, x², x³, x^n.
  if (/[a-zA-Z]\s*\^\s*\d+/.test(norm) || /[a-zA-Z][²³⁴⁵⁶⁷⁸⁹⁰¹]/.test(norm)) {
    return "exponent";
  }
  // Fraction with variable on either side: N/x or x/N.
  if (/\/\s*[a-zA-Z]/.test(norm) || /[a-zA-Z]\s*\//.test(norm)) {
    return "fraction";
  }
  // Coeff_mult: N*x or Nx or N·x or N (no × but adjacent).
  if (/^\s*\d+\s*\*?\s*[a-zA-Z]\s*$/.test(norm)) return "coeff_mult";
  // Sum_diff: x+N or x-N or -N+x.
  if (/^[+\-]?\s*\d*\s*[a-zA-Z]\s*[+\-]\s*\d+\s*$/.test(norm)) return "sum_diff";
  // Plain variable: just x (with optional sign).
  if (/^[+\-]?\s*[a-zA-Z]\s*$/.test(norm)) return "simple";
  // Fallback — anything we couldn't classify cleanly lands as compound
  // and is excluded by the misconception-pair check.
  return "compound";
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

  // ── U3 (Ecuaciones y sistemas) error patterns ────────────────

  if (isU3AislamientoIncorrectoError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_AISLAMIENTO_INCORRECTO_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3FactorizacionCuadraticaError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_FACTORIZACION_CUADRATICA_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3SignoDesigualdadError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_SIGNO_DESIGUALDAD_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3DosValoresAbsolutoError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_DOS_VALORES_ABSOLUTO_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3PendienteOOrdenadaError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_PENDIENTE_O_ORDENADA_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3SustitucionOEliminacionError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_SUSTITUCION_O_ELIMINACION_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3IgualdadExponencialesError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_IGUALDAD_EXPONENCIALES_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3PropiedadLogaritmoError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_PROPIEDAD_LOGARITMO_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3VerificacionOmitidaError(exercise, userAnswer)) {
    if (tags.includes("u3_verificacion_omitida")) return "u3_verificacion_omitida";
  }

  if (isU3InterpretacionContextualIncorrectaError(exercise, userAnswer)) {
    if (tags.includes("u3_interpretacion_contextual_incorrecta")) return "u3_interpretacion_contextual_incorrecta";
  }

  if (isU3TraduccionIncorrectaError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_TRADUCCION_INCORRECTA_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3RacionalizacionIrracionalError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_RACIONALIZACION_IRRACIONAL_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3DiscriminanteSignoIncorrectoError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_DISCRIMINANTE_SIGNO_INCORRECTO_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3AbsEqSignoNegativoIncorrectoError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_ABS_EQ_SIGNO_NEGATIVO_INCORRECTO_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3AbsEqSumaConstanteFueraError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_ABS_EQ_SUMA_CONSTANTE_FUERA_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3AbsEqRamaUnicaError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_ABS_EQ_RAMA_UNICA_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3SignchartFactorSignoIncorrectoError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_SIGNCHART_FACTOR_SIGNO_INCORRECTO_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3SignchartCriticalRootOmitidoError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_SIGNCHART_CRITICAL_ROOT_OMITIDO_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3SignchartDominioDenominadorError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_SIGNCHART_DOMINIO_DENOMINADOR_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  if (isU3RectaPendientePerpendicularError(exercise, userAnswer)) {
    for (const tag of tags) {
      if (U3_RECTA_PENDIENTE_PERPENDICULAR_TAGS.has(tag)) {
        return tag;
      }
    }
  }

  return undefined;
}
