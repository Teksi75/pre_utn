/**
 * PersistenceInitializer — client-only component that initializes the
 * persistence adapter once at app startup.
 *
 * Two paths:
 *
 *  1. No Supabase session yet (the user has not signed in, or auth is
 *     disabled). Calls `initializePersistence({ onFallback })` once on
 *     mount — this becomes a no-op when no session exists.
 *
 *  2. Supabase session ALREADY exists at app startup (the magic-link
 *     callback landed, or the user refreshed the tab with an active
 *     session). Reads the current session, then awaits the post-auth
 *     sync readiness surface (`beginPostAuthSync(session)`) BEFORE
 *     reinitializing the adapter. This guarantees the FK row exists in
 *     `student_profiles` before the persistence selector flips to the
 *     remote adapter — without this ordering, the first `saveProgress()`
 *     could race the FK upsert and fail the DB constraint.
 *
 *     Both `AuthBootstrap` and this initializer call the same
 *     per-userId `beginPostAuthSync` — it is idempotent (the underlying
 *     orchestrator's promise is deduped by `session.user.id`), so the
 *     two callers share one orchestrator run per auth session.
 *
 * Renders nothing — no UI, no layout impact.
 *
 * The initialization protocol is extracted into `runPersistenceInit(deps)`
 * so the behavior is testable without a DOM. The component is a thin
 * wrapper that wires the production dependencies and calls the protocol
 * from a one-shot `useEffect`.
 *
 * @module components/PersistenceInitializer
 */

"use client";

import { useEffect } from "react";
import {
  beginPostAuthSync,
  initializePersistence,
  reinitializePersistence,
} from "@/lib/persistence/adapter-config";
import type { SelectorConfig } from "@/lib/persistence";
import {
  getCurrentSession,
  type GetCurrentSessionResult,
} from "@/lib/supabase/auth";
import { createProductionFallbackSink } from "@/lib/persistence/fallback-sink";

// ---------------------------------------------------------------------------
// Protocol — extracted so the ordering invariant is testable without DOM.
// ---------------------------------------------------------------------------

/**
 * Dependencies injected into the initialization protocol. All four are
 * required so the protocol can be exercised in unit tests with mocked
 * versions. The production wiring is constructed in
 * `PersistenceInitializer`'s effect.
 */
export interface PersistenceInitDeps {
  /** Reads the current Supabase Auth session (with a no-throw error shape). */
  getCurrentSession: () => Promise<GetCurrentSessionResult>;
  /** Awaits the post-auth sync orchestrator; returns the final status. */
  beginPostAuthSync: (
    session: GetCurrentSessionResult["session"],
  ) => Promise<unknown>;
  /** First-call entrypoint that runs the selector against current state. */
  initializePersistence: (options: { onFallback: SelectorConfig["onFallback"] }) => Promise<void>;
  /** Re-run the selector against the current state (readiness-aware path). */
  reinitializePersistence: (options: { onFallback: SelectorConfig["onFallback"] }) => Promise<void>;
  /** Production fallback sink (or test mock) forwarded to the selector. */
  sink: SelectorConfig["onFallback"];
}

/**
 * Persistence initialization protocol — the single source of truth for
 * the FK-before-snapshot readiness invariant.
 *
 * Ordering invariant: when a Supabase session is present, the
 * orchestrator (FK row + import branch) MUST settle before the
 * selector flips to the remote adapter. The no-session path runs the
 * legacy `initializePersistence()` immediately so the local adapter
 * is wired without delay.
 *
 * Never throws. Errors from `getCurrentSession` or `beginPostAuthSync`
 * fall back to the no-session path so the app remains usable.
 */
export async function runPersistenceInit(deps: PersistenceInitDeps): Promise<void> {
  try {
    const { session } = await deps.getCurrentSession();
    if (session) {
      // FK-before-snapshot readiness: await the orchestrator so the
      // `student_profiles` row is guaranteed before the selector
      // flips to the remote adapter.
      await deps.beginPostAuthSync(session);
      await deps.reinitializePersistence({ onFallback: deps.sink });
      return;
    }
  } catch {
    // getCurrentSession / beginPostAuthSync are documented as
    // never-throws, but defensive coding keeps the no-session path
    // wired even if a future regression leaks an error through.
  }
  // No-session (or error) path: legacy first-init.
  await deps.initializePersistence({ onFallback: deps.sink });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Client-only initializer — runs the persistence initialization
 * protocol once on mount. Returns null (renders nothing).
 */
export function PersistenceInitializer(): null {
  useEffect(() => {
    const sink = createProductionFallbackSink();
    void runPersistenceInit({
      getCurrentSession,
      beginPostAuthSync,
      initializePersistence,
      reinitializePersistence,
      sink,
    });
  }, []);

  return null;
}