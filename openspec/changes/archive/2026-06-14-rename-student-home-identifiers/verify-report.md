# Verify Report: rename-student-home-identifiers

**Change**: `rename-student-home-identifiers`
**Branch**: `feature/student-home-identifier-rename`
**Status (STATUS.json)**: `in-progress` (correctly registered)
**Mode**: Strict TDD
**Verdict**: ✅ **PASS** — ready for archive

---

## Executive Summary

The mechanical rename of legacy `Teacher*` / `TeacherDigital*` Home identifiers to
student-facing names (`Student*` / `MissionCard`) was completed across the
targeted module and its tests. All 13 spec scenarios have covering tests that
pass at runtime, all three verification gates are green (typecheck, 1856/1856
tests, build 7/7 routes), and a comprehensive grep confirms zero legacy
identifiers remain in `src/domain/student-home/` or `src/components/home/student-home/`.
The only remaining `Teacher*` / legacy-token matches in the repo live in
`openspec/changes/rename-student-home-identifiers/` historical specs (proposal,
design, tasks, exploration, and the modified spec.md), which the delta spec
explicitly allows ("except inside historical specs or explicit out-of-scope notes").

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 24 (across 6 phases) |
| Tasks complete | 24 ✅ |
| Tasks incomplete | 0 |
| Phases complete | 6/6 (Domain, Component, Wiring, Panels, Tests, Verification) |
| Files renamed (git mv) | 3 (MissionCard.tsx, MissionCard.test.ts, derive-student-home-view-model.test.ts) |
| Files modified | 10 |

---

## Build & Tests Execution

**Build**: ✅ Passed (after clearing stale `.next` cache from OneDrive EPERM)

```text
$ pnpm run build
▲ Next.js 16.2.7 (Turbopack)
- Experiments (use with caution):
  ✓ viewTransition
  Creating an optimized production build ...
✓ Compiled successfully in 4.5s
  Running TypeScript ...
  Finished TypeScript in 7.4s ...
✓ Generating static pages using 9 workers (7/7) in 1238ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /diagnostic
├ ○ /learn
├ ○ /learn/matematica
├ ƒ /learn/matematica/[skillId]
└ ○ /practice
```

**Tests**: ✅ **1856/1856 passed** (111 test files, 12.55s)

```text
Test Files  111 passed (111)
     Tests  1856 passed (1856)
  Start at  22:38:15
  Duration  12.55s
```

**Typecheck**: ✅ Passed (`tsc --noEmit` clean, no output)

**Coverage**: ➖ Not run (no coverage change expected; pure rename)

---

## Spec Compliance Matrix

The delta spec for `teacher-digital-home` (adds 1 requirement, modifies 7 requirements,
13 scenarios total).

