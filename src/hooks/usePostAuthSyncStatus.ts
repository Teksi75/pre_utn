/**
 * usePostAuthSyncStatus — client hook for the live post-auth sync status.
 *
 * The post-auth sync status lives in `src/lib/auth/post-auth-sync.ts` and
 * transitions over the lifetime of a page:
 *
 *   signed-out → pending → ready | local-fallback → signed-out → …
 *
 * Components like the Nav sync pill need to re-render when the status
 * changes, NOT just read it once at mount. This hook wraps
 * `useSyncExternalStore` around the readiness surface:
 *
 *   - `getSnapshot`       — current status (live)
 *   - `getServerSnapshot` — "signed-out" for SSR (status is client-only)
 *   - `subscribe`         — calls `subscribePostAuthSyncChange(listener)`
 *
 * Returns the latest status. Re-renders on every transition.
 *
 * Spec: REQ-NEW-ARCH-1 — Nav sync pill requires live readiness signal.
 *
 * @module hooks/usePostAuthSyncStatus
 */

"use client";

import { useSyncExternalStore } from "react";
import {
  getPostAuthSyncStatus,
  getPostAuthSyncServerSnapshot,
  subscribePostAuthSyncChange,
} from "@/lib/persistence/adapter-config";

/**
 * Read the current post-auth sync status with live updates.
 *
 * Returns one of:
 *   `"disabled" | "signed-out" | "pending" | "ready" | "local-fallback"`.
 *
 * Re-renders the caller on every transition. SSR-safe: returns
 * `"signed-out"` on the server (no Supabase state available there).
 */
export function usePostAuthSyncStatus() {
  return useSyncExternalStore(
    subscribePostAuthSyncChange,
    getPostAuthSyncStatus,
    getPostAuthSyncServerSnapshot,
  );
}
