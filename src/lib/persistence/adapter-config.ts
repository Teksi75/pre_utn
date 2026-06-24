/**
 * Persistence adapter configuration — module-level adapter management.
 *
 * This module provides a way for public storage functions to delegate through
 * a configured adapter (e.g., Supabase-backed) instead of always using raw
 * localStorage directly. The configuration is set once at app initialization
 * and used by all public storage functions.
 *
 * Design: "Storage API → selectedPersistenceAdapter() → local or remote adapter."
 * This module is the bridge that lets public storage functions call through
 * the adapter without circular dependencies.
 *
 * @module persistence/adapter-config
 */

import type {
  PersistenceAdapter,
  MaybePromise,
} from "./port";
import { selectPersistenceAdapter, type SelectorConfig } from "./selector";
import { createSupabaseAdapter } from "./supabase-adapter";
import { createBrowserClient } from "../supabase/browser";

// ---------------------------------------------------------------------------
// Adapter interface — derived from PersistenceAdapter (no duplication)
// ---------------------------------------------------------------------------

/**
 * Operations that public storage functions delegate to.
 * Derived directly from PersistenceAdapter — the canonical contract.
 */
export type ConfiguredAdapter = PersistenceAdapter;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let configuredAdapter: ConfiguredAdapter | null = null;

/**
 * Tracks the initialization promise so storage APIs can chain on it
 * when a remote session may exist. Null when no initialization is
 * in progress or has not started.
 */
let initializationPromise: Promise<void> | null = null;

/**
 * Tracks pending remote profile save promises per student ID.
 * Used to enforce ordering: remote progress save must wait for
 * pending remote profile save to complete for the same student.
 * This prevents FK violations on student_progress_snapshots.
 */
const pendingProfileSavePromises = new Map<string, Promise<void>>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Configure a persistence adapter for public storage functions.
 *
 * When set, public functions like `loadProfiles()`, `saveProfiles()`,
 * `loadProgress()`, etc. will delegate through this adapter instead of
 * using raw localStorage directly.
 *
 * @param adapter - The adapter to use, or null to reset to raw localStorage.
 */
export function configurePersistenceAdapter(adapter: ConfiguredAdapter | null): void {
  configuredAdapter = adapter;
}

/**
 * Get the currently configured persistence adapter.
 *
 * Returns the configured adapter if one exists, or null if none is configured.
 * When null, public storage functions should use raw localStorage directly.
 */
export function getConfiguredAdapter(): ConfiguredAdapter | null {
  return configuredAdapter;
}

/**
 * Reset to raw localStorage mode (no adapter).
 * Primarily used for testing cleanup.
 */
export function resetPersistenceAdapter(): void {
  configuredAdapter = null;
}

/**
 * Get the initialization promise, if one is in progress.
 *
 * Returns the Promise from the current `initializePersistence()` call,
 * or null if no initialization has been started. Storage APIs can chain
 * on this to wait for adapter configuration before reading.
 *
 * Design: "Storage APIs must be able to await/chain the initialization
 * promise on first use when a remote session may exist."
 */
export function getInitializationPromise(): Promise<void> | null {
  return initializationPromise;
}

/**
 * Get the pending remote profile save promise for a student, if any.
 *
 * Returns the Promise from a pending `adapter.saveProfiles()` call for
 * the given student ID, or null if no pending save exists.
 * Storage APIs can chain on this to wait for profile save before
 * remote progress save, preventing FK violations.
 */
export function getPendingProfileSavePromise(studentId: string): Promise<void> | null {
  return pendingProfileSavePromises.get(studentId) ?? null;
}

/**
 * Set a pending remote profile save promise for a student.
 *
 * Call this when starting a remote `adapter.saveProfiles()` that includes
 * a new student profile. The promise should resolve when the remote save
 * completes (success or failure).
 *
 * @param studentId - The student ID being saved
 * @param promise - The promise that resolves when the remote save completes
 */
export function setPendingProfileSavePromise(studentId: string, promise: Promise<void>): void {
  pendingProfileSavePromises.set(studentId, promise);
}

/**
 * Clear the pending remote profile save promise for a student.
 *
 * Call this when the remote save completes (success or failure) to clean up
 * the tracking map.
 */
export function clearPendingProfileSavePromise(studentId: string): void {
  pendingProfileSavePromises.delete(studentId);
}

/**
 * Wait for initialization (if pending), then delegate to the configured
 * adapter's loadProgress or fall back to local storage.
 *
 * This resolves the initialization race: callers that arrive before
 * `initializePersistence()` completes can use this to wait for the
 * adapter to be configured before reading.
 *
 * Design: "Do not gate UI visually" — this is an async function that
 * callers can chain on, not a visual gate.
 */
export async function loadProgressWhenReady(): Promise<
  import("./port").PracticeProgress
> {
  // Wait for initialization if it's in progress
  if (initializationPromise) {
    await initializationPromise;
  }

  // Now delegate through the normal loadProgress path
  const { loadProgress } = await import("../practice-progress");
  return loadProgress() as Promise<import("./port").PracticeProgress>;
}

/**
 * Initialize the persistence adapter for production use.
 *
 * Checks for Supabase env vars and an existing Supabase Auth session.
 * If both are present, creates and configures the Supabase adapter wrapped
 * with local fallback. If not, leaves the adapter null (raw localStorage).
 *
 * This is the production wiring function — call it once at app startup
 * (e.g., in a root layout or initialization module).
 *
 * Design: "Require an existing Supabase Auth session before selecting remote."
 * Local active profile alone is NOT auth — a real backend session is required.
 *
 * Error handling: catches all errors and degrades to local fallback.
 * Calls onFallback with method "initializePersistence" when an error occurs.
 *
 * @param options.onFallback - Optional observability callback for fallback events.
 */
export async function initializePersistence(options?: {
  onFallback?: SelectorConfig["onFallback"];
}): Promise<void> {
  const promise = (async () => {
    try {
      const client = createBrowserClient();
      if (!client) {
        // No env vars or malformed — local fallback
        configuredAdapter = null;
        return;
      }

      // Check for existing Supabase Auth session
      const { data, error } = await client.auth.getSession();
      if (error || !data.session) {
        // No session — local fallback
        configuredAdapter = null;
        return;
      }

      // Session exists — create Supabase adapter and configure with fallback
      const remoteAdapter = createSupabaseAdapter(client);
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      const adapter = selectPersistenceAdapter({
        env: { url, publishableKey: key },
        hasRemoteSession: true,
        remoteAdapter,
        onFallback: options?.onFallback,
      });

      configuredAdapter = adapter;
    } catch (err) {
      // Degraded-local fallback: catch all errors and record the event
      configuredAdapter = null;
      options?.onFallback?.("initializePersistence", err);
    }
  })();

  initializationPromise = promise;
  await promise;
  // Clear after completion so subsequent calls don't wait again
  initializationPromise = null;
}
