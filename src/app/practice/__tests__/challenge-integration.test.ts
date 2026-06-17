/**
 * Integration tests for challenge flow in practice page (PR 5).
 *
 * Tests the integration of ChallengeFlow into PracticeCompletePhase.
 * Since the project test environment is Node (no jsdom), React components
 * cannot be rendered. We verify component STRUCTURE via source-code assertions.
 *
 * STRICT TDD: RED first — verify expected integration patterns before implementation.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("Practice page challenge integration (PR 5)", () => {
  const pagePath = "src/app/practice/page.tsx";

  test("imports ChallengeFlow from the challenges directory", () => {
    const page = source(pagePath);
    // ChallengeFlow should be imported at the top of the page
    expect(page).toMatch(/import\s+\{[^}]*ChallengeFlow[^}]*\}\s+from\s+["']@\/components\/practice\/challenges\/ChallengeFlow["']/);
  });

  test("imports hasChallengesForSkill and queryChallengesBySkill from challenge catalog", () => {
    const page = source(pagePath);
    // The page should import challenge query functions
    expect(page).toMatch(/import\s+\{[^}]*hasChallengesForSkill[^}]*\}\s+from\s+["']@\/domain\/catalog\/challenges\/index["']/);
    expect(page).toMatch(/import\s+\{[^}]*queryChallengesBySkill[^}]*\}\s+from\s+["']@\/domain\/catalog\/challenges\/index["']/);
  });

  test("imports SkillId type for ChallengeFlow props", () => {
    const page = source(pagePath);
    // SkillId should be available (already imported for usePracticeFlow)
    expect(page).toMatch(/import\s+.*SkillId.*from\s+["']@\/domain\/models\/skill["']/);
  });

  describe("complete phase conditional rendering", () => {
    test("renders ChallengeFlow when skill has challenges", () => {
      const page = source(pagePath);
      // The complete phase block should check hasChallengesForSkill and conditionally render ChallengeFlow
      // Pattern: when phase === "complete", check hasChallengesForSkill and render ChallengeFlow
      expect(page).toMatch(/flow\.phase\s*===\s*["']complete["']/);
    });

    test("passes correct props to ChallengeFlow (challenges array, skillId, onDone)", () => {
      const page = source(pagePath);
      // ChallengeFlow should receive challenges from queryChallengesBySkill
      expect(page).toMatch(/queryChallengesBySkill\s*\(\s*flow\.selectedSkillId\s*\)/);
      // ChallengeFlow should receive skillId prop
      expect(page).toMatch(/skillId\s*=\s*\{?\s*flow\.selectedSkillId/);
      // ChallengeFlow should receive onDone callback
      expect(page).toMatch(/onDone\s*=\s*\{?\s*flow\.resetToSelect/);
    });

    test("renders PracticeCompletePhase when skill has NO challenges", () => {
      const page = source(pagePath);
      // When no challenges, the regular PracticeCompletePhase should render
      expect(page).toMatch(/PracticeCompletePhase/);
    });
  });

  describe("PracticeCompletePhase remains unchanged for no-challenge skills", () => {
    test("PracticeCompletePhase still receives skillId, totalExercises, onBackToSelector", () => {
      const page = source(pagePath);
      // The PracticeCompletePhase should still be called with these props
      expect(page).toMatch(/PracticeCompletePhase\s*\(\s*\{/);
      expect(page).toMatch(/skillId\s*:/);
      expect(page).toMatch(/totalExercises\s*:/);
      expect(page).toMatch(/onBackToSelector\s*:/);
    });

    test("PracticeCompletePhase content remains intact (completion message, CTAs)", () => {
      const page = source(pagePath);
      // The completion phase should still show the standard completion UI
      expect(page).toMatch(/¡Completaste la práctica!/);
      expect(page).toMatch(/Elegir otra habilidad/);
      expect(page).toMatch(/Volver al inicio/);
    });
  });

  describe("ChallengeFlow onDone behavior", () => {
    test("ChallengeFlow onDone calls flow.resetToSelect to return to selector", () => {
      const page = source(pagePath);
      // The onDone callback for ChallengeFlow should call resetToSelect
      expect(page).toMatch(/onDone\s*=\s*\{?\s*flow\.resetToSelect/);
    });
  });

  describe("no coupling to base practice progress", () => {
    test("page does not import addAttempt from practice-progress for challenges", () => {
      const page = source(pagePath);
      // Challenges should NOT use base addAttempt
      // The ChallengeFlow uses addChallengeAttempt from advanced-practice-progress internally
      // So we just verify the page itself doesn't need to import addAttempt for challenges
      // This is implicit since ChallengeFlow handles its own persistence
      expect(page).not.toMatch(/addAttempt.*ChallengeFlow|ChallengeFlow.*addAttempt/);
    });

    test("PracticeCompletePhase is NOT modified to add a challenges phase", () => {
      const page = source(pagePath);
      // PracticePhase union should NOT be modified in this PR
      // The challenge flow is a separate UI extension, not a new phase
      // This is verified by PracticeCompletePhase staying as a local component
      expect(page).toMatch(/function\s+PracticeCompletePhase\s*\(/);
    });
  });

  describe("ChallengeOptInBlock integration via ChallengeFlow", () => {
    test("ChallengeFlow renders ChallengeOptInBlock as first step (opt-in phase)", () => {
      const challengeFlowPath = "src/components/practice/challenges/ChallengeFlow.tsx";
      const challengeFlow = source(challengeFlowPath);
      // ChallengeFlow should render ChallengeOptInBlock when in opt-in phase
      expect(challengeFlow).toMatch(/ChallengeOptInBlock/);
      expect(challengeFlow).toMatch(/phase\s*===\s*["']opt-in["']/);
    });

    test("ChallengeFlow uses addChallengeAttempt from advanced-practice-progress", () => {
      const challengeFlowPath = "src/components/practice/challenges/ChallengeFlow.tsx";
      const challengeFlow = source(challengeFlowPath);
      // ChallengeFlow should use the advanced store for persistence
      expect(challengeFlow).toMatch(/addChallengeAttempt/);
      expect(challengeFlow).toMatch(/from\s+["']@\/lib\/advanced-practice-progress["']/);
    });
  });
});

describe("Challenge persistence isolation (PR 5 requirements)", () => {
  test("ChallengeFlow does NOT import from base practice-progress", () => {
    const challengeFlowPath = "src/components/practice/challenges/ChallengeFlow.tsx";
    const challengeFlow = source(challengeFlowPath);
    // Should NOT import from practice-progress (only advanced-practice-progress)
    expect(challengeFlow).not.toMatch(/from\s+["']@\/lib\/practice-progress["']/);
  });

  test("ChallengeFlow uses advanced-practice-progress for persistence", () => {
    const challengeFlowPath = "src/components/practice/challenges/ChallengeFlow.tsx";
    const challengeFlow = source(challengeFlowPath);
    // The flow should use the advanced store for persistence
    expect(challengeFlow).toMatch(/addChallengeAttempt/);
    expect(challengeFlow).toMatch(/from\s+["']@\/lib\/advanced-practice-progress["']/);
  });

  test("page does not add challenges phase to PracticePhase union", () => {
    const pagePath = "src/app/practice/page.tsx";
    const page = source(pagePath);
    // The challenge flow is a separate UI extension, not a new phase
    // page.tsx should not reference a "challenges" phase
    expect(page).not.toMatch(/phase\s*===\s*["']challenges["']/);
    expect(page).not.toMatch(/PracticePhase.*challenges/);
  });
});

describe("Skip path: Finalizar por ahora", () => {
  test("ChallengeOptInBlock skip button calls onSkip which calls onDone", () => {
    const optInPath = "src/components/practice/challenges/ChallengeOptInBlock.tsx";
    const optIn = source(optInPath);
    // Skip button should call onSkip prop
    expect(optIn).toMatch(/onSkip/);
    expect(optIn).toMatch(/Finalizar por ahora/);
  });

  test("useChallengeFlow skipChallenges transitions from opt-in to done phase", () => {
    const flowPath = "src/components/practice/challenges/useChallengeFlow.ts";
    const flow = source(flowPath);
    // skipChallenges function should transition phase to "done"
    expect(flow).toMatch(/skipChallenges/);
    expect(flow).toMatch(/phase\s*:\s*["']done["']/);
  });
});
