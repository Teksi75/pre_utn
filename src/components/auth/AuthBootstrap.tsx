/**
 * AuthBootstrap — listener that wires Supabase auth events to persistence.
 *
 * Mounted once at the root of the tree (in `src/app/layout.tsx`), alongside
 * `PersistenceInitializer`. Watches the Supabase auth state and drives the
 * persistence adapter accordingly.
 *
 * The event-handler logic is extracted into `createAuthEventHandler(deps)`
 * so the readiness wiring is testable without a DOM. The component is a
 * thin wrapper that subscribes via `onAuthStateChange` and forwards each
 * event into the extracted handler.
 *
 * Flow per event (see `createAuthEventHandler`):
 *   - `INITIAL_SESSION` / `SIGNED_IN`:
 *     1. Capture `lastUserId` for the upcoming `SIGNED_OUT` clear.
 *     2. `beginPostAuthSync(session)` — runs the link/import orchestrator,
 *        awaits readiness (FK row + import settled), updates the public
 *        `PostAuthSyncStatus` snapshot. Skipped when `session === null`.
 *     3. `reinitializePersistence()` — flips the persistence selector
 *        AFTER the FK row is guaranteed to exist. When `session === null`
 *        (stale/no-session tail), `resetPersistenceToLocal()` is used
 *        instead: a null tail must not read the live Supabase session, or
 *        a concurrent `SIGNED_IN B` could be observed and remote selected
 *        for B before B's FK-before-snapshot readiness completes.
 *   - `SIGNED_OUT`:
 *     1. `clearPostAuthSyncStatus(lastUserId)` — clears the per-userId
 *        orchestrator cache and the public `currentStatus` snapshot so
 *        the next sign-in re-runs the orchestrator.
 *     2. `resetPersistenceToLocal()` — flips the persistence selector
 *        back to local WITHOUT reading the current Supabase session.
 *        This is session-blind by design: a `SIGNED_IN B` arriving
 *        while the sign-out tail is in flight must not have its
 *        session observed by the stale sign-out (which would select
 *        remote for B before B's FK-before-snapshot readiness completes).
 *        See `resetPersistenceToLocal` in adapter-config for the race.
 *
 * Both sign-in events funnel into the same code path; the orchestrator's
 * per-userId promise dedupe collapses the INITIAL_SESSION + SIGNED_IN
 * race into a single orchestrator run.
 *
 * Other events (`TOKEN_REFRESHED`, etc.) are intentionally ignored — they
 * don't change the persistence surface.
 *
 * The subscription is created inside `useEffect` with a returned cleanup,
 * so React Strict Mode's mount→cleanup→remount cycle leaves exactly one
 * listener attached.
 *
 * The post-auth sync side effect is delegated to the
 * `beginPostAuthSync(session)` orchestrator (a standalone, unit-testable
 * module) rather than inlined in this React effect. The orchestrator
 * owns the link + import flow and is awaited here so the
 * `(user_id, student_id)` row exists before the selector flips to
 * the remote adapter.
 *
 * Spec: REQ-AUTH-3 + REQ-NEW-2a..d + REQ-NEW-ARCH-1.
 *
 * @module components/auth/AuthBootstrap
 */

"use client";

import { useEffect } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { onAuthStateChange } from "@/lib/supabase/auth";
import {
  beginPostAuthSync,
  reinitializePersistence,
  resetPersistenceToLocal,
} from "@/lib/persistence/adapter-config";
import { clearPostAuthSyncStatus } from "@/lib/auth/post-auth-sync";
import { createProductionFallbackSink } from "@/lib/persistence/fallback-sink";

// ---------------------------------------------------------------------------
// Handler — extracted so the readiness wiring is testable without a DOM.
// ---------------------------------------------------------------------------

/**
 * Dependencies injected into the auth-event handler. All four are required
 * so the handler is exercisable in unit tests with mocked versions. The
 * production wiring is constructed in `AuthBootstrap`'s effect.
 */
export interface AuthEventHandlerDeps {
  /** Awaits the post-auth sync orchestrator; returns the final status. */
  beginPostAuthSync: (session: Session | null) => Promise<unknown>;
  /**
   * Re-runs the persistence selector against the current Supabase
   * session. Used for `SIGNED_IN` / `INITIAL_SESSION`, where the
   * in-flight session IS the current one and the orchestrator has
   * already guaranteed the FK row. Forwards `expectedUserId` so the
   * selector's own live session read is identity-aware: the generation
   * guard alone is not sufficient, because auth can flip between that
   * guard and the selector's `client.auth.getSession()` read.
   */
  reinitializePersistence: (options: { expectedUserId?: string }) => Promise<void>;
  /**
   * Explicitly selects the local adapter WITHOUT reading the current
   * Supabase session. Used for `SIGNED_OUT` so the sign-out tail cannot
   * observe a concurrent signed-in user B (see `resetPersistenceToLocal`
   * in adapter-config for the race rationale).
   */
  resetPersistenceToLocal: () => Promise<void>;
  /** Clears the per-userId post-auth sync state on SIGNED_OUT. */
  clearPostAuthSyncStatus: (userId: string) => void;
}

