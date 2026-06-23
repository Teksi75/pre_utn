/**
 * Persistence adapter selector — chooses between local and remote persistence
 * based on configuration and availability.
 *
 * Selection logic:
 * 1. If Supabase env vars are missing → local adapter
 * 2. If no active profile exists (auth gate) → local adapter
 * 3. If `hasRemoteSession` is not explicitly `true` → local adapter
 * 4. If remote adapter is not provided → local adapter
 * 5. If remote adapter is provided → wrapped remote adapter with local fallback
 *
 * Design: "Require an existing Supabase Auth session before selecting remote."
 * Local active profile alone is NOT auth — the caller must signal an explicit
 * backend-authenticated session via `hasRemoteSession: true`.
 *
 * Spec: "The system MUST select Supabase persistence only when the required
 * public Supabase configuration is present and usable. If configuration is
 * missing, incomplete, or remote availability fails, the system MUST keep
 * existing local persistence working instead of blocking the student."
 */

import type {
  PersistenceAdapter,
  ProfileSaveResult,
  PersistenceResult,
  MaybePromise,
  ProfilesState,
  PracticeProgress,
  DiagnosticResult,
  StudyPlan,
} from "./port";
import { createLocalStorageAdapter } from "./local-adapter";
import { getActiveProfileId } from "../active-session";

// ---------------------------------------------------------------------------
// Config types
// ---------------------------------------------------------------------------

/** Environment variables required for Supabase persistence. */
export interface SupabaseEnvConfig {
  readonly url: string | undefined;
  readonly publishableKey: string | undefined;
}

/** Configuration for the persistence selector. */
export interface SelectorConfig {
  /** Supabase environment variables. If omitted, local adapter is used. */
  readonly env?: SupabaseEnvConfig;
  /** Remote adapter to use when Supabase is configured and available. */
  readonly remoteAdapter?: PersistenceAdapter;
  /**
   * Explicit signal that a backend-authenticated session exists (e.g. Supabase
   * Auth). A local active profile alone is NOT auth — this must be `true` for
   * remote selection. Defaults to `false` when omitted.
   */
  readonly hasRemoteSession?: boolean;
}

// ---------------------------------------------------------------------------
// Fallback wrapper
// ---------------------------------------------------------------------------

/**
 * Wrap a remote adapter so every operation falls back to the local adapter
 * when the remote throws (sync) or rejects (async). This guarantees the
 * student workflow stays usable even when Supabase is unreachable mid-session.
 *
 * The wrapper detects whether the remote returned a Promise. If so, it
 * attaches a `.catch()` to route rejections to the local adapter. If the
 * remote returned synchronously, a plain `try/catch` handles it.
 *
 * Design: "If a remote read or write fails because Supabase is unreachable
 * or rejects a non-security operation, the app MUST keep the student
 * workflow usable through local fallback or an explicit non-destructive
 * result."
 */
export function withLocalFallback(
  remote: PersistenceAdapter,
  local: PersistenceAdapter
): PersistenceAdapter {
  /**
   * Attempt a remote operation. Catches both synchronous throws and async
   * Promise rejections, falling back to the local adapter in either case.
   */
  function attempt<T>(
    remoteFn: () => MaybePromise<T>,
    localFn: () => MaybePromise<T>
  ): MaybePromise<T> {
    try {
      const result = remoteFn();
      if (result instanceof Promise) {
        return result.catch(() => localFn());
      }
      return result;
    } catch {
      return localFn();
    }
  }

  return {
    loadProfiles(): MaybePromise<ProfilesState> {
      return attempt(
        () => remote.loadProfiles(),
        () => local.loadProfiles()
      );
    },

    saveProfiles(state: ProfilesState): MaybePromise<ProfileSaveResult> {
      return attempt(
        () => remote.saveProfiles(state),
        () => local.saveProfiles(state)
      );
    },

    loadProgress(studentId: string): MaybePromise<PracticeProgress> {
      return attempt(
        () => remote.loadProgress(studentId),
        () => local.loadProgress(studentId)
      );
    },

    saveProgress(
      studentId: string,
      progress: PracticeProgress
    ): MaybePromise<PersistenceResult<void>> {
      return attempt(
        () => remote.saveProgress(studentId, progress),
        () => local.saveProgress(studentId, progress)
      );
    },

    loadDiagnosticResult(studentId: string): MaybePromise<DiagnosticResult | null> {
      return attempt(
        () => remote.loadDiagnosticResult(studentId),
        () => local.loadDiagnosticResult(studentId)
      );
    },

    saveDiagnosticResult(
      studentId: string,
      result: DiagnosticResult
    ): MaybePromise<PersistenceResult<void>> {
      return attempt(
        () => remote.saveDiagnosticResult(studentId, result),
        () => local.saveDiagnosticResult(studentId, result)
      );
    },

    loadStudyPlan(studentId: string): MaybePromise<StudyPlan | null> {
      return attempt(
        () => remote.loadStudyPlan(studentId),
        () => local.loadStudyPlan(studentId)
      );
    },

    saveStudyPlan(
      studentId: string,
      plan: StudyPlan
    ): MaybePromise<PersistenceResult<void>> {
      return attempt(
        () => remote.saveStudyPlan(studentId, plan),
        () => local.saveStudyPlan(studentId, plan)
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Selector
// ---------------------------------------------------------------------------

/**
 * Select the appropriate persistence adapter based on configuration.
 *
 * Returns the local adapter by default. Returns a fallback-wrapped remote
 * adapter only when ALL of these are true:
 * - Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set
 * - An active profile exists (auth gate — prevents anonymous remote writes)
 * - `hasRemoteSession` is explicitly `true` (backend Auth session confirmed)
 * - A remote adapter is explicitly provided
 *
 * If the remote adapter throws during any operation, the fallback wrapper
 * catches and delegates to the local adapter transparently.
 */
export function selectPersistenceAdapter(
  config?: SelectorConfig
): PersistenceAdapter {
  const localAdapter = createLocalStorageAdapter();

  // Step 1: Check Supabase env vars
  const url = config?.env?.url;
  const key = config?.env?.publishableKey;
  if (!url || !key) {
    return localAdapter;
  }

  // Step 2: Auth gate — require active profile
  const activeProfileId = getActiveProfileId();
  if (activeProfileId === null) {
    return localAdapter;
  }

  // Step 3: Require explicit backend-authenticated session signal.
  // Local profile alone is NOT auth.
  if (config?.hasRemoteSession !== true) {
    return localAdapter;
  }

  // Step 4: Check if remote adapter is provided
  const remoteAdapter = config?.remoteAdapter;
  if (!remoteAdapter) {
    return localAdapter;
  }

  // Step 5: All conditions met — return fallback-wrapped remote adapter
  return withLocalFallback(remoteAdapter, localAdapter);
}
