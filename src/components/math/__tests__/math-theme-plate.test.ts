import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { MATH_THEMES } from "../../math-visuals";
import { mathThemeForSkill, mathThemeForTopic } from "../../math-visuals/topic-map";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("math visual system", () => {
  test("defines the eight reusable visual themes required by the visual brief", () => {
    expect(MATH_THEMES).toEqual([
      "sets",
      "irrationals",
      "powers",
      "roots",
      "intervals",
      "absolute",
      "logs",
      "complex",
    ]);
  });

  test("maps known skill ids and topic labels to the closest visual theme", () => {
    expect(mathThemeForSkill("mat.u1.conjuntos_numericos")).toBe("sets");
    expect(mathThemeForSkill("mat.u1.potencias_raices")).toBe("powers");
    expect(mathThemeForSkill("mat.u1.racionalizacion")).toBe("roots");
    expect(mathThemeForSkill("mat.u1.intervalos")).toBe("intervals");
    expect(mathThemeForSkill("mat.u1.valor_absoluto")).toBe("absolute");
    expect(mathThemeForSkill("mat.u1.logaritmos")).toBe("logs");
    expect(mathThemeForTopic("números complejos")).toBe("complex");
    expect(mathThemeForTopic("raíz de dos")).toBe("irrationals");
  });

  test("falls back safely when a skill id is not recognized", () => {
    expect(mathThemeForSkill("mat.u9.tema_futuro")).toBe("sets");
    expect(mathThemeForTopic("tema futuro")).toBeUndefined();
  });

  test("MathThemePlate is decorative, non-interactive, responsive, and opacity-controlled", () => {
    const plate = source("src/components/math-visuals/MathThemePlate.tsx");
    expect(plate).toContain('aria-hidden="true"');
    expect(plate).toContain("pointer-events-none");
    expect(plate).toContain("viewBox=\"0 0 160 112\"");
    expect(plate).toContain("opacity ?? DEFAULT_OPACITY[variant]");
  });

  test("each visual is implemented as code SVG, not as an external bitmap asset", () => {
    for (const file of [
      "SetsVisual.tsx",
      "IrrationalsVisual.tsx",
      "PowersVisual.tsx",
      "RootsVisual.tsx",
      "IntervalsVisual.tsx",
      "AbsoluteVisual.tsx",
      "LogsVisual.tsx",
      "ComplexVisual.tsx",
    ]) {
      const visual = source(`src/components/math-visuals/${file}`);
      expect(visual).toContain("currentColor");
      expect(visual).not.toMatch(/\.png|\.jpg|\.jpeg|<image/i);
    }
  });
});
