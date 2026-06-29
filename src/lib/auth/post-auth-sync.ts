/**
 * post-auth-sync — public status surface for the post-callback sync.
 *
 * Auth and persistence UI consumers read this module to know:
 *   - whether it is safe to claim "Sincronizado" in the Nav,
 *   - whether PersistenceInitializer should wait before selecting remote,
 *   - whether HomeNextStepClient must render a local fallback view model.
 *
 * The status state machine:
 *
 *   signed-out     → no Supabase session
 *   disabled       → Supabase is not configured (no env / no client)
 *   pending        → sync started, has not resolved yet
 *   ready          → sync completed; remote is authoritative for this session
 *   local-fallback → sync ran but remote is empty/unavailable or any step
 *                    failed; the app must keep showing local progress
 *
 * `beginPostAuthSync(session)` is idempotent per `session.user.id`:
 * a second concurrent call with the SAME session shares the same in-flight
 * promise. Concurrent calls with DIFFERENT sessions get their own promises
 * (per-userId isolation — see `inflightByUser`). New sign-in cycles after
 * a SIGNED_OUT clear both the orchestrator's per-userId cache AND this
 * module's per-userId completed-status map via `clearPostAuthSyncStatus(userId)`.
 *
 * The final status of each completed sync is cached per userId so that a
 * caller re-invoking `beginPostAuthSync(session)` for that user gets
 * THEIR cached status back, not the global `currentStatus` snapshot which
 * may have been overwritten by a later user signing in.
 *
 * Each in-flight entry carries a token so a late resolution can detect
 * that `clearPostAuthSyncStatus(userId)` removed/replaced the entry while
 * the orchestrator was awaiting — in that case the in-flight write is
 * suppressed so a stale outcome does not leak into the per-userId cache
 * or the global `currentStatus`.
 *
 * A second, cross-user guard tracks the latest userId to begin a sync
 * (`activeStatusUserId`). The token guard only checks whether THIS user's
 * entry is still current, so a slow sync for user A that was never cleared
 * could still stomp `currentStatus = "ready"` after user B has begun and
 * set `currentStatus = "pending"`. The active-user check closes that gap:
 * a late A resolution may still update A's per-user `completedByUser`
 * cache, but it must NOT overwrite the global `currentStatus` or emit a
 * ready signal for B's UI.
 *
 * The status is set from the orchestrator's discriminated `LinkImportOutcome`:
 *   `{ kind: "ready" }`           → status = "ready"
 *   `{ kind: "local-fallback" }`  → status = "local-fallback"
 *
 * @module auth/post-auth-sync
 */

import type { Session } from "@supabase/supabase-js";
import {
  linkAndImportLocalProgress,
  clearPostAuthSyncState,
  type LinkImportOutcome,
} from "./link-and-import";
import { tryCreateBrowserClient } from "./guards";

// ---------------------------------------------------------------------------
// Status type
// ---------------------------------------------------------------------------

export type PostAuthSyncStatus =
  | "disabled"
  | "signed-out"
  | "pending"
  | "ready"
  | "local-fallback";

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

/**
 * Global latest-known status. Updated on every transition (sign-out,
 * sync start, sync completion). Components that don't have a session
 * context can read this with `getPostAuthSyncStatus()`. Components
 * that DO have a session context should call
 * `beginPostAuthSync(session)` to get the per-userId cached result.
 */
let currentStatus: PostAuthSyncStatus = "signed-out";

/**
 * Per-userId in-flight promise. Keyed by `session.user.id` so two
 * concurrent users get their own orchestrator runs. Each entry holds:
 *   - the underlying orchestrator promise (for awaiters)
 *   - the consumer-facing status promise (translates outcome → status)
 *   - a monotonic token captured at entry-creation time, used to detect
 *     that `clearPostAuthSyncStatus(userId)` removed/replaced the entry
 *     while the orchestrator was still awaiting. A stale entry MUST NOT
 *     write to `currentStatus` or the per-userId cache.
 */
const inflightByUser = new Map<
  string,
  { outcome: Promise<LinkImportOutcome>; status: Promise<void>; token: number }
>();

/**
 * Monotonic token source for in-flight entries. Incremented per
 * `beginPostAuthSync` call that actually creates a new entry.
 */
let nextEntryToken = 0;

/**
 * Per-userId cache of final `PostAuthSyncStatus`. Populated when a sync
 * completes (only if the in-flight entry is still current — see token
 * guard above). Read on every `beginPostAuthSync` to short-circuit
 * re-invocations and to return THAT user's cached status, regardless of
 * what `currentStatus` has been overwritten to by a later user.
 *
 * Cleared on SIGNED_OUT via `clearPostAuthSyncStatus(userId)` so a new
 * sign-in cycle can re-run the sync.
 */
const completedByUser = new Map<string, PostAuthSyncStatus>();

