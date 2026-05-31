# Pedagogical Feedback Specification

## Purpose

Defines feedback generated from evaluation results and error tags.

## Requirements

### Requirement: Three Feedback Types

The system SHALL generate learner-facing feedback of type `corrective`, `conceptual`, or `procedural` from correctness plus an optional error tag. Feedback MUST be deterministic and framework-free.

#### Scenario: tagged error receives targeted feedback

- GIVEN evaluation returns an incorrect result with `u1_orden_operaciones`
- WHEN feedback is generated
- THEN the response includes corrective guidance and a procedural next step

#### Scenario: untagged error remains useful

- GIVEN evaluation returns incorrect with no error tag
- WHEN feedback is generated
- THEN the response gives a general retry strategy without inventing a misconception

### Requirement: Feedback Boundaries

Feedback MUST guide recovery without exposing the full final answer unless the exercise explicitly allows solution reveal after completion.

#### Scenario: first wrong attempt preserves learning

- GIVEN a student submits a wrong answer during guided practice
- WHEN feedback is displayed
- THEN it explains what to review
- AND it does not reveal the final answer

### Requirement: Pilot Error Tag Support

The feedback engine SHALL support at least two error tags for each pilot skill.

#### Scenario: pilot tags are covered

- GIVEN the Unit 1 pilot tags are loaded
- WHEN feedback mappings are validated
- THEN each pilot skill has at least two mapped tags
