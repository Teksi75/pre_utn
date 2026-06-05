# Proposal: Apply Math Watermark Globally

## Intent

Apply the `MathThemePlate` watermark system across the entire app. The `editorial-math-visual-direction` change built the infrastructure (component, 8 SVGs, topic-map, CSS class) but only 3 of 13 screens use it, the centering produces whitespace gaps, and the practice flow has no per-phase decoration. This change defines the application contract: a wrapper component, corrected viewBox/opacity, and per-section topic resolution.

## Scope

### In Scope
- Create `MathWatermark` wrapper component with positioning/opacity/topic defaults
- Fix `MathThemePlate` viewBox (`320×112`) and `preserveAspectRatio="xMidYMid slice"`
- Rebalance opacity: hero `0.15`, background `0.18`, card `0.12`
- Home hero: replace `EngineeringHeroVisual` with `MathThemePlate` via prop/flag switch (fallback preserved)
- Apply watermarks to all 8 page/section screens (home, diagnostic, learn, practice)
- Per-phase watermarks on 5 practice sub-phases (theory, example, exercise, feedback, recovery)
- Update existing tests for new viewBox/opacity values
- Add tests for `MathWatermark` wrapper and `mathThemeForSkill()` integration

### Out of Scope
- Animation library additions (no new deps)
- Dark mode / theme toggle
- New math topics or SVG visuals
- Physics content or screens
- Exercise data changes (content/ JSON files stay as-is)

## Capabilities

### New Capabilities
- `math-watermark-system`: The `MathWatermark` wrapper component contract — positioning, opacity defaults, topic resolution via `mathThemeForSkill()`, CSS class composition
- `math-watermark-application`: Which sections get watermarks — the 8-screen application table and the 5-phase practice contract
- `centering-and-density`: The `viewBox` width change, `slice` preserveAspectRatio, and opacity rebalancing

### Modified Capabilities
- `editorial-design-system`: The underlying `MathThemePlate` component gets `viewBox="0 0 320 112"`, `preserveAspectRatio="xMidYMid slice"`, and updated default opacities
- `diagnostic-shell`: Existing diagnostic watermark moves into the new `MathWatermark` wrapper; hardcoded `topic="sets"` in `ResultsDisplay` replaced with dynamic resolution
- `guided-practice`: Each of the 5 practice sub-phases (theory, example, exercise, feedback, recovery) wraps its content with a per-phase watermark derived from the active skill

## Approach

### Step 1: Fix MathThemePlate centering
- Change `viewBox="0 0 160 112"` → `"0 0 320 112"` in `MathThemePlate.tsx`
- Change `preserveAspectRatio="xMidYMid meet"` → `"xMidYMid slice"`
- Update default opacities: hero `0.15`, background `0.18`, card `0.12`
- Update test assertions in `math-theme-plate.test.ts`

### Step 2: Create MathWatermark wrapper
- New file: `src/components/math-visuals/MathWatermark.tsx`
- Props: `topic?: MathTheme`, `skillId?: string`, `variant?: MathThemeVariant`, `opacity?: number`, `className?: string`
- If `skillId` provided, resolves topic via `mathThemeForSkill(skillId)`
- Handles positioning (`relative isolate overflow-hidden`) and z-index layering
- Children render in `relative z-10`

### Step 3: Home hero fallback mechanism
- Add `USE_MATH_THEME_PLATE` constant (or env-aware pattern) in `page.tsx`
- Default: `MathThemePlate` via `MathWatermark`
- Fallback: `EngineeringHeroVisual` (one-line revert)
- `EngineeringHeroVisual.tsx` stays in codebase untouched

### Step 4: Apply to all screens
Application table:

| Screen | File | Topic source | Variant | Opacity |
|--------|------|-------------|---------|---------|
| Home hero | `page.tsx` | `sets` (default) | hero | 0.15 |
| Home roadmap | `HomeNextStepClient.tsx` | `sets` (default) | background | 0.18 |
| Learn index | `learn/page.tsx` | `sets` (default) | background | 0.18 |
| Learn matemática | `learn/matematica/page.tsx` | `sets` (default) | background | 0.18 |
| Learn skill detail | `learn/matematica/[skillId]/page.tsx` | `mathThemeForSkill(skillId)` | background | 0.18 |
| Diagnostic question | `diagnostic/page.tsx` | `mathThemeForSkill(exercise.skillId)` | hero | 0.15 |
| Diagnostic results | `ResultsDisplay.tsx` | dynamic from estimates | hero | 0.15 |

### Step 5: Per-phase practice watermarks
Each practice phase component wraps its content:
- `PracticeTheoryPhase` — topic from `skillId`, variant `background`
- `PracticeExamplePhase` — topic from `skillId`, variant `background`
- `PracticeExercisePhase` — topic from `skillId`, variant `card`
- `PracticeFeedbackPhase` — topic from `skillId`, variant `card`
- `PracticeRecoveryPhase` — topic from `skillId`, variant `background`

