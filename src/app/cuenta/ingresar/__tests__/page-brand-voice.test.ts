/**
 * Tests for src/app/cuenta/ingresar/page.tsx — sign-in form (PR3 variants).
 *
 * Verifies the brand-voice contract and wiring for the linking vs.
 * new-student variants:
 *
 * - **New-student variant** (no local progress): "Crear cuenta y empezar"
 *   with email + displayName fields and approved copy.
 * - **Linking variant** (local progress exists): "Vincular mi avance a una
 *   cuenta" with email only and approved copy.
 *
 * - Form wires to signInWithMagicLink from src/lib/supabase/auth.
 * - On submit (new-student only), displayName is stored in sessionStorage
 *   under `pre-utn.pendingName:{email}` so the SIGNED_IN orchestrator can
 *   pick it up (Option B in design §4).
 * - Loading, error, and success states are rendered correctly.
 * - No forbidden brand-voice tokens appear in JSX text.
 *
 * Spec: REQ-AUTH-1, REQ-AUTH-6, REQ-NEW-1, REQ-NEW-2b.
 *   - "signInWithOtp with emailRedirectTo set to /auth/callback"
 *   - "sign-in page copy matches spec"
 *   - "linking variant vs new-student variant"
 *   - "pendingName stored by email"
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
// Exact copy from the PR3 Brand-Voice table.
// ---------------------------------------------------------------------------

const REQUIRED_COPY_NEW_STUDENT = {
  heading: "Crear cuenta y empezar",
  body:
    "Usaremos tu email para guardar tu avance en la nube. No necesitás contraseña.",
  emailLabel: "Email",
  displayNameLabel: "Nombre visible o apodo",
  primaryAction: "Enviar enlace y empezar",
  aux: "Tu avance se guardará en tu cuenta. Este dispositivo conservará una copia local como respaldo.",
  confirmation:
    "Listo. Revisá tu email y hacé clic en el enlace que te mandamos.",
  error: "No pudimos enviar el enlace. Probá de nuevo en un rato.",
} as const;

const REQUIRED_COPY_LINKING = {
  heading: "Vincular mi avance a una cuenta",
  body:
    "Encontramos avance en este dispositivo. Podés vincularlo a tu cuenta para recuperarlo en otros dispositivos.",
  aux: "No se borrará el avance local.",
  primaryAction: "Enviar enlace para vincular avance",
} as const;

/**
 * Forbidden tokens that must NEVER appear in JSX text on this page.
 * The "source-only" tokens are checked against the whole source (less
 * JSDoc); the "JSX-text-only" tokens (`localStorage`, `remote/local`)
 * are checked against the JSX-text extractor so they remain available
 * in code identifiers/imports but never appear as rendered copy.
 */
const FORBIDDEN_TOKENS_SOURCE = [
  // PR3 additions (T-REV-10): tech jargon that must not leak.
  "Regla de seguridad",
  "RLS",
  "merge strategy",
  "overwrite",
] as const;

const FORBIDDEN_TOKENS_JSX_TEXT = [
  "login",
  "profe digital",
  "Supabase",
  // PR3 additions (T-REV-10): JSX-text only — fine in code identifiers
  // but never as rendered copy the student could read.
  "localStorage",
  "remote/local",
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
// New-student variant copy
// ---------------------------------------------------------------------------

describe("/cuenta/ingresar — new-student variant copy", () => {
  it("has heading 'Crear cuenta y empezar'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY_NEW_STUDENT.heading);
  });

  it("has the new-student body copy", () => {
    expect(pageSource()).toContain(REQUIRED_COPY_NEW_STUDENT.body);
  });

  it("has email field label 'Email'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY_NEW_STUDENT.emailLabel);
  });

  it("has displayName field label 'Nombre visible o apodo'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY_NEW_STUDENT.displayNameLabel);
  });

  it("has primary action 'Enviar enlace y empezar'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY_NEW_STUDENT.primaryAction);
  });

  it("has the new-student aux text", () => {
    expect(pageSource()).toContain(REQUIRED_COPY_NEW_STUDENT.aux);
  });
});

// ---------------------------------------------------------------------------
// Linking variant copy
// ---------------------------------------------------------------------------

describe("/cuenta/ingresar — linking variant copy", () => {
  it("has heading 'Vincular mi avance a una cuenta'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY_LINKING.heading);
  });

  it("has the linking body copy", () => {
    expect(pageSource()).toContain(REQUIRED_COPY_LINKING.body);
  });

  it("has the linking aux text 'No se borrará el avance local.'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY_LINKING.aux);
  });

  it("has primary action 'Enviar enlace para vincular avance'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY_LINKING.primaryAction);
  });
});

