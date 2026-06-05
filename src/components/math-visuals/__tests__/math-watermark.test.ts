import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("MathWatermark wrapper", () => {
  const wrapperPath = "src/components/math-visuals/MathWatermark.tsx";
  const platePath = "src/components/math-visuals/MathThemePlate.tsx";

  test("declares the documented prop surface (topic, skillId, variant, opacity, className, children)", () => {
    const wrapper = source(wrapperPath);
    expect(wrapper).toMatch(/topic\?\s*:\s*MathTheme/);
    expect(wrapper).toMatch(/skillId\?\s*:\s*string/);
    expect(wrapper).toMatch(/variant\?\s*:\s*MathThemeVariant/);
    expect(wrapper).toMatch(/opacity\?\s*:\s*number/);
    expect(wrapper).toMatch(/className\?\s*:\s*string/);
    expect(wrapper).toMatch(/children\?\s*:\s*ReactNode/);
  });

  test("uses MathThemePlate as the rendering primitive (does not reimplement SVG)", () => {
    const wrapper = source(wrapperPath);
    expect(wrapper).toContain("MathThemePlate");
    expect(wrapper).not.toMatch(/<svg\b/);
  });

  test("positions the container as relative and overflow-hidden", () => {
    const wrapper = source(wrapperPath);
    expect(wrapper).toContain("relative");
    expect(wrapper).toContain("overflow-hidden");
  });

  test("positions the watermark layer as absolute inset-0 behind the content", () => {
    const wrapper = source(wrapperPath);
    expect(wrapper).toContain('"absolute inset-0');
  });

  test("positions children above the watermark via relative z-10", () => {
    const wrapper = source(wrapperPath);
    expect(wrapper).toContain('"relative z-10"');
  });

  test("resolves topic via skillId -> mathThemeForSkill precedence over direct topic prop", () => {
    const wrapper = source(wrapperPath);
    // Must invoke mathThemeForSkill(skillId) when skillId is provided
    expect(wrapper).toContain("mathThemeForSkill(skillId)");
    // Must use a "sets" fallback (either literal or constant resolving to "sets")
    expect(wrapper).toContain('"sets"');
  });

  test("defines default opacities per variant: hero 0.40, background 0.45, card 0.35 (visible against light background)", () => {
    const wrapper = source(wrapperPath);
    const opacityBlock = wrapper.match(/DEFAULT_OPACITY[^}]+\}/);
    expect(opacityBlock).not.toBeNull();
    const block = opacityBlock![0];
    expect(block).toMatch(/hero:\s*0\.40/);
    expect(block).toMatch(/background:\s*0\.45/);
    expect(block).toMatch(/card:\s*0\.35/);
  });

  test("defaults variant to background when omitted", () => {
    const wrapper = source(wrapperPath);
    // Either a direct default or a DEFAULT_VARIANT constant resolving to "background"
    const hasDirectDefault = /variant\s*=\s*"background"/.test(wrapper);
    const hasConstantDefault =
      /DEFAULT_VARIANT[^=]*=\s*"background"/.test(wrapper) ||
      /DEFAULT_VARIANT\s*:\s*MathThemeVariant\s*=\s*"background"/.test(wrapper);
    expect(hasDirectDefault || hasConstantDefault).toBe(true);
  });

  test("forwards an opacity value to MathThemePlate (default or override)", () => {
    const wrapper = source(wrapperPath);
    // The component must read opacity ?? DEFAULT_OPACITY[variant] somewhere
    // (either inline or via an intermediate variable)
    expect(wrapper).toMatch(/opacity\s*\?\?\s*DEFAULT_OPACITY/);
  });

  test("does not hide the outer container from assistive tech (children must remain announced)", () => {
    const wrapper = source(wrapperPath);
    // Strip MathThemePlate usage to avoid false positives from a literal substring
    const linesWithoutPlate = wrapper
      .split("\n")
      .filter((line) => !line.includes("MathThemePlate"))
      .join("\n");
    expect(linesWithoutPlate).not.toMatch(/aria-hidden/);
  });

  test("relies on MathThemePlate for aria-hidden on the SVG layer (no duplicate)", () => {
    const wrapper = source(wrapperPath);
    const plate = source(platePath);
    // MathThemePlate must carry aria-hidden on its wrapper div
    expect(plate).toContain('aria-hidden="true"');
    // The wrapper itself should not re-apply aria-hidden
    expect(wrapper).not.toMatch(/aria-hidden/);
  });

  test("relies on MathThemePlate for pointer-events-none on the watermark layer (no duplicate)", () => {
    const wrapper = source(wrapperPath);
    const plate = source(platePath);
    // MathThemePlate must carry pointer-events-none
    expect(plate).toContain("pointer-events-none");
    // The wrapper itself should not re-apply pointer-events-none
    expect(wrapper).not.toMatch(/pointer-events-none/);
  });

  test("does not duplicate the app-watermark class (it lives on MathThemePlate)", () => {
    const wrapper = source(wrapperPath);
    expect(wrapper).not.toContain("app-watermark");
  });

  test("is a Client Component (declared with 'use client' directive)", () => {
    const wrapper = source(wrapperPath);
    expect(wrapper).toMatch(/["']use client["']/);
  });

  test("forwards className to the outer container so callers can override layout", () => {
    const wrapper = source(wrapperPath);
    // className must be referenced alongside the default positioning classes
    expect(wrapper).toContain("className");
    expect(wrapper).toMatch(/className[\s\S]*?containerClasses/);
  });
});
