# Proposal: Premium UI Redesign

## Intent

The current UI uses generic Bootstrap-era styling — no design tokens, no typography hierarchy, no shadows, no navigation shell, no accessibility landmarks. This change delivers a premium, modern, sober, academic visual identity through a token-first Tailwind v4 theme system, improving both aesthetics and accessibility without touching domain logic.

## Scope

### In Scope
- Design token system in `globals.css` (colors, typography, spacing, shadows, motion)
- Root layout shell with navigation bar and font loading
- All 3 route pages restyled with new tokens
- All 6 UI components restyled with new tokens
- Accessibility fixes: ARIA landmarks, focus management, `aria-live` regions, skip-to-content, keyboard navigation, tap targets ≥44px
- Responsive improvements: mobile-first padding/spacing, responsive typography

### Out of Scope
- Dark mode (deferred to follow-up change)
- New features or routes beyond existing 3 screens
- Domain logic (`src/domain/**`) — zero changes
- New npm dependencies (no shadcn/ui, no Radix)
- Persistence or backend changes
- Component testing (separate concern)

## Capabilities

> No new capabilities introduced — this is a visual/style layer change.
> Existing capability specs (`guided-practice`, `diagnostic-shell`) define behavior, not appearance.
> No delta specs needed; UI presentation is not spec-governed in this project.

### New Capabilities
None

### Modified Capabilities
None

## Approach

**Token-First Tailwind v4 Theme System** (Approach 1 from exploration).

1. **Token Layer**: Define CSS custom properties in `globals.css` via Tailwind v4 `@theme` — colors (muted blue-slate + amber accent), typography (Inter, hierarchy scale), spacing (4px grid), shadows (sm/md/lg), motion (duration-200).
2. **Layout Layer**: Build root layout shell in `layout.tsx` — responsive nav bar, font loading (Inter via `next/font`), skip-to-content link, ARIA landmarks.
3. **Component Layer**: Restyle each component file-by-file using new token classes. No structural logic changes.
4. **Accessibility Layer**: Add `aria-live` regions for phase transitions, focus management between phases, keyboard nav for skill buttons, `aria-label` on iconless buttons.
5. **Responsive Layer**: Mobile-first padding, responsive typography scaling, touch-friendly targets.

Each layer is independently verifiable and deployable.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modified | Design tokens, typography, spacing system |
| `src/app/layout.tsx` | Modified | Root shell, nav, fonts, ARIA landmarks |
| `src/app/page.tsx` | Modified | Home screen cards + heading restyle |
| `src/app/practice/page.tsx` | Modified | Practice flow layout + phase transitions |
| `src/app/diagnostic/page.tsx` | Modified | Diagnostic flow layout + phase transitions |
| `src/components/practice/FocusSelector.tsx` | Modified | Selection UI restyle + keyboard nav |
| `src/components/practice/ExerciseCard.tsx` | Modified | Card restyle with shadows + tokens |
| `src/components/practice/AnswerForm.tsx` | Modified | Input + button restyle + tap targets |
| `src/components/practice/FeedbackDisplay.tsx` | Modified | Feedback banner restyle + aria-live |
| `src/components/diagnostic/DiagnosticQuestion.tsx` | Modified | Question UI restyle |
| `src/components/diagnostic/ResultsDisplay.tsx` | Modified | Results table + suggestions restyle |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope creep into features | High | Strict rule: only UI/styles/components/routes. No new logic. |
| Font loading performance | Medium | Use `next/font` with `display: swap`, subset loading |
| "Premium" is subjective without mockups | Medium | Define token palette early, validate before full rollout |
| Mobile-first regression | Medium | Test each component at 375px, 768px, 1280px breakpoints |
| Accessibility regressions | Low | Add ARIA + focus checks to each component task |

## Rollback Plan

All changes are CSS/TSX presentation layer only. Rollback is `git revert` of the change branch. No database migrations, no API changes, no domain logic touched. Each layer (token → layout → component → a11y → responsive) can be reverted independently if needed.

## Dependencies

- Inter font available via `next/font/google` (already in Next.js, no new dependency)
- Tailwind v4 CSS-first config already in place (`globals.css`)

## Success Criteria

- [ ] All design tokens defined in `globals.css` and used consistently across all components
- [ ] Navigation bar present on all 3 routes with active state indication
- [ ] Typography hierarchy visible: heading, subheading, body, caption
- [ ] Shadows and elevation create visual depth on cards
- [ ] All interactive elements have ≥44px tap targets
- [ ] Skip-to-content link and ARIA landmarks present
- [ ] `aria-live` regions announce phase changes in practice and diagnostic flows
- [ ] Layout works at 375px, 768px, and 1280px without horizontal scroll
- [ ] Zero changes to `src/domain/**`
- [ ] `pnpm run build` passes with no errors
