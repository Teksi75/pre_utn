import { isSkillReady } from "../../domain/catalog/readiness";

/**
 * OpenSpec: `unit-1-pedagogical-slice`, Phase 13.
 * TDD coverage: `src/components/diagnostic/__tests__/practice-link.test.ts`.
 */
export function getPracticeHrefForSuggestion(skillId: string): string | null {
  const readiness = isSkillReady(skillId);
  if (!readiness.ready) return null;

  return `/practice?skill=${skillId}`;
}
