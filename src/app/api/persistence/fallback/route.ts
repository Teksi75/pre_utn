/**
 * POST /api/persistence/fallback — sanitized fallback event intake.
 *
 * The client persistence layer sends a minimal, sanitized payload here
 * whenever a persistence operation falls back to local storage. The
 * route validates the shape and returns 204 No Content on success.
 *
 * Hard rules:
 * - Accept only the strict `FallbackEventPayload` shape.
 * - Return 4xx (not 5xx) for malformed bodies — no server-side
 *   error leakage, no internal exception details to the client.
 * - Do NOT persist the payload to any store. This endpoint is an
 *   intake only; logging/aggregation is the host's responsibility.
 *   Keeping it intake-only avoids coupling the route to a database,
 *   keeps the surface area minimal, and respects the public-only /
 *   no-external-services constraint of the v0 scope.
 * - Do NOT echo the body back in the response.
 * - Do NOT include any secrets, PII, or full payloads in the request
 *   shape — see `FallbackEventPayload` in
 *   `@/lib/persistence/fallback-event`.
 *
 * The endpoint is intentionally tiny: it is a contract surface, not
 * a sink. Future telemetry centralization (if any) will replace this
 * file with a thin shim over a real telemetry backend, without
 * changing the client contract.
 */

import { NextResponse } from "next/server";
import { isFallbackEventPayload } from "@/lib/persistence/fallback-event";

/**
 * POST handler — accepts a sanitized `persistence:fallback` event.
 *
 * @param request - The incoming Next.js Request
 * @returns 204 No Content on valid payload; 400 Bad Request otherwise
 */
export async function POST(request: Request): Promise<NextResponse> {
  // 1. Parse JSON body. Reject non-JSON / malformed bodies with 400.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400 }
    );
  }

  // 2. Validate the strict payload shape. Reject missing/empty fields.
  if (!isFallbackEventPayload(body)) {
    return NextResponse.json(
      { error: "invalid_payload" },
      { status: 400 }
    );
  }

  // 3. Intake-only. No persistence, no logging of the body content,
  //    no PII. The route is a contract surface for future telemetry.
  return new NextResponse(null, { status: 204 });
}
