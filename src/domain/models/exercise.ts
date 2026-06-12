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

/** The 7 supported exercise types. free-response and symbolic are prohibited by AGENTS.md (no free-text for math). */
export type ExerciseType =
  | "multiple-choice"
  | "true-false"
  | "numerical"
  | "fill-blank"
  | "matching"
  | "ordering"
  | "graphical";

/** Difficulty level: 1 (easiest) to 5 (hardest). */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** A validated mathematics exercise. */
export interface Exercise {
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
 */
function hasStructuredMathAnswer(value: string): boolean {
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
