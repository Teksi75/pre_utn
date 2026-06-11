# Ecuaciones Fraccionarias Specification

## Purpose

Defines exercises for solving fractional equations (rational equations with variable in denominators), completing the U2 curriculum.

## Requirements

### Requirement: Fractional Equation Exercise Support

The system SHALL provide 3-5 exercises for solving fractional equations. Exercises MUST use multiple-choice (with domain-exclusion distractors) or numerical (single-solution) answer types.

#### Scenario: MC exercise with domain-exclusion distractor

- GIVEN an equation like 1/(x-2) + 1/(x+2) = 4/(x²-4)
- WHEN the student selects an answer
- THEN one distractor is x=2 (makes denominator zero) and the correct solution is a valid option

#### Scenario: numerical exercise with single solution

- GIVEN a fractional equation with exactly one valid solution
- WHEN the student enters a numerical answer
- THEN the answer is validated as a single number

### Requirement: Domain Exclusion via Distractors

For fractional equations, MC exercises MUST include at least one distractor that is an excluded domain value (makes any denominator zero). This tests whether the student checks domain validity.

#### Scenario: domain-exclusion distractor present

- GIVEN a fractional equation MC exercise
- WHEN options are inspected
- THEN at least one option is a value that zeroes a denominator

#### Scenario: numerical exercise avoids ambiguous domain

- GIVEN a numerical-type fractional equation exercise
- WHEN the exercise is validated
- THEN the equation has exactly one valid solution and no domain ambiguity

### Requirement: Canonical Alignment

Exercises MUST reference canonical PDF chapter 15 in `pedagogicalNote`. Difficulty MUST increase across exercises.

#### Scenario: canonical reference present

- GIVEN any ecuaciones fraccionarias exercise
- WHEN pedagogicalNote is inspected
- THEN it contains a chapter 15 reference

### Requirement: Skill Prerequisites

The skill `mat.u2.ecuaciones_fraccionarias` MUST declare `mat.u2.mcm_mcd_polinomios` as prerequisite. Solving fractional equations requires MCM of polynomials.

#### Scenario: prerequisite chain complete

- GIVEN the skill dependency graph
- WHEN prerequisites for `mat.u2.ecuaciones_fraccionarias` are checked
- THEN `mat.u2.mcm_mcd_polinomios` is listed
- AND the full U2 chain is: polinomios_basico -> operaciones_polinomios -> ruffini_resto -> factorizacion -> gauss -> mcm_mcd_polinomios -> ecuaciones_fraccionarias
