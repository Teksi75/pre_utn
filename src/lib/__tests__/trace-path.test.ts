/**
 * Focused tests for `validateTracePath`. Validates the boolean/no-throw
 * contract over a real temporary directory and exercises the path
 * security guards (absolute, parent-escape), input guards
 * (empty/whitespace), missing-on-disk, and out-of-contract robustness
 * (non-string inputs) without touching the real repository tree.
 *
 * Mocks `node:fs.existsSync` only inside the dedicated filesystem-error
 * block, using `vi.resetModules()` + dynamic import so the mocked
 * binding reaches the module under test without leaking across cases.
 * `afterEach` calls `vi.doUnmock` + `vi.resetModules()` to guarantee
 * isolation between the mocked and the real-fs cases.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { validateTracePath } from "../trace-path";

let sharedParent: string;
let root: string;

beforeEach(() => {
  // Per-case shared parent so the parent-escape test can place a real
  // sibling file at `../outside.txt` that exists on disk — proving
  // the validator's `..` guard, not a coincidental `existsSync` miss,
  // is what returns false.
  sharedParent = mkdtempSync(join(tmpdir(), "pre-utn-trace-path-"));
  root = join(sharedParent, "root");
  // Real nested fixture so the happy path exercises both `path.resolve`
  // AND the on-disk existence check end-to-end.
  mkdirSync(root);
  mkdirSync(join(root, "nested"));
  writeFileSync(join(root, "nested", "fixture.txt"), "ok");
  // Real sibling file OUTSIDE `root` but INSIDE `sharedParent` — its
  // presence is the whole point of the strengthened escape test.
  writeFileSync(join(sharedParent, "outside.txt"), "outside");
});

afterEach(() => {
  rmSync(sharedParent, { recursive: true, force: true });
  vi.restoreAllMocks();
  // Belt-and-braces: even though `vi.doMock` was scoped to one describe
  // block, tear it down here so a failed fs-error case cannot leak its
  // mocked `existsSync` into the next describe block via module cache.
  vi.doUnmock("node:fs");
  vi.resetModules();
});

describe("validateTracePath", () => {
  it("returns true for an in-root existing relative path", () => {
    expect(validateTracePath(root, join("nested", "fixture.txt"))).toBe(true);
  });

  it("returns false for an absolute trace path", () => {
    // Construct an absolute path that happens to live inside `root`,
    // proving the validator rejects absolute inputs even when they
    // would otherwise resolve to a real file.
    const absolute = join(root, "nested", "fixture.txt");
    expect(validateTracePath(root, absolute)).toBe(false);
  });

  it("returns false when the trace path escapes the root via `..`", () => {
    // Resolves to a SIBLING of `root` inside the OS temp directory;
    // existsSync would return true, so the only path-to-false is the
    // `..` escape guard inside the validator. Strengthened: the
    // sibling is a real file on disk (sharedParent/outside.txt), so
    // a buggy implementation that only checks existence would
    // wrongly return true.
    expect(validateTracePath(root, join("..", "outside.txt"))).toBe(false);
  });

  it("returns false for empty or whitespace-only inputs", () => {
    // Four sub-cases for the two string parameters across both the
    // empty and the whitespace-only flavors — each must return false.
    expect(validateTracePath("", join("nested", "fixture.txt"))).toBe(false);
    expect(validateTracePath("   ", join("nested", "fixture.txt"))).toBe(false);
    expect(validateTracePath(root, "")).toBe(false);
    expect(validateTracePath(root, "   ")).toBe(false);
  });

  it("returns false when the resolved path does not exist on disk", () => {
    // Legitimate in-root path that existsSync will report as missing.
    expect(validateTracePath(root, "nested/missing.txt")).toBe(false);
  });
});

describe("validateTracePath — filesystem error", () => {
  it("returns false without throwing when existsSync throws synchronously", async () => {
    // vi.resetModules + dynamic import is the ESM-safe way to make the
    // module under test see the mocked `existsSync`. After both calls
    // here the next dynamic import re-evaluates trace-path.ts with the
    // mock registered for `node:fs`. The static import at the top of
    // this file is intentionally left using real fs — the other cases
    // rely on it. The `afterEach` hook restores the real module cache.
    vi.resetModules();
    vi.doMock("node:fs", async () => {
      const actual =
        await vi.importActual<typeof import("node:fs")>("node:fs");
      return {
        ...actual,
        existsSync: () => {
          throw new Error("simulated fs failure");
        },
      };
    });

    const { validateTracePath: mocked } = await import("../trace-path");

    expect(() =>
      mocked(root, join("nested", "fixture.txt"))
    ).not.toThrow();
    expect(mocked(root, join("nested", "fixture.txt"))).toBe(false);
  });
});

describe("validateTracePath — out-of-contract robustness", () => {
  it("returns false without throwing for a non-string repositoryRoot", () => {
    expect(
      // @ts-expect-error -- non-string repositoryRoot is out-of-contract
      // but the defensive guard inside the validator must collapse it
      // to `false` rather than letting `repositoryRoot.trim()` throw.
      validateTracePath(undefined, join("nested", "fixture.txt"))
    ).toBe(false);
  });
});
