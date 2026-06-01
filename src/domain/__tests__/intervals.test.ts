import { describe, expect, it } from "vitest";
import {
  formatInterval,
  isValidInterval,
  normalizeInfinityInput,
  type IntervalModel,
} from "../intervals/index";

const boundedOpen: IntervalModel = {
  left: { kind: "finite", value: -3, closed: false },
  right: { kind: "finite", value: 2, closed: false },
};

describe("interval model", () => {
  describe("formatInterval", () => {
    it("formats bounded open and closed intervals", () => {
      expect(formatInterval(boundedOpen)).toBe("(−3, 2)");
      expect(
        formatInterval({
          left: { kind: "finite", value: -3, closed: true },
          right: { kind: "finite", value: 2, closed: true },
        })
      ).toBe("[−3, 2]");
      expect(
        formatInterval({
          left: { kind: "finite", value: -3, closed: false },
          right: { kind: "finite", value: 2, closed: true },
        })
      ).toBe("(−3, 2]");
    });

    it("formats intervals with positive and negative infinity", () => {
      expect(
        formatInterval({
          left: { kind: "negativeInfinity" },
          right: { kind: "finite", value: 4, closed: true },
        })
      ).toBe("(−∞, 4]");

      expect(
        formatInterval({
          left: { kind: "finite", value: -2, closed: true },
          right: { kind: "positiveInfinity" },
        })
      ).toBe("[−2, +∞)");

      expect(
        formatInterval({
          left: { kind: "negativeInfinity" },
          right: { kind: "positiveInfinity" },
        })
      ).toBe("(−∞, +∞)");
    });

    it("never formats infinity with square brackets", () => {
      const formatted = formatInterval({
        left: { kind: "negativeInfinity" },
        right: { kind: "positiveInfinity" },
      });

      expect(formatted).not.toContain("[−∞");
      expect(formatted).not.toContain("+∞]");
    });
  });

  describe("isValidInterval", () => {
    it("accepts bounded intervals, rays, and the total interval", () => {
      expect(isValidInterval(boundedOpen)).toBe(true);
      expect(
        isValidInterval({
          left: { kind: "finite", value: -2, closed: true },
          right: { kind: "positiveInfinity" },
        })
      ).toBe(true);
      expect(
        isValidInterval({
          left: { kind: "negativeInfinity" },
          right: { kind: "positiveInfinity" },
        })
      ).toBe(true);
    });

    it("rejects inverted or misplaced infinity intervals", () => {
      expect(
        isValidInterval({
          left: { kind: "finite", value: 2, closed: false },
          right: { kind: "finite", value: -3, closed: true },
        })
      ).toBe(false);
      expect(
        isValidInterval({
          left: { kind: "positiveInfinity" },
          right: { kind: "finite", value: 2, closed: true },
        })
      ).toBe(false);
      expect(
        isValidInterval({
          left: { kind: "finite", value: -2, closed: true },
          right: { kind: "negativeInfinity" },
        })
      ).toBe(false);
    });
  });

  describe("normalizeInfinityInput", () => {
    it.each(["∞", "infinito", "inf", "infinity", "+inf", "+infinity", "+oo", "oo"])(
      "normalizes %s as positive infinity",
      (input) => {
        expect(normalizeInfinityInput(input)).toBe("positiveInfinity");
      }
    );

    it.each(["-∞", "-infinito", "-inf", "-infinity", "-oo"])(
      "normalizes %s as negative infinity",
      (input) => {
        expect(normalizeInfinityInput(input)).toBe("negativeInfinity");
      }
    );

    it("returns null for non-infinity input", () => {
      expect(normalizeInfinityInput("3")).toBeNull();
      expect(normalizeInfinityInput("finito")).toBeNull();
    });
  });
});
