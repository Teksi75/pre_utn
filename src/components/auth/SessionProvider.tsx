/**
 * SessionProvider — React context for Supabase Auth session state.
 *
 * Owns the single source of truth for the current Supabase Auth
 * session inside the React tree. Other components (Nav badge,
 * AuthBootstrap, sign-in pages) consume via `useSession()`.
 *
 * Contract (REQ-AUTH-2 / REQ-AUTH-5):
 * - Exposes `{ session, userEmail, isLoading, isAuthEnabled, signOut }`
 * - `isAuthEnabled` is `false` when `createBrowserClient()` returns null
 *   (env vars missing → auth-disabled mode). The provider still mounts
 *   and renders children; downstream consumers can hide auth UI.
 * - On mount: reads the current session via `getCurrentSession()` and
 *   subscribes to `onAuthStateChange` for live updates.
 * - `useEffect` returns the unsubscribe handle so React Strict Mode's
 *   double-mount / cleanup pattern leaves exactly one listener.
 * - `signOut()` clears local session state immediately (optimistic)
 *   and calls the lib helper to actually clear the Supabase session.
 *
 * @module components/auth/SessionProvider
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  createBrowserClient,
} from "@/lib/supabase/browser";
import {
  getCurrentSession,
  onAuthStateChange,
  signOut as libSignOut,
} from "@/lib/supabase/auth";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface SessionContextValue {
  /** Current Supabase session, or null when not signed in / auth disabled. */
  session: Session | null;
  /** Convenience accessor: `session?.user.email ?? null`. */
  userEmail: string | null;
  /** True while the provider is loading the initial session. */
  isLoading: boolean;
  /**
   * True when Supabase env vars are configured and a browser client was
   * successfully created. When false, all auth UI should hide gracefully.
   */
  isAuthEnabled: boolean;
  /** Sign out the current user. Resolves even when auth is disabled. */
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface SessionProviderProps {
  children: ReactNode;
}

/**
 * React context provider that holds the current Supabase session and
 * exposes a stable `useSession()` hook.
 *
 * Use once at the root of the tree (in `src/app/layout.tsx`).
 */
export function SessionProvider({ children }: SessionProviderProps) {
  // `isAuthEnabled` is a stable, client-only check: env vars do not
  // change at runtime, so evaluating once on mount is sufficient.
  const [isAuthEnabled] = useState<boolean>(() => createBrowserClient() !== null);

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial session read + subscribe to live changes.
  useEffect(() => {
    // If auth is disabled, leave session=null and skip the network call.
    if (!isAuthEnabled) {
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;

    // Read the current session once on mount.
    void getCurrentSession().then(({ session: initial }) => {
      if (cancelled) return;
      setSession(initial);
      setIsLoading(false);
    });

    // Subscribe to live updates. The returned handle exposes
    // unsubscribe() so Strict Mode's mount→cleanup→remount cycle
    // leaves exactly one listener attached.
    const handle = onAuthStateChange((_event, next) => {
      if (cancelled) return;
      setSession(next);
      // Once we receive any event, the session state is no longer
      // "loading" — even if the event is SIGNED_OUT (next === null).
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      handle.unsubscribe();
    };
  }, [isAuthEnabled]);

  // Optimistic sign-out: clear local state immediately so consumers
  // (Nav badge, AuthBootstrap) react without waiting on the network.
  // The lib helper does the actual session.clear() + SIGNED_OUT event.
  const signOut = useCallback(async () => {
    setSession(null);
    await libSignOut();
  }, []);

  const value: SessionContextValue = {
    session,
    userEmail: session?.user?.email ?? null,
    isLoading,
    isAuthEnabled,
    signOut,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Read the current session context value.
 *
 * Must be called inside a `<SessionProvider>` subtree. Outside of one,
 * throws a helpful dev error so the misuse is caught at render time.
 */
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}