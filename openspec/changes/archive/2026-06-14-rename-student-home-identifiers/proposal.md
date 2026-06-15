# Proposal: Rename Student Home Identifiers

## Intent

Complete the deferred B3 follow-up by renaming legacy `Teacher*` / `TeacherDigital*` Home identifiers to student-facing names. This is a mechanical refactor only: no behavior, copy, route, persisted-data, or public UX change. References ADR-008 (SDD + TDD + ENGRAM + GGA) and preserves ADR-007 pedagogical framing: the app supports the student and future teacher interpretation without pretending to be a digital teacher.

## Scope

### In Scope
- Rename `TeacherHome*`, `TeacherRouteUnit`, `TeacherPlanStep`, `deriveTeacherHomeViewModel`, `buildTeacherMessage`, and `teacherMessage` to `Student*` equivalents.
- Rename `TeacherDigitalHero` / file / props to `MissionCard`, aligned with the `Mission` view-model and non-redundant under `student-home/`.
- Rename valid legacy aria id strings mechanically: `tmr-route-title`, `tdb-decisions-title`; remove the stale hero wrapper `aria-labelledby` instead of replacing it with another missing id.
- Update tests and characterization strings to assert the new identifiers.

### Out of Scope
- Removing/dead-code cleanup of currently unused `teacherMessage` / renamed equivalent.
- Adding a visible mission-card brand/title heading or a new product promise.
- Copy, product behavior, routing, persistence, API, Supabase, or UX changes.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `teacher-digital-home`: rename the documented implementation identifiers and Home component names without changing requirements or behavior.

## Approach

Use exploration Approach 1: a single mechanical rename pass with `git mv` for files, TypeScript/typecheck as the safety net, and tests updated only where they pin old names.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/student-home/index.ts` | Modified | Type/function/field/helper rename and JSDoc cleanup. |
| `src/components/home/student-home/TeacherDigitalHero.tsx` | Renamed | Move to `MissionCard.tsx`; rename component and props. |
| `src/components/home/HomeNextStepClient.tsx` | Modified | Import/call/type/id rename only. |
| `src/components/home/student-home/{MathRoutePanel,DecisionBoardPanel}.tsx` | Modified | Type import and aria id rename only. |
| `src/**/__tests__/*` | Modified/Renamed | Update identifier assertions and renamed test files. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missed import/path after file rename | Low | `pnpm run typecheck` and build fail loudly. |
| Aria id mismatch after string rename | Low | Keep rename paired in same files; verify with tests/review grep. |
| Scope creep into cleanup/a11y/copy | Med | Keep deferred issues explicitly out of scope. |

## Rollback Plan

Revert the rename commit/files and restore the previous proposal/spec delta if verification fails; no data migration or external rollback is needed.

## Dependencies

- Existing exploration artifact for `rename-student-home-identifiers`.
- Existing `teacher-digital-home` spec as the modified capability source.

## Success Criteria

- [ ] No `Teacher*` / `TeacherDigital*` identifiers remain in the targeted Home implementation/tests except historical specs or explicit out-of-scope notes.
- [ ] No product copy, routes, localStorage keys, or behavior change.
- [ ] `pnpm run test`, `pnpm run typecheck`, and `pnpm run build` pass.
