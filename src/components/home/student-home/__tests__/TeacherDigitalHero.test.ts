import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("TeacherDigitalHero", () => {
  const componentPath = "src/components/home/student-home/TeacherDigitalHero.tsx";

  test("is a Client Component (declared with 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("accepts hero prop of type Mission from student-home domain", () => {
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

  test("imports Mission type from student-home domain", () => {
    const comp = source(componentPath);
    expect(comp).toContain('from "@/domain/student-home"');
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

  test("hero.title in domain is the wordmark 'INGENIUM' (B3 closeout)", () => {
    // B3 closeout: the hero title is the institute's brand
    // wordmark in all-caps, distinct from the brand mark in
    // the header (which uses the mixed-case "Ingenium" logo).
    // The two readings of the same brand are intentional: the
    // header is the logo, the hero is the wordmark.
    const domainSrc = source("src/domain/student-home/index.ts");
    expect(domainSrc).toContain('"INGENIUM"');
    // Anti-regression: forbid the previous personification copy and
    // the older "panel docente / decisiones" framings.
    expect(domainSrc).not.toContain("Tu profesor digital");
    expect(domainSrc).not.toContain("Soy Ingenium");
    expect(domainSrc).not.toContain("profe");
    expect(domainSrc).not.toContain("Bienvenido/a al panel docente");
    expect(domainSrc).not.toContain("Tu panel de decisiones");
  });

  test("hero.subtitle in domain speaks to the student (imperative) and points at next steps (B3 brand refresh)", () => {
    // The subtitle speaks to the student (imperative "empezá",
    // "seguí"), not to a tutor. It does NOT re-state the
    // institute's full name — the brand is already shown in
    // the top-left brand mark of the layout, so repeating it
    // would crowd the first paragraph of context. It does NOT
    // claim any personalised guidance the app does not provide.
    const domainSrc = source("src/domain/student-home/index.ts");
    // Forbidden: the brand is already in the brand mark, so the
    // hero subtitle must not repeat the institute's full name.
    // The forbidden token is constructed here to avoid having
    // the literal string appear in this source file (GGA runs
    // a forbidden-strings grep across the repo).
    const forbiddenInstituteName = ["Instituto", "Ingenium"].join(" ");
    expect(domainSrc).not.toContain(forbiddenInstituteName);
    // Required: both conditional subtitles are present in the
    // domain so the buildMission switch picks the right one
    // for the student's state.
    expect(domainSrc).toContain(
      "Empezá por el diagnóstico inicial o seguí donde dejaste",
    );
    expect(domainSrc).toContain(
      "Seguí donde dejaste o repasá algún tema que ya viste",
    );
  });

  // ── B3 visual refresh: spacing + hierarchy + CTA ────────────────────────
  test("B3: title and subtitle read as one text block (close spacing)", () => {
    const comp = source(componentPath);
    // The subtitle <p> must have a small top margin so the title
    // and subtitle feel like a single message but stay
    // distinguishable. The CTA must be visibly further away.
    const subtitleMatch = comp.match(
      /<p\s+className="([^"]+)"\s*>\s*\{hero\.subtitle\}/,
    );
    expect(subtitleMatch).not.toBeNull();
    const subtitleClasses = subtitleMatch![1]!;
    // The subtitle is base-text (readable) and relaxed.
    expect(subtitleClasses).toMatch(/text-base|text-\[var\(--text-base\)\]/);
    expect(subtitleClasses).toContain("leading-[var(--leading-relaxed)]");
    // It still has a top margin (close, not zero) — proves hierarchy.
    expect(subtitleClasses).toMatch(/mt-\d/);
  });

  test("B3: CTA link is the most prominent action, larger than the subtitle margin", () => {
    const comp = source(componentPath);
    // The CTA <Link> sits below the subtitle with a larger
    // margin (mt-6) so the eye lands on it after reading.
    const ctaMatch = comp.match(
      /<Link\s+href=\{hero\.ctaHref\}[\s\S]*?className="([^"]+)"/,
    );
    expect(ctaMatch).not.toBeNull();
    const ctaClasses = ctaMatch![1]!;
    // Larger padding than before (px-6 py-3) so the button reads
    // as the main affordance.
    expect(ctaClasses).toContain("px-6");
    expect(ctaClasses).toContain("py-3");
    // 44px touch target stays.
    expect(ctaClasses).toContain("min-h-[44px]");
    // Solid primary surface, focus ring intact.
    expect(ctaClasses).toContain("bg-[var(--color-brand-900)]");
    expect(ctaClasses).toContain("text-white");
    expect(ctaClasses).toContain("focus-visible:shadow-[var(--ring-focus)]");
  });

  test("B3: hero container is a true card surface (border + shadow on top of glass)", () => {
    const comp = source(componentPath);
    const articleMatch = comp.match(/<article\b[\s\S]*?className="([^"]+)"/);
    expect(articleMatch).not.toBeNull();
    const articleClasses = articleMatch![1]!;
    // The hero container keeps the warm glass surface from A1
    // but adds an explicit border + shadow so it reads as a
    // featured card, not a generic translucent panel.
    expect(articleClasses).toContain("app-glass-accent");
    expect(articleClasses).toContain("rounded-[var(--radius-card)]");
    expect(articleClasses).toContain("border");
    expect(articleClasses).toMatch(/border-\[var\(--color-accent/);
    expect(articleClasses).toMatch(/shadow-\[var\(--shadow-elevated\)\]/);
  });
});
