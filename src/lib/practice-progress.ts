/**
 * Practice progress — localStorage adapter for persistence outside domain.
 *
 * Storage shape (v2 — student-scoped):
 * {
 *   students: Record<studentId, PracticeProgress>;
 *   activeStudentId: string | null;
 * }
 *
 * Migration (lazy on adapter load):
 * If `pre-utn.practice.v1` exists in the OLD flat shape (no `students` field)
 * AND `pre-utn.profiles.v1` does not exist:
 *   1. Create "Alumno local" profile
 *   2. Re-key all legacy attempts under that studentId
 *   3. Set activeStudentId
 *   4. Persist new shape + profiles.v1
 * Migration is idempotent — re-running sees existing profiles.v1 and does nothing.
 */

import type { PracticeProgress, PracticeAttempt } from "../domain/progress/index";
import { computeAccuracy, computeTrend } from "../domain/progress/index";
import { createProfile } from "../domain/student-profile/index";
import type { DiagnosticResult, StudyPlan } from "../domain/diagnostic";
import { getActiveProfileId } from "./active-session";
import { hasProfilesStorage } from "./student-profile-storage";

/** Versioned localStorage key to avoid collisions across experiments. */
export const PRACTICE_STORAGE_KEY = "pre-utn.practice.v1";

/** Legacy key — used to detect pre-migration state. */
const LEGACY_PRACTICE_STORAGE_KEY = "pre-utn.practice.v1";

export type PersistenceResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "missing-active-profile" };

/** Empty initial state with all new fields defaulted. */
export const EMPTY_PROGRESS: PracticeProgress = {
  attempts: [],
  accuracyBySkill: {},
  trendBySkill: {},
  lastPracticedBySkill: {},
  diagnosticResult: null,
  studyPlan: null,
};

// ---------------------------------------------------------------------------
// Legacy types (for migration detection)
// ---------------------------------------------------------------------------

/** The flat shape saved by practice-progress before student scoping. */
interface LegacyPracticeProgress {
  readonly attempts: readonly PracticeAttempt[];
  readonly accuracyBySkill: Record<string, number>;
  readonly trendBySkill: Record<string, "improving" | "stable" | "needs-review">;
  readonly lastPracticedBySkill: Record<string, string>;
  readonly diagnosticResult: DiagnosticResult | null;
  readonly studyPlan: StudyPlan | null;
}

/** The v2 central-map shape. */
interface PracticeProgressMap {
  readonly students: Record<string, PracticeProgress>;
  readonly activeStudentId: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isLegacyShape(raw: unknown): raw is LegacyPracticeProgress {
  if (!raw || typeof raw !== "object") return false;
  const obj = raw as Record<string, unknown>;
  // If it has a `students` key, it's the new shape (not legacy)
  if ("students" in obj) return false;
  // Legacy shape has `attempts` as an array
  return Array.isArray(obj.attempts);
}

function isProgressMap(raw: unknown): raw is PracticeProgressMap {
  if (!raw || typeof raw !== "object") return false;
  const obj = raw as Record<string, unknown>;
  return typeof obj.students === "object" && obj.students !== null;
}

function parseProgress(raw: unknown): PracticeProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.attempts)) return null;
  return raw as PracticeProgress;
}

// ---------------------------------------------------------------------------
// Legacy migration (lazy — runs once on first adapter load)
// ---------------------------------------------------------------------------

/**
 * Run legacy migration if needed.
 * Called internally by loadProgress.
 * Detects old flat shape → creates Alumno local → re-keys attempts.
 * Idempotent: skips if profiles.v1 already exists.
 */
function runLegacyMigration(): void {
  try {
    // Check if profiles already exist (migration already done)
    if (hasProfilesStorage()) {
      // Already migrated — profiles.v1 exists
      // But we still need to migrate the practice data if it's still in legacy shape
      const practiceRaw = localStorage.getItem(PRACTICE_STORAGE_KEY);
      if (!practiceRaw) return;
      const parsed = JSON.parse(practiceRaw);
      if (isProgressMap(parsed)) return; // already new shape
      // Falls through: profiles.v1 exists but practice is still legacy — migrate
    }

    // Check for legacy practice data
    const practiceRaw = localStorage.getItem(LEGACY_PRACTICE_STORAGE_KEY);
    if (!practiceRaw) return;

    const legacyData = JSON.parse(practiceRaw);
    if (!isLegacyShape(legacyData)) return; // already migrated or invalid

    // Create Alumno local profile
    const profile = createProfile({ displayName: "Alumno local" });
    const studentId = profile.studentId;

    // Build new map shape with migrated attempts
    // Normalize legacy attempts (missing timeMs → 0, missing attemptIndex → 1)
    const migratedAttempts: PracticeAttempt[] = (
      legacyData.attempts as unknown as Array<Record<string, unknown>>
    ).map((a) => ({
      ...a,
      studentId,
      timeMs: typeof a.timeMs === "number" ? a.timeMs : 0,
      attemptIndex:
        typeof a.attemptIndex === "number" && (a.attemptIndex as number) > 0
          ? (a.attemptIndex as number)
          : 1,
    })) as PracticeAttempt[];

    const migratedProgress: PracticeProgress = {
      attempts: migratedAttempts,
      accuracyBySkill: legacyData.accuracyBySkill ?? {},
      trendBySkill: legacyData.trendBySkill ?? {},
      lastPracticedBySkill: legacyData.lastPracticedBySkill ?? {},
      diagnosticResult: legacyData.diagnosticResult ?? null,
      studyPlan: legacyData.studyPlan ?? null,
    };

    // Persist new practice map shape
    const newMap: PracticeProgressMap = {
      students: { [studentId]: migratedProgress },
      activeStudentId: studentId,
    };
    localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(newMap));

    // Persist profiles.v1 so migration is not re-run
    const profilesState = {
      profiles: [profile],
      activeStudentId: studentId,
    };
    localStorage.setItem("pre-utn.profiles.v1", JSON.stringify(profilesState));
  } catch {
    // Migration errors are swallowed — the old data is still there
  }
}

