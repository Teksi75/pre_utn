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
// Empty-progress detection helpers
// ---------------------------------------------------------------------------

/**
 * True when a remote progress read returns "no data" — either a missing
 * row represented as `EMPTY_PROGRESS` (empty attempts) or a value that
 * cannot be inspected at all. Used by `withLocalFallback` to decide when
 * a local-progress read should override a remote-empty read (REQ-NEW-2c).
 */
function isEmptyProgressValue(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return true;
  const p = value as { attempts?: unknown };
  return !Array.isArray(p.attempts) || p.attempts.length === 0;
}

/**
 * True when a progress value carries real student evidence — non-empty
 * attempts array. Used by `withLocalFallback` to decide whether the
 * local slice should win over an empty remote read.
 */
function hasMeaningfulProgress(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const p = value as { attempts?: unknown };
  return Array.isArray(p.attempts) && p.attempts.length > 0;
}

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
  /**
   * Optional observability callback invoked when a remote operation falls back
   * to the local adapter. Called for both thrown errors and resolved failures.
   * Client-safe: no service-role or non-public env data is passed.
   */
  readonly onFallback?: (method: string, error: unknown) => void;
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
/**
 * Detect resolved failure results from write operations.
 * Returns `true` if the result is an object with `ok: false`, which
 * represents a real Supabase failure (network, auth, RLS) that returned
 * a result instead of throwing.
 */
function isFailedResult(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    (value as { ok: boolean }).ok === false
  );
}

/**
 * Detect the "remote unavailable" sentinel for read operations.
 * The Supabase adapter returns this when no auth session exists,
 * signaling that the fallback wrapper should delegate to local storage
 * instead of returning empty/null data that would hide local data.
 */
function isRemoteUnavailable(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "__remoteUnavailable" in value &&
    (value as { __remoteUnavailable: boolean }).__remoteUnavailable === true
  );
}

/**
 * Create a sentinel value indicating the remote adapter is unavailable
 * (no auth session, expired session, etc.). Used internally by the
 * Supabase adapter for read methods that return nullable types.
 */
export function createRemoteUnavailableSentinel<T>(): T {
  return { __remoteUnavailable: true } as unknown as T;
}

