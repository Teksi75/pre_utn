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
import { getConfiguredAdapter, getInitializationPromise, getPendingProfileSavePromise } from "./persistence/adapter-config";
import type { MaybePromise } from "./persistence/port";

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

/**
 * The v2 central-map shape.
 *
 * `students` and `activeStudentId` are exposed as mutable here so the
 * repair logic in `extractActiveProgress` can produce a new map with a
 * corrected pointer (the previous version silently corrupted the active
 * profile's slot when the practice pointer was stale). The exported
 * consumer API still treats these as immutable — only this internal
 * representation allows the in-place repair.
 */
interface PracticeProgressMap {
  students: Record<string, PracticeProgress>;
  activeStudentId: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Exported for S0d fixture tests: `u3-s0d-fixtures.test.ts` parses the
// frozen `pre-utn.practice.v1` baseline through the real production
// deserializer (the SAME function `loadProgressRaw` calls internally).
// Keeping it as a named export prevents tests from re-implementing the
// shape contract and drifting if the loader's parser ever changes.
export function isLegacyShape(raw: unknown): raw is LegacyPracticeProgress {
  if (!raw || typeof raw !== "object") return false;
  const obj = raw as Record<string, unknown>;
  // If it has a `students` key, it's the new shape (not legacy)
  if ("students" in obj) return false;
  // Legacy shape has `attempts` as an array
  return Array.isArray(obj.attempts);
}

/**
 * Validate that a parsed JSON object conforms to the v2 envelope shape
 * `{ students: Record<string, PracticeProgress>; activeStudentId: string | null }`.
 *
 * The fix enforces the full envelope:
 *   1. `students` is a non-null, non-array object,
 *   2. `activeStudentId` is either `string`, `null`, or absent (any other
 *      type — number, object, array, boolean — means the envelope is
 *      corrupt and must fail closed; a wrong-typed pointer would
 *      silently look like "no active profile" downstream),
 *   3. EVERY student slot passes a nested shape validation (attempts is
 *      an array, the typed records are objects with the right value
 *      types, diagnosticResult/studyPlan are null-or-object). We do NOT
 *      call `parseProgress` directly here because parseProgress's
 *      per-attempt strictness would reject storage shapes that were
 *      written before the WU5 attempt validation existed (legacy data
 *      without `timeMs` / `attemptIndex`). The outer-shape guard
 *      catches the catastrophic malformations (e.g. `attempts: "nope"`,
 *      `accuracyBySkill: "nope"`) without false-rejecting legacy slots.
 *
 * The legacy version only checked `students` was an object, which let
 * a corrupt envelope (e.g. `activeStudentId: 42`, `students: { s: "x" }`)
 * slip through and reach `extractActiveProgress`, which then returned a
 * malformed slice as if it were a valid `PracticeProgress`.
 */
function isProgressMap(raw: unknown): raw is PracticeProgressMap {
  if (!raw || typeof raw !== "object") return false;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.students !== "object" || obj.students === null || Array.isArray(obj.students)) {
    return false;
  }
  // activeStudentId MUST be string|null|undefined. Anything else (number,
  // object, array, boolean) means the envelope is corrupt — fail closed.
  const rawActive = obj.activeStudentId;
  if (
    rawActive !== null &&
    rawActive !== undefined &&
    typeof rawActive !== "string"
  ) {
    return false;
  }
  // Per-slot shape validation: every student slot MUST have the outer
  // PracticeProgress shape. A slot whose attempts is a string, whose
  // records are arrays, or whose diagnosticResult/studyPlan is a
  // primitive is silently dropped. Legacy slots whose attempts lack
  // `timeMs` / `attemptIndex` are NOT rejected — they pass the outer
  // shape check and reach extractActiveProgress as-is.
  const studentsRecord = obj.students as Record<string, unknown>;
  const validatedStudents: Record<string, PracticeProgress> = {};
  for (const [key, value] of Object.entries(studentsRecord)) {
    if (isValidSlotShape(value)) {
      validatedStudents[key] = value as PracticeProgress;
    }
  }
  if (Object.keys(validatedStudents).length === 0) return false;
  // Replace the raw students map with the validated subset. The
  // activeStudentId value is normalized to `string | null`.
  obj.students = validatedStudents;
  obj.activeStudentId = typeof rawActive === "string" ? rawActive : null;
  return true;
}

