# Tasks: Rename Student Home Identifiers

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120–180 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Mechanical rename: domain + component + tests | PR 1 | Single work unit; all renames in one PR |

## Phase 1: Domain Rename

- [x] 1.1 Rename `TeacherHomeInput` → `StudentHomeInput`, `TeacherHomeViewModel` → `StudentHomeViewModel`, `TeacherHomeAction` → `StudentHomeAction`, `TeacherRouteUnit` → `StudentRouteUnit`, `TeacherPlanStep` → `StudentSuggestedAction`, and the legacy temporal action field → `suggestedActions` in `src/domain/student-home/index.ts`
- [x] 1.2 Rename `deriveTeacherHomeViewModel` → `deriveStudentHomeViewModel` and `buildTeacherMessage` → `buildStudentMessage` in `src/domain/student-home/index.ts`
- [x] 1.3 Rename `teacherMessage` field → `studentMessage` in `StudentHomeViewModel` in `src/domain/student-home/index.ts`
- [x] 1.4 Mechanically update all JSDoc comments in `src/domain/student-home/index.ts` to reflect new identifier names

## Phase 2: Component File Rename

- [x] 2.1 `git mv src/components/home/student-home/TeacherDigitalHero.tsx src/components/home/student-home/MissionCard.tsx`
- [x] 2.2 In `MissionCard.tsx`: rename `TeacherDigitalHero` → `MissionCard`, `TeacherDigitalHeroProps` → `MissionCardProps`, and prop `hero` → `mission`
- [x] 2.3 Confirm `MissionCard.tsx` does not add a replacement title id or `aria-labelledby`, preserving B3's no-visible-heading decision

## Phase 3: Home Client Wiring

- [x] 3.1 Update import in `src/components/home/HomeNextStepClient.tsx` from `deriveTeacherHomeViewModel` → `deriveStudentHomeViewModel`
- [x] 3.2 Update type references in `HomeNextStepClient.tsx`: `TeacherHomeViewModel` → `StudentHomeViewModel`, `TeacherHomeAction` → `StudentHomeAction`
- [x] 3.3 Update render in `HomeNextStepClient.tsx`: `<TeacherDigitalHero hero={…} />` → `<MissionCard mission={viewModel.mission} />`
- [x] 3.4 Remove the dashboard wrapper's stale `aria-labelledby` instead of renaming it to another missing id

## Phase 4: Panel Updates

- [x] 4.1 In `src/components/home/student-home/MathRoutePanel.tsx`: update `TeacherRouteUnit` → `StudentRouteUnit` import; rename `tmr-route-title` aria id → `mission-route-title`
- [x] 4.2 In `src/components/home/student-home/DecisionBoardPanel.tsx`: update `TeacherHomeAction` → `StudentHomeAction` import; rename `tdb-decisions-title` aria id → `mission-decisions-title`

## Phase 5: Test Renames and Identifier Updates

- [x] 5.1 `git mv src/domain/__tests__/derive-teacher-home-view-model.test.ts src/domain/__tests__/derive-student-home-view-model.test.ts`
- [x] 5.2 In `derive-student-home-view-model.test.ts`: update all identifier references (`TeacherHomeInput` → `StudentHomeInput`, `TeacherHomeViewModel` → `StudentHomeViewModel`, `deriveTeacherHomeViewModel` → `deriveStudentHomeViewModel`, etc.)
- [x] 5.3 `git mv src/components/home/student-home/__tests__/TeacherDigitalHero.test.ts src/components/home/student-home/__tests__/MissionCard.test.ts`
- [x] 5.4 In `MissionCard.test.ts`: update file path references, export name, and prop assertions (`hero` → `mission`)
- [x] 5.5 In `src/components/home/__tests__/HomeNextStepClient-integration.test.ts` and `HomeNextStepClient-student.test.ts`: update any `Teacher*` identifier references
- [x] 5.6 In `src/components/home/student-home/__tests__/MathRoutePanel.test.ts` and `DecisionBoardPanel.test.ts`: update `TeacherRouteUnit` → `StudentRouteUnit`, `TeacherHomeAction` → `StudentHomeAction` references

## Phase 6: Verification

- [x] 6.1 Run `pnpm run typecheck` — verify no import/type errors
- [x] 6.2 Run `pnpm run test` — verify all tests pass with renamed identifiers
- [x] 6.3 Run `pnpm run build` — verify production build succeeds
- [x] 6.4 Grep `src/domain/student-home/` and `src/components/home/student-home/` for legacy identifiers (`TeacherHomeInput`, `TeacherHomeViewModel`, `TeacherDigitalHero`, `tdh-hero-title`, `tmr-route-title`, `tdb-decisions-title`) — expect zero matches in targeted files
