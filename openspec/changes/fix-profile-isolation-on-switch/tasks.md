# Tasks: fix-profile-isolation-on-switch (#56)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~240 (tests + impl + dead-code delete) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | size:exception (n/a — under budget) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All 10 tasks below in one PR | PR 1 | Single-domain surgical fix; under 400-line budget |

## Phase 1: Practice Progress Boundary Fix (read + write + repair)

- [ ] **T-1 RED** — Add RED test in `src/lib/__tests__/practice-progress.test.ts`: given `profiles.v1.activeStudentId="B"` and `practice.v1.activeStudentId="A"`, `loadProgress()` MUST return B's slice (not A's). Pins REQ-ISOL-1.
- [ ] **T-1 GREEN** — In `src/lib/practice-progress.ts:242-245`, change `extractActiveProgress(map)` to call `getActiveProfileId()` instead of reading `map.activeStudentId`.
- [ ] **T-2 RED** — In same test file, pin REQ-ISOL-2: when `practice.v1.activeStudentId !== getActiveProfileId()` AND active slot has a hybrid blob, `loadProgress()` MUST return `EMPTY_PROGRESS` for the active student AND leave A's slot intact across subsequent calls.
- [ ] **T-2 GREEN** — In `extractActiveProgress()` (or `loadProgressRaw()`), add repair branch: if `map.activeStudentId` exists AND `map.activeStudentId !== activeProfileId`, drop `students[activeProfileId]` from a working copy and return `EMPTY_PROGRESS`; persist the dropped slot to localStorage to clear corruption.
- [ ] **T-3 RED** — Pin REQ-ISOL-3 (spec scenario "addAttempt after switch"): active=B, A has `[a1]`, stale `practice.v1.activeStudentId="A"`. `addAttempt(b1)` MUST result in B's `attempts=[b1]` and A's slot untouched.
- [ ] **T-3 GREEN** — In `addAttempt()` (`src/lib/practice-progress.ts:256-330`), confirm it reads `loadProgressRaw()` (now repaired by T-2) and writes to the active student's slice via `getActiveProfileId()`.

## Phase 2: Selector-Wired Local Fallback Mirror

- [ ] **T-4 RED** — Create `src/lib/persistence/__tests__/local-adapter.test.ts`: pin REQ-ISOL-4 — selector-wired local fallback `loadProgress("B")` returns B's slice even when `practice.v1.activeStudentId="A"`.
- [ ] **T-4 GREEN** — In `src/lib/persistence/local-adapter.ts:125-136`, replace the `activeId !== studentId → EMPTY_PROGRESS` branch so it delegates to the repaired `loadProgress()` path consistently; do NOT regress the "no active profile → allow raw load" branch.

## Phase 3: Reactivity + Reset Wiring

- [ ] **T-5 RED** — Add source-level assertion in `src/app/practice/__tests__/usePracticeFlow.retry.test.ts`: hook's progress-loading `useEffect` MUST depend on `student` (assert via `readFileSync` regex, matching existing source-level pattern in same file).
- [ ] **T-5 GREEN** — In `src/app/practice/usePracticeFlow.ts:109-117`, add `student` to the dep array of the progress-loading `useEffect` (call `useActiveStudent()` if not already in scope).
- [ ] **T-6 RED** — Add test in `src/app/diagnostic/__tests__/page-student-identity.test.ts`: given `attempts=[a1]` for student A, when `student` changes to B, `attempts / estimates / suggestions` MUST reset to `[]`. Source-level assertion pattern.
- [ ] **T-6 GREEN** — In `src/app/diagnostic/page.tsx:47-71`, prepend `setAttempts([]); setEstimates([]); setSuggestions([])` at the top of the existing `[student]` effect (before catalog selection).

## Phase 4: Dead-Code Deletion (REQ-ISOL-7)

- [ ] **T-7** — Delete `src/components/home/StudyPlanSection.tsx`. Update `src/components/home/__tests__/HomeNextStepClient-integration.test.ts:54-57` (assertion still passes — file is now absent — but update the comment to reflect dead-code cleanup, not home-removal). Verify no other consumer with `rg StudyPlanSection src/`.

## Phase 5: Verification & PR

- [ ] **T-8 VERIFY** — Run `pnpm run test`, `pnpm run typecheck`, `pnpm run build`. All green except pre-existing unrelated `src/lib/__tests__/migration-rls-shape.test.ts` (documented in STATUS.json as pre-existing).
- [ ] **T-9 DEFER GGA** — Skip GGA pre-commit on Windows per AGENTS.md; record deferred Linux re-validation in PR body.
- [ ] **T-10 PR** — Open PR: title `fix(profile): isolate student progress on switch (resolves #56)`. Body references REQ-ISOL-1..7, lists each scenario pinned, and links issue #56.

## Commit Plan (work-unit atomic)

Each RED-GREEN pair → atomic commit(s) with conventional messages. Suggested sequence:
1. `test(practice): pin stale-pointer isolation scenarios (RED)` — T-1, T-2, T-3 RED tests.
2. `fix(practice): route active identity via getActiveProfileId and repair corrupted slots` — T-1, T-2, T-3 GREEN.
3. `test(persistence): pin local-adapter selector fallback isolation (RED)` + `fix(persistence): mirror boundary + repair in local adapter` — T-4.
4. `test(practice-flow): pin student dep on progress-load effect (RED)` + `fix(practice): re-load progress on student change` — T-5.
5. `test(diagnostic): pin reset of in-progress state on student change (RED)` + `fix(diagnostic): reset attempts on student change` — T-6.
6. `chore(cleanup): delete unused StudyPlanSection component and update integration test` — T-7.

## Open Questions Resolved

1. **Which test imports `StudyPlanSection.tsx`?** — None. File lives at `src/components/home/StudyPlanSection.tsx` (note: proposal & spec say `src/components/study-plan/`; actual path is `src/components/home/`, will be corrected during apply if the orchestrator wants the spec path aligned). Only reference is `HomeNextStepClient-integration.test.ts:54-57` which asserts it is NOT imported (stays green after deletion).
2. **Canonical fixture builder?** — `tests/e2e/fixtures/practice-progress.ts` provides `buildPracticeProgressFixture(input)` (single-student). Existing `practice-progress.test.ts` builds multi-student maps inline. Follow the existing inline pattern for the new RED tests — no fixture extension needed.
3. **`usePracticeFlow` reactivity test mechanism?** — Source-level regex assertion (matching `usePracticeFlow.retry.test.ts` existing pattern). The project test environment is Node (no jsdom), so `renderHook` is not available; `act()` is not available either. Use the same `readFileSync` + `expect(src).toMatch(...)` pattern the existing test file uses for hook-structure assertions.

## Verification Plan

```bash
pnpm run test
pnpm run typecheck
pnpm run build
```

Pre-existing unrelated failure to flag (not fix): `src/lib/__tests__/migration-rls-shape.test.ts` per STATUS.json recent archives.
