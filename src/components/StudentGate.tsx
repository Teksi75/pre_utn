/**
 * StudentGate — global router wrapper that gates student content.
 *
 * After PR3, this component is a thin wrapper that ensures every
 * non-auth page renders only when the user has either:
 *
 *   (a) an active local profile, OR
 *   (b) an authenticated Supabase session.
 *
 * When neither holds AND auth is enabled, it redirects to
 * `/cuenta/ingresar`. The redirect is skipped on:
 *
 *   - `/cuenta/ingresar` itself (otherwise we'd loop),
 *   - `/auth/callback` (the magic-link handshake must run to set the
 *     session; redirecting there would break the round trip).
 *
 * The form-mode identity card (name input + sync CTA + validation) was
 * removed in PR3. Name collection now happens on `/cuenta/ingresar`
 * (T-REV-6); profile creation for the sign-in flow happens inside the
 * SIGNED_IN orchestrator (T-REV-4).
 *
 * Usage: wrap the children of `src/app/layout.tsx` in `<StudentGate>` so
 * every page gets the gate for free. Form-mode call sites in
 * `HomeNextStepClient.tsx`, `practice/page.tsx`, and `diagnostic/page.tsx`
 * no longer need to mount StudentGate themselves — the global wrapper
 * handles them.
 *
 * Spec: REQ-NEW-1 — "StudentGate SHALL NOT ask for a visible name as a
 * prerequisite to using the app. When the user chooses to sync or
 * create a course account, StudentGate SHALL route to /cuenta/ingresar."
 *
 * @module components/StudentGate
 */

"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "./auth";
import { getActiveProfileId } from "../lib/active-session";

export interface StudentGateProps {
  children: ReactNode;
}

/**
 * Routes the user to /cuenta/ingresar when no profile and no session
 * exist (and auth is enabled). Otherwise renders `children`.
 *
 * The component is side-effect only during the redirect branch — when
 * content can be shown, it returns `children` unchanged. While the
 * session is still loading, it shows a minimal loading state so the
 * gate does not flash between "no session" and "session present" mid
 * hydration.
 */
export function StudentGate({ children }: StudentGateProps): ReactNode {
  const { session, isLoading, isAuthEnabled } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const activeProfileId = getActiveProfileId();
  const hasSession = session !== null;
  const hasProfile = activeProfileId !== null;

  const isOnSignIn = pathname === "/cuenta/ingresar";
  const isOnCallback = pathname === "/auth/callback";

  useEffect(() => {
    // Skip when we're already on the destination or the auth handshake.
    if (isOnSignIn || isOnCallback) return;
    // No redirect when auth is disabled (env vars missing) — there is
    // no /cuenta/ingresar to point at.
    if (!isAuthEnabled) return;
    // Skip while we're still resolving the initial session — we'd
    // race against the SessionProvider's first getSession() call.
    if (isLoading) return;
    // The actual gate: no session AND no local profile → sign in.
    if (!hasSession && !hasProfile) {
      router.replace("/cuenta/ingresar");
    }
  }, [
    isAuthEnabled,
    isLoading,
    hasSession,
    hasProfile,
    isOnSignIn,
    isOnCallback,
    router,
  ]);

  // Skip redirect: render children immediately.
  if (isOnSignIn || isOnCallback) {
    return children;
  }

  // Auth disabled — never gate. Children render normally (local-only mode).
  if (!isAuthEnabled) {
    return children;
  }

  // Initial session still resolving — show a stable loading placeholder
  // so the gate doesn't flash between "no session" and "session present".
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-live="polite"
        className="flex items-center justify-center min-h-[40vh]"
      >
        <div className="animate-pulse text-sm text-[var(--color-brand-500)]">
          …
        </div>
      </div>
    );
  }

  // No session, no profile → effect will redirect; render nothing in
  // the meantime (avoids a flash of children before navigation).
  if (!hasSession && !hasProfile) {
    return (
      <div
        aria-busy="true"
        aria-live="polite"
        className="flex items-center justify-center min-h-[40vh]"
      >
        <div className="animate-pulse text-sm text-[var(--color-brand-500)]">
          …
        </div>
      </div>
    );
  }

  // Has profile OR session → render the actual app.
  return children;
}
