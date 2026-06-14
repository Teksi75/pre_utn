import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("Card", () => {
  const componentPath = "src/components/ui/Card.tsx";

  test("exports a Card component and a CardVariant type", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export\s+(?:function|const)\s+Card\b/);
    expect(comp).toMatch(/export\s+type\s+CardVariant\b/);
  });

  test("CardVariant allows exactly default | accent | danger", () => {
    const comp = source(componentPath);
    const match = comp.match(
      /export\s+type\s+CardVariant\s*=\s*([\s\S]+?);/,
    );
    expect(match).not.toBeNull();
    const body = match![1] ?? "";
    const variants = Array.from(
      new Set(
        body
          .split("|")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean),
      ),
    );
    expect(variants.sort()).toEqual(["accent", "danger", "default"].sort());
  });

  test("forwards HTMLAttributes (aria-*, data-*) onto the underlying div", () => {
    const comp = source(componentPath);
    // The props type must extend HTMLAttributes<HTMLDivElement>.
    expect(comp).toMatch(/HTMLAttributes<HTMLDivElement>/);
    // The implementation must spread ...rest onto the rendered div.
    expect(comp).toMatch(/\{\.\.\.rest\}/);
    expect(comp).toMatch(/<div\b/);
    expect(comp).toMatch(/<div\b[^>]*\{\.\.\.rest\}/);
  });

  test("variant classes consume only brand / accent / danger tokens (no raw palette)", () => {
    const comp = source(componentPath);
    // The accent variant should pull the new --color-accent-soft /
    // --color-accent-border tokens, not raw amber-NNN.
    expect(comp).toContain("var(--color-accent-soft)");
    expect(comp).toContain("var(--color-accent-border)");
    // The danger variant should pull --color-danger-soft / --color-danger.
    expect(comp).toContain("var(--color-danger-soft)");
    expect(comp).toContain("var(--color-danger)");
    // No raw Tailwind palette in the variant classes.
    expect(comp).not.toMatch(/\b(?:bg|text|border)-(?:amber|red|green|blue|emerald|orange|stone|yellow)-\d/);
    // No raw hex.
    expect(comp).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test("does not use any, console.log, or TODO", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/:\s*any\b/);
    expect(comp).not.toMatch(/<any\b/);
    expect(comp).not.toContain("console.log");
    expect(comp).not.toMatch(/\bTODO\b/);
  });
});

describe("Button", () => {
  const componentPath = "src/components/ui/Button.tsx";

  test("ButtonVariant allows exactly primary | secondary | ghost | danger", () => {
    const comp = source(componentPath);
    const match = comp.match(
      /export\s+type\s+ButtonVariant\s*=\s*([\s\S]+?);/,
    );
    expect(match).not.toBeNull();
    const body = match![1] ?? "";
    const variants = Array.from(
      new Set(
        body
          .split("|")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean),
      ),
    );
    expect(variants.sort()).toEqual(
      ["danger", "ghost", "primary", "secondary"].sort(),
    );
  });

  test("danger variant consumes the danger tokens, not the raw red palette", () => {
    const comp = source(componentPath);
    expect(comp).toContain("var(--color-danger-soft)");
    expect(comp).toContain("var(--color-danger)");
    // No raw red-* in the variant map.
    expect(comp).not.toMatch(/\b(?:bg|text|border)-red-\d/);
  });

  test("preserves min-h-44px and focus-visible ring on the base", () => {
    const comp = source(componentPath);
    expect(comp).toContain("min-h-[44px]");
    expect(comp).toContain("focus-visible:shadow-[var(--ring-focus)]");
  });

  test("does not use any, console.log, or TODO", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/:\s*any\b/);
    expect(comp).not.toMatch(/<any\b/);
    expect(comp).not.toContain("console.log");
    expect(comp).not.toMatch(/\bTODO\b/);
  });
});
