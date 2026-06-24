/**
 * Supabase browser client factory.
 *
 * Creates a Supabase client using ONLY public environment variables.
 * This module MUST NOT import, reference, or require any admin key
 * or non-public Supabase credential.
 *
 * Design: use only NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Admin/privileged keys
 * in frontend are forbidden.
 *
 * @module supabase/browser
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let cachedClient: SupabaseClient | null = null;

/**
 * Create or return a cached Supabase browser client.
 *
 * Uses only public env vars:
 * - `NEXT_PUBLIC_SUPABASE_URL`
 * - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (legacy anon key value is acceptable)
 *
 * **FORBIDDEN**: Do NOT add admin keys or any non-public key to this
 * module. The publishable/anon key is browser-safe by design; admin
 * keys bypass RLS and MUST NOT appear in client code.
 *
 * @returns SupabaseClient instance, or null if env vars are missing or
 *          malformed (e.g. invalid URL). Returns null instead of throwing
 *          so the selector falls back to local persistence gracefully.
 */
export function createBrowserClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        // v0 has no auth UI — do NOT persist session tokens in browser storage.
        // This avoids stale/phantom tokens and removes the need for token
        // management or sign-out flows that are out of scope for v0.
        persistSession: false,
        // Do not auto-refresh — auth flow is out of scope for v0
        autoRefreshToken: false,
        // Do not detect session from URL fragments — no auth redirect flow in v0
        detectSessionInUrl: false,
      },
    });
  } catch {
    // Malformed URL or key — Supabase client creation failed.
    // Return null so the selector falls back to local persistence
    // instead of crashing the app.
    return null;
  }

  return cachedClient;
}
