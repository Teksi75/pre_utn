import { describe, test, expect } from "vitest";
import katex from "katex";

describe("KaTeX rendering via renderToString", () => {
  test("renders power as superscript", () => {
    const html = katex.renderToString("3^4", { throwOnError: false });
    expect(html).toContain("sup");
    expect(html).toContain("4");
  });

  test("renders square root with sqrt class", () => {
    const html = katex.renderToString("\\sqrt{x+y}", { throwOnError: false });
    expect(html).toContain("sqrt");
    expect(html).toContain("x");
    expect(html).toContain("y");
  });

  test("renders indexed cube root", () => {
    const html = katex.renderToString("\\sqrt[3]{8}", { throwOnError: false });
    expect(html).toContain("sqrt");
    expect(html).toContain("root");
    expect(html).toContain("8");
  });

  test("invalid LaTeX does not throw with throwOnError false", () => {
    expect(() => {
      katex.renderToString("\\invalid{", { throwOnError: false });
    }).not.toThrow();
  });

  test("renders plain number without error", () => {
    const html = katex.renderToString("42", { throwOnError: false });
    expect(html).toContain("42");
  });

  test("renders fraction", () => {
    const html = katex.renderToString("\\frac{1}{2}", { throwOnError: false });
    expect(html).toContain("1");
    expect(html).toContain("2");
  });
});
