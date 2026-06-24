/**
 * Shared payload contract for the `persistence:fallback` event.
 *
 * This module defines the shape of a sanitized fallback event so that
 * the client sink and the server route handler agree on a strict,
 * minimal schema. No secrets, no PII, no full payloads.
 *
 * Hard rules:
 * - Only public, sanitized fields.
 * - The client may send extra fields, but the server validates only
 *   these and ignores anything else.
 *
 * @module persistence/fallback-event
 */

/**
 * The kind of adapter that triggered the fallback event, if known.
 * - `supabase` — remote Supabase adapter failed
 * - `local` — local adapter failed (rare; usually a sign of corrupted state)
 * - `unknown` — adapter kind could not be determined
 * - `none` — no adapter was configured
 */
export type FallbackAdapterKind =
  | "supabase"
  | "local"
  | "unknown"
  | "none";

/**
 * The default relative URL the production fallback sink POSTs to.
 * Kept as a constant so tests can assert against it without re-typing.
 */
export const DEFAULT_FALLBACK_ENDPOINT = "/api/persistence/fallback" as const;

/**
 * Upper-bound length caps for the fields in `FallbackEventPayload`.
 * Enforced by `isFallbackEventPayload` and respected by `sanitizeErrorSummary`
 * so the wire payload never exceeds them. The caps are the single source of
 * truth for both client and server validation — exporting them avoids the
 * sink emitting a string the route would reject.
 */
export const FALLBACK_PAYLOAD_BOUNDS = {
  methodMaxLength: 64,
  errorSummaryMaxLength: 200,
  timestampMaxLength: 32,
} as const;

/**
 * Sanitized payload for a single fallback event.
 *
 * Required fields: `method`, `errorSummary`, `timestamp`.
 * Optional fields: `sessionActive`, `adapterKind` (helpful for triage).
 *
 * The shape is intentionally strict: every field is a primitive so the
 * route handler can validate without parsing complex structures.
 */
export interface FallbackEventPayload {
  /** Name of the persistence method that triggered the fallback. */
  readonly method: string;
  /** Brief, sanitized error summary (no stack, no PII). */
  readonly errorSummary: string;
  /** ISO timestamp captured at the moment of the event. */
  readonly timestamp: string;
  /** Whether a Supabase Auth session is currently active (false = anonymous). */
  readonly sessionActive?: boolean;
  /** Kind of adapter that produced the failure, if known. */
  readonly adapterKind?: FallbackAdapterKind;
}

/**
 * Validate a parsed JSON body against the minimal required shape of a
 * `FallbackEventPayload`. Used by the route handler to reject malformed
 * requests with a 4xx response.
 *
 * This is intentionally conservative: only the three required fields are
 * checked (plus length caps). Optional fields are accepted when present
 * and well-typed. Length caps are enforced here so a malicious or
 * accidental huge payload cannot reach the downstream sink.
 *
 * @param value - The parsed JSON body
 * @returns `true` if the value conforms to the required shape
 */
export function isFallbackEventPayload(value: unknown): value is FallbackEventPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.method === "string" &&
    obj.method.length > 0 &&
    obj.method.length <= FALLBACK_PAYLOAD_BOUNDS.methodMaxLength &&
    typeof obj.errorSummary === "string" &&
    obj.errorSummary.length > 0 &&
    obj.errorSummary.length <= FALLBACK_PAYLOAD_BOUNDS.errorSummaryMaxLength &&
    typeof obj.timestamp === "string" &&
    obj.timestamp.length > 0 &&
    obj.timestamp.length <= FALLBACK_PAYLOAD_BOUNDS.timestampMaxLength
  );
}
