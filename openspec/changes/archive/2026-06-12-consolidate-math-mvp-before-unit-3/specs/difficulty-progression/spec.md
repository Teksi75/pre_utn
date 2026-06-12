# Delta for difficulty-progression

## ADDED Requirements

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
