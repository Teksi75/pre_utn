/**
 * Diagnostic storage — localStorage adapter for diagnostic results and
 * the study plan derived from them.
 *
 * Storage shape (v2 — student-scoped):
 * { students: Record<studentId, DiagnosticResult | null>; activeStudentId: string | null }
 * { students: Record<studentId, StudyPlan | null>; activeStudentId: string | null }
 *
 * All functions gate on active profile: if no active profile exists, saves are
 * no-ops and return blocked result. Failures (quota, disabled storage, corrupt
 * data) are swallowed so the UI never crashes because persistence is broken.
 */

import type { DiagnosticResult, StudyPlan } from "@/domain/diagnostic";
import { getActiveProfileId } from "./active-session";
import { getConfiguredAdapter, getInitializationPromise } from "./persistence/adapter-config";
import type { MaybePromise, PersistenceResult as PortPersistenceResult } from "./persistence/port";

/** Versioned localStorage key to avoid collisions across experiments. */
export const DIAGNOSTIC_STORAGE_KEY = "pre-utn.diagnostic.v1";

/** Versioned localStorage key for the persisted study plan. */
export const STUDY_PLAN_STORAGE_KEY = "pre-utn.study-plan.v1";

export type PersistenceResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "missing-active-profile" };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiagnosticMap {
  readonly students: Record<string, DiagnosticResult | null>;
  readonly activeStudentId: string | null;
}

