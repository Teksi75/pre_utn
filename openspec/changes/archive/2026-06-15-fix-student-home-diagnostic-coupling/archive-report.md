# Archive Report: fix-student-home-diagnostic-coupling

**Change**: `fix-student-home-diagnostic-coupling`
**Archived**: 2026-06-15
**Branch**: `fix/student-home-diagnostic-coupling`
**Mode**: openspec
**Verification verdict**: ✅ **PASS WITH NOTES**

---

## Executive Summary

Home/diagnostic storage split fixed: home now calls `loadDiagnosticResult()` (from `pre-utn.diagnostic.v1`) and passes the result to `deriveStudentHomeViewModel` and `deriveHomeNextStep`, with legacy `progress.diagnosticResult` retained as fallback. `buildMission` selector now accepts `diagnosticResult` so completed diagnostic suppresses the diagnostic CTA. Spec delta applied to canonical `openspec/specs/teacher-digital-home/spec.md` (commit `b9ef7da`).

---

## Apply Commits (4)

| # | SHA | Message |
|---|-----|---------|
| 1 | `ea7efcd` | `test(home): pin new contract for diagnostic-completed students` |
| 2 | `0835396` | `fix(home): wire loadDiagnosticResult() and treat diagnostic as first interaction` |
| 3 | `b9ef7da` | `chore(sdd): apply spec delta for diagnostic-coupling fix` |
| 4 | `0519dcb` | `chore(sdd): register fix-student-home-diagnostic-coupling in STATUS.json` |

---

## Gate Results

| Gate | Result |
|------|--------|
| Build | ✅ 7/7 routes, 5.6s compile + 8.2s tsc |
| Tests | ✅ 1862/1862 (111 test files, 13.50s) |
| Typecheck | ✅ `tsc --noEmit` clean |
| Spec coverage | ✅ 7/7 scenarios have covering tests |
| TDD discipline | ✅ test commit precedes fix commit |
| Workload | ⚠️ 147 lines diff (within 400-line budget at 37%) |

---

## Spec Compliance

7/7 scenarios compliant. 3 of 7 scenarios have partial explicit sub-assertion coverage (tests assert main condition but not all sub-conditions). Implementation is correct and code paths are exercised.

| Requirement | Scenario | Status |
|-------------|----------|--------|
| Diagnostic counts as first interaction (NEW) | completed diagnostic + zero attempts → mission CTA to next step | ✅ |
| Diagnostic counts as first interaction (NEW) | completed diagnostic populates diagnosticCompletedAt | ✅ |
| Diagnostic counts as first interaction (NEW) | no completed diagnostic → diagnostic CTA | ✅ |
| Diagnostic counts as first interaction (NEW) | stored diagnostic wins over progress.diagnosticResult fallback | ✅ |
| No Invented Evidence (MODIFIED) | empty progress + no diagnostic → deterministic defaults | ✅ |
| No Invented Evidence (NEW) | empty progress + completed diagnostic → suppress CTA | ✅ |
| No Invented Evidence (NEW) | studentSituation reflects stored diagnostic completion timestamp | ✅ |

---

## Findings

### WARNING

1. **Design deviation: `deriveHomeNextStep` extended with 4th `effectiveDiagnosticResult` parameter** — not in original design. The original design stated the change should be limited to `HomeNextStepClient` wiring and `buildMission`. However, `deriveHomeNextStep` was returning `kind: "diagnostic"` when `attempts.length === 0` even when a diagnostic was already completed — inconsistent with the new spec. Minimal deviation: 1 line signature change + 1 line in the condition.

2. **Spec coverage partial on sub-assertions (3 of 7 scenarios)** — the 3 new "Diagnostic counts as first interaction" scenarios assert multiple sub-conditions; tests directly assert the main 1–2 sub-conditions; others are implicitly verified via the implementation. Not untested — behavior is exercised.

### SUGGESTION

1. **Add a regression test for `deriveHomeNextStep` directly** in `next-step.test.ts` — the 4th parameter is currently exercised only indirectly through the `input()` helper. A direct test would lock the contract at the function's own test surface.

2. **Workload slightly over forecast** (147 vs 80–120 lines) — well within 400-line review budget (37%). Not blocking.

3. **Strengthen test assertions** for the 3 partial-coverage scenarios to make the spec-to-test mapping 1:1 explicit.

---

## Files Modified (6)

```
openspec/changes/STATUS.json                                  |  5 +
openspec/specs/teacher-digital-home/spec.md                   | 54 ++++++++++++++++++-
src/components/home/HomeNextStepClient.tsx                    |  7 +-
src/domain/__tests__/derive-student-home-view-model.test.ts   | 45 ++++++++++++++--
src/domain/next-step/index.ts                                 | 27 +++++++----
src/domain/student-home/index.ts                              |  9 ++--
```

---

## Archive Note

Tasks artifact (`tasks.md`) has unchecked checkboxes — stale state from sub-agent artifacts that were not updated during apply. All 16/16 tasks confirmed complete via `apply-progress` Engram observation and `verify-report` (1862/1862 tests, typecheck, build all green). Exceptional reconciliation documented per archive policy.

---

## Next

Ready for orchestrator to merge `fix/student-home-diagnostic-coupling` to `main` and push.
