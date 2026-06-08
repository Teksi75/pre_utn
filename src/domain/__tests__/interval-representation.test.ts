import { describe, expect, it } from "vitest";
import {
  type IntervalRepresentation,
  type IntervalBound,
  type EndpointInclusion,
  validateIntervalRepresentation,
  isValidIntervalRepresentation,
  formatIntervalRepresentation,
  generateAriaLabel,
} from "../intervals/representation";

describe("IntervalRepresentation", () => {
  describe("validateIntervalRepresentation", () => {
    it("accepts a valid bounded closed interval", () => {
      const rep: IntervalRepresentation = {
        id: "int-1",
        notation: "[−2, 3]",
        setBuilderLabel: "{x ∈ ℝ | −2 ≤ x ≤ 3}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "finite", value: 3 },
        lowerInclusion: "closed",
        upperInclusion: "closed",
        ariaLabel: "Intervalo cerrado [−2, 3], menos 2 menor o igual a x menor o igual a 3",
      };
      expect(validateIntervalRepresentation(rep).ok).toBe(true);
    });

    it("accepts a valid bounded open interval", () => {
      const rep: IntervalRepresentation = {
        id: "int-2",
        notation: "(−3, 2)",
        setBuilderLabel: "{x ∈ ℝ | −3 < x < 2}",
        lower: { kind: "finite", value: -3 },
        upper: { kind: "finite", value: 2 },
        lowerInclusion: "open",
        upperInclusion: "open",
        ariaLabel: "Intervalo abierto (−3, 2), menos 3 menor que x menor que 2",
      };
      expect(validateIntervalRepresentation(rep).ok).toBe(true);
    });

    it("accepts a valid half-open interval", () => {
      const rep: IntervalRepresentation = {
        id: "int-3",
        notation: "[−2, 5)",
        setBuilderLabel: "{x ∈ ℝ | −2 ≤ x < 5}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "finite", value: 5 },
        lowerInclusion: "closed",
        upperInclusion: "open",
        ariaLabel: "Intervalo semiabierto [−2, 5), menos 2 menor o igual a x menor que 5",
      };
      expect(validateIntervalRepresentation(rep).ok).toBe(true);
    });

    it("accepts a valid unbounded interval with negative infinity", () => {
      const rep: IntervalRepresentation = {
        id: "int-4",
        notation: "(−∞, 4]",
        setBuilderLabel: "{x ∈ ℝ | x ≤ 4}",
        lower: { kind: "infinity", direction: "negative" },
        upper: { kind: "finite", value: 4 },
        lowerInclusion: "open",
        upperInclusion: "closed",
        ariaLabel: "Intervalo con infinito negativo hasta 4 cerrado, x menor o igual a 4",
      };
      expect(validateIntervalRepresentation(rep).ok).toBe(true);
    });

    it("accepts a valid unbounded interval with positive infinity", () => {
      const rep: IntervalRepresentation = {
        id: "int-5",
        notation: "[−2, +∞)",
        setBuilderLabel: "{x ∈ ℝ | x ≥ −2}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "infinity", direction: "positive" },
        lowerInclusion: "closed",
        upperInclusion: "open",
        ariaLabel: "Intervalo desde menos 2 cerrado con infinito positivo, x mayor o igual a menos 2",
      };
      expect(validateIntervalRepresentation(rep).ok).toBe(true);
    });

    it("accepts the total real interval", () => {
      const rep: IntervalRepresentation = {
        id: "int-6",
        notation: "(−∞, +∞)",
        setBuilderLabel: "{x ∈ ℝ}",
        lower: { kind: "infinity", direction: "negative" },
        upper: { kind: "infinity", direction: "positive" },
        lowerInclusion: "open",
        upperInclusion: "open",
        ariaLabel: "Intervalo total de menos infinito a mas infinito, todos los reales",
      };
      expect(validateIntervalRepresentation(rep).ok).toBe(true);
    });

    it("rejects interval with empty id", () => {
      const rep: IntervalRepresentation = {
        id: "",
        notation: "[−2, 3]",
        setBuilderLabel: "{x ∈ ℝ | −2 ≤ x ≤ 3}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "finite", value: 3 },
        lowerInclusion: "closed",
        upperInclusion: "closed",
        ariaLabel: "test",
      };
      const result = validateIntervalRepresentation(rep);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("id");
      }
    });

    it("rejects interval with empty notation", () => {
      const rep: IntervalRepresentation = {
        id: "int-1",
        notation: "",
        setBuilderLabel: "{x ∈ ℝ | −2 ≤ x ≤ 3}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "finite", value: 3 },
        lowerInclusion: "closed",
        upperInclusion: "closed",
        ariaLabel: "test",
      };
      const result = validateIntervalRepresentation(rep);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("notation");
      }
    });

    it("rejects interval with empty setBuilderLabel", () => {
      const rep: IntervalRepresentation = {
        id: "int-1",
        notation: "[−2, 3]",
        setBuilderLabel: "",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "finite", value: 3 },
        lowerInclusion: "closed",
        upperInclusion: "closed",
        ariaLabel: "test",
      };
      const result = validateIntervalRepresentation(rep);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("setBuilderLabel");
      }
    });

    it("rejects interval with empty ariaLabel", () => {
      const rep: IntervalRepresentation = {
        id: "int-1",
        notation: "[−2, 3]",
        setBuilderLabel: "{x ∈ ℝ | −2 ≤ x ≤ 3}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "finite", value: 3 },
        lowerInclusion: "closed",
        upperInclusion: "closed",
        ariaLabel: "",
      };
      const result = validateIntervalRepresentation(rep);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("ariaLabel");
      }
    });

    it("rejects bounded interval where lower > upper", () => {
      const rep: IntervalRepresentation = {
        id: "int-1",
        notation: "[5, 3]",
        setBuilderLabel: "{x ∈ ℝ | 5 ≤ x ≤ 3}",
        lower: { kind: "finite", value: 5 },
        upper: { kind: "finite", value: 3 },
        lowerInclusion: "closed",
        upperInclusion: "closed",
        ariaLabel: "test",
      };
      const result = validateIntervalRepresentation(rep);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("bounds");
      }
    });

    it("rejects infinity bound with closed inclusion", () => {
      const rep: IntervalRepresentation = {
        id: "int-1",
        notation: "[−2, +∞]",
        setBuilderLabel: "{x ∈ ℝ | x ≥ −2}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "infinity", direction: "positive" },
        lowerInclusion: "closed",
        upperInclusion: "closed",
        ariaLabel: "test",
      };
      const result = validateIntervalRepresentation(rep);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("upperInclusion");
      }
    });

    it("rejects negative infinity on right side", () => {
      const rep: IntervalRepresentation = {
        id: "int-1",
        notation: "[−2, −∞)",
        setBuilderLabel: "test",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "infinity", direction: "negative" },
        lowerInclusion: "closed",
        upperInclusion: "open",
        ariaLabel: "test",
      };
      const result = validateIntervalRepresentation(rep);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("upper");
      }
    });

    it("rejects positive infinity on left side", () => {
      const rep: IntervalRepresentation = {
        id: "int-1",
        notation: "(+∞, 3]",
        setBuilderLabel: "test",
        lower: { kind: "infinity", direction: "positive" },
        upper: { kind: "finite", value: 3 },
        lowerInclusion: "open",
        upperInclusion: "closed",
        ariaLabel: "test",
      };
      const result = validateIntervalRepresentation(rep);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe("lower");
      }
    });
  });

  describe("isValidIntervalRepresentation", () => {
    it("returns true for valid intervals", () => {
      const rep: IntervalRepresentation = {
        id: "int-1",
        notation: "[−2, 3]",
        setBuilderLabel: "{x ∈ ℝ | −2 ≤ x ≤ 3}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "finite", value: 3 },
        lowerInclusion: "closed",
        upperInclusion: "closed",
        ariaLabel: "test",
      };
      expect(isValidIntervalRepresentation(rep)).toBe(true);
    });

    it("returns false for invalid intervals", () => {
      const rep: IntervalRepresentation = {
        id: "",
        notation: "[−2, 3]",
        setBuilderLabel: "{x ∈ ℝ | −2 ≤ x ≤ 3}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "finite", value: 3 },
        lowerInclusion: "closed",
        upperInclusion: "closed",
        ariaLabel: "test",
      };
      expect(isValidIntervalRepresentation(rep)).toBe(false);
    });
  });

  describe("formatIntervalRepresentation", () => {
    it("formats bounded closed interval", () => {
      const rep: IntervalRepresentation = {
        id: "int-1",
        notation: "[−2, 3]",
        setBuilderLabel: "{x ∈ ℝ | −2 ≤ x ≤ 3}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "finite", value: 3 },
        lowerInclusion: "closed",
        upperInclusion: "closed",
        ariaLabel: "test",
      };
      expect(formatIntervalRepresentation(rep)).toBe("[−2, 3]");
    });

    it("formats bounded open interval", () => {
      const rep: IntervalRepresentation = {
        id: "int-2",
        notation: "(−3, 2)",
        setBuilderLabel: "{x ∈ ℝ | −3 < x < 2}",
        lower: { kind: "finite", value: -3 },
        upper: { kind: "finite", value: 2 },
        lowerInclusion: "open",
        upperInclusion: "open",
        ariaLabel: "test",
      };
      expect(formatIntervalRepresentation(rep)).toBe("(−3, 2)");
    });

    it("formats interval with positive infinity", () => {
      const rep: IntervalRepresentation = {
        id: "int-5",
        notation: "[−2, +∞)",
        setBuilderLabel: "{x ∈ ℝ | x ≥ −2}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "infinity", direction: "positive" },
        lowerInclusion: "closed",
        upperInclusion: "open",
        ariaLabel: "test",
      };
      expect(formatIntervalRepresentation(rep)).toBe("[−2, +∞)");
    });

    it("formats interval with negative infinity", () => {
      const rep: IntervalRepresentation = {
        id: "int-4",
        notation: "(−∞, 4]",
        setBuilderLabel: "{x ∈ ℝ | x ≤ 4}",
        lower: { kind: "infinity", direction: "negative" },
        upper: { kind: "finite", value: 4 },
        lowerInclusion: "open",
        upperInclusion: "closed",
        ariaLabel: "test",
      };
      expect(formatIntervalRepresentation(rep)).toBe("(−∞, 4]");
    });

    it("formats total real interval", () => {
      const rep: IntervalRepresentation = {
        id: "int-6",
        notation: "(−∞, +∞)",
        setBuilderLabel: "{x ∈ ℝ}",
        lower: { kind: "infinity", direction: "negative" },
        upper: { kind: "infinity", direction: "positive" },
        lowerInclusion: "open",
        upperInclusion: "open",
        ariaLabel: "test",
      };
      expect(formatIntervalRepresentation(rep)).toBe("(−∞, +∞)");
    });
  });

  describe("generateAriaLabel", () => {
    it("generates descriptive label for bounded closed interval", () => {
      const rep: IntervalRepresentation = {
        id: "int-1",
        notation: "[−2, 3]",
        setBuilderLabel: "{x ∈ ℝ | −2 ≤ x ≤ 3}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "finite", value: 3 },
        lowerInclusion: "closed",
        upperInclusion: "closed",
        ariaLabel: "test",
      };
      const label = generateAriaLabel(rep);
      expect(label).toContain("[−2, 3]");
      expect(label).toContain("cerrado");
      expect(label).toContain("−2");
      expect(label).toContain("3");
    });

    it("generates descriptive label for interval with infinity", () => {
      const rep: IntervalRepresentation = {
        id: "int-5",
        notation: "[−2, +∞)",
        setBuilderLabel: "{x ∈ ℝ | x ≥ −2}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "infinity", direction: "positive" },
        lowerInclusion: "closed",
        upperInclusion: "open",
        ariaLabel: "test",
      };
      const label = generateAriaLabel(rep);
      expect(label).toContain("[−2, +∞)");
      expect(label).toContain("infinito");
      expect(label).toContain("−2");
    });

    it("generates descriptive label for open interval", () => {
      const rep: IntervalRepresentation = {
        id: "int-2",
        notation: "(−3, 2)",
        setBuilderLabel: "{x ∈ ℝ | −3 < x < 2}",
        lower: { kind: "finite", value: -3 },
        upper: { kind: "finite", value: 2 },
        lowerInclusion: "open",
        upperInclusion: "open",
        ariaLabel: "test",
      };
      const label = generateAriaLabel(rep);
      expect(label).toContain("(−3, 2)");
      expect(label).toContain("abierto");
    });

    it("generates descriptive label for half-open interval", () => {
      const rep: IntervalRepresentation = {
        id: "int-3",
        notation: "[−2, 5)",
        setBuilderLabel: "{x ∈ ℝ | −2 ≤ x < 5}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "finite", value: 5 },
        lowerInclusion: "closed",
        upperInclusion: "open",
        ariaLabel: "test",
      };
      const label = generateAriaLabel(rep);
      expect(label).toContain("[−2, 5)");
      expect(label).toContain("semiabierto");
    });

    it("includes set-builder condition in aria label", () => {
      const rep: IntervalRepresentation = {
        id: "int-1",
        notation: "[−2, 3]",
        setBuilderLabel: "{x ∈ ℝ | −2 ≤ x ≤ 3}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "finite", value: 3 },
        lowerInclusion: "closed",
        upperInclusion: "closed",
        ariaLabel: "test",
      };
      const label = generateAriaLabel(rep);
      expect(label).toContain("{x ∈ ℝ | −2 ≤ x ≤ 3}");
    });

    it("includes all required accessibility information", () => {
      const rep: IntervalRepresentation = {
        id: "int-5",
        notation: "[−2, +∞)",
        setBuilderLabel: "{x ∈ ℝ | x ≥ −2}",
        lower: { kind: "finite", value: -2 },
        upper: { kind: "infinity", direction: "positive" },
        lowerInclusion: "closed",
        upperInclusion: "open",
        ariaLabel: "test",
      };
      const label = generateAriaLabel(rep);

      // Must contain notation
      expect(label).toContain("[−2, +∞)");
      // Must contain endpoint inclusion description
      expect(label).toContain("semiabierto");
      // Must contain ray direction for infinity
      expect(label).toContain("infinito positivo");
      // Must contain set-builder condition
      expect(label).toContain("{x ∈ ℝ | x ≥ −2}");
    });

    it("includes ray direction for negative infinity", () => {
      const rep: IntervalRepresentation = {
        id: "int-4",
        notation: "(−∞, 4]",
        setBuilderLabel: "{x ∈ ℝ | x ≤ 4}",
        lower: { kind: "infinity", direction: "negative" },
        upper: { kind: "finite", value: 4 },
        lowerInclusion: "open",
        upperInclusion: "closed",
        ariaLabel: "test",
      };
      const label = generateAriaLabel(rep);

      expect(label).toContain("infinito negativo");
      expect(label).toContain("(−∞, 4]");
    });
  });
});
