# Math Exercise Catalog Specification

## Purpose

Defines the loadable mathematics exercise catalog for the MVP practice loop.

## Requirements

### Requirement: Catalog Coverage

The system SHALL provide at least 30 mathematics exercises, with at least 5 exercises for each unit 1 through 6.

#### Scenario: complete catalog loads

- GIVEN the catalog contains at least 5 valid exercises per unit
- WHEN the catalog is loaded
- THEN loading succeeds with all 6 units represented

#### Scenario: incomplete coverage fails

- GIVEN any unit has fewer than 5 valid exercises
- WHEN the catalog is loaded
- THEN loading fails naming the insufficient unit

### Requirement: Pedagogically Valuable Content

Catalog content MUST provide pedagogical value beyond mechanical duplication. It MAY reuse canonical material directly when repetition is intentionally used to reinforce a concept; otherwise it SHOULD vary values, wording, representation, or context while preserving the target skill.

#### Scenario: transformed pattern is accepted

- GIVEN an exercise changes values, wording, and context while assessing the same skill
- WHEN the catalog is reviewed
- THEN the exercise is eligible for inclusion

#### Scenario: intentional repetition is accepted

- GIVEN an exercise prompt matches canonical UTN material
- WHEN the catalog is reviewed
- THEN it is eligible when metadata explains the reinforcement purpose

### Requirement: Catalog Querying

The catalog SHALL support querying by unit, skill, and difficulty range. Results MUST be deterministic: difficulty ascending, then ID ascending.

#### Scenario: query by skill orders results

- GIVEN three exercises for one skill with difficulties 2, 1, and 4
- WHEN exercises are requested by skill
- THEN results are returned in difficulty order 1, 2, 4

#### Scenario: query with no matches is safe

- GIVEN no exercises match a requested skill or difficulty range
- WHEN the catalog is queried
- THEN an empty result is returned without error

### Requirement: Pedagogical Traceability

Each catalog exercise SHOULD retain pedagogical source notes describing the practiced pattern, intended learner evidence, and whether any canonical repetition is intentional.

#### Scenario: teacher can interpret intent

- GIVEN a catalog exercise
- WHEN its pedagogical metadata is inspected
- THEN it identifies the practiced skill and observable evidence of mastery