The `skillId` flows from `usePracticeFlow().selectedSkillId` through props.

### Step 6: Export and test
- Export `MathWatermark` from `math-visuals/index.ts` and `math/MathThemePlate.tsx` re-export
- Add unit tests for wrapper positioning, topic resolution, opacity defaults
- Verify existing 686 tests pass with updated viewBox assertions

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/math-visuals/MathThemePlate.tsx` | Modified | viewBox, preserveAspectRatio, opacity defaults |
| `src/components/math-visuals/MathWatermark.tsx` | **New** | Wrapper component |
| `src/components/math-visuals/index.ts` | Modified | Export MathWatermark |
| `src/components/math/MathThemePlate.tsx` | Modified | Re-export MathWatermark |
| `src/components/math/__tests__/math-theme-plate.test.ts` | Modified | Update viewBox assertion, add wrapper tests |
| `src/app/page.tsx` | Modified | Swap EngineeringHeroVisual → MathWatermark with fallback |
| `src/app/diagnostic/page.tsx` | Modified | Use MathWatermark wrapper |
| `src/app/learn/page.tsx` | Modified | Add watermark |
| `src/app/learn/matematica/page.tsx` | Modified | Add watermark |
| `src/app/learn/matematica/[skillId]/page.tsx` | Modified | Add watermark with dynamic topic |
| `src/components/diagnostic/ResultsDisplay.tsx` | Modified | Replace hardcoded topic with dynamic resolution |
| `src/components/home/HomeNextStepClient.tsx` | Modified | Add watermark |
| `src/components/practice/PracticeTheoryPhase.tsx` | Modified | Add per-phase watermark |
| `src/components/practice/PracticeExamplePhase.tsx` | Modified | Add per-phase watermark |
| `src/components/practice/PracticeExercisePhase.tsx` | Modified | Add per-phase watermark |
| `src/components/practice/PracticeFeedbackPhase.tsx` | Modified | Add per-phase watermark |
| `src/components/practice/PracticeRecoveryPhase.tsx` | Modified | Add per-phase watermark |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Test breakage from viewBox change | High | `math-theme-plate.test.ts` line 47 asserts `viewBox="0 0 160 112"`. Update assertion to `"0 0 320 112"` before changing source. TDD: RED first with new value. |
| Slice clips decorative content at edges | Med | SVG patterns are centered in the viewBox. Edge clipping only trims margins, not core shapes. Verify visually on 3 container widths. |
| Per-phase watermark DOM churn on transitions | Low | Watermark is `aria-hidden` + `pointer-events-none`. View Transition handles the swap. No layout shift since watermark is absolutely positioned. |
| EngineeringHeroVisual fallback breaks on revert | Low | Keep the component file untouched. The fallback constant is a boolean flag, not a code deletion. Test the flag path in one assertion. |
| ResultsDisplay hardcoded topic mismatch | Med | Currently `topic="sets"` regardless of diagnostic content. Dynamic resolution via estimates is an improvement, but must fallback to "sets" if no estimates available. |

## Rollback Plan

1. **EngineeringHeroVisual fallback** — Flip the `USE_MATH_THEME_PLATE` constant to `false` in `page.tsx`. One line, instant revert to the original hero visual.
2. **Full PR revert** — All changes are in UI/component files, no data migrations. `git revert` on the merge commit restores previous state.
3. **Partial revert** — If per-phase practice watermarks cause issues, remove `MathWatermark` from the 5 practice phase components without affecting the rest.

## Dependencies

- `pnpm` (no new deps)
- Existing `MathThemePlate` + 8 SVG visuals (from `editorial-math-visual-direction`)
- Existing `topic-map.ts` with `mathThemeForSkill()` / `mathThemeForTopic()`
- Existing Tailwind v4 token system
- Existing `.app-watermark` CSS class

## Success Criteria

- [ ] `pnpm run test` passes (all existing 686 + new tests)
- [ ] `pnpm run build` passes
- [ ] `pnpm run typecheck` passes
- [ ] 8 screens have visible watermarks (home hero, home roadmap, learn index, learn matemática, learn skill, diagnostic question, diagnostic results, practice select)
- [ ] 5 practice phases each have a watermark (theory, example, exercise, feedback, recovery)
- [ ] Opacity ≥ 0.15 verified visually on hero sections
- [ ] No horizontal scroll on any screen (slice clips correctly)
- [ ] No watermark overlaps interactive elements (pointer-events-none + z-index)
- [ ] `EngineeringHeroVisual` still importable and usable via fallback flag
- [ ] Hardcoded `topic="sets"` in `ResultsDisplay` replaced with dynamic resolution
