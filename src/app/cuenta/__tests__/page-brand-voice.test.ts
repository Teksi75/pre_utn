/**
 * Tests for src/app/cuenta/page.tsx — account stub.
 *
 * Verifies the brand-voice contract and behavior:
 * - Exact copy strings from the proposal Brand-Voice table.
 * - Renders sync status: `Sin sincronizar` (when signed out) /
 *   `Sincronizado como {email}` (when signed in).
 * - Sign-out button labeled `Cerrar la cuenta del curso` calls
 *   `useSession().signOut()`.
 * - No forbidden brand-voice tokens.
 *
 * Spec: REQ-AUTH-5, REQ-AUTH-6
 *   - "sign-out clears remote session"
 *   - "Nav badge and StudentGate CTA match spec"
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function pageSource(): string {
  return readFileSync(join(repoRoot, "src/app/cuenta/page.tsx"), "utf8");
}

const REQUIRED_COPY = {
  signedOut: "Sin sincronizar",
  signedIn: "Sincronizado como",
  signOutAction: "Cerrar la cuenta del curso",
} as const;

const FORBIDDEN_TOKENS = [
  "login",
  "contraseña",
  "profe digital",
  "Supabase",
  "Docente",
  "docente",
] as const;

// ---------------------------------------------------------------------------
// Helpers — JSX text extractor (mirrors StudentGate.test.ts:159-177).
// ---------------------------------------------------------------------------

function extractJsxText(source: string): string {
  let s = source;
  s = s.replace(/\/\/[^\n]*/g, "");
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");
  s = s.replace(/"[^"]*"/g, "");
  s = s.replace(/'[^']*'/g, "");
  s = s.replace(/import\s+\{[^}]+\}\s+from\s+["'][^"']+["']/g, "");
  s = s.replace(/export\s+\{[^}]+\}\s+from\s+["'][^"']+["']/g, "");
  s = s.replace(/import\s+[^;]+;/g, "");
  s = s
    .replace(/<[a-zA-Z][^>]*>/g, " ")
    .replace(/<\/[a-zA-Z][^>]*>/g, " ")
    .replace(/<[a-zA-Z][^>]*\/>/g, " ");
  return s.replace(/\s+/g, " ");
}

// ---------------------------------------------------------------------------
// Exact copy tests
// ---------------------------------------------------------------------------

describe("/cuenta — exact copy from proposal", () => {
  it("has signed-out indicator 'Sin sincronizar'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY.signedOut);
  });

  it("has signed-in indicator prefix 'Sincronizado como'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY.signedIn);
  });

  it("has sign-out button label 'Cerrar la cuenta del curso'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY.signOutAction);
  });
});

// ---------------------------------------------------------------------------
// Wiring tests
// ---------------------------------------------------------------------------

describe("/cuenta — wiring", () => {
  it("is a client component (useSession requires 'use client')", () => {
    expect(pageSource()).toContain('"use client"');
  });

  it("imports useSession from the auth barrel", () => {
    const src = pageSource();
    expect(src).toMatch(/from\s+["']@\/components\/auth["']/);
    expect(src).toMatch(/useSession/);
  });

  it("calls useSession to read session state", () => {
    const src = pageSource();
    // Either destructured from useSession() or directly used.
    expect(src).toMatch(/useSession\s*\(/);
  });

  it("reads session.user.email (or userEmail) to render sync status", () => {
    const src = pageSource();
    expect(src).toMatch(/userEmail|user\.email|session.*email/);
  });

  it("calls session.signOut() when the sign-out button is clicked", () => {
    const src = pageSource();
    // Look for signOut() invocation either via destructure or method call.
    expect(src).toMatch(/signOut\s*\(\s*\)/);
  });
});

// ---------------------------------------------------------------------------
// Brand voice — no forbidden tokens.
// ---------------------------------------------------------------------------

describe("/cuenta — no forbidden brand-voice tokens", () => {
  for (const token of FORBIDDEN_TOKENS) {
    it(`does NOT contain '${token}' in visible text`, () => {
      const text = extractJsxText(pageSource()).toLowerCase();
      expect(text).not.toContain(token.toLowerCase());
    });
  }
});