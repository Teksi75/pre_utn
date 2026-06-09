import { describe, test, expect } from "vitest";
import {
  validateTheoryNode,
  type TheoryNode,
  type ConceptBlock,
  type CanonicalTrace,
  type IntervalVisualExample,
} from "../models/theory";

describe("TheoryNode", () => {
  const makeTrace = (overrides: Partial<CanonicalTrace> = {}): CanonicalTrace => ({
    path: "material_canonico/Matemática/UNIDAD1_matemática.pdf",
    section: "1.1 Operaciones con reales",
    sourceUse: "adapted",
    pedagogicalIntent: "Enseñar propiedades de operaciones con números reales",
    ...overrides,
  });

  const makeConcept = (overrides: Partial<ConceptBlock> = {}): ConceptBlock => ({
    id: "concept-cerrado",
    title: "Cerradura",
    body: "El conjunto de los números reales es cerrado bajo suma y multiplicación.",
    ...overrides,
  });

  const makeNode = (overrides: Partial<TheoryNode> = {}): TheoryNode => ({
    id: "theory-propiedades-operaciones-reales",
    skillId: "mat.u1.propiedades_operaciones_reales",
    concepts: [makeConcept()],
    notation: ["a + b", "a × b"],
    commonMistakes: ["Sumar antes que multiplicar"],
    practicePrompts: ["Calcula 2 + 3 × 4"],
    canonicalTrace: [makeTrace()],
    ...overrides,
  });

  const makeIntervalVisual = (
    overrides: Partial<IntervalVisualExample> = {}
  ): IntervalVisualExample => ({
    id: "visual-interval-ray",
    title: "Semirrecta cerrada",
    description: "x ≥ −2 se representa como [−2, +∞).",
    interval: {
      left: { kind: "finite", value: -2, closed: true },
      right: { kind: "positiveInfinity" },
    },
    ...overrides,
  });

  describe("valid theory node", () => {
    test("accepts a complete theory node", () => {
      const node = makeNode();
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(true);
    });

    test("accepts node with multiple concepts", () => {
      const node = makeNode({
        concepts: [
          makeConcept({ id: "c1", title: "Cerradura" }),
          makeConcept({ id: "c2", title: "Conmutatividad" }),
        ],
      });
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(true);
    });

    test("accepts optional interval visual examples", () => {
      const node = makeNode({
        intervalVisuals: [makeIntervalVisual()],
      });
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(true);
    });
  });

  describe("missing required fields", () => {
    test("rejects node with empty concepts", () => {
      const node = makeNode({ concepts: [] });
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("concepts");
      }
    });

    test("rejects node with empty notation", () => {
      const node = makeNode({ notation: [] });
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("notation");
      }
    });

    test("rejects node with empty commonMistakes", () => {
      const node = makeNode({ commonMistakes: [] });
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("commonMistakes");
      }
    });

    test("rejects node with empty canonicalTrace", () => {
      const node = makeNode({ canonicalTrace: [] });
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("canonicalTrace");
      }
    });

    test("rejects node with empty id", () => {
      const node = makeNode({ id: "" });
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("id");
      }
    });
  });

  describe("canonical trace validation", () => {
    test("rejects trace with empty path", () => {
      const node = makeNode({
        canonicalTrace: [makeTrace({ path: "" })],
      });
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("canonicalTrace[0].path");
      }
    });

    test("rejects trace with empty pedagogicalIntent", () => {
      const node = makeNode({
        canonicalTrace: [makeTrace({ pedagogicalIntent: "" })],
      });
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("canonicalTrace[0].pedagogicalIntent");
      }
    });

    test("rejects trace with invalid sourceUse", () => {
      const node = makeNode({
        canonicalTrace: [makeTrace({ sourceUse: "invalid" as CanonicalTrace["sourceUse"] })],
      });
      const result = validateTheoryNode(node);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("canonicalTrace[0].sourceUse");
      }
    });
  });
});
