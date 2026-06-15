# Delta for teacher-digital-home

Fixes the storage-split coupling between the home dashboard and the diagnostic result. The home reads only `pre-utn.practice.v1` (via `loadProgress()`); the diagnostic persists in `pre-utn.diagnostic.v1`. `loadDiagnosticResult()` exists but is never called from production, so the mission CTA keeps pointing at `/diagnostic` after completion. This delta treats a completed diagnostic as the student's first interaction.

## ADDED Requirements

### Requirement: Diagnostic counts as first interaction

The student home view-model MUST treat a completed diagnostic as evidence the student has started. Concretely:

- When `loadDiagnosticResult()` returns a result with a non-null `completedAt`, the mission CTA MUST NOT point to `/diagnostic` with the label "Hacer diagnóstico inicial"; it MUST point to the next learning step from `nextStep`.
- `studentSituation.diagnosticCompletedAt` MUST reflect the stored result's `completedAt`, and MUST NOT be `null` when a stored result exists.
- The hero subtitle and the "TU SITUACIÓN → Diagnóstico" row MUST be derived from the `diagnosticResult` field of `StudentHomeInput` (populated by `loadDiagnosticResult()` at the wiring layer), NOT from `progress.diagnosticResult`.

#### Scenario: completed diagnostic with zero attempts routes the mission CTA to next step

- GIVEN a `StudentHomeInput` with `progress.attempts = []` and a `diagnosticResult` whose `completedAt` is a non-null ISO timestamp
- WHEN the home view-model is derived
- THEN `mission.ctaLabel` is NOT "Hacer diagnóstico inicial"
- AND `mission.ctaHref` is NOT `/diagnostic`
- AND `mission.ctaHref` equals the `href` of the `nextStep` input

#### Scenario: completed diagnostic populates diagnosticCompletedAt from the stored result

- GIVEN a `StudentHomeInput` with a `diagnosticResult` whose `completedAt` is `2026-06-12T10:00:00.000Z`
- WHEN the home view-model is derived
- THEN `studentSituation.diagnosticCompletedAt` equals `2026-06-12T10:00:00.000Z` (not `null`)

#### Scenario: no completed diagnostic still produces the diagnostic CTA

- GIVEN a `StudentHomeInput` with `progress.attempts = []` and `diagnosticResult = null`
- WHEN the home view-model is derived
- THEN `mission.ctaLabel` is "Hacer diagnóstico inicial"
- AND `mission.ctaHref` is `/diagnostic`
- AND `studentSituation.diagnosticCompletedAt` is `null`

#### Scenario: stored diagnostic wins over the progress.diagnosticResult fallback

- GIVEN a `StudentHomeInput` whose `diagnosticResult` field has `completedAt = 2026-06-12T10:00:00.000Z` and whose `progress.diagnosticResult` is `null`
- WHEN the home view-model is derived
- THEN `studentSituation.diagnosticCompletedAt` equals `2026-06-12T10:00:00.000Z`

## MODIFIED Requirements

### Requirement: No Invented Evidence

The system MUST NOT fabricate progress data. If the active student has neither a stored diagnostic result nor any practice attempts, the view-model MUST reflect zero readiness, no mastery gaps, and a diagnostic CTA. A completed diagnostic counts as the student's first interaction and MUST suppress the diagnostic CTA even when `PracticeProgress.attempts` is empty.
(Previously: only checked `attempts.length === 0`; a completed diagnostic was not a valid first interaction, so the diagnostic CTA kept firing after completion.)

#### Scenario: Empty progress with no completed diagnostic produces deterministic defaults

- GIVEN a `StudentHomeInput` with `progress.attempts = []` and `diagnosticResult = null`
- WHEN `deriveStudentHomeViewModel` is called
- THEN `readinessPercent` MUST be 0
- AND `masteryGaps` MUST be empty
- AND `suggestedActions` MUST recommend diagnostic

#### Scenario: Empty progress with a completed diagnostic suppresses the diagnostic CTA

- GIVEN a `StudentHomeInput` with `progress.attempts = []` and a `diagnosticResult` whose `completedAt` is a non-null ISO timestamp
- WHEN `deriveStudentHomeViewModel` is called
- THEN `readinessPercent` MUST be 0
- AND `masteryGaps` MUST be empty
- AND `suggestedActions` MUST NOT recommend `/diagnostic` as a step
- AND `mission.ctaLabel` MUST NOT be "Hacer diagnóstico inicial"
- AND `mission.ctaHref` MUST NOT be `/diagnostic`

#### Scenario: studentSituation reflects the stored diagnostic completion timestamp

- GIVEN a `StudentHomeInput` with a `diagnosticResult` whose `completedAt` is `2026-06-12T10:00:00.000Z`
- WHEN `deriveStudentHomeViewModel` is called
- THEN `studentSituation.diagnosticCompletedAt` MUST equal `2026-06-12T10:00:00.000Z`

## Out of Scope

- Consolidating `pre-utn.diagnostic.v1` and `pre-utn.practice.v1` into one key, or double-writing for migration.
- Changing the diagnostic page UI, flow, or copy.
- Touching storage adapters beyond reading `loadDiagnosticResult()`.
- Copy that violates Ingenium brand voice (no "profe digital", "plan personalizado", or any persona that pretends the app teaches autonomously).
- Student switcher, identification gate, or other home chrome (covered by `student-identity-local-persistence-bridge`).
