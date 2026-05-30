/**
 * Skill model — mathematics skill identity, metadata, and validation.
 * No external dependencies. Pure TypeScript.
 */

import type { Result } from "./result";
import { ok, err } from "./result";

/** Skill ID format: mat.u{1-6}.{slug} */
export type SkillId = `mat.u${1 | 2 | 3 | 4 | 5 | 6}.${string}`;

/** Unit number: 1 through 6. */
export type Unit = 1 | 2 | 3 | 4 | 5 | 6;

/** A validated mathematics skill. */
export interface Skill {
  readonly id: SkillId;
  readonly unit: Unit;
  readonly displayName: string;
  readonly description: string;
  readonly prerequisites: readonly SkillId[];
  readonly learnerPurpose: string;
  readonly teacherInterpretation: readonly string[];
  readonly tags: readonly string[];
}

/** Validation error with field and message. */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
}

const SKILL_ID_PATTERN = /^mat\.u([1-6])\.(.+)$/;

/**
 * Validate a skill object.
 *
 * @param input - The skill to validate
 * @param knownSkillIds - Set of known SkillIds for prerequisite validation
 * @returns Ok<Skill> on success, Err<ValidationError> on failure
 */
export function validateSkill(
  input: Skill,
  knownSkillIds: Set<SkillId>
): Result<Skill, ValidationError> {
  // Validate ID format
  const idMatch = SKILL_ID_PATTERN.exec(input.id);
  if (!idMatch) {
    return err({ field: "id", message: `Invalid skill ID format: ${input.id}. Expected mat.u{1-6}.{slug}` });
  }

  // Validate unit matches the ID
  const idUnit = Number(idMatch[1]) as Unit;
  if (input.unit !== idUnit) {
    return err({ field: "unit", message: `Unit ${input.unit} does not match ID unit ${idUnit}` });
  }

  // Validate unit is in range
  if (input.unit < 1 || input.unit > 6) {
    return err({ field: "unit", message: `Unit must be 1-6, got ${input.unit}` });
  }

  // Validate prerequisites
  if (input.prerequisites.length > 0) {
    // Check for self-reference (cycle of length 1).
    // TODO(PR3): full transitive prerequisite cycle detection belongs in catalog-level validation.
    if (input.prerequisites.includes(input.id)) {
      return err({ field: "prerequisites", message: `Skill ${input.id} has a self-referencing prerequisite (cycle detected)` });
    }

    // Check all prerequisites exist in known set
    for (const prereq of input.prerequisites) {
      if (!knownSkillIds.has(prereq)) {
        return err({ field: "prerequisites", message: `Unknown prerequisite: ${prereq}` });
      }
    }
  }

  // Validate required pedagogical fields
  if (!input.learnerPurpose || input.learnerPurpose.trim().length === 0) {
    return err({ field: "learnerPurpose", message: "learnerPurpose is required" });
  }

  if (!input.teacherInterpretation || input.teacherInterpretation.length === 0) {
    return err({ field: "teacherInterpretation", message: "teacherInterpretation must have at least one entry" });
  }

  return ok(input);
}
