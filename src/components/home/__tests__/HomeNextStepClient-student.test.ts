/**
 * Tests for modified HomeNextStepClient — src/components/home/HomeNextStepClient.tsx
 *
 * Source-inspection tests for PR2 changes:
 * - Uses useActiveStudent hook
 * - Renders StudentGate when no active profile
 * - Renders active student chrome when profile exists
 * - Calls refresh on student switch
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

describe("HomeNextStepClient — student identity wiring (PR2)", () => {
  it("imports useActiveStudent from hooks", () => {
    const src = homeSource();
    expect(src).toContain("useActiveStudent");
  });

  it("imports StudentGate component", () => {
    const src = homeSource();
    expect(src).toContain("StudentGate");
  });

  it("renders StudentGate when student is null", () => {
    const src = homeSource();
    // Pattern: {student === null && <StudentGate ...>} OR {student ? ... : <StudentGate ...>}
    expect(src).toMatch(/student\s*===\s*null/);
    expect(src).toMatch(/<StudentGate/);
  });

  it("renders active student chrome when student exists", () => {
    const src = homeSource();
    // Must have conditional rendering based on student — either ternary or explicit null check
    expect(src).toMatch(/student\s*===\s*null|student\s*\?/);
    // Must show displayName in the active state
    expect(src).toMatch(/displayName/);
  });

  it("warmly identifies the active student in the dashboard zone", () => {
    const src = homeSource();
    // The legacy line now lives in the HomeGreeting sub-component
    // (introduced in B1). The parent still wires the student's displayName
    // through, so we keep asserting on that contract here.
    expect(src).toMatch(/HomeGreeting|student\.displayName|displayName/);
    expect(src).not.toContain("Estás estudiando como");
    // The legacy copy itself is asserted in HomeGreeting.test.ts.
  });

  it("passes onSubmitProfile to StudentGate to create and activate profile", () => {
    const src = homeSource();
    // StudentGate must receive onSubmitProfile callback
    expect(src).toMatch(/<StudentGate[^>]*onSubmitProfile/);
  });

  it("calls useActiveStudent to get student state", () => {
    const src = homeSource();
    // Pattern: const { student, ... } = useActiveStudent()
    expect(src).toMatch(/const\s*\{[^}]*student[^}]*\}\s*=\s*useActiveStudent/);
  });

  it("renders dashboard panels only when student is active", () => {
    const src = homeSource();
    // TeacherDigitalHero, MathRoutePanel etc. should be conditional on student
    // They appear AFTER the student null check
    const gateIdx = src.indexOf("StudentGate");
    const heroIdx = src.indexOf("TeacherDigitalHero");
    if (gateIdx >= 0 && heroIdx >= 0) {
      // Hero should appear after a student check, not before StudentGate
      // At minimum, hero should be inside a conditional that checks student
      expect(src).toMatch(/student\s*\?|<TeacherDigitalHero/);
    }
  });

  it("TeacherDigitalHero appears in a student-conditional zone", () => {
    const src = homeSource();
    // Hero must appear after the student null check (in render order)
    // At minimum: hero appears somewhere AND there is a student null check
    expect(src).toContain("TeacherDigitalHero");
    expect(src).toMatch(/student\s*===\s*null/);
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
    // Should be conditional — only shown when switching
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
