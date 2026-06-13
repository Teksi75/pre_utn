/**
 * Tests for StudentSwitcher component — src/components/home/StudentSwitcher.tsx
 *
 * Source-inspection tests verify:
 * - Lists existing profiles
 * - Allows picking one or creating new
 * - No delete/edit actions
 * - Forbidden language
 * - Correct useActiveStudent wiring
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function switcherSource(): string {
  return readFileSync(
    join(repoRoot, "src/components/home/StudentSwitcher.tsx"),
    "utf8",
  );
}

describe("StudentSwitcher — source structure", () => {
  it("is a client component", () => {
    const src = switcherSource();
    expect(src).toContain('"use client"');
  });

  it("imports useActiveStudent from hooks", () => {
    const src = switcherSource();
    expect(src).toContain("useActiveStudent");
  });

  it("imports StudentProfile type", () => {
    const src = switcherSource();
    expect(src).toMatch(/import.*StudentProfile/);
  });

  it("accepts an onClose callback prop", () => {
    const src = switcherSource();
    expect(src).toMatch(/onClose\s*\??\s*:\s*\(\s*\)\s*=>\s*void/);
  });

  it("calls switchTo when a profile is selected", () => {
    const src = switcherSource();
    expect(src).toContain("switchTo(");
  });

  it("calls createAndActivate when creating a new profile", () => {
    const src = switcherSource();
    expect(src).toContain("createAndActivate(");
  });
});

describe("StudentSwitcher — lists existing profiles", () => {
  it("maps over the profiles array to list them", () => {
    const src = switcherSource();
    // Must iterate over profiles to render each one
    expect(src).toMatch(/profiles\.map\s*\(/);
  });

  it("renders each profile's displayName", () => {
    const src = switcherSource();
    // Must show the student's name in the list
    expect(src).toMatch(/displayName/);
  });
});

describe("StudentSwitcher — no delete functionality", () => {
  // Strip comments and string literals before checking for delete words
  // to avoid false positives from documentation and identifiers.
  function cleanSource(source: string): string {
    return source
      .replace(/\/\/[^\n]*/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/"[^"]*"/g, "")
      .replace(/'[^']*'/g, "");
  }

  const FORBIDDEN_DELETE = [
    "Eliminar",
    "Borrar",
    "delete",
    "remove",
    "destruir",
  ];

  for (const word of FORBIDDEN_DELETE) {
    it(`does NOT contain deletion action '${word}'`, () => {
      const src = switcherSource();
      const cleaned = cleanSource(src);
      expect(cleaned.toLowerCase()).not.toContain(word.toLowerCase());
    });
  }
});

describe("StudentSwitcher — no forbidden language", () => {
  const FORBIDDEN = [
    "login",
    "admin",
    "email",
    "contraseña",
    "avatar",
    "Supabase",
    "Docente",
    "docente",
    "password",
  ];

  function extractText(source: string): string {
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

  for (const word of FORBIDDEN) {
    it(`does NOT contain '${word}'`, () => {
      const src = switcherSource();
      const text = extractText(src);
      expect(text).not.toContain(word.toLowerCase());
    });
  }
});

describe("StudentSwitcher — close behavior", () => {
  it("calls onClose after switching profile", () => {
    const src = switcherSource();
    // After switchTo, onClose should be called
    expect(src).toContain("onClose");
    expect(src).toMatch(/onClose\s*\(\s*\)/);
  });

  it("calls onClose after creating a new profile", () => {
    // Strip comments to avoid matching JSDoc
    function cleanSrc(s: string) {
      return s
        .replace(/\/\/[^\n]*/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");
    }
    const src = switcherSource();
    const cleaned = cleanSrc(src);
    // handleCreate function body contains the creation logic
    const handleCreateIdx = cleaned.indexOf("handleCreate");
    expect(handleCreateIdx).toBeGreaterThan(0);
    // Extract a larger region covering the full handleCreate body
    const region = cleaned.slice(handleCreateIdx, handleCreateIdx + 500);
    expect(region).toMatch(/onClose\s*\(\s*\)/);
  });

  it("has a cancel/close button", () => {
    const src = switcherSource();
    // Must have a way to close without switching
    expect(src).toMatch(/cerrar|Cancelar|volver|Salir/i);
  });
});
