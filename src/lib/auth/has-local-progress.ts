/**
 * hasLocalProgress — predicate that tells whether the active local student
 * already has any persisted progress (practice attempts, diagnostic, or
 * study plan) under a given profile id.
 *
 * Used by:
 * - `/cuenta/ingresar` to pick the linking vs. new-account copy variant.
 * - The SIGNED_IN orchestrator (link-and-import) to decide whether to
 *   import the local progress to a fresh remote profile.
 *
 * Design (REQ-NEW-2a, REQ-NEW-2b):
 * - null/undefined profileId → false.
 * - profileId does not match the active profile → false. The raw loaders
 *   are bound to the active profile; asking about a non-active id cannot
 *   be answered truthfully from the raw localStorage map (it would either
 *   read the active slot — wrong student — or return empty). Fail closed.
 * - Otherwise OR-reduce the three raw loaders: any non-empty attempts[] OR
 *   a non-null diagnostic result OR a non-null study plan → true.
 *
 * Corrupt JSON / missing keys are already swallowed by the raw loaders,
 * which return `EMPTY_PROGRESS` and `null` respectively, so the predicate
 * never throws and never inspects localStorage directly.
 *
 * @module auth/has-local-progress
 */

import { loadProgressRaw } from "../practice-progress";
import { loadDiagnosticResultRaw, loadStudyPlanRaw } from "../diagnostic-storage";
import { getActiveProfileId } from "../active-session";

/**
 * Return `true` iff the given profile id has any locally-stored progress.
 *
 * Pure: reads local state only, never throws, never mutates.
 *
 * @param profileId - The id to check. When null/undefined or not matching
 *                    the active profile, returns false.
 */
export function hasLocalProgress(profileId: string | null): boolean {
  if (profileId === null || profileId === undefined) {
    return false;
  }

  // The raw loaders are bound to the active profile id. Asking about a
  // different id cannot return truthful local state for it, so fail closed.
  const activeId = getActiveProfileId();
  if (activeId !== profileId) {
    return false;
  }

  // OR-reduce the three raw loaders.
  const progress = loadProgressRaw();
  const hasAttempts = Array.isArray(progress.attempts) && progress.attempts.length > 0;
  const hasDiagnostic = loadDiagnosticResultRaw() !== null;
  const hasStudyPlan = loadStudyPlanRaw() !== null;

  return hasAttempts || hasDiagnostic || hasStudyPlan;
}