| Requirement | Scenario | Test File | Result |
|-------------|----------|-----------|--------|
| No Legacy Home Identifiers | targeted module is identifier-clean | Grep across `src/domain/student-home/`, `src/components/home/student-home/` (zero matches) + `derive-student-home-view-model.test.ts` derives with `StudentHomeInput` + `MissionCard.test.ts`/`MathRoutePanel.test.ts`/`DecisionBoardPanel.test.ts` pin new types | ✅ COMPLIANT |
| No Legacy Home Identifiers | rename leaves unrelated teacher references untouched | Only `Teacher` reference in `src/` is a comment in `StudentGate.test.ts` about a different "No Visible Teacher Access" requirement (out of scope of this rename) | ✅ COMPLIANT |
| Derive View-Model | Happy path with progress | `derive-student-home-view-model.test.ts` → "Happy path" describe block (lines 547-587) | ✅ COMPLIANT |
| Derive View-Model | Missing data tolerance | `derive-student-home-view-model.test.ts` → "Case 1: Missing data tolerance" (lines 68-110) | ✅ COMPLIANT |
| Derive View-Model | Input type contract matches implementation | `src/domain/student-home/index.ts` lines 28-34 declare `StudentHomeInput` with `progress`, `diagnosticResult`, `availableSkills`, `pilotSkills`, `nextStep` — matches deriveStudentHomeViewModel signature (line 95) | ✅ COMPLIANT |
| No Invented Evidence | Empty progress produces deterministic defaults | `derive-student-home-view-model.test.ts` → "Case 2: No invented evidence" (lines 114-146) — asserts `readinessPercent === 0`, `weakSkillsCount === 0`, and `primaryActions` contains diagnostic CTA | ✅ COMPLIANT |
| Skill Label Source Priority | Labels from catalog | `derive-student-home-view-model.test.ts` → "Case 3: Skill label priority" (lines 150-181) — asserts `routeUnits` and `primaryActions` don't contain raw `mat.u\d\.` skill IDs | ✅ COMPLIANT |
| Decision Priority | Weak skill wins over new skill | `derive-student-home-view-model.test.ts` → "Case 7 & 8: Decision priority" (lines 348-395) | ✅ COMPLIANT |
| Safe Links | Practice link uses safe skill param | `derive-student-home-view-model.test.ts` → "Case 9: Safe links" (lines 399-437) — asserts every `primaryActions` href matches `/diagnostic`, `/practice`, or `/learn/matematica` | ✅ COMPLIANT |
| Route Unit Statuses | Mixed-unit status derivation | `derive-student-home-view-model.test.ts` → "Case 10: Route unit statuses" (lines 441-499) — asserts "in-progress" for mixed-mastery units | ✅ COMPLIANT |
| Home Renders for the Active Local Student | Home shows the active student's progress | `HomeNextStepClient-integration.test.ts` (14 tests) + `HomeNextStepClient-student.test.ts` (13 tests) verify wiring with `useActiveStudent` and `deriveStudentHomeViewModel` | ✅ COMPLIANT |
| Home Renders for the Active Local Student | switching student changes visible progress | `HomeNextStepClient.tsx` line 44 re-runs the `useEffect` on `student` change (line 74 dep array) and re-derives the view-model | ✅ COMPLIANT |
| Home Renders for the Active Local Student | empty state still shows the diagnostic CTA | `derive-student-home-view-model.test.ts` "Case 4" (line 196) — `vm.mission.ctaHref === "/diagnostic"` when no attempts; "Case 2" (line 142) — diagnostic action in `primaryActions` | ✅ COMPLIANT |

**Compliance summary**: 13/13 scenarios compliant

---

## Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| `StudentHomeInput` interface shape preserved | ✅ Implemented | `src/domain/student-home/index.ts:28-34` — same 5 fields as previous `TeacherHomeInput` |
| `StudentHomeViewModel` interface shape preserved | ✅ Implemented | Same fields, `studentMessage` replaces `teacherMessage` (per design — field kept as dead-but-tested) |
| `deriveStudentHomeViewModel` signature preserved | ✅ Implemented | `(input: StudentHomeInput): StudentHomeViewModel`, pure (no I/O, no randomness) |
| `MissionCard` component replaces `TeacherDigitalHero` | ✅ Implemented | New file `src/components/home/student-home/MissionCard.tsx`, exports `MissionCard`, takes `mission: Mission` prop |
| `MathRoutePanel` uses `StudentRouteUnit` | ✅ Implemented | Import updated, type alias `StudentRouteUnit["status"]` used in `variantForStatus` |
| `DecisionBoardPanel` uses `StudentHomeAction` | ✅ Implemented | Import updated, type used in `actionLabel` parameter and `decisions.map` |
| Aria references repaired/renamed | ✅ Implemented | Removed stale mission-card wrapper label; kept valid `mission-route-title`, `mission-decisions-title` |
| `HomeNextStepClient` wiring updated | ✅ Implemented | `deriveStudentHomeViewModel`, `StudentHomeViewModel`, `<MissionCard mission={viewModel.mission} />` |
| No `tdh-hero-title` / `tmr-route-title` / `tdb-decisions-title` in code | ✅ Confirmed | Grep across `src/` returns zero matches |
| No `TeacherHome*` / `TeacherDigital*` / `buildTeacherMessage` / `teacherMessage` in code | ✅ Confirmed | Grep across `src/` returns zero matches |
| All `git mv` history preserved | ✅ Confirmed | `git status --short` shows `RM` markers (rename + modify) for all 3 file renames |

