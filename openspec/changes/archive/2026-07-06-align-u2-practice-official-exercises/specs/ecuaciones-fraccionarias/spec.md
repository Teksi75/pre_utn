# Delta for Ecuaciones Fraccionarias

## ADDED Requirements

### Requirement: Rational Expression Exercise Support

The system MUST support rational-expression operation exercises under `skillId: mat.u2.ecuaciones_fraccionarias` with `category: expresiones_racionales`. These exercises MUST cover sums, factor-and-simplify, and quotients, and MUST use non-free-form answer controls.

#### Scenario: rational expression metadata

- GIVEN a rational-expression exercise
- WHEN its metadata is inspected
- THEN `skillId` is `mat.u2.ecuaciones_fraccionarias`
- AND `category` is `expresiones_racionales`

#### Scenario: rational expression operation coverage

- GIVEN the rational-expression subset
- WHEN operation families are audited
- THEN sums, factor-and-simplify, and quotients are represented

## MODIFIED Requirements

### Requirement: Fractional Equation Exercise Support

The system SHALL provide at least 4 fractional-equation exercises with domain verification. Exercises MUST use multiple-choice with domain-exclusion distractors or numerical only when the answer is exactly one valid finite scalar. Double-answer, domain-rich, and symbolic answers MUST use non-free-form alternatives.
(Previously: required 3-5 exercises and allowed MC or numerical single-solution answers.)

#### Scenario: MC exercise with domain-exclusion distractor

- GIVEN an equation like 1/(x-2) + 1/(x+2) = 4/(x²-4)
- WHEN the student selects an answer
- THEN one distractor is x=2 (makes denominator zero)
- AND the correct solution is a valid option

#### Scenario: numerical exercise with single solution

- GIVEN a fractional equation with exactly one valid solution
- WHEN the student enters a numerical answer
- THEN the answer is validated as a single number

#### Scenario: domain-rich equation avoids numerical type

- GIVEN a fractional equation with excluded values or multiple valid roots
- WHEN the exercise is validated
- THEN the type is not `numerical`

### Requirement: Domain Exclusion via Distractors

For fractional equations, MC exercises MUST include at least one distractor that is an excluded domain value. The fractional-equation subset MUST include at least 4 exercises that require checking denominator-zero exclusions.
(Previously: required distractors for MC exercises but did not set a coverage floor.)

#### Scenario: domain-exclusion distractor present

- GIVEN a fractional equation MC exercise
- WHEN options are inspected
- THEN at least one option is a value that zeroes a denominator

#### Scenario: numerical exercise avoids ambiguous domain

- GIVEN a numerical-type fractional equation exercise
- WHEN the exercise is validated
- THEN the equation has exactly one valid solution and no domain ambiguity
