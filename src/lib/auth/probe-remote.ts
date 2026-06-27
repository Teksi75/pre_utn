/**
 * probeRemoteState — read-only probe of what (if anything) a remote
 * persistence adapter has stored for the given student id.
 *
 * Used by the SIGNED_IN orchestrator (link-and-import) to choose one of
 * four branches: empty/empty, local-only, remote-only, conflict.
 *
 * Contract (REQ-NEW-2a, REQ-NEW-2d):
 * - Treats the adapter's `EMPTY_PROGRESS` sentinel (empty attempts) as
 *   "no remote progress". This matters because `supabase-adapter` returns
 *   EMPTY_PROGRESS for missing rows instead of throwing.
 * - Treats any thrown / rejected load as "empty" — the probe is
 *   all-or-nothing. A single network blip collapses the whole probe to
 *   all-false so the orchestrator's safe-default branch (local has +
 *   remote empty → import) takes over and the local data is preserved.
 * - Accepts a `PersistenceAdapter` so it is mockable; works with both
 *   the sync local adapter and the async Supabase adapter (both implement
 *   the same `MaybePromise` contract).
 *
 * @module auth/probe-remote
 */

import type { PersistenceAdapter } from "../persistence/port";

/**
 * Snapshot of what the remote adapter currently holds for `studentId`.
 *
 * `hasRemoteProgress` is `true` only when the remote `attempts` array is
 * non-empty. Empty-but-present progress rows count as empty (mirrors the
 * `EMPTY_PROGRESS` sentinel semantics).
 */
export interface RemoteState {
  hasRemoteProgress: boolean;
  hasDiagnostic: boolean;
  hasStudyPlan: boolean;
}

/**
 * Probe the remote persistence adapter for any data stored for the given
 * student id. Never throws — any error collapses to "remote is empty".
 *
 * @param remoteAdapter - The Supabase adapter (or any PersistenceAdapter).
 * @param studentId - The student id to probe.
 */
export async function probeRemoteState(
  remoteAdapter: PersistenceAdapter,
  studentId: string
): Promise<RemoteState> {
  try {
    const [progress, diagnostic, plan] = await Promise.all([
      Promise.resolve(remoteAdapter.loadProgress(studentId)),
      Promise.resolve(remoteAdapter.loadDiagnosticResult(studentId)),
      Promise.resolve(remoteAdapter.loadStudyPlan(studentId)),
    ]);

    const hasRemoteProgress =
      Array.isArray(progress.attempts) && progress.attempts.length > 0;

    return {
      hasRemoteProgress,
      hasDiagnostic: diagnostic !== null,
      hasStudyPlan: plan !== null,
    };
  } catch {
    // Defensive: any thrown / rejected load collapses the probe to "remote
    // is empty". The orchestrator's safe-default branch treats this as
    // `local has + remote empty → import`, which preserves local data.
    return {
      hasRemoteProgress: false,
      hasDiagnostic: false,
      hasStudyPlan: false,
    };
  }
}
