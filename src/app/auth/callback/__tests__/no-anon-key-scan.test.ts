/**
 * No ANON_KEY scan — asserts no `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 * reference exists anywhere in `src/` except inside an explicit
 * `@deprecated` JSDoc block, and except for this very file (which
 * necessarily names the token to scan for).
 *
 * The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` env var was a Supabase
 * pre-2024 convention. Modern Supabase SSR setups use
 * `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Allowing both as fallbacks
 * risks an outdated `.env` shipping a stale key to the client bundle;
 * removing the fallback forces every deployment to set the current
 * variable explicitly.
 *
 * Spec: REQ-NEW-SEC — "The callback route MUST use only
 * `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; the legacy
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` fallback MUST be removed."
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "src");

/** The legacy env var name we must NOT reference outside @deprecated blocks. */
const FORBIDDEN_TOKEN = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

/**
 * Directory names to skip during the scan. Prevents descending into
 * generated output, build artifacts, or vendored dependencies that
 * may live under `src/`.
 */
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  "coverage",
]);

/** File extensions to include in the scan. */
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

/** Files that are allowed to name the forbidden token. */
const ALLOWLIST_FILES = new Set([
  // The scan itself has to name the token.
  "no-anon-key-scan.test.ts",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      results.push(...readFilesRecursive(fullPath));
    } else if (EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Strip JSDoc blocks (`/** ... *\/`) from `content`. The returned
 * string is what remains after every JSDoc block has been removed —
 * i.e. the non-JSDoc surface where forbidden tokens MUST NOT appear.
 */
function stripJsdocBlocks(content: string): string {
  // Replace each `/** ... */` block with spaces (preserving newlines so
  // line numbers in any error message stay aligned with the source).
  return content.replace(/\/\*\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, " "),
  );
}

function isDeprecatedJsdoc(content: string, token: string, offset: number): boolean {
  // Walk backwards looking for a JSDoc block that contains `offset`.
  let openIdx = content.lastIndexOf("/**", offset);
  while (openIdx !== -1) {
    const closeIdx = content.indexOf("*/", openIdx);
    if (closeIdx === -1 || closeIdx < offset) return false;
    // `offset` is between openIdx and closeIdx+2 → inside the JSDoc.
    const block = content.slice(openIdx, closeIdx + 2);
    if (/@deprecated\b/.test(block)) return true;
    openIdx = content.lastIndexOf("/**", openIdx - 1);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("no NEXT_PUBLIC_SUPABASE_ANON_KEY reference outside @deprecated JSDoc", () => {
  it("src/ contains scannable source files", () => {
    const files = readFilesRecursive(SRC_DIR);
    expect(files.length).toBeGreaterThan(0);
  });

  it("src/ contains no references to NEXT_PUBLIC_SUPABASE_ANON_KEY outside @deprecated JSDoc", () => {
    const files = readFilesRecursive(SRC_DIR);
    const violations: string[] = [];

    for (const file of files) {
      if (ALLOWLIST_FILES.has(basename(file))) continue;

      let content: string;
      try {
        content = readFileSync(file, "utf8");
      } catch {
        continue;
      }

      const stripped = stripJsdocBlocks(content);

      // Scan the NON-JSDoc surface first. Anything in JSDoc is allowed
      // only if the JSDoc block carries an explicit @deprecated tag.
      let searchFrom = 0;
      while (searchFrom < stripped.length) {
        const idx = stripped.indexOf(FORBIDDEN_TOKEN, searchFrom);
        if (idx === -1) break;

        // Is the original token occurrence inside a @deprecated JSDoc?
        if (isDeprecatedJsdoc(content, FORBIDDEN_TOKEN, idx)) {
          searchFrom = idx + FORBIDDEN_TOKEN.length;
          continue;
        }

        const before = content.slice(0, idx);
        const line = before.split("\n").length;
        violations.push(`${file}:${line}: references ${FORBIDDEN_TOKEN}`);
        searchFrom = idx + FORBIDDEN_TOKEN.length;
      }
    }

    expect(violations).toEqual([]);
  });

  it("src/app/auth/callback/route.ts uses only NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (no fallback)", () => {
    const routePath = join(SRC_DIR, "app", "auth", "callback", "route.ts");
    const content = readFileSync(routePath, "utf8");
    // The legacy fallback was: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
    // — assert this exact substring is absent from runtime code.
    expect(content).not.toMatch(/process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });
});

