/**
 * Tests for Nav student chip — src/components/Nav.tsx
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function navSource(): string {
  return readFileSync(join(repoRoot, "src/components/Nav.tsx"), "utf8");
}

describe("Nav — active student chip (PR2)", () => {
  it("imports useActiveStudent from hooks", () => {
    const src = navSource();
    expect(src).toContain("useActiveStudent");
  });

  it("shows 'Alumno activo: {displayName}' chip when student is active", () => {
    const src = navSource();
    expect(src).toContain("Alumno activo:");
    expect(src).toMatch(/student\.displayName|displayName/);
  });

  it("chip is conditional — only shown when student is not null", () => {
    const src = navSource();
    // Must have a conditional check for student
    expect(src).toMatch(/student\s*!==\s*null|student\s*\?/);
  });

  it("does NOT contain forbidden language (Docente, login, cuenta, admin)", () => {
    const src = navSource();
    const FORBIDDEN = ["Docente", "docente", "login", "admin", "email", "contraseña", "avatar", "Supabase"];
    for (const word of FORBIDDEN) {
      expect(src.toLowerCase()).not.toContain(word.toLowerCase());
    }
  });
});
