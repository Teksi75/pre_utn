/**
 * Advanced practice progress fixture — AdvancedPracticeProgress builder.
 *
 * Produces a JSON-serializable object matching the storage shape used by
 * `src/lib/advanced-practice-progress.ts` (the canonical
 * `AdvancedPracticeProgress` interface, line 43). A Playwright
 * `addInitScript` can JSON.stringify this and write it to localStorage under
 * `pre-utn.advanced-practice.v1` before Next.js hydration.
 *
 * Per `openspec/changes/challenge-smoke-e2e/design.md`, the advanced store is
 * seeded EMPTY by default: the E2E flow writes challenge attempts through the
 * real UI, then reads them back via `page.evaluate` to verify isolation.
 * Callers may pass `challengeAttempts` to seed a non-empty state when a spec
 * needs to assert against pre-existing attempts.
 */

import type {
  AdvancedPracticeProgress,
  ChallengeAttempt,
} from "../../../src/lib/advanced-practice-progress";
import type { SkillId } from "../../../src/domain/models/skill";

export interface BuildAdvancedPracticeInput {
  readonly skillId: SkillId;
  /** Challenge attempts to seed; passed through unchanged. Defaults to empty. */
  readonly challengeAttempts?: readonly ChallengeAttempt[];
}

/**
 * Build an `AdvancedPracticeProgress` fixture.
 *
 * By default returns `{ challengeAttempts: [], readinessBySkill: {} }` — the
 * empty seed described in the design doc. When `challengeAttempts` is
 * provided, the attempts are passed through verbatim so a spec can assert
 * against a known pre-existing attempt history.
 */
export function buildAdvancedPracticeFixture(
  input: BuildAdvancedPracticeInput,
): AdvancedPracticeProgress {
  return {
    challengeAttempts: input.challengeAttempts ?? [],
    readinessBySkill: {},
  };
}
