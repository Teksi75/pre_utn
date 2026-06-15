# Proposal: Fix Student Home Diagnostic Coupling

## Intent

The home dashboard has two coupled bugs from a storage split: the home reads only `pre-utn.practice.v1` (via `loadProgress()`), but diagnostic results persist in `pre-utn.diagnostic.v1` (via `saveDiagnosticResult()`). `loadDiagnosticResult()` exists and is tested but never called from production. This causes: (1) the mission CTA keeps showing "Hacer diagnóstico inicial" after completion, and (2) "Tu situación" always shows "Sin diagnóstico".

## Scope

### In Scope
- Wire `loadDiagnosticResult()` into `HomeNextStepClient.tsx` so the home reads the real diagnostic source.
- Fix `buildMission()` selector to treat a completed diagnostic as evidence the student has started.
- Add TDD tests that claven the new contract (CTA behavior with diagnostic completed but no attempts).
- Spec delta for `teacher-digital-home`: update "No Invented Evidence" requirement to reflect diagnostic as valid first interaction.

### Out of Scope
- Consolidating `pre-utn.practice.v1` and `pre-utn.diagnostic.v1` into one storage key.
- Double-writing diagnostic results to both keys.
- Changing the diagnostic page itself.
- Touching storage adapters beyond reading `loadDiagnosticResult()`.
- Student switcher, gate, or other home chrome.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `teacher-digital-home`: the "No Invented Evidence" requirement must recognize a completed diagnostic as the student's first interaction, so the diagnostic CTA only appears when neither diagnostic nor attempts exist.

## Approach

Two minimal, TDD-tested changes — no new abstractions, no storage churn:

1. **Wiring fix** — `HomeNextStepClient.tsx:58-66`: call `loadDiagnosticResult()` from `src/lib/diagnostic-storage.ts` and pass it as the `diagnosticResult` field of `StudentHomeInput`. Keep the `progress.diagnosticResult` fallback for legacy migration.

2. **Selector fix** — `buildMission(progress, nextStep, diagnosticResult)` in `src/domain/student-home/index.ts:176-193`: change condition from `progress.attempts.length === 0` to `progress.attempts.length === 0 && !diagnosticResult?.completedAt`. Pass `diagnosticResult` from existing `StudentHomeInput`.

3. **TDD** — new tests in `derive-student-home-view-model.test.ts`:
   - Mission CTA does NOT point to `/diagnostic` when diagnostic is completed and attempts is empty.
   - Mission CTA points to `/diagnostic` when neither diagnostic nor attempts exist.
   - `studentSituation.diagnosticCompletedAt` reflects `loadDiagnosticResult()` source.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/home/HomeNextStepClient.tsx` | Modified | Call `loadDiagnosticResult()`, pass result to `StudentHomeInput`. |
| `src/domain/student-home/index.ts` | Modified | `buildMission()` accepts `diagnosticResult`, condition includes diagnostic check. |
| `src/domain/__tests__/derive-student-home-view-model.test.ts` | Modified | New tests for CTA behavior; update existing test at line 196-203. |
| `openspec/specs/teacher-digital-home/spec.md` | Modified | Delta: "No Invented Evidence" requirement update. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Legacy `progress.diagnosticResult` path breaks | Low | Keep fallback: `diagnosticResult ?? progress.diagnosticResult ?? null`. |
| Test at line 196-203 pins wrong contract | Low | Explicitly update it in apply phase; it's a known test update. |

## Rollback Plan

Revert the wiring and selector commits. No data migration or external rollback needed — both storage keys remain intact and unchanged.

## Dependencies

- `loadDiagnosticResult()` from `src/lib/diagnostic-storage.ts` (already exists and tested).

## Success Criteria

- [ ] After completing diagnostic, mission CTA shows practice action (not "Hacer diagnóstico inicial").
- [ ] "Tu situación" panel shows diagnostic completion date from `loadDiagnosticResult()`.
- [ ] `pnpm run test`, `pnpm run typecheck`, `pnpm run build` pass.
