# Tasks: Editorial Math Visual Direction

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650-900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 tokens/components → PR 2 option layout/tests → PR 3 page shells/accessibility |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Editorial tokens and reusable UI primitives | PR 1 | Base main; include component tests where logic exists. |
| 2 | Math option grid behavior | PR 2 | Base after PR 1; include TDD for multiple-choice/true-false/text. |
| 3 | Rebrand, page shells, accessibility polish | PR 3 | Base after PR 2; include GGA/manual audit. |

## Phase 1: Foundation / Tokens

- [x] 1.1 Update `src/app/globals.css` warm-neutral CSS tokens, focus rings, reduced-motion rules, radius, borders, and shadows.
- [x] 1.2 Tune `src/components/ui/Card.tsx` and `src/components/ui/Button.tsx` variants against new tokens without changing public props.
- [x] 1.3 Create `src/components/math/MathThemePlate.tsx` with typed topics/variants, static SVG map, `aria-hidden`, and graceful unsupported-topic fallback.

## Phase 2: TDD Option Layout

- [x] 2.1 RED: Add/extend tests for `src/components/exercises/ExerciseAnswerInput.tsx`: desktop multiple-choice grid, mobile single-column classes, true-false/text unchanged.
- [x] 2.2 GREEN: Apply `grid grid-cols-1 sm:grid-cols-2` only to multiple-choice and add `min-w-0`/math wrapping safeguards.
- [x] 2.3 REFACTOR: Keep option label structure accessible and radio/text contracts unchanged.

## Phase 3: Rebrand and Page Shells

- [x] 3.1 Update `src/app/layout.tsx` metadata, footer disclaimer, skip link preservation, and UTN-free public copy.
- [x] 3.2 Update `src/components/Nav.tsx` to brand `Ingenium`, restyle navigation, and preserve `aria-current`.
- [x] 3.3 Rework `src/app/page.tsx` plus `src/components/home/HomeNextStepClient.tsx`, `SkillRoadmap.tsx`, and `StudyPlanCard.tsx` using MathThemePlate.
- [x] 3.4 Rework `src/app/diagnostic/page.tsx`, `DiagnosticQuestion.tsx`, and `ResultsDisplay.tsx` visual shells without changing diagnostic behavior.

## Phase 4: Verification / Accessibility

- [x] 4.1 Grep UI/metadata for public `Pre UTN`, `UTN oficial`, `UTN Mendoza`, and institutional-logo references; keep only independent-program wording.
- [x] 4.2 Run contrast/focus/reduced-motion audit for spec scenarios: WCAG AA, skip link, `aria-current`, `min-h-[44px]` where interactive.
- [x] 4.3 Run `pnpm run test`, `pnpm run typecheck`, `pnpm run build`, then GGA before close.
