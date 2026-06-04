# Delta for Math Exercise Catalog

## ADDED Requirements

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
