# Exploration: Editorial Math Visual Direction

## Current State

The app uses a functional, utilitarian design built on Tailwind CSS v4 with CSS custom properties (`globals.css`). The current aesthetic is clean but generic — standard blue-slate brand palette, basic cards with borders, and simple layout patterns. No distinctive visual identity separates it from a typical dashboard.

### Existing design system
- **Palette**: Blue-slate brand scale (`--color-brand-50` through `--color-brand-950`), warm amber accent
- **Typography**: Inter (Google Fonts), system scale from `--text-xs` to `--text-3xl`
- **Components**: `Card` (3 variants), `Button` (4 variants), `PhaseBadge`, `BackButton`, `DirectionalTransition`
- **Motion**: View Transitions API for page navigation (fade, slide, directional), `prefers-reduced-motion` respected
- **Layout**: `max-w-4xl` centered, 4px spacing grid, 0.75rem card radius
- **Math rendering**: KaTeX via `KaTeXBlock` (client-side useEffect), inline math via `RichText` + `rich-text-parser`
- **Accessibility**: Skip link exists, `focus-visible` ring, `min-h-[44px]` buttons, `aria-current` on nav, semantic landmarks

### Current component architecture
- `src/components/ui/` — Button, Card, PhaseBadge, BackButton, DirectionalTransition
- `src/components/math/` — KaTeXBlock, RichText, NumberLineInterval
- `src/components/home/` — HomeNextStepClient, SkillRoadmap, StudyPlanCard/Section
- `src/components/diagnostic/` — DiagnosticQuestion, ResultsDisplay
- `src/components/exercises/` — ExerciseAnswerInput (multiple-choice, true-false, text)
- `src/components/practice/` — ExerciseCard, AnswerForm, FocusSelector, phase components

### Key layout issue
Multiple-choice options with long inline math like `$\mathbb{N}$, $\mathbb{Z}$, $\mathbb{Q}$ y $\mathbb{R}$` render as full-width stacked rows (each option is `w-full` with flex). On mobile this is correct; on desktop these should flow inline or use a 2-column grid to avoid excessive vertical scrolling.

## Affected Areas

- `src/app/globals.css` — Design tokens, brand palette, typography scale, surface/spacing/shadow system
- `src/app/layout.tsx` — Metadata (title/description must not suggest UTN affiliation), root structure
- `src/app/page.tsx` — Home page layout, Zone structure, action links
- `src/app/diagnostic/page.tsx` — Diagnostic flow layout
- `src/components/Nav.tsx` — Brand name ("Pre UTN" → needs rebrand), nav styling
- `src/components/ui/Card.tsx` — Card surface treatment (borders, shadows, radius)
- `src/components/ui/Button.tsx` — Button styling, 44px minimum (already present)
- `src/components/math/KaTeXBlock.tsx` — Math rendering wrapper
- `src/components/math/RichText.tsx` — Inline math rendering
- `src/components/diagnostic/DiagnosticQuestion.tsx` — Question layout
- `src/components/diagnostic/ResultsDisplay.tsx` — Results layout
- `src/components/home/HomeNextStepClient.tsx` — Hero card styling
- `src/components/home/SkillRoadmap.tsx` — Roadmap visual
- `src/components/home/StudyPlanCard.tsx` — Plan card layout
- `src/components/exercises/ExerciseAnswerInput.tsx` — Multiple-choice option layout (the stacking issue)
- `src/components/practice/ExerciseCard.tsx` — Exercise card styling
- `src/components/math/MathThemePlate.tsx` — **NEW** — reusable SVG/CSS math decoration component
- `content/matematica/exercises/*.json` — Exercise options with math expressions (data, not code)

## Approaches

### 1. Token-driven redesign (Recommended)

Update CSS custom properties in `globals.css` to establish the new editorial palette, then layer component-level changes on top. New component: `MathThemePlate.tsx` as a reusable SVG/CSS decoration.

- **Palette shift**: Muted warm neutrals (stone/warm-gray) instead of blue-slate. Single refined accent (deep indigo or warm charcoal). White surfaces with very subtle warm tint.
- **Typography**: Keep Inter. Increase contrast between heading levels. Use `font-variation-settings` for weight axis if needed.
- **Surfaces**: Thinner borders (0.5px or softer color), softer shadows, slightly larger radius (1rem)
- **Math plates**: SVG backgrounds with topic-specific patterns (set notation, interval brackets, function graphs) — purely decorative, `aria-hidden`, no new deps
- **Option layout fix**: Change `ExerciseAnswerInput` multiple-choice from stacked `flex-col` to `grid grid-cols-1 sm:grid-cols-2` on desktop
- **Pros**: Minimal code churn, design tokens cascade, existing component API preserved
- **Cons**: Requires careful contrast verification for accessibility
- **Effort**: Medium

### 2. Component-by-component restyle

Each component gets individual styling updates without a unified token pass. More surgical but risks inconsistency.

- **Pros**: Can ship incrementally, lower risk per PR
- **Cons**: Higher total effort, easy to drift visually, harder to maintain
- **Effort**: High (across many files)

### 3. CSS-only minimal pass

Only change `globals.css` tokens and a few Tailwind utility classes. No new components.

- **Pros**: Smallest diff, fastest to ship
- **Cons**: Misses MathThemePlate requirement, can't fix option layout properly, limited visual impact
- **Effort**: Low

## Recommendation

**Approach 1 (Token-driven redesign)** — it addresses all requirements in a coherent way:

1. **globals.css token update** — new palette, refined shadows, typography scale
2. **MathThemePlate component** — new `src/components/math/MathThemePlate.tsx` with topic-specific SVG patterns (sets, irrationals, powers, roots, intervals, absolute, logs, complex) and variants (hero/background/card)
3. **Option layout fix** — `ExerciseAnswerInput` multiple-choice gets `grid-cols-2` on `sm:`
4. **Nav rebrand** — "Pre UTN" → "Ingenium" (or chosen name), disclaimer in footer/layout
5. **Metadata update** — title, description in layout.tsx
6. **Accessibility pass** — verify contrast ratios, ensure skip link works, `aria-current` preserved, reduced motion respected

### Implementation order
1. Design tokens (globals.css) — foundation
2. MathThemePlate.tsx — new component (isolated, testable)
3. Nav + layout.tsx rebrand + disclaimer
4. Home page visual update
5. Diagnostic page + question screen
6. Option layout fix (ExerciseAnswerInput)
7. Results display polish
8. Accessibility audit pass

## Risks

- **Contrast ratios**: New palette must meet WCAG AA (4.5:1 text, 3:1 large text). Warm grays can easily fail.
- **MathPlate SVG size**: Complex SVG patterns could bloat bundle. Mitigate: keep SVGs simple (< 2KB each), use `aria-hidden`.
- **Rebrand scope**: Changing "Pre UTN" across the app touches metadata, Nav, content strings. Need grep pass.
- **No new deps constraint**: MathThemePlate must use pure SVG + CSS. No animation libraries.
- **Option layout regression**: Grid layout for options must not break mobile or true-false/text input types.

## Ready for Proposal

**Yes** — the codebase is well-understood, the scope is clear, and there are no blocking unknowns. The orchestrator can proceed to `sdd-propose` for `editorial-math-visual-direction`.
