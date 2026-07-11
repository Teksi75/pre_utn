/**
 * Advanced practice progress — localStorage adapter for challenge attempts.
 *
 * Storage key: pre-utn.advanced-practice.v1
 * Separate from base pre-utn.practice.v1 to keep challenge and base
 * progress flows fully independent.
 *
 * Storage shape:
 * {
 *   challengeAttempts: readonly ChallengeAttempt[];
 *   readinessBySkill: Record<SkillId, number | null>;
 * }
 */

import type { SkillId } from "../domain/models/skill";
import { getActiveProfileId } from "./active-session";

/** Versioned localStorage key for advanced (challenge) practice progress. */
export const ADVANCED_PRACTICE_STORAGE_KEY = "pre-utn.advanced-practice.v1";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/**
 * A single challenge attempt.
 * Similar to PracticeAttempt but scoped to challenge exercises.
 * attemptIndex is the 1-indexed retry count for this exercise within the
 * current session. Used as tie-breaker when answeredAt timestamps are equal.
 *
 * `studentId` is REQUIRED on `ChallengeAttempt` because new writes always go
 * through `addChallengeAttempt`, which stamps the field from the active
 * profile. The persisted envelope is widened to `ParsedChallengeAttempt`
 * (see below) because legacy anonymous records saved before the
 * student-identity bridge may still be present in storage.
 */
export interface ChallengeAttempt {
  readonly studentId: string;
  readonly exerciseId: string;
  readonly skillId: SkillId;
  readonly correct: boolean;
  readonly answeredAt: string;
  readonly timeMs: number;
  readonly attemptIndex: number;
}

/**
 * Parsed shape of a `ChallengeAttempt` — admits legacy anonymous records
 * (saved before the student-identity bridge) that omit `studentId`.
 *
 * GGA BLOCKER FIX: the previous `isValidChallengeAttempt` predicate was
 * typed `raw is ChallengeAttempt` but accepted `studentId: undefined` at
 * runtime. The predicate lied — TypeScript thought every accepted entry had
 * `studentId: string`, while anonymous legacy entries did not. This union
 * makes the runtime shape explicit. New writes always go through
 * `addChallengeAttempt` (which stamps `studentId` from the active profile),
 * so freshly-produced attempts conform to `ChallengeAttempt` exactly.
 */
export type ParsedChallengeAttempt =
  | ChallengeAttempt
  | Omit<ChallengeAttempt, "studentId">;

/**
 * Input for addChallengeAttempt — omits studentId because the adapter
 * stamps it from the active profile. Callers (hooks, UI) should not
 * supply studentId; the storage layer owns that field.
 */
export type ChallengeAttemptInput = Omit<ChallengeAttempt, "studentId">;

/**
 * Full advanced practice progress state — RETURNED envelope.
 *
 * `loadAdvancedProgress` and `addChallengeAttempt` both return this shape,
 * which contains only stamped attempts (filtered by `activeStudentId`).
 * Anonymous legacy records are never surfaced through this envelope; they
 * are excluded by the active-student filter and remain in storage for
 * back-compat.
 *
 * readinessBySkill uses null to mean "not started" (no attempts yet).
 */
export interface AdvancedPracticeProgress {
  readonly challengeAttempts: readonly ChallengeAttempt[];
  readonly readinessBySkill: Record<SkillId, number | null>;
}

/**
 * Full advanced practice progress state — PERSISTED envelope.
 *
 * This is the on-disk shape produced by `parseAdvancedProgress`. It is
 * distinct from `AdvancedPracticeProgress` because storage may contain
 * legacy anonymous records (saved before the student-identity bridge)
 * that omit `studentId`. The write path in `addChallengeAttempt` also
 * round-trips through this shape (legacy anonymous entries are preserved
 * verbatim and stamped new entries are appended).
 *
 * Callers that need the filtered view should consume `AdvancedPracticeProgress`
 * from `loadAdvancedProgress` / `addChallengeAttempt` instead.
 */
