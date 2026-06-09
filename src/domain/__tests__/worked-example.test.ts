import { describe, test, expect } from "vitest";
import {
  validateWorkedExample,
  type WorkedExample,
  type SolutionStep,
  type CanonicalTrace,
} from "../models/worked-example";

describe("WorkedExample", () => {
  const makeTrace = (overrides: Partial<CanonicalTrace> = {}): CanonicalTrace => ({
    path: "material_canonico/Matemática/RESOLUCIÓN DE EJERCICIOS SEMINARIO UNIVERSITARIO MATEMÁTICA.pdf",
    section: "Ejercicio 1",
    sourceUse: "adapted",
    pedagogicalIntent: "Mostrar paso a paso la resolución de una operación con reales",
    ...overrides,
  });

  const makeStep = (overrides: Partial<SolutionStep> = {}): SolutionStep => ({
    order: 1,
    explanation: "Identificamos las operaciones según PEMDAS",
    ...overrides,
  });

  const makeExample = (overrides: Partial<WorkedExample> = {}): WorkedExample => ({
    id: "example-reales-1",
    skillId: "mat.u1.propiedades_operaciones_reales",
    problem: "Calcula 2 + 3 × 4",
    steps: [makeStep(), makeStep({ order: 2, explanation: "Multiplicamos primero: 3 × 4 = 12" })],
    finalAnswer: "14",
    pedagogicalNote: "Siempre respetar el orden de operaciones: multiplicaciones antes que sumas.",
    canonicalTrace: [makeTrace()],
    ...overrides,
  });

  describe("valid worked example", () => {
    test("accepts a complete worked example", () => {
      const example = makeExample();
      const result = validateWorkedExample(example);
      expect(result.ok).toBe(true);
    });

    test("accepts example with 3+ steps", () => {
      const example = makeExample({
        steps: [
          makeStep({ order: 1 }),
          makeStep({ order: 2 }),
          makeStep({ order: 3, explanation: "Sumamos los resultados" }),
        ],
      });
      const result = validateWorkedExample(example);
      expect(result.ok).toBe(true);
    });
  });

  describe("missing required fields", () => {
    test("rejects example with empty problem", () => {
      const example = makeExample({ problem: "" });
      const result = validateWorkedExample(example);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("problem");
      }
    });

    test("rejects example with empty steps", () => {
      const example = makeExample({ steps: [] });
      const result = validateWorkedExample(example);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("steps");
      }
    });

    test("rejects example with only one step (shallow)", () => {
      const example = makeExample({ steps: [makeStep()] });
      const result = validateWorkedExample(example);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("steps");
      }
    });

    test("rejects example with empty finalAnswer", () => {
      const example = makeExample({ finalAnswer: "" });
      const result = validateWorkedExample(example);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("finalAnswer");
      }
    });

    test("rejects example with empty canonicalTrace", () => {
      const example = makeExample({ canonicalTrace: [] });
      const result = validateWorkedExample(example);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("canonicalTrace");
      }
    });

    test("rejects example with empty id", () => {
      const example = makeExample({ id: "" });
      const result = validateWorkedExample(example);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("id");
      }
    });
  });

  describe("step ordering", () => {
    test("steps must start at order 1", () => {
      const example = makeExample({
        steps: [makeStep({ order: 2 }), makeStep({ order: 3 })],
      });
      const result = validateWorkedExample(example);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("steps");
      }
    });

    test("steps must be sequential", () => {
      const example = makeExample({
        steps: [makeStep({ order: 1 }), makeStep({ order: 3 })],
      });
      const result = validateWorkedExample(example);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("steps");
      }
    });

    test("accepts sequential steps starting at 1", () => {
      const example = makeExample({
        steps: [
          makeStep({ order: 1 }),
          makeStep({ order: 2 }),
          makeStep({ order: 3 }),
        ],
      });
      const result = validateWorkedExample(example);
      expect(result.ok).toBe(true);
    });
  });
});
