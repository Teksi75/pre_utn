/**
 * AuthBootstrap — listener that wires Supabase auth events to persistence.
 *
 * Mounted once at the root of the tree (in `src/app/layout.tsx`), alongside
 * `PersistenceInitializer`. Watches the Supabase auth state and drives the
 * persistence adapter accordingly:
 *
 * - `SIGNED_IN`  → `linkActiveProfileToAuthUser()` THEN `reinitializePersistence()`.
 *   The link runs first (and is awaited) so that the `(user_id, student_id)`
 *   row exists in `student_profiles` before the selector flips to the remote
 *   adapter. Without this ordering, the first `saveProgress()` could violate
 *   the FK from `student_progress_snapshots`.
 *
 * - `SIGNED_OUT` → `reinitializePersistence()`. No link call: the local
 *   profile stays active locally, and the selector falls back to the local
 *   adapter so any pending writes don't lose data.
 *
 * Other events (`TOKEN_REFRESHED`, `INITIAL_SESSION`, etc.) are intentionally
 * ignored — they don't change the persistence surface.
 *
 * The subscription is created inside `useEffect` with a returned cleanup,
 * so React Strict Mode's mount→cleanup→remount cycle leaves exactly one
 * listener attached.
 *
 * Spec: REQ-AUTH-3 + REQ-AUTH-4.
 *
 * @module components/auth/AuthBootstrap
 */

"use client";

import { useEffect } from "react";
import { onAuthStateChange } from "@/lib/supabase/auth";
import { reinitializePersistence } from "@/lib/persistence/adapter-config";
import { linkActiveProfileToAuthUser } from "@/lib/auth/link-profile";

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
    const handle = onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        // Link first, then reinit. Awaited so the FK row exists before
        // the selector flips to remote.
        await linkActiveProfileToAuthUser();
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