/**
 * The userId that currently owns the global `currentStatus` snapshot.
 * Set every time `beginPostAuthSync(session)` starts a sync for a real
 * session. A late-resolving sync for a PREVIOUS user checks this before
 * writing `currentStatus` / emitting: if a newer user has begun a sync
 * since, the stale sync may still update its own per-user
 * `completedByUser` cache (so a caller re-invoking it gets its own
 * settled status back) but MUST NOT overwrite the global status or emit
 * a ready signal for the newer user's UI.
 *
 * This guards the cross-user race the per-userId token guard does NOT
 * cover: the token guard only checks whether THIS user's in-flight entry
 * is still current, so a slow A sync that was never cleared can still
 * stomp `currentStatus = "ready"` after B has begun and set
 * `currentStatus = "pending"`. The active-user check closes that gap.
 */
let activeStatusUserId: string | null = null;

// ---------------------------------------------------------------------------
// External subscribers for live status UI
// ---------------------------------------------------------------------------
//
// Nav and other UI components subscribe via `useSyncExternalStore` so the
// sync pill re-renders as the status transitions. The listener set is
// module-level; `subscribePostAuthSyncChange` registers a callback that
// fires after every transition (sign-out, sync start, sync completion).
// Returning the unsubscribe handle from `subscribe` keeps the contract
// compatible with React's `useSyncExternalStore`.

type PostAuthSyncListener = () => void;
const listeners = new Set<PostAuthSyncListener>();

function emitPostAuthSyncChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Register a listener that fires after every post-auth sync status
 * transition. The returned function unsubscribes.
 *
 * The Nav sync pill uses this via the `usePostAuthSyncStatus` hook to
 * re-render as the status transitions from signed-out → pending → ready
 * | local-fallback.
 */
