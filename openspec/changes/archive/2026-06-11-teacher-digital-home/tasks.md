# Tasks: Teacher Digital Home

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 600–800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (domain + tests) → PR 2 (components + integration) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain view-model + 11 TDD test cases | PR 1 | base: main; fully verifiable standalone |
| 2 | 4 dumb panels + HomeNextStepClient wiring + page.tsx | PR 2 | base: main; depends on PR 1 merged |

## Phase 1: Domain Foundation (TDD)

- [x] 1.1 **RED** — Create `src/domain/teacher-home/__tests__/derive-teacher-home-view-model.test.ts` with all 11 spec test cases (missing data, no invented evidence, label priority, weak thresholds, mastered definition, decision priority, safe links, route unit statuses, unit number extraction, diagnostic CTA, happy path). All tests must fail.
- [x] 1.2 **GREEN** — Create `src/domain/teacher-home/index.ts` with types (`HeroPanel`, `SituationPanel`, `RoutePanel`, `DecisionCard`, `DecisionBoardPanel`, `TeacherHomeViewModel`) and `deriveTeacherHomeViewModel()`. Import `deriveHomeNextStep`, `computeMasteryLevel` from existing domain. All 11 tests must pass.
- [x] 1.3 **REFACTOR** — Review domain file for duplication with `next-step/index.ts`; extract shared helpers if needed. Run `pnpm run test` — all green.

## Phase 2: Dumb Visual Components

- [x] 2.1 Create `src/components/home/teacher-home/TeacherDigitalHero.tsx` — renders `HeroPanel` props (title, subtitle, CTA button with verified href). `<article aria-labelledby>`, `min-h-[44px]` CTA.
- [x] 2.2 Create `src/components/home/teacher-home/StudentSituationPanel.tsx` — renders `SituationPanel` props (diagnostic date, weak/practiced/total counts). Explicit status text, no color-only indicators.
- [x] 2.3 Create `src/components/home/teacher-home/MathRoutePanel.tsx` — wraps existing `<SkillRoadmap>` inside `<article aria-labelledby>`, receives `RoutePanel` props.
- [x] 2.4 Create `src/components/home/teacher-home/DecisionBoardPanel.tsx` — renders `DecisionCard[]` as `grid grid-cols-1 md:grid-cols-3`. Each card: title, description, verified href link.

## Phase 3: Integration

- [x] 3.1 Modify `src/components/home/HomeNextStepClient.tsx` — import `deriveTeacherHomeViewModel`, call it alongside `deriveHomeNextStep`. Replace inline Zone 1/Zone 2 JSX with `<TeacherDigitalHero>`, `<StudentSituationPanel>`, `<StudyPlanSection>`, `<MathRoutePanel>`, `<DecisionBoardPanel>`. Keep loading skeleton.
- [x] 3.2 Modify `src/app/page.tsx` — replace editorial hero section (lines 23–56) with dashboard composition. Remove `USE_MATH_THEME_PLATE` flag and `EngineeringHeroVisual` import. Keep Zone 3 (acciones rápidas) and Contexto del curso sections.
- [x] 3.3 Verify `SkillRoadmap` is NOT rendered directly in `HomeNextStepClient` (only via `MathRoutePanel`). Confirm `StudyPlanSection` stays between situation and route panels.

## Phase 4: Verification

- [x] 4.1 Run `pnpm run test` — all domain + component tests pass. Confirm ≥90% coverage on `src/domain/teacher-home/`.
- [x] 4.2 Run `pnpm run typecheck && pnpm run build` — both pass with zero errors.
- [x] 4.3 Manual: verify `/practice` and `/diagnostic` routes still load correctly (no broken imports or routing).
- [x] 4.4 Accessibility audit: confirm all panels have `aria-labelledby`, CTA buttons have `min-h-[44px]`, mobile layout stacks vertically without overflow, status text is explicit (not color-only).
