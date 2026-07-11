/**
 * Node-only repository-root-contained trace-path validator.
 *
 * Lives in `src/lib/` (not `src/domain/`) because it depends on
 * `node:fs` / `node:path`, which is incompatible with the browser bundle
 * and the AGENTS.md "no side effects in domain" rule. Domain consumers
 * import it indirectly through the re-export / loader surface so they
 * see a single, stable entry point (`validateTracePath`).
 *
 * S0 owns this helper; S11 consumes it as part of the exact-nine
 * traceability audit.
 *
 * ## Contract (S0b)
 *
 * `validateTracePath(repositoryRoot, tracePath)` returns `true` ONLY
 * when ALL of the following hold:
 *
 *   1. `repositoryRoot` is a non-empty string.
 *   2. `tracePath` is a non-empty string and is RELATIVE
 *      (i.e. `node:path.isAbsolute(tracePath) === false`).
 *   3. The path obtained by `path.resolve(repositoryRoot, tracePath)`
 *      stays INSIDE `repositoryRoot` — i.e. `..` traversal that escapes
 *      the root yields `false`, while legitimate in-root `..`
 *      normalization (e.g. `content/../package.json`) is permitted.
 *   4. The final, normalized path points at an existing file or
 *      directory on disk (`fs.existsSync` returns `true`).
 *
 * Bare existence against `process.cwd()` is NOT sufficient: trace paths
 * MUST bind to the explicit `repositoryRoot`, otherwise the audit
 * cannot prove that a trace references repository material.
 *
 * The helper MUST NOT throw — it runs inside audits over untrusted
 * JSON input where any failure mode collapses to `false`.
 */

import { existsSync } from "node:fs";
import {
  resolve as resolvePath,
  isAbsolute as pathIsAbsolute,
  relative,
  sep,
} from "node:path";

/**
 * Validate that `tracePath` resolves to an existing file or directory
 * INSIDE the explicit `repositoryRoot`.
 *
 * @param repositoryRoot - Absolute (or process-relative) path to the
 *                        repository root. All trace paths are resolved
 *                        against this anchor — never against
 *                        `process.cwd()`.
 * @param tracePath      - The relative path to validate. Must be
 *                        RELATIVE; absolute paths are rejected even
 *                        when they happen to point inside the repo.
 * @returns `true` only when the resolved path is in-root and exists on
 *          disk; `false` for every failure mode (including invalid
 *          inputs and `..` escapes). Never throws.
 */
export function validateTracePath(
  repositoryRoot: string,
  tracePath: string
): boolean {
  if (typeof repositoryRoot !== "string" || repositoryRoot.trim().length === 0) {
    return false;
  }
  if (typeof tracePath !== "string" || tracePath.trim().length === 0) {
    return false;
  }
  // Absolute trace paths undermine the explicit-root contract: callers
  // that bypass the root are not declaring "this lives in the repo".
  if (pathIsAbsolute(tracePath)) return false;

  try {
    const normalizedRoot = resolvePath(repositoryRoot);
    const resolved = resolvePath(normalizedRoot, tracePath);

    // Reject paths that escape the repository root via `..`. `relative`
    // returns a path that starts with `..` (or IS `..`) only when the
    // target sits outside `from`. In-root normalization like
    // `content/../package.json` produces e.g. `package.json` with NO
    // `..` segment, which is allowed.
    const rel = relative(normalizedRoot, resolved);
    if (rel === ".." || rel.startsWith(`..${sep}`)) return false;

    return existsSync(resolved);
  } catch {
    return false;
  }
}
