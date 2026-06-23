/**
 * Boundary scan — ensures no direct localStorage.getItem("pre-utn.profiles.v1")
 * exists outside the approved profile-storage or active-session boundary files.
 *
 * This test enforces the spec requirement: "profile key parsing is contained."
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const PROFILE_KEY = "pre-utn.profiles.v1";

/** Files allowed to read the profile key directly. */
const APPROVED_FILES = [
  "src/lib/student-profile-storage.ts",
  "src/lib/active-session.ts",
];

/** Extensions to scan. */
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function walkTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      // Skip node_modules, .next, dist
      if (entry === "node_modules" || entry === ".next" || entry === "dist") continue;
      results.push(...walkTsFiles(fullPath));
    } else if (SOURCE_EXTENSIONS.has(extname(entry))) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("active-session boundary scan", () => {
  it("has no direct localStorage.getItem('pre-utn.profiles.v1') outside approved boundary files", () => {
    const srcDir = join(process.cwd(), "src");
    const allFiles = walkTsFiles(srcDir);

    const approvedSet = new Set(
      APPROVED_FILES.map((f) => join(process.cwd(), f))
    );

    const violations: Array<{ file: string; line: number; content: string }> = [];

    for (const filePath of allFiles) {
      // Skip test files — they mock localStorage and don't represent production boundary violations
      if (filePath.includes("__tests__") || filePath.includes(".test.") || filePath.includes(".spec.")) {
        continue;
      }
      if (approvedSet.has(filePath)) continue;

      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`localStorage.getItem("${PROFILE_KEY}")`)) {
          violations.push({
            file: relative(process.cwd(), filePath).replace(/\\/g, "/"),
            line: i + 1,
            content: lines[i].trim(),
          });
        }
      }
    }

    expect(
      violations,
      violations.length > 0
        ? `Found ${violations.length} direct profile-key reads outside approved boundary:\n` +
          violations.map((v) => `  ${v.file}:${v.line}: ${v.content}`).join("\n")
        : "No violations found"
    ).toEqual([]);
  });
});
