/**
 * Challenge catalog types — definitions for challenge exercises.
 *
 * These types live in a parallel module tree that the base practice flow
 * never imports, ensuring zero coupling to the base catalog.
 */

import type { Exercise, ExerciseType, Difficulty } from "../../models/exercise";
import type { SkillId } from "../../models/skill";

// ---------------------------------------------------------------------------
// Source Use
// ---------------------------------------------------------------------------

/**
 * How the challenge source was derived.
 * - `canonical-source`: direct from canonical exam/pre-UTN material
 * - `adapted`: adapted from canonical source for difficulty/format
 * - `calibrated-from-exam`: constructed based on exam patterns and error analysis
 * - `solution-pattern`: constructed from recurring solution patterns observed
 */
export type ChallengeSourceUse =
  | "canonical-source"
  | "adapted"
  | "calibrated-from-exam"
  | "solution-pattern";

// ---------------------------------------------------------------------------
// Canonical Trace
// ---------------------------------------------------------------------------

/**
 * Pedagogical traceability back to the source material.
 * Every challenge MUST have at least one trace entry.
 */
export interface ChallengeCanonicalTrace {
  /** Dot-separated path within the source material (e.g. "capitulo-3.ejercicio-7") */
  readonly path: string;
  /** Human-readable section name (e.g. "Números Complejos — Forma Polar") */
  readonly section: string;
  /** How this challenge was derived from the source */
  readonly sourceUse: ChallengeSourceUse;
  /** Why this challenge was included (pedagogical rationale) */
  readonly pedagogicalIntent: string;
}

// ---------------------------------------------------------------------------
// Challenge Exercise
// ---------------------------------------------------------------------------

/**
 * A challenge exercise is an integrative exercise tagged as a challenge.
 * It extends the base Exercise with challenge-specific invariants:
 * - challengeSection: true (marks it as living in the challenge tree)
 * - category: "desafio"
 * - tags: includes "desafio" and "integrador"
 * - canonicalTrace: required, at least one entry
 *
 * Difficulty is always 4 or 5 (hard exercises).
 */
export interface ChallengeExercise extends Exercise {
  /** Challenges live in the separate challenge section tree */
  readonly challengeSection: true;
  /** Challenges use the "desafio" category */
  readonly category: "desafio";
  /** Challenge exercises are tagged for filtering */
  readonly tags: readonly ["desafio", "integrador"];
  /** Pedagogical traceability — required, at least one entry */
  readonly canonicalTrace: readonly ChallengeCanonicalTrace[];
}
