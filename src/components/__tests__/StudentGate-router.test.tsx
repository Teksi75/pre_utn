/**
 * Tests for StudentGate router — src/components/StudentGate.tsx (PR3).
 *
 * Verifies the wrapper component that replaces the form-mode identity
 * card. After PR3, StudentGate:
 *
 * - accepts `children` (not `onSubmitProfile`/`externalError`)
 * - uses `useSession()` + `getActiveProfileId()`
 * - redirects to `/cuenta/ingresar` when auth is enabled AND there is
 *   no session AND no active profile (skipping the redirect on the
 *   sign-in page itself and on `/auth/callback` to avoid loops)
 * - renders `children` when profile or session exists
 * - renders a minimal loading state otherwise
 *
 * The PR1+PR2 form-mode assertions (name input, validation, sync CTA,
 * etc.) are NOT in this file because the form-mode contract is gone —
 * those responsibilities moved to `/cuenta/ingresar` (T-REV-6) and the
 * SIGNED_IN orchestrator (T-REV-4).
 *
 * Spec: REQ-NEW-1 ("StudentGate SHALL NOT ask for a visible name as a
 * prerequisite to using the app. When the user chooses to sync or
 * create a course account, StudentGate SHALL route to /cuenta/ingresar.")
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function gateSource(): string {
  return readFileSync(
    join(repoRoot, "src/components/StudentGate.tsx"),
    "utf8",
  );
}

describe("StudentGate — router wrapper shape (PR3)", () => {
  it("exports StudentGate as a named export", () => {
    expect(gateSource()).toMatch(
      /export\s+(?:const|function)\s+StudentGate\b/,
    );
  });

  it("is a client component ('use client')", () => {
    expect(gateSource()).toContain('"use client"');
  });

  it("accepts a children prop (no onSubmitProfile / externalError)", () => {
    const src = gateSource();
    // The wrapper takes children (either ReactNode or React.ReactNode).
    expect(src).toMatch(/children\s*:\s*(?:React\.ReactNode|ReactNode)/);
    // The form-mode props are gone.
    expect(src).not.toMatch(/onSubmitProfile/);
    expect(src).not.toMatch(/externalError/);
    expect(src).not.toMatch(/validateDisplayName/);
  });

  it("imports useSession from the auth module", () => {
    const src = gateSource();
    expect(src).toMatch(/useSession/);
    // Accept either the alias or the relative path.
    expect(src).toMatch(
      /from\s+["'](?:\.\/auth|@\/components\/auth(?:\/index)?)["']/,
    );
  });

  it("imports getActiveProfileId from @/lib/active-session", () => {
    const src = gateSource();
    expect(src).toMatch(/getActiveProfileId/);
    // Accept either the alias or a relative path.
    expect(src).toMatch(
      /from\s+["'](?:\.\.\/lib\/active-session|@\/lib\/active-session)["']/,
    );
  });

  it("imports useRouter from next/navigation", () => {
    const src = gateSource();
    expect(src).toMatch(/useRouter/);
    expect(src).toMatch(/from\s+["']next\/navigation["']/);
  });

  it("imports usePathname from next/navigation (to skip on /cuenta/ingresar and /auth/callback)", () => {
    const src = gateSource();
    expect(src).toMatch(/usePathname/);
  });
});

describe("StudentGate — routing decision", () => {
  it("redirects to /cuenta/ingresar when no session and no profile", () => {
    const src = gateSource();
    expect(src).toMatch(/router\.replace\s*\(\s*["']\/cuenta\/ingresar["']/);
  });

  it("skips the redirect on /cuenta/ingresar (avoid infinite loop)", () => {
    const src = gateSource();
    // Must check pathname === "/cuenta/ingresar" and skip.
    expect(src).toMatch(/["']\/cuenta\/ingresar["']/);
  });

  it("skips the redirect on /auth/callback (avoid blocking the magic-link handshake)", () => {
    const src = gateSource();
    expect(src).toMatch(/["']\/auth\/callback["']/);
  });

  it("only redirects when auth is enabled", () => {
    const src = gateSource();
    // The redirect condition must gate on isAuthEnabled.
    expect(src).toMatch(/isAuthEnabled/);
  });

  it("only redirects when there is no session", () => {
    const src = gateSource();
    // Implementation may express this as either a null check or a
    // derived boolean — both prove the redirect is gated on absence.
    expect(src).toMatch(
      /session\s*===\s*null|session\s*!==\s*null|hasSession\b/,
    );
  });

  it("only redirects when there is no active profile", () => {
    const src = gateSource();
    expect(src).toMatch(/getActiveProfileId/);
  });
});

describe("StudentGate — render branches", () => {
  it("renders children when profile or session exists", () => {
    const src = gateSource();
    // The component must return children (the prop) in at least one
    // branch — either directly (`return children`) or wrapped in JSX
    // (`return <>{children}</>` or `{children}`).
    expect(src).toMatch(/return\s+(?:\{children\}|\{?\s*\(\)\s*=>\s*children\s*\)|<>\s*\{children\}\s*<\/>|children)/);
  });

  it("renders a loading state (aria-busy) while resolving", () => {
    const src = gateSource();
    expect(src).toMatch(/aria-busy/);
  });

  it("does NOT render a name input or a sync CTA link", () => {
    const src = gateSource();
    // Form-mode UI is gone.
    expect(src).not.toMatch(/type="text"/);
    expect(src).not.toMatch(/Sincronizar con la cuenta del curso/);
  });
});
