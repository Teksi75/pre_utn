import { describe, expect, test } from "vitest";
import { parseRichTextSegments } from "./rich-text-parser";

describe("parseRichTextSegments", () => {
  test("keeps plain text without math delimiters", () => {
    expect(parseRichTextSegments("Sin fórmulas por ahora.")).toEqual([
      { kind: "text", value: "Sin fórmulas por ahora." },
    ]);
  });

  test("parses inline math delimited with single dollar signs", () => {
    expect(parseRichTextSegments("El resultado es $x^2$.")).toEqual([
      { kind: "text", value: "El resultado es " },
      { kind: "math", value: "x^2", displayMode: false },
      { kind: "text", value: "." },
    ]);
  });

  test("parses display math delimited with double dollar signs", () => {
    expect(parseRichTextSegments("Ecuación:\n$$x^2 + 1 = 0$$")).toEqual([
      { kind: "text", value: "Ecuación:\n" },
      { kind: "math", value: "x^2 + 1 = 0", displayMode: true },
    ]);
  });

  test("supports mixed inline and display math in one string", () => {
    expect(parseRichTextSegments("Sea $m$ y luego $$y=mx+b$$.")).toEqual([
      { kind: "text", value: "Sea " },
      { kind: "math", value: "m", displayMode: false },
      { kind: "text", value: " y luego " },
      { kind: "math", value: "y=mx+b", displayMode: true },
      { kind: "text", value: "." },
    ]);
  });

  test("keeps unclosed delimiters as plain text", () => {
    expect(parseRichTextSegments("Precio $x sin cierre")).toEqual([
      { kind: "text", value: "Precio $x sin cierre" },
    ]);
  });

  test("keeps empty delimiters as plain text", () => {
    expect(parseRichTextSegments("Nada $$$$ acá")).toEqual([
      { kind: "text", value: "Nada $$$$ acá" },
    ]);
  });
});