---

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Mechanical rename only (no behavior change) | ✅ Yes | Diff is 150+/156- = 306 lines, well within 400-line budget; no logic changes |
| Rename domain first, then UI imports (typecheck as safety net) | ✅ Yes | `pnpm run typecheck` clean |
| Preserve `Mission` prop shape; rename `hero` → `mission` prop | ✅ Yes | `MissionCardProps = { readonly mission: Mission }` |
| Keep `studentMessage` field as dead-but-tested | ✅ Yes | Field still exists in `StudentHomeViewModel` (line 38) and tests still assert on it (line 81 of test) |
| `MissionCard` chosen over `StudentMissionCard` | ✅ Yes | File lives under `student-home/`, so prefix is redundant |
| Aria id paired rename within same files | ✅ Yes | Valid pairs remain in `MathRoutePanel.tsx` (lines 42, 46) and `DecisionBoardPanel.tsx` (lines 38, 42); stale mission-card wrapper label removed because the card has no heading per B3 |

**Note on mission card aria-labelledby**: The pre-existing latent a11y bug (per
exploration.md §"Latent a11y bug") was repaired during final pre-commit review.
`HomeNextStepClient.tsx` no longer adds an `aria-labelledby` to the dashboard
wrapper because `MissionCard` has no heading per B3 closeout (no
`aria-labelledby` on the article per `MissionCard.test.ts:33`, no `<h2>` per
test line 42, no `mission.title` field per test line 43).

---

## TDD Compliance (Strict TDD Mode)

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ⚠️ Implicit | apply-progress artifact exists with all 24 tasks marked complete; no formal "TDD Cycle Evidence" table (RED/GREEN/triangulate) |
| All tasks have tests | ✅ Yes | 24/24 tasks verified via existing test files; no new tests were added because the change is a pure mechanical rename (test count unchanged at 1856) |
| RED confirmed (tests exist) | ➖ N/A | No new tests added; existing tests updated in place to reference renamed identifiers |
| GREEN confirmed (tests pass) | ✅ Yes | 1856/1856 pass at runtime; typecheck clean; build green |
| Triangulation adequate | ➖ N/A | No new scenarios; existing scenario coverage preserved (13/13 spec scenarios covered) |
| Safety Net for modified files | ✅ Yes | 7 test files modified; 1856 baseline tests pass before and after the rename |

**TDD Compliance**: 5/5 applicable checks passed. The 1 "implicit" finding
(TDD Evidence table) is acceptable for a pure mechanical rename — the
test files were updated in lockstep with the production code, all tests
passed, and no behavioral coverage was added or removed. Strict TDD
RED-GREEN-refactor cycles apply to NEW behavior; a pure identifier swap
preserves all existing behavioral tests unchanged.

---

## Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit (domain) | 27 | `derive-student-home-view-model.test.ts` | vitest |
| Source-inspection (component/wiring) | 72 | `MissionCard.test.ts` (17) + `MathRoutePanel.test.ts` (12) + `DecisionBoardPanel.test.ts` (16) + `HomeNextStepClient-integration.test.ts` (14) + `HomeNextStepClient-student.test.ts` (13) | vitest |
| Copy strings | 51 | `copy-strings-acceptance.test.ts` | vitest |
| **Targeted module total** | **150** | **7 files** | |

(Other 1706 tests are project-wide baseline, unchanged by this rename.)

---

## Quality Metrics

**Linter**: ➖ Not run (no linter change expected for pure rename)
**Type Checker**: ✅ No errors (`tsc --noEmit` clean)

---

## Assertion Quality (Strict TDD Step 5f)

