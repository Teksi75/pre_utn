/**
 * Local storage persistence adapter — wraps existing localStorage modules
 * into the shared PersistenceAdapter contract.
 *
 * This adapter delegates to injectable storage operations, preserving all
 * current behavior including lazy migration and error swallowing.
 *
 * The factory accepts raw storage operations so PR2 can inject non-recursive
 * implementations when wiring public storage modules through the selector.
 * When no operations are injected, it falls back to the default public
 * module imports.
 *
 * Student-scoped methods enforce that the passed `studentId` matches the
 * active profile. On mismatch, write operations return
 * `{ ok: false, reason: "missing-active-profile" }` and read operations
 * return empty defaults. When no active profile exists yet, `loadProgress`
 * allows the raw load path to run so legacy migration can create/recover
 * the local profile.
 *
 * Spec: "local adapter provides the same caller-visible behavior as before"
 */

import type {
  PersistenceAdapter,
  ProfileSaveResult,
  PersistenceResult,
  ProfilesState,
  PracticeProgress,
  DiagnosticResult,
  StudyPlan,
} from "./port";
import { getActiveProfileId } from "../active-session";

// ---------------------------------------------------------------------------
// Default storage operations (public module imports)
// ---------------------------------------------------------------------------

import {
  rawLoadProfiles,
  rawSaveProfiles,
} from "../student-profile-storage";
import {
  loadProgressRaw as defaultLoadProgress,
  saveProgressRaw as defaultSaveProgress,
  EMPTY_PROGRESS,
} from "../practice-progress";
import {
  loadDiagnosticResultRaw as defaultLoadDiagnosticResult,
  saveDiagnosticResultRaw as defaultSaveDiagnosticResult,
  loadStudyPlanRaw as defaultLoadStudyPlan,
  saveStudyPlanRaw as defaultSaveStudyPlan,
} from "../diagnostic-storage";

// ---------------------------------------------------------------------------
// Injectable operations type
// ---------------------------------------------------------------------------

/**
 * Raw storage operations that the local adapter delegates to.
 *
 * PR2 MUST inject raw (non-selector-wired) implementations here to avoid
 * recursion when public storage modules are wired through the selector.
 * When omitted, the factory uses the default public module imports.
 */
export interface LocalStorageOperations {
  readonly loadProfiles: () => ProfilesState;
  readonly saveProfiles: (state: ProfilesState) => ProfileSaveResult;
  readonly loadProgress: () => PracticeProgress;
  readonly saveProgress: (progress: PracticeProgress) => PersistenceResult<void>;
  readonly loadDiagnosticResult: () => DiagnosticResult | null;
  readonly saveDiagnosticResult: (result: DiagnosticResult) => PersistenceResult<void>;
  readonly loadStudyPlan: () => StudyPlan | null;
  readonly saveStudyPlan: (plan: StudyPlan) => PersistenceResult<void>;
}

// ---------------------------------------------------------------------------
// Fail-closed helper
// ---------------------------------------------------------------------------

/**
 * Check if the given studentId matches the active profile.
 * Returns `true` if they match, `false` otherwise.
 */
function isActiveStudent(studentId: string): boolean {
  return getActiveProfileId() === studentId;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a localStorage-backed PersistenceAdapter.
 *
 * @param ops - Injectable raw storage operations. When omitted, uses the
 *              default public module imports. PR2 MUST inject raw
 *              implementations to avoid selector recursion.
 *
 * Student-scoped methods enforce fail-closed behavior: if the passed
 * `studentId` does not match `getActiveProfileId()`, writes return
 * `{ ok: false, reason: "missing-active-profile" }` and reads return
 * empty defaults.
 */
export function createLocalStorageAdapter(
  ops?: LocalStorageOperations
): PersistenceAdapter {
  const loadProfiles = ops?.loadProfiles ?? rawLoadProfiles;
  const saveProfiles = ops?.saveProfiles ?? rawSaveProfiles;
  const loadProgress = ops?.loadProgress ?? defaultLoadProgress;
  const saveProgress = ops?.saveProgress ?? defaultSaveProgress;
  const loadDiagnosticResult = ops?.loadDiagnosticResult ?? defaultLoadDiagnosticResult;
  const saveDiagnosticResult = ops?.saveDiagnosticResult ?? defaultSaveDiagnosticResult;
  const loadStudyPlan = ops?.loadStudyPlan ?? defaultLoadStudyPlan;
  const saveStudyPlan = ops?.saveStudyPlan ?? defaultSaveStudyPlan;

  return {
    loadProfiles(): ProfilesState {
      return loadProfiles();
    },

    saveProfiles(state: ProfilesState): ProfileSaveResult {
      return saveProfiles(state);
    },

    loadProgress(studentId: string): PracticeProgress {
      const activeId = getActiveProfileId();
      if (activeId === null) {
        // No active profile yet — allow raw load to run so legacy migration
        // can create/recover the "Alumno local" profile.
        return loadProgress();
      }
      if (activeId !== studentId) {
        return EMPTY_PROGRESS;
      }
      return loadProgress();
    },

    saveProgress(
      studentId: string,
      progress: PracticeProgress
    ): PersistenceResult<void> {
      if (!isActiveStudent(studentId)) {
        return { ok: false, reason: "missing-active-profile" };
      }
      return saveProgress(progress);
    },

    loadDiagnosticResult(studentId: string): DiagnosticResult | null {
      if (!isActiveStudent(studentId)) {
        return null;
      }
      return loadDiagnosticResult();
    },

    saveDiagnosticResult(
      studentId: string,
      result: DiagnosticResult
    ): PersistenceResult<void> {
      if (!isActiveStudent(studentId)) {
        return { ok: false, reason: "missing-active-profile" };
      }
      return saveDiagnosticResult(result);
    },

    loadStudyPlan(studentId: string): StudyPlan | null {
      if (!isActiveStudent(studentId)) {
        return null;
      }
      return loadStudyPlan();
    },

    saveStudyPlan(
      studentId: string,
      plan: StudyPlan
    ): PersistenceResult<void> {
      if (!isActiveStudent(studentId)) {
        return { ok: false, reason: "missing-active-profile" };
      }
      return saveStudyPlan(plan);
    },
  };
}
