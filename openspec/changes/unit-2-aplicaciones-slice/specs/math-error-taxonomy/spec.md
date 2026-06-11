# Delta for Math Error Taxonomy

## ADDED Requirements

### Requirement: Unit 2 Aplicaciones Error Tags

The taxonomy MUST include 2 new error tags with prefix `u2_*` for MCM/MCD and fractional equation misconceptions.

| Tag ID | Label | Description | Impact |
|--------|-------|-------------|--------|
| `u2_denominador_cero` | Denominator zero | Student accepts a solution that makes a denominator zero in a fractional equation | Exercise incorrect |
| `u2_confunde_mcm_mcd` | Confuses MCM with MCD | Student computes MCM when MCD was requested, or vice versa | Exercise incorrect |

#### Scenario: U2APP-TAG-001 — New tags load

- GIVEN the updated taxonomy
- WHEN unit 2 tags are queried
- THEN `u2_denominador_cero` and `u2_confunde_mcm_mcd` are present with complete metadata

#### Scenario: U2APP-TAG-002 — Tags pass validation

- GIVEN each new `u2_*` tag
- WHEN validated against the ErrorTag schema
- THEN validation passes with normalized tag

#### Scenario: U2APP-TAG-003 — No duplicates

- GIVEN the taxonomy with new tags
- WHEN unique IDs are verified
- THEN no duplicate tags exist

### Requirement: Aplicaciones Detection Patterns

Each new tag MUST have at least one detection pattern in `error-tagging.ts`.

| Tag ID | Detection pattern | Example wrong | Example correct |
|--------|------------------|---------------|-----------------|
| `u2_denominador_cero` | Student's numerical answer matches a value that zeroes any denominator in the equation | x=2 for equation with (x-2) in denominator | x=3 (valid solution) |
| `u2_confunde_mcm_mcd` | In MC: student selected the MCD when MCM was correct (or vice versa); verify by computing both and comparing to selected option | Selected (x-1) when MCM is (x-1)(x+2)(x-3) | Selected (x-1)(x+2)(x-3) |

#### Scenario: detector flags denominator-zero answer

- GIVEN a fractional equation exercise with denominator (x-2)
- WHEN the student answers x=2
- THEN `u2_denominador_cero` is flagged

#### Scenario: detector flags MCM/MCD confusion

- GIVEN an MC exercise asking for MCM of two polynomials
- WHEN the student selects the MCD option
- THEN `u2_confunde_mcm_mcd` is flagged
