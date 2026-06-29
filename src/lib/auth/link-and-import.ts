/**
 * linkAndImportLocalProgress — SIGNED_IN orchestrator.
 *
 * Runs once when Supabase emits a `SIGNED_IN` event. Decides what to do
 * based on the local profile state and the remote progress state, and
 * drives the non-destructive import + link flow.
 *
 * Design (REQ-NEW-1, REQ-NEW-2a..d, REQ-NEW-ARCH-1):
 *
 *   1. No session → outcome `{ kind: "local-fallback", reason: "no-session" }`.
 *   2. No browser client (env missing / auth disabled) → outcome
 *      `{ kind: "local-fallback", reason: "auth-disabled" }`.
 *   3. No active local profile → optimistic student_id generation:
 *      - read pending displayName from sessionStorage keyed by email,
 *        fall back to the email's local part.
 *      - `createProfileAndActivate({ displayName })` → local profile saved.
 *      - `linkActiveProfileToAuthUserWithResult()` → remote
 *        `student_profiles` row upserted (idempotent), which is the FK
 *        the remote `student_progress_snapshots` table requires.
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
 *   7. Always finishes by awaiting `linkActiveProfileToAuthUserWithResult()`
 *      so the FK row is guaranteed even when the active profile already
 *      existed before SIGNED_IN. If the FK upsert FAILED, the import
 *      branch is SKIPPED — writing snapshots without the FK row would
 *      fail the DB constraint. The outcome reports
 *      `local-fallback / profile-link-failed` so the post-auth-sync
 *      status flips to "local-fallback" instead of falsely reporting
 *      "ready" (REQ-NEW-2c: FK-before-snapshot readiness).
 *
 * Returns a discriminated `LinkImportOutcome` so `beginPostAuthSync()`
 * can translate the result into the public `PostAuthSyncStatus`. Never
 * throws — every step is best-effort.
 *
 * @module auth/link-and-import
 */

import type { Session } from "@supabase/supabase-js";
import { createSupabaseAdapter } from "../persistence/supabase-adapter";
import { getActiveProfileId } from "../active-session";
import { createProfileAndActivate } from "../student-profile-storage";
import { linkActiveProfileToAuthUserWithResult } from "./link-profile";
import { hasLocalProgress } from "./has-local-progress";
import { probeRemoteState, type RemoteState } from "./probe-remote";
import { importLocalProgressToRemote, type ImportableField } from "./import-local-progress";
import { tryCreateBrowserClient } from "./guards";

/**
 * Discriminated outcome of `linkAndImportLocalProgress`. The post-auth
 * sync status layer uses this to decide whether to report "ready" or
 * "local-fallback".
 *
 *   `kind: "ready"`         — FK row was confirmed AND (import either
 *                              succeeded, no-oped, or was not needed).
 *   `kind: "local-fallback"` — at least one step failed in a way the
 *                              app must keep local progress visible for:
 *                                * `no-session`        — no Supabase session
 *                                * `auth-disabled`     — env / client missing
 *                                * `no-active-profile` — could not create local profile
 *                                * `profile-link-failed` — FK upsert failed; import skipped
 *                                * `import-failed`     — import returned ok:false, 0 fields
 *                                * `import-partial`    — import returned ok:false with some fields
 */
export type LinkImportFailureReason =
  | "no-session"
  | "auth-disabled"
  | "no-active-profile"
  | "profile-link-failed"
  | "import-failed"
  | "import-partial";

export type LinkImportOutcome =
  | { kind: "ready"; branch: Branch }
  | {
      kind: "local-fallback";
      reason: LinkImportFailureReason;
      branch: Branch;
      partialFields?: ImportableField[];
    };

/** SessionStorage key for the displayName typed at /cuenta/ingresar. */
export const PENDING_NAME_KEY_PREFIX = "pre-utn.pendingName:";

// ---------------------------------------------------------------------------
// Idempotency guard (REQ-AUTH-3)
// ---------------------------------------------------------------------------

/**
 * Per-`session.user.id` in-flight and completed-sync promises.
 *
 * Supabase can emit BOTH `INITIAL_SESSION` and `SIGNED_IN` for the same
 * callback session, in either order and within milliseconds of each other.
 * The orchestrator is non-trivial (remote reads + writes + possibly FK
 * upsert + import), so a second concurrent call would re-run the same
 * remote probe and (worst case) double-write the import snapshots.
 *
 * Caching the promise by `userId` makes the orchestrator idempotent for
 * the lifetime of a single auth session. New sign-in cycles (after a
 * SIGNED_OUT) are reset by `clearPostAuthSyncState(userId)`, which the
 * AuthBootstrap calls when the user signs out.
 *
 * Tests that need a fresh map use `vi.resetModules()` so the module-level
 * state is re-created.
 */
const syncPromises = new Map<string, Promise<LinkImportOutcome>>();

/** Remove the cached promise for a user. Called by AuthBootstrap on SIGNED_OUT. */
export function clearPostAuthSyncState(userId: string): void {
  syncPromises.delete(userId);
}

