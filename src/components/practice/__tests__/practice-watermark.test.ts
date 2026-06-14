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

  test("each decorated practice phase (excluding exercise) declares a skillId prop and renders MathWatermark", () => {
    // D3.a: PracticeExercisePhase no longer renders MathWatermark. The
    // exercise screen must be visually quiet so the student focuses on
    // the prompt and options. The other four phases keep their
    // watermark because the context (theory / example / recovery /
    // feedback) is not pure resolution and benefits from the topic
    // identity glyph.
    const decoratedPhaseFiles = [
      "src/components/practice/PracticeTheoryPhase.tsx",
      "src/components/practice/PracticeExamplePhase.tsx",
      "src/components/practice/PracticeFeedbackPhase.tsx",
      "src/components/practice/PracticeRecoveryPhase.tsx",
    ];

    for (const path of decoratedPhaseFiles) {
      const phase = source(path);
      expect(phase).toContain('import { MathWatermark } from "@/components/math-visuals/MathWatermark"');
      expect(phase).toMatch(/skillId\?:\s*string/);
      expect(phase).toMatch(/skillId,\s*\n[\s\S]*}:\s*Practice/);
      expect(phase).toContain("<MathWatermark");
      expect(phase).toContain("skillId={skillId}");
    }
  });

  test("PracticeExercisePhase does NOT import or render MathWatermark (D3.a)", () => {
    const phase = source("src/components/practice/PracticeExercisePhase.tsx");
    expect(phase).not.toContain(
      'import { MathWatermark } from "@/components/math-visuals/MathWatermark"',
    );
    expect(phase).not.toMatch(/<MathWatermark\b/);
    expect(phase).not.toMatch(/<\/MathWatermark>/);
    // The skillId prop is still threaded by the parent (page.tsx
    // contract is unchanged), so the prop can stay in the interface
    // even though nothing inside the component reads it any more.
    expect(phase).toMatch(/skillId\?:\s*string/);
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

  test("feedback uses the card variant at a very low opacity (D3.b)", () => {
    // D3.b: feedback keeps the watermark so the brand identity carries
    // through to the result, but at an almost imperceptible opacity
    // (0.06) so it does not compete with the correctness card and
    // buttons that the student needs to read.
    const phase = source("src/components/practice/PracticeFeedbackPhase.tsx");
    expect(phase).toContain('variant="card"');
    expect(phase).toContain("opacity={0.06}");
    // The previous card opacity of 0.12 is forbidden in feedback.
    expect(phase).not.toMatch(/opacity=\{0\.12\}/);
  });
});
