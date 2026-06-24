/**
 * Production fallback sink — safe console.warn + CustomEvent dispatch
 * + minimal network transport to the internal Next.js Route Handler.
 *
 * This module provides a deliberately tiny, client-safe hook that:
 * 1. Logs fallback events via console.warn (guarded/sanitized)
 * 2. Dispatches a `persistence:fallback` CustomEvent on globalThis so
 *    production hosts can subscribe without adding network/service dependencies.
 * 3. POSTs the sanitized payload to a relative Next.js Route Handler
 *    (`/api/persistence/fallback`) via `navigator.sendBeacon` (with
 *    `fetch({ keepalive: true })` as a fallback) so the event is
 *    observable in production logs / future telemetry plumbing.
 *
 * No service-role or non-public data is included. The endpoint is
 * a relative URL and the payload is a strict, sanitized shape.
 *
 * @module persistence/fallback-sink
 */

import {
  DEFAULT_FALLBACK_ENDPOINT,
  FALLBACK_PAYLOAD_BOUNDS,
  type FallbackEventPayload,
  type FallbackAdapterKind,
} from "./fallback-event";

/**
 * Maximum length of the sanitized error summary on the wire. Mirrors
 * `FALLBACK_PAYLOAD_BOUNDS.errorSummaryMaxLength` so the sink never emits
 * a string the route would reject. Sourced from the shared contract.
 */
const MAX_ERROR_SUMMARY_LENGTH = FALLBACK_PAYLOAD_BOUNDS.errorSummaryMaxLength;

/** Fixed sentinel used when a non-Error input cannot be safely stringified. */
const UNKNOWN_FALLBACK_REASON = "unknown-fallback-reason";

/** Payload for the `persistence:fallback` CustomEvent. */
export interface PersistenceFallbackEventDetail {
  /** Method name that triggered the fallback. */
  readonly method: string;
  /** Sanitized error summary (no secrets). */
  readonly errorSummary: string;
  /** ISO timestamp of the event. */
  readonly timestamp: string;
}

/** Options for `createProductionFallbackSink`. */
export interface CreateFallbackSinkOptions {
  /**
   * Override the endpoint. Defaults to `/api/persistence/fallback`.
   * Must be a relative URL or same-origin absolute URL — no env-derived
   * endpoints, no external services.
   */
  readonly endpoint?: string;
  /** Whether a Supabase Auth session is active. Defaults to `false`. */
  readonly sessionActive?: boolean;
  /** Kind of adapter that triggered the fallback, if known. */
  readonly adapterKind?: FallbackAdapterKind;
}

/**
 * Minimal subset of `navigator` the sink depends on. Pulled out as a
 * type so tests can mock it without depending on DOM lib internals.
 */
interface NavigatorLike {
  readonly sendBeacon?: (url: string, data: string) => boolean;
}

function getNavigator(): NavigatorLike | undefined {
  const nav = (globalThis as { navigator?: NavigatorLike }).navigator;
  return nav;
}

/**
 * Truncate and stringify an arbitrary error value into a safe, brief
 * summary suitable for a sanitized payload. Never throws.
 *
 * For non-Error, non-string inputs the function uses `String(error)`
 * instead of `JSON.stringify` to avoid leaking the object's internal
 * structure (e.g. `{ ok: false, reason: "rls-denial" }` would otherwise
 * expose the reason verbatim onto the wire). `String()` yields
 * `"[object Object]"` for plain objects, which is short, stable, and
 * contains no internal keys or values.
 *
 * If `String()` throws (e.g. Symbol) or yields a pathologically long
 * result, the function returns the fixed sentinel `unknown-fallback-reason`
 * — never the raw object state.
 */
export function sanitizeErrorSummary(error: unknown): string {
  let raw: string;
  if (error instanceof Error) {
    raw = error.message || error.name || "Error";
  } else if (typeof error === "string") {
    raw = error;
  } else {
    let candidate: string;
    try {
      candidate = String(error);
    } catch {
      candidate = UNKNOWN_FALLBACK_REASON;
    }
    if (candidate.length > MAX_ERROR_SUMMARY_LENGTH) {
      candidate = UNKNOWN_FALLBACK_REASON;
    }
    raw = candidate;
  }
  if (raw.length > MAX_ERROR_SUMMARY_LENGTH) {
    // Slice to leave room for the ellipsis so the final string is exactly
    // MAX_ERROR_SUMMARY_LENGTH chars and stays inside the route's length cap.
    raw = raw.slice(0, MAX_ERROR_SUMMARY_LENGTH - 1) + "…";
  }
  return raw;
}

