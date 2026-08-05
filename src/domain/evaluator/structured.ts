/**
 * Structured-answer codecs — pure v1 parse / serialize / normalize helpers.
 *
 * The structured-answer surface is consumed by `evaluateAnswer` (and tests)
 * through these pure functions:
 *   - `parseStructuredSubmissionV1`      — strict JSON.parse into a typed submission
 *   - `serializeStructuredSubmissionV1`   — produce the canonical JSON v1 string
 *   - `normalizePiRational` / `normalizeAngleDms` — shape + bound checks
 *   - `evaluatePiRational` / `evaluateAngleDms`   — domain evaluators
 *   - `evaluateStructuredAnswer`                    — dispatcher used by `evaluateAnswer`
 *
 * Module boundary: no React, no Next.js, no Supabase. Errors thrown by
 * normalization are converted into `{correct:false, feedback}` at the
 * dispatcher so the student sees a clear "incorrect" rather than a
 * runtime exception.
 */

import type { StructuredAnswerSpec } from "../models/exercise";
import type { EvaluationResult } from "./index";

/** Canonical pi-rational submission. Sign lives on the numerator. */
export interface PiRationalSubmissionV1 {
  readonly v: 1;
  readonly kind: "pi-rational";
  readonly numerator: number;
  readonly denominator: number;
  readonly decimal: number;
}

/** Canonical angle-DMS submission. */
export interface AngleDmsSubmissionV1 {
  readonly v: 1;
  readonly kind: "angle-dms";
  readonly degrees: number;
  readonly minutes: number;
  readonly seconds: number;
}

/** Discriminated union of v1 structured submissions. */
export type StructuredSubmissionV1 = PiRationalSubmissionV1 | AngleDmsSubmissionV1;

// Reusable runtime object shapes (mutable during validation, frozen on return).
interface PiRationalLike {
  readonly v: unknown;
  readonly kind: unknown;
  readonly numerator: unknown;
  readonly denominator: unknown;
  readonly decimal: unknown;
}

interface AngleDmsLike {
  readonly v: unknown;
  readonly kind: unknown;
  readonly degrees: unknown;
  readonly minutes: unknown;
  readonly seconds: unknown;
}

/** Compute the greatest common divisor of two non-negative integers. */
function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x === 0 ? 1 : x;
}

function failStructured(reason: string): never {
  throw new Error(`Invalid structured submission: ${reason}`);
}

/**
 * Parse a canonical versioned JSON string (v1) into a typed submission.
 * Throws on malformed JSON, unknown `kind`, missing `v`, wrong field types,
 * or out-of-bounds numeric values for the angle-dms shape.
 *
 * Bound checks for pi-rational (denominator > 0, etc.) are delegated to
 * `normalizePiRational`, which is also used by the dispatcher.
 */
export function parseStructuredSubmissionV1(raw: string): StructuredSubmissionV1 {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    failStructured("malformed JSON");
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    failStructured("expected a JSON object");
  }
  const obj = value as Record<string, unknown>;
  if (obj.v !== 1) {
    failStructured(`unsupported version ${String(obj.v)}; expected v=1`);
  }

  if (obj.kind === "pi-rational") {
    const like: PiRationalLike = {
      v: obj.v,
      kind: obj.kind,
      numerator: obj.numerator,
      denominator: obj.denominator,
      decimal: obj.decimal,
    };
    if (
      typeof like.numerator !== "number" ||
      typeof like.denominator !== "number" ||
      typeof like.decimal !== "number"
    ) {
      failStructured("pi-rational requires numeric numerator, denominator, decimal");
    }
    const normalized = normalizePiRational({
      numerator: like.numerator,
      denominator: like.denominator,
      decimal: like.decimal,
    });
    return {
      v: 1,
      kind: "pi-rational",
      numerator: normalized.numerator,
      denominator: normalized.denominator,
      decimal: normalized.decimal,
    };
  }

  if (obj.kind === "angle-dms") {
    const like: AngleDmsLike = {
      v: obj.v,
      kind: obj.kind,
      degrees: obj.degrees,
      minutes: obj.minutes,
      seconds: obj.seconds,
    };
    if (
      typeof like.degrees !== "number" ||
      typeof like.minutes !== "number" ||
      typeof like.seconds !== "number"
    ) {
      failStructured("angle-dms requires numeric degrees, minutes, seconds");
    }
    const normalized = normalizeAngleDms({
      degrees: like.degrees,
      minutes: like.minutes,
      seconds: like.seconds,
    });
    return {
      v: 1,
      kind: "angle-dms",
      degrees: normalized.degrees,
      minutes: normalized.minutes,
      seconds: normalized.seconds,
    };
  }

  failStructured(`unknown kind: ${String(obj.kind)}`);
}

