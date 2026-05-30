# Math Exercise Model Specification

## Purpose

Defines the exercise model used by the mathematics catalog and evaluator.

## Requirements

### Requirement: Exercise Identity and References

The system SHALL define an Exercise with ID, skill reference, type, difficulty, prompt, expected answer, and error tags. Exercise IDs MUST follow `ex.u{1-6}.{skill_slug}.{index}`.

#### Scenario: valid exercise is accepted

- GIVEN an exercise referencing an existing skill and valid error tags
- WHEN the exercise is validated
- THEN validation succeeds with the normalized exercise

#### Scenario: invalid references are rejected

- GIVEN an exercise references an unknown skill or error tag
- WHEN the exercise is validated
- THEN validation fails with the invalid reference

### Requirement: Exercise Type and Difficulty

The system MUST support exactly these exercise types: `multiple-choice`, `true-false`, `numerical`, `symbolic`, `fill-blank`, `matching`, `ordering`, `free-response`, and `graphical`. Difficulty MUST be an integer from 1 to 5.

#### Scenario: supported types are accepted

- GIVEN one valid exercise for each supported type
- WHEN each exercise is validated
- THEN all validations succeed

#### Scenario: unsupported type or difficulty fails

- GIVEN an exercise with type `essay` or difficulty 0 or 6
- WHEN it is validated
- THEN validation fails with a type or difficulty error

### Requirement: Prompt and Answer Contract

Each exercise MUST include a student-facing prompt and an expected answer suitable for its type. Content MUST be original, not copied verbatim from canonical UTN material.

#### Scenario: missing evaluable data is rejected

- GIVEN an exercise without prompt or expected answer
- WHEN it is validated
- THEN validation fails listing the missing fields

#### Scenario: pedagogically transformed content is accepted

- GIVEN a prompt that practices the same skill pattern with changed wording and values
- WHEN the exercise is reviewed for catalog inclusion
- THEN it is allowed as transformed content
