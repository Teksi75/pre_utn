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
