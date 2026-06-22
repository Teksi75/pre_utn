# Delta for student-local-identity

## MODIFIED Requirements

### Requirement: Anonymous Attempts Forbidden

The system MUST NOT record a new `PracticeAttempt`, `ChallengeAttempt`, `DiagnosticResult`, or `StudyPlan` when no active profile exists. The gate is a precondition, not a UI choice: record functions SHALL NOT write to storage and SHALL signal a blocked state to the caller — no silent swallow. Pedagogical impact: every persisted learning signal belongs to an identifiable local alumno, preventing mixed evidence on shared devices.
(Previously: anonymous write blocking covered practice attempts, diagnostic results, and study plans, but not challenge attempts.)

#### Scenario: addAttempt without active profile writes nothing

- GIVEN no active profile
- WHEN the user submits a practice answer
- THEN no `PracticeAttempt` is written to storage AND the UI is informed the action was blocked (gating UI is shown)

#### Scenario: diagnostic save without active profile writes nothing

- GIVEN no active profile
- WHEN the diagnostic tries to persist a result
- THEN no `DiagnosticResult` is written to storage

#### Scenario: challenge attempt without active profile writes nothing

- GIVEN no active profile
- WHEN the user submits a challenge answer
- THEN no `ChallengeAttempt` is written to storage
- AND the caller receives an explicit blocked result compatible with the StudentGate flow

## ADDED Requirements

### Requirement: Challenge Progress Uses Active Profile

Challenge progress reads and writes MUST use the active local `studentId`. When multiple local profiles exist, advanced readiness MUST be isolated by active profile. Legacy anonymous challenge data MAY be migrated or exposed through a safe default strategy, but it MUST NOT contaminate another active student's readiness.

#### Scenario: active profile reads only its challenge progress

- GIVEN two local profiles have challenge attempts for the same skill
- WHEN challenge progress is loaded with student B active
- THEN only student B's challenge attempts are returned

#### Scenario: legacy anonymous data does not contaminate a different student

- GIVEN legacy anonymous challenge attempts exist before profile-scoped storage
- WHEN a different active student loads advanced readiness
- THEN that student's readiness excludes the anonymous attempts unless safely assigned to that student
