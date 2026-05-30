# Delta for Math Answer Evaluator

## MODIFIED Requirements

### Requirement: Error Tag Assignment

When an answer is incorrect, the evaluator SHALL return an applicable error tag only when the exercise declares that tag in `commonErrorTags` and the answer pattern supports it; otherwise it SHALL return no tag. Matching MUST be deterministic, side-effect free, and limited to known pedagogical patterns.
(Previously: incorrect answers could be tagged, but the spec did not explicitly bind matching to the exercise's declared `commonErrorTags`.)

#### Scenario: recognizable misconception is tagged

- GIVEN an exercise with a sign-error tag in `commonErrorTags` and expected answer `5`
- WHEN the student answers `-5`
- THEN the result is incorrect with the sign-error tag

#### Scenario: recognized but undeclared misconception is not tagged

- GIVEN an exercise without a sign-error tag in `commonErrorTags` and expected answer `5`
- WHEN the student answers `-5`
- THEN the result is incorrect with no error tag

#### Scenario: unrelated wrong answer has no tag

- GIVEN an exercise with declared error tags
- WHEN the wrong answer does not match any known pattern
- THEN the result is incorrect with no error tag
