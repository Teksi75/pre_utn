/**
 * Exercise model — mathematics exercise identity, types, and validation.
 * No external dependencies. Pure TypeScript.
 */

import type { Result } from "./result";
import { ok, err } from "./result";
import type { SkillId } from "./skill";
import type { IntervalRepresentation } from "../intervals/representation";
import { isFiniteNumericAnswer } from "../utils/numeric";

/** Exercise ID format: ex.u{1-6}.{skill_slug}.{index} or ex.u{1-6}.{skill_slug}.{slug-id} */
export type ExerciseId = `ex.u${1 | 2 | 3 | 4 | 5 | 6}.${string}.${string}`;

/** An exercise option with optional interval representation for graphical exercises. */
export type ExerciseOption = string | {
  readonly value: string;
  readonly label: string;
  readonly intervalRepresentation?: IntervalRepresentation;
};

/**
 * Extract the string value from an ExerciseOption.
 *
 * @param option - The option to extract value from
 * @returns The string value
 */
export function getExerciseOptionValue(option: ExerciseOption): string {
  return typeof option === "string" ? option : option.value;
}

/** The supported exercise types. free-response and symbolic are prohibited by AGENTS.md (no free-text for math). */
export type ExerciseType =
  | "multiple-choice"
  | "true-false"
  | "numerical"
  | "fill-blank"
  | "matching"
  | "ordering"
  | "graphical"
  | "structured";

/**
 * Expected answer for an `angle-dms` structured exercise.
 * degrees is a non-negative integer; minutes and seconds satisfy 0 ≤ minutes < 60,
 * 0 ≤ seconds < 60 (signed DMS is explicitly out of scope for this slice).
 */
export interface AngleDmsExpected {
  readonly degrees: number;
  readonly minutes: number;
  readonly seconds: number;
}

/**
 * Expected answer for a `pi-rational` structured exercise.
 * Sign lives on the numerator; denominator is positive.
 */
export interface PiRationalExpected {
  readonly numerator: number;
  readonly denominator: number;
}

/**
 * Discriminated union of structured-answer specs.
 * Only `pi-rational` and `angle-dms` are supported in this slice.
 */
export type StructuredAnswerSpec =
  | {
      readonly kind: "pi-rational";
      readonly expected: PiRationalExpected;
      readonly decimal: number;
      readonly tolerance: number;
    }
  | {
      readonly kind: "angle-dms";
      readonly expected: AngleDmsExpected;
      readonly tolerance: number;
    };

/** Public, exported set of supported ExerciseType literals. */
export const SUPPORTED_EXERCISE_TYPES: ReadonlySet<ExerciseType> = new Set<ExerciseType>([
  "multiple-choice",
  "true-false",
  "numerical",
  "fill-blank",
  "matching",
  "ordering",
  "graphical",
  "structured",
]);

/** Difficulty level: 1 (easiest) to 5 (hardest). */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/**
 * Source-use classification for the general exercise surface.
 *
 * Compatible with U2 (which permits `alignment`) and the read-only
 * source catalog (which uses the three narrower literals). `alignment`
 * remains valid for the general `Exercise` contract; a separate U3-only
 * audit may narrow U3 trace use to the three literals excluding
 * `alignment`. Challenge-only literals (canonical-source,
 * calibrated-from-exam, solution-pattern) live on the independent
 * `ChallengeSourceUse` contract and are not assignable here.
 */
export type ExerciseSourceUse =
  | "adapted"
  | "reinforcement"
  | "reference"
  | "alignment";

/**
 * Pedagogical traceability for the general exercise surface.
 *
 * `section` is optional; `path` and `pedagogicalIntent` are required.
 * The `sourceUse` literal must belong to the general `ExerciseSourceUse`
 * set — challenge-only literals are rejected at compile time and at
 * runtime by the general parser (PR2).
 */
export interface ExerciseCanonicalTrace {
  readonly path: string;
  readonly section?: string;
  readonly sourceUse: ExerciseSourceUse;
  readonly pedagogicalIntent: string;
}

/**
 * Shared structural surface for general exercises and the independent
 * challenge surface. Both `Exercise` and `ChallengeExercise` extend this
 * shape; the trace field is owned by each subtype with its own type so
 * the two contracts cannot be confused.
 */
export interface ExerciseBaseShape {
  readonly id: ExerciseId;
  readonly skillId: SkillId;
  readonly type: ExerciseType;
  readonly difficulty: Difficulty;
  readonly prompt: string;
  readonly expectedAnswer: string;
  readonly commonErrorTags: readonly string[];
  readonly pedagogicalNote: string;
  /** Unit number (1–6) derived from skillId during defaulting. */
  readonly unit: number;
  /** Selectable choices for multiple-choice exercises. Required when type is "multiple-choice". */
  readonly options?: readonly ExerciseOption[];
  /** Practice category for bank organization (e.g. "clasificacion", "pertenencia"). */
  readonly category?: string;
  /** Semantic tags for filtering and pedagogical tracing. */
  readonly tags?: readonly string[];
  /**
   * Structured-answer discriminator. Required when type === "structured";
   * ignored for every other exercise type.
   */
  readonly answerSpec?: StructuredAnswerSpec;
}

