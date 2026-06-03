/**
 * Diagnostic storage — localStorage adapter for diagnostic results.
 * Domain only receives/returns DiagnosticResult; this module handles storage.
 *
 * Failures (quota, disabled storage, corrupt data) are swallowed so the
 * UI never crashes because persistence is broken.
 */

import type { DiagnosticResult } from "@/domain/diagnostic";

/** Versioned localStorage key to avoid collisions across experiments. */
export const DIAGNOSTIC_STORAGE_KEY = "pre-utn.diagnostic.v1";

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