export interface ParsedAdvancedPracticeProgress {
  readonly challengeAttempts: readonly ParsedChallengeAttempt[];
  readonly readinessBySkill: Record<SkillId, number | null>;
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

const EMPTY_ADVANCED_PROGRESS: AdvancedPracticeProgress = {
  challengeAttempts: [],
  readinessBySkill: {},
};

// ---------------------------------------------------------------------------
// Deduplication (same pattern as base progress)
// ---------------------------------------------------------------------------

/**
 * Keep only the last chronological attempt per exerciseId.
 * Uses answeredAt as primary sort key (most recent wins) and
 * attemptIndex as tie-breaker when timestamps are equal.
 */
function deduplicateByLastAttempt(
  attempts: readonly ChallengeAttempt[]
): ChallengeAttempt[] {
  const byExercise = new Map<string, ChallengeAttempt>();
  for (const a of attempts) {
    const existing = byExercise.get(a.exerciseId);
    if (
      !existing ||
      a.answeredAt > existing.answeredAt ||
      (a.answeredAt === existing.answeredAt && a.attemptIndex > existing.attemptIndex)
    ) {
      byExercise.set(a.exerciseId, a);
    }
  }
  return [...byExercise.values()];
}

// ---------------------------------------------------------------------------
// Computed readiness
// ---------------------------------------------------------------------------

/**
 * Compute the advanced readiness score for a skill.
 *
 * - No attempts → null (not started)
 * - With attempts → round(accuracy * 100)
 *   where accuracy = correct_deduplicated / total_deduplicated
 *   (last attempt per exerciseId wins)
 *
 * When activeStudentId is provided, only attempts matching that student
 * contribute to the score. Legacy anonymous attempts (no studentId) are
 * excluded when filtering is active.
 *
 * @param skillId - The skill to compute readiness for
 * @param attempts - All challenge attempts to evaluate
 * @param activeStudentId - If provided, filter to this student only
 * @returns Score 0–100 or null when no attempts exist
 */
export function computeAdvancedReadiness(
  skillId: SkillId,
  attempts: readonly ParsedChallengeAttempt[],
  activeStudentId?: string
): number | null {
  const skillAttempts = attempts.filter((a) => a.skillId === skillId);
  const filtered = activeStudentId
    ? skillAttempts.filter(
        (a): a is ChallengeAttempt =>
          "studentId" in a && a.studentId === activeStudentId
      )
    : skillAttempts.filter(
        (a): a is ChallengeAttempt => "studentId" in a
      );
  const deduplicated = deduplicateByLastAttempt(filtered);

  if (deduplicated.length === 0) return null;

  const correct = deduplicated.filter((a) => a.correct).length;
  const accuracy = correct / deduplicated.length;
  return Math.round(accuracy * 100);
}

// ---------------------------------------------------------------------------
// Readiness recomputation (pure)
// ---------------------------------------------------------------------------

/**
 * Recompute readinessBySkill for ALL skills present in the given attempts.
 * This is the single source of truth for readiness — never trust persisted maps.
 *
 * @param attempts - Filtered attempts (active student only)
 * @returns Record mapping each skillId to its readiness score (0–100) or null
 */
function recomputeAllReadiness(
  attempts: readonly ChallengeAttempt[]
): Record<SkillId, number | null> {
  const skillIds = new Set(attempts.map((a) => a.skillId));
  const result: Record<string, number | null> = {};
  for (const skillId of skillIds) {
    result[skillId] = computeAdvancedReadiness(skillId, attempts);
  }
  return result as Record<SkillId, number | null>;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

// Exported for S0d fixture tests: `u3-s0d-fixtures.test.ts` parses the
// frozen `pre-utn.advanced-practice.v1` baseline through the real
// production deserializer (the SAME function `loadAdvancedProgress`
// calls internally). Keeping it as a named export prevents tests
// from re-implementing the shape contract and drifting if the
// loader's parser ever changes.
//
// Validates EVERY attempt entry before casting. The previous version
// only checked that `challengeAttempts` was an array and cast the rest
// through `unknown`, which let malformed records (missing required
// fields, wrong types) silently leak into callers as ChallengeAttempt.
// Anything that does not match the documented ChallengeAttempt shape
// is rejected so callers receive a typed value they can actually trust.
//
// `studentId` is OPTIONAL at the parser boundary because legacy
// anonymous attempts (saved before the student-identity bridge) do not
// carry it. The downstream filter in `loadAdvancedProgress` already
// excludes such attempts from active-student reads, so the parser only
// has to ensure the field is either absent or a non-empty string when
// present.
//
// GGA BLOCKER FIX: this predicate now narrows to `ParsedChallengeAttempt`
// (the union of stamped `ChallengeAttempt` and legacy anonymous records)
// instead of `ChallengeAttempt`. The previous signature `raw is ChallengeAttempt`
// was a type lie — the runtime validation accepted `studentId: undefined`,
// but TypeScript thought every accepted entry had a non-empty `studentId`.
// The union makes the runtime shape explicit and the predicate honest.
function isValidChallengeAttempt(raw: unknown): raw is ParsedChallengeAttempt {
  if (!raw || typeof raw !== "object") return false;
  const a = raw as Record<string, unknown>;
  if (
    a.studentId !== undefined &&
    (typeof a.studentId !== "string" || a.studentId.length === 0)
  ) {
    return false;
  }
  if (typeof a.exerciseId !== "string" || a.exerciseId.length === 0) return false;
  if (typeof a.skillId !== "string" || a.skillId.length === 0) return false;
  if (typeof a.correct !== "boolean") return false;
  if (typeof a.answeredAt !== "string" || a.answeredAt.length === 0) return false;
  if (typeof a.timeMs !== "number" || !Number.isFinite(a.timeMs)) return false;
  if (
    typeof a.attemptIndex !== "number" ||
    !Number.isInteger(a.attemptIndex) ||
    a.attemptIndex < 1
  ) {
    return false;
  }
  return true;
}

export function parseAdvancedProgress(
  raw: unknown
): ParsedAdvancedPracticeProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  // challengeAttempts: required, array of well-formed ChallengeAttempt entries.
  if (!Array.isArray(obj.challengeAttempts)) return null;
  for (const a of obj.challengeAttempts) {
    if (!isValidChallengeAttempt(a)) return null;
  }

  // readinessBySkill: required, record of finite numbers in [0, 100] or null.
  // The numeric range + null sentinel is part of the public contract; an
  // out-of-range number or an unexpected value type means a malformed record.
  if (!obj.readinessBySkill || typeof obj.readinessBySkill !== "object" || Array.isArray(obj.readinessBySkill)) {
    return null;
  }
  for (const v of Object.values(obj.readinessBySkill as Record<string, unknown>)) {
    if (v === null) continue;
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 100) {
      return null;
    }
  }

