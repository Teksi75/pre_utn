/**
 * S0b — Repository-root-contained Node trace-path validator (focused tests).
 *
 * Per `align-u3-practice-official-exercises/design.md` and the prior review
 * warning captured in `apply-progress.md`:
 *
 *   The validator MUST resolve the trace path against an EXPLICIT
 *   `repositoryRoot`. Bare existence against `process.cwd()` is
 *   insufficient. The validator MUST:
 *     1. Reject absolute trace paths (`/etc/passwd`).
 *     2. Reject paths that resolve OUTSIDE the explicit repository root
 *        via `..` traversal.
 *     3. Resolve only against the explicit repository root (no
 *        `process.cwd()` fallback).
 *     4. Confirm the file exists on disk after the in-root resolution.
 *     5. Confirm the expected canonical PDF path resolves positively.
 *
 * This is the OWN focused test for the S0b slice. The companion WIP file
 * `u3-s0-foundation.test.ts` group #3 covers S0 broadly; that file's
 * trace-path group was updated in lockstep with this fix.
 *
 * `node:fs` and `node:path` stay confined to `src/lib/` so the browser
 * bundle and the `src/domain/` purity rule (AGENTS.md) are preserved.
 */

import { describe, test, expect } from "vitest";
import { resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";

import { validateTracePath } from "@/lib/trace-path";

// ---------------------------------------------------------------------------
// Repository-root fixture for tests — points at the workspace root so the
// canonical PDF and an existing content/ JSON resolve positively. The tests
// also pass a deliberately-wrong root to demonstrate explicit-root binding.
// ---------------------------------------------------------------------------

const PROJECT_ROOT = resolvePath(__dirname, "..", "..");
const CANONICAL_PDF_REL =
  "material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf";
const EXISTING_CONTENT_REL = "content/matematica/challenges/unit-3.json";
const MISSING_REL = "material_canonico/__definitely_missing__.pdf";

// Compile-time guarantee: `existsSync(PROJECT_ROOT + CANONICAL_PDF_REL)`.
// The very spec says the canonical PDF MUST exist; we skip the suite
// otherwise to keep CI honest about the spec contract, not about a
// transient tree state.
const CANONICAL_PDF_ABS = resolvePath(PROJECT_ROOT, CANONICAL_PDF_REL);
const canonicalPdfExists = existsSync(CANONICAL_PDF_ABS);

// ---------------------------------------------------------------------------
// Contract: explicit repository root.
// ---------------------------------------------------------------------------

describe("S0b — validateTracePath requires an explicit repositoryRoot", () => {
  test("returns true for the expected canonical PDF resolved against PROJECT_ROOT", () => {
    // Spec: "The verified path is material_canonico/utn-frm/.../03_ej_utn.pdf".
    // The audit MUST be able to assert this positively with an EXPLICIT root.
    expect(canonicalPdfExists).toBe(true); // tree-state guard; see header note.
    expect(
      validateTracePath(PROJECT_ROOT, CANONICAL_PDF_REL)
    ).toBe(true);
  });

  test("returns true for an existing content/ JSON under PROJECT_ROOT", () => {
    expect(
      validateTracePath(PROJECT_ROOT, EXISTING_CONTENT_REL)
    ).toBe(true);
  });

  test("returns false for a path that does not exist (even if in-root)", () => {
    expect(validateTracePath(PROJECT_ROOT, MISSING_REL)).toBe(false);
  });

  test("passing a non-empty string repositoryRoot is required; bare CWD resolution is gone", () => {
    // Prior review warning: "bare existence is insufficient". If we ever
    // regressed to `process.cwd()` resolution, the explicit-root contract
    // below would break because `/this/is/not/a/dir` is not a repo root.
    const FAKE_ROOT = resolvePath(PROJECT_ROOT, "src/lib");
    // src/lib IS the actual filesystem directory; use a sibling that does not.
    const NON_REPO_ROOT = resolvePath("/", "__definitely_not_a_repo_root__");
    expect(validateTracePath(NON_REPO_ROOT, CANONICAL_PDF_REL)).toBe(false);
    expect(validateTracePath(NON_REPO_ROOT, EXISTING_CONTENT_REL)).toBe(false);
    // Bind: the SAME relative path succeeds when the explicit root is the
    // real repo root, proving root-binding is real and not CWD-fallback.
    expect(validateTracePath(FAKE_ROOT, "trace-path.ts")).toBe(true);
    expect(validateTracePath(FAKE_ROOT, CANONICAL_PDF_REL)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Contract: absolute trace paths are rejected.
// ---------------------------------------------------------------------------

describe("S0b — validateTracePath rejects absolute trace paths", () => {
  test("returns false for an absolute path even when the file actually exists on disk", () => {
    // The canonical PDF is a real file on disk. An absolute trace path
    // that happens to resolve to that file MUST still be rejected —
    // absolute paths undermine the "repository-contained trace" contract.
    expect(validateTracePath(PROJECT_ROOT, CANONICAL_PDF_ABS)).toBe(false);
  });

  test("returns false for a Windows-style absolute path", () => {
    // node:path.isAbsolute treats `C:\\...` as absolute on win32.
    // Hard-coded shape so the test survives non-Windows runs of the docs/CI.
    expect(validateTracePath(PROJECT_ROOT, "C:/Windows/System32/drivers/etc/hosts")).toBe(false);
  });

  test("returns false for a POSIX absolute path under PROJECT_ROOT", () => {
    // Construct an absolute path that, on POSIX, starts with `/`. Under
    // win32 we use the platform-native absolute form; either way the
    // validator's `isAbsolute` check must reject it.
    const absoluteInside = resolvePath(PROJECT_ROOT, CANONICAL_PDF_REL);
    expect(validateTracePath(PROJECT_ROOT, absoluteInside)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Contract: `..` traversal is rejected.
// ---------------------------------------------------------------------------

describe("S0b — validateTracePath rejects `..` escape paths", () => {
  test("returns false for a direct `..` escape from PROJECT_ROOT", () => {
    expect(validateTracePath(PROJECT_ROOT, "../package.json")).toBe(false);
  });

  test("returns false for a `..` escape that traverses a real in-repo prefix", () => {
    // Resolves to `material_canonico/foo` which has no `..`, but a real
    // escaping prefix like `content/../../material_canonico` must be
    // rejected even when the final segment looks in-root.
    expect(
      validateTracePath(PROJECT_ROOT, "content/../../material_canonico_evil/foo.pdf")
    ).toBe(false);
  });

  test("returns false for `..` against an arbitrary subdir root", () => {
    const FAKE_ROOT = resolvePath(PROJECT_ROOT, "src/lib");
    expect(validateTracePath(FAKE_ROOT, "../../../etc/passwd")).toBe(false);
  });

  test("in-repo `..` that stays inside the root is allowed IF the target exists", () => {
    // `content/../package.json` resolves to PROJECT_ROOT/package.json which
    // exists. The validator must allow this: it only rejects ESCAPE, not
    // legitimate in-root normalization.
    expect(validateTracePath(PROJECT_ROOT, "content/../package.json")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Contract: invalid inputs are rejected (never throw).
// ---------------------------------------------------------------------------

describe("S0b — validateTracePath returns false on invalid input, never throws", () => {
  test("returns false for empty / whitespace-only trace paths", () => {
    expect(validateTracePath(PROJECT_ROOT, "")).toBe(false);
    expect(validateTracePath(PROJECT_ROOT, "   ")).toBe(false);
  });

  test("returns false for empty / whitespace-only repository roots", () => {
    expect(validateTracePath("", CANONICAL_PDF_REL)).toBe(false);
    expect(validateTracePath("   ", CANONICAL_PDF_REL)).toBe(false);
  });

  test("returns false for non-string inputs", () => {
    // @ts-expect-error — runtime guard for bad callers.
    expect(validateTracePath(null, CANONICAL_PDF_REL)).toBe(false);
    // @ts-expect-error — runtime guard for bad callers.
    expect(validateTracePath(PROJECT_ROOT, undefined)).toBe(false);
    // @ts-expect-error — runtime guard for bad callers.
    expect(validateTracePath(PROJECT_ROOT, 42)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Contract: positive audit on the canonical PDF (`03_ej_utn.pdf`).
// ---------------------------------------------------------------------------

describe("S0b — explicit positive audit of the canonical PDF inside PROJECT_ROOT", () => {
  test("the canonical PDF path resolves positively as the S0b anchor", () => {
    // The same positive assertion the S11 audit will reuse, exercised
    // from S0b so a refactor that breaks the anchor fails here first.
    expect(validateTracePath(PROJECT_ROOT, CANONICAL_PDF_REL)).toBe(true);
  });
});
