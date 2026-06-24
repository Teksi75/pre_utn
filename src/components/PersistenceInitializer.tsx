/**
 * PersistenceInitializer — client-only component that initializes the
 * persistence adapter once at app startup.
 *
 * initializePersistence() is called once on mount to configure the
 * Supabase adapter if env vars and auth session are present.
 *
 * Renders nothing — no UI, no layout impact.
 *
 * Design: "Require an existing Supabase Auth session before selecting
 * remote." The initializer checks for a real Supabase session; without
 * one, local persistence remains active.
 *
 * @module components/PersistenceInitializer
 */

"use client";

import { useEffect } from "react";
import { initializePersistence } from "@/lib/persistence";
import { createProductionFallbackSink } from "@/lib/persistence/fallback-sink";

/**
 * Client-only initializer — calls initializePersistence() once on mount.
 * Returns null (renders nothing).
 */
export function PersistenceInitializer(): null {
  useEffect(() => {
    const sink = createProductionFallbackSink();
    initializePersistence({ onFallback: sink });
  }, []);

  return null;
}
