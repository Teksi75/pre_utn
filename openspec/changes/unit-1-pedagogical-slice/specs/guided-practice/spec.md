# Delta for Guided Practice

## MODIFIED Requirements

### Requirement: Practice Focus Selection

The system SHALL let a student choose a mathematics unit and skill from available catalog data. The flow MUST exclude Física and SHOULD mark a skill as ready only when theory, worked examples, exercises, feedback, and evaluation are all present.
(Previously: skill selection only required available catalog data and Física exclusion.)

#### Scenario: skill list follows selected unit

- GIVEN mathematics skills exist for unit 2
- WHEN the student selects unit 2
- THEN only unit 2 skills are offered for practice

#### Scenario: incomplete skill is not ready

- GIVEN `mat.u1.intervalos` has exercises but no worked example
- WHEN the practice focus list is built
- THEN the skill is marked unavailable or incomplete
- AND the missing component is named

### Requirement: Exercise Attempt Flow

The system SHALL let a ready pilot skill be practiced after theory and worked examples are available, while allowing theory to be opened independently as a learning entry point. Practice MUST accept a student answer without exposing the expected answer before evaluation.
(Previously: practice forced theory and example as the only route to access theory.)

#### Scenario: student completes guided sequence

- GIVEN the student selected a ready pilot skill
- WHEN theory and one worked example are viewed and an answer is submitted
- THEN the attempt is evaluated and feedback is displayed

#### Scenario: theory can be studied before practice

- GIVEN the student selected a ready pilot skill
- WHEN the student opens learning mode
- THEN theory is displayed before any exercise input is required

#### Scenario: no exercise is available

- GIVEN the selected skill has no eligible exercises
- WHEN practice starts
- THEN the system explains that no practice item is available for that skill

### Requirement: Interaction-Specific Practice Rendering

Practice UI MUST render the answer control required by each exercise interaction type, not a single free-text input for every exercise.
(Previously: all exercises used one generic answer input.)

#### Scenario: multiple-choice options are selectable

- GIVEN an exercise declares a multiple-choice interaction
- WHEN the exercise is rendered
- THEN all answer options are visible and selectable
- AND the student submits by selecting an option

#### Scenario: interval infinity does not require typing

- GIVEN an interval translation asks for an answer such as `x ≥ -1`
- WHEN the exercise is rendered
- THEN the student answers through multiple choice or an interval selector
- AND typing the infinity symbol is not required

### Requirement: Tagged Pedagogical Feedback

The system SHALL show correctness and, when present, error-tag feedback understandable by learners and useful to teachers. Feedback MAY reuse or adapt canonical explanations when they help the learner understand the current error and next step.
(Previously: feedback was prohibited from copying canonical material.)

#### Scenario: tagged incorrect answer receives guidance

- GIVEN evaluation returns an error tag
- WHEN feedback is displayed
- THEN the student sees the misconception category and a corrective hint, not the final answer
