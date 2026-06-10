import { describe, test, expect } from "vitest";
import { evaluateBoolean } from "../evaluator/boolean";

describe("Boolean evaluator", () => {
  describe("true aliases", () => {
    test("v is accepted as true", () => {
      const result = evaluateBoolean("true", "v");
      expect(result.correct).toBe(true);
    });

    test("verdadero is accepted as true", () => {
      const result = evaluateBoolean("true", "verdadero");
      expect(result.correct).toBe(true);
    });

    test("true is accepted as true", () => {
      const result = evaluateBoolean("true", "true");
      expect(result.correct).toBe(true);
    });

    test("sí is accepted as true", () => {
      const result = evaluateBoolean("true", "sí");
      expect(result.correct).toBe(true);
    });

    test("si (without accent) is accepted as true", () => {
      const result = evaluateBoolean("true", "si");
      expect(result.correct).toBe(true);
    });
  });

  describe("false aliases", () => {
    test("f is accepted as false", () => {
      const result = evaluateBoolean("false", "f");
      expect(result.correct).toBe(true);
    });

    test("falso is accepted as false", () => {
      const result = evaluateBoolean("false", "falso");
      expect(result.correct).toBe(true);
    });

    test("false is accepted as false", () => {
      const result = evaluateBoolean("false", "false");
      expect(result.correct).toBe(true);
    });

    test("no is accepted as false", () => {
      const result = evaluateBoolean("false", "no");
      expect(result.correct).toBe(true);
    });
  });

  describe("case insensitivity", () => {
    test("VERDADERO matches true", () => {
      const result = evaluateBoolean("true", "VERDADERO");
      expect(result.correct).toBe(true);
    });

    test("FALSO matches false", () => {
      const result = evaluateBoolean("false", "FALSO");
      expect(result.correct).toBe(true);
    });

    test("True matches true", () => {
      const result = evaluateBoolean("true", "True");
      expect(result.correct).toBe(true);
    });
  });

  describe("wrong answers", () => {
    test("true expected but false alias given", () => {
      const result = evaluateBoolean("true", "f");
      expect(result.correct).toBe(false);
    });

    test("false expected but true alias given", () => {
      const result = evaluateBoolean("false", "v");
      expect(result.correct).toBe(false);
    });

    test("unrecognized string is incorrect", () => {
      const result = evaluateBoolean("true", "maybe");
      expect(result.correct).toBe(false);
    });
  });

  describe("Spanish expected values", () => {
    test("Verdadero expected, Verdadero answered", () => {
      const result = evaluateBoolean("Verdadero", "Verdadero");
      expect(result.correct).toBe(true);
    });

    test("Verdadero expected, Falso answered", () => {
      const result = evaluateBoolean("Verdadero", "Falso");
      expect(result.correct).toBe(false);
    });

    test("Falso expected, Falso answered", () => {
      const result = evaluateBoolean("Falso", "Falso");
      expect(result.correct).toBe(true);
    });

    test("Falso expected, Verdadero answered", () => {
      const result = evaluateBoolean("Falso", "Verdadero");
      expect(result.correct).toBe(false);
    });

    test("Verdadero expected accepts v alias", () => {
      const result = evaluateBoolean("Verdadero", "v");
      expect(result.correct).toBe(true);
    });

    test("Falso expected accepts f alias", () => {
      const result = evaluateBoolean("Falso", "f");
      expect(result.correct).toBe(true);
    });
  });

  describe("empty answer", () => {
    test("empty answer is incorrect", () => {
      const result = evaluateBoolean("true", "");
      expect(result.correct).toBe(false);
    });

    test("whitespace-only answer is incorrect", () => {
      const result = evaluateBoolean("true", "   ");
      expect(result.correct).toBe(false);
    });
  });
});