// ---------------------------------------------------------------------------
// Positive variant tests (T-REV-10) — both CTAs are present.
// ---------------------------------------------------------------------------

describe("/cuenta/ingresar — both variant CTAs present (T-REV-10)", () => {
  it("contains both 'Crear cuenta y empezar' and 'Vincular mi avance a una cuenta'", () => {
    const src = pageSource();
    expect(src).toContain(REQUIRED_COPY_NEW_STUDENT.heading);
    expect(src).toContain(REQUIRED_COPY_LINKING.heading);
  });
});

// ---------------------------------------------------------------------------
// Shared copy (both variants use these)
// ---------------------------------------------------------------------------

describe("/cuenta/ingresar — shared copy", () => {
  it("has confirmation copy 'Listo. Revisá tu email y hacé clic en el enlace que te mandamos.'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY_NEW_STUDENT.confirmation);
  });

  it("has error copy 'No pudimos enviar el enlace. Probá de nuevo en un rato.'", () => {
    expect(pageSource()).toContain(REQUIRED_COPY_NEW_STUDENT.error);
  });
});

// ---------------------------------------------------------------------------
// Wiring tests
// ---------------------------------------------------------------------------

describe("/cuenta/ingresar — form wiring", () => {
  it("is a client component", () => {
    expect(pageSource()).toContain('"use client"');
  });

  it("imports signInWithMagicLink from @/lib/supabase/auth", () => {
    const src = pageSource();
    expect(src).toMatch(/from\s+["']@\/lib\/supabase\/auth["']/);
    expect(src).toMatch(/signInWithMagicLink/);
  });

  it("calls signInWithMagicLink on form submit", () => {
    const src = pageSource();
    expect(src).toMatch(/signInWithMagicLink\s*\(/);
  });

  it("imports hasLocalProgress from @/lib/auth/has-local-progress", () => {
    const src = pageSource();
    expect(src).toMatch(/from\s+["']@\/lib\/auth\/has-local-progress["']/);
    expect(src).toMatch(/hasLocalProgress/);
  });

  it("stores displayName in sessionStorage on submit under pre-utn.pendingName:{email}", () => {
    const src = pageSource();
    // Must write to sessionStorage with the pendingName prefix.
    expect(src).toMatch(/sessionStorage\.setItem/);
    expect(src).toMatch(/pre-utn\.pendingName:/);
  });

  it("renders a loading skeleton while resolving the variant", () => {
    const src = pageSource();
    // The variant detection is async — must show a skeleton before it
    // resolves to avoid a UI flash between the new-student and linking
    // copy.
    expect(src).toMatch(/aria-busy|loading|skeleton|pending/i);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe("/cuenta/ingresar — accessibility", () => {
  it("renders an <input type=\"email\">", () => {
    const src = pageSource();
    expect(src).toMatch(/<input[^>]*type="email"/);
  });

  it("renders a real <button> for the submit action", () => {
    const src = pageSource();
    expect(src).toMatch(/<button\b/);
  });

  it("error message has role='alert'", () => {
    const src = pageSource();
    expect(src).toMatch(/role="alert"/);
  });

  it("input has an associated <label> element", () => {
    const src = pageSource();
    expect(src).toMatch(/<label\b[^>]*htmlFor=/);
  });
});

// ---------------------------------------------------------------------------
// Brand voice — forbidden tokens must NOT appear in source.
// ---------------------------------------------------------------------------

describe("/cuenta/ingresar — no forbidden brand-voice tokens (source scan, PR3)", () => {
  for (const token of FORBIDDEN_TOKENS_SOURCE) {
    it(`does NOT contain '${token}' in source code (outside JSDoc)`, () => {
      const src = pageSource();
      // Strip JSDoc blocks so the page's own documentation of forbidden
      // tokens is not flagged as a violation.
      const stripped = src.replace(/\/\*\*[\s\S]*?\*\//g, " ");
      expect(stripped.toLowerCase()).not.toContain(token.toLowerCase());
    });
  }
});

describe("/cuenta/ingresar — no forbidden brand-voice tokens (JSX text)", () => {
  for (const token of FORBIDDEN_TOKENS_JSX_TEXT) {
    it(`does NOT contain '${token}' in visible text`, () => {
      const src = pageSource();
      const text = extractJsxText(src).toLowerCase();
      expect(text).not.toContain(token.toLowerCase());
    });
  }
});
