# Delta for Guided Practice

## ADDED Requirements

### Requirement: Previous Exercise Snapshot Capture

The system MUST capture an in-memory snapshot containing the exercise, submitted answer, evaluation result, and available feedback each time a student submits an answer. The snapshot MUST be session-scoped and overwritten on each new submission. The snapshot MUST NOT be persisted to domain models, localStorage, or any external store.

#### Scenario: snapshot captured on answer submission

- GIVEN the student is viewing an exercise in the practice flow
- WHEN the student submits an answer
- THEN the system stores the exercise, submitted answer, correctness result, and feedback in a session-scoped snapshot before transitioning to the next exercise

#### Scenario: snapshot overwritten on subsequent submission

- GIVEN a previous snapshot exists from exercise N-1
- WHEN the student submits an answer for exercise N
- THEN the snapshot is replaced with exercise N data; exercise N-1 data is no longer accessible

#### Scenario: snapshot lost on page refresh

- GIVEN a previous snapshot exists
- WHEN the student refreshes the page
- THEN the snapshot is cleared and the "Ver anterior" control is not available

### Requirement: View Previous Exercise Control

The system SHALL display a `Ver anterior` button when a previous submitted exercise snapshot exists. The button MUST NOT appear on the first exercise of a session or when no snapshot is available.

#### Scenario: button appears after first submission

- GIVEN the student has submitted at least one answer and advanced to the next exercise
- WHEN the current exercise view renders
- THEN the `Ver anterior` button is visible

#### Scenario: button hidden on first exercise

- GIVEN the student is on the first exercise of a practice session
- WHEN the exercise view renders
- THEN the `Ver anterior` button is not displayed

### Requirement: Read-Only Previous Exercise Display

When viewing the previous exercise, the system MUST render the exercise prompt, the student's submitted answer, the correctness result (correct/incorrect), and any available feedback. All content MUST be read-only. The student MUST NOT be able to modify the submitted answer or trigger a new evaluation from this view.

#### Scenario: previous view shows full submission context

- GIVEN the student taps `Ver anterior`
- WHEN the previous exercise view renders
- THEN the exercise prompt, submitted answer, correct/incorrect indicator, and feedback are displayed in read-only mode

#### Scenario: multiple-choice answer maps to displayed option

- GIVEN the previous exercise was multiple-choice with shuffled options
- WHEN the previous view renders the submitted answer
- THEN the answer is displayed with its matching option value/label, correctly mapped despite shuffle

#### Scenario: no submit controls in previous view

- GIVEN the student is viewing the previous exercise
- WHEN the view is rendered
- THEN no submit button, answer input, or answer modification controls are present

### Requirement: Return to Current Exercise

The system SHALL display a `Volver al ejercicio actual` button when viewing the previous exercise. Activating it MUST return the student to the current exercise without losing the current exercise state or progress.

#### Scenario: return preserves current exercise state

- GIVEN the student is viewing the previous exercise
- WHEN the student taps `Volver al ejercicio actual`
- THEN the current exercise is displayed with its input state intact and the snapshot remains available for future review

### Requirement: Pedagogical Value of Previous Review

The previous exercise view MUST support student reflection by showing the submitted answer alongside the correctness result and feedback. This enables the student to compare their reasoning with the corrective guidance before proceeding. The teacher benefit is indirect: students who review feedback are more likely to correct misconceptions in subsequent exercises.

#### Scenario: student reviews incorrect answer with feedback

- GIVEN the student answered the previous exercise incorrectly and feedback with an error tag is available
- WHEN the student views the previous exercise
- THEN the student sees their submitted answer, the incorrect indicator, and the tagged feedback to support self-correction
