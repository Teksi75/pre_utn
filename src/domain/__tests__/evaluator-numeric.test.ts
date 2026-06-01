import { describe, test, expect } from "vitest";
import { evaluateNumeric } from "../evaluator/numeric";

describe("Numeric evaluator", () => {
  describe("tolerance boundary", () => {
    test("3.1405 is accepted when expected is 3.14 (within 0.01 tolerance)", () => {
      const result = evaluateNumeric("3.14", "3.1405");
      expect(result.correct).toBe(true);
    });

    test("3.16 is rejected when expected is 3.14 (outside 0.01 tolerance)", () => {
      const result = evaluateNumeric("3.14", "3.16");
      expect(result.correct).toBe(false);
    });

    test("3.20 is rejected when expected is 3.14 (well outside tolerance)", () => {
      const result = evaluateNumeric("3.14", "3.20");
      expect(result.correct).toBe(false);
    });

    test("3.141 is accepted when expected is 3.14 (just inside tolerance)", () => {
      const result = evaluateNumeric("3.14", "3.141");
      expect(result.correct).toBe(true);
    });
  });

  describe("exact match", () => {
    test("identical numbers are correct", () => {
      const result = evaluateNumeric("42", "42");
      expect(result.correct).toBe(true);
    });

    test("0 matches 0", () => {
      const result = evaluateNumeric("0", "0");
      expect(result.correct).toBe(true);
    });

    test("-5 matches -5", () => {
      const result = evaluateNumeric("-5", "-5");
      expect(result.correct).toBe(true);
    });

    test("unicode minus expected answer matches keyboard hyphen student answer", () => {
      const result = evaluateNumeric("−4", "-4");
      expect(result.correct).toBe(true);
    });

    test("keyboard hyphen expected answer matches unicode minus student answer", () => {
      const result = evaluateNumeric("-4", "−4");
      expect(result.correct).toBe(true);
    });
  });

  describe("out-of-tolerance", () => {
    test("100 is rejected when expected is 50", () => {
      const result = evaluateNumeric("50", "100");
      expect(result.correct).toBe(false);
    });

    test("negative vs positive is rejected", () => {
      const result = evaluateNumeric("5", "-5");
      expect(result.correct).toBe(false);
    });
  });

  describe("empty answer", () => {
    test("empty answer is incorrect", () => {
      const result = evaluateNumeric("5", "");
      expect(result.correct).toBe(false);
    });

    test("whitespace-only answer is incorrect", () => {
      const result = evaluateNumeric("5", "   ");
      expect(result.correct).toBe(false);
    });
  });

  describe("non-numeric answers", () => {
    test("non-numeric string is incorrect", () => {
      const result = evaluateNumeric("5", "abc");
      expect(result.correct).toBe(false);
    });

    test("mixed text and number is incorrect", () => {
      const result = evaluateNumeric("5", "5 apples");
      expect(result.correct).toBe(false);
    });
  });
});
