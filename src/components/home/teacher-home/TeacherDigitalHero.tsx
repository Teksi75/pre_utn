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
 */
export function TeacherDigitalHero({ hero }: TeacherDigitalHeroProps) {
  return (
    <article
      aria-labelledby="tdh-hero-title"
      className="app-glass-accent rounded-[var(--radius-card)] p-6 md:p-8"
    >
      <h2
        id="tdh-hero-title"
        className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold text-[var(--color-brand-900)] tracking-tight"
      >
        {hero.title}
      </h2>
      <p className="mt-3 text-sm leading-[var(--leading-relaxed)] text-[var(--color-brand-700)] max-w-2xl">
        {hero.subtitle}
      </p>
      <Link
        href={hero.ctaHref}
        className="mt-5 inline-flex min-h-[44px] items-center rounded-[var(--radius-button)] bg-[var(--color-brand-900)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-800)] focus-visible:shadow-[var(--ring-focus)]"
      >
        {hero.ctaLabel} →
      </Link>
    </article>
  );
}
