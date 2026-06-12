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

---

## Added by consolidate-math-mvp-before-unit-3

### Requirement: Per-Skill Difficulty Progression Validation

Each skill's exercises MUST show a monotonically non-decreasing difficulty sequence when ordered by exercise ID. The validator MUST check this per-skill, not globally.

#### Scenario: skill with increasing difficulty passes

- GIVEN a skill with exercises at difficulties [1, 2, 3, 4] ordered by ID
- WHEN per-skill progression is validated
- THEN validation passes

#### Scenario: skill with non-monotonic difficulty fails

- GIVEN a skill with exercises at difficulties [1, 3, 2, 4] ordered by ID
- WHEN per-skill progression is validated
- THEN validation fails naming the skill and the out-of-order exercise IDs

### Requirement: Difficulty Progression Safety Net Tests

The system MUST include TDD safety-net tests that verify difficulty progression logic without requiring real cohort data. These tests MUST cover: valid monotonic sequences, invalid sequences, single-exercise skills, and equal-difficulty exercises.

#### Scenario: single-exercise skill passes trivially

- GIVEN a skill with exactly one exercise at difficulty 3
- WHEN progression is validated
- THEN validation passes (single element is trivially monotonic)

#### Scenario: equal-difficulty exercises are allowed

- GIVEN a skill with exercises at difficulties [2, 2, 3]
- WHEN progression is validated
- THEN validation passes (non-decreasing, not strictly increasing)