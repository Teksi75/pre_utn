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
 * - On partial success: importedFields lists the successes; error carries
 *   the first failure observed.
 * - On all-success: ok:true with all three field names.
 * - On all-failure: ok:false with empty importedFields and the first error.
 * - When local state is fully empty, ok:true with importedFields:[] —
 *   nothing to import is a successful no-op.
 *
 * @module auth/import-local-progress
 */

import type { PersistenceAdapter } from "../persistence/port";
import { loadProgressRaw } from "../practice-progress";
import { loadDiagnosticResultRaw, loadStudyPlanRaw } from "../diagnostic-storage";

/** Fields that can be imported from local to remote. */
export type ImportableField = "progress" | "diagnostic" | "studyPlan";

/** Result of an import attempt. `ok` is false only when EVERY attempted field failed. */
export interface ImportResult {
  ok: boolean;
  /** Names of fields that were successfully written to the remote adapter. */
  importedFields: ImportableField[];
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
  if (!hasLocalProgress && !hasLocalDiagnostic && !hasLocalPlan) {
    return { ok: true, importedFields: [] };
  }

  // ----- Step 1: progress (sequential, awaited) -----
  if (hasLocalProgress) {
    try {
      const result = await Promise.resolve(
        remoteAdapter.saveProgress(studentId, localProgress),
      );
      if (result.ok) {
        importedFields.push("progress");
      } else if (!firstError) {
        firstError = new Error(`saveProgress returned ok:false (${result.reason})`);
      }
    } catch (e) {
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
      } else if (!firstError) {
        firstError = new Error(
          `saveDiagnosticResult returned ok:false (${result.reason})`,
        );
      }
    } catch (e) {
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
      } else if (!firstError) {
        firstError = new Error(`saveStudyPlan returned ok:false (${result.reason})`);
      }
    } catch (e) {
      if (!firstError) {
        firstError = e instanceof Error ? e : new Error(String(e));
      }
    }
  }

  return {
    ok: importedFields.length > 0,
    importedFields,
    ...(firstError ? { error: firstError } : {}),
  };
}
