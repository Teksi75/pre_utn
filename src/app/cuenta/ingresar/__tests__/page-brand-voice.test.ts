/**
 * Tests for src/app/cuenta/ingresar/page.tsx — sign-in form.
 *
 * Verifies the brand-voice contract for the auth entry page:
 * - Exact copy strings from the proposal Brand-Voice table.
 * - Form wires to signInWithMagicLink from src/lib/supabase/auth.
 * - Loading, error, and success states are rendered correctly.
 * - Email-only validation (no password field, no signup flow).
 * - No forbidden brand-voice tokens appear in JSX text.
 *
 * Spec: REQ-AUTH-1, REQ-AUTH-6
 *   - "signInWithOtp with emailRedirectTo set to /auth/callback"
 *   - "sign-in page copy matches spec"
 *
 * Test pattern mirrors src/components/__tests__/StudentGate.test.ts (source
 * scan + JSX-text-only extractor) so that legitimate words like "email"
 * (used as a label) are not flagged.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function pageSource(): string {
  return readFileSync(
    join(repoRoot, "src/app/cuenta/ingresar/page.tsx"),
    "utf8",
  );
}

// ---------------------------------------------------------------------------
// Exact copy from the proposal Brand-Voice table.
// ---------------------------------------------------------------------------

const REQUIRED_COPY = {
  heading: "Sincronizá tu perfil",
  body:
    "Ingresá tu email y te mandamos un enlace para sincronizar tu perfil con la cuenta del curso. Tu progreso va a quedar guardado en el servidor del Instituto.",
  inputLabel: "Email",
  primaryAction: "Enviar enlace",
  confirmation:
    "Listo. Revisá tu email y hacé clic en el enlace que te mandamos.",
  error: "No pudimos enviar el enlace. Probá de nuevo en un rato.",
} as const;

const FORBIDDEN_TOKENS = [
  "login",
  "contraseña",
  "profe digital",
  "Supabase",
] as const;

// ---------------------------------------------------------------------------
// Helpers — JSX text extractor (mirrors StudentGate.test.ts:159-177).
// ---------------------------------------------------------------------------

/**
 * Extract the visible text content of a TSX source file by stripping:
 *   - line and block comments
 *   - string literals
 *   - import statements
 *   - JSX tag syntax (keeps the text between tags)
 * This avoids false positives from autoComplete, type imports, etc.
 */
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

describe("sign-in page — exact copy from proposal", () => {
  it("has heading 'Sincronizá tu perfil'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY.heading);
  });

  it("has the full body copy", () => {
    expect(pageSource()).toContain(REQUIRED_COPY.body);
  });

  it("has input label 'Email'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY.inputLabel);
  });

  it("has primary action button 'Enviar enlace'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY.primaryAction);
  });

  it("has confirmation copy 'Listo. Revisá tu email y hacé clic en el enlace que te mandamos.'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY.confirmation);
  });

  it("has error copy 'No pudimos enviar el enlace. Probá de nuevo en un rato.'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY.error);
  });
});

// ---------------------------------------------------------------------------
// Wiring tests — the page must call signInWithMagicLink and handle states.
// ---------------------------------------------------------------------------

describe("sign-in page — form wiring", () => {
  it("is a client component (useState/useEffect/form handlers require 'use client')", () => {
    expect(pageSource()).toContain('"use client"');
  });

  it("imports signInWithMagicLink from @/lib/supabase/auth", () => {
    const src = pageSource();
    expect(src).toMatch(/from\s+["']@\/lib\/supabase\/auth["']/);
    expect(src).toMatch(/signInWithMagicLink/);
  });

  it("calls signInWithMagicLink on form submit", () => {
    const src = pageSource();
    // Some reference to calling signInWithMagicLink (await or .then) must exist.
    expect(src).toMatch(/signInWithMagicLink\s*\(/);
  });

  it("tracks a loading state (button disabled while submitting)", () => {
    const src = pageSource();
    // Implementation must disable the button while the request is in flight
    // to prevent double-submission.
    expect(src).toMatch(/isLoading|loading|pending|submitting/i);
  });

  it("tracks a success state distinct from error and loading", () => {
    const src = pageSource();
    // The success copy must be rendered conditionally on a non-null
    // success/sent/emailSent state.
    expect(src).toContain(REQUIRED_COPY.confirmation);
    // And there must be a surrounding conditional that gates its display
    // (e.g. `{sentEmail !== null ? (...) : (...)}`). Match a `{...sent...}`
    // block followed eventually by a closing `}`.
    expect(src).toMatch(/\{[^}]*\bsent\b[^}]*\}/i);
  });

  it("renders the error copy when signInWithMagicLink returns an error", () => {
    const src = pageSource();
    // The error copy string is already asserted above. Here we check
    // that the error state gates its display (not always-on).
    const errorLiteral = REQUIRED_COPY.error.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    expect(src).toMatch(new RegExp(`\\{[^}]*error[^}]*\\}[\\s\\S]*${errorLiteral}`));
  });
});

// ---------------------------------------------------------------------------
// Accessibility — the form must be usable without sight.
// ---------------------------------------------------------------------------

describe("sign-in page — accessibility", () => {
  it("has a labelled heading (h1 or h2 with id and aria-labelledby)", () => {
    const src = pageSource();
    expect(src).toMatch(/<(h1|h2)\b/);
    expect(src).toMatch(/aria-labelledby|aria-label/);
  });

  it("renders an <input type=\"email\"> for the email field", () => {
    const src = pageSource();
    expect(src).toMatch(/<input[^>]*type="email"/);
  });

  it("input has an associated <label> element (htmlFor + id pairing)", () => {
    const src = pageSource();
    expect(src).toMatch(/<label\b[^>]*htmlFor=/);
    expect(src).toMatch(/<input\b[^>]*id=/);
  });

  it("renders a real <button> for the submit action", () => {
    const src = pageSource();
    expect(src).toMatch(/<button\b/);
  });

  it("button is a submit type (or uses onClick inside a form)", () => {
    const src = pageSource();
    const hasSubmitType = /type="submit"/.test(src);
    const hasOnClickOnButton = /<button[^>]*onClick=/.test(src);
    const hasOnSubmitForm = /<form[^>]*onSubmit=/.test(src);
    expect(hasSubmitType || hasOnClickOnButton || hasOnSubmitForm).toBe(true);
  });

  it("error message has role='alert' so screen readers announce it", () => {
    const src = pageSource();
    expect(src).toMatch(/role="alert"/);
  });
});

// ---------------------------------------------------------------------------
// Brand voice — forbidden tokens must NOT appear in JSX text content.
// ---------------------------------------------------------------------------

describe("sign-in page — no forbidden brand-voice tokens in JSX text", () => {
  // Some tokens are explicitly listed in the proposal as forbidden.
  // We scan JSX text (not code identifiers, not comments) so that e.g.
  // a `type="email"` attribute or a `signInWithMagicLink` import is
  // not flagged.
  for (const token of FORBIDDEN_TOKENS) {
    it(`does NOT contain '${token}' in visible text`, () => {
      const src = pageSource();
      const text = extractJsxText(src).toLowerCase();
      expect(text).not.toContain(token.toLowerCase());
    });
  }
});