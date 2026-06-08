import { describe, expect, it } from "vitest";
import { validateTheoryNode, type TheoryNode } from "../models/theory";
import { validateWorkedExample, type WorkedExample } from "../models/worked-example";
import { validateExercise, type Exercise } from "../models/exercise";
import type { IntervalRepresentation } from "../intervals/representation";

const mockIntervalRep: IntervalRepresentation = {
  id: "int-test",
  notation: "[−2, 3]",
  setBuilderLabel: "{x ∈ ℝ | −2 ≤ x ≤ 3}",
  lower: { kind: "finite", value: -2 },
  upper: { kind: "finite", value: 3 },
  lowerInclusion: "closed",
  upperInclusion: "closed",
  ariaLabel: "Intervalo cerrado [−2, 3]",
};

describe("TheoryNode with intervalRepresentations", () => {
  it("accepts theory node with concept blocks that have intervalRepresentations", () => {
    const node: TheoryNode = {
      id: "theory-1",
      skillId: "mat.u1.intervalos",
      concepts: [{
        id: "c1",
        title: "Test",
        body: "Body",
        intervalRepresentations: [mockIntervalRep],
      }],
      notation: ["[a, b]"],
      commonMistakes: ["Error"],
      practicePrompts: ["Practice"],
      canonicalTrace: [{
        path: "test.pdf",
        sourceUse: "adapted",
        pedagogicalIntent: "Test",
      }],
    };
    const result = validateTheoryNode(node);
    expect(result.ok).toBe(true);
  });

  it("accepts theory node without intervalRepresentations", () => {
    const node: TheoryNode = {
      id: "theory-1",
      skillId: "mat.u1.intervalos",
      concepts: [{ id: "c1", title: "Test", body: "Body" }],
      notation: ["[a, b]"],
      commonMistakes: ["Error"],
      practicePrompts: ["Practice"],
      canonicalTrace: [{
        path: "test.pdf",
        sourceUse: "adapted",
        pedagogicalIntent: "Test",
      }],
    };
    const result = validateTheoryNode(node);
    expect(result.ok).toBe(true);
  });
});

describe("WorkedExample with intervalRepresentations", () => {
  it("accepts solution step with optional intervalRepresentations", () => {
    const example: WorkedExample = {
      id: "ex-1",
      skillId: "mat.u1.intervalos",
      problem: "Representar [−2, 3]",
      steps: [
        {
          order: 1,
          explanation: "Paso 1",
          intervalRepresentations: [mockIntervalRep],
        },
        {
          order: 2,
          explanation: "Paso 2",
        },
      ],
      finalAnswer: "[−2, 3]",
      pedagogicalNote: "Nota",
      canonicalTrace: [{
        path: "test.pdf",
        sourceUse: "adapted",
        pedagogicalIntent: "Test",
      }],
    };
    const result = validateWorkedExample(example);
    expect(result.ok).toBe(true);
  });
});

describe("Exercise with ExerciseOption objects", () => {
  it("accepts exercise with string options (backward compatible)", () => {
    const exercise: Exercise = {
      id: "ex.u1.intervalos.1",
      skillId: "mat.u1.intervalos",
      type: "multiple-choice",
      difficulty: 2,
      prompt: "¿Cuál es la notación?",
      expectedAnswer: "[−2, 3]",
      commonErrorTags: ["u1_error_intervalo"],
      pedagogicalNote: "Nota",
      options: ["[−2, 3]", "(−2, 3)", "[−2, 3)", "(−2, 3]"],
    };
    const knownSkills = new Set(["mat.u1.intervalos"] as const);
    const knownTags = new Set(["u1_error_intervalo"]);
    const result = validateExercise(exercise, knownSkills, knownTags);
    expect(result.ok).toBe(true);
  });

  it("accepts exercise with ExerciseOption objects", () => {
    const exercise: Exercise = {
      id: "ex.u1.intervalos.2",
      skillId: "mat.u1.intervalos",
      type: "multiple-choice",
      difficulty: 2,
      prompt: "¿Cuál es la representación gráfica?",
      expectedAnswer: "[−2, 3]",
      commonErrorTags: ["u1_error_intervalo"],
      pedagogicalNote: "Nota",
      options: [
        { value: "[−2, 3]", label: "[−2, 3]", intervalRepresentation: mockIntervalRep },
        { value: "(−2, 3)", label: "(−2, 3)" },
        { value: "[−2, 3)", label: "[−2, 3)" },
        { value: "(−2, 3]", label: "(−2, 3]" },
      ],
    };
    const knownSkills = new Set(["mat.u1.intervalos"] as const);
    const knownTags = new Set(["u1_error_intervalo"]);
    const result = validateExercise(exercise, knownSkills, knownTags);
    expect(result.ok).toBe(true);
  });

  it("rejects exercise with ExerciseOption objects if expectedAnswer not in values", () => {
    const exercise: Exercise = {
      id: "ex.u1.intervalos.3",
      skillId: "mat.u1.intervalos",
      type: "multiple-choice",
      difficulty: 2,
      prompt: "Test",
      expectedAnswer: "[−2, 3]",
      commonErrorTags: ["u1_error_intervalo"],
      pedagogicalNote: "Nota",
      options: [
        { value: "(−2, 3)", label: "(−2, 3)" },
        { value: "[−2, 3)", label: "[−2, 3)" },
      ],
    };
    const knownSkills = new Set(["mat.u1.intervalos"] as const);
    const knownTags = new Set(["u1_error_intervalo"]);
    const result = validateExercise(exercise, knownSkills, knownTags);
    expect(result.ok).toBe(false);
  });
});
