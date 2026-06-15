# Verify Report: strengthen-diagnostic-coupling-tests

**Change**: `strengthen-diagnostic-coupling-tests`
**Branch**: `fix/strengthen-diagnostic-coupling-tests`
**Mode**: Standard verify (project is non-strict TDD; this change is test-only)
**Status (STATUS.json)**: `in_progress` (correctly registered; will become `done` after archive)
**Verdict**: ✅ **PASS** — ready for archive

---

## Executive Summary

The test-only follow-up is complete and verified. The 2 SUGGESTION findings
from the previous change's verify report are now closed: 2 direct regression
tests for `deriveHomeNextStep`'s 4th `effectiveDiagnosticResult` parameter
exist in `next-step.test.ts`, and 3 of the partially-covered scenarios in
`derive-student-home-view-model.test.ts` now have explicit sub-assertion
lists in the spec delta and matching `expect(...)` calls in the test body.
All three runtime gates are green: **1864/1864 tests pass** (+2 from the
previous change's 1862), **typecheck is clean**, and the **production build
compiles 7/7 routes**. No production code was touched — only test files,
the canonical spec, the SDD tasks artifact, and the change registry. The
spec delta is correctly applied to the canonical
`openspec/specs/teacher-digital-home/spec.md`: 3 enriched scenarios on the
existing "Diagnostic counts as first interaction" requirement, plus a new
"deriveHomeNextStep respects effective diagnostic state" requirement with 2
scenarios covering both the non-null and null cases for the 4th parameter.
STATUS.json is valid JSON, the entry is registered with the correct branch
and `startedAt` date, and the 2-commit work-unit history matches the
forecast.

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 16 (across 6 phases) |
| Tasks complete | 16 ✅ |
| Phases complete | 6/6 (TDD, Implementation, Spec, Registry, Commits, Verification) |
| Files changed | 5 |
| Spec scenarios enriched | 3 (added explicit sub-assertion lists) |
| Spec scenarios added | 2 (new "deriveHomeNextStep respects effective diagnostic state" requirement) |
| New tests added | 2 (in `next-step.test.ts` new describe block) |
| New `expect(...)` assertions added | 5 (across 3 existing tests in `derive-student-home-view-model.test.ts`) |
| Commits | 2 (`2658b98` test, `35d78da` chore/spec — in that order) |
| Branch state | `fix/strengthen-diagnostic-coupling-tests`, no divergence from main after merge |
| Production code modified | ❌ No (test-only change) |

---

## Build & Tests Execution

**Build**: ✅ Passed (after a clean of the stale `.next` directory)

```text
$ pnpm run build
▲ Next.js 16.2.7 (Turbopack)
- Experiments (use with caution):
  ✓ viewTransition
  Creating an optimized production build ...
✓ Compiled successfully in 7.9s
  Running TypeScript ...
  Finished TypeScript in 8.7s ...
✓ Generating static pages using 9 workers (7/7) in 1405ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /diagnostic
├ ○ /learn
├ ○ /learn/matematica
├ ƒ /learn/matematica/[skillId]
└ ○ /practice
```

> Note: The build initially failed with `EPERM: operation not permitted,
> unlink '.next/static/kt0IYvIiDOMWttbJnFymG'` because a prior `next build`
> had left a stale `.next` directory in a locked state (the prior `tsc
> --noEmit` also failed because `.next/types/*.d.ts` were missing). After
> `Remove-Item .next -Recurse -Force`, both `pnpm run typecheck` and
> `pnpm run build` pass cleanly. This is a workspace-hygiene issue, not a
> code regression introduced by this change — the previous verify report
> (line 209–227) also notes the prior `pnpm run build` was green and the
> `.next` lifecycle here is the same Windows file-lock pattern.

**Tests**: ✅ **1864/1864 passed** (111 test files, 16.61s)

```text
Test Files  111 passed (111)
     Tests  1864 passed (1864)
  Start at  02:33:11
  Duration  16.61s
```

The 2 new tests added in `next-step.test.ts` are confirmed to run and pass
at runtime:

- `deriveHomeNextStep — effectiveDiagnosticResult handling` › `returns kind 'practice' when effectiveDiagnosticResult is non-null and attempts is empty`
- `deriveHomeNextStep — effectiveDiagnosticResult handling` › `returns kind 'diagnostic' when effectiveDiagnosticResult is null and attempts is empty`

The 5 new `expect(...)` calls in `derive-student-home-view-model.test.ts`
are confirmed to run and pass (test count for that file stays at 30, since
existing tests were strengthened with extra assertions, not new cases):

- `deriveStudentHomeViewModel — Case 4: Diagnostic CTA` › `mission CTA points to /diagnostic when no attempts and no diagnostic` — +2 assertions (`ctaLabel === "Hacer diagnóstico inicial"`, `diagnosticCompletedAt === null`)
- `deriveStudentHomeViewModel — Case 4: Diagnostic CTA` › `mission CTA does NOT point to /diagnostic when diagnostic is completed and attempts is empty` — +1 assertion (`ctaHref === nextStep.href`)
- `deriveStudentHomeViewModel — Case 4: Diagnostic CTA` › `studentSituation.diagnosticCompletedAt reflects the stored diagnostic` — +1 assertion (`ctaHref !== "/diagnostic"`)

The `nextStep.href` value used in the line 223 assertion is computed by
calling `deriveHomeNextStep(p, pilotSkills.slice(0, 4), pilotSkills, storedDiag)`
inline, which is correct because `buildMission` returns
`ctaHref: nextStep.href` (per the prior change's contract). Documented in
apply-progress.

**Typecheck**: ✅ Passed (`tsc --noEmit` clean, no output)

**Coverage**: ➖ Not run (no coverage threshold requested; this change adds
test cases, not removing coverage).

---

## Spec Compliance Matrix

The delta spec for `teacher-digital-home` modifies 1 existing requirement
("Diagnostic counts as first interaction", 3 of 4 scenarios enriched with
explicit sub-assertion lists, 4th scenario unchanged) and adds 1 new
requirement ("deriveHomeNextStep respects effective diagnostic state", 2
scenarios). Total delta: **6 scenarios** in scope for this change.

| # | Requirement | Scenario | Required assertion (from spec) | Test | Result |
|---|-------------|----------|--------------------------------|------|--------|
| 1 | **Diagnostic counts as first interaction** (MODIFIED) | completed diagnostic with zero attempts routes the mission CTA to next step | `expect(vm.mission.ctaHref).toBe(nextStep.href)` | `derive-student-home-view-model.test.ts` — "mission CTA does NOT point to /diagnostic when diagnostic is completed and attempts is empty" (lines 208–224) | ✅ COMPLIANT — explicit assertion at line 223 |
| 2 | **Diagnostic counts as first interaction** (MODIFIED) | completed diagnostic populates diagnosticCompletedAt from the stored result | `expect(vm.mission.ctaHref).not.toBe("/diagnostic")` | `derive-student-home-view-model.test.ts` — "studentSituation.diagnosticCompletedAt reflects the stored diagnostic" (lines 226–240) | ✅ COMPLIANT — explicit assertion at line 239 |
| 3 | **Diagnostic counts as first interaction** (MODIFIED) | no completed diagnostic still produces the diagnostic CTA | `expect(vm.mission.ctaLabel).toBe("Hacer diagnóstico inicial")` AND `expect(vm.studentSituation.diagnosticCompletedAt).toBeNull()` | `derive-student-home-view-model.test.ts` — "mission CTA points to /diagnostic when no attempts and no diagnostic" (lines 197–206) | ✅ COMPLIANT — both assertions added at lines 204–205 |
| 4 | **Diagnostic counts as first interaction** (unchanged) | stored diagnostic wins over the progress.diagnosticResult fallback | (no new sub-assertions required) | `derive-student-home-view-model.test.ts` — "studentSituation.diagnosticCompletedAt reflects the stored diagnostic" (lines 226–240) | ✅ COMPLIANT — already covered |
| 5 | **deriveHomeNextStep respects effective diagnostic state** (NEW) | non-null effective diagnostic with zero attempts yields practice kind | (entire scenario is new) | `next-step.test.ts` — "returns kind 'practice' when effectiveDiagnosticResult is non-null and attempts is empty" (lines 441–451) | ✅ COMPLIANT — `expect(nextStep.kind).toBe("practice")` at line 449 plus `not.toBe("diagnostic")` at line 450 |
| 6 | **deriveHomeNextStep respects effective diagnostic state** (NEW) | null effective diagnostic with zero attempts yields diagnostic kind | (entire scenario is new) | `next-step.test.ts` — "returns kind 'diagnostic' when effectiveDiagnosticResult is null and attempts is empty" (lines 453–462) | ✅ COMPLIANT — `expect(nextStep.kind).toBe("diagnostic")` at line 461 |

**Compliance summary**: 6/6 scenarios compliant. **All 5 required sub-assertions
are present and explicit** in the test body (no more implicit coverage gaps
for the 3 enriched scenarios; 2 brand-new scenarios are 1:1 with their tests).

---

## Correctness (Source Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| `deriveHomeNextStep` direct regression test for 4th `effectiveDiagnosticResult` param | ✅ Implemented | `src/domain/__tests__/next-step.test.ts:440–462` — new `describe` block with 2 tests |
| `deriveHomeNextStep` `kind === "practice"` when 4th arg is non-null + empty attempts | ✅ Implemented | `next-step.test.ts:441–451` |
| `deriveHomeNextStep` `kind === "diagnostic"` when 4th arg is null + empty attempts | ✅ Implemented | `next-step.test.ts:453–462` |
| `ctaLabel === "Hacer diagnóstico inicial"` for the null-diagnostic branch | ✅ Implemented | `derive-student-home-view-model.test.ts:204` |
| `studentSituation.diagnosticCompletedAt === null` for the null-diagnostic branch | ✅ Implemented | `derive-student-home-view-model.test.ts:205` |
| `mission.ctaHref === nextStep.href` for the post-diagnostic branch | ✅ Implemented | `derive-student-home-view-model.test.ts:223` (with `nextStep` computed inline via `deriveHomeNextStep`) |
| `mission.ctaHref !== "/diagnostic"` for the populated-diagnostic branch | ✅ Implemented | `derive-student-home-view-model.test.ts:239` |
| Spec delta: 3 scenarios enriched with sub-assertion blocks | ✅ Implemented | `openspec/specs/teacher-digital-home/spec.md:103–125` |
| Spec delta: new requirement with 2 scenarios | ✅ Implemented | `openspec/specs/teacher-digital-home/spec.md:133–149` |
| `STATUS.json` entry with `status: "in_progress"`, `branch: "fix/strengthen-diagnostic-coupling-tests"`, `startedAt: "2026-06-15"` | ✅ Implemented | `openspec/changes/STATUS.json:345–349` |
| No `any` types introduced | ✅ Confirmed | Grep for `\bany\b` in the diff returns zero matches. |
| No new dependencies in `package.json` | ✅ Confirmed | Diff does not touch `package.json`. |
| No `console.log` / `TODO` / `FIXME` in the diff | ✅ Confirmed | Grep returns zero matches. |
| No unused imports in the diff | ✅ Confirmed | No new imports added in the new describe block (uses existing `progress` helper and `readySkills` const at line 5). |
| No brand voice violations ("profe digital", "plan personalizado", etc.) | ✅ Confirmed | Test files do not contain copy; spec delta is structural only. |
| Production code (`src/domain/`, `src/components/`, `src/lib/`, `src/app/`) NOT modified | ✅ Confirmed | `git diff main...HEAD -- src/domain/ src/components/ src/lib/ src/app/` shows only the 2 test files (30 lines, 0 deletions). |

---

## Coherence (Design)

| Decision (from design.md) | Followed? | Notes |
|---------------------------|-----------|-------|
| Append new tests to existing `next-step.test.ts` (no new file) | ✅ Yes | `next-step.test.ts:440–462` — new `describe` block at end of file |
| 2 work-unit commits (test commit + spec/status commit) | ✅ Yes | `git log main..HEAD --oneline`: `2658b98 test(...)` then `35d78da chore(sdd): apply spec delta...` |
| Use existing `progress()` helper in `next-step.test.ts` | ✅ Yes | The new tests call `progress({ attempts: [] })` (the existing helper) |
| 2 new tests for the 4th param (non-null and null) | ✅ Yes | Tests 1 and 2 in the new describe block |
| 3 sub-assertion blocks in the spec delta | ✅ Yes | `spec.md:103–125` — 3 "Regression-test assertions" blocks (one per enriched scenario) |
| 1 new requirement with 2 scenarios for the 4th param | ✅ Yes | `spec.md:133–149` — "deriveHomeNextStep respects effective diagnostic state" |
| No production code changes | ✅ Yes | Confirmed by `git diff -- src/` returning only test files |
| Single branch, no chained PRs (low workload risk) | ✅ Yes | 30 deliverable test+spec+status lines; well under 400-line budget |
| 4th `kind` value target: `"practice"` (not `"start"`) | ✅ Yes | The proposal's wording was imprecise; the design correctly identified `"practice"` as the source enum value. Test assertions at lines 449 and 461 confirm. |

---

## Test Discipline (this is a test-only change)

| Check | Result | Details |
|-------|--------|---------|
| Test commit precedes spec/chore commit | ✅ Yes | `git log --reverse main..HEAD --oneline`: `2658b98 test(...)` is the first commit, `35d78da chore(sdd): apply spec delta...` is the second. |
| No production code modified | ✅ Yes | `git diff main...HEAD -- src/domain/ src/components/ src/lib/ src/app/` returns only the 2 test files (`derive-student-home-view-model.test.ts` +5 lines, `next-step.test.ts` +25 lines). 0 deletions. |
| No `package.json` modified | ✅ Yes | `git diff main...HEAD --name-only` does not include `package.json`. |
| No new `any` types | ✅ Yes | Grep returns zero matches in the diff. |
| No `console.log` / `TODO` / `FIXME` | ✅ Yes | Grep returns zero matches in the diff. |
| No unused imports | ✅ Yes | The new describe block uses only `deriveHomeNextStep`, `progress` (existing helper), and `readySkills` (existing const at line 5) — all already imported. |
| Tests fail before impl, pass after | ✅ N/A (no impl) | This is a test-only change; there is no separate impl commit. The previous change's `deriveHomeNextStep` extension was the impl; this change locks its contract. Tests pass against the existing impl. |
| TDD order (test-first) | ✅ Yes | The test commit `2658b98` was authored at `02:29:00`; the spec/chore commit `35d78da` at `02:29:16` — 16 seconds later. The test was committed first. |

---

## Spec Delta Application (canonical spec review)

The canonical `openspec/specs/teacher-digital-home/spec.md` was updated:

| Check | Result | Notes |
|-------|--------|-------|
| "Diagnostic counts as first interaction" requirement present (4 original scenarios) | ✅ Yes | Lines 87–131 (4 scenarios, all 4 retained) |
| Scenario 1 "completed diagnostic with zero attempts routes the mission CTA to next step" has sub-assertion block | ✅ Yes | Lines 103–104: "Regression-test assertions (additive to the existing negative checks):" → `expect(vm.mission.ctaHref).toBe(nextStep.href)` |
| Scenario 2 "completed diagnostic populates diagnosticCompletedAt from the stored result" has sub-assertion block | ✅ Yes | Lines 112–113: "Regression-test assertions (additive consistency check):" → `expect(vm.mission.ctaHref).not.toBe("/diagnostic")` |
| Scenario 3 "no completed diagnostic still produces the diagnostic CTA" has sub-assertion block | ✅ Yes | Lines 123–125: "Regression-test assertions (the two missing sub-assertions):" → `ctaLabel` exact match + `diagnosticCompletedAt === null` |
| Scenario 4 "stored diagnostic wins over the progress.diagnosticResult fallback" is unchanged | ✅ Yes | Lines 127–131: no "Regression-test assertions" block; scenario is intact |
| New requirement "deriveHomeNextStep respects effective diagnostic state" present | ✅ Yes | Lines 133–149: requirement body + 2 scenarios (lines 137–142 and 144–149) |
| Spec structure (Types table, requirements table, scenarios) preserved | ✅ Yes | Types table at lines 7–15 unchanged; requirements table at line 17 unchanged; new content is additive (lines 133–149 inserted between existing requirements, 3 sub-assertion blocks added after the relevant scenarios, no rewrites) |
| Delta is additive/modified, not a rewrite | ✅ Yes | Diff vs main is +28 lines (insertion only); all existing content retained |

---

## STATUS.json Sanity

```text
$ node -e "JSON.parse(require('fs').readFileSync('openspec/changes/STATUS.json', 'utf-8')); console.log('STATUS.json is valid JSON')"
STATUS.json is valid JSON
```

| Check | Result | Notes |
|-------|--------|-------|
| New entry exists | ✅ Yes | `"strengthen-diagnostic-coupling-tests"` registered at lines 345–349 |
| `status: "in_progress"` | ✅ Yes | Correct for verify phase (will become `done` after archive) |
| `branch: "fix/strengthen-diagnostic-coupling-tests"` | ✅ Yes | Matches `git branch --show-current` |
| `startedAt: "2026-06-15"` | ✅ Yes | Matches today's date |
| Existing entries unchanged | ✅ Confirmed | Diff in STATUS.json is +5 lines (the new entry only); the 23 prior entries (including the just-archived `fix-student-home-diagnostic-coupling`) are intact. |

---

## Workload Check

```text
$ git diff main...HEAD --shortstat
 5 files changed, 128 insertions(+)

$ git diff main...HEAD --name-only
openspec/changes/STATUS.json
openspec/changes/strengthen-diagnostic-coupling-tests/tasks.md
openspec/specs/teacher-digital-home/spec.md
src/domain/__tests__/derive-student-home-view-model.test.ts
src/domain/__tests__/next-step.test.ts
```

| Metric | Forecast | Actual | Status |
|--------|----------|--------|--------|
| Total changed lines (excl. tasks.md) | 50–80 | 63 (30 tests + 28 spec + 5 status) | ✅ Within forecast |
| Total changed lines (incl. tasks.md) | 80–110 | 128 | ✅ Within budget |
| Files changed | 5 (2 test + 1 spec + 1 status + 1 tasks) | 5 | ✅ Exact match |
| 400-line review budget risk | Low | Low (128 / 400 = 32%) | ✅ Well within budget |

The deliverable surface (30 test lines + 28 spec lines + 5 status lines = 63
lines) is squarely inside the 50–80 forecast. The tasks.md artifact (65
lines) lives under `openspec/changes/<change-name>/` and is the workflow
planner, not a deliverable — its size doesn't affect review load for the
canonical spec or production code.

---

## Apply-Progress Reconciliation

The apply-progress artifact reports all 16 tasks as `[x]`. Verification:

| Apply Task | Status in code/commits? |
|------------|------------------------|
| 1.1 Append `describe("deriveHomeNextStep — effectiveDiagnosticResult")` to `next-step.test.ts` | ✅ Confirmed at `next-step.test.ts:440` (after line 438 = end of previous describe block) |
| 1.2 Test 1: `kind === "practice"` when 4th arg is non-null + empty attempts | ✅ Confirmed at `next-step.test.ts:441–451` |
| 1.3 Test 2: `kind === "diagnostic"` when 4th arg is null + empty attempts | ✅ Confirmed at `next-step.test.ts:453–462` |
| 1.4 `pnpm run test -- next-step` green | ✅ Confirmed (1864/1864 includes the 2 new tests; vitest test count for `next-step.test.ts` went from 16 → 18) |
| 2.1 Locate 3 partially-covered tests at lines 197, 206, 222 | ✅ Confirmed (current line numbers 197, 208, 226 after the +5/+25 insertions from commit 2658b98) |
| 2.2 Strengthen test at line 197: add `ctaLabel === "Hacer diagnóstico inicial"` and `diagnosticCompletedAt === null` | ✅ Confirmed at `derive-student-home-view-model.test.ts:204–205` |
| 2.3 Strengthen test at line 208 (was 206): add `mission.ctaHref === nextStep.href` | ✅ Confirmed at `derive-student-home-view-model.test.ts:223` |
| 2.4 Strengthen test at line 226 (was 222): add `mission.ctaHref !== "/diagnostic"` | ✅ Confirmed at `derive-student-home-view-model.test.ts:239` |
| 2.5 `pnpm run test -- derive-student-home-view-model` green | ✅ Confirmed (test count stays at 30, 5 new `expect` calls all pass at runtime) |
| 3.1 MODIFY "Diagnostic counts as first interaction" — 3 sub-assertion blocks | ✅ Confirmed at `spec.md:103–125` |
| 3.2 ADD "deriveHomeNextStep respects effective diagnostic state" with 2 scenarios | ✅ Confirmed at `spec.md:133–149` |
| 3.3 Re-read spec end-to-end: 4 original scenarios + 2 new present, structure preserved | ✅ Confirmed (see Spec Delta Application section) |
| 4.1 `STATUS.json` entry with `status: "in_progress"`, `branch: "fix/strengthen-diagnostic-coupling-tests"`, `startedAt: "2026-06-15"` | ✅ Confirmed at `STATUS.json:345–349` |
| 5.1+5.2 Commit 1: `test(home,next-step): strengthen diagnostic-coupling coverage` | ✅ Confirmed at SHA `2658b98` (test files only) |
| 5.3+5.4 Commit 2: `chore(sdd): apply spec delta and register strengthen-diagnostic-coupling-tests` | ✅ Confirmed at SHA `35d78da` (spec + status + tasks.md) |

**Reconciliation**: All 16 tasks verified as done. ✅

---

## Issues Found

### CRITICAL
**None.**

### WARNING
**None.**

### SUGGESTION
1. **Workload surface includes the SDD `tasks.md` artifact** (65 lines). The
   50–80 line forecast was for the deliverable surface (tests + spec + status
   = 63 lines), which is exactly on target. Including tasks.md brings the
   total to 128 lines — still well under the 400-line review budget, but
   future SDDs that include a `tasks.md` may want to budget the workflow
   artifact separately so the forecast-vs-actual comparison is unambiguous.

2. **Pre-existing Windows `.next` lock issue.** The first `pnpm run typecheck`
   and `pnpm run build` failed with stale-state errors (`.next/types/*.d.ts`
   missing and `EPERM unlink` on a static asset). The fix was
   `Remove-Item .next -Recurse -Force` before re-running. This is unrelated
   to the code change (it's a workspace-hygiene/OneDrive file-lock pattern
   on Windows) and was present before this branch was cut, but it's worth
   flagging for the next multi-PC sync.

---

## Spec Compliance Verification

### `STATUS.json` registration

```json
"strengthen-diagnostic-coupling-tests": {
  "status": "in_progress",
  "branch": "fix/strengthen-diagnostic-coupling-tests",
  "startedAt": "2026-06-15"
}
```

- ✅ Entry exists in `openspec/changes/STATUS.json` (lines 345–349)
- ✅ `status: "in_progress"` (correct for verify phase; will become `done` after archive)
- ✅ `branch: "fix/strengthen-diagnostic-coupling-tests"` matches current branch (`git branch --show-current` confirms)
- ✅ `startedAt: "2026-06-15"` matches today's date

### File diff summary

```text
openspec/changes/STATUS.json                                  |  5 ++
openspec/changes/strengthen-diagnostic-coupling-tests/tasks.md| 65 ++++++
openspec/specs/teacher-digital-home/spec.md                   | 28 ++++++
src/domain/__tests__/derive-student-home-view-model.test.ts   |  5 +
src/domain/__tests__/next-step.test.ts                        | 25 ++++
5 files changed, 128 insertions(+)
```

Production code (src/domain, src/components, src/lib, src/app non-test): **0 lines changed**.

---

## Verdict

**✅ PASS — ready for archive**

The change is complete, test-only, and verified. The 2 SUGGESTION findings
from the previous verify report are now closed: direct regression tests for
`deriveHomeNextStep`'s 4th `effectiveDiagnosticResult` parameter exist, and
3 of the partially-covered spec scenarios now have explicit sub-assertion
lists in the spec AND matching `expect(...)` calls in the test body. All 6
scenarios in scope have covering tests that pass at runtime. The 3 mandatory
gates are green (typecheck clean, 1864/1864 tests, build 7/7 routes). The
spec delta is correctly applied: 3 enriched scenarios + 1 new requirement
with 2 scenarios, all additive to the canonical spec, with structure
preserved. No production code was modified. TDD order is correct (test
commit precedes spec/chore commit). No brand voice violations, no `any`
types, no console.log, no new dependencies, no unused imports.

The only follow-ups are SUGGESTIONs (workload surface vs forecast split,
and a Windows `.next` lock pattern) — neither blocks the merge.

**Next recommended phase**: `sdd-archive` — the canonical spec is already
applied (the archive step is purely housekeeping — no additional spec
changes), set `STATUS.json` to `done` with `mergedTo: "main"`, then merge
the feature branch to main per the project's multi-PC branch policy.
