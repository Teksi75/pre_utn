/**
 * Skill label helper — derives a human-readable label from a SkillId slug.
 * Used in both the `FocusSelector` and the blocked-skill banner so the
 * UX stays consistent across surfaces.
 */

import type { SkillId } from "@/domain/models/skill";

/**
 * Turn `mat.u1.conjuntos_numericos` into `Conjuntos Numericos`.
 * Falls back to the raw id when no slug segment can be extracted.
 */
export function skillLabel(id: SkillId): string {
  const slug = id.split(".").pop() ?? id;
  return slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
