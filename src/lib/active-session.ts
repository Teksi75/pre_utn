/**
 * Active session — read-only boundary for the current local student identity.
 *
 * This module is the ONLY entry point (besides student-profile-storage itself)
 * that may read the profile storage key `pre-utn.profiles.v1` for identity
 * purposes. All other adapters MUST use `getActiveProfileId()` instead of
 * parsing the profile key directly.
 *
 * Contract: returns the current local `activeStudentId`, or `null` for
 * missing, corrupt, unavailable, or unreadable profile storage.
 * It never throws and never creates profiles.
 */

import { getActiveStudentId } from "./student-profile-storage";

/**
 * Get the active profile ID from local profile storage.
 *
 * @returns The current active studentId, or null if no active profile
 *          exists, storage is corrupt, or localStorage is unavailable.
 */
export function getActiveProfileId(): string | null {
  return getActiveStudentId();
}
