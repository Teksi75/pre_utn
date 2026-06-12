/**
 * Shared skill/unit helpers — pure functions for skill ID parsing.
 * No external dependencies. Pure TypeScript.
 */

import type { SkillId } from "../models/skill";

/**
 * Extract the unit number from a SkillId like `mat.u2.polinomios_basico`.
 * Unknown patterns default to unit 1.
 *
 * @param skillId - The skill ID to parse
 * @returns The unit number (1–6), or 1 for unknown patterns
 */
export function parseSkillUnit(skillId: string): number {
  const match = /^mat\.u(\d+)\./.exec(skillId);
  return match ? parseInt(match[1], 10) : 1;
}
