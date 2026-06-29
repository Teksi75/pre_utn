/**
 * auth/guards — shared "can we reach Supabase Auth right now?" predicate.
 *
 * Used by the post-auth sync orchestrator and the post-auth-sync status
 * module. Centralizing the check keeps the two layers in sync: when one
 * says "auth is disabled", the other does too.
 *
 * Pure: never throws, never mutates state, safe to call from any context.
 *
 * @module auth/guards
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "../supabase/browser";

/**
 * Return a Supabase browser client when Auth is configured and usable,
 * or `null` when it is not.
 *
 * Returns `null` in two cases:
 *   1. `createBrowserClient()` itself throws (malformed env, factory error).
 *   2. `createBrowserClient()` returns `null` (env vars missing, auth
 *      deliberately disabled in this build).
 *
 * Both cases are collapsed into `null` because callers should treat
 * "auth is unavailable" as a single boolean, regardless of cause.
 */
export function tryCreateBrowserClient(): SupabaseClient | null {
  try {
    return createBrowserClient();
  } catch {
    return null;
  }
}