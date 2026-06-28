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
 * Result of attempting to link the active local profile to the remote
 * `student_profiles` table. The orchestrator (link-and-import) needs to
 * know whether the FK row was actually written so it can decide whether
 * to proceed with the import branch — if the FK is not in place, the
 * import would violate the FK constraint on `student_progress_snapshots`.
 */
export type LinkProfileResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "no-active-profile"
        | "no-session"
        | "auth-disabled"
        | "no-profile-row"
        | "remote-failed";
    };

/**
 * Upsert the active local profile into the remote `student_profiles`
 * table so that subsequent remote progress saves can satisfy the FK.
 *
 * Returns a discriminated `LinkProfileResult` so the orchestrator can
 * act on the outcome. The function NEVER throws — every error path is
 * captured as `{ ok: false, reason: ... }`.
 *
 * Spec: REQ-AUTH-4 — "linkActiveProfileToAuthUser() MUST read the active
 * local profile and call saveProfiles() so the remote adapter upserts a
 * student_profiles row keyed by (authUserId, studentId). It MUST be
 * idempotent and best-effort."
 */
export async function linkActiveProfileToAuthUserWithResult(): Promise<LinkProfileResult> {
  // 1. Resolve active profile id. No profile → no-op.
  const activeId = getActiveProfileId();
  if (!activeId) {
    return { ok: false, reason: "no-active-profile" };
  }

  // 2. Build a remote-capable client. Auth disabled → no-op.
  const client = createBrowserClient();
  if (!client) {
    return { ok: false, reason: "auth-disabled" };
  }

  // 3. Confirm a Supabase session exists. No session → no-op.
  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) {
      return { ok: false, reason: "no-session" };
    }

    // 4. Load the full local profile state (we need displayName, createdAt,
    //    lastActiveAt for the upsert).
    const state: ProfilesState = loadProfiles() as ProfilesState;
    const profile = state.profiles.find(
      (p: { studentId: string }) => p.studentId === activeId
    );
    if (!profile) {
      return { ok: false, reason: "no-profile-row" };
    }

    // 5. Build a remote adapter and upsert the profile. The adapter uses
    //    Supabase's `upsert(..., { onConflict: "user_id,student_id" })`,
    //    which is the idempotency guarantee at the DB layer.
    const remoteAdapter = createSupabaseAdapter(client);

    const result = await remoteAdapter.saveProfiles({
      profiles: [profile],
      activeStudentId: activeId,
    });

    if (!result.ok) {
      return { ok: false, reason: "remote-failed" };
    }

    return { ok: true };
  } catch {
    // Any unexpected throw is captured as a remote failure so the
    // orchestrator can decide not to run the import branch.
    return { ok: false, reason: "remote-failed" };
  }
}

/**
 * Fire-and-forget wrapper around `linkActiveProfileToAuthUserWithResult`
 * that preserves the original void return contract. AuthBootstrap and
 * other fire-and-forget callers should keep using this entrypoint.
 *
 * Never throws. The result is intentionally discarded because callers
 * that use this helper do not need to act on the failure mode.
 */
export async function linkActiveProfileToAuthUser(): Promise<void> {
  await linkActiveProfileToAuthUserWithResult();
}