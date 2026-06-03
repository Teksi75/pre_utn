/**
 * Diagnostic storage — localStorage adapter for diagnostic results and
 * the study plan derived from them.
 *
 * Domain only receives/returns DiagnosticResult / StudyPlan; this module
 * handles persistence. Failures (quota, disabled storage, corrupt data)
 * are swallowed so the UI never crashes because persistence is broken.
 */

import type { DiagnosticResult, StudyPlan } from "@/domain/diagnostic";

/** Versioned localStorage key to avoid collisions across experiments. */
export const DIAGNOSTIC_STORAGE_KEY = "pre-utn.diagnostic.v1";

/** Versioned localStorage key for the persisted study plan. */
export const STUDY_PLAN_STORAGE_KEY = "pre-utn.study-plan.v1";

/**
 * Save a diagnostic result to localStorage.
 * Fails silently if localStorage is unavailable or full.
 */
export function saveDiagnosticResult(result: DiagnosticResult): void {
  try {
    localStorage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(result));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

/**
 * Load a diagnostic result from localStorage.
 * Returns null when nothing is stored or the stored data is corrupt.
 */
export function loadDiagnosticResult(): DiagnosticResult | null {
  try {
    const raw = localStorage.getItem(DIAGNOSTIC_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<DiagnosticResult> | null;

    // Validate basic shape: must be a non-null object with array fields
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.estimates)) return null;
    if (!Array.isArray(parsed.suggestions)) return null;

    return parsed as DiagnosticResult;
  } catch {
    return null;
  }
}

/**
 * Remove the stored diagnostic result from localStorage.
 * Fails silently if localStorage is unavailable.
 */
export function clearDiagnosticResult(): void {
  try {
    localStorage.removeItem(DIAGNOSTIC_STORAGE_KEY);
  } catch {
    // fail silently
  }
}

/**
 * Save a study plan to localStorage.
 * Fails silently if localStorage is unavailable or full.
 */
export function saveStudyPlan(plan: StudyPlan): void {
  try {
    localStorage.setItem(STUDY_PLAN_STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // fail silently
  }
}

/**
 * Load a study plan from localStorage.
 * Returns null when nothing is stored or the stored data is corrupt.
 */
export function loadStudyPlan(): StudyPlan | null {
  try {
    const raw = localStorage.getItem(STUDY_PLAN_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StudyPlan> | null;

    // Validate basic shape: must be a non-null object with an array of
    // priorities and an embedded diagnostic result.
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.skillPriorities)) return null;
    if (!parsed.diagnosticResult || typeof parsed.diagnosticResult !== "object") {
      return null;
    }

    return parsed as StudyPlan;
  } catch {
    return null;
  }
}

/**
 * Remove the stored study plan from localStorage.
 * Fails silently if localStorage is unavailable. Does NOT touch the
 * stored diagnostic — the two are independent.
 */
export function clearStudyPlan(): void {
  try {
    localStorage.removeItem(STUDY_PLAN_STORAGE_KEY);
  } catch {
    // fail silently
  }
}
