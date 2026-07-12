/**
 * Node-only validator: confirms that `tracePath` resolves to an existing
 * file or directory INSIDE the given `repositoryRoot`, returning a
 * boolean instead of throwing.
 *
 * Lives in `src/lib/` (not `src/domain/`) because it depends on
 * `node:fs` / `node:path`, which are Node-only and not part of the
 * domain layer's browser-safe contract.
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
 * inside the explicit `repositoryRoot`.
 *
 * @returns `true` only when the resolved path is in-root and exists on
 *          disk. Returns `false` for every failure mode — absolute
 *          paths, `..` escape, empty/whitespace inputs, missing-on-disk
 *          paths, and filesystem errors. Never throws.
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
  // Absolute trace paths undermine the explicit-root contract.
  if (pathIsAbsolute(tracePath)) return false;

  try {
    const normalizedRoot = resolvePath(repositoryRoot);
    const resolved = resolvePath(normalizedRoot, tracePath);

    // Reject paths that escape the root via `..`. In-root normalization
    // like `content/../package.json` produces a `relative` result with
    // no `..` segment and is permitted.
    const rel = relative(normalizedRoot, resolved);
    if (rel === ".." || rel.startsWith(`..${sep}`)) return false;

    return existsSync(resolved);
  } catch {
    return false;
  }
}
