/**
 * Next.js middleware — Supabase Auth token refresh.
 *
 * Runs before every matched request. The middleware creates a
 * `createServerClient` per request (as required by @supabase/ssr — never
 * share across requests), reads cookies from the incoming request, and
 * writes refreshed cookies back onto the outgoing response. The actual
 * refresh happens implicitly when `auth.getUser()` validates the session:
 * if the access token is expired but a valid refresh token is present,
 * Supabase refreshes the session and surfaces the new cookies via the
 * `cookies.setAll` callback.
 *
 * If env vars are missing, the middleware becomes a no-op passthrough so
 * the app still works in local-only mode (no auth, local persistence).
 *
 * Spec: REQ-AUTH-2 — "src/middleware.ts MUST create a createServerClient
 * per request to refresh tokens and write cookies."
 *
 * Matcher: excludes static assets so the middleware does not run for
 * images, JS bundles, or favicons.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js middleware handler — refreshes Supabase Auth tokens on every
 * matched request, then passes through with NextResponse.next().
 *
 * @param request - The incoming NextRequest.
 * @returns A NextResponse that continues to the page; carries any
 *          refreshed auth cookies.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Local-only passthrough: no env vars → no client → just continue.
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  // Per @supabase/ssr requirements, create a fresh client per request and
  // wire getAll/setAll so cookie writes land on the outgoing response.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Apply to both the request (so downstream handlers see fresh
        // cookies) and the response (so the browser persists them).
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() validates the session and triggers refresh if needed.
  // Errors are caught and ignored — a bad refresh just means the user
  // will need to sign in again on the client. We don't block the page.
  await supabase.auth.getUser().catch(() => undefined);

  return response;
}

/**
 * Matcher — exclude Next.js static assets and the favicon so the
 * middleware does not run on every image, JS chunk, or icon request.
 *
 * Spec: REQ-AUTH-2 — "matcher excludes _next/static"
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (Next.js static files)
     * - _next/image (Next.js image optimization)
     * - favicon.ico (browser favicon)
     * - common static asset extensions (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};