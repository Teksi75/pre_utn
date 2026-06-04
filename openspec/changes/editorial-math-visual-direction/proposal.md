# Proposal: Editorial Math Visual Direction

## Intent

Replace the generic blue-slate UI with a sober editorial aesthetic (Apple + Notion + mathematical editorial plates) that gives Pre UTN a distinctive identity. Fix multiple-choice option wrapping on desktop. Remove any official UTN institutional references and rebrand as an independent Ingenium program with a discrete disclaimer.

## Scope

### In Scope
- Update design tokens in `globals.css` (warm-neutral palette, refined shadows, typography scale)
- Create `src/components/math/MathThemePlate.tsx` — reusable SVG decoration component (topic-specific patterns: sets, intervals, roots, etc.)
- Fix `ExerciseAnswerInput` multiple-choice layout: `grid-cols-1 sm:grid-cols-2` on desktop
- Rebrand Nav: "Pre UTN" → "Ingenium", add disclaimer in layout/footer
- Update `layout.tsx` metadata (title/description must not suggest UTN affiliation)
- Rework Home page (`page.tsx`) visual structure
- Rework Diagnóstico page (`diagnostic/page.tsx`) visual structure
- Rework diagnostic question screen (`DiagnosticQuestion.tsx`)
- Accessibility pass: contrast ratios (WCAG AA), skip link, `aria-current`, `prefers-reduced-motion`

### Out of Scope
- Dark mode / theme toggle (future work)
- Animation library additions (no new deps — pure SVG + CSS only)
- Practice phase visual rework (deferred to separate change)
- Física content or screens
- Exercise data changes (content/ JSON files stay as-is)

## Capabilities

### New Capabilities
- `editorial-design-system`: Visual design tokens, palette, typography, surface treatment, and MathThemePlate component — the foundation for the editorial look
- `editorial-option-layout`: Multiple-choice option grid layout fix for desktop rendering of inline math options

### Modified Capabilities
- `diagnostic-shell`: Visual layout changes to diagnostic question screen and results display (requirements unchanged, UI restyled)

## Approach

**Token-driven redesign** (exploration recommended approach):

1. **Design tokens** (`globals.css`) — Muted warm neutrals (stone/warm-gray) replacing blue-slate. Single refined accent. Softer shadows, 1rem radius, thinner borders. Keep Inter, increase heading contrast.
2. **MathThemePlate** — New component with topic-specific SVG patterns (sets, irrationals, powers, roots, intervals, absolute, logs, complex). Variants: `hero | background | card`. `aria-hidden`, `< 2KB` per pattern.
3. **Nav + layout rebrand** — "Ingenium" branding, discrete disclaimer, updated metadata.
4. **Home page** — Rework Zone structure, hero card, action links with new tokens.
5. **Diagnostic pages** — Restyle question layout and results display.
6. **Option layout fix** — `ExerciseAnswerInput` multiple-choice gets `grid grid-cols-1 sm:grid-cols-2`.
7. **Accessibility audit** — Verify all contrast ratios, ensure skip link, `aria-current` preserved.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modified | New palette, shadows, typography, surface tokens |
| `src/app/layout.tsx` | Modified | Metadata update, disclaimer placement |
| `src/app/page.tsx` | Modified | Home page visual rework |
| `src/app/diagnostic/page.tsx` | Modified | Diagnostic flow visual rework |
| `src/components/Nav.tsx` | Modified | Rebrand to Ingenium, styling |
| `src/components/ui/Card.tsx` | Modified | Surface treatment (softer borders, shadows) |
| `src/components/ui/Button.tsx` | Modified | Styling refinement |
| `src/components/math/MathThemePlate.tsx` | **New** | Reusable SVG decoration component |
| `src/components/diagnostic/DiagnosticQuestion.tsx` | Modified | Question layout rework |
| `src/components/diagnostic/ResultsDisplay.tsx` | Modified | Results layout rework |
| `src/components/home/HomeNextStepClient.tsx` | Modified | Hero card styling |
| `src/components/home/SkillRoadmap.tsx` | Modified | Roadmap visual update |
| `src/components/home/StudyPlanCard.tsx` | Modified | Plan card styling |
| `src/components/exercises/ExerciseAnswerInput.tsx` | Modified | Option grid layout fix |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Warm gray contrast fails WCAG AA | Med | Audit every text/background pair with contrast checker before merge |
| MathThemePlate SVG bloats bundle | Low | Keep each pattern `< 2KB`, use `aria-hidden`, no animation libs |
| Rebrand misses a "Pre UTN" reference | Med | Grep pass across codebase + content/ after changes |
| Option grid breaks mobile or other input types | Low | Test `true-false` and `text` types remain `flex-col`, grid only on `sm:` for `multiple-choice` |
| Token cascade breaks existing components | Low | Visual regression pass on all screens after globals.css change |

## Rollback Plan

1. **Git revert** — All changes are in UI/component files, no data migrations. Standard `git revert` on the merge commit restores previous state.
2. **Token rollback** — If palette causes issues, revert only `globals.css` tokens; component structure changes are independent.
3. **Feature flag** — Not needed; this is a visual-only change with no behavioral impact.

## Dependencies

- No new npm dependencies (pure SVG + CSS for MathThemePlate)
- Existing KaTeX rendering pipeline stays unchanged
- Tailwind CSS v4 token system (already in place)

## Success Criteria

- [ ] Warm-neutral palette applied across all screens, no blue-slate remnants
- [ ] MathThemePlate renders on Home hero and Diagnostic screens with topic-specific SVG patterns
- [ ] Multiple-choice options display in 2-column grid on `sm:` breakpoint
- [ ] No "UTN oficial" or institutional logo references remain in UI or metadata
- [ ] "Ingenium" branding with discrete disclaimer visible in Nav/footer
- [ ] All text/background pairs pass WCAG AA (4.5:1 for body, 3:1 for large text)
- [ ] `pnpm run build` succeeds with no errors
- [ ] `prefers-reduced-motion` respected (no forced animations)
