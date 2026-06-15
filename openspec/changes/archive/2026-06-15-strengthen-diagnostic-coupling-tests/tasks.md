# Tasks: Strengthen Diagnostic Coupling Tests

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~50-80 (2 test files + 1 spec + 1 STATUS.json) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single branch, 2 work-unit commits |
| Delivery strategy | single-pr-default (direct commits to main, matching previous bugfix pattern) |
| Chain strategy | n/a |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: n/a
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Notes |
|------|------|-------|
| 1 | Test coverage: add direct regression + strengthen sub-assertions | Single commit: `next-step.test.ts` + `derive-student-home-view-model.test.ts` |
| 2 | Spec delta + registry: apply and register | Single commit: canonical spec + STATUS.json |

## Phase 1: New test file — deriveHomeNextStep effectiveDiagnosticResult regression

- [x] 1.1 Read the end of `src/domain/__tests__/next-step.test.ts` (after line 438). Append a new `describe("deriveHomeNextStep — effectiveDiagnosticResult")` block with 2 tests using the existing `progress()` helper.
- [x] 1.2 Test 1: "returns kind 'practice' when effectiveDiagnosticResult is non-null and attempts is empty" — input: `progress({ attempts: [] })`, 4th arg: `{ completedAt: '2026-06-15T12:00:00.000Z', estimates: [], suggestions: [], version: 1 }`. Assert: `nextStep.kind === "practice"`.
- [x] 1.3 Test 2: "returns kind 'diagnostic' when effectiveDiagnosticResult is null/undefined and attempts is empty" — input: `progress({ attempts: [] })`, 4th arg: `null`. Assert: `nextStep.kind === "diagnostic"`.
- [x] 1.4 Run `pnpm run test -- next-step`. Both new tests must PASS on first run (production code already correct).

## Phase 2: Strengthen 3 existing test cases in derive-student-home-view-model.test.ts

- [x] 2.1 In `src/domain/__tests__/derive-student-home-view-model.test.ts`, locate the 3 tests in "Case 4: Diagnostic CTA" that have partial coverage: line 197 test, line 206 test, line 222 test.
- [x] 2.2 Strengthen test at line 197 ("mission CTA points to /diagnostic when no attempts and no diagnostic"): add `expect(vm.mission.ctaLabel).toBe("Hacer diagnóstico inicial")` and `expect(vm.studentSituation.diagnosticCompletedAt).toBeNull()`.
- [x] 2.3 Strengthen test at line 206 ("mission CTA does NOT point to /diagnostic when diagnostic is completed and attempts is empty"): add `expect(vm.mission.ctaHref).toBe(nextStep.href)` using the `nextStep` from the view-model derivation (pass it through the input).
- [x] 2.4 Strengthen test at line 222 ("studentSituation.diagnosticCompletedAt reflects the stored diagnostic"): add `expect(vm.mission.ctaHref).not.toBe("/diagnostic")`.
- [x] 2.5 Run `pnpm run test -- derive-student-home-view-model`. All tests must PASS.

## Phase 3: Spec delta — apply to canonical spec

- [x] 3.1 Edit `openspec/specs/teacher-digital-home/spec.md`: in the "Diagnostic counts as first interaction" requirement (lines 87-122), MODIFY the 3 partially-covered scenarios to include explicit sub-assertion lists from the spec delta:
  - Scenario "completed diagnostic with zero attempts...": add `AND mission.ctaHref equals the href of the nextStep input` (already present at line 101 — no change needed).
  - Scenario "completed diagnostic populates...": add `AND mission.ctaHref is NOT "/diagnostic"`.
  - Scenario "no completed diagnostic still produces...": add `AND mission.ctaLabel is "Hacer diagnóstico inicial"` and `AND studentSituation.diagnosticCompletedAt is null`.
  - The 4th scenario "stored diagnostic wins..." stays as-is.
- [x] 3.2 In the same spec file, ADD new requirement "deriveHomeNextStep respects effective diagnostic state" with its 2 scenarios (from the spec delta): "non-null effective diagnostic with zero attempts yields practice kind" and "null effective diagnostic with zero attempts yields diagnostic kind".
- [x] 3.3 Re-read the spec end-to-end to confirm requirements table, scenarios under each requirement, and Types table are all intact.

## Phase 4: Registry and housekeeping

- [x] 4.1 Edit `openspec/changes/STATUS.json`: add entry for `strengthen-diagnostic-coupling-tests` with `status: "in_progress"`, `branch: "fix/strengthen-diagnostic-coupling-tests"`, `startedAt: "2026-06-15"`. Do NOT set `mergeCommit`.

## Phase 5: Work-unit commits

- [x] 5.1 Commit 1 (`test(home,next-step): strengthen diagnostic-coupling coverage`): staged files: `src/domain/__tests__/next-step.test.ts`, `src/domain/__tests__/derive-student-home-view-model.test.ts`. Rationale: both are test-only additions that lock the same contract family.
- [x] 5.2 Commit 2 (`chore(sdd): apply spec delta and register strengthen-diagnostic-coupling-tests`): staged files: `openspec/specs/teacher-digital-home/spec.md`, `openspec/changes/STATUS.json`. Rationale: spec and registry updates belong together.

## Phase 6: Verification (sdd-verify phase, not apply)

- [ ] 6.1 Full test suite green: `pnpm run test`
- [ ] 6.2 Typecheck clean: `pnpm run typecheck`
- [ ] 6.3 Build green: `pnpm run build`
- [ ] 6.4 Spec scenario coverage: all 6 scenarios (4 from "Diagnostic counts as first interaction" + 2 new from "deriveHomeNextStep respects effective diagnostic state") have explicit sub-assertion coverage.
