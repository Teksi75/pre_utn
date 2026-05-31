import { describe, test, expect } from "vitest";
import { generateFeedback, type FeedbackMapping } from "../feedback/index";

describe("generateFeedback", () => {
  const mappings: FeedbackMapping[] = [
    {
      errorTag: "u1_orden_operaciones",
      type: "corrective",
      message: "Revisá el orden de operaciones: multiplicá antes de sumar.",
    },
    {
      errorTag: "u1_intervalo_extremos",
      type: "conceptual",
      message: "Los extremos de un intervalo determinan si están incluidos o no.",
    },
    {
      errorTag: "u1_propiedad_operacion",
      type: "procedural",
      message: "Aplicá la propiedad distributiva antes de simplificar.",
    },
    {
      errorTag: "u1_agrupacion_signo",
      type: "corrective",
      message: "Cuidado con los signos al agrupar términos semejantes.",
    },
  ];

  describe("correct answer", () => {
    test("returns positive feedback for correct answer", () => {
      const result = generateFeedback(true, undefined, mappings);
      expect(result.type).toBe("corrective");
      expect(result.message).toContain("Correcto");
    });

    test("correct feedback ignores errorTag even if provided", () => {
      const result = generateFeedback(true, "u1_orden_operaciones", mappings);
      expect(result.type).toBe("corrective");
      expect(result.message).toContain("Correcto");
    });
  });

  describe("incorrect with tagged error", () => {
    test("returns corrective feedback for tagged error", () => {
      const result = generateFeedback(false, "u1_orden_operaciones", mappings);
      expect(result.type).toBe("corrective");
      expect(result.message).toContain("orden de operaciones");
    });

    test("returns conceptual feedback for conceptual tag", () => {
      const result = generateFeedback(false, "u1_intervalo_extremos", mappings);
      expect(result.type).toBe("conceptual");
      expect(result.message).toContain("extremos");
    });

    test("returns procedural feedback for procedural tag", () => {
      const result = generateFeedback(false, "u1_propiedad_operacion", mappings);
      expect(result.type).toBe("procedural");
      expect(result.message).toContain("propiedad distributiva");
    });
  });

  describe("incorrect without tag", () => {
    test("returns general retry feedback for untagged error", () => {
      const result = generateFeedback(false, undefined, mappings);
      expect(result.type).toBe("corrective");
      expect(result.message).toContain("Revisá");
    });
  });

  describe("unknown tag", () => {
    test("returns general retry feedback for unmapped tag", () => {
      const result = generateFeedback(false, "u99_unknown_tag", mappings);
      expect(result.type).toBe("corrective");
      expect(result.message).toContain("Revisá");
    });
  });

  describe("feedback boundaries", () => {
    test("feedback does not contain the final answer", () => {
      const result = generateFeedback(false, "u1_orden_operaciones", mappings);
      expect(result.message).not.toMatch(/\b14\b/);
    });
  });
});