/**
 * Outer-shape validator for a PracticeProgress slot.
 *
 * Validates the SIX documented fields of PracticeProgress at the type
 * level only (no per-attempt check, no per-record value check). This is
 * deliberately looser than `parseProgress` so legacy slots (pre-WU5)
 * with attempts that lack `timeMs` / `attemptIndex` survive the
 * envelope-level guard. Per-attempt validation lives in
 * `runLegacyMigration`, which normalizes defaults before persisting.
 */
function isValidSlotShape(raw: unknown): raw is PracticeProgress {
  if (!raw || typeof raw !== "object") return false;
  const slot = raw as Record<string, unknown>;
  if (!Array.isArray(slot.attempts)) return false;
  if (!isObjectRecord(slot.accuracyBySkill)) return false;
  if (!isObjectRecord(slot.trendBySkill)) return false;
  if (!isObjectRecord(slot.lastPracticedBySkill)) return false;
  if (
    slot.diagnosticResult !== null &&
    (typeof slot.diagnosticResult !== "object" || Array.isArray(slot.diagnosticResult))
  ) {
    return false;
  }
  if (
    slot.studyPlan !== null &&
    (typeof slot.studyPlan !== "object" || Array.isArray(slot.studyPlan))
  ) {
    return false;
  }
  return true;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Exported for S0d fixture tests: see `isLegacyShape` rationale above.
// Validates the inner per-student `PracticeProgress` shape — the same
// branch `loadProgressRaw` reaches via `parseAdvancedProgress` for
// advanced practice. Frozen fixtures round-trip through this function.
//
// Validates the COMPLETE PracticeProgress structure AND every attempt
// entry before casting. The previous version only checked that
// `attempts` was an array and cast the rest through `unknown`, which
// let malformed records (missing required fields, wrong types, bad
// attempt entries) silently leak into callers as `PracticeProgress`.
// Anything that does not fully match the documented shape is rejected
// so callers receive a typed value they can actually trust.
const VALID_TRENDS = new Set(["improving", "stable", "needs-review"]);

function isValidAttempt(raw: unknown): raw is PracticeAttempt {
  if (!raw || typeof raw !== "object") return false;
  const a = raw as Record<string, unknown>;
  if (typeof a.exerciseId !== "string" || a.exerciseId.length === 0) return false;
  if (typeof a.skillId !== "string" || a.skillId.length === 0) return false;
  if (typeof a.correct !== "boolean") return false;
  if (typeof a.answeredAt !== "string" || a.answeredAt.length === 0) return false;
  if (typeof a.timeMs !== "number" || !Number.isFinite(a.timeMs)) return false;
  if (typeof a.attemptIndex !== "number" || !Number.isInteger(a.attemptIndex) || a.attemptIndex < 1) return false;
  // Optional fields, when present, must have the documented type.
  if (a.errorTag !== undefined && typeof a.errorTag !== "string") return false;
  if (a.studentId !== undefined && typeof a.studentId !== "string") return false;
  if (
    a.difficulty !== undefined &&
    (typeof a.difficulty !== "number" ||
      !Number.isInteger(a.difficulty) ||
      a.difficulty < 1 ||
      a.difficulty > 5)
  ) {
    return false;
  }
  return true;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (typeof v !== "string") return false;
  }
  return true;
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (typeof v !== "number" || !Number.isFinite(v)) return false;
  }
  return true;
}

function isTrendRecord(
  value: unknown,
): value is Record<string, "improving" | "stable" | "needs-review"> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (typeof v !== "string" || !VALID_TRENDS.has(v)) return false;
  }
  return true;
}

