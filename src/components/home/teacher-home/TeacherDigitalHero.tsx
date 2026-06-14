"use client";

import Link from "next/link";
import type { Mission } from "@/domain/teacher-home";

interface TeacherDigitalHeroProps {
  readonly hero: Mission;
}

/**
 * Dumb hero panel — renders the view-model's hero data with an
 * accessible CTA button. No domain logic, no hooks beyond the
 * client directive.
 *
 * B3 (redesign closeout) tightened the visual contract:
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
