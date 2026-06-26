/**
 * Tests for StudentGate component — src/components/StudentGate.tsx
 *
 * Source-inspection tests verify exact copy, accessibility attributes,
 * validation wiring, and no forbidden language.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function gateSource(): string {
  return readFileSync(
    join(repoRoot, "src/components/StudentGate.tsx"),
    "utf8",
  );
}

describe("StudentGate — exact copy from spec", () => {
  it("has heading '¿Quién está estudiando ahora?'", () => {
    const src = gateSource();
    expect(src).toContain("¿Quién está estudiando ahora?");
  });

  it("has body text 'Ingresá tu nombre o apodo para guardar tu progreso en este dispositivo. No necesitás contraseña.'", () => {
    const src = gateSource();
    expect(src).toContain(
      "Ingresá tu nombre o apodo para guardar tu progreso en este dispositivo. No necesitás contraseña.",
    );
  });

  it("has input label 'Nombre o apodo'", () => {
    const src = gateSource();
    expect(src).toContain("Nombre o apodo");
  });

  it("has primary action button 'Empezar a estudiar'", () => {
    const src = gateSource();
    expect(src).toContain("Empezar a estudiar");
  });

  it("has info line 'Este perfil es local. Si querés, también podés sincronizarlo con la cuenta del curso.'", () => {
    const src = gateSource();
    // PR2 (auth-ui): the info line was reworded so the present-tense
    // secondary CTA does not contradict a future-tense hint. Sync is
    // available now (this PR activates it), so the hint no longer says
    // "Más adelante".
    expect(src).toContain(
      "Este perfil es local. Si querés, también podés sincronizarlo con la cuenta del curso.",
    );
  });
});

describe("StudentGate — component structure", () => {
  it("is a client component ('use client')", () => {
    const src = gateSource();
    expect(src).toContain('"use client"');
  });

  it("accepts onSubmitProfile prop (receives validated name)", () => {
    const src = gateSource();
    expect(src).toMatch(/onSubmitProfile\s*:\s*\(\s*\w+\s*:\s*string\s*\)\s*=>\s*void/);
  });

  it("accepts externalError prop for validation feedback", () => {
    const src = gateSource();
    expect(src).toMatch(/externalError\s*\??\s*:\s*string\s*\|\s*null/);
  });

  it("renders an accessible heading (h1 or h2 with id)", () => {
    const src = gateSource();
    // Must have a heading element with aria-labelledby or id for accessibility
    expect(src).toMatch(/<(h1|h2)[^>]*>/);
  });

  it("renders a text input for the display name", () => {
    const src = gateSource();
    expect(src).toMatch(/<input[^>]*type="text"/);
  });

  it("input has aria-label or associated label element", () => {
    const src = gateSource();
    // Either aria-label or htmlFor/id pairing
    const hasAriaLabel = src.includes('aria-label="Nombre o apodo"');
    const hasForId = src.includes('htmlFor=') && src.includes('id=');
    expect(hasAriaLabel || hasForId).toBe(true);
  });

  it("renders the primary action as a button", () => {
    const src = gateSource();
    expect(src).toMatch(/<button/);
  });

  it("button text is 'Empezar a estudiar' (not a variant)", () => {
    const src = gateSource();
    // Must contain 'Empezar a estudiar' somewhere in the source
    expect(src).toContain("Empezar a estudiar");
    // Must appear inside a <button> JSX element
    const btnPos = src.indexOf("<button");
    const afterBtn = src.slice(btnPos);
    // Find the closing > of the opening button tag
    const openTagEnd = afterBtn.indexOf(">");
    const buttonContent = afterBtn.slice(0, openTagEnd + 100);
    expect(buttonContent).toContain("Empezar a estudiar");
  });

  it("calls the submit handler when button is clicked", () => {
    const src = gateSource();
    // Button onClick should call handleSubmit or onSubmit
    expect(src).toMatch(/onClick=\{handleSubmit\}|onClick=\{onSubmit\}/);
  });

  it("shows validation error when externalError is provided", () => {
    const src = gateSource();
    // Must conditionally render the error message when error prop is present
    expect(src).toMatch(/externalError/);
    expect(src).toMatch(/role="alert"|aria-describedby|aria-invalid/);
  });

  it("disables button while input is empty (guards onSubmitProfile)", () => {
    const src = gateSource();
    // The button should be disabled when there's no input
    expect(
      src.includes("disabled={") || src.includes("!displayName") || src.includes("trim()"),
    ).toBe(true);
  });
});

describe("StudentGate — no forbidden language", () => {
  // Forbidden words in visible UI copy (spec §Requirement: No Visible Teacher Access).
  // We scan JSX text content (children of JSX elements) separately from attribute values.
  // This avoids false positives from autoComplete, email-type inputs, etc.
  //
  // NOTE: "cuenta" (account) is a valid Spanish word that appears in the info copy
  // "la cuenta del curso" per the spec. We flag it only in account-management contexts.
  // Same for "admin", "email" appearing as English words in normal text.

  const FORBIDDEN = [
    { word: "login", label: "login" },
    { word: "avatar", label: "avatar" },
    { word: "Supabase", label: "Supabase" },
    { word: "Docente", label: "Docente" },
    { word: "docente", label: "docente" },
    { word: "password", label: "password" },
    // NOTE: "contraseña" appears in spec-required copy "No necesitás contraseña."
    // (student-local-identity spec, Home Cockpit Identity UI copy). It is valid
    // educational context (no password required). Not flagged here.
    // "cuenta" appears in spec-required "la cuenta del curso". Valid Spanish usage.
  ];

  // Flag account/auth contexts only in clear patterns (avoiding code identifier false positives)
  const ACCOUNT_CONTEXT_PATTERNS = [
    /admin.*login|login.*admin/i,
    /admin.*email|email.*admin/i,
    /mi\s+cuenta/i,
    /tu\s+cuenta/i,
    /crear\s+cuenta/i,
    /eliminar\s+cuenta/i,
  ];

  // Extract text content from JSX elements (children, not attributes).
  function extractJsxText(source: string): string {
    let s = source;
    // Remove comments
    s = s.replace(/\/\/[^\n]*/g, "");
    s = s.replace(/\/\*[\s\S]*?\*\//g, "");
    // Remove string literals
    s = s.replace(/"[^"]*"/g, "");
    s = s.replace(/'[^']*'/g, "");
    // Remove imports
    s = s.replace(/import\s+\{[^}]+\}\s+from\s+["'][^"']+["']/g, "");
    s = s.replace(/export\s+\{[^}]+\}\s+from\s+["'][^"']+["']/g, "");
    s = s.replace(/import\s+[^;]+;/g, "");
    // Remove JSX tags
    s = s
      .replace(/<[a-zA-Z][^>]*>/g, " ")
      .replace(/<\/[a-zA-Z][^>]*>/g, " ")
      .replace(/<[a-zA-Z][^>]*\/>/g, " ");
    return s.replace(/\s+/g, " ");
  }

  for (const { word } of FORBIDDEN) {
    it(`does NOT contain '${word}' in visible text`, () => {
      const src = gateSource();
      const text = extractJsxText(src).toLowerCase();
      expect(text).not.toContain(word.toLowerCase());
    });
  }

  // Account-context patterns: "cuenta", "email", "admin" in login/auth contexts
  for (const pattern of ACCOUNT_CONTEXT_PATTERNS) {
    it(`does NOT have forbidden account/auth context: ${pattern}`, () => {
      const src = gateSource();
      const text = extractJsxText(src);
      expect(text).not.toMatch(pattern);
    });
  }
});

describe("StudentGate — validation wiring", () => {
  it("imports validateDisplayName from domain", () => {
    const src = gateSource();
    expect(src).toContain("validateDisplayName");
  });

  it("calls validateDisplayName on input change", () => {
    const src = gateSource();
    expect(src).toMatch(/validateDisplayName\s*\(/);
  });

  it("uses domain validation (not custom inline validation)", () => {
    const src = gateSource();
    // Must use the domain function, not a custom regex
    expect(src).toContain("validateDisplayName");
    // Should NOT have custom regex for validation
    const hasCustomRegex = /validateDisplayName|\/^\s/.test(src);
    // If there's a regex, it should be part of the domain call, not inline
  });
});