export function withLocalFallback(
  remote: PersistenceAdapter,
  local: PersistenceAdapter,
  onFallback?: (method: string, error: unknown) => void
): PersistenceAdapter {
  /**
   * Attempt a remote operation. Catches both synchronous throws and async
   * Promise rejections, falling back to the local adapter in either case.
   *
   * Also detects:
   * - Resolved write results with `ok: false` (real Supabase failures)
   * - "Remote unavailable" sentinel for reads (no auth session)
   *
   * Spec: "If a remote read or write fails because Supabase is unreachable
   * or rejects a non-security operation, the app MUST keep the student
   * workflow usable through local fallback."
   */
  function attempt<T>(
    remoteFn: () => MaybePromise<T>,
    localFn: () => MaybePromise<T>,
    methodName: string
  ): MaybePromise<T> {
    try {
      const result = remoteFn();
      if (result instanceof Promise) {
        return result.then(
          (resolved) => {
            if (isFailedResult(resolved) || isRemoteUnavailable(resolved)) {
              onFallback?.(methodName, resolved);
              return localFn();
            }
            return resolved;
          },
          (err) => {
            onFallback?.(methodName, err);
            return localFn();
          }
        );
      }
      if (isFailedResult(result) || isRemoteUnavailable(result)) {
        onFallback?.(methodName, result);
        return localFn();
      }
      return result;
    } catch (err) {
      onFallback?.(methodName, err);
      return localFn();
    }
  }

  return {
    loadProfiles(): MaybePromise<ProfilesState> {
      return attempt(
        () => remote.loadProfiles(),
        () => local.loadProfiles(),
        "loadProfiles"
      );
    },

    saveProfiles(state: ProfilesState): MaybePromise<ProfileSaveResult> {
      return attempt(
        () => remote.saveProfiles(state),
        () => local.saveProfiles(state),
        "saveProfiles"
      );
    },

    /**
     * Specialized loadProgress that handles the post-auth-sync scenario:
     * a freshly linked remote account starts with no data, but the
     * student's local progress is real and must keep rendering.
     *
     * Algorithm — two stages:
     *   1. Standard fallback first (preserves prior semantics):
     *      - throws/rejects → local + emit fallback event
     *      - `__remoteUnavailable` sentinel → local + emit fallback event
     *        (the sentinel must NEVER leak past the wrapper for reads)
     *   2. Remote-empty + local-has recovery branch:
     *      - remote returns `EMPTY_PROGRESS` (empty attempts) AND local
     *        has real attempts → return local + emit fallback event
     *      - Otherwise → return remote (remote wins when it has data)
     *
     * Stage 1 runs first so the sentinel and thrown errors always delegate
     * to local, regardless of whether local has data. This matches the
     * existing `attempt()` semantics for every other method on the wrapper.
     */
    loadProgress(studentId: string): MaybePromise<PracticeProgress> {
      return (async (): Promise<PracticeProgress> => {
        // Stage 1: standard fallback for failure cases.
        let remoteResult: unknown;
        let remoteFailed = false;
        let remoteUnavailable = false;
        try {
          remoteResult = await Promise.resolve(remote.loadProgress(studentId));
          if (isRemoteUnavailable(remoteResult)) {
            remoteUnavailable = true;
          }
        } catch (err) {
          onFallback?.("loadProgress", err);
          remoteFailed = true;
        }

        // Throws / `__remoteUnavailable` → always delegate to local,
        // regardless of whether local has data. The sentinel must never
        // leak past the wrapper for reads.
        if (remoteFailed || remoteUnavailable) {
          // Emit the fallback event for observability parity with the
          // standard `attempt()` path used by other wrapper methods.
          if (remoteUnavailable) {
            onFallback?.("loadProgress", remoteResult);
          }
          return await Promise.resolve(local.loadProgress(studentId));
        }

        // Stage 2: specialized remote-empty + local-has recovery branch.
        if (isEmptyProgressValue(remoteResult)) {
          try {
            const localResult = await Promise.resolve(
              local.loadProgress(studentId)
            );
            if (hasMeaningfulProgress(localResult)) {
              onFallback?.("loadProgress", remoteResult);
              return localResult;
            }
            // Both empty: return the local empty progress (NOT the
            // remote empty, which would still be EMPTY_PROGRESS but the
            // local empty is the canonical "this student has nothing yet"
            // reading from the active storage layer).
            return localResult;
          } catch {
            // Local read failed too — fall back to the remote empty
            // result rather than propagating the local error.
            return remoteResult as PracticeProgress;
          }
        }

        return remoteResult as PracticeProgress;
      })();
    },

    saveProgress(
      studentId: string,
      progress: PracticeProgress
    ): MaybePromise<PersistenceResult<void>> {
      return attempt(
        () => remote.saveProgress(studentId, progress),
        () => local.saveProgress(studentId, progress),
        "saveProgress"
      );
    },

    /**
     * Specialized loadDiagnosticResult — structural twin of loadProgress.
     *
     * Reads are nullable (`DiagnosticResult | null`): a freshly linked
     * remote account has no prepared diagnostic snapshot, so the Supabase
     * adapter returns `null`. The standard `attempt()` wrapper would treat
     * that remote `null` as success and HIDE any local diagnostic the
     * student already completed. That was the partial-import blocker:
     * even when post-auth-sync status was `local-fallback`, a successful
     * remote null read would erase local evidence from the UI.
     *
     * Algorithm — two stages (same as loadProgress, empty predicate is
     * just `=== null` because the read is nullable):
     *   1. Standard fallback for failure cases (sentinel / throws →
     *      local + emit fallback event — sentinel must never leak).
     *   2. Remote-null + local-has recovery branch:
     *      - remote returns null AND local has data → return local +
     *        emit fallback event (the BLOCKER FIX)
     *      - Both null → return local null (no fallback event — there's
     *        no "empty" to recover from).
     *      - Remote has data → return remote (remote wins).
     *
     * Why this matters: PR1.10 — partial-import local-fallback status is
     * not enough because the adapter selector can still go remote; the
     * wrapper itself must recover local diagnostic data when remote is
     * null. Same invariant as loadProgress, applied to nullable reads.
     */
    loadDiagnosticResult(studentId: string): MaybePromise<DiagnosticResult | null> {
      return (async (): Promise<DiagnosticResult | null> => {
        // Stage 1: standard fallback for failure cases.
        let remoteResult: unknown;
        let remoteFailed = false;
        let remoteUnavailable = false;
        try {
          remoteResult = await Promise.resolve(
            remote.loadDiagnosticResult(studentId)
          );
          if (isRemoteUnavailable(remoteResult)) {
            remoteUnavailable = true;
          }
        } catch (err) {
          onFallback?.("loadDiagnosticResult", err);
          remoteFailed = true;
        }

        if (remoteFailed || remoteUnavailable) {
          if (remoteUnavailable) {
            onFallback?.("loadDiagnosticResult", remoteResult);
          }
          return await Promise.resolve(local.loadDiagnosticResult(studentId));
        }

        // Stage 2: specialized remote-null + local-has recovery branch.
        if (remoteResult === null) {
          try {
            const localResult = await Promise.resolve(
              local.loadDiagnosticResult(studentId)
            );
            if (localResult !== null) {
              onFallback?.("loadDiagnosticResult", remoteResult);
              return localResult;
            }
            // Both null: return the local null. There is nothing to
            // recover, so no fallback event is emitted.
            return localResult;
          } catch {
            // Local read failed too — return the remote null rather than
            // propagating the local error.
            return remoteResult as DiagnosticResult | null;
          }
        }

        return remoteResult as DiagnosticResult | null;
      })();
    },

    saveDiagnosticResult(
      studentId: string,
      result: DiagnosticResult
    ): MaybePromise<PersistenceResult<void>> {
      return attempt(
        () => remote.saveDiagnosticResult(studentId, result),
        () => local.saveDiagnosticResult(studentId, result),
        "saveDiagnosticResult"
      );
    },

    loadStudyPlan(studentId: string): MaybePromise<StudyPlan | null> {
      return (async (): Promise<StudyPlan | null> => {
        // Stage 1: standard fallback for failure cases (sentinel / throws
        // → local + emit fallback event — sentinel must never leak).
        let remoteResult: unknown;
        let remoteFailed = false;
        let remoteUnavailable = false;
        try {
          remoteResult = await Promise.resolve(
            remote.loadStudyPlan(studentId)
          );
          if (isRemoteUnavailable(remoteResult)) {
            remoteUnavailable = true;
          }
        } catch (err) {
          onFallback?.("loadStudyPlan", err);
          remoteFailed = true;
        }

        if (remoteFailed || remoteUnavailable) {
          if (remoteUnavailable) {
            onFallback?.("loadStudyPlan", remoteResult);
          }
          return await Promise.resolve(local.loadStudyPlan(studentId));
        }

        // Stage 2: specialized remote-null + local-has recovery branch.
        // The study plan is a derived snapshot of the diagnostic, so when
        // remote has no prepared row but local has a real plan, the
        // wrapper MUST preserve the local slice (see loadDiagnosticResult
        // for the same invariant on the diagnostic read).
        if (remoteResult === null) {
          try {
            const localResult = await Promise.resolve(
              local.loadStudyPlan(studentId)
            );
            if (localResult !== null) {
              onFallback?.("loadStudyPlan", remoteResult);
              return localResult;
            }
            // Both null: nothing to recover, no fallback event.
            return localResult;
          } catch {
            return remoteResult as StudyPlan | null;
          }
        }

        return remoteResult as StudyPlan | null;
      })();
    },

    saveStudyPlan(
      studentId: string,
      plan: StudyPlan
    ): MaybePromise<PersistenceResult<void>> {
      return attempt(
        () => remote.saveStudyPlan(studentId, plan),
        () => local.saveStudyPlan(studentId, plan),
        "saveStudyPlan"
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
  return withLocalFallback(remoteAdapter, localAdapter, config?.onFallback);
}
