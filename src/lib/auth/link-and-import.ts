/**
 * linkAndImportLocalProgress — SIGNED_IN orchestrator.
 *
 * Runs once when Supabase emits a `SIGNED_IN` event. Decides what to do
 * based on the local profile state and the remote progress state, and
 * drives the non-destructive import + link flow.
 *
 * Design (REQ-NEW-1, REQ-NEW-2a..d, REQ-NEW-ARCH-1):
 *
 *   1. No session → no-op.
 *   2. No browser client (env missing / auth disabled) → no-op.
 *   3. No active local profile → optimistic student_id generation:
 *      - read pending displayName from sessionStorage keyed by email,
 *        fall back to the email's local part.
 *      - `createProfileAndActivate({ displayName })` → local profile saved.
 *      - `linkActiveProfileToAuthUser()` → remote `student_profiles`
 *        row upserted (idempotent), which is the FK the remote
 *        `student_progress_snapshots` table requires.
 *   4. Probe the remote adapter for any stored progress (the `EMPTY_PROGRESS`
 *      sentinel counts as empty).
 *   5. Compute `hasLocalProgress(activeId)`.
 *   6. Branch via the pure `decideBranch(localHas, remote)`:
 *
 *      | local | remote | branch                | action          |
 *      |-------|--------|-----------------------|-----------------|
 *      | empty | empty  | `link-only`           | FK only         |
 *      | has   | empty  | `link-and-import`     | FK + import     |
 *      | has   | has    | `conflict-no-overwrite` | FK only       |
 *      | empty | has    | `remote-canonical`    | FK only         |
 *
 *   7. Always finishes by awaiting `linkActiveProfileToAuthUser()` so
 *      the FK row is guaranteed even when the active profile already
 *      existed before SIGNED_IN.
 *
 * Never throws — every step is best-effort.
 *
 * @module auth/link-and-import
 */

import type { Session } from "@supabase/supabase-js";
import { createBrowserClient } from "../supabase/browser";
import { createSupabaseAdapter } from "../persistence/supabase-adapter";
import { getActiveProfileId } from "../active-session";
import { createProfileAndActivate } from "../student-profile-storage";
import { linkActiveProfileToAuthUser } from "./link-profile";
import { hasLocalProgress } from "./has-local-progress";
import { probeRemoteState, type RemoteState } from "./probe-remote";
import { importLocalProgressToRemote } from "./import-local-progress";

/** SessionStorage key for the displayName typed at /cuenta/ingresar. */
export const PENDING_NAME_KEY_PREFIX = "pre-utn.pendingName:";

/** Decision the orchestrator takes after probing state. */
export type Branch =
  | "link-only"
  | "link-and-import"
  | "conflict-no-overwrite"
  | "remote-canonical";

/**
 * Pure decision: given the local and remote progress booleans, which
 * branch should the orchestrator execute? Exported for unit testing.
 *
 * Conflict rule: any non-empty remote field counts as `remote has`,
 * because overwriting ANY of them would silently destroy user data.
 * Per design §3 of the PR3 delta.
 */
export function decideBranch(localHas: boolean, remote: RemoteState): Branch {
  const remoteHas =
    remote.hasRemoteProgress || remote.hasDiagnostic || remote.hasStudyPlan;

  if (localHas && remoteHas) return "conflict-no-overwrite";
  if (localHas && !remoteHas) return "link-and-import";
  if (!localHas && remoteHas) return "remote-canonical";
  return "link-only";
}

/**
 * Read `sessionStorage["pre-utn.pendingName:" + email]` defensively.
 * Returns `null` when sessionStorage is unavailable, throws, or the key
 * is absent / whitespace.
 */
function readPendingDisplayName(email: string): string | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(`${PENDING_NAME_KEY_PREFIX}${email}`);
    if (raw === null) return null;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

/** Remove the pendingName key after consumption. Best-effort. */
function clearPendingDisplayName(email: string): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.removeItem(`${PENDING_NAME_KEY_PREFIX}${email}`);
  } catch {
    // ignore — storage might be disabled
  }
}

/**
 * Run the SIGNED_IN orchestrator. Never throws.
 *
 * @param session - The Supabase auth session (from `onAuthStateChange`),
 *                  or null/undefined when there is no session yet.
 */
export async function linkAndImportLocalProgress(
  session: Session | null | undefined
): Promise<void> {
  // 1. No session → no-op.
  if (!session || !session.user || !session.user.email) {
    return;
  }

  const email = session.user.email;

  // 2. Build browser client; abort if auth is disabled.
  let client: ReturnType<typeof createBrowserClient> | null = null;
  try {
    client = createBrowserClient();
  } catch {
    return;
  }
  if (!client) {
    return;
  }

  const remoteAdapter = createSupabaseAdapter(client);

  // 3. Resolve active profile. No profile → optimistic creation.
  let activeId = getActiveProfileId();

  if (activeId === null) {
    const pendingName = readPendingDisplayName(email);
    const localPart = email.split("@")[0] ?? "";
    const displayName =
      pendingName && pendingName.length > 0
        ? pendingName
        : localPart.length > 0
          ? localPart
          : "Alumno";

    const created = createProfileAndActivate({ displayName });
    if (created.ok) {
      // The newly created profile is now active locally.
      activeId = getActiveProfileId();
      // We just consumed the pendingName — clear it so a stale entry
      // does not leak into a future sign-in.
      clearPendingDisplayName(email);
    } else {
      // Could not create a local profile — bail out; the rest of the
      // orchestrator needs an activeId to operate on.
      return;
    }
  }

  if (activeId === null) {
    return;
  }

  // 4. Probe remote state. probeRemoteState never throws — collapses to
  //    all-false on any error so the safe-default branch wins.
  const remote = await probeRemoteState(remoteAdapter, activeId);

  // 5. Compute localHas.
  const localHas = hasLocalProgress(activeId);

  // 6. Decide branch.
  const branch = decideBranch(localHas, remote);

  // 7. Execute branch (only the import branch needs an extra call; the
  //    link FK runs at the end for ALL branches).
  if (branch === "link-and-import") {
    try {
      await importLocalProgressToRemote(remoteAdapter, activeId);
    } catch {
      // importLocalProgressToRemote is documented as never-throws, but
      // guard the outer Promise in case a future regression slips one
      // through.
    }
  }

  // 8. Always link FK (idempotent; safe even when the row already exists).
  //    linkActiveProfileToAuthUser is itself best-effort and never throws,
  //    but we await inside try/catch for defense in depth.
  try {
    await linkActiveProfileToAuthUser();
  } catch {
    // ignore
  }
}
