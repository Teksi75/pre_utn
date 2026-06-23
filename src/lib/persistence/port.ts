/**
 * Persistence port — adapter contract for student profile and progress storage.
 *
 * This module defines the shared adapter interface that both local storage and
 * Supabase-backed persistence implement. Callers import from here and remain
 * adapter-agnostic — the selector decides which concrete adapter to use.
 *
 * Spec: "Identity-bearing profile and progress persistence MUST be accessible
 * through a shared adapter contract so local storage and Supabase-backed
 * persistence provide equivalent behavior to callers."
 *
 * Domain purity: this module re-exports domain types but contains no React,
 * Next.js, Supabase, or side effects.
 */

import type {
  ProfilesState,
  StudentProfile,
} from "../../domain/student-profile/index";
import type { PracticeProgress } from "../../domain/progress/index";
import type { DiagnosticResult, StudyPlan } from "../../domain/diagnostic";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/** Result of saving profiles — discriminated on `ok`. */
export type ProfileSaveResult =
  | { ok: true; state: ProfilesState }
  | { ok: false; reason: "storage-unavailable" | "profile-not-found" };

/** Generic persistence result — discriminated on `ok`. */
export type PersistenceResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "missing-active-profile" };

/**
 * A value that may be synchronous or a Promise.
 *
 * The persistence port uses this return type so the local adapter can stay
 * sync-compatible while the Supabase adapter (PR2) can return Promises.
 * The `withLocalFallback()` wrapper handles both transparently.
 */
export type MaybePromise<T> = T | Promise<T>;

// ---------------------------------------------------------------------------
// Adapter contract
// ---------------------------------------------------------------------------

/**
 * Shared persistence adapter interface.
 *
 * Both `localStoragePersistenceAdapter` and `supabasePersistenceAdapter`
 * implement this contract. The selector returns one or the other based on
 * configuration and availability.
 *
 * Student-scoped methods (loadProgress, saveProgress, loadDiagnosticResult,
 * saveDiagnosticResult, loadStudyPlan, saveStudyPlan) take a `studentId`
 * parameter so the adapter scopes its read/write to that student.
 */
export interface PersistenceAdapter {
  // --- Profiles (global — all students) ---
  loadProfiles(): MaybePromise<ProfilesState>;
  saveProfiles(state: ProfilesState): MaybePromise<ProfileSaveResult>;

  // --- Practice progress (student-scoped) ---
  loadProgress(studentId: string): MaybePromise<PracticeProgress>;
  saveProgress(
    studentId: string,
    progress: PracticeProgress
  ): MaybePromise<PersistenceResult<void>>;

  // --- Diagnostic result (student-scoped) ---
  loadDiagnosticResult(studentId: string): MaybePromise<DiagnosticResult | null>;
  saveDiagnosticResult(
    studentId: string,
    result: DiagnosticResult
  ): MaybePromise<PersistenceResult<void>>;

  // --- Study plan (student-scoped) ---
  loadStudyPlan(studentId: string): MaybePromise<StudyPlan | null>;
  saveStudyPlan(
    studentId: string,
    plan: StudyPlan
  ): MaybePromise<PersistenceResult<void>>;
}

// ---------------------------------------------------------------------------
// Runtime guard
// ---------------------------------------------------------------------------

/**
 * Type guard — returns `true` if `value` satisfies the PersistenceAdapter
 * contract at runtime. Checks for the presence and type of every method.
 */
export function isPersistenceAdapter(value: unknown): value is PersistenceAdapter {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.loadProfiles === "function" &&
    typeof obj.saveProfiles === "function" &&
    typeof obj.loadProgress === "function" &&
    typeof obj.saveProgress === "function" &&
    typeof obj.loadDiagnosticResult === "function" &&
    typeof obj.saveDiagnosticResult === "function" &&
    typeof obj.loadStudyPlan === "function" &&
    typeof obj.saveStudyPlan === "function"
  );
}

// ---------------------------------------------------------------------------
// Domain type re-exports (single import point for callers)
// ---------------------------------------------------------------------------

export type {
  ProfilesState,
  StudentProfile,
  PracticeProgress,
  DiagnosticResult,
  StudyPlan,
};
