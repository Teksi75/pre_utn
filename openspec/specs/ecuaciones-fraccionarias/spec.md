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

### Requirement: Family Categories

The skill `mat.u2.ecuaciones_fraccionarias` covers two pedagogical families. The split is observed via the `category` field on each exercise — not via separate skills. The category is one of:

| Category | Definition | Type discipline |
|----------|------------|-----------------|
| `expresiones_racionales` | Rational expressions: sums, factor+simplify, quotients of compound fractions. Reference: items 12-14 of `02_ej_utn.pdf`; chapter 13-14 of `UNIDAD2_matemática.pdf`. | MC only (answers are symbolic). |
| `ecuaciones_fraccionarias` | Fractional equations: same-denominator, double-denominator, double-root, domain-exclusion. Reference: item 15 of `02_ej_utn.pdf`; chapter 15 of `UNIDAD2_matemática.pdf`. | MC for domain-rich and double-scalar cases; numerical ONLY for unique-scalar cases with no domain ambiguity. |

#### Scenario: category declared on every PR 7 exercise

- GIVEN a `mat.u2.ecuaciones_fraccionarias` exercise added by PR 7
- WHEN the exercise is loaded
- THEN it carries `category ∈ {"expresiones_racionales", "ecuaciones_fraccionarias"}`

#### Scenario: no new skill split

- GIVEN the loaded skill catalog
- WHEN `ALL_SKILLS` is enumerated
- THEN it does NOT contain `mat.u2.expresiones_racionales`
- AND the `mat.u2.ecuaciones_fraccionarias` skill hosts both families via `category`

### Requirement: Rational-Expression Type Discipline

Rational-expression exercises (category `expresiones_racionales`) MUST be `multiple-choice` only. Rational answers cannot be expressed as a single finite scalar, so `numerical` type is forbidden for this family.

#### Scenario: rational-expression is MC

- GIVEN a `mat.u2.ecuaciones_fraccionarias` exercise with `category: "expresiones_racionales"`
- WHEN its type is inspected
- THEN the type is `multiple-choice`

#### Scenario: rational-expression expectedAnswer is symbolic

- GIVEN a `mat.u2.ecuaciones_fraccionarias` exercise with `category: "expresiones_racionales"`
- WHEN its `expectedAnswer` is inspected
- THEN it contains a fraction marker (`/`)
- AND it contains at least one variable token (rational expressions involve x, y, etc.)

### Requirement: Fractional-Equation Domain-Exclusion Distractor

Fractional-equation MC exercises (category `ecuaciones_fraccionarias`, type `multiple-choice`) MUST include at least one option that is a domain-exclusion value — a value that would zero one of the denominators of the original equation. Numerical fractional-equation exercises (unique-scalar, no domain ambiguity) MUST NOT include domain-exclusion distractors.

#### Scenario: MC fractional-equation carries a domain-exclusion option

- GIVEN a `mat.u2.ecuaciones_fraccionarias` exercise with `category: "ecuaciones_fraccionarias"` and `type: "multiple-choice"`
- WHEN its options are inspected
- THEN at least one option equals `0`, `2`, or `-2` (or `x = 0`, `x = 2`, `x = -2`) and zeroes a denominator of the original equation

#### Scenario: numerical fractional-equation has no domain ambiguity

- GIVEN a `mat.u2.ecuaciones_fraccionarias` exercise with `category: "ecuaciones_fraccionarias"` and `type: "numerical"`
- WHEN its `expectedAnswer` is inspected
- THEN it is a single finite scalar (no commas, no semicolons, finite parse via `Number`)

### Requirement: Feedback-Coverage Discipline

Every `u2_*` error tag declared on a `mat.u2.ecuaciones_fraccionarias` exercise MUST have a corresponding mapping in `content/matematica/feedback/unit-2.json`. The mapping is required for `isSkillReady(...)` to report `ready: true` (without it, the accessibility layer marks the skill as "Próximamente" instead of practice-ready). The 8 PR 2 tags (`u2_division_larga`, `u2_tcp`, `u2_cubo_perfecto`, `u2_diferencia_cuadrados`, `u2_factor_comun`, `u2_trinomio_cuadrado`, `u2_resta_potencias`, `u2_simplifica_racional`) are feedback-covered as of PR 8 and may be used by future U2 exercises.

#### Scenario: every u2_* tag on a live exercise is feedback-covered

- GIVEN any U2 exercise (any of the 7 skills)
- WHEN its `commonErrorTags` are inspected
- THEN every tag is present in `feedback/unit-2.json`

#### Scenario: the 8 PR 2 tags are feedback-covered after PR 8

- GIVEN the feedback mappings loaded from `feedback/unit-2.json`
- WHEN the tag set is enumerated
- THEN it includes `u2_division_larga`, `u2_tcp`, `u2_cubo_perfecto`, `u2_diferencia_cuadrados`, `u2_factor_comun`, `u2_trinomio_cuadrado`, `u2_resta_potencias`, `u2_simplifica_racional`
