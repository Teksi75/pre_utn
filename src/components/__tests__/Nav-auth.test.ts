/**
 * Tests for Nav sync badge + sign-out — src/components/Nav.tsx
 *
 * Verifies the auth-aware wiring on the global Nav:
 * - `Sin sincronizar` indicator when auth is enabled but no session
 * - `Sincronizado como {email}` indicator when signed in
 * - `Cerrar la cuenta del curso` link/button when signed in
 * - Hides the badge entirely when auth is disabled (env vars missing)
 * - All previous Nav-student invariants still pass
 * - No forbidden brand-voice tokens in JSX text (excluding approved
 *   auth copy like `email`, `Sincronizado`, `cuenta`, `Cerrar`).
 *
 * Spec: REQ-AUTH-6 — "Nav badge and StudentGate CTA match spec"
 *
 * Test pattern: source scan + JSX-text-only extractor (mirrors the
 * existing StudentGate.test.ts pattern). The allowlist grows to admit
 * the new auth strings; the forbidden list keeps the same brand-voice
 * tripwires.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function navSource(): string {
  return readFileSync(join(repoRoot, "src/components/Nav.tsx"), "utf8");
}

// ---------------------------------------------------------------------------
// Helpers — JSX text extractor.
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
// Approved auth copy — must appear in JSX text.
// ---------------------------------------------------------------------------

describe("Nav — auth sync badge (PR2)", () => {
  it("imports useSession from the auth barrel", () => {
    const src = navSource();
    expect(src).toMatch(/useSession/);
    expect(src).toMatch(/from\s+["']@\/components\/auth["']/);
  });

  it("shows 'Sin sincronizar' indicator when auth is enabled but no session", () => {
    expect(navSource()).toContain("Sin sincronizar");
  });

  it("shows 'Sincronizado como' indicator prefix when signed in", () => {
    expect(navSource()).toContain("Sincronizado como");
  });

  it("renders the user email (or userEmail) for the sync status line", () => {
    const src = navSource();
    expect(src).toMatch(/userEmail|user\.email|session\..*email/);
  });

  it("renders 'Cerrar la cuenta del curso' sign-out button when signed in", () => {
    expect(navSource()).toContain("Cerrar la cuenta del curso");
  });

  it("calls session.signOut() on sign-out click", () => {
    const src = navSource();
    expect(src).toMatch(/signOut\s*\(\s*\)/);
  });

  it("hides the badge entirely when auth is disabled (env missing)", () => {
    const src = navSource();
    // The badge must be gated on isAuthEnabled from useSession.
    expect(src).toMatch(/isAuthEnabled/);
  });

  it("links 'Sin sincronizar' indicator to /cuenta/ingresar", () => {
    const src = navSource();
    // The indicator must be a Link to /cuenta/ingresar so users can click
    // through to sign in.
    expect(src).toMatch(/href\s*=\s*["']\/cuenta\/ingresar["']/);
  });
});

// ---------------------------------------------------------------------------
// Existing Nav-student invariants (active-student chip from PR1) still hold.
// ---------------------------------------------------------------------------

describe("Nav — active student chip (PR1 invariants preserved)", () => {
  it("imports useActiveStudent from hooks", () => {
    expect(navSource()).toContain("useActiveStudent");
  });

  it("shows 'Alumno activo: {displayName}' chip when student is active", () => {
    const src = navSource();
    expect(src).toContain("Alumno activo:");
    expect(src).toMatch(/student\.displayName|displayName/);
  });

  it("chip is conditional — only shown when student is not null", () => {
    expect(navSource()).toMatch(/student\s*!==\s*null|student\s*\?/);
  });
});

// ---------------------------------------------------------------------------
// Brand voice — allow approved auth copy, forbid generic tokens.
// ---------------------------------------------------------------------------

describe("Nav — no forbidden brand-voice tokens in JSX text", () => {
  // Generic tripwires that still apply.
  const FORBIDDEN = [
    "Docente",
    "docente",
    "login",
    "admin",
    "avatar",
    "profe digital",
    "Supabase",
    "contraseña",
  ];

  for (const word of FORBIDDEN) {
    it(`does NOT contain '${word}' in visible text`, () => {
      const text = extractJsxText(navSource()).toLowerCase();
      expect(text).not.toContain(word.toLowerCase());
    });
  }
});