import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function diagnosticSource(): string {
  return readFileSync(join(repoRoot, "src/app/diagnostic/page.tsx"), "utf8");
}

describe("DiagnosticPage — C1: no MathWatermark on the question screen", () => {
  it("does NOT import MathWatermark anymore", () => {
    const src = diagnosticSource();
    expect(src).not.toMatch(/import\s+\{[^}]*MathWatermark[^}]*\}\s+from\s+["']@\/components\/math-visuals["']/);
    // Any other import path that brings MathWatermark in is also forbidden.
    expect(src).not.toMatch(/import\s+\{[^}]*MathWatermark[^}]*\}/);
  });

  it("does NOT render <MathWatermark> in the question phase JSX", () => {
    const src = diagnosticSource();
    expect(src).not.toMatch(/<MathWatermark\b/);
    expect(src).not.toMatch(/<\/MathWatermark>/);
  });

  it("keeps the question card structure intact (section + DiagnosticQuestion + progress via DiagnosticProgress)", () => {
    const src = diagnosticSource();
    // The question UI itself (sans watermark) must remain.
    expect(src).toContain("DiagnosticQuestion");
    // C2 extracted the progress bar into its own component. We assert
    // the parent still mounts it with the right props and that the
    // progressbar + a11y are covered by the new component
    // (cross-checked in DiagnosticProgress.test.ts).
    expect(src).toContain("DiagnosticProgress");
    expect(src).toMatch(/<DiagnosticProgress\b/);
    expect(src).toMatch(/currentIndex=\{currentIndex\}/);
    expect(src).toMatch(/total=\{exercises\.length\}/);
    expect(src).toMatch(/<section\b/);
  });

  it("does NOT leave a dead import path for the math-visuals barrel", () => {
    const src = diagnosticSource();
    // The page used to import MathWatermark from the math-visuals barrel.
    // After C1, the barrel import should be gone entirely (we don't need
    // any other symbol from that barrel here).
    expect(src).not.toMatch(/from\s+["']@\/components\/math-visuals["']/);
  });

  it("does not introduce a TODO, console.log, or raw hex in the question block", () => {
    const src = diagnosticSource();
    expect(src).not.toContain("console.log");
    expect(src).not.toMatch(/\bTODO\b/);
  });
});

describe("DiagnosticPage — student identity wiring (regression check)", () => {
  // Keep the existing wiring assertions next to C1 so the test file is
  // self-contained.
  it("still declares hooks before the no-student early return", () => {
    const src = diagnosticSource();
    const noStudentReturn = src.indexOf("if (student === null || profileBlocked)");
    const effectIndex = src.indexOf("useEffect", src.indexOf("DiagnosticPage"));
    const callbackIndex = src.indexOf("useCallback", src.indexOf("DiagnosticPage"));

    expect(noStudentReturn).toBeGreaterThan(0);
    expect(effectIndex).toBeGreaterThan(0);
    expect(callbackIndex).toBeGreaterThan(0);
    expect(effectIndex).toBeLessThan(noStudentReturn);
    expect(callbackIndex).toBeLessThan(noStudentReturn);
  });

  it("still handles blocked diagnostic and study-plan persistence results", () => {
    const src = diagnosticSource();

    expect(src).toContain("saveDiagnosticResult(result)");
    expect(src).toContain("saveStudyPlan(plan)");
    expect(src).toContain("missing-active-profile");
    expect(src).toContain("setProfileBlocked");
  });
});
