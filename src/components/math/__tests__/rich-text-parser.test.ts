import { describe, test, expect } from "vitest";
import { parseRichTextSegments } from "../rich-text-parser";

describe("parseRichTextSegments", () => {
  test("splits mixed prose and math", () => {
    const result = parseRichTextSegments("Calculá $3^4$ y explicá el resultado");
    expect(result).toEqual([
      { kind: "text", value: "Calculá " },
      { kind: "math", value: "3^4", displayMode: false },
      { kind: "text", value: " y explicá el resultado" },
    ]);
  });

  test("returns plain text when no delimiters", () => {
    const result = parseRichTextSegments("Texto sin matemáticas");
    expect(result).toEqual([{ kind: "text", value: "Texto sin matemáticas" }]);
  });

  test("handles multiple math segments", () => {
    const result = parseRichTextSegments("$a$ y $b$");
    expect(result).toEqual([
      { kind: "math", value: "a", displayMode: false },
      { kind: "text", value: " y " },
      { kind: "math", value: "b", displayMode: false },
    ]);
  });

  test("unclosed $ remains plain text", () => {
    const result = parseRichTextSegments("Resultado $3^4 sin cerrar");
    expect(result).toEqual([
      { kind: "text", value: "Resultado $3^4 sin cerrar" },
    ]);
  });

  test("empty delimiters remain plain text", () => {
    const result = parseRichTextSegments("Antes $$ después");
    expect(result).toEqual([{ kind: "text", value: "Antes $$ después" }]);
  });

  test("math at start of string", () => {
    const result = parseRichTextSegments("$x^2$ al inicio");
    expect(result).toEqual([
      { kind: "math", value: "x^2", displayMode: false },
      { kind: "text", value: " al inicio" },
    ]);
  });

  test("math at end of string", () => {
    const result = parseRichTextSegments("al final $y^3$");
    expect(result).toEqual([
      { kind: "text", value: "al final " },
      { kind: "math", value: "y^3", displayMode: false },
    ]);
  });

  test("display math uses displayMode true", () => {
    const result = parseRichTextSegments("Resolvé $$x^2+1=0$$");
    expect(result).toEqual([
      { kind: "text", value: "Resolvé " },
      { kind: "math", value: "x^2+1=0", displayMode: true },
    ]);
  });
});
