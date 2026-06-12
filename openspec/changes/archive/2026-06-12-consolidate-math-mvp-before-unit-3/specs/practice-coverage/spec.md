# Delta for practice-coverage

## ADDED Requirements

### Requirement: Per-Unit Validation Scope

Bank validation rules MUST be scoped per unit. Each unit defines its own minimum exercise count and coverage thresholds. U1 thresholds MUST NOT create false positives when applied to U2 or U3 content.

#### Scenario: U1 thresholds do not affect U2

- GIVEN U1 has a minimum of 40 exercises and U2 has a minimum of 20
- WHEN bank validation runs for U2
- THEN U2 is validated against its own threshold (20), not U1's (40)

#### Scenario: unit without explicit thresholds uses defaults

- GIVEN a new unit (e.g., U3) with no explicit thresholds defined
- WHEN bank validation runs for U3
- THEN a default minimum threshold is applied (configurable, minimum 5)

### Requirement: Unit Coverage Metadata

Each exercise MUST declare its unit explicitly. The validator MUST group exercises by unit before applying per-unit thresholds.

#### Scenario: exercises are grouped by unit for validation

- GIVEN exercises from U1 and U2 in the bank
- WHEN validation runs
- THEN exercises are grouped by their declared unit before threshold checks
