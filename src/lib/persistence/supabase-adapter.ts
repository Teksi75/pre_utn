/**
 * Supabase persistence adapter — implements PersistenceAdapter backed by
 * Supabase tables with RLS.
 *
 * This adapter scopes all reads/writes to the authenticated user (via
 * auth.uid() in RLS) AND the active studentId. If either check fails,
 * operations return recoverable results instead of throwing.
 *
 * Design: "Store profile rows plus one progress snapshot row per active
 * student." + "Require an existing Supabase Auth session before selecting
 * remote."
 *
 * Error handling:
 * - PGRST116 (not found) → returns empty/null (recoverable)
 * - Network errors → returns ok:false (caller falls back via withLocalFallback)
 * - No auth session → returns ok:false (fail-closed)
 * - studentId mismatch → returns ok:false (fail-closed)
 *
 * @module persistence/supabase-adapter
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PersistenceAdapter,
  ProfileSaveResult,
  PersistenceResult,
  ProfilesState,
  StudentProfile,
  PracticeProgress,
  DiagnosticResult,
  StudyPlan,
} from "./port";
import { getActiveProfileId } from "../active-session";
import { createRemoteUnavailableSentinel } from "./selector";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if an error is a PostgREST "not found" (PGRST116). */
function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "PGRST116"
  );
}

