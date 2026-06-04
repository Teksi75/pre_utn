# Delta for Guided Practice

## ADDED Requirements

### Requirement: Multiple-Choice Option Shuffling

When presenting a `multiple-choice` exercise during practice, the system MUST randomize the display order of options at runtime. The shuffling MUST preserve the mapping between each option's value and its correctness. The correct answer MUST NOT be positionally biased across repeated presentations.

#### Scenario: options are displayed in shuffled order

- GIVEN a multiple-choice exercise with options `["A", "B", "C", "D"]` where "B" is correct
- WHEN the practice view renders the exercise
- THEN the displayed order MAY differ from the catalog order, and the correct option is still identifiable by value

#### Scenario: shuffling preserves correctness mapping

- GIVEN a shuffled option list
- WHEN the student selects the option whose value matches the expected answer
- THEN the evaluation result is correct regardless of that option's display position

### Requirement: Deterministic Shuffle for Testing

The shuffling mechanism MUST accept an optional seed or deterministic random source so that tests can assert on specific orderings without relying on `Math.random()`. In production, the seed SHOULD be derived from a per-student or per-session value to ensure consistent display within a session.

#### Scenario: seeded shuffle produces reproducible order

- GIVEN a multiple-choice exercise and a fixed seed value
- WHEN options are shuffled with that seed
- THEN the resulting order is identical across repeated calls with the same seed

#### Scenario: different seeds produce different orders

- GIVEN a multiple-choice exercise with 4+ options
- WHEN options are shuffled with two different seed values
- THEN at least one ordering differs (probabilistically guaranteed for sufficient options)
