import { describe, test, expect } from "vitest";
import {
  loadTheoryContent,
  loadExampleContent,
  loadFeedbackContent,
  pilotExercisesWithLinks,
} from "../catalog/content-loaders";
import { validateTheoryNode } from "../models/theory";
import { validateWorkedExample } from "../models/worked-example";

describe("Theory content loading", () => {
  test("loads two pilot theory nodes from JSON", () => {
    const nodes = loadTheoryContent("unit-1");
    expect(nodes).toHaveLength(2);
  });

  test("each theory node has a unique skillId", () => {
    const nodes = loadTheoryContent("unit-1");
    const skillIds = nodes.map((n) => n.skillId);
    expect(new Set(skillIds).size).toBe(2);
  });

  test("each theory node validates successfully", () => {
    const nodes = loadTheoryContent("unit-1");
    for (const node of nodes) {
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(true);
    }
  });

  test("theory nodes cover both pilot skills", () => {
    const nodes = loadTheoryContent("unit-1");
    const skillIds = nodes.map((n) => n.skillId);
    expect(skillIds).toContain("mat.u1.reales_operaciones");
    expect(skillIds).toContain("mat.u1.intervalos");
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
});

describe("Example content loading", () => {
  test("loads four worked examples from JSON", () => {
    const examples = loadExampleContent("unit-1");
    expect(examples).toHaveLength(4);
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

  test("examples cover both pilot skills", () => {
    const examples = loadExampleContent("unit-1");
    const skillIds = examples.map((e) => e.skillId);
    expect(skillIds).toContain("mat.u1.reales_operaciones");
    expect(skillIds).toContain("mat.u1.intervalos");
  });

  test("each skill has at least 2 examples", () => {
    const examples = loadExampleContent("unit-1");
    const reales = examples.filter((e) => e.skillId === "mat.u1.reales_operaciones");
    const intervalos = examples.filter((e) => e.skillId === "mat.u1.intervalos");
    expect(reales.length).toBeGreaterThanOrEqual(2);
    expect(intervalos.length).toBeGreaterThanOrEqual(2);
  });

  test("each example has canonicalTrace entries", () => {
    const examples = loadExampleContent("unit-1");
    for (const ex of examples) {
      expect(ex.canonicalTrace.length).toBeGreaterThanOrEqual(1);
    }
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
