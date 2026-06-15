import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("MathRoutePanel", () => {
  const componentPath =
    "src/components/home/student-home/MathRoutePanel.tsx";

  // ── Original contract ──────────────────────────────────────────────────────

  test("is a Client Component (declared with 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("accepts routeUnits prop of type StudentRouteUnit[] from student-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain("StudentRouteUnit");
    expect(comp).toContain("routeUnits");
  });

  test("renders an <article> element with aria-labelledby", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/<article\b/);
    expect(comp).toMatch(/aria-labelledby/);
  });

  test("renders a heading with an id for aria-labelledby", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/<h3\b/);
    expect(comp).toMatch(/id=/);
  });

  test("does NOT import or render SkillRoadmap", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/<SkillRoadmap/);
    expect(comp).not.toContain('import { SkillRoadmap }');
  });

  test("renders routeUnits as a vertical list (ol or ul)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/routeUnits/);
    const hasList = comp.includes("<ol") || comp.includes("<ul");
    expect(hasList).toBe(true);
  });

  test("displays unit status with explicit Spanish labels", () => {
    const comp = source(componentPath);
    const hasLabels =
      comp.includes("Dominada") ||
      comp.includes("En progreso") ||
      comp.includes("Sin empezar");
    expect(hasLabels).toBe(true);
  });

  test("does not import or use React hooks directly (dumb component)", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/useState/);
    expect(comp).not.toMatch(/useEffect/);
  });

  test("imports StudentRouteUnit type from student-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain('from "@/domain/student-home"');
    expect(comp).toContain("StudentRouteUnit");
  });

  test("has a named export 'MathRoutePanel'", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export function MathRoutePanel/);
  });

  test("heading text is 'Ruta Matemática'", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Ruta Matemática");
  });

  test("heading does not contain old forbidden copy", () => {
    const comp = source(componentPath);
    expect(comp).not.toContain("Tu camino de aprendizaje");
  });

  // ── catalog-readiness-ui: compact unit cards (Home = dashboard, not catalog)

  test("renders compact cards per unit (no per-skill sub-list)", () => {
    const comp = source(componentPath);
    // The per-skill map (skills.map) that was the per-skill renderer is gone.
    expect(comp).not.toMatch(/skills\.map/);
  });

  test("does NOT show '(N habilidades)' suffix anywhere", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/\(\d+ habilidades\)/);
    expect(comp).not.toMatch(/habilidades/);
  });

  test("does NOT render 'Practicar' as a per-skill action", () => {
    const comp = source(componentPath);
    // The label may exist in AVAILABILITY_LABEL constants in the catalog
    // helper, but the panel itself must not surface per-skill "Practicar".
    expect(comp).not.toMatch(/["']Practicar["']/);
  });

  test("does NOT render 'Leer teoría' as a per-skill action (only the unit-level 'Teoría disponible' subtitle)", () => {
    // The compact panel does not show per-skill "Leer teoría" pills.
    // Theory state is surfaced only as the unit-level availability subtitle
    // ("Teoría disponible" in AVAILABILITY_LABEL). Same for "Practicar" →
    // the per-skill pill is gone, the unit subtitle says "Práctica disponible".
    const comp = source(componentPath);
    expect(comp).not.toMatch(/["']Leer teoría["']/);
    expect(comp).not.toMatch(/["']Practicar["']/);
  });

  test("uses 'Ver temas' as the CTA text (NOT 'Ver unidad')", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Ver temas");
    expect(comp).not.toMatch(/["']Ver unidad["']/);
  });

  test("CTA links to /learn/matematica (the topic catalog)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/href=["']\/learn\/matematica["']/);
  });

  test("renders 'Próximamente' for units with no pilot skills (U3–U6)", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Próximamente");
  });

  test("does NOT use 'Sin empezar' for empty units (only in UNIT_STATUS_LABEL)", () => {
    // "Sin empezar" is reserved for the mastery axis of units with skills.
    // U3–U6 with empty skills show "Próximamente" only. We pin the contract
    // by ensuring the string appears at most once in the file (in the
    // UNIT_STATUS_LABEL constant, not in the empty-unit branch).
    const comp = source(componentPath);
    const matches = comp.match(/Sin empezar/g) ?? [];
    expect(matches.length).toBeLessThanOrEqual(1);
  });

  test("renders 'Aún sin temas superados' when unit has 0 mastered skills", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Aún sin temas superados");
  });

  test("renders the 'Temas superados:' label for the chip section", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Temas superados:");
  });

  test("renders the '+N más' overflow indicator with a max-3 chip cap", () => {
    const comp = source(componentPath);
    expect(comp).toContain("MAX_VISIBLE_MASTERED_CHIPS");
    expect(comp).toMatch(/\+\{hidden\} más|\+\{hiddenCount\} más|\+\d+ más/);
  });

  test("renders the unit-availability subtitle labels (Práctica/Teoría/En preparación)", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Práctica disponible");
    expect(comp).toContain("Teoría disponible");
    expect(comp).toContain("En preparación");
  });

  test("does NOT import RouteSkillList (component was removed in this slice)", () => {
    const comp = source(componentPath);
    expect(comp).not.toContain("RouteSkillList");
  });
});
