# Proposal: Strengthen Diagnostic Coupling Tests

## Intent

Close the 2 implementable SUGGESTION findings from the `fix-student-home-diagnostic-coupling` verify report. The previous change added the "Diagnostic counts as first interaction" requirement and wired `loadDiagnosticResult()` into the home, but `deriveHomeNextStep`'s new 4th parameter (`effectiveDiagnosticResult`) has no direct test, and 3 of the 7 spec scenarios have only partial sub-assertion coverage. This change locks those contracts so future refactors don't silently regress them.

## Scope

### In Scope
- Add 2 direct regression tests for `deriveHomeNextStep` in `src/domain/__tests__/next-step.test.ts` covering the new `effectiveDiagnosticResult` parameter.
- Strengthen 3 partially-covered spec scenarios in `src/domain/__tests__/derive-student-home-view-model.test.ts` with explicit sub-assertions (lines ~197-235).

### Out of Scope
- Production code changes (zero source files touched).
- New test for `deriveHomeNextStep` when `attempts` is non-empty (already covered).
- Refactoring `deriveHomeNextStep` or `deriveStudentHomeViewModel` signatures.
- The 3rd SUGGESTION about forecast accuracy (22% over-forecast) — that is a meta-observation about SDD process, not a code change.
- Spec delta modifications (the spec was already updated in `b9ef7da`).

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- None. This change is test-only; no spec-level requirements change.

## Approach

Test-only change, ~45-75 lines of new test code across 2 files:

1. **`next-step.test.ts`** — add a new `describe("deriveHomeNextStep — effectiveDiagnosticResult")` block:
   - Test A: `deriveHomeNextStep` with `attempts = []` and a non-null `effectiveDiagnosticResult` returns `kind: 'practice'` (not `'diagnostic'`).
   - Test B: `deriveHomeNextStep` with `attempts = []` and `effectiveDiagnosticResult = undefined` (4th param omitted) returns `kind: 'diagnostic'` (locks existing behavior).

2. **`derive-student-home-view-model.test.ts`** — strengthen 3 existing tests (lines 197-235):
   - "mission CTA points to /diagnostic when no attempts and no diagnostic" (line 197): add `expect(vm.mission.ctaLabel).toBe("Hacer diagnóstico inicial")` and `expect(vm.studentSituation.diagnosticCompletedAt).toBeNull()`.
   - "mission CTA does NOT point to /diagnostic when diagnostic is completed and attempts is empty" (line 206): add `expect(vm.mission.ctaHref).toBe(nextStep.href)` consistency check.
   - "studentSituation.diagnosticCompletedAt reflects the stored diagnostic" (line 222): add `expect(vm.mission.ctaHref).not.toBe("/diagnostic")` consistency check.

Single work-unit commit: `test(home): strengthen diagnostic-coupling coverage`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/__tests__/next-step.test.ts` | Modified | 2 new tests for `deriveHomeNextStep` 4th parameter |
| `src/domain/__tests__/derive-student-home-view-model.test.ts` | Modified | 3 existing tests strengthened with explicit sub-assertions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tests pass but don't actually assert the contract | Low | Each test targets a specific `kind`/`ctaHref`/`ctaLabel` value; failures would be immediate |
| Merge conflict with main | Very Low | Branch is fresh off `e3fcb1d`, only test files touched |

## Rollback Plan

Revert the single commit. No production code was changed, no data migration, no external dependencies.

## Dependencies

- `fix-student-home-diagnostic-coupling` (merged, commit `e3fcb1d`) — provides the code under test.

## Success Criteria

- [ ] `src/domain/__tests__/next-step.test.ts` has 2 new tests that directly exercise the `effectiveDiagnosticResult` parameter.
- [ ] 3 existing tests in `derive-student-home-view-model.test.ts` have additional explicit `expect(...)` assertions.
- [ ] `pnpm run test` passes (all existing + new tests green).
- [ ] `pnpm run typecheck` passes.
- [ ] `pnpm run build` passes.
- [ ] No production source files changed (`git diff main -- src/` shows only `__tests__/` directories).