export function parseProgress(raw: unknown): PracticeProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  // attempts: required, array of well-formed PracticeAttempt entries.
  if (!Array.isArray(obj.attempts)) return null;
  for (const a of obj.attempts) {
    if (!isValidAttempt(a)) return null;
  }

  // accuracyBySkill: required, record of finite numbers.
  if (!isNumberRecord(obj.accuracyBySkill)) return null;

  // trendBySkill: required, record of valid trend literals.
  if (!isTrendRecord(obj.trendBySkill)) return null;

  // lastPracticedBySkill: required, record of strings (ISO timestamps).
  if (!isStringRecord(obj.lastPracticedBySkill)) return null;

  // diagnosticResult: required to be either null or a plain object.
  // We do not validate the diagnostic shape here — that lives in the
  // diagnostic domain — but the field MUST be present and either null
  // or an object. Anything else indicates a malformed record.
  if (
    obj.diagnosticResult !== null &&
    (typeof obj.diagnosticResult !== "object" || Array.isArray(obj.diagnosticResult))
  ) {
    return null;
  }

  // studyPlan: same contract as diagnosticResult.
  if (
    obj.studyPlan !== null &&
    (typeof obj.studyPlan !== "object" || Array.isArray(obj.studyPlan))
  ) {
    return null;
  }

  // All six required fields are well-formed — safe to assert the type.
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

    // Build new map shape with migrated attempts.
    // Legacy attempts (pre-WU5) lack the required `timeMs` and
    // `attemptIndex` fields; we normalize those defaults first and
    // then re-validate every entry through `isValidAttempt` so the
    // persisted slot is provably well-formed. A legacy entry that
    // still fails validation AFTER defaults are applied (e.g. missing
    // `correct` or `answeredAt`) is dropped rather than coerced through
    // an `unknown` cast — the previous `as PracticeAttempt[]` cast
    // would smuggle a malformed record past the type system.
    const rawAttempts = Array.isArray(legacyData.attempts)
      ? legacyData.attempts
      : [];
    const migratedAttempts: PracticeAttempt[] = [];
    for (const a of rawAttempts) {
      if (!a || typeof a !== "object") continue;
      const rec = a as Record<string, unknown>;
      const candidate = {
        ...rec,
        studentId,
        timeMs: typeof rec["timeMs"] === "number" && Number.isFinite(rec["timeMs"] as number)
          ? (rec["timeMs"] as number)
          : 0,
        attemptIndex:
          typeof rec["attemptIndex"] === "number" && (rec["attemptIndex"] as number) > 0
            ? (rec["attemptIndex"] as number)
            : 1,
      };
      if (isValidAttempt(candidate)) {
        migratedAttempts.push(candidate);
      }
    }

    const migratedProgress: PracticeProgress = {
      attempts: migratedAttempts,
      accuracyBySkill: legacyData.accuracyBySkill ?? {},
      trendBySkill: legacyData.trendBySkill ?? {},
      lastPracticedBySkill: legacyData.lastPracticedBySkill ?? {},
      diagnosticResult: legacyData.diagnosticResult ?? null,
      studyPlan: legacyData.studyPlan ?? null,
    };

    // Sanity check: the migrated slot MUST round-trip through parseProgress.
    // If it doesn't, something corrupted the input — fail the migration
    // silently (the existing legacy data stays in storage) rather than
    // persisting a slot that downstream callers will reject.
    if (parseProgress(migratedProgress) === null) {
      return;
    }

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
 * Delegates through the configured persistence adapter when available,
 * otherwise uses raw localStorage directly.
 * Returns empty progress if nothing stored, active id is dangling, or data is invalid.
 * Runs lazy migration on first load (raw path only).
 * When a remote adapter is configured, may return a Promise<PracticeProgress>.
 *
 * Initialization-aware: if `initializePersistence()` is pending, awaits it
 * before checking the adapter. This prevents the race where a caller reads
 * before the adapter is configured and gets stale local data.
 */
export function loadProgress(): MaybePromise<PracticeProgress> {
  const initPromise = getInitializationPromise();
  if (initPromise) {
    // Initialization pending — wait for it, then delegate
    return initPromise.then(() => {
      const adapter = getConfiguredAdapter();
      if (adapter) {
        const activeId = getActiveProfileId();
        if (activeId) {
          return adapter.loadProgress(activeId);
        }
      }
      return loadProgressRaw();
    });
  }
  const adapter = getConfiguredAdapter();
  if (adapter) {
    const activeId = getActiveProfileId();
    if (activeId) {
      return adapter.loadProgress(activeId);
    }
  }
  return loadProgressRaw();
}

/**
 * Raw loadProgress — direct localStorage, no adapter delegation.
 * Used by the local adapter to avoid recursion.
 */