/**
 * Build a strict `FallbackEventPayload` from a method + error pair.
 * Exported for tests and re-use.
 */
export function buildFallbackPayload(
  method: string,
  error: unknown,
  options: Pick<CreateFallbackSinkOptions, "sessionActive" | "adapterKind">
): FallbackEventPayload {
  return {
    method,
    errorSummary: sanitizeErrorSummary(error),
    timestamp: new Date().toISOString(),
    sessionActive: options.sessionActive ?? false,
    adapterKind: options.adapterKind ?? "unknown",
  };
}

/**
 * Dispatch the payload over the network using `navigator.sendBeacon`
 * (preferred — survives page unload) with `fetch({ keepalive: true })`
 * as a fallback. Never throws; returns `true` if the message was
 * accepted by the transport.
 */
function sendNetwork(endpoint: string, body: string): boolean {
  // Try sendBeacon first
  try {
    const nav = getNavigator();
    if (nav?.sendBeacon) {
      const accepted = nav.sendBeacon(endpoint, body);
      if (accepted) {
        return true;
      }
      // sendBeacon returns false when the payload is too big or the
      // user agent declines. Fall through to fetch.
    }
  } catch {
    // Some environments throw on sendBeacon — fall through to fetch.
  }

  // Fallback: fetch with keepalive
  try {
    const fetchFn = (globalThis as { fetch?: typeof fetch }).fetch;
    if (typeof fetchFn !== "function") {
      return false;
    }
    const promise = fetchFn(endpoint, {
      method: "POST",
      body,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    });
    // Swallow any eventual rejection — the sink is fire-and-forget.
    if (promise && typeof promise.catch === "function") {
      promise.catch(() => undefined);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a production fallback sink that:
 * - logs the event via `console.warn` (sanitized),
 * - dispatches a `persistence:fallback` CustomEvent on `globalThis`,
 * - POSTs the sanitized payload to the internal Next.js Route Handler
 *   via `navigator.sendBeacon` (with `fetch({ keepalive: true })` fallback).
 *
 * Safe for client-side use: only logs the method name and a sanitized
 * error summary. No secrets, no service_role, no non-public env data.
 * The endpoint is configurable but defaults to a relative same-origin URL.
 *
 * Production hosts can subscribe via:
 * ```ts
 * window.addEventListener("persistence:fallback", (e) => {
 *   const { method, errorSummary, timestamp } = e.detail;
 *   // Local listeners can react here; network transport is also wired.
 * });
 * ```
 *
 * @returns A callback suitable for `SelectorConfig.onFallback`.
 */
export function createProductionFallbackSink(
  options: CreateFallbackSinkOptions = {}
): (method: string, error: unknown) => void {
  const endpoint = options.endpoint ?? DEFAULT_FALLBACK_ENDPOINT;
  const sessionActive = options.sessionActive ?? false;
  const adapterKind: FallbackAdapterKind = options.adapterKind ?? "unknown";

  return (method: string, error: unknown) => {
    // Sanitize: only log the method name and a brief error summary.
    const errorSummary = sanitizeErrorSummary(error);

    // 1. Console warning (guarded/sanitized) — non-test fallback for dev visibility.
    console.warn(
      `[persistence:fallback] ${method} — ${errorSummary}`
    );

    // 2. Dispatch CustomEvent so production hosts can subscribe locally.
    try {
      const timestamp = new Date().toISOString();
      const detail: PersistenceFallbackEventDetail = {
        method,
        errorSummary,
        timestamp,
      };
      const event = new CustomEvent("persistence:fallback", { detail });
      // Use globalThis for cross-environment compatibility (browser, Node 18+).
      globalThis.dispatchEvent(event);
    } catch {
      // Silently ignore if CustomEvent or dispatchEvent is unavailable
      // (e.g., older Node without globalThis.dispatchEvent).
    }

    // 3. Network transport — POST the sanitized payload to the internal
    //    Next.js Route Handler so the event is observable in production
    //    logs / future telemetry plumbing. Fire-and-forget.
    const payload = buildFallbackPayload(method, error, {
      sessionActive,
      adapterKind,
    });
    try {
      sendNetwork(endpoint, JSON.stringify(payload));
    } catch {
      // Sink must never throw.
    }
  };
}
