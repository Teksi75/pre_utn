# Delta for difficulty-progression

## ADDED Requirements

### Requirement: Difficulty Level Assignment

The practice bank MUST mark each exercise with a difficulty level drawn from the set: básico (1–2), intermedio (3), desafiante (4–5).

#### Scenario: exercise has valid difficulty

- GIVEN an exercise in the bank
- WHEN its difficulty is read
- THEN the value is an integer between 1 and 5 inclusive

#### Scenario: exercise has out-of-range difficulty

- GIVEN an exercise with difficulty 0 or 6
- WHEN the exercise is validated
- THEN validation fails with a difficulty range error

### Requirement: Difficulty Tagging for UI Selection

The practice bank MUST expose difficulty as a queryable tag so that the practice UI can order or filter exercises by difficulty.

#### Scenario: exercises are queryable by difficulty

- GIVEN the practice bank is queried for exercises with difficulty 1
- WHEN the query is executed
- THEN only exercises with difficulty 1 are returned
- AND the result is deterministic (sorted by ID ascending within difficulty)

#### Scenario: difficulty range query

- GIVEN the practice bank is queried for difficulties between 3 and 5
- WHEN the query is executed
- THEN only exercises with difficulty 3, 4, or 5 are returned

### Requirement: Deterministic Difficulty Derivation

Difficulty MUST be derivable deterministically from the exercise content. Difficulty MUST NOT be stored as free-text that requires interpretation.

#### Scenario: difficulty is content-derived

- GIVEN an exercise with difficulty marked as 4
- WHEN the exercise content is reviewed independently
- THEN a reviewer can confirm the difficulty is appropriate based on the exercise complexity
- AND the difficulty is not stored as ambiguous text like "hard" or "medium-hard"

#### Scenario: difficulty requires subjective interpretation

- GIVEN an exercise has no explicit difficulty field
- WHEN the exercise is validated
- THEN validation fails with a missing difficulty error