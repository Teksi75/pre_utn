# Editorial Design System Specification

## Purpose

Warm-neutral editorial visual identity replacing blue-slate. Tokens, MathThemePlate, rebrand, accessibility.

## Requirements

### Req: Warm-Neutral Design Tokens

CSS custom properties MUST define warm-neutral palette (stone/warm-gray). Text-background pairs MUST meet WCAG AA (4.5:1 body, 3:1 large). Borders SHALL be 1px soft; shadows SHALL be subtle. Radius SHOULD be 1rem. Typography MUST use Inter with heading hierarchy.

**Scenario: palette applies globally**
- GIVEN `globals.css` defines warm-neutral tokens
- WHEN any component renders
- THEN no blue-slate remains; all text passes 4.5:1 contrast

### Req: MathThemePlate Component

`MathThemePlate` MUST render topic-specific SVG decorations. Variants: `hero`, `background`, `card`. Each pattern under 2 KB, `aria-hidden`, no deps. Topics: sets, irrationals, powers, roots, intervals, abs, logs, complex.

**Scenario: hero renders on home page**
- GIVEN MathThemePlate variant="hero" topic="sets"
- WHEN Home renders
- THEN decorative SVG displays with `aria-hidden="true"`

**Scenario: unsupported topic degrades gracefully**
- GIVEN unsupported topic
- THEN renders empty, no crash

### Req: Rebrand and Disclaimer

UI and metadata MUST NOT reference "UTN" nor institutional affiliation. Nav SHALL display "Ingenium". Discrete disclaimer SHALL appear in layout.

**Scenario: metadata is UTN-free**
- GIVEN layout metadata
- WHEN crawler reads title/description
- THEN no "UTN oficial", "UTN Mendoza", nor logos

### Req: Accessibility Baseline

SHALL preserve skip link, `aria-current`, `prefers-reduced-motion`. Interactive elements MUST keep `min-h-[44px]` and `focus-visible` ring. All surfaces MUST pass WCAG AA.

**Scenario: reduced motion honored**
- GIVEN OS reduced-motion enabled
- THEN no transitions/animations execute

## Pedagogical Impact

Professional identity reduces cognitive load, builds trust. Consistent tokens let instructors focus on content.
