# Delta for Diagnostic Shell

## ADDED Requirements

### Requirement: Active Profile Gated Diagnostic Recording

The system MUST NOT record a new `DiagnosticResult` or `StudyPlan` unless an active local student profile is present. `saveDiagnosticResult` and `saveStudyPlan` MUST be no-ops (no write to persistence) and MUST signal a blocked state to the caller when `recoverActiveProfile()` returns `null`. The Diagnostic page MUST surface the identification card from the `student-local-identity` spec when the action is blocked, so the user can fix the precondition and re-take the diagnostic.

#### Scenario: recording with an active profile

- GIVEN an active local profile with `studentId: "local-abc"`
- WHEN the student finishes the diagnostic
- THEN a `DiagnosticResult` is written under the active student AND the derived `StudyPlan` is written under the same student

#### Scenario: recording without an active profile is blocked

- GIVEN `recoverActiveProfile()` returns `null`
- WHEN the diagnostic flow tries to persist a result
- THEN no `DiagnosticResult` is written to storage AND no `StudyPlan` is written to storage AND the page shows the identification card

#### Scenario: weak-area suggestions stay scoped to the active student

- GIVEN the diagnostic derives `StudyPlan` from `loadProgress()` plus the new result
- WHEN the suggestions are computed
- THEN the `loadProgress()` call returns the active student's slice, so the suggestions belong to that student

### Requirement: Per-Student Diagnostic and Study-Plan Storage

The `DiagnosticResult` and `StudyPlan` adapters MUST internally key by `studentId` using the central map shape (`{ students: Record<studentId, T>; activeStudentId: string | null }`). The existing public function names (`loadDiagnosticResult`, `saveDiagnosticResult`, `loadStudyPlan`, `saveStudyPlan`) MUST be preserved and MUST return data for the active student only.

#### Scenario: load returns the active student's slice

- GIVEN a stored central map with two students
- WHEN `loadDiagnosticResult` is called
- THEN it returns the active student's `DiagnosticResult` and never the other student's

#### Scenario: switching student changes the visible study plan

- GIVEN a user with two profiles, each with a different completed diagnostic
- WHEN the user switches the active profile on Home
- THEN a subsequent navigation to the diagnostic results page shows the active profile's study plan

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | Diagnostic results and study plans are now personal — the alumno sees *their* weak areas, not a shared global set. Switching profiles shows a different study plan. |
| Docente | No direct effect. Future teacher insight (which alumno is weak on which skill) becomes possible because diagnostics are now per-profile. |
