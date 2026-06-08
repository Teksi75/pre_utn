import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

const phaseFiles = [
  "src/components/practice/PracticeTheoryPhase.tsx",
  "src/components/practice/PracticeExamplePhase.tsx",
  "src/components/practice/PracticeExercisePhase.tsx",
  "src/components/practice/PracticeFeedbackPhase.tsx",
  "src/components/practice/PracticeRecoveryPhase.tsx",
] as const;

describe("practice phase MathWatermark integration", () => {
  test("threads selectedSkillId from the practice page into every decorated phase", () => {
    const page = source("src/app/practice/page.tsx");
    expect(page).toContain("skillId={flow.selectedSkillId ?? undefined}");
    expect(page.match(/skillId=\{flow\.selectedSkillId \?\? undefined\}/g)).toHaveLength(6);
  });

  test("each decorated practice phase declares a skillId prop and renders MathWatermark", () => {
    for (const path of phaseFiles) {
      const phase = source(path);
      expect(phase).toContain('import { MathWatermark } from "@/components/math-visuals/MathWatermark"');
      expect(phase).toMatch(/skillId\?:\s*string/);
      expect(phase).toMatch(/skillId,\s*\n[\s\S]*}:\s*Practice/);
      expect(phase).toContain("<MathWatermark");
      expect(phase).toContain("skillId={skillId}");
    }
  });

  test("theory, example, and recovery use the background variant at visible background opacity", () => {
    const backgroundPhaseFiles = [
      "src/components/practice/PracticeTheoryPhase.tsx",
      "src/components/practice/PracticeExamplePhase.tsx",
      "src/components/practice/PracticeRecoveryPhase.tsx",
    ];

    for (const path of backgroundPhaseFiles) {
      const phase = source(path);
      expect(phase).toContain('variant="background"');
      expect(phase).toContain("opacity={0.18}");
    }
  });

  test("exercise and feedback use the card variant at card opacity", () => {
    const cardPhaseFiles = [
      "src/components/practice/PracticeExercisePhase.tsx",
      "src/components/practice/PracticeFeedbackPhase.tsx",
    ];

    for (const path of cardPhaseFiles) {
      const phase = source(path);
      expect(phase).toContain('variant="card"');
      expect(phase).toContain("opacity={0.12}");
    }
  });
});
