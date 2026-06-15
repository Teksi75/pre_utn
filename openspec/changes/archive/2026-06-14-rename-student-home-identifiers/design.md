# Design: Rename Student Home Identifiers

## Technical Approach

Perform a mechanical rename across the existing `student-home` domain, Home client wiring, dumb panels, and source-inspection tests. Preserve runtime behavior, Spanish copy, routes, persistence, and current a11y structure. The implementation maps directly to the delta spec for `teacher-digital-home`: expose `Student*` domain contracts, rename `TeacherDigitalHero` to `MissionCard`, and assert that targeted Home implementation/tests no longer contain legacy identifiers.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Mechanical rename only | Leaves known dead `studentMessage` and broken section `aria-labelledby` pattern in place | Chosen: it satisfies the proposal and avoids scope creep into behavior/a11y cleanup. |
| Rename domain first, then UI imports | Typecheck exposes every missed consumer | Chosen: safest path for TypeScript strict with minimal behavior risk. |
| Preserve `Mission` prop shape but rename component prop from `hero` to `mission` | Test updates are required, no UI output changes | Chosen: aligns `MissionCard` with domain naming and removes `TeacherDigitalHero`/hero wording. |

## Data Flow

No data-flow change. Only symbols at each boundary change names.

```text
loadProgress()
  → deriveHomeNextStep(...)
  → deriveStudentHomeViewModel(StudentHomeInput)
  → HomeNextStepClient state: StudentHomeViewModel
  → MissionCard / MathRoutePanel / StudentSituationPanel / DecisionBoardPanel
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/student-home/index.ts` | Modify | Rename `TeacherHomeInput/ViewModel/Action/RouteUnit/PlanStep`, `deriveTeacherHomeViewModel`, `buildTeacherMessage`, and `teacherMessage` to `Student*` / `studentMessage`; update JSDoc/comments mechanically. |
| `src/components/home/student-home/TeacherDigitalHero.tsx` | Rename | `git mv` to `MissionCard.tsx`; export `MissionCard`; rename props to `MissionCardProps` and prop `mission`. |
| `src/components/home/HomeNextStepClient.tsx` | Modify | Import/call `deriveStudentHomeViewModel`, use `StudentHomeViewModel`, render `<MissionCard mission={viewModel.mission} />`, and mechanically rename `tdh-hero-title` to safe student/mission id. |
| `src/components/home/student-home/MathRoutePanel.tsx` | Modify | Import `StudentRouteUnit`; mechanically rename `tmr-route-title` id/reference only. |
| `src/components/home/student-home/DecisionBoardPanel.tsx` | Modify | Import `StudentHomeAction`; mechanically rename `tdb-decisions-title` id/reference only. |
| `src/domain/__tests__/derive-teacher-home-view-model.test.ts` | Rename/modify | Rename test file and assertions/imports to `derive-student-home-view-model`; keep behavioral cases unchanged. |
| `src/components/home/student-home/__tests__/TeacherDigitalHero.test.ts` | Rename/modify | Rename to `MissionCard.test.ts`; update file path/export/prop assertions without changing visual/copy expectations. |
| `src/components/home/**/__tests__/*.test.ts` and `src/domain/__tests__/copy-strings-acceptance.test.ts` | Modify | Update pinned identifier/file-name assertions and add/adjust targeted legacy-token absence checks. |

## Interfaces / Contracts

```ts
export interface StudentHomeInput { /* same fields as current TeacherHomeInput */ }
export interface StudentHomeViewModel {
  readonly studentMessage: string;
  readonly mission: Mission;
  readonly primaryActions: readonly StudentHomeAction[];
  readonly routeUnits: readonly StudentRouteUnit[];
  readonly studentSituation: StudentSituation;
  readonly suggestedActions: readonly StudentSuggestedAction[];
}
export function deriveStudentHomeViewModel(input: StudentHomeInput): StudentHomeViewModel;
```

`studentMessage` remains unused intentionally; do not remove it. Existing href contracts and `Mission` fields remain unchanged.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit/domain | Existing derivation behavior under renamed API | Rename current source-inspection and behavior tests; run `pnpm run test`. |
| Component | `MissionCard`, panels, and Home wiring use new identifiers | Update existing source-inspection tests; add/keep no-legacy-token check scoped to targeted files. |
| Integration/build | Imports and file rename correctness | Run `pnpm run typecheck` and `pnpm run build`. |

## Migration / Rollout

No migration required. No routes, storage keys, data schema, copy, or public behavior change.

## Open Questions

None.
