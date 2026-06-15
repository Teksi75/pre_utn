# Delta for teacher-digital-home

Test-only follow-up to `fix-student-home-diagnostic-coupling` (b9ef7da). No production code, dependencies, or copy change. This delta locks the contract by (a) adding explicit sub-assertion lists to 3 partially-covered scenarios, and (b) adding direct regression coverage for `deriveHomeNextStep`'s 4th `effectiveDiagnosticResult` parameter.

## MODIFIED Requirements

### Requirement: Diagnostic counts as first interaction

The student home view-model MUST treat a completed diagnostic as evidence the student has started. Concretely:

- When `loadDiagnosticResult()` returns a result with a non-null `completedAt`, the mission CTA MUST NOT point to `/diagnostic` with the label "Hacer diagnóstico inicial"; it MUST point to the next learning step from `nextStep`.
- `studentSituation.diagnosticCompletedAt` MUST reflect the stored result's `completedAt`, and MUST NOT be `null` when a stored result exists.
- The hero subtitle and the "TU SITUACIÓN → Diagnóstico" row MUST be derived from the `diagnosticResult` field of `StudentHomeInput` (populated by `loadDiagnosticResult()` at the wiring layer), NOT from `progress.diagnosticResult`.
(Previously: 3 of 4 scenarios in the regression test asserted only the easiest sub-condition; the other THEN clauses had no explicit `expect(...)` call, leaving the contract undertested.)

#### Scenario: completed diagnostic with zero attempts routes the mission CTA to next step

- GIVEN a `StudentHomeInput` with `progress.attempts = []` and a `diagnosticResult` whose `completedAt` is a non-null ISO timestamp
- WHEN the home view-model is derived
- THEN `mission.ctaLabel` is NOT "Hacer diagnóstico inicial"
- AND `mission.ctaHref` is NOT `/diagnostic`
- AND `mission.ctaHref` equals the `href` of the `nextStep` input

**Required regression-test assertions (additive to the existing negative checks):**
- `expect(vm.mission.ctaHref).toBe(nextStep.href)` — locks the positive coupling between the mission CTA and the `nextStep` input.

#### Scenario: completed diagnostic populates diagnosticCompletedAt from the stored result

- GIVEN a `StudentHomeInput` with a `diagnosticResult` whose `completedAt` is `2026-06-12T10:00:00.000Z`
- WHEN the home view-model is derived
- THEN `studentSituation.diagnosticCompletedAt` equals `2026-06-12T10:00:00.000Z` (not `null`)

**Required regression-test assertions (additive consistency check):**
- `expect(vm.mission.ctaHref).not.toBe("/diagnostic")` — confirms the CTA moved off the diagnostic route when the timestamp is populated.

#### Scenario: no completed diagnostic still produces the diagnostic CTA

- GIVEN a `StudentHomeInput` with `progress.attempts = []` and `diagnosticResult = null`
- WHEN the home view-model is derived
- THEN `mission.ctaLabel` is "Hacer diagnóstico inicial"
- AND `mission.ctaHref` is `/diagnostic`
- AND `studentSituation.diagnosticCompletedAt` is `null`

**Required regression-test assertions (the two missing sub-assertions):**
- `expect(vm.mission.ctaLabel).toBe("Hacer diagnóstico inicial")` — exact label, not just a negative check.
- `expect(vm.studentSituation.diagnosticCompletedAt).toBeNull()` — timestamp reflects the null input.

#### Scenario: stored diagnostic wins over the progress.diagnosticResult fallback

- GIVEN a `StudentHomeInput` whose `diagnosticResult` field has `completedAt = 2026-06-12T10:00:00.000Z` and whose `progress.diagnosticResult` is `null`
- WHEN the home view-model is derived
- THEN `studentSituation.diagnosticCompletedAt` equals `2026-06-12T10:00:00.000Z`

## ADDED Requirements

### Requirement: deriveHomeNextStep respects effective diagnostic state

`deriveHomeNextStep` MUST use the optional 4th argument `effectiveDiagnosticResult` to override `progress.diagnosticResult` when deciding between the initial diagnostic CTA and the practice step. The `kind` enum on the returned `HomeNextStep` is `"diagnostic" | "practice" | "continue-unit"`. When the 4th argument is omitted, passed as `undefined`, or passed as `null`, the function MUST fall back to `progress.diagnosticResult` (locks the pre-existing default).

#### Scenario: non-null effective diagnostic with zero attempts yields practice kind

- GIVEN a `PracticeProgress` with `attempts = []` and `progress.diagnosticResult = null`
- AND a non-null `effectiveDiagnosticResult` whose `completedAt` is a non-null ISO timestamp
- WHEN `deriveHomeNextStep(progress, readySkills, readySkills, effectiveDiagnosticResult)` is called
- THEN `nextStep.kind` is `"practice"` (NOT `"diagnostic"`)

#### Scenario: null effective diagnostic with zero attempts yields diagnostic kind

- GIVEN a `PracticeProgress` with `attempts = []` and `progress.diagnosticResult = null`
- AND `effectiveDiagnosticResult` is `null` (or omitted) as the 4th argument
- WHEN `deriveHomeNextStep(progress, readySkills, readySkills, null)` is called
- THEN `nextStep.kind` is `"diagnostic"`

## Out of Scope

- Production source files (`src/domain/next-step/index.ts`, `src/domain/student-home/`, any other `src/` non-test file) MUST NOT be modified.
- No new dependencies, no copy change, no spec scenario removed.
- The 3rd SUGGESTION from the `fix-student-home-diagnostic-coupling` verify report (22% forecast over-accuracy) is a meta-observation about the SDD process itself, not a code change.
- Behavior of `deriveHomeNextStep` with non-empty `attempts` (the happy path with practice data) is already covered by existing tests in `next-step.test.ts` and is not in scope for additional direct regression coverage.
