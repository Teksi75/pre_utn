# Math Answer Evaluator Specification

## Purpose

Defines behavioral evaluation of a student's answer against an exercise's expected answer.

## Requirements

### Requirement: Evaluation Result

The system SHALL return an evaluation result with correctness, optional error tag, and optional feedback. The evaluator MUST be deterministic and framework-free.

#### Scenario: correct answer succeeds

- GIVEN an exercise and a student answer equivalent to the expected answer
- WHEN the answer is evaluated
- THEN the result is correct with no error tag

#### Scenario: empty answer is incorrect

- GIVEN any evaluable exercise
- WHEN the student submits an empty answer
- THEN the result is incorrect with no error tag

### Requirement: Type-Specific Matching

The evaluator MUST normalize answers according to exercise type: numeric tolerance for numerical answers, trimmed exact match for symbolic answers, case-insensitive matching for multiple-choice and fill-blank, and Spanish/English boolean aliases for true-false.

#### Scenario: numerical tolerance is accepted

- GIVEN a numerical exercise expecting `3.14`
- WHEN the student answers `3.1405`
- THEN the result is correct

#### Scenario: boolean aliases are accepted

- GIVEN a true-false exercise expecting true
- WHEN the student answers `v` or `verdadero`
- THEN the result is correct

### Requirement: Error Tag Assignment

When an answer is incorrect, the evaluator SHALL return an applicable error tag when the exercise declares one and the answer pattern supports it; otherwise it SHALL return no tag.

#### Scenario: recognizable misconception is tagged

- GIVEN an exercise with a sign-error tag and expected answer `5`
- WHEN the student answers `-5`
- THEN the result is incorrect with the sign-error tag

#### Scenario: unrelated wrong answer has no tag

- GIVEN an exercise with declared error tags
- WHEN the wrong answer does not match any known pattern
- THEN the result is incorrect with no error tag

### Requirement: Unsupported Exercise Types

The evaluator MUST NOT guess correctness for unsupported types such as free-response, graphical, matching, or ordering. It SHALL return a manual-review result.

#### Scenario: manual review required

- GIVEN an unsupported exercise type
- WHEN the answer is evaluated
- THEN the result is incorrect with `unsupported_type` and manual-review feedback

### Requirement: Pedagogical Feedback Boundary

Feedback SHOULD help the learner correct direction without exposing full solution steps unless the exercise explicitly allows it.

#### Scenario: feedback avoids giving away answer

- GIVEN an incorrect answer with an identified error tag
- WHEN feedback is produced
- THEN it names the misconception category without revealing the final answer
