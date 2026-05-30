import { describe, test, expect } from "vitest";
import { evaluateExact } from "../evaluator/exact";

describe("Exact evaluator", () => {
  describe("whitespace trimming", () => {
    test("leading and trailing spaces are trimmed", () => {
      const result = evaluateExact("hello", "  hello  ");
      expect(result.correct).toBe(true);
    });

    test("tab characters are trimmed", () => {
      const result = evaluateExact("answer", "\tanswer\t");
      expect(result.correct).toBe(true);
    });

    test("newlines are trimmed", () => {
      const result = evaluateExact("x+1", "\nx+1\n");
      expect(result.correct).toBe(true);
    });
  });

  describe("case insensitivity", () => {
    test("uppercase student answer matches lowercase expected", () => {
      const result = evaluateExact("abc", "ABC");
      expect(result.correct).toBe(true);
    });

    test("mixed case matches", () => {
      const result = evaluateExact("Hello World", "hELLO wORLD");
      expect(result.correct).toBe(true);
    });

    test("Spanish characters are case-insensitive", () => {
      const result = evaluateExact("respuesta", "RESPUESTA");
      expect(result.correct).toBe(true);
    });
  });

  describe("exact match after normalization", () => {
    test("identical strings match", () => {
      const result = evaluateExact("x^2 + 1", "x^2 + 1");
      expect(result.correct).toBe(true);
    });

    test("different strings do not match", () => {
      const result = evaluateExact("x+1", "x+2");
      expect(result.correct).toBe(false);
    });

    test("partial match is rejected", () => {
      const result = evaluateExact("abc", "abcd");
      expect(result.correct).toBe(false);
    });
  });

  describe("empty answer", () => {
    test("empty student answer is incorrect", () => {
      const result = evaluateExact("something", "");
      expect(result.correct).toBe(false);
    });

    test("whitespace-only student answer is incorrect", () => {
      const result = evaluateExact("something", "   ");
      expect(result.correct).toBe(false);
    });
  });

  describe("special characters", () => {
    test("mathematical symbols are compared literally", () => {
      const result = evaluateExact("√2", "√2");
      expect(result.correct).toBe(true);
    });

    test("different mathematical symbols do not match", () => {
      const result = evaluateExact("√2", "∛2");
      expect(result.correct).toBe(false);
    });
  });
});
