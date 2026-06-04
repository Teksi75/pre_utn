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

### Requirement: Catalog Type-Answer Audit

The catalog MUST provide a validation pass that checks every exercise for type-answer shape consistency. Exercises whose expected answer contains multiple values, variable assignments, or set notation MUST NOT pass validation under type `numerical`. The audit MUST be executable as an automated test.

#### Scenario: catalog with mismatched types fails audit

- GIVEN a catalog containing an exercise with type `numerical` and expected answer `x = -2, x = 2`
- WHEN the catalog audit runs
- THEN the audit fails and reports the exercise ID and mismatch reason

#### Scenario: catalog with all types consistent passes audit

- GIVEN a catalog where every exercise's expected answer shape matches its declared type
- WHEN the catalog audit runs
- THEN the audit passes with no errors

### Requirement: Multiple-Choice Distractor Quality

Exercises converted to `multiple-choice` type MUST include at least 3 options with exactly one correct answer. Distractors SHOULD be derived from common error patterns declared in `commonErrorTags` or canonical misconceptions for the skill. The correct answer MUST be identifiable by value, not by position in the `options` array.

#### Scenario: multiple-choice exercise has valid distractors

- GIVEN a multiple-choice exercise with 4 options, one matching the expected answer
- WHEN the exercise is validated
- THEN validation succeeds and confirms exactly one correct option

#### Scenario: multiple-choice with no correct option fails

- GIVEN a multiple-choice exercise whose expected answer does not match any option
- WHEN the exercise is validated
- THEN validation fails listing the exercise ID

### Requirement: Known Mismatch Correction

The catalog MUST correct known type-answer mismatches for at least these exercises: `ex.u6.ceros_positividad_negatividad.1`, `ex.u3.ecuaciones_cuadraticas.1`, and `ex.u2.gauss.1`. Corrections MUST preserve the pedagogical intent and skill being assessed.

#### Scenario: known mismatch exercises pass audit after correction

- GIVEN the corrected catalog
- WHEN the catalog audit runs
- THEN `ex.u6.ceros_positividad_negatividad.1`, `ex.u3.ecuaciones_cuadraticas.1`, and `ex.u2.gauss.1` all pass validation
