"use client";

import Link from "next/link";
import type { Mission } from "@/domain/student-home";

interface TeacherDigitalHeroProps {
  readonly hero: Mission;
}

/**
 * Dumb hero panel — renders the view-model's hero data with an
 * accessible CTA button. No domain logic, no hooks beyond the
 * client directive.
 *
 * B3 (redesign closeout) tightened the visual contract:
 *  - The hero title is the institute's brand in wordmark form
 *    (`INGENIUM`, all-caps), the "loud" reading of the brand.
 *    The top-left brand mark in the header is the "quiet"
 *    reading (mixed-case `Ingenium`). The two together form
 *    the conventional logo+wordmark pattern.
 *  - The title and subtitle read as one text block (close
 *    spacing: mt-2 on the subtitle).
 *  - The subtitle is now text-base (readable) instead of text-sm
 *    so the student's first paragraph of context does not feel
 *    like a footnote.
 *  - The CTA is the most prominent affordance on the screen
 *    (mt-6 from the subtitle, larger padding px-6 py-3) so the
 *    eye lands on it after reading the subtitle.
 *  - The container keeps the warm glass surface (A1) but adds
 *    a soft accent border + elevated shadow so it reads as a
 *    featured card, not a generic translucent panel.
 *
 * B3 closeout revision — copy simplification:
 *  - The brand is shown twice: brand mark in the header
 *    (mixed-case) and wordmark in the hero (all-caps). The
 *    hero subtitle does NOT add a third reading of the brand.
 *    It is imperative-only.
 *  - The subtitle is now conditional: the domain
 *    `buildMission` returns one of two imperatives based on
 *    whether the student has any practice attempts. No-attempts
 *    student gets "Empezá por el diagnóstico inicial o seguí
 *    donde dejaste." Student with at least one attempt gets
 *    "Seguí donde dejaste o repasá algún tema que ya viste."
 *  - See AGENTS.md "Marca y voz".
 */
export function TeacherDigitalHero({ hero }: TeacherDigitalHeroProps) {
  return (
    <article
      aria-labelledby="tdh-hero-title"
      className="app-glass-accent rounded-[var(--radius-card)] border border-[var(--color-accent-soft)] shadow-[var(--shadow-elevated)] p-6 md:p-8"
    >
      <h2
        id="tdh-hero-title"
        className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold text-[var(--color-brand-900)] tracking-tight"
      >
        {hero.title}
      </h2>
      <p className="mt-2 text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-brand-700)] max-w-2xl">
        {hero.subtitle}
      </p>
      <Link
        href={hero.ctaHref}
        className="mt-6 inline-flex min-h-[44px] items-center rounded-[var(--radius-button)] bg-[var(--color-brand-900)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-800)] focus-visible:shadow-[var(--ring-focus)]"
      >
        {hero.ctaLabel} →
      </Link>
    </article>
  );
}
