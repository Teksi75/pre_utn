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
 * Returns blocked result if no active profile exists.
 */
export function saveDiagnosticResult(result: DiagnosticResult): PersistenceResult<void> {
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
 * Returns null when nothing is stored, no active profile, or stored data is corrupt.
 */
export function loadDiagnosticResult(): DiagnosticResult | null {
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
 * Returns blocked result if no active profile exists.
 */
export function saveStudyPlan(plan: StudyPlan): PersistenceResult<void> {
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
 * Returns null when nothing is stored, no active profile, or stored data is corrupt.
 */
export function loadStudyPlan(): StudyPlan | null {
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
