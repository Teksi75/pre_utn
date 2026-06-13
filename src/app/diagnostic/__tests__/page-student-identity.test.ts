import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function diagnosticSource(): string {
  return readFileSync(join(repoRoot, "src/app/diagnostic/page.tsx"), "utf8");
}

describe("DiagnosticPage student identity wiring", () => {
  it("declares hooks before the no-student early return", () => {
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

  it("handles blocked diagnostic and study-plan persistence results", () => {
    const src = diagnosticSource();

    expect(src).toContain("saveDiagnosticResult(result)");
    expect(src).toContain("saveStudyPlan(plan)");
    expect(src).toContain("missing-active-profile");
    expect(src).toContain("setProfileBlocked");
  });
});
