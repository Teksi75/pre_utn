/**
 * Link active local profile to the authenticated Supabase user.
 *
 * On `SIGNED_IN`, the active local profile MUST be upserted into
 * `student_profiles` so subsequent remote progress saves satisfy the FK
 * from `student_progress_snapshots`. This module owns that step.
 *
 * Design: "linkActiveProfileToAuthUser() direct remote upsert, then
 * reinitializePersistence()" — we do the direct remote call here (not
 * through the configured adapter) because at this point the adapter may
 * still be the local/null one, and we need the FK row guaranteed before
 * `reinitializePersistence()` flips the selector to remote.
 *
 * Contract:
 * - No active local profile → no-op (resolves without doing anything).
 * - No Supabase session → no-op (resolves without doing anything).
 * - Auth disabled (client is null) → no-op.
 * - Otherwise → builds a remote adapter and calls `saveProfiles()` with
 *   the active profile so the `(user_id, student_id)` row exists.
 * - Idempotent: upserting the same row twice is a no-op at the DB layer.
 * - Best-effort: any thrown error or `{ok:false}` result is swallowed —
 *   the caller (`AuthBootstrap`) treats link as fire-and-forget so a
 *   transient Supabase outage does not break sign-in.
 *
 * @module auth/link-profile
 */

import { createBrowserClient } from "../supabase/browser";
import { createSupabaseAdapter } from "../persistence/supabase-adapter";
import { getActiveProfileId } from "../active-session";
import { loadProfiles } from "../student-profile-storage";
import type { ProfilesState } from "../persistence/port";

/**
 * Upsert the active local profile into the remote `student_profiles`
 * table so that subsequent remote progress saves can satisfy the FK.
 *
 * Safe to call repeatedly; safe to call without an active session or
 * without auth configured; never throws.
 *
 * Spec: REQ-AUTH-4 — "linkActiveProfileToAuthUser() MUST read the active
 * local profile and call saveProfiles() so the remote adapter upserts a
 * student_profiles row keyed by (authUserId, studentId). It MUST be
 * idempotent and best-effort."
 */
export async function linkActiveProfileToAuthUser(): Promise<void> {
  // 1. Resolve active profile id. No profile → no-op.
  const activeId = getActiveProfileId();
  if (!activeId) {
    return;
  }

  // 2. Build a remote-capable client. Auth disabled → no-op.
  const client = createBrowserClient();
  if (!client) {
    return;
  }

  // 3. Confirm a Supabase session exists. No session → no-op.
  //    Best-effort: errors here are swallowed.
  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) {
      return;
    }

    // 4. Load the full local profile state (we need displayName, createdAt,
    //    lastActiveAt for the upsert).
    const state: ProfilesState = loadProfiles() as ProfilesState;
    const profile = state.profiles.find((p: { studentId: string }) => p.studentId === activeId);
    if (!profile) {
      return;
    }

    // 5. Build a remote adapter and upsert the profile. The adapter uses
    //    Supabase's `upsert(..., { onConflict: "user_id,student_id" })`,
    //    which is the idempotency guarantee at the DB layer.
    const remoteAdapter = createSupabaseAdapter(client);

    // Best-effort: any throw or {ok:false} is swallowed. The caller
    // (AuthBootstrap) treats linking as fire-and-forget.
    await remoteAdapter.saveProfiles({
      profiles: [profile],
      activeStudentId: activeId,
    });
  } catch {
    // Swallow — best-effort.
    return;
  }
}