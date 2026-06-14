import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function navSource(): string {
  return readFileSync(join(repoRoot, "src/components/Nav.tsx"), "utf8");
}

describe("Nav — mobile-safe (E2)", () => {
  it("wraps the link row in an overflow-x-auto container so 375px cannot horizontally scroll the page", () => {
    const src = navSource();
    // The 4 link items live inside a flex container. E2 wraps that
    // container (or its parent) in an overflow-x-auto so a long
    // active-student chip name + 4 nav items never push the body
    // wider than the viewport.
    expect(src).toMatch(/overflow-x-auto/);
  });

  it("hides the scrollbar on the overflow container (Webkit + Firefox)", () => {
    const src = navSource();
    // Webkit (Chrome, Edge, Safari) — Tailwind v4 arbitrary variant.
    expect(src).toMatch(/\[&::-webkit-scrollbar\]:hidden/);
    // Firefox / modern browsers — set via the React style prop
    // (camelCase). The component should also use a class fallback
    // when running outside React (e.g. in a snapshot); the inline
    // style is the source of truth in our setup.
    expect(src).toMatch(/scrollbarWidth:\s*"none"/);
  });

  it("keeps touch inertia on iOS for the overflow container", () => {
    const src = navSource();
    // The overflow container must opt in to momentum scrolling
    // for touch devices via the legacy -webkit-overflow-scrolling
    // (still required for older iOS Safari). React style prop
    // uses the camelCase form WebkitOverflowScrolling.
    expect(src).toMatch(/WebkitOverflowScrolling:\s*"touch"/);
  });

  it("keeps the 4 nav items, the active chip, and aria-current intact", () => {
    // Regression: the E2 wrapper must not remove any link or break
    // the aria-current contract.
    const src = navSource();
    for (const label of ["Inicio", "Aprender", "Práctica", "Diagnóstico"]) {
      expect(src).toContain(label);
    }
    expect(src).toContain('aria-label="Principal"');
    expect(src).toContain('aria-current');
    expect(src).toContain("Alumno activo:");
  });

  it("does not introduce any, console.log, or TODO in the Nav component", () => {
    const src = navSource();
    expect(src).not.toMatch(/:\s*any\b/);
    expect(src).not.toMatch(/<any\b/);
    expect(src).not.toContain("console.log");
    expect(src).not.toMatch(/\bTODO\b/);
  });
});
