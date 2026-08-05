# Delta for Math Answer Evaluator

## ADDED Requirements

### Requirement: Deterministic Structured Evaluators

The system MUST provide one evaluator per structured variant, each implemented as a pure function with the same `(exercise, userAnswer)` signature as the existing evaluator. Given identical input, each evaluator MUST return an identical result across calls. Structured evaluators MUST NOT mutate the exercise or the user answer, MUST NOT depend on runtime state, and MUST NOT import React, Next.js, Supabase, or DOM APIs.

#### Scenario: evaluator is deterministic

- GIVEN the same structured exercise and the same user answer
- WHEN the evaluator runs 100 times
- THEN every call returns an identical `EvaluationResult`

#### Scenario: evaluator is framework-free

- GIVEN a structured evaluator test file
- WHEN it runs via `pnpm run test`
- THEN no React, Next.js, Supabase, or browser-API imports are present

### Requirement: Variant Equivalence Rules

Each variant evaluator MUST apply the canonical equivalence rule from its variant spec: cell-by-cell equality for `six-ratio-table`; ordered exact equality for `numeric-tuple` (arity-sensitive, MUST NOT collapse to a set); SET equality (no multiplicity preserved) for `angular-solution-set` and `root-list` after normalizing, deduplicating, and canonically ordering for serialization; equality on `(re, im)` for `complex-number`; exact normalized equality for `angle-dms` and `exact-number`. Order MUST NOT affect correctness for the set variants, and any duplicate elements MUST collapse before comparison (multiplicity is not preserved). Numeric tuples MUST preserve order and arity. Equivalent representations (decimal/exact, binomial/polar) MUST be normalized before comparison.

#### Scenario: angular-set order-insensitive (set equality)

- GIVEN an expected `angular-solution-set` `{0°, 90°, 180°, 270°}` and a user answer `{270°, 0°, 180°, 90°}`
- WHEN the evaluator runs
- THEN the result is `correct: true` (set equality, order irrelevant)

#### Scenario: root-list set equality (no multiplicity preserved)

- GIVEN an expected `root-list` of three cube roots and a user answer that lists the same roots with duplicates
- WHEN the evaluator runs
- THEN duplicates collapse, multiplicity is not preserved, and the result is `correct: true`

#### Scenario: numeric-tuple preserves order and arity

- GIVEN a `numeric-tuple` exercise of arity 2 expecting `(2, 3)` and a user answer `(3, 2)`
- WHEN the evaluator runs
- THEN the result is `correct: false` (ordered, arity-sensitive; MUST NOT be reduced to a set)

### Requirement: Configuration Error for Shape Mismatch

If a structured variant receives an `answerSpec.kind` whose shape does not match its declared canonical payload, the evaluator MUST return a configuration-error result, NOT a silent incorrect. This mirrors the existing `numerical` config-error behavior.

#### Scenario: mismatched kind reports config error

- GIVEN a structured exercise whose `answerSpec.kind = "complex-number"` but whose payload shape is a tuple
- WHEN the evaluator runs
- THEN the result is a configuration error with diagnostic metadata

### Requirement: Marker-Aware Evaluation Path

The evaluator dispatch layer MUST NOT filter evaluator inputs by retired-skill IDs. Evaluation MUST proceed solely from the `answerSpec.kind` and the declared skill, regardless of the migration marker state. This prevents accidental filtering of new normative U5 data whose ID happens to match a retired allowlist entry.

#### Scenario: post-marker evaluation is not filtered

- GIVEN a student snapshot with the migration marker persisted
- AND an exercise whose `skillId` is `mat.u5.ecuaciones_trigonometricas`
- WHEN the evaluator runs
- THEN the exercise is evaluated normally and is not filtered by the allowlist

### Requirement: TDD Discipline for Evaluators

Each variant evaluator MUST land with RED tests for valid/invalid shapes, canonical serialization, equivalent forms, boundaries, undefined ratios, axes, dedup order, and empty submissions. Property-style invariants (round-trip, idempotent normalization, deterministic equality, permutation invariance only where mathematically appropriate) MUST be present for every variant.

#### Scenario: property invariants present

- GIVEN any variant evaluator that lands
- WHEN its test file is inspected
- THEN round-trip, normalization idempotence, and deterministic-equality tests are present