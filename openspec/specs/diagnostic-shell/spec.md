# Diagnostic Shell Specification

## Purpose

Defines a short mathematics-only diagnostic that estimates weak skills and points the student to practice.

## Requirements

### Requirement: Balanced Diagnostic Selection

The system SHALL select a short diagnostic set balanced across mathematics skills and units. Selection MUST be deterministic for the same catalog and request.

#### Scenario: diagnostic covers multiple units

- GIVEN enough eligible exercises across units
- WHEN a diagnostic set is requested
- THEN it includes exercises from multiple units without over-selecting one unit

#### Scenario: insufficient catalog is reported

- GIVEN too few eligible exercises for balanced selection
- WHEN a diagnostic set is requested
- THEN the system reports the missing coverage instead of producing a biased set

### Requirement: Accuracy-Based Skill Estimation

The system SHALL estimate skill strength from diagnostic attempts using accuracy per practiced skill. The estimate SHOULD be marked provisional.

#### Scenario: weaker skill is identified

- GIVEN attempts for two skills where one has lower accuracy
- WHEN diagnostic results are calculated
- THEN the lower-accuracy skill is ranked as weaker

### Requirement: Weak-Area Suggestions

The system SHALL suggest guided-practice targets for the weakest skills and include any observed error tags.

#### Scenario: suggestions link diagnosis to practice

- GIVEN diagnostic results identify two weak skills
- WHEN suggestions are shown
- THEN the student receives practice targets for those skills with tagged misconceptions when available

### Requirement: Diagnostic Answer Type Reliability

Exercises selected for diagnostic assessment MUST use answer types that produce reliable skill evidence. An exercise whose expected answer is ambiguous under free-text matching (multi-value sets, variable assignments, order-dependent notation) MUST NOT be included in the diagnostic set unless it has been converted to `multiple-choice` or a structured type with a deterministic evaluator.

#### Scenario: diagnostic excludes ambiguous free-text exercises

- GIVEN an exercise with type `numerical` and expected answer `x = -2, x = 2`
- WHEN the diagnostic selection algorithm considers it
- THEN the exercise is excluded from the diagnostic set

#### Scenario: diagnostic includes only reliably-evaluable exercises

- GIVEN the catalog after type-answer corrections
- WHEN a diagnostic set is requested
- THEN every exercise in the set has a type whose evaluator can deterministically judge correctness

### Requirement: Diagnostic Evidence Integrity

The diagnostic MUST NOT produce skill estimates based on answers that were marked incorrect due to evaluator configuration errors or type-answer mismatches. If an exercise cannot be reliably evaluated, it MUST be excluded rather than counted as an incorrect attempt.

#### Scenario: configuration error does not corrupt skill estimate

- GIVEN an exercise that triggers an evaluator configuration error
- WHEN diagnostic results are calculated
- THEN that exercise is excluded from accuracy calculations and the skill estimate is based only on reliably-evaluated attempts

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | Diagnostic results and study plans are now personal — the alumno sees *their* weak areas, not a shared global set. Switching profiles shows a different study plan. |
| Docente | No direct effect. Future teacher insight (which alumno is weak on which skill) becomes possible because diagnostics are now per-profile. |

## Added by student-identity-local-persistence-bridge

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
