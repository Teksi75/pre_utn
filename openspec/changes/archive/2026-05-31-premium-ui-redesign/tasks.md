# Tasks: Premium UI Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 270–330 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: tokens + layout (~105 lines) → PR 2: components (~70 lines) → PR 3: pages + polish (~115 lines) |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Design tokens + root layout shell (fonts, nav, skip link, landmarks) | PR 1 | Base: main. Independent foundation; verifiable via build + manual browser check. |
| 2 | Restyle all 6 components with new token classes | PR 2 | Base: main (or PR 1 if stacked). Each component preserves interface; verifiable via typecheck. |
| 3 | Restyle 3 pages + a11y/responsive/motion polish | PR 3 | Base: main (or PR 2 if stacked). Integration of tokenized components into pages; verifiable via build + GGA. |

## Phase 1: Tokens & Theme

- [x] 1.1 Define brand color palette in `src/app/globals.css`: `--color-brand-950` through `--color-brand-50` (blue-slate), `--color-accent-500`/`--color-accent-600` (amber), `--color-surface`, `--color-muted`
- [x] 1.2 Define typography tokens: `--font-sans` → Inter, scale `--text-xs` through `--text-3xl` with line-height, `--font-weight-*` mappings
- [x] 1.3 Define spacing/radius/shadows: `--spacing-*` (4px grid), `--radius-card`, `--radius-button`, `--shadow-card`, `--shadow-elevated`
- [x] 1.4 Define motion and focus tokens: `--duration-fast` (200ms), `--duration-normal` (300ms), `--ease-out`, `--ring-focus`, focus-visible utility
- [x] 1.5 Apply body base styles: off-white background (`--color-surface`), Inter font, antialiased, remove dark-mode media query

## Phase 2: Root Layout, Nav & Fonts

- [x] 2.1 Configure Inter font via `next/font/google` in `src/app/layout.tsx`, expose CSS variable `--font-inter`, merge into `--font-sans`
- [x] 2.2 Build responsive header nav bar with Home / Practice / Diagnostic links, active-state indicator using `usePathname`
- [x] 2.3 Add skip-to-content link as first focusable element, `href="#main-content"`
- [x] 2.4 Add ARIA landmarks: `<header role="banner">`, `<nav aria-label="Principal">`, `<main id="main-content" role="main">`

## Phase 3: Components

- [x] 3.1 Restyle `FocusSelector.tsx`: card-style skill selectors, larger tap targets (min-h-[44px]), focus-visible rings, stronger selected state (accent border + bg tint)
- [x] 3.2 Add keyboard navigation to `FocusSelector.tsx`: Arrow keys between skills, Enter/Space to select, Escape to clear unit
- [x] 3.3 Restyle `ExerciseCard.tsx`: elevated card (`--shadow-card`, `--radius-card`), type/difficulty badges, readable prompt typography (`--text-lg`)
- [x] 3.4 Restyle `AnswerForm.tsx`: tokenized input/button classes, min-h-[44px] on both, `autoFocus` on input when phase transitions to exercise
- [x] 3.5 Restyle `FeedbackDisplay.tsx`: tokenized success panel (green tokens), error panel (red tokens), add `role="status"` + `aria-live="polite"`
- [x] 3.6 Restyle `DiagnosticQuestion.tsx`: mirror `AnswerForm` token classes, progress badge (`Pregunta X de Y`), focus-visible rings
- [x] 3.7 Restyle `ResultsDisplay.tsx`: responsive result row layout (stack on mobile), accuracy color bands with token colors, recommendation cards with `--color-accent-*` tokens, accessible action buttons (min-h-[44px])

## Phase 4: Pages

- [x] 4.1 Restyle `src/app/page.tsx`: premium hero heading, two action cards with shadows + hover elevation, responsive grid (1-col mobile, 2-col ≥768px)
- [x] 4.2 Restyle `src/app/practice/page.tsx`: phase container with consistent padding, progress counter styled, `aria-live="polite"` region wrapping exercise + feedback phases, styled back/next buttons
- [x] 4.3 Restyle `src/app/diagnostic/page.tsx`: loading state with tokenized spinner/text, error state with `--color-accent-*` warning panel, question shell consistent with practice, results state already styled via `ResultsDisplay`

## Phase 5: Accessibility, Responsive & Motion

- [x] 5.1 Add `aria-live="assertive"` region for phase transitions in practice and diagnostic pages
- [x] 5.2 Verify all interactive elements have min-h-[44px] + min-w-[44px] tap targets (buttons, links, selects, inputs)
- [x] 5.3 Add visible focus-visible ring to all interactive elements using `--ring-focus` token
- [x] 5.4 Add `transition-*` motion to hover states and phase transitions using `--duration-fast` / `--duration-normal` tokens
- [x] 5.5 Responsive audit: verify no horizontal scroll at 375px, single-column layout at 375px, proper 2-column at 768px, max-width container at 1280px

## Phase 6: Verification

- [x] 6.1 Run `pnpm run test` — confirm zero domain regressions
- [x] 6.2 Run `pnpm run typecheck` — confirm no TS errors from font or token usage
- [x] 6.3 Run `pnpm run build` — confirm production build succeeds
- [x] 6.4 GGA manual review: tab through all routes checking focus order, skip link, live regions, contrast, 375/768/1280 layouts
