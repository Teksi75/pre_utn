/**
 * Auth helpers — thin wrappers around the singleton Supabase browser client.
 *
 * Centralizing these calls keeps the rest of the app adapter-agnostic: any
 * component or module that needs to talk to Supabase Auth goes through
 * these functions, which handle the "client is null" case (when env vars
 * are missing) gracefully and surface a consistent error shape.
 *
 * All helpers are safe to call when `createBrowserClient()` returned null
 * (auth-disabled mode): they return a synthetic, recoverable error and
 * never throw.
 *
 * @module supabase/auth
 */

import type {
  AuthChangeEvent,
  Session,
  Subscription,
} from "@supabase/supabase-js";
import { createBrowserClient } from "./browser";

// ---------------------------------------------------------------------------
// AuthError shape — match the relevant subset of @supabase/supabase-js AuthError
// ---------------------------------------------------------------------------

/**
 * Minimal error shape returned by the auth helpers. Matches the
 * contract that `signInWithOtp`, `getSession`, `signOut` and similar
 * methods return from the underlying SDK.
 */
export interface AuthErrorLike {
  message: string;
  status?: number;
  name?: string;
  code?: string;
}

/**
 * Synthetic error returned when the browser client is null (auth
 * disabled because env vars are missing). Stable across calls so tests
 * and callers can match on the message.
 */
function authDisabledError(): AuthErrorLike {
  return {
    message:
      "La autenticación no está disponible. Faltan variables de entorno de Supabase.",
    name: "AuthDisabledError",
  };
}

// ---------------------------------------------------------------------------
// signInWithMagicLink
// ---------------------------------------------------------------------------

export interface SignInWithMagicLinkResult {
  /** Echoed from supabase; useful for showing "link sent" confirmation UI. */
  data: { user: null; session: null } | null;
  error: AuthErrorLike | null;
}

/**
 * Send a magic-link email to the given address. The link target is
 * `/auth/callback` so the magic-link round-trip lands back in the app.
 *
 * Returns a synthetic error (not a throw) when the browser client is
 * null — callers (e.g. the sign-in form) can branch on `result.error`
 * without try/catch.
 *
 * @param email - Recipient email address.
 */
export async function signInWithMagicLink(
  email: string
): Promise<SignInWithMagicLinkResult> {
  const client = createBrowserClient();
  if (!client) {
    return { data: null, error: authDisabledError() };
  }

  const { data, error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: "/auth/callback" },
  });

  return {
    data: data as { user: null; session: null } | null,
    error: (error as AuthErrorLike | null) ?? null,
  };
}

// ---------------------------------------------------------------------------
// getCurrentSession
// ---------------------------------------------------------------------------

export interface GetCurrentSessionResult {
  session: Session | null;
  error: AuthErrorLike | null;
}

/**
 * Read the current Supabase Auth session. Returns null session +
 * synthetic error when the client is unavailable so callers can
 * short-circuit cleanly.
 */
export async function getCurrentSession(): Promise<GetCurrentSessionResult> {
  const client = createBrowserClient();
  if (!client) {
    return { session: null, error: authDisabledError() };
  }

  const { data, error } = await client.auth.getSession();
  return {
    session: data.session ?? null,
    error: (error as AuthErrorLike | null) ?? null,
  };
}

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------

export interface SignOutResult {
  error: AuthErrorLike | null;
}

/**
 * Clear the current Supabase session. The `SIGNED_OUT` event will be
 * delivered to any subscriber registered via `onAuthStateChange`, and
 * `AuthBootstrap` will then fall the persistence selector back to the
 * local adapter.
 *
 * Returns a synthetic error when the client is unavailable — never
 * throws, so callers in event handlers (Nav sign-out link, account
 * page button) don't need try/catch.
 */
export async function signOut(): Promise<SignOutResult> {
  const client = createBrowserClient();
  if (!client) {
    return { error: authDisabledError() };
  }

  const { error } = await client.auth.signOut();
  return { error: (error as AuthErrorLike | null) ?? null };
}

// ---------------------------------------------------------------------------
// onAuthStateChange
// ---------------------------------------------------------------------------

export type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: Session | null
) => void;

export interface AuthStateChangeHandle {
  /** Unsubscribes the listener. Safe to call multiple times. */
  unsubscribe: () => void;
}

/**
 * Subscribe to Supabase Auth state changes (`SIGNED_IN`, `SIGNED_OUT`,
 * `TOKEN_REFRESHED`, …).
 *
 * Returns a stable handle whose `unsubscribe()` is safe to call even
 * when the client is unavailable (it becomes a no-op). This lets
 * `AuthBootstrap` use a single effect shape regardless of auth state.
 */
export function onAuthStateChange(
  callback: AuthStateChangeCallback
): AuthStateChangeHandle {
  const client = createBrowserClient();
  if (!client) {
    return { unsubscribe: () => undefined };
  }

  const { data } = client.auth.onAuthStateChange(callback);
  // Pass through the SDK subscription's unsubscribe directly so callers
  // can use the same reference they would get from supabase-js. If the
  // SDK ever returns a malformed shape, fall back to a no-op.
  const subscription: Subscription | undefined = data?.subscription;
  return {
    unsubscribe: subscription?.unsubscribe ?? (() => undefined),
  };
}