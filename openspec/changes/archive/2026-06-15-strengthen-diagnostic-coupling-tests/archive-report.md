# Archive Report: strengthen-diagnostic-coupling-tests

**Change**: `strengthen-diagnostic-coupling-tests`
**Archived**: 2026-06-15
**Branch**: `fix/strengthen-diagnostic-coupling-tests`
**Mode**: openspec
**Verification verdict**: ✅ **PASS**

---

## Executive Summary

Test-only follow-up to `fix-student-home-diagnostic-coupling`: 2 new regression tests
for `deriveHomeNextStep`'s 4th `effectiveDiagnosticResult` parameter in
`next-step.test.ts`, and 3 strengthened sub-assertion lists in
`derive-student-home-view-model.test.ts` that close the 2 SUGGESTION findings from
the parent verify report. All 6 spec scenarios in scope have explicit runtime
assertions. Spec delta applied to canonical `openspec/specs/teacher-digital-home/spec.md`
in commit `35d78da`. This change closes the 2 implementable SUGGESTIONS from
`fix-student-home-diagnostic-coupling`.

---

## Apply Commits (2)

| # | SHA | Message |
|---|-----|---------|
| 1 | `2658b98` | `test(home,next-step): strengthen diagnostic-coupling coverage` |
| 2 | `35d78da` | `chore(sdd): apply spec delta and register strengthen-diagnostic-coupling-tests` |

---

## Gate Results

| Gate | Result |
|------|--------|
| Build | ✅ 7/7 routes, clean compile |
| Tests | ✅ 1864/1864 (111 test files, 16.61s) |
| Typecheck | ✅ `tsc --noEmit` clean |
| Spec coverage | ✅ 6/6 scenarios have explicit sub-assertion coverage |
| TDD discipline | ✅ test commit precedes spec/chore commit (16s apart) |
| Workload | ✅ 128 lines diff — well within 400-line budget (32%) |

---

## Spec Compliance

6/6 scenarios compliant. All 5 required sub-assertions are present and explicit
in the test body.

| # | Requirement | Scenario | Status |
|---|-------------|----------|--------|
| 1 | Diagnostic counts as first interaction (MODIFIED) | completed diagnostic + zero attempts → mission CTA to next step | ✅ |
| 2 | Diagnostic counts as first interaction (MODIFIED) | completed diagnostic populates diagnosticCompletedAt | ✅ |
| 3 | Diagnostic counts as first interaction (MODIFIED) | no completed diagnostic → diagnostic CTA with correct label | ✅ |
| 4 | Diagnostic counts as first interaction (unchanged) | stored diagnostic wins over progress.diagnosticResult fallback | ✅ |
| 5 | deriveHomeNextStep respects effective diagnostic state (NEW) | non-null effective diagnostic + zero attempts → kind "practice" | ✅ |
| 6 | deriveHomeNextStep respects effective diagnostic state (NEW) | null effective diagnostic + zero attempts → kind "diagnostic" | ✅ |

---

## Findings

### WARNING
None.

### SUGGESTION

1. **Workload surface includes the SDD `tasks.md` artifact** (65 lines). The
   50–80 line forecast was for the deliverable surface (tests + spec + status
   = 63 lines), exactly on target. Including tasks.md brings the total to 128
   lines — still well under the 400-line review budget, but future SDDs that
   include a `tasks.md` may want to budget the workflow artifact separately so
   the forecast-vs-actual comparison is unambiguous.

2. **Pre-existing Windows `.next` lock issue.** The first `pnpm run typecheck`
   and `pnpm run build` failed with stale-state errors (`.next/types/*.d.ts`
   missing and `EPERM unlink` on a static asset). The fix was
   `Remove-Item .next -Recurse -Force` before re-running. This is unrelated
   to the code change (workspace-hygiene/OneDrive file-lock pattern on Windows).

---

## Files Modified (5)

```
openspec/changes/STATUS.json                                  |  5 +
openspec/specs/teacher-digital-home/spec.md                   | 28 +++++
src/domain/__tests__/derive-student-home-view-model.test.ts   |  5 +
src/domain/__tests__/next-step.test.ts                        | 25 ++++
```

Production code (src/domain, src/components, src/lib, src/app non-test): **0 lines changed**.

---

## Relationship to Parent Change

This change is a direct follow-up to `fix-student-home-diagnostic-coupling`
(archived 2026-06-15, merge commit `e3fcb1d`). The parent verify report issued
2 implementable SUGGESTIONS that this change closes:

| SUGGESTION from parent | Action taken |
|------------------------|--------------|
| Add a regression test for `deriveHomeNextStep` directly in `next-step.test.ts` | Done: new `describe("deriveHomeNextStep — effectiveDiagnosticResult")` block with 2 tests |
| Strengthen test assertions for the 3 partial-coverage scenarios | Done: 3 tests in `derive-student-home-view-model.test.ts` now have explicit sub-assertion lists matching the spec |

---

## Archive Note

Tasks artifact (`tasks.md`) has unchecked checkboxes in Phase 6 (tasks 6.1–6.4)
— stale state from the sub-agent artifact that was not updated during apply.
All 16/16 tasks confirmed complete via `apply-progress` Engram observation and
`verify-report` (1864/1864 tests, typecheck, build all green, 6/6 scenarios
compliant). Exceptional reconciliation documented per archive policy, matching
the pattern established in the parent change's archive report.

---

## Next

Ready for orchestrator to merge `fix/strengthen-diagnostic-coupling-tests` to
`main` and push per the project's multi-PC branch policy.
