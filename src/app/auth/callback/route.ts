/**
 * GET /auth/callback — magic-link callback handshake.
 *
 * The Supabase magic-link email points at this route with a single-use
 * `?code=...` query parameter. The route:
 * 1. Reads `?code` from the URL.
 * 2. If the code is missing or env vars are missing, redirects to
 *    `/cuenta/ingresar` so the user can request a new link. Never throws.
 * 3. Otherwise, builds a `createServerClient` per request, calls
 *    `auth.exchangeCodeForSession(code)` to mint a session cookie, and
 *    redirects to `/cuenta` — the post-login landing.
 *
 * The route is intentionally tiny: it is a contract surface, not a sink.
 * Even when `exchangeCodeForSession` returns an error (expired code,
 * network blip, …) we still redirect to `/cuenta` rather than echo an
 * error back. The user can re-request a magic link from
 * `/cuenta/ingresar`.
 *
 * Spec: REQ-AUTH-1 — "valid callback code creates session" and
 * "missing callback code redirects safely".
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const POST_LOGIN_REDIRECT = "/cuenta";
const SIGN_IN_REDIRECT = "/cuenta/ingresar";

/**
 * GET handler — completes the Supabase magic-link round trip.
 *
 * @param request - The incoming NextRequest, carrying `?code` and any
 *                  cookies set by the SDK during the email-link click.
 * @returns A `NextResponse.redirect(...)` to either `/cuenta` (success
 *          or post-exchange-best-effort) or `/cuenta/ingresar` (missing
 *          code, missing env).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Safe default: any failure mode that prevents us from doing the
  // exchange hands the user back to the sign-in page. We never throw —
  // a thrown redirect would break the user's flow and leak internals.
  if (!code || code.length === 0) {
    return NextResponse.redirect(new URL(SIGN_IN_REDIRECT, request.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  /**
   * Use only the modern publishable key. The legacy
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY` env var was removed in PR3 (T-REV-9)
   * so a stale `.env` cannot ship an outdated credential to the browser
   * bundle.
   *
   * @deprecated `NEXT_PUBLIC_SUPABASE_ANON_KEY` is no longer accepted.
   * Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the current Supabase
   * SSR convention) and redeploy.
   */
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Local-only / env-not-configured path: no client, no exchange.
    return NextResponse.redirect(new URL(SIGN_IN_REDIRECT, request.url));
  }

  // Per @supabase/ssr requirements, create a fresh client per request
  // and wire cookie read/write to the request/response pair. The
  // SDK uses these to persist the freshly-exchanged session.
  let response = NextResponse.redirect(
    new URL(POST_LOGIN_REDIRECT, request.url),
  );

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Mirror the cookie writes on both the outgoing response (so
        // the browser persists the session) and a forwarded request
        // (so downstream server logic sees the fresh session).
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.redirect(
          new URL(POST_LOGIN_REDIRECT, request.url),
        );
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Best-effort: even if exchange fails (expired code, network blip),
  // we still redirect to /cuenta. The error is swallowed here; the
  // user can re-request a link from /cuenta/ingresar if their session
  // never lands.
  await supabase.auth.exchangeCodeForSession(code).catch(() => undefined);

  return response;
}