/**
 * Returns a callback `(event, session) => Promise<void>` suitable for
 * `onAuthStateChange`. Implements the post-auth sync readiness wiring
 * without coupling the protocol to React or to the browser-only
 * auth helpers — the production handler is constructed once in
 * `AuthBootstrap`'s effect.
 *
 * Captures `lastUserId` from the SIGNED_IN / INITIAL_SESSION session so
 * the SIGNED_OUT branch (which arrives with a null session) can still
 * clear that user's per-userId post-auth sync cache.
 *
 * Never throws — errors from the orchestrator are mapped to the
 * documented "local-fallback" status by `beginPostAuthSync` itself, so
 * the await is always safe.
 *
 * Stale-handler guard: a monotonic `generation` counter is bumped on
 * every session-changing event (SIGNED_IN / INITIAL_SESSION /
 * SIGNED_OUT). Each invocation captures the generation at entry and
 * re-checks it before the final effect (`reinitializePersistence`).
 * If a newer session-changing event arrived while this invocation was
 * awaiting the orchestrator, this handler no longer represents the
 * current session and aborts silently — it must NOT flip persistence
 * for a session it no longer represents (e.g. session A's slow sync
 * resolving after sign-out + sign-in B must not reinit against B).
 * No-op events (TOKEN_REFRESHED, …) do NOT bump the generation: a
 * token refresh keeps the same session identity, so an in-flight
 * sign-in for that user remains valid.
 */
export function createAuthEventHandler(
  deps: AuthEventHandlerDeps
): (event: AuthChangeEvent, session: Session | null) => Promise<void> {
  let lastUserId: string | null = null;
  // Stale-handler guard — see JSDoc above.
  let generation = 0;

  return async (event, session) => {
    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
      const myGeneration = ++generation;
      // Capture the userId for the upcoming SIGNED_OUT clear.
      // SIGNED_OUT arrives with a null session, so we cannot read
      // userId from it. Both branches must capture so a refresh
      // that only emits INITIAL_SESSION + SIGNED_OUT also clears
      // cleanly.
      if (session?.user?.id) {
        lastUserId = session.user.id;
      }
      if (session) {
        // FK-before-snapshot readiness: await the orchestrator so
        // the FK row is guaranteed before the selector flips.
        await deps.beginPostAuthSync(session);
        // Stale-handler guard: if a newer session-changing event (sign-out
        // or a different sign-in) arrived while we awaited the
        // orchestrator, this invocation no longer represents the current
        // session — abort silently so it does not call
        // reinitializePersistence against a session that has moved on.
        if (myGeneration !== generation) return;
        // Forward the entry session's user id so the selector's live
        // session read is identity-aware. The generation guard above
        // only checks that no NEWER event arrived; the selector still
        // reads the live session via client.auth.getSession(), and auth
        // can flip between this guard and that read. Without this
        // forwarding, a stale A handler could select remote for B
        // before B's own readiness flow settles. session.user?.id is
        // undefined for a malformed session — the selector then falls
        // back to its legacy (non-guarded) behavior.
        await deps.reinitializePersistence({
          expectedUserId: session.user?.id,
        });
      } else {
        // Null session for INITIAL_SESSION/SIGNED_IN is a stale/no-session
        // tail. It must NOT call reinitializePersistence(): that reads the
        // live Supabase session, and a SIGNED_IN B arriving while this
        // tail is in flight would have its session observed here,
        // selecting remote for B before B's FK-before-snapshot readiness
        // completes. Use the session-blind local reset (same path as
        // SIGNED_OUT) so a newer session cannot be observed by this stale
        // null tail. B's own SIGNED_IN path runs reinitializePersistence()
        // after its readiness, owning the final remote state for B.
        if (myGeneration !== generation) return;
        await deps.resetPersistenceToLocal();
      }
    } else if (event === "SIGNED_OUT") {
      const myGeneration = ++generation;
      // Clear per-userId post-auth sync state BEFORE the selector
      // re-runs — otherwise the selector reads the stale `currentStatus`
      // snapshot from before the clear.
      if (lastUserId) {
        deps.clearPostAuthSyncStatus(lastUserId);
        lastUserId = null;
      }
      // Stale-handler guard: a sign-in that arrived while this sign-out
      // was processing would have bumped the generation; if so, let the
      // newer sign-in own the final persistence state.
      if (myGeneration !== generation) return;
      // The sign-out tail must be session-blind: it MUST NOT call
      // `reinitializePersistence()`. That function reads the live
      // Supabase session, and a `SIGNED_IN B` arriving AFTER the
      // stale-handler guard above (while this tail is still awaiting
      // `client.auth.getSession()`) would have its session observed
      // by this stale sign-out, selecting remote for B before B's
      // FK-before-snapshot readiness completes. `resetPersistenceToLocal`
      // explicitly selects local without reading the session, so a newer
      // session arriving after the guard cannot be observed here. B's
      // own SIGNED_IN path runs `reinitializePersistence()` after its
      // readiness, owning the final remote state for B.
      await deps.resetPersistenceToLocal();
    }
    // All other events are no-ops for persistence.
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Client-only auth bootstrap component. Subscribes to Supabase auth state
 * changes and updates the persistence adapter in response to sign-in /
 * initial-session / sign-out events. Renders nothing — it is a
 * side-effect-only component.
 */
export function AuthBootstrap(): null {
  useEffect(() => {
    const sink = createProductionFallbackSink();
    const handle = createAuthEventHandler({
      beginPostAuthSync,
      reinitializePersistence: (opts) =>
        reinitializePersistence({
          onFallback: sink,
          expectedUserId: opts?.expectedUserId,
        }),
      resetPersistenceToLocal,
      clearPostAuthSyncStatus,
    });

    const subscription = onAuthStateChange(handle);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}