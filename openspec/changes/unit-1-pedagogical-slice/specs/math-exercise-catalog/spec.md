# Delta for Math Exercise Catalog

## MODIFIED Requirements

### Requirement: Catalog Coverage

The system SHALL provide at least 30 mathematics exercises, with at least 5 exercises for each unit 1 through 6. For this Unit 1 slice, `mat.u1.reales_operaciones` and `mat.u1.intervalos` MUST each have at least 4 valid exercises and MUST NOT be considered ready unless theory, worked examples, exercises, feedback, and evaluation support are all present.
(Previously: coverage only required at least 5 valid exercises per unit.)

#### Scenario: complete catalog loads

- GIVEN the catalog contains at least 5 valid exercises per unit
- WHEN the catalog is loaded
- THEN loading succeeds with all 6 units represented

#### Scenario: incomplete coverage fails

- GIVEN any unit has fewer than 5 valid exercises
- WHEN the catalog is loaded
- THEN loading fails naming the insufficient unit

#### Scenario: pilot readiness gate prevents false ready state

- GIVEN a pilot skill has 4 exercises but no feedback mappings
- WHEN readiness is computed
- THEN the skill is not ready
- AND the missing feedback component is reported

### Requirement: Pedagogically Valuable Content

Catalog content MUST add pedagogical value. It MAY use canonical exercises directly when repetition is intentional for reinforcement; otherwise it SHOULD vary values, wording, representation, or context while preserving the target skill.
(Previously: catalog content rejected verbatim canonical exercise text.)

#### Scenario: transformed pattern is accepted

- GIVEN an exercise changes values, wording, and context while assessing the same skill
- WHEN the catalog is reviewed
- THEN the exercise is eligible for inclusion

#### Scenario: canonical repetition is justified

- GIVEN an exercise prompt matches canonical UTN material
- WHEN the catalog is reviewed
- THEN it is eligible when metadata explains the reinforcement purpose

## ADDED Requirements

### Requirement: Content Linkage

Each pilot exercise SHOULD reference its skill, common error tags, and related theory or worked-example identifiers so feedback can direct recovery.

#### Scenario: recovery target is available

- GIVEN a pilot exercise declares an error tag
- WHEN an incorrect tagged attempt is evaluated
- THEN the catalog can identify theory or example content for review

### Requirement: Interaction Metadata

Each pilot exercise MUST declare an interaction type and the data needed to render it. Multiple-choice exercises MUST expose selectable options. Interval translation exercises involving infinity MUST use multiple choice or dedicated interval-selection metadata, not free-text-only answers.

#### Scenario: multiple-choice data is complete

- GIVEN a pilot exercise has interaction type `multiple-choice`
- WHEN the catalog is validated
- THEN it includes selectable options and one evaluable correct option

#### Scenario: infinity interval avoids symbol typing

- GIVEN a prompt asks which interval represents an unbounded inequality
- WHEN the exercise is validated
- THEN its interaction is multiple choice or interval selector
- AND it does not require typing `∞`