  // All fields are well-formed. The cast returns the PERSISTED envelope
  // (`ParsedAdvancedPracticeProgress`), which is the on-disk shape and
  // admits legacy anonymous records that omit `studentId`. Callers that
  // need the filtered public view should consume `AdvancedPracticeProgress`
  // from `loadAdvancedProgress` / `addChallengeAttempt` instead.
  return raw as ParsedAdvancedPracticeProgress;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load advanced practice progress from localStorage.
 * Returns empty progress if nothing stored or data is invalid/corrupt.
 * Filters challengeAttempts to the active student only.
 * Legacy anonymous attempts (no studentId) are excluded from reads.
 */
export function loadAdvancedProgress(): AdvancedPracticeProgress {
  try {
    const activeStudentId = getActiveProfileId();
    if (!activeStudentId) return EMPTY_ADVANCED_PROGRESS;

    const raw = localStorage.getItem(ADVANCED_PRACTICE_STORAGE_KEY);
    if (!raw) return EMPTY_ADVANCED_PROGRESS;

    const parsed = JSON.parse(raw);
    const progress = parseAdvancedProgress(parsed);
    if (!progress) return EMPTY_ADVANCED_PROGRESS;

    // Ensure readinessBySkill is present (backward compat with older stores)
    // Filter to active student only; exclude legacy anonymous attempts.
    // The type predicate narrows the persisted union (`ParsedChallengeAttempt`)
    // to stamped `ChallengeAttempt` records because the comparison with
    // `activeStudentId` cannot succeed when `studentId === undefined`.
    const filtered = progress.challengeAttempts.filter(
      (a): a is ChallengeAttempt =>
        "studentId" in a && a.studentId === activeStudentId
    );

    // Recompute readiness from filtered attempts — never trust persisted map
    // (may contain stale cross-student or anonymous readiness entries)
    return {
      challengeAttempts: filtered,
      readinessBySkill: recomputeAllReadiness(filtered),
    };
  } catch {
    return EMPTY_ADVANCED_PROGRESS;
  }
}

/**
 * Add a single challenge attempt and persist.
 * Recomputes readiness for ALL skills from active student's attempts
 * (never trusts persisted readinessBySkill — it may contain stale entries).
 * Requires an active student profile; returns blocked result if none exists.
 *
 * @param attempt - The challenge attempt to record
 * @returns Persistence result with updated progress
 */
export function addChallengeAttempt(
  attempt: ChallengeAttemptInput
): { ok: true; value: AdvancedPracticeProgress } | { ok: false; reason: "missing-active-profile" | "storage-error" } {
  try {
    const activeStudentId = getActiveProfileId();
    if (!activeStudentId) {
      return { ok: false, reason: "missing-active-profile" };
    }

    // Load ALL attempts from storage (not filtered), then append the new one.
    // `parsed` is the persisted envelope (`ParsedAdvancedPracticeProgress`)
    // and may contain legacy anonymous records that omit `studentId`.
    const raw = localStorage.getItem(ADVANCED_PRACTICE_STORAGE_KEY);
    const parsed = raw ? parseAdvancedProgress(JSON.parse(raw)) : null;
    const allAttempts = parsed?.challengeAttempts ?? [];

    const stampedAttempt: ChallengeAttempt = { ...attempt, studentId: activeStudentId };
    const updatedAttempts: readonly ParsedChallengeAttempt[] = [
      ...allAttempts,
      stampedAttempt,
    ];

    // Filter to active student for readiness computation. The type predicate
    // narrows the persisted union to stamped `ChallengeAttempt` records
    // because the comparison cannot succeed when `studentId === undefined`.
    const activeStudentAttempts = updatedAttempts.filter(
      (a): a is ChallengeAttempt =>
        "studentId" in a && a.studentId === activeStudentId
    );

    // Recompute ALL readiness from active student's attempts
    // (never spread persisted readinessBySkill — it may contain stale entries)
    const updatedReadiness = recomputeAllReadiness(activeStudentAttempts);

    // Persist the MIXED shape (legacy anonymous + new stamped) under the
    // persisted envelope type. Legacy anonymous records are preserved
    // verbatim so a future profile switch can still exclude them.
    const updated: ParsedAdvancedPracticeProgress = {
      challengeAttempts: updatedAttempts,
      readinessBySkill: updatedReadiness as Record<SkillId, number | null>,
    };

    localStorage.setItem(
      ADVANCED_PRACTICE_STORAGE_KEY,
      JSON.stringify(updated)
    );

    // Return the FILTERED view (the public `AdvancedPracticeProgress` envelope,
    // all-stamped for the active student).
    const returned: AdvancedPracticeProgress = {
      challengeAttempts: activeStudentAttempts,
      readinessBySkill: updatedReadiness as Record<SkillId, number | null>,
    };

    return {
      ok: true,
      value: returned,
    };
  } catch {
    return { ok: false, reason: "storage-error" };
  }
}
