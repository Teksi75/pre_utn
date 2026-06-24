/**
 * No service role scan — asserts that no service role key, non-public
 * env var, or service_role reference appears in client-facing Supabase
 * code, .env.example, or package.json.
 *
 * Spec: "The system MUST NOT expose, require, document, or bundle a
 * service role key in client code or public environment examples."
 *
 * Design: "Do not add SERVICE_ROLE, SUPABASE_SERVICE_ROLE_KEY, or any
 * non-public key to client env or .env.example."
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Paths to scan
// ---------------------------------------------------------------------------

const ROOT = resolve(__dirname, "../..");
const SUPABASE_DIR = join(ROOT, "lib", "supabase");
const ENV_EXAMPLE = join(ROOT, "..", ".env.example");
const PACKAGE_JSON = join(ROOT, "..", "package.json");

// ---------------------------------------------------------------------------
// Forbidden patterns
// ---------------------------------------------------------------------------

/**
 * Patterns that must NOT appear in client-facing code or config.
 * Each entry is [pattern, description].
 */
const FORBIDDEN_PATTERNS: Array<[RegExp, string]> = [
  [/service_role/gi, "service_role reference"],
  [/SUPABASE_SERVICE_ROLE_KEY/g, "SUPABASE_SERVICE_ROLE_KEY env var"],
  [/SERVICE_ROLE_KEY/g, "SERVICE_ROLE_KEY env var"],
  [/supabaseServiceRole/g, "supabaseServiceRole variable"],
  [/serviceRoleKey/g, "serviceRoleKey variable"],
];

/**
 * Env var names that are ALLOWED in .env.example.
 * Anything else starting with SUPABASE_ is forbidden.
 */
const ALLOWED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...readFilesRecursive(fullPath));
      } else if (
        entry.endsWith(".ts") ||
        entry.endsWith(".tsx") ||
        entry.endsWith(".js") ||
        entry.endsWith(".jsx")
      ) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory may not exist yet — that's OK for RED phase
  }
  return results;
}

function scanContent(
  content: string,
  filePath: string,
  patterns: Array<[RegExp, string]>
): string[] {
  const violations: string[] = [];
  for (const [pattern, description] of patterns) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      violations.push(`${filePath}: contains ${description}`);
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("no service role in client-facing Supabase code", () => {
  it("src/lib/supabase/ contains no service_role references", () => {
    const files = readFilesRecursive(SUPABASE_DIR);
    // If directory doesn't exist yet, this is a RED-phase test — expect it to fail
    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      violations.push(...scanContent(content, file, FORBIDDEN_PATTERNS));
    }

    expect(violations).toEqual([]);
  });

  it(".env.example contains no service role keys", () => {
    let content: string;
    try {
      content = readFileSync(ENV_EXAMPLE, "utf-8");
    } catch {
      // File doesn't exist yet — RED phase expects it
      expect.fail(".env.example does not exist — create it with public Supabase vars only");
    }

    const violations = scanContent(content, ".env.example", FORBIDDEN_PATTERNS);
    expect(violations).toEqual([]);
  });

  it(".env.example documents only public Supabase env vars", () => {
    let content: string;
    try {
      content = readFileSync(ENV_EXAMPLE, "utf-8");
    } catch {
      expect.fail(".env.example does not exist");
    }

    // Find all NEXT_PUBLIC_SUPABASE_ env var references (full var names)
    const supabaseVarPattern = /NEXT_PUBLIC_SUPABASE_[A-Z_]+/g;
    const matches = content.match(supabaseVarPattern) ?? [];

    for (const match of matches) {
      expect(
        ALLOWED_ENV_VARS.includes(match),
        `Unexpected Supabase env var in .env.example: ${match}`
      ).toBe(true);
    }
  });

  it("package.json does not reference service role keys", () => {
    const content = readFileSync(PACKAGE_JSON, "utf-8");
    const violations = scanContent(content, "package.json", FORBIDDEN_PATTERNS);
    expect(violations).toEqual([]);
  });
});