export function subscribePostAuthSyncChange(
  listener: PostAuthSyncListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read the current global post-auth sync status. Safe to call from any
 * component. Note that this is a global snapshot — for per-user
 * tracking, re-invoke `beginPostAuthSync(session)` and use its return
 * value (or `completedByUser.get(userId)` after import).
 */
export function getPostAuthSyncStatus(): PostAuthSyncStatus {
  return currentStatus;
}

// ---------------------------------------------------------------------------
// Server snapshot for useSyncExternalStore SSR safety
// ---------------------------------------------------------------------------
//
// useSyncExternalStore requires a server snapshot for SSR rendering.
// The server cannot read Supabase state, so it must return a safe
// non-ready default. "signed-out" is the documented safe non-ready
// state (see `clearPostAuthSyncStatus`).

export function getPostAuthSyncServerSnapshot(): PostAuthSyncStatus {
  return "signed-out";
}

/**
 * Run the post-auth sync for `session`. Idempotent for concurrent calls
 * with the same `session.user.id` — a second `beginPostAuthSync(session)`
 * after the first has completed returns the per-userId cached status
 * without re-running the orchestrator.
 *
 * Returns the final status once the sync has settled. The function never
 * throws — any error inside the orchestrator is captured and surfaced as
 * `"local-fallback"` so callers can render a recoverable view model.
 */
export async function beginPostAuthSync(
  session: Session | null | undefined
): Promise<PostAuthSyncStatus> {
  // No session → signed-out, no work.
  if (!session) {
    currentStatus = "signed-out";
    emitPostAuthSyncChange();
    return currentStatus;
  }

  const userId = session.user.id;

  // Per-userId completed-cache short-circuit. Re-invoking
  // beginPostAuthSync for a user whose sync has already settled returns
  // THAT user's cached status, NOT the global currentStatus (which may
  // have been overwritten by a later user signing in or signing out).
  const cached = completedByUser.get(userId);
  if (cached !== undefined) {
    // Cached branch for a real session user: claim GLOBAL ownership for
    // this user before returning. Without this, the global snapshot
    // (currentStatus + activeStatusUserId) keeps reflecting whichever
    // user last wrote it — not the user the caller is now asking about
    // — so Nav, which reads getPostAuthSyncStatus(), would render a
    // stale pill for the wrong user.
    //
    // Cross-user stale-snapshot scenario this closes:
    //   1. A signs in → sync settles "local-fallback" (cached for A).
    //   2. B signs in → sync settles "ready"; global currentStatus =
    //      "ready", activeStatusUserId = B.
    //   3. A signs in again → beginPostAuthSync(A) hits THIS cached
    //      branch. On the OLD behavior it returned A's cached
    //      "local-fallback" but left global currentStatus = "ready"
    //      (B's stale value), so Nav would show a false "ready" for A.
    //
    // Claiming ownership here makes the global snapshot honestly track
    // the user the caller just asked us to sync, matching the cached
    // value we return. Emit only when the snapshot actually changes so
    // a no-op re-invocation (same user, same status) does not spam
    // subscribers with a redundant transition.
    if (activeStatusUserId !== userId || currentStatus !== cached) {
      activeStatusUserId = userId;
      currentStatus = cached;
      emitPostAuthSyncChange();
    }
    return cached;
  }

  // Auth disabled (env missing / client factory returns null) →
  // disabled, no work. The shared guard collapses throw + null into a
  // single "auth unavailable" signal so the status reflects what the
  // orchestrator will actually do.
  if (!tryCreateBrowserClient()) {
    currentStatus = "disabled";
    emitPostAuthSyncChange();
    return currentStatus;
  }

  // Start the sync if one is not already in flight for THIS userId.
  // Claim ownership of the global status snapshot: a later
  // beginPostAuthSync for a different user will overwrite this; a late
  // resolution for a previous user checks activeStatusUserId before
  // writing currentStatus so it cannot stomp on the newer user's UI.
  activeStatusUserId = userId;
  currentStatus = "pending";
  emitPostAuthSyncChange();
  let entry = inflightByUser.get(userId);
  if (!entry) {
    const token = nextEntryToken++;
    const outcomePromise = linkAndImportLocalProgress(session);

    const statusPromise = (async (): Promise<void> => {
      try {
        const outcome = await outcomePromise;
        // Stale-write guard: if `clearPostAuthSyncStatus(userId)` was
        // called while the orchestrator was awaiting, our entry has been
        // removed from the map (or replaced by a new entry from a fresh
        // sign-in). In either case, our token no longer matches the
        // current entry — suppress the write so a stale outcome cannot
        // leak into the per-userId cache or `currentStatus`.
        if (inflightByUser.get(userId)?.token !== token) return;
        const settled =
          outcome.kind === "local-fallback" ? "local-fallback" : "ready";
        // Per-user cache is always updated — a caller re-invoking
        // beginPostAuthSync for THIS user gets its own settled status
        // back regardless of who owns the global snapshot.
        completedByUser.set(userId, settled);
        // Global status + emission are scoped to the active status
        // owner. If a newer user has begun a sync since this one
        // started, this late resolution MUST NOT overwrite currentStatus
        // or emit a ready signal for the newer user's UI (the cross-user
        // race the per-userId token guard alone does not close).
        if (activeStatusUserId === userId) {
          currentStatus = settled;
          emitPostAuthSyncChange();
        }
      } catch {
        // The orchestrator is documented as never-throws (its
        // LinkImportOutcome covers all failure modes), but defend
        // against future regressions — any unhandled error must NOT
        // leave the app in a permanently broken "pending" state.
        if (inflightByUser.get(userId)?.token !== token) return;
        completedByUser.set(userId, "local-fallback");
        // Same active-owner guard as the success path: a stale sync
        // for a previous user must not overwrite the newer user's
        // global status or emit for its UI.
        if (activeStatusUserId === userId) {
          currentStatus = "local-fallback";
          emitPostAuthSyncChange();
        }
      } finally {
        // Only remove OUR entry — a new sign-in may have already
        // installed a fresh entry with a different token.
        if (inflightByUser.get(userId)?.token === token) {
          inflightByUser.delete(userId);
        }
      }
    })();

    entry = { outcome: outcomePromise, status: statusPromise, token };
    inflightByUser.set(userId, entry);
  }

  await entry.status;
  // After awaiting, prefer the per-userId cached status if available;
  // otherwise fall back to the global snapshot (rare path — should only
  // happen if the entry was cleared in flight, in which case the
  // caller is responsible for handling "no result" semantics).
  return completedByUser.get(userId) ?? currentStatus;
}

/**
 * Wait for the in-flight post-auth sync to finish, or return `null` if
 * no sync is running. Persistence initialization uses this to defer
 * `reinitializePersistence()` until the FK row is guaranteed.
 *
 * Returns null AFTER a sync has completed — there is nothing to wait
 * for. Callers that need the result should check `getPostAuthSyncStatus()`.
 */
export function waitForPostAuthSync(): Promise<void> | null {
  // Aggregate the in-flight promises across all users. This is a
  // best-effort signal for callers that don't have a specific
  // userId context — any in-flight sync will do.
  if (inflightByUser.size === 0) {
    return null;
  }
  return Promise.all(
    Array.from(inflightByUser.values()).map((entry) => entry.status)
  ).then(() => undefined);
}

/**
 * Clear cached state for a user. Called by AuthBootstrap on SIGNED_OUT
 * so the next sign-in cycle re-runs the sync.
 *
 * Clears:
 *   - this module's `completedByUser` (so the next sign-in can run),
 *   - the in-flight entry (so any late resolution from the old sync is
 *     suppressed by the token guard),
 *   - the orchestrator's `syncPromises` (so the orchestrator does not
 *     return a stale cached promise), AND
 *   - the global `currentStatus` snapshot — reset to `"signed-out"` so
 *     callers of `getPostAuthSyncStatus()` see the documented safe
 *     non-ready state after sign-out, not the stale "ready" /
 *     "local-fallback" snapshot from before the clear.
 */
export function clearPostAuthSyncStatus(userId: string): void {
  completedByUser.delete(userId);
  inflightByUser.delete(userId);
  clearPostAuthSyncState(userId);
  currentStatus = "signed-out";
  emitPostAuthSyncChange();
}

/**
 * Test-only: reset module state so a fresh test starts from a clean
 * `"signed-out"` baseline.
 */
export function resetPostAuthSyncStatusForTests(): void {
  currentStatus = "signed-out";
  activeStatusUserId = null;
  inflightByUser.clear();
  completedByUser.clear();
  nextEntryToken = 0;
  listeners.clear();
}
