"use client";

import Link from "next/link";
import type { Mission } from "@/domain/student-home";

interface MissionCardProps {
  readonly mission: Mission;
}

/**
 * Dumb hero panel — renders the view-model's hero data with an
 * accessible CTA button. No domain logic, no hooks beyond the
 * client directive.
 *
 * B3 closeout (latest revision): the brand is shown ONCE in
 * the layout, in the top-left brand mark of the header, in
 * the all-caps wordmark form (`INGENIUM`). The hero panel
 * does NOT carry a brand wordmark of its own: it goes
 * straight from the welcome subtitle to the primary CTA,
 * so the brand is not repeated, and the first paragraph
 * of context the student reads is the imperative that
 * points them at the next step.
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
 *  - The brand appears once in the layout, in the header. The
 *    hero is a card of content (imperative subtitle + CTA),
 *    not a second reading of the brand.
 *  - The subtitle is conditional: the domain `buildMission`
 *    returns one of two imperatives based on whether the
 *    student has any practice attempts. No-attempts student
 *    gets "Empezá por el diagnóstico inicial o seguí donde
 *    dejaste." Student with at least one attempt gets "Seguí
 *    donde dejaste o repasá algún tema que ya viste."
 *  - See AGENTS.md "Marca y voz".
 */
export function MissionCard({ mission }: MissionCardProps) {
  return (
    <article
      className="app-glass-accent rounded-[var(--radius-card)] border border-[var(--color-accent-soft)] shadow-[var(--shadow-elevated)] p-6 md:p-8"
    >
      <p className="text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-brand-700)] max-w-2xl">
        {mission.subtitle}
      </p>
      <Link
        href={mission.ctaHref}
        className="mt-6 inline-flex min-h-[44px] items-center rounded-[var(--radius-button)] bg-[var(--color-brand-900)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-800)] focus-visible:shadow-[var(--ring-focus)]"
      >
        {mission.ctaLabel} →
      </Link>
    </article>
  );
}
