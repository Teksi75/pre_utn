# Valor Absoluto Skill Specification

## Purpose

Content and behavioral contract for making `mat.u1.valor_absoluto` traversable: theory → examples → practice → feedback → readiness. Defines pedagogical scope, exercise constraints, and acceptance criteria.

## Requirements

### Requirement: Skill Order and Prerequisites

`mat.u1.valor_absoluto` MUST appear in PILOT_SKILLS between `mat.u1.intervalos` and `mat.u1.logaritmos`. `mat.u1.intervalos` SHALL be its prerequisite. Readiness MUST NOT claim `mat.u1.logaritmos` requires it.

#### Scenario: correct insertion order

- GIVEN PILOT_SKILLS array
- THEN `mat.u1.intervalos` precedes `mat.u1.valor_absoluto`
- AND `mat.u1.logaritmos` follows

#### Scenario: no spurious dependency on logaritmos

- GIVEN SKILL_DEPENDENCIES
- THEN `mat.u1.logaritmos` does NOT list `mat.u1.valor_absoluto` as prerequisite

### Requirement: Transitable Availability

The skill MUST be navigable in pilot learn/practice modes. Content loaders MUST return non-empty theory, examples, and exercises for this skill.

#### Scenario: pilot entry exists

- GIVEN PILOT_SKILLS is loaded
- THEN `mat.u1.valor_absoluto` has entry `{ skillId: "mat.u1.valor_absoluto", unitKey: "unit-1" }`

#### Scenario: content loads without error

- GIVEN student selects `mat.u1.valor_absoluto`
- WHEN theory and examples load
- THEN at least one TheoryNode and one WorkedExample exist

### Requirement: Theory Content

Theory MUST cover 9 concepts. MUST NOT cover modular equations (`|x-2| < 5`) or Unit 3 depth.

| # | Concept | Detail |
|---|---------|--------|
| 1 | Definition by cases | `|a| = a` if `a ≥ 0`, `|a| = -a` if `a < 0` |
| 2 | Distance to zero | Geometric interpretation on number line |
| 3 | Non-negative result | `|a| ≥ 0` always |
| 4 | Opposites | `|a| = |-a|` |
| 5 | Distance between reals | `|a - b|` as metric on the real line |
| 6 | Product/quotient properties | `|ab| = |a||b|`, `|a/b| = |a|/|b|` |
| 7 | `|x| = a` two-solution | `x = a` or `x = -a` when `a > 0`; one when `a = 0`; none when `a < 0` |
| 8 | `√(x²) = |x|` | Square root of a square yields the absolute value |
| 9 | Non-distributive over sum | `|a + b| ≠ |a| + |b|` generally; triangle inequality `|a + b| ≤ |a| + |b|` |

#### Scenario: theory covers all required concepts

- GIVEN theory node for `mat.u1.valor_absoluto`
- THEN all 9 concepts above are present
- AND no concept references modular inequalities or Unit 3 depth

### Requirement: Worked Examples

≥5 worked examples MUST exist covering: numeric calculation, distance between reals, property application, `|x| = a` interpretation, and conceptual validation.

#### Scenario: example count and coverage

- GIVEN examples for `mat.u1.valor_absoluto`
- THEN count ≥ 5 with at least one numeric computation and one distance example

### Requirement: Exercise Content

8–12 graduated exercises MUST exist (difficulty 1–4). Permitted: `multiple-choice`, `numerical`. Prohibited: free-form symbolic, structured text entry. MC exercises: ≥3 options, expectedAnswer MUST match exactly one.

| Constraint | Value |
|------------|-------|
| Total exercises | 8–12 |
| Allowed types | `multiple-choice`, `numerical` |
| Prohibited types | `symbolic`, `free-response` |
| MC options minimum | 3 |
| MC expectedAnswer match | Exact, one option |
| Difficulty range | 1–4 inclusive |

#### Scenario: exercise constraints pass

- GIVEN exercises for `mat.u1.valor_absoluto`
- THEN count ∈ [8, 12], all types allowed, every MC expectedAnswer matches an option

### Requirement: Feedback and Error Taxonomy

Nine error tags MUST have feedback entries in `feedback/unit-1.json`. Each exercise's `commonErrorTags` MUST reference only tags with feedback coverage.

| Tag | Misconception |
|-----|---------------|
| `u1_abs_signo_incorrecto` | Writes `|−5| = −5` — treats absolute value as identity |
| `u1_abs_cero` | Thinks `|0|` is undefined or non-zero |
| `u1_abs_distancia_no_signo` | Confuses distance with sign — treats `|a|` as directional |
| `u1_abs_no_negativo` | Violates non-negativity — answers with negative value |
| `u1_abs_confunde_opuesto` | Confuses opposite with absolute: `|a| = −a` unconditionally |
| `u1_abs_distancia_entre_reales` | Computes `|a − b|` incorrectly (e.g., order-dependent) |
| `u1_abs_sqrt_cuadrado` | Forgets `√(x²) = |x|` — simplifies `√((−3)²)` to `−3` |
| `u1_abs_doble_solucion` | Misses second solution: `|x| = 4` → only `x = 4` |
| `u1_abs_distributiva_falsa` | False distributivity: `|a + b| = |a| + |b|` |

#### Scenario: feedback coverage complete

- GIVEN feedback library for unit-1
- THEN all 9 tags have non-empty FeedbackMapping with pedagogical explanation
- AND no exercise references uncovered error tags

### Requirement: Readiness

`isSkillReady("mat.u1.valor_absoluto")` MUST return `{ ready: true, missing: [] }`.

#### Scenario: readiness check passes

- GIVEN theory, examples, exercises (≥4), feedback, and evaluation exist
- WHEN `isSkillReady` is called for `mat.u1.valor_absoluto`
- THEN result is `ready: true` with zero missing components

### Requirement: Acceptance and Validation

`pnpm run test && pnpm run typecheck && pnpm run build` MUST pass. Existing catalog tests MUST NOT regress. README SHALL mark valor_absoluto "Listo" only after all checks pass; complejos remains "Pendiente".

#### Scenario: CI validation passes

- GIVEN all content committed
- WHEN `pnpm run test && pnpm run typecheck && pnpm run build` executes
- THEN all exit code 0
- AND README shows valor_absoluto as "Listo"
- AND complejos status unchanged as "Pendiente"
