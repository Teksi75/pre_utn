/**
 * Student profile storage — localStorage adapter.
 * Manages profiles under `pre-utn.profiles.v1`.
 * All functions swallow localStorage errors and return empty state rather than throwing.
 */

import {
  createProfile,
  selectActiveProfile,
  type StudentProfile,
  type ProfilesState,
  type CreateProfileInput,
} from "../domain/student-profile/index";

/** Versioned localStorage key for all profiles. */
export const PROFILES_STORAGE_KEY = "pre-utn.profiles.v1";

export type ProfileSaveResult =
  | { ok: true; state: ProfilesState }
  | { ok: false; reason: "storage-unavailable" | "profile-not-found" };

/**
 * Load all profiles and active student ID from localStorage.
 * Returns empty state on missing key or corrupt JSON.
 */
export function loadProfiles(): ProfilesState {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) {
      return { profiles: [], activeStudentId: null };
    }
    const parsed = JSON.parse(raw) as Partial<ProfilesState>;
    if (!Array.isArray(parsed.profiles)) {
      return { profiles: [], activeStudentId: null };
    }
    return {
      profiles: parsed.profiles as StudentProfile[],
      activeStudentId: parsed.activeStudentId ?? null,
    };
  } catch {
    return { profiles: [], activeStudentId: null };
  }
}

/**
 * Save profiles state to localStorage.
 */
export function saveProfiles(state: ProfilesState): ProfileSaveResult {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(state));
    return { ok: true, state };
  } catch {
    return { ok: false, reason: "storage-unavailable" };
  }
}

/**
 * Get the active student ID without loading full profiles.
 */
export function getActiveStudentId(): string | null {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProfilesState>;
    return parsed.activeStudentId ?? null;
  } catch {
    return null;
  }
}

/**
 * Set the active student ID.
 * Returns `{ ok: false, reason: "profile-not-found" }` when the ID does not
 * match any existing profile; never throws across the storage boundary.
 */
export function setActiveStudentId(id: string): ProfileSaveResult {
  const state = loadProfiles();
  const exists = state.profiles.some((p) => p.studentId === id);
  if (!exists) {
    return { ok: false, reason: "profile-not-found" };
  }
  const next: ProfilesState = { ...state, activeStudentId: id };
  return saveProfiles(next);
}

/**
 * Create a new profile and activate it immediately.
 * Adds to existing profiles rather than replacing them.
 */
export function createProfileAndActivate(
  input: CreateProfileInput
): ProfileSaveResult {
  try {
    const profile = createProfile(input);
    const state = loadProfiles();
    const next: ProfilesState = {
      profiles: [...state.profiles, profile],
      activeStudentId: profile.studentId,
    };
    return saveProfiles(next);
  } catch {
    // Validation error — should not happen since we validated above, but guard
    return { ok: false, reason: "profile-not-found" };
  }
}

/**
 * Recover the active profile, or null if none exists or active id is dangling.
 */
export function recoverActiveProfile(): StudentProfile | null {
  const state = loadProfiles();
  return selectActiveProfile(state);
}
