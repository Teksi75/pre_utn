/**
 * Supabase browser client factory.
 *
 * Creates a Supabase client using ONLY public environment variables
 * via `@supabase/ssr` (the official Next.js SSR helper). `@supabase/ssr`
 * automatically handles cookie-based session storage on the browser, so
 * `persistSession: true` is safe and supported.
 *
 * This module MUST NOT import, reference, or require any admin key
 * or non-public Supabase credential.
 *
 * Design: use only NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Admin/privileged keys
 * in frontend are forbidden.
 *
 * @module supabase/browser
 */

import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

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
 * Built on `@supabase/ssr`'s `createBrowserClient` so session tokens
 * are stored in cookies (browser-managed) and survive page reloads,
 * while `autoRefreshToken` keeps the access token fresh and
 * `detectSessionInUrl` allows the auth callback to capture the magic-link
 * code automatically.
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
    cachedClient = createSsrBrowserClient(url, key, {
      auth: {
        // Cookie-based session storage managed by @supabase/ssr.
        persistSession: true,
        // Middleware refreshes tokens; client keeps them fresh in foreground.
        autoRefreshToken: true,
        // Lets /auth/callback capture the magic-link code automatically.
        detectSessionInUrl: true,
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