/**
 * Serialize a v1 structured submission to the canonical JSON string.
 * Used by the structured UI controls when emitting an `onComplete` payload.
 */
export function serializeStructuredSubmissionV1(submission: StructuredSubmissionV1): string {
  return JSON.stringify(submission);
}

/**
 * Normalized values of a pi-rational submission. Sign lives on the numerator,
 * the fraction is reduced, denominator is positive.
 */
export interface NormalizedPiRational {
  readonly numerator: number;
  readonly denominator: number;
  readonly decimal: number;
}

/**
 * Normalized values of an angle-dms submission.
 */
export interface NormalizedAngleDms {
  readonly degrees: number;
  readonly minutes: number;
  readonly seconds: number;
}

/**
 * Normalize a pi-rational submission: integer-only numerator/denominator,
 * denominator strictly positive, fraction reduced by GCD, sign on the
 * numerator. Throws on invalid input.
 *
 * Returns the bare normalized values (no `v` / `kind` envelope) so the
 * dispatcher and tests can compare shapes directly.
 */
export function normalizePiRational(input: {
  readonly numerator: number;
  readonly denominator: number;
  readonly decimal: number;
}): NormalizedPiRational {
  if (!Number.isInteger(input.numerator)) {
    failStructured(`pi-rational numerator must be an integer, got ${input.numerator}`);
  }
  if (!Number.isInteger(input.denominator)) {
    failStructured(`pi-rational denominator must be an integer, got ${input.denominator}`);
  }
  if (input.denominator === 0) {
    failStructured("pi-rational denominator must not be 0");
  }
  if (!Number.isFinite(input.decimal)) {
    failStructured(`pi-rational decimal must be finite, got ${input.decimal}`);
  }

  // Move the sign to the numerator so the denominator is always positive.
  let numerator = input.numerator;
  let denominator = input.denominator;
  if (denominator < 0) {
    numerator = -numerator;
    denominator = -denominator;
  }

  const divisor = gcd(Math.abs(numerator), denominator);
  numerator = numerator / divisor;
  denominator = denominator / divisor;

  return { numerator, denominator, decimal: input.decimal };
}

/**
 * Normalize an angle-dms submission: integer minutes in [0, 60), finite
 * non-negative seconds in [0, 60), degrees are clamped to integers (the
 * spec restricts angle-DMS to non-negative totals; signed DMS is out of
 * scope for this slice). Throws on invalid input.
 */
export function normalizeAngleDms(input: {
  readonly degrees: number;
  readonly minutes: number;
  readonly seconds: number;
}): NormalizedAngleDms {
  if (!Number.isInteger(input.degrees) || input.degrees < 0) {
    failStructured(`angle-dms degrees must be a non-negative integer, got ${input.degrees}`);
  }
  if (!Number.isInteger(input.minutes) || input.minutes < 0 || input.minutes >= 60) {
    failStructured(`angle-dms minutes must be an integer in [0, 60), got ${input.minutes}`);
  }
  if (!Number.isFinite(input.seconds) || input.seconds < 0 || input.seconds >= 60) {
    failStructured(`angle-dms seconds must be finite in [0, 60), got ${input.seconds}`);
  }
  return {
    degrees: input.degrees,
    minutes: input.minutes,
    seconds: input.seconds,
  };
}

// ── Structured evaluators ──────────────────────────────────────────────────

/**
 * Evaluate a `pi-rational` submission against a `pi-rational` answerSpec.
 *
 * Both sides are normalized (sign on numerator, fraction reduced by GCD).
 * Grading is correct iff the reduced coefficients are EXACTLY equal AND
 * the decimal is within the declared tolerance. The reduced-form
 * comparison lets `{2, 10}` equal `{1, 5}` without ambiguity.
 */