interface StudyPlanMap {
  readonly students: Record<string, StudyPlan | null>;
  readonly activeStudentId: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isDiagnosticMap(raw: unknown): raw is DiagnosticMap {
  if (!raw || typeof raw !== "object") return false;
  const obj = raw as Record<string, unknown>;
  return typeof obj.students === "object" && obj.students !== null;
}

function isStudyPlanMap(raw: unknown): raw is StudyPlanMap {
  if (!raw || typeof raw !== "object") return false;
  const obj = raw as Record<string, unknown>;
  return typeof obj.students === "object" && obj.students !== null;
}

function loadDiagnosticMap(): DiagnosticMap {
  try {
    const raw = localStorage.getItem(DIAGNOSTIC_STORAGE_KEY);
    if (!raw) return { students: {}, activeStudentId: null };
    const parsed = JSON.parse(raw);
    if (!isDiagnosticMap(parsed)) return { students: {}, activeStudentId: null };
    return parsed;
  } catch {
    return { students: {}, activeStudentId: null };
  }
}

function loadStudyPlanMap(): StudyPlanMap {
  try {
    const raw = localStorage.getItem(STUDY_PLAN_STORAGE_KEY);
    if (!raw) return { students: {}, activeStudentId: null };
    const parsed = JSON.parse(raw);
    if (!isStudyPlanMap(parsed)) return { students: {}, activeStudentId: null };
    return parsed;
  } catch {
    return { students: {}, activeStudentId: null };
  }
}

function persistDiagnosticMap(map: DiagnosticMap): void {
  try {
    localStorage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // fail silently
  }
}

function persistStudyPlanMap(map: StudyPlanMap): void {
  try {
    localStorage.setItem(STUDY_PLAN_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // fail silently
  }
}

// ---------------------------------------------------------------------------
// Diagnostic result
// ---------------------------------------------------------------------------

/**
 * Save a diagnostic result to localStorage under the active student.
 * Delegates through the configured persistence adapter when available.
 * Returns blocked result if no active profile exists.
 * When a remote adapter is configured, may return a Promise.
 */
export function saveDiagnosticResult(result: DiagnosticResult): MaybePromise<PersistenceResult<void>> {
  const adapter = getConfiguredAdapter();
  if (adapter) {
    const activeId = getActiveProfileId();
    if (activeId) {
      return adapter.saveDiagnosticResult(activeId, result) as MaybePromise<PersistenceResult<void>>;
    }
  }
  return saveDiagnosticResultRaw(result);
}

/**
 * Raw saveDiagnosticResult — direct localStorage, no adapter delegation.
 */
export function saveDiagnosticResultRaw(result: DiagnosticResult): PersistenceResult<void> {
  const activeId = getActiveProfileId();
  if (activeId === null) {
    return { ok: false, reason: "missing-active-profile" };
  }

  const map = loadDiagnosticMap();
  const next: DiagnosticMap = {
    students: { ...map.students, [activeId]: result },
    activeStudentId: activeId,
  };
  persistDiagnosticMap(next);
  return { ok: true, value: undefined };
}

/**
 * Load the diagnostic result for the active student.
 * Delegates through the configured persistence adapter when available.
 * Returns null when nothing is stored, no active profile, or stored data is corrupt.
 * When a remote adapter is configured, may return a Promise.
 *
 * Initialization-aware: if `initializePersistence()` is pending, awaits it
 * before checking the adapter. This prevents the race where a caller reads
 * before the adapter is configured and gets stale local data.
 */
export function loadDiagnosticResult(): MaybePromise<DiagnosticResult | null> {
  const initPromise = getInitializationPromise();
  if (initPromise) {
    return initPromise.then(() => {
      const adapter = getConfiguredAdapter();
      if (adapter) {
        const activeId = getActiveProfileId();
        if (activeId) {
          return adapter.loadDiagnosticResult(activeId);
        }
      }
      return loadDiagnosticResultRaw();
    });
  }
  const adapter = getConfiguredAdapter();
  if (adapter) {
    const activeId = getActiveProfileId();
    if (activeId) {
      return adapter.loadDiagnosticResult(activeId);
    }
  }
  return loadDiagnosticResultRaw();
}

/**
 * Raw loadDiagnosticResult — direct localStorage, no adapter delegation.
 */
export function loadDiagnosticResultRaw(): DiagnosticResult | null {
  const activeId = getActiveProfileId();
  if (activeId === null) return null;

  const map = loadDiagnosticMap();
  return map.students[activeId] ?? null;
}

// ---------------------------------------------------------------------------
// Study plan
// ---------------------------------------------------------------------------

/**
 * Save a study plan to localStorage under the active student.
 * Delegates through the configured persistence adapter when available.
 * Returns blocked result if no active profile exists.
 * When a remote adapter is configured, may return a Promise.
 */
export function saveStudyPlan(plan: StudyPlan): MaybePromise<PersistenceResult<void>> {
  const adapter = getConfiguredAdapter();
  if (adapter) {
    const activeId = getActiveProfileId();
    if (activeId) {
      return adapter.saveStudyPlan(activeId, plan) as MaybePromise<PersistenceResult<void>>;
    }
  }
  return saveStudyPlanRaw(plan);
}

/**
 * Raw saveStudyPlan — direct localStorage, no adapter delegation.
 */
export function saveStudyPlanRaw(plan: StudyPlan): PersistenceResult<void> {
  const activeId = getActiveProfileId();
  if (activeId === null) {
    return { ok: false, reason: "missing-active-profile" };
  }

  const map = loadStudyPlanMap();
  const next: StudyPlanMap = {
    students: { ...map.students, [activeId]: plan },
    activeStudentId: activeId,
  };
  persistStudyPlanMap(next);
  return { ok: true, value: undefined };
}

/**
 * Load the study plan for the active student.
 * Delegates through the configured persistence adapter when available.
 * Returns null when nothing is stored, no active profile, or stored data is corrupt.
 * When a remote adapter is configured, may return a Promise.
 *
 * Initialization-aware: if `initializePersistence()` is pending, awaits it
 * before checking the adapter. This prevents the race where a caller reads
 * before the adapter is configured and gets stale local data.
 */
export function loadStudyPlan(): MaybePromise<StudyPlan | null> {
  const initPromise = getInitializationPromise();
  if (initPromise) {
    return initPromise.then(() => {
      const adapter = getConfiguredAdapter();
      if (adapter) {
        const activeId = getActiveProfileId();
        if (activeId) {
          return adapter.loadStudyPlan(activeId);
        }
      }
      return loadStudyPlanRaw();
    });
  }
  const adapter = getConfiguredAdapter();
  if (adapter) {
    const activeId = getActiveProfileId();
    if (activeId) {
      return adapter.loadStudyPlan(activeId);
    }
  }
  return loadStudyPlanRaw();
}

/**
 * Raw loadStudyPlan — direct localStorage, no adapter delegation.
 */
export function loadStudyPlanRaw(): StudyPlan | null {
  const activeId = getActiveProfileId();
  if (activeId === null) return null;

  const map = loadStudyPlanMap();
  return map.students[activeId] ?? null;
}

// ---------------------------------------------------------------------------
// Clear helpers (still global — used for reset flows)
// ---------------------------------------------------------------------------

/**
 * Remove the stored diagnostic result for the active student from localStorage.
 * Fails silently if localStorage is unavailable.
 */
export function clearDiagnosticResult(): void {
  try {
    const activeId = getActiveProfileId();
    if (activeId === null) return;
    const map = loadDiagnosticMap();
    const { [activeId]: _removed, ...restStudents } = map.students;
    const next: DiagnosticMap = { students: restStudents, activeStudentId: activeId };
    persistDiagnosticMap(next);
  } catch {
    // fail silently
  }
}

/**
 * Remove the stored study plan for the active student from localStorage.
 * Fails silently if localStorage is unavailable.
 */
export function clearStudyPlan(): void {
  try {
    const activeId = getActiveProfileId();
    if (activeId === null) return;
    const map = loadStudyPlanMap();
    const { [activeId]: _removed, ...restStudents } = map.students;
    const next: StudyPlanMap = { students: restStudents, activeStudentId: activeId };
    persistStudyPlanMap(next);
  } catch {
    // fail silently
  }
}
