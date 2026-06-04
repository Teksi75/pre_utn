# Delta for Math Answer Evaluator

## MODIFIED Requirements

### Requirement: Type-Specific Matching

The evaluator MUST normalize answers according to exercise type: numeric tolerance for `numerical` answers, trimmed exact match for `symbolic` answers, case-insensitive matching for `multiple-choice` and `fill-blank`, and Spanish/English boolean aliases for `true-false`. The evaluator MUST NOT attempt numeric parsing on answers that are not valid numbers; if a `numerical` exercise receives a non-numeric expected answer, the evaluator MUST return a configuration-error result rather than silently marking it incorrect.

#### Scenario: numerical tolerance is accepted

- GIVEN a numerical exercise expecting `3.14`
- WHEN the student answers `3.1405`
- THEN the result is correct

#### Scenario: boolean aliases are accepted

- GIVEN a true-false exercise expecting true
- WHEN the student answers `v` or `verdadero`
- THEN the result is correct

#### Scenario: multiple-choice matches by value not position

- GIVEN a multiple-choice exercise with options `["x = 2, x = 3", "x = -2, x = -3", ...]` and expected answer `x = 2, x = 3`
- WHEN the student selects the option with value `x = 2, x = 3` regardless of its display position
- THEN the result is correct

#### Scenario: numerical exercise with non-numeric expected answer reports config error

- GIVEN an exercise with type `numerical` and expected answer `x = -2, x = 2`
- WHEN the evaluator processes it
- THEN the result is a configuration error, not a silent incorrect

(Previously: the evaluator dispatched by type without validating that the expected answer shape was parseable for that type, causing silent always-incorrect results for mismatched exercises.)

## ADDED Requirements

### Requirement: Deterministic Testability

The evaluator MUST be a pure function: given the same exercise and student answer, it MUST always return the same result. It MUST NOT depend on runtime state, random seeds, or display order. All evaluation logic MUST be testable without React, Next.js, Supabase, or DOM dependencies.

#### Scenario: evaluator produces consistent results across calls

- GIVEN the same exercise and student answer
- WHEN the evaluator is called 100 times
- THEN every call returns an identical result

#### Scenario: evaluator tests run without framework dependencies

- GIVEN a test file importing only from `src/domain/evaluator`
- WHEN the test runs via `pnpm run test`
- THEN it passes without importing React, Next.js, or browser APIs
