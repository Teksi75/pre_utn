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
 *        `PostAuthSyncStatus` snapshot.
 *     3. `reinitializePersistence()` — flips the persistence selector
 *        AFTER the FK row is guaranteed to exist.
 *   - `SIGNED_OUT`:
 *     1. `clearPostAuthSyncStatus(lastUserId)` — clears the per-userId
 *        orchestrator cache and the public `currentStatus` snapshot so
 *        the next sign-in re-runs the orchestrator.
 *     2. `reinitializePersistence()` — flips the persistence selector
 *        so the adapter falls back to local.
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
  /** Re-runs the persistence selector against the current state. */
  reinitializePersistence: () => Promise<void>;
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
 */
export function createAuthEventHandler(
  deps: AuthEventHandlerDeps
): (event: AuthChangeEvent, session: Session | null) => Promise<void> {
  let lastUserId: string | null = null;

  return async (event, session) => {
    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
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
      }
      await deps.reinitializePersistence();
    } else if (event === "SIGNED_OUT") {
      // Clear per-userId post-auth sync state BEFORE the selector
      // re-runs — otherwise the selector reads the stale `currentStatus`
      // snapshot from before the clear.
      if (lastUserId) {
        deps.clearPostAuthSyncStatus(lastUserId);
        lastUserId = null;
      }
      await deps.reinitializePersistence();
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
      reinitializePersistence: () => reinitializePersistence({ onFallback: sink }),
      clearPostAuthSyncStatus,
    });

    const subscription = onAuthStateChange(handle);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}