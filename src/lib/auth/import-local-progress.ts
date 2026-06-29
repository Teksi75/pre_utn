/**
 * importLocalProgressToRemote — non-destructive import of the active
 * local student's progress into the remote persistence adapter.
 *
 * Called by the SIGNED_IN orchestrator ONLY in the `local has + remote
 * empty` branch. The non-destructive guarantee is at the localStorage
 * layer: the raw local loaders are read but never written, so a failed
 * import leaves the local profile and progress intact (REQ-NEW-2c,
 * REQ-NEW-2d — conflict → no overwrite).
 *
 * Contract:
 * - Sequential remote saves (one after another) so we do not contend
 *   for the same `student_progress_snapshots` row.
 * - Each save is wrapped in its own try/catch; the helper never throws.
 * - `ok` means "nothing failed" — `true` ONLY when:
 *     * there was nothing local to attempt (noop), OR
 *     * every attempted remote save succeeded.
 * - On partial success: `ok` is FALSE so the orchestrator can map to
 *   `local-fallback / import-partial` and the public post-auth sync
 *   status flips to "local-fallback" instead of falsely reporting
 *   "ready". This matters because a remote `null` for a missing field
 *   would silently hide local diagnostic/study-plan data behind the
 *   Supabase row on the next remote read.
 * - `importedFields` lists what made it; `failedFields` lists what
 *   didn't (present on partial / full failure, empty otherwise);
 *   `error` carries the first failure observed.
 *
 * @module auth/import-local-progress
 */

import type { PersistenceAdapter } from "../persistence/port";
import { loadProgressRaw } from "../practice-progress";
import { loadDiagnosticResultRaw, loadStudyPlanRaw } from "../diagnostic-storage";

/** Fields that can be imported from local to remote. */
export type ImportableField = "progress" | "diagnostic" | "studyPlan";

/**
 * Result of an import attempt.
 *
 * - `ok` is true ONLY when no field failed: either nothing was
 *   attempted (noop), or every attempted remote save succeeded.
 * - On partial failure, `ok` is FALSE even if some fields imported
 *   successfully — the caller (orchestrator → status module) MUST
 *   treat this as `local-fallback`, never as "ready".
 * - `failedFields` is always present and lists every field that
 *   existed locally but did not write remotely. Empty on noop and on
 *   full success.
 */
export interface ImportResult {
  ok: boolean;
  /** Names of fields that were successfully written to the remote adapter. */
  importedFields: ImportableField[];
  /** Names of fields that existed locally but failed to write remotely. */
  failedFields: ImportableField[];
  /** First error observed, if any. Present on partial or full failure. */
  error?: Error;
}

/**
 * Import the active local student's progress to the remote adapter for
 * the given studentId. Never throws.
 *
 * @param remoteAdapter - The Supabase-backed persistence adapter.
 * @param studentId - The student id to write to. Must match the active
 *                    local profile id (the raw loaders only read the
 *                    active student's slot).
 */
export async function importLocalProgressToRemote(
  remoteAdapter: PersistenceAdapter,
  studentId: string
): Promise<ImportResult> {
  const importedFields: ImportableField[] = [];
  const failedFields: ImportableField[] = [];
  let firstError: Error | undefined;

  // Snapshot local state once. We never write back — localStorage is
  // intentionally untouched so a failed import does not corrupt the
  // local profile.
  const localProgress = loadProgressRaw();
  const localDiagnostic = loadDiagnosticResultRaw();
  const localPlan = loadStudyPlanRaw();

  const hasLocalProgress = localProgress.attempts.length > 0;
  const hasLocalDiagnostic = localDiagnostic !== null;
  const hasLocalPlan = localPlan !== null;

  // Nothing to import → successful no-op. Skips the network entirely.
  // failedFields stays empty — there's nothing to fail.
  if (!hasLocalProgress && !hasLocalDiagnostic && !hasLocalPlan) {
    return { ok: true, importedFields: [], failedFields: [] };
  }

  // ----- Step 1: progress (sequential, awaited) -----
  if (hasLocalProgress) {
    try {
      const result = await Promise.resolve(
        remoteAdapter.saveProgress(studentId, localProgress),
      );
      if (result.ok) {
        importedFields.push("progress");
      } else {
        failedFields.push("progress");
        if (!firstError) {
          firstError = new Error(`saveProgress returned ok:false (${result.reason})`);
        }
      }
    } catch (e) {
      failedFields.push("progress");
      if (!firstError) {
        firstError = e instanceof Error ? e : new Error(String(e));
      }
    }
  }

  // ----- Step 2: diagnostic (sequential, awaited) -----
  if (hasLocalDiagnostic && localDiagnostic !== null) {
    try {
      const result = await Promise.resolve(
        remoteAdapter.saveDiagnosticResult(studentId, localDiagnostic),
      );
      if (result.ok) {
        importedFields.push("diagnostic");
      } else {
        failedFields.push("diagnostic");
        if (!firstError) {
          firstError = new Error(
            `saveDiagnosticResult returned ok:false (${result.reason})`,
          );
        }
      }
    } catch (e) {
      failedFields.push("diagnostic");
      if (!firstError) {
        firstError = e instanceof Error ? e : new Error(String(e));
      }
    }
  }

  // ----- Step 3: study plan (sequential, awaited) -----
  if (hasLocalPlan && localPlan !== null) {
    try {
      const result = await Promise.resolve(
        remoteAdapter.saveStudyPlan(studentId, localPlan),
      );
      if (result.ok) {
        importedFields.push("studyPlan");
      } else {
        failedFields.push("studyPlan");
        if (!firstError) {
          firstError = new Error(`saveStudyPlan returned ok:false (${result.reason})`);
        }
      }
    } catch (e) {
      failedFields.push("studyPlan");
      if (!firstError) {
        firstError = e instanceof Error ? e : new Error(String(e));
      }
    }
  }

  return {
    // ok = "nothing failed". A noop (no fields attempted) keeps failedFields
    // empty → ok:true. Any failure flips ok to false so the orchestrator
    // maps to local-fallback/import-partial (or import-failed when nothing
    // imported). Partial import must NOT report ok:true.
    ok: failedFields.length === 0,
    importedFields,
    failedFields,
    ...(firstError ? { error: firstError } : {}),
  };
}
