/**
 * Student profile storage — localStorage adapter.
 * Manages profiles under `pre-utn.profiles.v1`.
 * All functions swallow localStorage errors and return empty state rather than throwing.
 *
 * Wiring: public functions delegate through the configured persistence adapter
 * (via `getConfiguredAdapter()`). When no adapter is configured, they use raw
 * localStorage directly. Raw implementations are exported for injection into
 * the local adapter to avoid recursion.
 */

import {
  createProfile,
  selectActiveProfile,
  type StudentProfile,
  type ProfilesState,
  type CreateProfileInput,
} from "../domain/student-profile/index";
import {
  getConfiguredAdapter,
  getInitializationPromise,
  setPendingProfileSavePromise,
  clearPendingProfileSavePromise,
} from "./persistence/adapter-config";
import type { MaybePromise, ProfileSaveResult as PersistenceProfileSaveResult } from "./persistence/port";

/** Versioned localStorage key for all profiles. */
export const PROFILES_STORAGE_KEY = "pre-utn.profiles.v1";

export type ProfileSaveResult =
  | { ok: true; state: ProfilesState }
  | { ok: false; reason: "storage-unavailable" | "profile-not-found" };

// ---------------------------------------------------------------------------
// Raw localStorage implementations (for injection into local adapter)
// ---------------------------------------------------------------------------

/**
 * Raw loadProfiles — direct localStorage read, no adapter delegation.
 * Used by the local adapter to avoid recursion.
 */
export function rawLoadProfiles(): ProfilesState {
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
 * Raw saveProfiles — direct localStorage write, no adapter delegation.
 * Used by the local adapter to avoid recursion.
 */
export function rawSaveProfiles(state: ProfilesState): ProfileSaveResult {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(state));
    return { ok: true, state };
  } catch {
    return { ok: false, reason: "storage-unavailable" };
  }
}

// ---------------------------------------------------------------------------
// Public API (delegates through configured adapter or raw localStorage)
// ---------------------------------------------------------------------------

/**
 * Load all profiles and active student ID.
 * Delegates through the configured persistence adapter when available,
 * otherwise uses raw localStorage directly.
 * Returns empty state on missing key or corrupt JSON.
 * When a remote adapter is configured, may return a Promise<ProfilesState>.
 *
 * Initialization-aware: if `initializePersistence()` is pending, awaits it
 * before checking the adapter. This prevents the race where a caller reads
 * before the adapter is configured and gets stale local data.
 */
export function loadProfiles(): MaybePromise<ProfilesState> {
  const initPromise = getInitializationPromise();
  if (initPromise) {
    return initPromise.then(() => {
      const adapter = getConfiguredAdapter();
      if (adapter) {
        return adapter.loadProfiles();
      }
      return rawLoadProfiles();
    });
  }
  const adapter = getConfiguredAdapter();
  if (adapter) {
    return adapter.loadProfiles();
  }
  return rawLoadProfiles();
}

/**
 * Save profiles state.
 * Delegates through the configured persistence adapter when available,
 * otherwise uses raw localStorage directly.
 * When a remote adapter is configured, may return a Promise<ProfileSaveResult>.
 */
export function saveProfiles(state: ProfilesState): MaybePromise<ProfileSaveResult> {
  const adapter = getConfiguredAdapter();
  if (adapter) {
    return adapter.saveProfiles(state) as MaybePromise<ProfileSaveResult>;
  }
  return rawSaveProfiles(state);
}

/**
 * Get the active student ID without loading full profiles.
 * Validates that the active ID exists in the profiles array — if it's
 * dangling (corrupt, stale, or from a deleted profile), returns null
 * to fail closed.
 */
export function getActiveStudentId(): string | null {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProfilesState>;
    const activeId = parsed.activeStudentId ?? null;
    if (activeId === null) return null;
    // Validate the active ID exists in profiles — fail closed on dangling
    if (!Array.isArray(parsed.profiles)) return null;
    const exists = parsed.profiles.some(
      (p: StudentProfile) => p.studentId === activeId
    );
    return exists ? activeId : null;
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
  const state = rawLoadProfiles();
  const exists = state.profiles.some((p) => p.studentId === id);
  if (!exists) {
    return { ok: false, reason: "profile-not-found" };
  }
  const next: ProfilesState = { ...state, activeStudentId: id };
  return rawSaveProfiles(next);
}

/**
 * Create a new profile and activate it immediately.
 * Adds to existing profiles rather than replacing them.
 *
 * When a remote adapter is configured, also persists the profiles through
 * the adapter to avoid FK violations on subsequent remote progress saves.
 * Remote save failures are caught — local save is authoritative.
 */
export function createProfileAndActivate(
  input: CreateProfileInput
): ProfileSaveResult {
  try {
    const profile = createProfile(input);
    const state = rawLoadProfiles();
    const next: ProfilesState = {
      profiles: [...state.profiles, profile],
      activeStudentId: profile.studentId,
    };
    // Local save first (authoritative)
    const result = rawSaveProfiles(next);

    // If a remote adapter is configured, also persist profiles remotely
    // to satisfy FK constraints on student_progress_snapshots.
    // Track the promise so addAttempt() can wait for it before remote saveProgress.
    const adapter = getConfiguredAdapter();
    if (adapter) {
      const remoteResult = adapter.saveProfiles(next);
      if (remoteResult instanceof Promise) {
        // Track pending save for ordering boundary
        const trackedPromise = remoteResult
          .then(() => {})
          .catch(() => {})
          .finally(() => clearPendingProfileSavePromise(profile.studentId));
        setPendingProfileSavePromise(profile.studentId, trackedPromise);
      }
    }

    return result;
  } catch {
    // Validation error — should not happen since we validated above, but guard
    return { ok: false, reason: "profile-not-found" };
  }
}

/**
 * Check whether the profiles storage key exists in localStorage.
 * Read-only — never throws, never creates profiles.
 * Used by legacy migration to detect whether profiles.v1 was already persisted.
 */
export function hasProfilesStorage(): boolean {
  try {
    return localStorage.getItem(PROFILES_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Recover the active profile, or null if none exists or active id is dangling.
 */
export function recoverActiveProfile(): StudentProfile | null {
  const state = rawLoadProfiles();
  return selectActiveProfile(state);
}
