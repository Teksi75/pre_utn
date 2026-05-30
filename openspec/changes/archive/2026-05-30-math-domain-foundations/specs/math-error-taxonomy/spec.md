# Math Error Taxonomy Specification

## Purpose

Defines normalized mathematics error tags used by exercises, evaluation, and future recommendations.

## Requirements

### Requirement: Error Tag Identity and Metadata

The system SHALL define an ErrorTag with tag ID, unit, description, and examples. Tag IDs MUST follow `u{1-6}_{slug}`.

#### Scenario: valid tag is accepted

- GIVEN a tag with ID `u1_signo_racionalizacion`, unit 1, description, and examples
- WHEN the tag is validated
- THEN validation succeeds with the normalized tag

#### Scenario: invalid tag is rejected

- GIVEN a tag with malformed ID, unit 7, missing description, or no examples
- WHEN the tag is validated
- THEN validation fails with the relevant field error

### Requirement: Minimum Coverage and Uniqueness

The taxonomy SHALL contain at least 2 error tags per mathematics unit and every tag MUST be unique.

#### Scenario: complete taxonomy loads

- GIVEN each unit has at least 2 unique error tags
- WHEN the taxonomy is loaded
- THEN loading succeeds

#### Scenario: duplicate or missing coverage fails

- GIVEN a duplicate tag or fewer than 2 tags for a unit
- WHEN the taxonomy is loaded
- THEN loading fails with duplicate or coverage details

### Requirement: Lookup and Filtering

The taxonomy SHALL support lookup by tag and filtering by unit.

#### Scenario: lookup existing tag

- GIVEN the taxonomy contains a requested tag
- WHEN the tag is looked up
- THEN the matching ErrorTag is returned

#### Scenario: filter by unit

- GIVEN multiple tags across units
- WHEN tags are requested for unit 2
- THEN only unit 2 tags are returned

### Requirement: Pedagogical Interpretation

Each error tag SHOULD describe an observable misconception in terms useful to both learners and teachers.

#### Scenario: learner and teacher can interpret error

- GIVEN an error tag assigned after evaluation
- WHEN its metadata is displayed or reported
- THEN it explains the misconception without requiring canonical source text