/**
 * A validated mathematics exercise.
 *
 * Extends `ExerciseBaseShape` so the structural rendering/input fields
 * stay shared with the challenge surface. The optional `canonicalTrace`
 * uses the general `ExerciseSourceUse` contract (compatible with U2's
 * `alignment`) and is independent from the challenge trace type.
 */
export interface Exercise extends ExerciseBaseShape {
  /** Optional pedagogical traceability back to canonical material. */
  readonly canonicalTrace?: readonly ExerciseCanonicalTrace[];
}

/**
 * Structural input contract for the domain evaluator.
 *
 * Carries ONLY the fields the evaluator actually reads: `type`,
 * `expectedAnswer`, `prompt`, `commonErrorTags`, `skillId`, `options`,
 * and (for `structured` exercises) `answerSpec`. Both `Exercise` and
 * `ChallengeExercise` extend `ExerciseBaseShape` (which declares these
 * fields), so they are assignable to `EvaluableExercise` without being
 * mutually assignable to each other — the general trace and the
 * challenge trace remain independent.
 *
 * Reusable across any surface that satisfies this minimal shape; never
 * carries the `trace`, `challengeSection`, `category`, or `tags`
 * discriminators.
 */
export interface EvaluableExercise {
  readonly type: ExerciseType;
  readonly expectedAnswer: string;
  readonly prompt: string;
  readonly commonErrorTags: readonly string[];
  readonly skillId: SkillId;
  readonly options?: readonly ExerciseOption[];
  readonly answerSpec?: StructuredAnswerSpec;
}

/** Validation error with field and message. */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
}

const EXERCISE_ID_PATTERN = /^ex\.u([1-6])\.(.+)\.([a-z0-9-]+)$/;

const SUPPORTED_TYPES: ReadonlySet<string> = new Set<ExerciseType>([
  "multiple-choice",
  "true-false",
  "numerical",
  "fill-blank",
  "matching",
  "ordering",
  "graphical",
  "structured",
]);

function hasStructuredNumericalAnswer(value: string): boolean {
  const normalized = value.trim();
  const numericTokenCount =
    normalized.match(/[-−]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/g)?.length ?? 0;

  return (
    normalized.includes(",") ||
    normalized.includes(";") ||
    normalized.includes("{") ||
    normalized.includes("}") ||
    normalized.includes("=") ||
    numericTokenCount > 1
  );
}

/**
 * Detect structured math expressions that are prohibited for fill-blank answers.
 * Extends `hasStructuredNumericalAnswer` with symbolic pattern detection.
 * Catches: complex numbers (a+bi), roots (√, sqrt), logarithms (log, ln).
 *
 * Exported for unit testing and for cross-type checks (the function must NOT
 * false-positive on legitimate values such as the literal word "structured"
 * that exercise-type tokens might appear in).
 */
export function hasStructuredMathAnswer(value: string): boolean {
  if (hasStructuredNumericalAnswer(value)) return true;
  const normalized = value.trim();
  // Symbolic math: letter(s) followed by operator and letter(s) (e.g. "a + bi", "x - y")
  if (/[a-zA-Z]\s*[+\-*/^]\s*[a-zA-Z]/.test(normalized)) return true;
  // Roots: √, ∛, sqrt, cbrt
  if (/[√∛]|sqrt|cbrt/i.test(normalized)) return true;
  // Logarithmic expressions: log, ln
  if (/\b(?:log|ln)\b/i.test(normalized)) return true;
  return false;
}

/**
 * Validate an exercise object.
 *
 * @param input - The exercise to validate
 * @param knownSkillIds - Set of known SkillIds for skill reference validation
 * @param knownErrorTagIds - Set of known error tag IDs for error tag reference validation
 * @returns Ok<Exercise> on success, Err<ValidationError> on failure
 */
