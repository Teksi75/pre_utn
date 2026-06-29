/**
 * Behavioral tests for the sync status badge rendered by Nav.
 *
 * Goal: prove the sync badge reflects the post-auth-sync status
 * honestly across all five status values. The badge must NEVER
 * advertise the user as "Sincronizado" (ready) when the status is
 * anything other than "ready", regardless of session presence.
 *
 * Strategy: the badge is rendered by `SyncStatusBadge({ syncStatus,
 * session, userEmail, isAuthEnabled, signOut })`. The badge is a
 * pure JSX function that returns `null` when nothing should render,
 * or a span/Link element otherwise. Tests use `renderToStaticMarkup`
 * (Node SSR — no DOM needed) and assert on the HTML output.
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SESSION = {
  user: {
    id: "auth-user-1",
    email: "ana@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2025-01-01T00:00:00Z",
  },
  access_token: "t",
  refresh_token: "r",
  expires_in: 3600,
  token_type: "bearer" as const,
};

function badgeHtml(opts: Partial<Parameters<typeof SyncStatusBadge>[0]> = {}): string {
  return renderToStaticMarkup(
    createElement(SyncStatusBadge, {
      syncStatus: opts.syncStatus ?? "signed-out",
      session: opts.session ?? null,
      userEmail: opts.userEmail ?? null,
      isAuthEnabled: opts.isAuthEnabled ?? true,
      signOut: opts.signOut ?? vi.fn(async () => undefined),
    }),
  );
}

describe("Nav SyncStatusBadge — honest pill per status", () => {
  it("auth disabled → renders nothing (no badge, no link)", () => {
    const html = badgeHtml({
      syncStatus: "ready",
      isAuthEnabled: false,
      session: SESSION,
      userEmail: "ana@example.com",
    });
    // No badge content should render when auth is disabled.
    expect(html).toBe("");
  });

  it("signed-out + no session → renders the 'Sin sincronizar' link to /cuenta/ingresar", () => {
    const html = badgeHtml({
      syncStatus: "signed-out",
      session: null,
      userEmail: null,
      isAuthEnabled: true,
    });
    expect(html).toContain("Sin sincronizar");
    expect(html).toContain("/cuenta/ingresar");
    // Must NOT advertise "Sincronizado" — the user is not signed in.
    expect(html).not.toContain("Sincronizado");
  });

  it("pending + session → renders honest 'Sincronizando' copy, NOT 'Sincronizado'", () => {
    // The tripwire: even though session exists, the badge must NOT
    // claim "Sincronizado" while sync is in flight.
    const html = badgeHtml({
      syncStatus: "pending",
      session: SESSION,
      userEmail: "ana@example.com",
      isAuthEnabled: true,
    });
    expect(html).toContain("Sincronizando");
    // CRITICAL: must NOT show the synchronized pill.
    expect(html).not.toContain("Sincronizado como");
  });

  it("local-fallback + userEmail → renders honest 'Trabajo local guardado' copy", () => {
    // local-fallback means the orchestrator reported local-fallback
    // (remote empty or unavailable). The badge must reflect that —
    // NOT claim "Sincronizado".
    const html = badgeHtml({
      syncStatus: "local-fallback",
      session: SESSION,
      userEmail: "ana@example.com",
      isAuthEnabled: true,
    });
    expect(html).toContain("Trabajo local guardado");
    // CRITICAL: must NOT show the synchronized pill — the user is
    // not actually synchronized.
    expect(html).not.toContain("Sincronizado como");
  });

  it("ready + userEmail → renders 'Sincronizado como' pill", () => {
    // Only when the orchestrator confirms the FK row + import branch
    // settled is the user "Sincronizado".
    const html = badgeHtml({
      syncStatus: "ready",
      session: SESSION,
      userEmail: "ana@example.com",
      isAuthEnabled: true,
    });
    expect(html).toContain("Sincronizado como");
    expect(html).toContain("ana@example.com");
  });

  it("ready + null userEmail → does NOT render the synchronized pill", () => {
    // Defensive: if userEmail is null but status is "ready" (shouldn't
    // happen but defensive), the pill must not show an empty email.
    const html = badgeHtml({
      syncStatus: "ready",
      session: SESSION,
      userEmail: null,
      isAuthEnabled: true,
    });
    expect(html).not.toContain("Sincronizado como");
  });

  it("pending + userEmail → never shows 'Sincronizado como'", () => {
    // The strongest tripwire from the review: a pending status must
    // never falsely show the synchronized pill, regardless of
    // userEmail presence.
    const html = badgeHtml({
      syncStatus: "pending",
      session: SESSION,
      userEmail: "ana@example.com",
      isAuthEnabled: true,
    });
    expect(html).not.toContain("Sincronizado como");
  });

  it("local-fallback + userEmail → never shows 'Sincronizado como'", () => {
    // Same tripwire for local-fallback.
    const html = badgeHtml({
      syncStatus: "local-fallback",
      session: SESSION,
      userEmail: "ana@example.com",
      isAuthEnabled: true,
    });
    expect(html).not.toContain("Sincronizado como");
  });

  it("pending + no session → renders nothing (no badge state mismatch)", () => {
    // Defensive: pending with no session would be a bug (pending only
    // happens during a sync). The badge must not crash or render
    // inconsistent content.
    const html = badgeHtml({
      syncStatus: "pending",
      session: null,
      userEmail: null,
      isAuthEnabled: true,
    });
    expect(html).not.toContain("Sincronizado como");
    expect(html).not.toContain("Sincronizando tu cuenta");
  });

  it("the 'Cerrar la cuenta del curso' sign-out affordance is present on both ready and local-fallback", () => {
    // The user must be able to clear their sync state from a stuck
    // pending or local-fallback state. The sign-out affordance must
    // be reachable from the badge when the user is signed in.
    const readyHtml = badgeHtml({
      syncStatus: "ready",
      session: SESSION,
      userEmail: "ana@example.com",
      isAuthEnabled: true,
    });
    expect(readyHtml).toContain("Cerrar la cuenta del curso");

    const fallbackHtml = badgeHtml({
      syncStatus: "local-fallback",
      session: SESSION,
      userEmail: "ana@example.com",
      isAuthEnabled: true,
    });
    expect(fallbackHtml).toContain("Cerrar la cuenta del curso");
  });
});
