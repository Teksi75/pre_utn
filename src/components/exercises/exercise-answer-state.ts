import type { ExerciseType, StructuredAnswerSpec } from "@/domain/models/exercise";
import {
  serializeStructuredSubmissionV1,
  type AngleDmsSubmissionV1,
  type PiRationalSubmissionV1,
} from "@/domain/evaluator/structured";

const TEXT_INPUT_TYPES = new Set<ExerciseType>([
  "numerical",
  "fill-blank",
]);

export function isTextAnswerType(type: ExerciseType): boolean {
  return TEXT_INPUT_TYPES.has(type);
}

export function getSubmittedExerciseAnswer(
  type: ExerciseType,
  textAnswer: string,
  selectedOption: string | null
): string {
  return isTextAnswerType(type)
    ? textAnswer.trim()
    : selectedOption?.trim() ?? "";
}

export function canSubmitExerciseAnswer(
  type: ExerciseType,
  textAnswer: string,
  selectedOption: string | null
): boolean {
  return getSubmittedExerciseAnswer(type, textAnswer, selectedOption).length > 0;
}

// ── Structured-answer completeness + serialization helpers ────────────────
//
// Structured controls (PiRationalInput, AngleDmsInput) own their local draft
// state. The parent practice flow calls `isAnswerCompleteStructured` to know
// whether the student has filled every required field, and `serializeStructured`
// to produce the canonical JSON v1 string consumed by `evaluateAnswer`.
// Both helpers are pure: no React, no Next.js, no Supabase.

export interface PiRationalDraft {
  readonly numerator: string;
  readonly denominator: string;
  readonly decimal: string;
}

export interface AngleDmsDraft {
  readonly degrees: string;
  readonly minutes: string;
  readonly seconds: string;
}

/**
 * True when every required pi-rational field is a non-empty numeric
 * string. Tolerance is content-side config and does NOT gate completeness.
 */
export function isPiRationalDraftComplete(draft: PiRationalDraft): boolean {
  return (
    draft.numerator.trim().length > 0 &&
    draft.denominator.trim().length > 0 &&
    draft.decimal.trim().length > 0
  );
}

/**
 * True when every required angle-dms field is a non-empty numeric string.
 * Bound validation is delegated to the structured evaluator.
 */
export function isAngleDmsDraftComplete(draft: AngleDmsDraft): boolean {
  return (
    draft.degrees.trim().length > 0 &&
    draft.minutes.trim().length > 0 &&
    draft.seconds.trim().length > 0
  );
}

/**
 * Serialize a pi-rational draft to the canonical JSON v1 submission
 * string. Returns null when the draft is incomplete.
 */
export function serializePiRationalDraft(
  draft: PiRationalDraft,
): string | null {
  if (!isPiRationalDraftComplete(draft)) return null;
  const numerator = Number(draft.numerator);
  const denominator = Number(draft.denominator);
  const decimal = Number(draft.decimal);
  const submission: PiRationalSubmissionV1 = {
    v: 1,
    kind: "pi-rational",
    numerator,
    denominator,
    decimal,
  };
  return serializeStructuredSubmissionV1(submission);
}

/**
 * Serialize an angle-dms draft to the canonical JSON v1 submission
 * string. Returns null when the draft is incomplete.
 */
export function serializeAngleDmsDraft(draft: AngleDmsDraft): string | null {
  if (!isAngleDmsDraftComplete(draft)) return null;
  const submission: AngleDmsSubmissionV1 = {
    v: 1,
    kind: "angle-dms",
    degrees: Number(draft.degrees),
    minutes: Number(draft.minutes),
    seconds: Number(draft.seconds),
  };
  return serializeStructuredSubmissionV1(submission);
}

/**
 * True when the draft for the given spec kind is complete.
 * Delegates to the kind-specific helpers above.
 */
export function isAnswerCompleteStructured(
  spec: StructuredAnswerSpec,
  draft: PiRationalDraft | AngleDmsDraft,
): boolean {
  if (spec.kind === "pi-rational") {
    return isPiRationalDraftComplete(draft as PiRationalDraft);
  }
  return isAngleDmsDraftComplete(draft as AngleDmsDraft);
}

/**
 * Serialize a structured draft to its canonical JSON v1 string. Returns
 * null when the draft is incomplete OR when the spec kind does not match
 * the draft shape (defensive).
 */
export function serializeStructured(
  spec: StructuredAnswerSpec,
  draft: PiRationalDraft | AngleDmsDraft,
): string | null {
  if (spec.kind === "pi-rational") {
    return serializePiRationalDraft(draft as PiRationalDraft);
  }
  return serializeAngleDmsDraft(draft as AngleDmsDraft);
}