export function validateExercise(
  input: Exercise,
  knownSkillIds: Set<SkillId>,
  knownErrorTagIds: Set<string>
): Result<Exercise, ValidationError> {
  // Validate ID format
  const idMatch = EXERCISE_ID_PATTERN.exec(input.id);
  if (!idMatch) {
    return err({ field: "id", message: `Invalid exercise ID format: ${input.id}. Expected ex.u{1-6}.{slug}.{index}` });
  }

  // Validate unit in ID is 1-6
  const idUnit = Number(idMatch[1]);
  if (idUnit < 1 || idUnit > 6) {
    return err({ field: "id", message: `Exercise ID unit must be 1-6, got ${idUnit}` });
  }

  // Validate skillId references a known skill
  if (!knownSkillIds.has(input.skillId)) {
    return err({ field: "skillId", message: `Unknown skill reference: ${input.skillId}` });
  }

  // Validate common error tags reference known tags
  for (const errorTagId of input.commonErrorTags) {
    if (!knownErrorTagIds.has(errorTagId)) {
      return err({ field: "commonErrorTags", message: `Unknown error tag reference: ${errorTagId}` });
    }
  }

  // Validate type is supported
  if (!SUPPORTED_TYPES.has(input.type)) {
    return err({ field: "type", message: `Unsupported exercise type: ${input.type}` });
  }

  // Validate difficulty is 1-5
  if (input.difficulty < 1 || input.difficulty > 5) {
    return err({ field: "difficulty", message: `Difficulty must be 1-5, got ${input.difficulty}` });
  }

  // Validate required fields
  if (!input.prompt || input.prompt.trim().length === 0) {
    return err({ field: "prompt", message: "prompt is required and must be non-empty" });
  }

  if (!input.expectedAnswer || input.expectedAnswer.trim().length === 0) {
    return err({ field: "expectedAnswer", message: "expectedAnswer is required and must be non-empty" });
  }

  // Validate type-answer shape: numerical exercises must have a single scalar value
  // (not a multi-value/set/equation answer like "x = -2, x = 2" or "{1, 2}").
  // Scientific notation like "1e3" is still scalar and should be accepted.
  if (input.type === "numerical" && hasStructuredNumericalAnswer(input.expectedAnswer)) {
    return err({
      field: "expectedAnswer",
      message: `numerical exercise must have a single scalar expected answer, got structured value: "${input.expectedAnswer}"`,
    });
  }

  if (input.type === "numerical" && !isFiniteNumericAnswer(input.expectedAnswer)) {
    return err({
      field: "expectedAnswer",
      message: `numerical exercise must have a finite numeric expected answer, got: "${input.expectedAnswer}"`,
    });
  }

  // Validate type-answer shape: fill-blank exercises must have a short, unambiguous form.
  // Structured math expressions (sets, equations, complex numbers) are prohibited per AGENTS.md.
  if (input.type === "fill-blank" && hasStructuredMathAnswer(input.expectedAnswer)) {
    return err({
      field: "expectedAnswer",
      message: `fill-blank exercise must have a simple expected answer, got structured value: "${input.expectedAnswer}"`,
    });
  }

  // Validate structured answerSpec when type === "structured".
  if (input.type === "structured") {
    if (!input.answerSpec) {
      return err({
        field: "answerSpec",
        message: `structured exercise must declare an answerSpec`,
      });
    }
    const spec = input.answerSpec;
    if (spec.kind === "pi-rational") {
      if (!Number.isInteger(spec.expected.numerator)) {
        return err({
          field: "answerSpec.expected.numerator",
          message: `pi-rational numerator must be an integer, got ${spec.expected.numerator}`,
        });
      }
      if (
        !Number.isInteger(spec.expected.denominator) ||
        spec.expected.denominator <= 0
      ) {
        return err({
          field: "answerSpec.expected.denominator",
          message: `pi-rational denominator must be a positive integer, got ${spec.expected.denominator}`,
        });
      }
      if (!Number.isFinite(spec.decimal)) {
        return err({
          field: "answerSpec.decimal",
          message: `pi-rational decimal must be finite, got ${spec.decimal}`,
        });
      }
      if (!Number.isFinite(spec.tolerance) || spec.tolerance <= 0) {
        return err({
          field: "answerSpec.tolerance",
          message: `pi-rational tolerance must be a positive finite number, got ${spec.tolerance}`,
        });
      }
    } else if (spec.kind === "angle-dms") {
      if (!Number.isInteger(spec.expected.degrees) || spec.expected.degrees < 0) {
        return err({
          field: "answerSpec.expected.degrees",
          message: `angle-dms degrees must be a non-negative integer, got ${spec.expected.degrees}`,
        });
      }
      if (!Number.isInteger(spec.expected.minutes) || spec.expected.minutes < 0 || spec.expected.minutes >= 60) {
        return err({
          field: "answerSpec.expected.minutes",
          message: `angle-dms minutes must be an integer in [0, 60), got ${spec.expected.minutes}`,
        });
      }
      if (!Number.isFinite(spec.expected.seconds) || spec.expected.seconds < 0 || spec.expected.seconds >= 60) {
        return err({
          field: "answerSpec.expected.seconds",
          message: `angle-dms seconds must be a finite number in [0, 60), got ${spec.expected.seconds}`,
        });
      }
      if (!Number.isFinite(spec.tolerance) || spec.tolerance <= 0) {
        return err({
          field: "answerSpec.tolerance",
          message: `angle-dms tolerance must be a positive finite number, got ${spec.tolerance}`,
        });
      }
    } else {
      return err({
        field: "answerSpec.kind",
        message: `unsupported structured answerSpec.kind: ${(spec as { kind: string }).kind}`,
      });
    }
  }

  // Validate options for multiple-choice exercises
  if (input.type === "multiple-choice") {
    if (!input.options || input.options.length < 2) {
      return err({ field: "options", message: "multiple-choice exercises require at least 2 options" });
    }
    const optionValues = input.options.map(opt => typeof opt === "string" ? opt : opt.value);
    if (!optionValues.includes(input.expectedAnswer)) {
      return err({ field: "expectedAnswer", message: "expectedAnswer must be one of the options for multiple-choice exercises" });
    }
  }

  return ok(input);
}
