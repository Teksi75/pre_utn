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

  /**
   * REQ-ISOL-6: post-switch view isolation on /diagnostic.
   *
   * When the active student changes, the page MUST reset attempts,
   * estimates, and suggestions so the new student starts with an
   * empty in-progress state — not the previous student's leftover data.
   *
   * Source-level assertion (Node test env, no jsdom) — extract the
   * `[student]` effect region and assert that all three resets are
   * present near the top of the effect body.
   */
  it("resets attempts/estimates/suggestions on [student] change (REQ-ISOL-6)", () => {
    const src = diagnosticSource();

    // Extract the [student] effect region: from the useEffect that depends
    // on [student] to its closing line. We use a heuristic that finds the
    // start of the effect and slices forward to capture its body.
    const effectAnchor = "}, [student]);";
    const effectEndIdx = src.indexOf(effectAnchor);
    expect(effectEndIdx).toBeGreaterThan(-1);

    // Slice a generous window (1500 chars) that covers the entire effect
    // body — the effect contains ~25 lines including comments and the
    // catalog selection logic.
    const window = src.slice(Math.max(0, effectEndIdx - 1500), effectEndIdx + effectAnchor.length);

    // The effect body MUST reset all three state slices before doing
    // anything else (catalog selection).
    expect(window).toMatch(/setAttempts\(\s*\[\s*\]\s*\)/);
    expect(window).toMatch(/setEstimates\(\s*\[\s*\]\s*\)/);
    expect(window).toMatch(/setSuggestions\(\s*\[\s*\]\s*\)/);
  });
});
