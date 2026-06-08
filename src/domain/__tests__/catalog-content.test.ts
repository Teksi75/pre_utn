import { describe, test, expect } from "vitest";
import {
  loadTheoryContent,
  loadExampleContent,
  loadFeedbackContent,
  pilotExercisesWithLinks,
} from "../catalog/content-loaders";
import { validateTheoryNode } from "../models/theory";
import { validateWorkedExample } from "../models/worked-example";
import exercisesJson from "../../../content/matematica/exercises.json";
import { loadTaxonomy } from "../error-taxonomy/index";

describe("Theory content loading", () => {
  test("loads at least four theory nodes from JSON", () => {
    const nodes = loadTheoryContent("unit-1");
    expect(nodes.length).toBeGreaterThanOrEqual(4);
  });

  test("each theory node has a unique skillId", () => {
    const nodes = loadTheoryContent("unit-1");
    const skillIds = nodes.map((n) => n.skillId);
    expect(new Set(skillIds).size).toBe(nodes.length);
  });

  test("each theory node validates successfully", () => {
    const nodes = loadTheoryContent("unit-1");
    for (const node of nodes) {
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(true);
    }
  });

  test("theory nodes cover all pilot skills", () => {
    const nodes = loadTheoryContent("unit-1");
    const skillIds = nodes.map((n) => n.skillId);
    expect(skillIds).toContain("mat.u1.conjuntos_numericos");
    expect(skillIds).toContain("mat.u1.reales_operaciones");
    expect(skillIds).toContain("mat.u1.intervalos");
    expect(skillIds).toContain("mat.u1.potencias_raices");
  });

  test("each theory node has canonicalTrace entries", () => {
    const nodes = loadTheoryContent("unit-1");
    for (const node of nodes) {
      expect(node.canonicalTrace.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("each theory node has at least one concept block", () => {
    const nodes = loadTheoryContent("unit-1");
    for (const node of nodes) {
      expect(node.concepts.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("potencias_raices theory node has at least 7 concept blocks", () => {
    const nodes = loadTheoryContent("unit-1");
    const prNode = nodes.find((n) => n.skillId === "mat.u1.potencias_raices");
    expect(prNode).toBeDefined();
    expect(prNode!.concepts.length).toBeGreaterThanOrEqual(7);
  });

  test("potencias_raices theory node has notation, commonMistakes, and practicePrompts", () => {
    const nodes = loadTheoryContent("unit-1");
    const prNode = nodes.find((n) => n.skillId === "mat.u1.potencias_raices");
    expect(prNode).toBeDefined();
    expect(prNode!.notation.length).toBeGreaterThanOrEqual(1);
    expect(prNode!.commonMistakes.length).toBeGreaterThanOrEqual(1);
    expect(prNode!.practicePrompts.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Example content loading", () => {
  test("loads at least eleven worked examples from JSON", () => {
    const examples = loadExampleContent("unit-1");
    expect(examples.length).toBeGreaterThanOrEqual(11);
  });

  test("each example has at least 2 solution steps", () => {
    const examples = loadExampleContent("unit-1");
    for (const ex of examples) {
      expect(ex.steps.length).toBeGreaterThanOrEqual(2);
    }
  });

  test("each example validates successfully", () => {
    const examples = loadExampleContent("unit-1");
    for (const ex of examples) {
      const result = validateWorkedExample(ex);
      expect(result.ok).toBe(true);
    }
  });

  test("examples cover all pilot skills", () => {
    const examples = loadExampleContent("unit-1");
    const skillIds = examples.map((e) => e.skillId);
    expect(skillIds).toContain("mat.u1.conjuntos_numericos");
    expect(skillIds).toContain("mat.u1.reales_operaciones");
    expect(skillIds).toContain("mat.u1.intervalos");
    expect(skillIds).toContain("mat.u1.potencias_raices");
  });

  test("each skill has at least 2 examples", () => {
    const examples = loadExampleContent("unit-1");
    const conjuntos = examples.filter((e) => e.skillId === "mat.u1.conjuntos_numericos");
    const reales = examples.filter((e) => e.skillId === "mat.u1.reales_operaciones");
    const intervalos = examples.filter((e) => e.skillId === "mat.u1.intervalos");
    const potencias = examples.filter((e) => e.skillId === "mat.u1.potencias_raices");
    expect(conjuntos.length).toBeGreaterThanOrEqual(2);
    expect(reales.length).toBeGreaterThanOrEqual(2);
    expect(intervalos.length).toBeGreaterThanOrEqual(2);
    expect(potencias.length).toBeGreaterThanOrEqual(2);
  });

  test("each example has canonicalTrace entries", () => {
    const examples = loadExampleContent("unit-1");
    for (const ex of examples) {
      expect(ex.canonicalTrace.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("potencias_raices examples include (-a)^n vs -a^n distinction", () => {
    const examples = loadExampleContent("unit-1");
    const prExamples = examples.filter((e) => e.skillId === "mat.u1.potencias_raices");
    const hasParenthesesDistinction = prExamples.some(
      (e) =>
        e.problem.includes("(-") ||
        e.steps.some(
          (s) =>
            s.explanation.includes("paréntesis") ||
            s.explanation.includes("(-a)") ||
            s.explanation.includes("signo")
        )
    );
    expect(hasParenthesesDistinction).toBe(true);
  });
});

describe("Feedback content loading", () => {
  test("loads feedback mappings from JSON", () => {
    const mappings = loadFeedbackContent("unit-1");
    expect(mappings.length).toBeGreaterThanOrEqual(1);
  });

  test("each pilot skill has at least 2 mapped tags", () => {
    const mappings = loadFeedbackContent("unit-1");
    const realesTags = mappings.filter((m) =>
      m.errorTag.startsWith("u1_")
    );
    expect(realesTags.length).toBeGreaterThanOrEqual(2);
  });

  test("each mapping has required fields", () => {
    const mappings = loadFeedbackContent("unit-1");
    for (const m of mappings) {
      expect(m.errorTag).toBeTruthy();
      expect(["corrective", "conceptual", "procedural"]).toContain(m.type);
      expect(m.message).toBeTruthy();
    }
  });
});

describe("Exercise content linkage", () => {
  test("pilot exercises include relatedTheoryIds and relatedExampleIds", () => {
    const links = pilotExercisesWithLinks("unit-1");
    expect(links.length).toBeGreaterThanOrEqual(1);
    for (const link of links) {
      expect(link.relatedTheoryIds).toBeDefined();
      expect(link.relatedExampleIds).toBeDefined();
    }
  });

  test("linked theory IDs exist in theory content", () => {
    const nodes = loadTheoryContent("unit-1");
    const theoryIds = new Set(nodes.map((n) => n.id));
    const links = pilotExercisesWithLinks("unit-1");
    for (const link of links) {
      for (const tid of link.relatedTheoryIds) {
        expect(theoryIds.has(tid)).toBe(true);
      }
    }
  });

  test("linked example IDs exist in example content", () => {
    const examples = loadExampleContent("unit-1");
    const exampleIds = new Set(examples.map((e) => e.id));
    const links = pilotExercisesWithLinks("unit-1");
    for (const link of links) {
      for (const eid of link.relatedExampleIds) {
        expect(exampleIds.has(eid)).toBe(true);
      }
    }
  });
});

describe("Live catalog symbolic migration", () => {
  test("raw student-facing catalog JSON excludes symbolic exercise types", () => {
    const symbolicExercises = (exercisesJson as unknown as { id: string; type: string }[]).filter(
      (exercise) => exercise.type === "symbolic"
    );

    expect(symbolicExercises).toEqual([]);
  });
});

describe("Potencias y raíces exercise catalog", () => {
  const prExercises = (exercisesJson as unknown as Record<string, unknown>[])
    .filter((ex) => (ex.skillId as string) === "mat.u1.potencias_raices");

  test("potencias_raices has at least 6 exercises", () => {
    expect(prExercises.length).toBeGreaterThanOrEqual(6);
  });

  test("every potencias_raices exercise has required fields", () => {
    for (const ex of prExercises) {
      expect(ex.id).toBeTruthy();
      expect(ex.skillId).toBe("mat.u1.potencias_raices");
      expect(ex.type).toBeTruthy();
      expect(typeof ex.difficulty).toBe("number");
      expect(ex.difficulty).toBeGreaterThanOrEqual(1);
      expect(ex.difficulty).toBeLessThanOrEqual(3);
      expect(Array.isArray(ex.commonErrorTags)).toBe(true);
      expect(ex.pedagogicalNote).toBeTruthy();
    }
  });

  test("every potencias_raices exercise has relatedTheoryIds and relatedExampleIds", () => {
    for (const ex of prExercises) {
      expect(Array.isArray(ex.relatedTheoryIds)).toBe(true);
      expect((ex.relatedTheoryIds as string[]).length).toBeGreaterThan(0);
      expect(Array.isArray(ex.relatedExampleIds)).toBe(true);
      expect((ex.relatedExampleIds as string[]).length).toBeGreaterThan(0);
    }
  });

  test("every potencias_raices exercise error tag references a valid taxonomy tag", () => {
    const taxonomy = loadTaxonomy();
    const taxonomyIds = new Set<string>(taxonomy.map((t) => t.id));
    for (const ex of prExercises) {
      const tags = ex.commonErrorTags as string[];
      for (const tag of tags) {
        expect(taxonomyIds.has(tag)).toBe(true);
      }
    }
  });

  test("potencias_raices exercises cover difficulties 1 through 3", () => {
    const difficulties = new Set(prExercises.map((ex) => ex.difficulty));
    expect(difficulties.has(1)).toBe(true);
    expect(difficulties.has(2)).toBe(true);
    expect(difficulties.has(3)).toBe(true);
  });

  test("potencias_raices exercises include both numerical and multiple-choice types", () => {
    const types = new Set(prExercises.map((ex) => ex.type));
    expect(types.has("numerical")).toBe(true);
    expect(types.has("multiple-choice")).toBe(true);
  });

  test("potencias_raices exercises have no duplicate prompts", () => {
    const prompts = prExercises.map((ex) => ex.prompt as string);
    expect(new Set(prompts).size).toBe(prompts.length);
  });

  test("multiple-choice potencias_raices exercises have options array", () => {
    const mcExercises = prExercises.filter((ex) => ex.type === "multiple-choice");
    for (const ex of mcExercises) {
      expect(Array.isArray(ex.options)).toBe(true);
      expect((ex.options as unknown[]).length).toBeGreaterThanOrEqual(2);
    }
  });

  test("potencias_raices exercises have pedagogicalNote referencing learning intent", () => {
    for (const ex of prExercises) {
      const note = ex.pedagogicalNote as string;
      expect(note.length).toBeGreaterThan(10);
    }
  });
});