export function loadProgressRaw(): PracticeProgress {
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
  const activeProfileId = getActiveProfileId();

  // No active profile → fail closed with empty.
  if (activeProfileId === null) return EMPTY_PROGRESS;

  // Repair: when the practice pointer is stale (i.e. points to a profile
  // that is NOT the currently-active one), re-point map.activeStudentId at
  // the actual active profile so subsequent reads resolve to the right
  // slice. CRITICAL: this repair MUST NEVER delete `map.students[old]`.
  // The contract is: PRESERVE ALL PROFILES — only the pointer moves.
  //
  // Rationale: the practice pointer is a separate concern from the profile
  // system. The profile list is the source of truth for "who has data";
  // dropping a slot here would silently wipe a student's history when only
  // the pointer was out of sync (e.g. after a profile switch that did not
  // touch the practice map). Even if the slot at the old pointer is
  // untrusted / polluted / cross-contaminated, the safe move is to leave it
  // alone here and let an explicit user-driven reset clear it. The pointer
  // fix is sufficient to unblock the active profile's reads.
  //
  // A pointer that doesn't match any student in the map (null or unknown)
  // is just an orphan pointer and does NOT need the pointer-fix branch —
  // there is nothing stale to point at, just an empty target. We only fix
  // when the old pointer is real AND different from the active profile.
  if (
    map.activeStudentId !== null &&
    map.activeStudentId !== activeProfileId
  ) {
    const repaired: PracticeProgressMap = {
      ...map,
      students: map.students, // preserve all profile slots — never delete
      activeStudentId: activeProfileId,
    };
    try {
      localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(repaired));
    } catch {
      // Persist failure is non-fatal — we still return the active profile's
      // slice for this call.
    }
    return map.students[activeProfileId] ?? EMPTY_PROGRESS;
  }

  // Read the active student's slot. Falls back to EMPTY_PROGRESS when the
  // active student has no slot yet (first read after a switch).
  return map.students[activeProfileId] ?? EMPTY_PROGRESS;
}

/**
 * Add a single attempt to the active student's progress and persist.
 * Returns blocked result if no active profile exists.
 * Recomputes accuracy and trend for the affected skill.
 *
 * Always saves locally (sync) first, then fires adapter save
 * asynchronously if a remote adapter is configured. The adapter
 * save is not discarded — it runs as a background operation.
 */
export function addAttempt(attempt: PracticeAttempt): PersistenceResult<PracticeProgress> {
  // Load first — this triggers lazy migration if needed, creating active profile
  const current = loadProgressRaw();
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

  // Always save locally (sync) — ensures the student sees immediate results
  persistActiveProgress(updated, activeId);

  // If a remote adapter is configured, fire save asynchronously.
  // This ensures the adapter result is NOT discarded — the remote
  // write actually executes (as a background operation).
  //
  // Ordering boundary: wait for any pending remote profile save for this
  // student before saving progress. This prevents FK violations on
  // student_progress_snapshots when createProfileAndActivate() is called
  // immediately before addAttempt().
  const adapter = getConfiguredAdapter();
  if (adapter) {
    const pendingProfileSave = getPendingProfileSavePromise(activeId);
    const saveProgress = () => {
      const result = adapter.saveProgress(activeId, updated);
      if (result instanceof Promise) {
        // Fire-and-forget: local save already happened, prevent unhandled rejection
        result.catch(() => {});
      }
    };

    if (pendingProfileSave) {
      // Wait for profile save to complete before saving progress
      pendingProfileSave.then(saveProgress).catch(() => {});
    } else {
      saveProgress();
    }
  }

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
 * Delegates through the configured persistence adapter when available,
 * otherwise uses raw localStorage directly.
 * Triggers lazy migration if no active profile exists but legacy data is present.
 * When a remote adapter is configured, may return a Promise<PersistenceResult<void>>.
 */
export function saveProgress(progress: PracticeProgress): MaybePromise<PersistenceResult<void>> {
  const adapter = getConfiguredAdapter();
  if (adapter) {
    const activeId = getActiveProfileId();
    if (activeId) {
      return adapter.saveProgress(activeId, progress);
    }
  }
  return saveProgressRaw(progress);
}

/**
 * Raw saveProgress — direct localStorage, no adapter delegation.
 * Used by the local adapter to avoid recursion.
 */
export function saveProgressRaw(progress: PracticeProgress): PersistenceResult<void> {
  // Ensure migration runs and an active profile exists (may create Alumno local)
  loadProgressRaw();
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
