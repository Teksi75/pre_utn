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

  test("positions the container as relative and overflow-hidden, watermark as absolute, children above the watermark", () => {
    const wrapper = source(wrapperPath);
    // Outer container contract
    expect(wrapper).toMatch(/className=.*relative[^"]*overflow-hidden/s);
    // Watermark layer: MathThemePlate receives an absolute-inset-0 class
    expect(wrapper).toContain('"absolute inset-0');
    // Children layer: above the watermark (z-10)
    expect(wrapper).toContain('"relative z-10"');
  });

  test("resolves topic via skillId -> mathThemeForSkill precedence over direct topic prop", () => {
    const wrapper = source(wrapperPath);
    // Resolves skillId through mathThemeForSkill, then falls back to direct topic, then "sets"
    expect(wrapper).toContain("mathThemeForSkill");
    expect(wrapper).toMatch(
      /skillId\s*\?\s*mathThemeForSkill\(\s*skillId\s*\)\s*:\s*\(?\s*topic\s*\?\?\s*"sets"\s*\)?/
    );
  });

  test("defines default opacities per variant: hero 0.15, background 0.18, card 0.12", () => {
    const wrapper = source(wrapperPath);
    const opacityBlock = wrapper.match(/DEFAULT_OPACITY[^}]+\}/);
    expect(opacityBlock).not.toBeNull();
    const block = opacityBlock![0];
    expect(block).toMatch(/hero:\s*0\.15/);
    expect(block).toMatch(/background:\s*0\.18/);
    expect(block).toMatch(/card:\s*0\.12/);
  });

  test("defaults variant to background when omitted", () => {
    const wrapper = source(wrapperPath);
    // The component must default variant to "background" before resolving opacity
    expect(wrapper).toMatch(/variant\s*\?\?\s*"background"/);
  });

  test("applies explicit opacity prop to MathThemePlate (overrides default)", () => {
    const wrapper = source(wrapperPath);
    // Expect opacity ?? DEFAULT_OPACITY[variant] pattern forwarded to MathThemePlate
    expect(wrapper).toMatch(/opacity=\{opacity\s*\?\?\s*DEFAULT_OPACITY\[variant\?\?\s*"background"\]\}/);
  });

  test("does not hide the outer container from assistive tech (children must remain announced)", () => {
    const wrapper = source(wrapperPath);
    // The outer wrapper <div> should not have aria-hidden
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
    // className must be concatenated with the default positioning classes
    expect(wrapper).toMatch(/className=.*className/s);
  });
});
