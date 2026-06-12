import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("TeacherDigitalHero", () => {
  const componentPath = "src/components/home/teacher-home/TeacherDigitalHero.tsx";

  test("is a Client Component (declared with 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("accepts hero prop of type Mission from teacher-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain("Mission");
    expect(comp).toContain("hero:");
  });

  test("renders an <article> element with aria-labelledby referencing a heading id", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/<article\b/);
    expect(comp).toMatch(/aria-labelledby/);
  });

  test("renders hero.title as <h2> heading with an id for aria-labelledby", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/<h2\b/);
    expect(comp).toContain("{hero.title}");
  });

  test("renders hero.subtitle as a <p> element", () => {
    const comp = source(componentPath);
    expect(comp).toContain("{hero.subtitle}");
  });

  test("renders a Next.js <Link> as CTA with hero.ctaHref and hero.ctaLabel", () => {
    const comp = source(componentPath);
    expect(comp).toContain("<Link");
    expect(comp).toContain("hero.ctaHref");
    expect(comp).toContain("hero.ctaLabel");
  });

  test("CTA link enforces min-h-[44px] touch target", () => {
    const comp = source(componentPath);
    expect(comp).toContain("min-h-[44px]");
  });

  test("CTA link uses focus-visible ring for keyboard accessibility", () => {
    const comp = source(componentPath);
    expect(comp).toContain("focus-visible");
  });

  test("imports Link from next/link", () => {
    const comp = source(componentPath);
    expect(comp).toContain('from "next/link"');
  });

  test("imports Mission type from teacher-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain('from "@/domain/teacher-home"');
    expect(comp).toContain("Mission");
  });

  test("has a named export 'TeacherDigitalHero'", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export function TeacherDigitalHero/);
  });

  test("does not import or use React hooks directly (dumb component)", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/useState/);
    expect(comp).not.toMatch(/useEffect/);
  });

  test("hero.title in domain must be 'Tu profesor digital' (not 'Bienvenido/a al panel docente' or 'Tu panel de decisiones')", () => {
    const domainSrc = source("src/domain/teacher-home/index.ts");
    expect(domainSrc).toContain('"Tu profesor digital"');
    expect(domainSrc).not.toContain("Bienvenido/a al panel docente");
    expect(domainSrc).not.toContain("Tu panel de decisiones");
  });
});
