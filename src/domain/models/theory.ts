/**
 * Theory model — mathematics theory nodes with concept blocks and canonical trace.
 * No external dependencies. Pure TypeScript.
 */

import type { Result } from "./result";
import { ok, err } from "./result";
import type { SkillId } from "./skill";
import type { IntervalModel } from "../intervals/index";
import type { IntervalRepresentation } from "../intervals/representation";

/** Source use classification for canonical material. */
export type SourceUse = "adapted" | "reinforcement" | "reference";

/** Traceability to canonical material. */
export interface CanonicalTrace {
  readonly path: string;
  readonly section?: string;
  readonly sourceUse: SourceUse;
  readonly pedagogicalIntent: string;
}

/** A single concept block within a theory node. */
export interface ConceptBlock {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  /** Optional interval representations for visual examples. */
  readonly intervalRepresentations?: readonly IntervalRepresentation[];
}

/** Optional visual interval representation attached to theory nodes. */
export interface IntervalVisualExample {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly interval: IntervalModel;
}

/** A theory node — the smallest teachable unit for a skill. */
export interface TheoryNode {
  readonly id: string;
  readonly skillId: SkillId;
  readonly concepts: readonly ConceptBlock[];
  readonly notation: readonly string[];
  readonly commonMistakes: readonly string[];
  readonly practicePrompts: readonly string[];
  readonly canonicalTrace: readonly CanonicalTrace[];
  readonly intervalVisuals?: readonly IntervalVisualExample[];
}

/** Validation error with field and message. */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
}

const VALID_SOURCE_USES: ReadonlySet<string> = new Set([
  "adapted",
  "reinforcement",
  "reference",
]);

/**
 * Validate a theory node.
 *
 * @param input - The theory node to validate
 * @returns Ok<TheoryNode> on success, Err<ValidationError> on failure
 */
export function validateTheoryNode(
  input: TheoryNode
): Result<TheoryNode, ValidationError> {
  // Validate id
  if (!input.id || input.id.trim().length === 0) {
    return err({ field: "id", message: "id is required" });
  }

  // Validate concepts
  if (!input.concepts || input.concepts.length === 0) {
    return err({ field: "concepts", message: "concepts must have at least one entry" });
  }

  // Validate notation
  if (!input.notation || input.notation.length === 0) {
    return err({ field: "notation", message: "notation must have at least one entry" });
  }

  // Validate commonMistakes
  if (!input.commonMistakes || input.commonMistakes.length === 0) {
    return err({ field: "commonMistakes", message: "commonMistakes must have at least one entry" });
  }

  // Validate canonicalTrace
  if (!input.canonicalTrace || input.canonicalTrace.length === 0) {
    return err({ field: "canonicalTrace", message: "canonicalTrace must have at least one entry" });
  }

  // Validate each trace entry
  for (let i = 0; i < input.canonicalTrace.length; i++) {
    const trace = input.canonicalTrace[i];
    if (!trace.path || trace.path.trim().length === 0) {
      return err({ field: `canonicalTrace[${i}].path`, message: "path is required" });
    }
    if (!trace.pedagogicalIntent || trace.pedagogicalIntent.trim().length === 0) {
      return err({ field: `canonicalTrace[${i}].pedagogicalIntent`, message: "pedagogicalIntent is required" });
    }
    if (!VALID_SOURCE_USES.has(trace.sourceUse)) {
      return err({
        field: `canonicalTrace[${i}].sourceUse`,
        message: `Invalid sourceUse: ${trace.sourceUse}. Expected adapted, reinforcement, or reference`,
      });
    }
  }

  return ok(input);
}
