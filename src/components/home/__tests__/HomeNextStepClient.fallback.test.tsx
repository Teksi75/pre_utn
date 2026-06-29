/**
 * Tests for HomeNextStepClient — fallback view-model path (PR2).
 *
 * Verifies the post-auth-sync-fix invariant:
 *   - The dashboard must NEVER finish as a permanent skeleton or blank.
 *   - When loadProgress() / loadDiagnosticResult() REJECT (remote null +
 *     local empty / session error / thrown promise), the component must
 *     still produce an actionable view model — not stay stuck on the
 *     loading skeleton.
 *
 * The original code did:
 *
 *     progressResult.then((progress) => {
 *       if (diagResult instanceof Promise) {
 *         diagResult.then((diag) => handleResults(progress, diag))
 *                  .catch(() => handleResults(progress, null));
 *       } else {
 *         handleResults(progress, diagResult);
 *       }
 *     }).catch(() => {});
 *
 * The trailing `.catch(() => {})` left `viewModel = null` forever when
 * loadProgress() rejected, which rendered the loading skeleton
 * indefinitely. The fix: any catch must call `handleResults(...)` with
 * the recoverable inputs (EMPTY_PROGRESS / null diagnostic) so the
 * dashboard renders the local-fallback VM (mission + decision board +
 * route units + student situation).
 *
 * Spec: student-local-identity "Home resolves to actionable fallback".
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

// ---------------------------------------------------------------------------
// Catch path must produce an actionable view model — not stay on skeleton.
// ---------------------------------------------------------------------------

describe("HomeNextStepClient — PR2 fallback VM (no permanent skeleton)", () => {
  it("does NOT have a bare '.catch(() => {})' on the progress promise", () => {
    // The silent catch that left viewModel=null forever must be gone.
    // Any catch must call into the handleResults / setViewModel path
    // so the dashboard renders.
    const src = homeSource();
    expect(src).not.toMatch(/\.then\([^)]*\)\s*\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/);
    // More relaxed: no `.catch(() => {})` or `.catch(() => { })` patterns.
    expect(src).not.toMatch(/\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/);
  });

  it("settled progress failure feeds handleResults with an empty / fallback progress", () => {
    // When loadProgress() rejects, the settled-result fallback must still
    // invoke the view-model builder so the user sees the local-fallback VM.
    //
    // The load → handleResults protocol was extracted to
    // `runHomeLoader(deps, handleResults)` — the tripwire scans for
    // `EMPTY_PROGRESS` appearing inside the extracted function so the
    // fallback invariant is locked in.
    const src = homeSource();
    expect(src).toContain("Promise.allSettled");
    expect(src).toMatch(/progressSettled\.status === "fulfilled"[\s\S]*EMPTY_PROGRESS/);
    expect(src).toMatch(/handleResults\(progress, diag\)/);
  });

  it("catch handler for the diag promise (inner catch) feeds handleResults with null diagnostic", () => {
    // The inner diag catch (when only the diagnostic rejects) must
    // still call handleResults with `null` for the diagnostic so the
    // rest of the VM is built from progress + null diagnostic.
    const src = homeSource();
    // The inner catch is the one wrapping `diagResult.then(...)` —
    // it must NOT be silent.
    const innerSilentCatch = /\.then\([^)]*diag[^)]*\)\s*\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/i.test(
      src,
    );
    expect(innerSilentCatch).toBe(false);
  });

  it("EMPTY_PROGRESS is the safe fallback constant when loadProgress rejects", () => {
    // Using EMPTY_PROGRESS as the fallback ensures the dashboard renders
    // the empty-state VM (the "no attempts" branch of the mission and
    // primary-actions builders) instead of crashing on undefined fields.
    const src = homeSource();
    expect(src).toContain("EMPTY_PROGRESS");
    // And EMPTY_PROGRESS must appear inside a catch or a fallback path,
    // not just as a forgotten import. Allow multiline with [\s\S].
    const emptyInFallback =
      /catch[\s\S]*EMPTY_PROGRESS/.test(src) ||
      /progressSettled\.status === "fulfilled"[\s\S]*EMPTY_PROGRESS/.test(src);
    expect(emptyInFallback).toBe(true);
  });

  it("viewModel state always reaches a non-null value (never stuck on skeleton)", () => {
    // The dashboard renders inside the `viewModel !== null` branch.
    // If the catch path leaves viewModel=null, the skeleton shows
    // forever. Verify that EVERY code path that exits the useEffect's
    // async work calls handleResults or setViewModel with a non-null VM.
    const src = homeSource();
    // The success branch already calls setViewModel(deriveStudentHomeViewModel(...)).
    // The PR2 invariant: the catch path also calls into that builder.
    // We assert the catch path references either handleResults OR
    // deriveStudentHomeViewModel OR setViewModel.
    expect(src).toMatch(/deriveStudentHomeViewModel/);
    // And a catch is wired to handleResults (or setViewModel) above.
    // Allow multiline with [\s\S].
    expect(src).toMatch(/catch[\s\S]*handleResults|catch[\s\S]*setViewModel/);
  });
});

// ---------------------------------------------------------------------------
// Accessibility & brand-voice: keep existing PR1/PR3 invariants alive
// after the PR2 catch-path change.
// ---------------------------------------------------------------------------

describe("HomeNextStepClient — accessibility invariants preserved", () => {
  it("still renders aria-busy placeholder while loading", () => {
    const src = homeSource();
    expect(src).toContain("aria-busy");
    expect(src).toContain("aria-live");
  });

  it("still renders the active-student chrome when student exists", () => {
    const src = homeSource();
    expect(src).toMatch(/student\s*===\s*null|student\s*\?/);
    expect(src).toMatch(/displayName/);
  });

  it("still renders MissionCard / panels when viewModel is available", () => {
    const src = homeSource();
    expect(src).toContain("MissionCard");
  });

  it("does NOT mount StudentGate directly (global gate owns redirects)", () => {
    const src = homeSource();
    expect(src).not.toMatch(/<StudentGate\b/);
  });

  it("forbidden language still absent from JSX text", () => {
    const src = homeSource();
    const FORBIDDEN = ["Docente", "docente", "login", "admin", "email", "contraseña", "avatar", "Supabase"];
    for (const word of FORBIDDEN) {
      expect(src.toLowerCase()).not.toContain(word.toLowerCase());
    }
  });
});
