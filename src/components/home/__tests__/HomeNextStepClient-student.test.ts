/**
 * Tests for modified HomeNextStepClient — src/components/home/HomeNextStepClient.tsx
 *
 * Source-inspection tests for PR2 + PR3 changes:
 * - Uses useActiveStudent hook
 * - Renders loading placeholder when no active profile (the global
 *   StudentGate in layout.tsx handles the redirect to /cuenta/ingresar).
 * - Renders active student chrome when profile exists.
 * - PR3: StudentGate is no longer mounted here directly.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function homeSource(): string {
  return readFileSync(
    join(repoRoot, "src/components/home/HomeNextStepClient.tsx"),
    "utf8",
  );
}

describe("HomeNextStepClient — student identity wiring (PR2 + PR3)", () => {
  it("imports useActiveStudent from hooks", () => {
    const src = homeSource();
    expect(src).toContain("useActiveStudent");
  });

  it("renders loading placeholder when student is null (PR3)", () => {
    const src = homeSource();
    // PR3: the form-mode StudentGate is gone — we render an aria-busy
    // placeholder while the global gate in layout.tsx redirects.
    expect(src).toMatch(/student\s*===\s*null/);
    expect(src).toMatch(/aria-busy/);
  });

  it("renders active student chrome when student exists", () => {
    const src = homeSource();
    expect(src).toMatch(/student\s*===\s*null|student\s*\?/);
    expect(src).toMatch(/displayName/);
  });

  it("warmly identifies the active student in the dashboard zone", () => {
    const src = homeSource();
    expect(src).toMatch(/HomeGreeting|student\.displayName|displayName/);
    expect(src).not.toContain("Estás estudiando como");
  });

  it("does NOT mount StudentGate directly (the global gate owns redirects)", () => {
    const src = homeSource();
    expect(src).not.toMatch(/<StudentGate\b/);
  });

  it("calls useActiveStudent to get student state", () => {
    const src = homeSource();
    expect(src).toMatch(/const\s*\{[^}]*student[^}]*\}\s*=\s*useActiveStudent/);
  });

  it("renders dashboard panels only when student is active", () => {
    const src = homeSource();
    expect(src).toContain("MissionCard");
  });

  it("waits for the derived view model before rendering dashboard panels", () => {
    const src = homeSource();
    expect(src).toMatch(/viewModel\s*===\s*null/);
    expect(src).not.toContain("viewModel!");
  });

  it("has 'Cambiar alumno' action in the active state", () => {
    const src = homeSource();
    expect(src).toContain("Cambiar alumno");
  });

  it("renders StudentSwitcher conditionally", () => {
    const src = homeSource();
    expect(src).toContain("StudentSwitcher");
    expect(src).toMatch(/showSwitcher|isSwitching|switcherOpen|StudentSwitcher[^>]*>/);
  });

  it("does NOT contain forbidden language (Docente, login, cuenta, admin)", () => {
    const src = homeSource();
    const FORBIDDEN = ["Docente", "docente", "login", "admin", "email", "contraseña", "avatar", "Supabase"];
    for (const word of FORBIDDEN) {
      expect(src.toLowerCase()).not.toContain(word.toLowerCase());
    }
  });
});