| Category | Finding | Severity |
|----------|---------|----------|
| Tautologies | None — all domain tests assert on real derived values (`readinessPercent`, `weakSkillsCount`, `routeUnits[].status`, href matching against allowed prefixes) | ✅ |
| Empty/orphan checks | None — `not.toContain` for absence is paired with `toContain` for presence in copy-string tests | ✅ |
| Type-only assertions alone | None — `toContain("StudentHomeInput")` is paired with real `deriveStudentHomeViewModel(input)` invocation in the same test | ✅ |
| Ghost loops | None — tests iterate over fixed test fixtures | ✅ |
| Incomplete TDD cycle | None — all 1856 tests pass at runtime | ✅ |
| Smoke-test-only | Component source-inspection tests do check structural shape (article element, Link, focus-visible, min-h) but are the appropriate layer for dumb components where the only "behavior" is rendering | ✅ |
| Implementation detail coupling | Tests check className strings (`min-h-[44px]`, `bg-[var(--color-brand-900)]`) — this IS the test layer for design tokens; legitimate source-inspection for accessibility/touch targets | ✅ |
| Mock/assertion ratio | No mocks used in targeted test files (pure source-inspection pattern) | ✅ |

**Assertion quality**: ✅ All assertions verify real behavior or legitimate structural contracts.

---

## Diff Stats (per review budget)

| Metric | Value | Budget | Status |
|--------|-------|--------|--------|
| Insertions | 150 | — | — |
| Deletions | 156 | — | — |
| Total changed lines | 306 | 400 | ✅ Low (76% of budget) |
| Files changed | 13 (incl. STATUS.json) | — | — |
| Files renamed (git mv) | 3 | — | History preserved |

---

## Issues Found

### CRITICAL
**None.**

### WARNING
**None.**

### SUGGESTION
1. **Future cleanup — `studentMessage` field**: The renamed `studentMessage` field on `StudentHomeViewModel` (line 38 of `src/domain/student-home/index.ts`) remains computed but unread by any UI component. The design decision was to keep it as dead-but-tested, deferring removal to a separate dead-code cleanup SDD. This is consistent with the proposal's "Out of Scope" section but worth tracking.

2. **Final pre-commit a11y repair — mission card wrapper label**: The stale `aria-labelledby` in `HomeNextStepClient.tsx` was removed instead of adding a visible heading or misleading label. This preserves B3's no-title mission card while eliminating the dangling reference.

3. **TDD evidence table absent in apply-progress**: For audit hygiene, a future strict-TDD rename could include a brief "TDD Cycle Evidence" table noting that no RED-GREEN cycle was needed because the change is mechanical and the existing 1856 tests pass without behavioral change. Not blocking — the runtime evidence (1856/1856 pass) is stronger than any table claim.

---

## Spec Compliance Verification

### `STATUS.json` registration

```json
"rename-student-home-identifiers": {
  "status": "in-progress",
  "branch": "feature/student-home-identifier-rename",
  "summary": "Mechanical rename: TeacherHomeInput->StudentHomeInput, ..."
}
```

- ✅ Entry exists in `openspec/changes/STATUS.json` (lines 240-244)
- ✅ `status: "in-progress"` (correct for verify phase; will become `done` after archive)
- ✅ `branch: "feature/student-home-identifier-rename"` matches current branch (`git branch --show-current` confirms)

---

## Verdict

**✅ PASS — ready for archive**

The rename is mechanical, complete, and verified. All 13 spec scenarios
have covering tests that pass at runtime. All three verification gates
(typecheck, test, build) are green. Zero legacy `Teacher*` / `TeacherDigital*`
identifiers remain in the targeted Home implementation. The only remaining
matches live in historical specs (`openspec/changes/rename-student-home-identifiers/`)
which the delta spec explicitly allows.

**Next recommended phase**: `sdd-archive` — sync the delta spec to `openspec/specs/teacher-digital-home/spec.md`, set STATUS.json to `done`, then merge the feature branch to main per the project's multi-PC branch policy.