// ---------------------------------------------------------------------------
// Public adapter API
// ---------------------------------------------------------------------------

/**
 * Load practice progress for the active student.
 * Returns empty progress if nothing stored, active id is dangling, or data is invalid.
 * Runs lazy migration on first load.
 */
export function loadProgress(): PracticeProgress {
  runLegacyMigration();

  try {
    const raw = localStorage.getItem(PRACTICE_STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;

    const parsed = JSON.parse(raw);

    // If still legacy flat shape (migration didn't run), migrate now
    if (isLegacyShape(parsed)) {
      runLegacyMigration();
      const reRead = localStorage.getItem(PRACTICE_STORAGE_KEY);
      if (!reRead) return EMPTY_PROGRESS;
      const reParsed = JSON.parse(reRead);
      if (!isProgressMap(reParsed)) return EMPTY_PROGRESS;
      return extractActiveProgress(reParsed);
    }

    if (!isProgressMap(parsed)) return EMPTY_PROGRESS;

    return extractActiveProgress(parsed);
  } catch {
    return EMPTY_PROGRESS;
  }
}

function extractActiveProgress(map: PracticeProgressMap): PracticeProgress {
  if (map.activeStudentId === null) return EMPTY_PROGRESS;
  return map.students[map.activeStudentId] ?? EMPTY_PROGRESS;
}

/**
 * Add a single attempt to the active student's progress and persist.
 * Returns blocked result if no active profile exists.
 * Recomputes accuracy and trend for the affected skill.
 */
export function addAttempt(attempt: PracticeAttempt): PersistenceResult<PracticeProgress> {
  // Load first — this triggers lazy migration if needed, creating active profile
  const current = loadProgress();
  const activeId = getActiveProfileId();
  if (activeId === null) {
    return { ok: false, reason: "missing-active-profile" };
  }

  const attemptWithStudent: PracticeAttempt = {
    ...attempt,
    studentId: activeId,
  };
  const updatedAttempts = [...current.attempts, attemptWithStudent];

  const accuracyBySkill: Record<string, number> = {
    ...current.accuracyBySkill,
  };
  const trendBySkill: Record<string, "improving" | "stable" | "needs-review"> = {
    ...current.trendBySkill,
  };
  const lastPracticedBySkill: Record<string, string> = {
    ...current.lastPracticedBySkill,
  };

  accuracyBySkill[attemptWithStudent.skillId] = computeAccuracy(
    updatedAttempts,
    attemptWithStudent.skillId
  );
  trendBySkill[attemptWithStudent.skillId] = computeTrend(
    updatedAttempts,
    attemptWithStudent.skillId
  );
  lastPracticedBySkill[attemptWithStudent.skillId] = attemptWithStudent.answeredAt;

  const updated: PracticeProgress = {
    attempts: updatedAttempts,
    accuracyBySkill,
    trendBySkill,
    lastPracticedBySkill,
    diagnosticResult: current.diagnosticResult,
    studyPlan: current.studyPlan,
  };

  persistActiveProgress(updated, activeId);
  return { ok: true, value: updated };
}

function persistActiveProgress(progress: PracticeProgress, activeId: string): void {
  try {
    const raw = localStorage.getItem(PRACTICE_STORAGE_KEY);
    let map: PracticeProgressMap = { students: {}, activeStudentId: null };

    if (raw) {
      const parsed = JSON.parse(raw);
      if (isProgressMap(parsed)) {
        map = parsed;
      }
    }

    map = {
      students: { ...map.students, [activeId]: progress },
      activeStudentId: activeId,
    };

    localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // storage error — fail silently
  }
}

/**
 * Save practice progress (full replacement for active student).
 * Used by the UI when loading a student's progress slice.
 * Triggers lazy migration if no active profile exists but legacy data is present.
 */
export function saveProgress(progress: PracticeProgress): PersistenceResult<void> {
  // Ensure migration runs and an active profile exists (may create Alumno local)
  loadProgress();
  const activeId = getActiveProfileId();
  if (activeId === null) {
    return { ok: false, reason: "missing-active-profile" };
  }
  persistActiveProgress(progress, activeId);
  return { ok: true, value: undefined };
}

/**
 * Remove practice progress from localStorage.
 */
export function resetProgress(): void {
  localStorage.removeItem(PRACTICE_STORAGE_KEY);
}
