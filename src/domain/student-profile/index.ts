/**
 * Student Profile — pure domain model and functions.
 * No React, No Next.js, No Supabase, No I/O.
 */

import type { SkillId } from "../models/skill";
import type { Difficulty } from "../models/exercise";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Canonical local student identity. All fields readonly. */
export interface StudentProfile {
  readonly studentId: string;
  readonly displayName: string;
  readonly createdAt: string;
  readonly lastActiveAt: string;
}

/** Input to createProfile. */
export interface CreateProfileInput {
  readonly displayName: string;
  readonly studentId?: string;
}

/** Discriminated validation error tag. */
export type ProfileValidationError = "empty" | "too-long" | "invalid-chars";

/** Adapter-level state for all profiles. */
export interface ProfilesState {
  readonly profiles: readonly StudentProfile[];
  readonly activeStudentId: string | null;
}

/**
 * Central-map progress state — one slice per student.
 * Used by storage adapters to key practice/diagnostic/study-plan per student.
 */
export interface ProgressState<T> {
  readonly students: Record<string, T>;
  readonly activeStudentId: string | null;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a display name.
 * Returns null if valid, a ProfileValidationError tag otherwise.
 * Input is trimmed before validation.
 *
 * Valid: 1–40 chars from Unicode letter/number/space categories (\p{L}\p{N}\p{Z}).
 */
export function validateDisplayName(input: string): ProfileValidationError | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return "empty";
  if (trimmed.length > 40) return "too-long";
  // Unicode letter + number + space category
  if (!/^[\p{L}\p{N}\p{Z}]+$/u.test(trimmed)) return "invalid-chars";
  return null;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a display name: trim leading/trailing whitespace, collapse
 * internal runs of whitespace to a single space. Preserves casing.
 */
export function normalizeDisplayName(input: string): string {
  return input.trim().replace(/\s+/gu, " ");
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

/**
 * Generate a stable, opaque, locally-unique student ID.
 * Uses crypto.randomUUID with a `local-` prefix. No PII.
 */
export function createStudentId(): string {
  return `local-${crypto.randomUUID()}`;
}

// ---------------------------------------------------------------------------
// Profile creation
// ---------------------------------------------------------------------------

/**
 * Create a StudentProfile from input.
 * - Validates displayName (throws ProfileValidationError on invalid)
 * - Normalizes displayName
 * - Generates studentId if not supplied
 * - Sets createdAt and lastActiveAt to now().toISOString()
 */
export function createProfile(
  input: CreateProfileInput,
  now: () => Date = () => new Date()
): StudentProfile {
  const error = validateDisplayName(input.displayName);
  if (error !== null) throw error;

  const displayName = normalizeDisplayName(input.displayName);
  const studentId = input.studentId ?? createStudentId();
  const ts = now().toISOString();

  return Object.freeze({
    studentId,
    displayName,
    createdAt: ts,
    lastActiveAt: ts,
  });
}

// ---------------------------------------------------------------------------
// Active selection
// ---------------------------------------------------------------------------

/**
 * Return the profile whose studentId matches state.activeStudentId.
 * Returns null when no match exists. Does NOT auto-create.
 */
export function selectActiveProfile(state: ProfilesState): StudentProfile | null {
  if (state.activeStudentId === null) return null;
  return (
    state.profiles.find((p) => p.studentId === state.activeStudentId) ?? null
  );
}

// ---------------------------------------------------------------------------
// Last-active update
// ---------------------------------------------------------------------------

/**
 * Return a new StudentProfile with lastActiveAt updated to now().toISOString().
 * All other fields remain unchanged. Pure — no mutation.
 */
export function updateLastActiveAt(
  profile: StudentProfile,
  now: () => Date = () => new Date()
): StudentProfile {
  return Object.freeze({
    ...profile,
    lastActiveAt: now().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Re-export PracticeAttempt with optional studentId (backward compat)
// ---------------------------------------------------------------------------

/**
 * A single practice attempt.
 * `studentId` is optional for backward compatibility: attempts saved before
 * this change do not have this field.
 */
export interface PracticeAttempt {
  readonly exerciseId: string;
  readonly skillId: SkillId;
  readonly correct: boolean;
  readonly errorTag?: string;
  readonly answeredAt: string;
  readonly difficulty?: Difficulty;
  readonly timeMs: number;
  readonly attemptIndex: number;
  readonly studentId?: string;
}
