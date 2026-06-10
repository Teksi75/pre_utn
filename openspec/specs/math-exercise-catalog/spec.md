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

### Requirement: Unit 2 Exercise Coverage

The catalog MUST include 12 new exercises for Unit 2, distributed evenly across 3 skills in the slice:

| Skill | Count | Exercises |
|-------|-------|-----------|
| `mat.u2.polinomios_basico` | 4 | ex.u2.polinomios_basico.{2-5} |
| `mat.u2.operaciones_polinomios` | 4 | ex.u2.operaciones_polinomios.{2-5} |
| `mat.u2.ruffini_resto` | 4 | ex.u2.ruffini_resto.{2-5} |

Each skill MUST include exactly: 2 multiple-choice (conceptual recognition) + 1 numerical (direct evaluation) + 1 symbolic (multi-step with structured input).

#### Scenario: U2-CAT-001 — Coverage by skill

- GIVEN the loaded catalog with U2 exercises
- WHEN exercises are queried by skill
- THEN each slice skill has exactly 4 new exercises

#### Scenario: U2-CAT-002 — Type distribution

- GIVEN the 12 new U2 exercises
- WHEN grouped by type
- THEN there are 6 multiple-choice, 3 numerical, and 3 symbolic

### Requirement: Unit 2 Input Type Restriction

No U2 exercise MUST use free text for polynomial expressions. Polynomial answers MUST use: rendered multiple-choice options, simple numerical input, separate numerical inputs, or math chips.

#### Scenario: U2-CAT-003 — No free text for polynomials

- GIVEN any U2 exercise with a polynomial answer
- WHEN its type is inspected
- THEN the type is NOT `free-response` nor `symbolic` with free-text polynomial expectedAnswer

### Requirement: Unit 2 Exercise Concepts

The 12 new exercises MUST cover the following concepts:

| ID | Concept | Difficulty | Type | Expected error tags |
|----|---------|------------|------|---------------------|
| ex.u2.polinomios_basico.2 | Identify polynomial degree | 1 | multiple-choice | u2_grado_incorrecto |
| ex.u2.polinomios_basico.3 | Classify monomial/binomial/trinomial | 1 | multiple-choice | u2_termino_faltante |
| ex.u2.polinomios_basico.4 | Evaluate P(3) for P(x) = 2x² - 5x + 1 | 2 | numerical | u2_signo_operacion |
| ex.u2.polinomios_basico.5 | Complete polynomial with zero coefficients | 3 | symbolic | u2_termino_faltante |
| ex.u2.operaciones_polinomios.2 | Sum of two polynomials | 1 | multiple-choice | u2_signo_operacion, u2_termino_semejante |
| ex.u2.operaciones_polinomios.3 | Subtraction of polynomials (distribute sign) | 2 | multiple-choice | u2_signo_operacion |
| ex.u2.operaciones_polinomios.4 | Product (x-a)(x-b) → expanded form | 3 | numerical | u2_signo_operacion, u2_termino_semejante |
| ex.u2.operaciones_polinomios.5 | Combined operation: sum + product | 4 | symbolic | u2_signo_operacion, u2_termino_semejante |
| ex.u2.ruffini_resto.2 | Remainder via remainder theorem, divisor (x-3) | 2 | numerical | u2_ruffini_signo_a |
| ex.u2.ruffini_resto.3 | Quotient and remainder via Ruffini | 3 | symbolic | u2_ruffini_signo_a, u2_termino_faltante |
| ex.u2.ruffini_resto.4 | Verify if a value is a root via remainder theorem | 3 | multiple-choice | u2_ruffini_signo_a |
| ex.u2.ruffini_resto.5 | Reconstruct polynomial from roots | 4 | symbolic | u2_signo_operacion, u2_ruffini_signo_a |

#### Scenario: U2-CAT-004 — All concepts have exercises

- GIVEN the U2 concept table
- WHEN each ID is searched in the catalog
- THEN a valid exercise exists with the stated concept, difficulty, type, and error tags

### Requirement: Unit 2 Difficulty Progression

Within each skill, exercises MUST have increasing difficulty (1 → 4). Each exercise MUST be solvable in under 90 seconds.

#### Scenario: U2-CAT-005 — Difficulty progression

- GIVEN the exercises of a U2 skill ordered by ID
- WHEN their difficulties are inspected
- THEN the sequence is monotonically increasing

### Requirement: Unit 2 Exercise Validation

Each new exercise MUST comply with: stable ID `ex.u2.<skill>.N` (N starting at 2, since .1 exists), canonical PDF reference (page/chapter in `pedagogicalNote`), at least one error tag from the `u2_*` set.

#### Scenario: U2-CAT-006 — New exercise validation

- GIVEN a new U2 exercise
- WHEN validated against the schema
- THEN it has stable ID, canonical reference, and non-empty commonErrorTags

### Requirement: Relocation of ex.u2.gauss.1

The exercise `ex.u2.gauss.1` (currently Gaussian elimination of systems) MUST change its `skillId` from `mat.u2.gauss` to `mat.u3.sistemas`. The ID `ex.u2.gauss.1` remains as a placeholder for a future Gauss theorem for factorization exercise.

#### Scenario: U2-CAT-007 — Gauss relocated

- GIVEN the updated catalog
- WHEN `ex.u2.gauss.1` is looked up
- THEN its skillId is `mat.u3.sistemas`