/** Test-only: drop all cached promises. */
export function resetPostAuthSyncStateForTests(): void {
  syncPromises.clear();
}

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
 * because overwriting ANY of them would silently destroy user data
 * (see `design.md` §3 — conflict-avoidance rule).
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
 * Idempotent for the same `session.user.id`: subsequent calls within the
 * same auth session return the cached promise (REQ-AUTH-3). New sign-in
 * cycles after SIGNED_OUT clear the cache via `clearPostAuthSyncState`.
 *
 * Returns a `LinkImportOutcome` discriminated union:
 *   - `{ kind: "ready", branch }` when the sync was fully successful.
 *   - `{ kind: "local-fallback", reason, branch, partialFields? }` when
 *     any step failed in a way that requires the app to keep local
 *     progress visible.
 *
 * @param session - The Supabase auth session (from `onAuthStateChange`),
 *                  or null/undefined when there is no session yet.
 */
export async function linkAndImportLocalProgress(
  session: Session | null | undefined
): Promise<LinkImportOutcome> {
  // 1. No session → short-circuit with explicit outcome.
  if (!session || !session.user || !session.user.email) {
    return { kind: "local-fallback", reason: "no-session", branch: "link-only" };
  }

  const userId = session.user.id;

  // 2. Idempotency: return the cached promise if a sync is already in
  //    flight OR has completed for this userId. This collapses the
  //    INITIAL_SESSION + SIGNED_IN race into a single execution.
  //
  // The cache stores the resolved OUTCOME per userId so that even if the
  // underlying `runLinkAndImport` were removed from the map by
  // `clearPostAuthSyncState`, callers would still see consistent results
  // during a single auth session lifetime.
  const existing = syncPromises.get(userId);
  if (existing) {
    return existing;
  }

  const promise = runLinkAndImport(session);
  syncPromises.set(userId, promise);
  return promise;
}

/**
 * Internal: run the actual orchestrator body. Extracted so the public
 * `linkAndImportLocalProgress` can dedupe via the `syncPromises` Map
 * before doing any work.
 *
 * Order matters (REQ-NEW-2c):
 *   1. Resolve active profile (creates local profile if missing).
 *   2. Link the FK row FIRST (`linkActiveProfileToAuthUserWithResult`)
 *      so that the remote `student_profiles` row exists before any
 *      `student_progress_snapshots` write. If the FK upsert FAILS, the
 *      import branch is SKIPPED — block 3 invariant.
 *   3. Run the import branch ONLY when local has progress and remote
 *      does not — this preserves local data and never overwrites remote.
 *
 * Returns a `LinkImportOutcome` discriminated union.
 */
async function runLinkAndImport(session: Session): Promise<LinkImportOutcome> {
  // The public orchestrator already guards on `session.user.email` being
  // truthy before reaching this internal function, so it is safe to
  // narrow here.
  const email = session.user.email ?? "";

  // Build browser client; abort if auth is disabled. Centralized guard
  // (see auth/guards.ts) keeps the disabled-client semantics in sync
  // with the post-auth-sync status module.
  const client = tryCreateBrowserClient();
  if (!client) {
    return { kind: "local-fallback", reason: "auth-disabled", branch: "link-only" };
  }

  const remoteAdapter = createSupabaseAdapter(client);

  // Resolve active profile. No profile → optimistic creation.
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
      return {
        kind: "local-fallback",
        reason: "no-active-profile",
        branch: "link-only",
      };
    }
  }

  if (activeId === null) {
    return {
      kind: "local-fallback",
      reason: "no-active-profile",
      branch: "link-only",
    };
  }

  // 2. Link the FK row FIRST (REQ-NEW-2c: FK-before-snapshot readiness).
  //    linkActiveProfileToAuthUserWithResult NEVER throws; it returns a
  //    discriminated result. If the FK upsert failed, we MUST skip the
  //    import branch because writing snapshots without the FK row would
  //    fail the DB constraint.
  const linkResult = await linkActiveProfileToAuthUserWithResult();
  if (!linkResult.ok) {
    return {
      kind: "local-fallback",
      reason: "profile-link-failed",
      branch: "link-only",
    };
  }

  // 3. Probe remote state. probeRemoteState never throws — collapses to
  //    all-false on any error so the safe-default branch wins.
  const remote = await probeRemoteState(remoteAdapter, activeId);

  // 4. Compute localHas.
  const localHas = hasLocalProgress(activeId);

  // 5. Decide branch.
  const branch = decideBranch(localHas, remote);

  // 6. Execute the import branch (only this needs an extra call; the FK
  //    link ran above for ALL branches).
  if (branch === "link-and-import") {
    try {
      const importResult = await importLocalProgressToRemote(
        remoteAdapter,
        activeId
      );
      // Track partial vs full failure so the status module can flip to
      // "local-fallback" instead of falsely reporting "ready"
      // (REQ-NEW-2c: outcome is reported; never falsely "ready").
      if (!importResult.ok) {
        if (importResult.importedFields.length === 0) {
          return {
            kind: "local-fallback",
            reason: "import-failed",
            branch,
          };
        }
        return {
          kind: "local-fallback",
          reason: "import-partial",
          branch,
          partialFields: importResult.importedFields,
        };
      }
    } catch {
      // importLocalProgressToRemote is documented as never-throws, but
      // guard the outer Promise in case a future regression slips one
      // through.
      return {
        kind: "local-fallback",
        reason: "import-failed",
        branch,
      };
    }
  }

  return { kind: "ready", branch };
}
