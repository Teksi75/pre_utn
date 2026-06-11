# MCM/MCD Polinomios Specification

## Purpose

Defines exercises for computing Minimum Common Multiple (MCM) and Greatest Common Divisor (MCD) of factorized polynomials, closing the U2 skill chain.

## Requirements

### Requirement: MCM/MCD Exercise Support

The system SHALL provide 3-5 exercises for computing MCM and MCD from factorized polynomials. Exercises MUST use multiple-choice or symbolic (polynomial-evaluator) answer types. Free-text polynomial input is prohibited.

#### Scenario: MCM exercise with factorized polynomials

- GIVEN two polynomials in factorized form, e.g. P(x) = x(x-2) and Q(x) = x(x+3)
- WHEN the student computes MCM
- THEN the correct answer x(x-2)(x+3) is available as an MC option or symbolic input

#### Scenario: MCD exercise with common factors

- GIVEN two polynomials sharing factors, e.g. P(x) = (x-1)(x+2) and Q(x) = (x-1)(x-3)
- WHEN the student computes MCD
- THEN the correct answer (x-1) is available as an MC option or symbolic input

### Requirement: Canonical Alignment

Exercises MUST reference canonical PDF chapter 14 in `pedagogicalNote`. Difficulty MUST increase across exercises (1 to 4).

#### Scenario: canonical reference present

- GIVEN any MCM/MCD exercise
- WHEN pedagogicalNote is inspected
- THEN it contains a chapter 14 reference

#### Scenario: difficulty progression

- GIVEN exercises for `mat.u2.mcm_mcd_polinomios` ordered by ID
- WHEN difficulties are inspected
- THEN the sequence is monotonically increasing

### Requirement: Skill Prerequisites

The skill `mat.u2.mcm_mcd_polinomios` MUST declare `mat.u2.factorizacion` as prerequisite. Students MUST have completed factorization before attempting MCM/MCD.

#### Scenario: prerequisite chain

- GIVEN the skill dependency graph
- WHEN prerequisites for `mat.u2.mcm_mcd_polinomios` are checked
- THEN `mat.u2.factorizacion` is listed
