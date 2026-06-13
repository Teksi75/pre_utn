import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("StatusPill", () => {
  const componentPath = "src/components/ui/StatusPill.tsx";

  test("exports a StatusPill component and a StatusPillVariant type", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export\s+(?:function|const)\s+StatusPill\b/);
    expect(comp).toMatch(/export\s+type\s+StatusPillVariant\b/);
  });

  test("StatusPillVariant allows exactly the six approved variants", () => {
    const comp = source(componentPath);
    // Extract the union literal list between the pipe chars of the type alias.
    const match = comp.match(
      /export\s+type\s+StatusPillVariant\s*=\s*([\s\S]+?);/,
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
      ["active", "available", "locked", "neutral", "success", "weak"].sort(),
    );
  });

  test("accepts variant and children props and forwards className", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/variant\?:\s*StatusPillVariant/);
    // The component must declare a ReactNode children prop. Either the
    // bare `ReactNode` (preferred) or the namespaced `React.ReactNode`
    // forms are valid; we accept both.
    expect(comp).toMatch(/children\s*:\s*(?:React\.ReactNode|ReactNode)\b/);
    expect(comp).toMatch(/className\?:\s*string/);
    // className should be appended to the computed class list, not overwritten.
    // We assert by sampling the key parts: a ternary on className, and a
    // template literal that interpolates className. Whitespace-insensitive.
    expect(comp).toMatch(/className\s*\?/);
    expect(comp).toMatch(/\$\{className\}/);
  });

  test("uses inline-flex and the badge radius token", () => {
    const comp = source(componentPath);
    expect(comp).toContain("inline-flex");
    expect(comp).toContain("rounded-[var(--radius-badge)]");
  });

  test("maps each variant to the semantic status tokens (no raw hex)", () => {
    const comp = source(componentPath);
    // The variant → classes map should consume the new --color-status-* tokens.
    expect(comp).toMatch(/bg-status-available/);
    expect(comp).toMatch(/bg-status-locked/);
    expect(comp).toMatch(/bg-status-weak/);
    expect(comp).toMatch(/bg-status-success/);
    expect(comp).toMatch(/bg-status-active/);
    expect(comp).toMatch(/text-status-available/);
    expect(comp).toMatch(/text-status-locked/);
    expect(comp).toMatch(/text-status-weak/);
    expect(comp).toMatch(/text-status-success/);
    expect(comp).toMatch(/text-status-active/);

    // Soft variants consume the -soft backgrounds.
    expect(comp).toMatch(/bg-status-available-soft/);
    expect(comp).toMatch(/bg-status-locked-soft/);
    expect(comp).toMatch(/bg-status-weak-soft/);
    expect(comp).toMatch(/bg-status-success-soft/);
    expect(comp).toMatch(/bg-status-active-soft/);

    // Guardrails: no raw hex (#...) and no Tailwind raw palette in the component
    // (no `bg-green-`, `bg-amber-`, `bg-red-`, `text-green-`, `text-amber-`, `text-red-`).
    expect(comp).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(comp).not.toMatch(/\bbg-(?:green|amber|red|yellow|blue|emerald|orange|stone)-\d/);
    expect(comp).not.toMatch(/\btext-(?:green|amber|red|yellow|blue|emerald|orange|stone)-\d/);
    expect(comp).not.toMatch(/\bborder-(?:green|amber|red|yellow|blue|emerald|orange|stone)-\d/);
  });

  test("neutral variant uses the brand surface (no status color)", () => {
    const comp = source(componentPath);
    // The neutral case should not pull any status-* token.
    // We assert by sampling: there's at least one branch keyed on "neutral"
    // that uses brand tokens, not status tokens.
    const neutralMatch = comp.match(/neutral\s*:\s*"([^"]+)"/);
    expect(neutralMatch).not.toBeNull();
    const neutralClasses = neutralMatch![1]!;
    expect(neutralClasses).toMatch(/brand-/);
    expect(neutralClasses).not.toMatch(/status-/);
  });

  test("does not use any, console.log, or TODO", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/:\s*any\b/);
    expect(comp).not.toMatch(/<any\b/);
    expect(comp).not.toContain("console.log");
    expect(comp).not.toMatch(/\bTODO\b/);
  });

  test("forwards aria-* and data-* attributes for accessibility hooks", () => {
    const comp = source(componentPath);
    // We don't need a 100% type-safe rest spread, but the component should
    // at least accept a generic HTMLAttributes shape so callers can add
    // aria-label, data-testid, etc.
    expect(comp).toMatch(/HTMLAttributes/);
  });

  test("does not impose role by default (visual content, not landmark)", () => {
    const comp = source(componentPath);
    // We accept role via spread, but should not hardcode role="..." in the JSX.
    expect(comp).not.toMatch(/role\s*=\s*["'][^"']+["']/);
  });
});