/** Empty progress default for recoverable not-found. */
const EMPTY_PROGRESS: PracticeProgress = {
  attempts: [],
  accuracyBySkill: {},
  trendBySkill: {},
  lastPracticedBySkill: {},
  diagnosticResult: null,
  studyPlan: null,
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a Supabase-backed PersistenceAdapter.
 *
 * @param client - Supabase browser client (created via createBrowserClient).
 *                 Must be authenticated (auth.uid() available) for remote
 *                 operations to succeed.
 *
 * Student-scoped methods enforce two layers of isolation:
 * 1. Local: studentId must match getActiveProfileId() (fail-closed)
 * 2. Remote: RLS policies scope queries to auth.uid() = user_id
 */
export function createSupabaseAdapter(
  client: SupabaseClient
): PersistenceAdapter {
  /**
   * Get the authenticated user ID from the session.
   * Returns null if no session exists (fail-closed).
   */
  async function getAuthUserId(): Promise<string | null> {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) return null;
    return data.session.user.id;
  }

  // --- Fail-closed check ---
  function isActiveStudent(studentId: string): boolean {
    return getActiveProfileId() === studentId;
  }

  return {
    // -----------------------------------------------------------------------
    // Profiles (global — all students for authenticated user)
    // -----------------------------------------------------------------------

    async loadProfiles(): Promise<ProfilesState> {
      const userId = await getAuthUserId();
      if (!userId) {
        return createRemoteUnavailableSentinel<ProfilesState>();
      }

      const { data, error } = await client
        .from("student_profiles")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        if (isNotFoundError(error)) {
          return { profiles: [], activeStudentId: null };
        }
        throw error;
      }

      if (!data || data.length === 0) {
        return { profiles: [], activeStudentId: null };
      }

      const profiles: StudentProfile[] = data.map(
        (row: Record<string, unknown>) => ({
          studentId: row.student_id as string,
          displayName: row.display_name as string,
          createdAt: row.created_at as string,
          lastActiveAt: row.last_active_at as string,
        })
      );

      // activeStudentId is maintained locally — remote doesn't store it
      const activeId = getActiveProfileId();
      return { profiles, activeStudentId: activeId };
    },

    async saveProfiles(state: ProfilesState): Promise<ProfileSaveResult> {
      const userId = await getAuthUserId();
      if (!userId) {
        return { ok: false, reason: "storage-unavailable" };
      }

      // Save each profile row (upsert to handle create/update)
      for (const profile of state.profiles) {
        const { error } = await client
          .from("student_profiles")
          .upsert(
            {
              user_id: userId,
              student_id: profile.studentId,
              display_name: profile.displayName,
              created_at: profile.createdAt,
              last_active_at: profile.lastActiveAt,
            },
            { onConflict: "user_id,student_id" }
          );

        if (error) {
          return { ok: false, reason: "storage-unavailable" };
        }
      }

      return { ok: true, state };
    },

    // -----------------------------------------------------------------------
    // Progress (student-scoped)
    // -----------------------------------------------------------------------

    async loadProgress(studentId: string): Promise<PracticeProgress> {
      if (!isActiveStudent(studentId)) {
        return EMPTY_PROGRESS;
      }

      const userId = await getAuthUserId();
      if (!userId) {
        return createRemoteUnavailableSentinel<PracticeProgress>();
      }

      const { data, error } = await client
        .from("student_progress_snapshots")
        .select("practice_progress, student_id")
        .eq("user_id", userId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (error) {
        if (isNotFoundError(error)) {
          return EMPTY_PROGRESS;
        }
        throw error;
      }

      if (!data?.practice_progress) {
        return EMPTY_PROGRESS;
      }

      // Defense-in-depth: validate returned student_id matches requested.
      // RLS should filter, but we verify server-side too.
      const returnedStudentId = (data as Record<string, unknown>).student_id;
      if (returnedStudentId && returnedStudentId !== studentId) {
        return EMPTY_PROGRESS;
      }

      return data.practice_progress as PracticeProgress;
    },

    async saveProgress(
      studentId: string,
      progress: PracticeProgress
    ): Promise<PersistenceResult<void>> {
      if (!isActiveStudent(studentId)) {
        return { ok: false, reason: "missing-active-profile" };
      }

      const userId = await getAuthUserId();
      if (!userId) {
        return { ok: false, reason: "missing-active-profile" };
      }

      const { error } = await client
        .from("student_progress_snapshots")
        .upsert(
          {
            user_id: userId,
            student_id: studentId,
            practice_progress: progress,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,student_id" }
        );

      if (error) {
        return { ok: false, reason: "missing-active-profile" };
      }

      return { ok: true, value: undefined };
    },

    // -----------------------------------------------------------------------
    // Diagnostic result (student-scoped)
    // -----------------------------------------------------------------------

    async loadDiagnosticResult(
      studentId: string
    ): Promise<DiagnosticResult | null> {
      if (!isActiveStudent(studentId)) {
        return null;
      }

      const userId = await getAuthUserId();
      if (!userId) {
        return createRemoteUnavailableSentinel<DiagnosticResult | null>();
      }

      const { data, error } = await client
        .from("student_progress_snapshots")
        .select("diagnostic_result, student_id")
        .eq("user_id", userId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (error) {
        if (isNotFoundError(error)) {
          return null;
        }
        throw error;
      }

      // Defense-in-depth: validate returned student_id matches requested.
      const returnedStudentId = (data as Record<string, unknown>)?.student_id;
      if (returnedStudentId && returnedStudentId !== studentId) {
        return null;
      }

      return (data?.diagnostic_result as DiagnosticResult) ?? null;
    },

    async saveDiagnosticResult(
      studentId: string,
      result: DiagnosticResult
    ): Promise<PersistenceResult<void>> {
      if (!isActiveStudent(studentId)) {
        return { ok: false, reason: "missing-active-profile" };
      }

      const userId = await getAuthUserId();
      if (!userId) {
        return { ok: false, reason: "missing-active-profile" };
      }

      const { error } = await client
        .from("student_progress_snapshots")
        .upsert(
          {
            user_id: userId,
            student_id: studentId,
            diagnostic_result: result,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,student_id" }
        );

      if (error) {
        return { ok: false, reason: "missing-active-profile" };
      }

      return { ok: true, value: undefined };
    },

    // -----------------------------------------------------------------------
    // Study plan (student-scoped)
    // -----------------------------------------------------------------------

    async loadStudyPlan(studentId: string): Promise<StudyPlan | null> {
      if (!isActiveStudent(studentId)) {
        return null;
      }

      const userId = await getAuthUserId();
      if (!userId) {
        return createRemoteUnavailableSentinel<StudyPlan | null>();
      }

      const { data, error } = await client
        .from("student_progress_snapshots")
        .select("study_plan, student_id")
        .eq("user_id", userId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (error) {
        if (isNotFoundError(error)) {
          return null;
        }
        throw error;
      }

      // Defense-in-depth: validate returned student_id matches requested.
      const returnedStudentId = (data as Record<string, unknown>)?.student_id;
      if (returnedStudentId && returnedStudentId !== studentId) {
        return null;
      }

      return (data?.study_plan as StudyPlan) ?? null;
    },

    async saveStudyPlan(
      studentId: string,
      plan: StudyPlan
    ): Promise<PersistenceResult<void>> {
      if (!isActiveStudent(studentId)) {
        return { ok: false, reason: "missing-active-profile" };
      }

      const userId = await getAuthUserId();
      if (!userId) {
        return { ok: false, reason: "missing-active-profile" };
      }

      const { error } = await client
        .from("student_progress_snapshots")
        .upsert(
          {
            user_id: userId,
            student_id: studentId,
            study_plan: plan,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,student_id" }
        );

      if (error) {
        return { ok: false, reason: "missing-active-profile" };
      }

      return { ok: true, value: undefined };
    },
  };
}
