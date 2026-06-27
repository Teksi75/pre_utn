/**
 * AuthBootstrap — listener that wires Supabase auth events to persistence.
 *
 * Mounted once at the root of the tree (in `src/app/layout.tsx`), alongside
 * `PersistenceInitializer`. Watches the Supabase auth state and drives the
 * persistence adapter accordingly:
 *
 * - `SIGNED_IN`  → `linkAndImportLocalProgress(session)` THEN `reinitializePersistence()`.
 *   The orchestrator handles the full 4-branch flow (link FK + import local
 *   progress when safe, no overwrite on conflict). It runs first (and is
 *   awaited) so the `(user_id, student_id)` row exists in `student_profiles`
 *   before the selector flips to the remote adapter. Without this ordering,
 *   the first `saveProgress()` could violate the FK from
 *   `student_progress_snapshots`.
 *
 * - `SIGNED_OUT` → `reinitializePersistence()`. No orchestrator call: the
 *   local profile stays active locally, and the selector falls back to the
 *   local adapter so any pending writes don't lose data.
 *
 * Other events (`TOKEN_REFRESHED`, `INITIAL_SESSION`, etc.) are intentionally
 * ignored — they don't change the persistence surface.
 *
 * The subscription is created inside `useEffect` with a returned cleanup,
 * so React Strict Mode's mount→cleanup→remount cycle leaves exactly one
 * listener attached.
 *
 * PR3 (T-REV-5): the direct `linkActiveProfileToAuthUser()` call was
 * replaced with `linkAndImportLocalProgress(session)` so the
 * import-on-link logic lives in a testable orchestrator module instead
 * of inline in the React effect. The inner helper is still exported for
 * the orchestrator's internal use.
 *
 * Spec: REQ-AUTH-3 + REQ-NEW-2a..d + REQ-NEW-ARCH-1.
 *
 * @module components/auth/AuthBootstrap
 */

"use client";

import { useEffect } from "react";
import { onAuthStateChange } from "@/lib/supabase/auth";
import { reinitializePersistence } from "@/lib/persistence/adapter-config";
import { linkAndImportLocalProgress } from "@/lib/auth/link-and-import";

/**
 * Client-only auth bootstrap component.
 *
 * Subscribes to Supabase auth state changes and updates the persistence
 * adapter in response to sign-in / sign-out events.
 *
 * Renders nothing — it is a side-effect-only component.
 */
export function AuthBootstrap(): null {
  useEffect(() => {
    const handle = onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        // Orchestrator first: handles optimistic student_id generation,
        // import of local progress in the safe branch, and FK link.
        // Awaited so the FK row exists before the selector flips.
        if (session) {
          await linkAndImportLocalProgress(session);
        }
        await reinitializePersistence();
      } else if (event === "SIGNED_OUT") {
        await reinitializePersistence();
      }
      // All other events are no-ops for persistence.
    });

    return () => {
      handle.unsubscribe();
    };
  }, []);

  return null;
}