export function evaluatePiRational(
  spec: StructuredAnswerSpec,
  submission: { readonly numerator: number; readonly denominator: number; readonly decimal: number },
): EvaluationResult {
  if (spec.kind !== "pi-rational") {
    return { correct: false, feedback: "spec-kind-mismatch" };
  }
  // Normalize both sides — normalization throws on malformed input. The
  // dispatcher (`evaluateStructuredAnswer`) is the one that catches and
  // converts to `incorrect`. Direct callers of `evaluatePiRational` get a
  // thrown error that names the offending field (defensive contract).
  const submitted = normalizePiRational(submission);
  const expected = normalizePiRational({
    numerator: spec.expected.numerator,
    denominator: spec.expected.denominator,
    decimal: spec.decimal,
  });
  const coefficientMatches =
    submitted.numerator * expected.denominator ===
    expected.numerator * submitted.denominator;
  const decimalMatches =
    Math.abs(submitted.decimal - expected.decimal) <= spec.tolerance;
  return coefficientMatches && decimalMatches
    ? { correct: true }
    : { correct: false, feedback: "wrong-answer" };
}

/**
 * Evaluate an `angle-dms` submission against an `angle-dms` answerSpec.
 *
 * Both sides are normalized. Grading is correct iff the absolute
 * difference in TOTAL ARC-SECONDS is within the declared tolerance
 * (inclusive, per spec math-answer-evaluator "Angle DMS Evaluation").
 *
 * Throws on malformed submissions (e.g. minutes=60); the dispatcher
 * (`evaluateStructuredAnswer`) is responsible for converting the throw
 * into an `incorrect` evaluation result.
 */
export function evaluateAngleDms(
  spec: StructuredAnswerSpec,
  submission: { readonly degrees: number; readonly minutes: number; readonly seconds: number },
): EvaluationResult {
  if (spec.kind !== "angle-dms") {
    return { correct: false, feedback: "spec-kind-mismatch" };
  }
  const submitted = normalizeAngleDms(submission);
  const expected = spec.expected;
  const submittedArc =
    submitted.degrees * 3600 + submitted.minutes * 60 + submitted.seconds;
  const expectedArc =
    expected.degrees * 3600 + expected.minutes * 60 + expected.seconds;
  const delta = Math.abs(submittedArc - expectedArc);
  return delta <= spec.tolerance
    ? { correct: true }
    : { correct: false, feedback: "wrong-answer" };
}

/**
 * Dispatch a structured submission to the correct evaluator based on the
 * `answerSpec.kind`. Catches normalization/parse errors and converts them
 * to `{correct:false, feedback}` so the student sees an honest "incorrect"
 * rather than a runtime exception.
 *
 * Callers must already know the exercise is `type === "structured"`; the
 * dispatcher trusts the spec kind.
 */
export function evaluateStructuredAnswer(
  spec: StructuredAnswerSpec,
  rawSubmission: {
    readonly numerator?: number;
    readonly denominator?: number;
    readonly decimal?: number;
    readonly degrees?: number;
    readonly minutes?: number;
    readonly seconds?: number;
  },
): EvaluationResult {
  if (spec.kind === "pi-rational") {
    if (
      typeof rawSubmission.numerator !== "number" ||
      typeof rawSubmission.denominator !== "number" ||
      typeof rawSubmission.decimal !== "number"
    ) {
      return { correct: false, feedback: "submission-malformed" };
    }
    try {
      return evaluatePiRational(spec, {
        numerator: rawSubmission.numerator,
        denominator: rawSubmission.denominator,
        decimal: rawSubmission.decimal,
      });
    } catch {
      return { correct: false, feedback: "submission-malformed" };
    }
  }
  if (spec.kind === "angle-dms") {
    if (
      typeof rawSubmission.degrees !== "number" ||
      typeof rawSubmission.minutes !== "number" ||
      typeof rawSubmission.seconds !== "number"
    ) {
      return { correct: false, feedback: "submission-malformed" };
    }
    try {
      return evaluateAngleDms(spec, {
        degrees: rawSubmission.degrees,
        minutes: rawSubmission.minutes,
        seconds: rawSubmission.seconds,
      });
    } catch {
      return { correct: false, feedback: "submission-malformed" };
    }
  }
  return { correct: false, feedback: "unknown-kind" };
}