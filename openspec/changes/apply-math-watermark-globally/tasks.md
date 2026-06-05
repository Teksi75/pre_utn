# Tasks: Apply Math Watermark Globally

**Change**: `apply-math-watermark-globally` · **Date**: 2026-06-05 · **Mode**: Strict TDD · **Pace**: A1 · **Delivery**: C4

## Summary

Apply `MathThemePlate` across the app. P1 fixes centering. P2 adds `MathWatermark` (TDD). P3-P4 apply wrapper to 8 screens and 5 practice phases. P5 verifies.

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Med

> 18 files (1 new + 17 modified); source ~290-330 + tests ~80-130 lines. Risk `Med`.

## Phase 1: Centering & Density (TDD)

- [x] **1.1** [RED] Assert `viewBox="0 0 320 112"`, `xMidYMid slice`, defaults `0.15`/`0.18`/`0.12` in `src/components/math/__tests__/math-theme-plate.test.ts`. Verify: fails.
- [x] **1.2** [GREEN] Apply centering fix in `src/components/math-visuals/MathThemePlate.tsx`. Verify: assertions pass.
- [x] **1.3** Run full suite. Verify: 686 pass.

## Phase 2: MathWatermark wrapper (TDD)

- [x] **2.1** [RED] Tests covering: defaults, opacity passthrough, skillId→mathThemeForSkill, fallback chain, variant→opacity, outer/inner/children classes, aria-hidden passthrough, no duplicate `app-watermark`. File: new `src/components/math-visuals/__tests__/math-watermark.test.ts`. Verify: tests fail.
- [x] **2.2** [GREEN] Implement `MathWatermark` (`topic?`, `skillId?`, `variant?`, `opacity?`, `className?`, `children?`; `skillId ? mathThemeForSkill(skillId) : (topic ?? "sets")`; `DEFAULT_OPACITY`; `"use client"`). File: new `src/components/math-visuals/MathWatermark.tsx`. Verify: pass.
- [x] **2.3** [REFACTOR] Tighten types in `src/components/math-visuals/MathWatermark.tsx`. Verify: typecheck.
- [x] **2.4** Export from `src/components/math-visuals/index.ts`; re-export from `src/components/math/MathThemePlate.tsx`. Verify: typecheck.

## Phase 3: Per-screen application (8 screens)

- [x] **3.1** Home hero fallback — `const USE_MATH_THEME_PLATE = true;` at top of `src/app/page.tsx`; ternary `<MathWatermark topic="sets" variant="hero" opacity={0.15}>{null}</MathWatermark> : <EngineeringHeroVisual />`. Verify: both builds; `EngineeringHeroVisual.tsx` unchanged.
- [x] **3.2** Home next-step — `<MathWatermark topic="sets" variant="background" opacity={0.18}>` in `src/components/home/HomeNextStepClient.tsx`.
- [x] **3.3** Learn index — wrap in `src/app/learn/page.tsx`.
- [x] **3.4** Learn matemática — wrap in `src/app/learn/matematica/page.tsx`.
- [x] **3.5** Learn skill detail — `<MathWatermark skillId={skillId} variant="background" opacity={0.18}>` in `src/app/learn/matematica/[skillId]/page.tsx`.
- [x] **3.6** Diagnostic question — replace manual `<MathThemePlate>` + negative insets with `<MathWatermark skillId={currentExercise.skillId} variant="hero" opacity={0.15}>` in `src/app/diagnostic/page.tsx`. Verify: no scroll.
- [x] **3.7** Diagnostic results — add `resolveResultsTopic(estimates)` (reduce by accuracy → `mathThemeForSkill(weakest.skillId)`, fallback `"sets"`); replace hardcoded `topic="sets"` in `src/components/diagnostic/ResultsDisplay.tsx`. Verify: grep empty.

## Phase 4: Per-phase practice watermarks

- [ ] **4.1** Thread `skillId?: string` to 5 phase components; pass `skillId={flow.selectedSkillId ?? undefined}` in `src/app/practice/page.tsx`. Verify: typecheck.
- [ ] **4.2** `PracticeTheoryPhase` — `<MathWatermark skillId={skillId} variant="background" opacity={0.18}>`.
- [ ] **4.3** `PracticeExamplePhase` — same background variant.
- [ ] **4.4** `PracticeExercisePhase` — `<MathWatermark skillId={skillId} variant="card" opacity={0.12}>`.
- [ ] **4.5** `PracticeFeedbackPhase` — same card variant.
- [ ] **4.6** `PracticeRecoveryPhase` — return to background variant.

## Phase 5: Verification & cleanup

- [ ] **5.1** `pnpm run test:run` — 686 + wrapper tests pass.
- [ ] **5.2** `pnpm run typecheck` — clean.
- [ ] **5.3** `pnpm run build` — pass; 7 routes.
- [ ] **5.4** Visual at 375/768/1280px on home, learn (3), diagnostic (2), 5 phases. Verify: edge-to-edge, no gaps, no interactive blockage.
- [ ] **5.5** Fallback round-trip — flip `USE_MATH_THEME_PLATE` to `false`, build, flip back. Verify: pass.

## Out of Scope

Animation deps; dark mode; new topics/SVGs; physics; exercise data; localStorage renames; testing-library; coverage; `usePracticeFlow` refactor.

## Open Questions

None. All TBDs resolved by design. Only operational: chain strategy (see Forecast).
