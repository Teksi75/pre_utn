# Delta for Guided Practice

## ADDED Requirements

### Requirement: Active Profile Gated Attempt Recording

The system MUST NOT record a new `PracticeAttempt` unless an active local student profile is present. The `addAttempt` entry point MUST be a no-op (no write to persistence, no addition to the in-memory progress slice) and MUST signal a blocked state to the caller whenever `recoverActiveProfile()` returns `null`. The Practice page MUST surface the identification card from the `student-local-identity` spec when the action is blocked, so the user can fix the precondition and re-submit.

#### Scenario: recording with an active profile

- GIVEN an active local profile with `studentId: "local-abc"`
- WHEN the student submits an answer
- THEN a `PracticeAttempt` is appended to the active student's progress AND the attempt's `studentId` matches the active profile (or the storage key scopes it to the active student)

#### Scenario: recording without an active profile is blocked

- GIVEN `recoverActiveProfile()` returns `null`
- WHEN the student submits an answer
- THEN no `PracticeAttempt` is written to storage AND the Practice page shows the identification card AND the caller's blocked signal is truthy

#### Scenario: the gate is the precondition, not the UI

- GIVEN the Practice page code path that calls `addAttempt`
- WHEN inspected
- THEN the function does NOT silently fall back to a global or default id — it MUST refuse to record

### Requirement: Per-Student Progress Loading

`loadProgress()` (the same public function name used today) MUST return the `PracticeProgress` slice for the active local student only. The Practice page MUST initialize its in-memory state from this per-student load. The function's public signature MUST remain unchanged so call sites, hooks, and the existing 1 600+ test cases keep working.

#### Scenario: load returns the active student's slice

- GIVEN a stored central map with two students A and B
- WHEN the Practice page calls `loadProgress()`
- THEN it receives the `PracticeProgress` of the active student only

#### Scenario: load is unchanged from the call site's perspective

- GIVEN the existing call sites in `usePracticeFlow` and the diagnostic study-plan derivation
- WHEN compared to the new adapter
- THEN the function name and return type are identical (`PracticeProgress`)

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | Practice attempts now belong to the alumno's profile. Switching profiles shows a different history. The alumno is forced into the cockpit identification card only until a profile is created. |
| Docente | No direct effect. Future teacher insight (cross-student comparison) becomes possible because attempts are no longer anonymous. |
