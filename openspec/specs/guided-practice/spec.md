# Guided Practice Specification

## Purpose

Defines the first student practice loop: choose math focus, answer an exercise, and receive useful tagged feedback.

## Requirements

### Requirement: Practice Focus Selection

The system SHALL let a student choose a mathematics unit and skill from available catalog data. The flow MUST exclude Física.

#### Scenario: skill list follows selected unit

- GIVEN mathematics skills exist for unit 2
- WHEN the student selects unit 2
- THEN only unit 2 skills are offered for practice

### Requirement: Exercise Attempt Flow

The system SHALL display one eligible exercise for the chosen skill and accept a student answer without exposing the expected answer before evaluation.

#### Scenario: student submits answer

- GIVEN the student selected a skill with available exercises
- WHEN an exercise is shown and the student submits an answer
- THEN the attempt is evaluated and the result is displayed

#### Scenario: no exercise is available

- GIVEN the selected skill has no eligible exercises
- WHEN practice starts
- THEN the system explains that no practice item is available for that skill

### Requirement: Tagged Pedagogical Feedback

The system SHALL show correctness and, when present, error-tag feedback understandable by learners and useful to teachers. Feedback MAY reference canonical explanations when useful, but SHOULD adapt them to the learner's current answer and next step.

#### Scenario: tagged incorrect answer receives guidance

- GIVEN evaluation returns an error tag
- WHEN feedback is displayed
- THEN the student sees the misconception category and a corrective hint, not the final answer

### Requirement: Multiple-Choice Option Shuffling

When presenting a `multiple-choice` exercise during practice, the system MUST randomize the display order of options at runtime. The shuffling MUST preserve the mapping between each option's value and its correctness. The correct answer MUST NOT be positionally biased across repeated presentations.

#### Scenario: options are displayed in shuffled order

- GIVEN a multiple-choice exercise with options `["A", "B", "C", "D"]` where "B" is correct
- WHEN the practice view renders the exercise
- THEN the displayed order MAY differ from the catalog order, and the correct option is still identifiable by value

#### Scenario: shuffling preserves correctness mapping

- GIVEN a shuffled option list
- WHEN the student selects the option whose value matches the expected answer
- THEN the evaluation result is correct regardless of that option's display position

### Requirement: Deterministic Shuffle for Testing

The shuffling mechanism MUST accept an optional seed or deterministic random source so that tests can assert on specific orderings without relying on `Math.random()`. In production, the seed SHOULD be derived from a per-student or per-session value to ensure consistent display within a session.

#### Scenario: seeded shuffle produces reproducible order

- GIVEN a multiple-choice exercise and a fixed seed value
- WHEN options are shuffled with that seed
- THEN the resulting order is identical across repeated calls with the same seed

#### Scenario: different seeds produce different orders

- GIVEN a multiple-choice exercise with 4+ options
- WHEN options are shuffled with two different seed values
- THEN at least one ordering differs (probabilistically guaranteed for sufficient options)

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | Practice attempts now belong to the alumno's profile. Switching profiles shows a different history. The alumno is forced into the cockpit identification card only until a profile is created. |
| Docente | No direct effect. Future teacher insight (cross-student comparison) becomes possible because attempts are no longer anonymous. |

## Added by student-identity-local-persistence-bridge

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
