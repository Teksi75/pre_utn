# Delta for Math Exercise Model

## ADDED Requirements

### Requirement: Structured Answer Discriminator

The system MUST support an additive `structured` exercise type whose `answerSpec` is a discriminated union with a `kind` field. Each variant defines a canonical payload, normalization rules, and an equivalence relation. The existing `evaluateAnswer(exercise, userAnswer: string)` and `onSubmit(answer: string)` boundaries MUST be preserved. `ExerciseBaseShape` and `ExerciseType` MUST accept the structured kind without breaking existing exercises.

#### Scenario: structured exercise validates

- GIVEN a structured exercise with a valid `answerSpec.kind` and matching payload
- WHEN the exercise is validated
- THEN validation succeeds and existing string-based exercises are unaffected

### Requirement: Minimum Structured Variants

The system MUST support at least these variants:

| Variant | Canonical payload | Equivalence rule |
|---------|------------------|------------------|
| `angle-dms` | sign + degrees + minutes + seconds with `0 ≤ m,s < 60` and explicit unit | exact after normalization |
| `exact-number` | reduced rational plus optional radical terms; signs, gcd, radical factors, term order normalized | exact after normalization |
| `angular-solution-set` | unit, bounded-domain metadata; exact angles are normalized, deduplicated, and canonically ordered for serialization, then compared as permutation-invariant SETS (no multiplicity preserved); periodic family optional | set equality |
| `six-ratio-table` | named `sin/cos/tan/cot/sec/csc` cells with exact values or explicit `undefined` | cell-by-cell equality |
| `numeric-tuple` | fixed ordered arity (pair = arity 2); MUST preserve order and arity — NOT reduced to a set | ordered exact equality (arity-sensitive) |
| `complex-number` | exact real and imaginary parts; polar views are metadata | equality on `(re, im)` |
| `root-list` | exact numbers, exact angles, or complex numbers normalized, deduplicated, and canonically ordered for serialization, then compared as permutation-invariant SETS (no multiplicity preserved) | set equality |

#### Scenario: angle-dms normalization

- GIVEN `answerSpec.kind = "angle-dms"` and input `60° 60′ 00″`
- WHEN the codec normalizes the payload
- THEN it canonicalizes to `61° 00′ 00″` and a subsequent equal input compares equal

#### Scenario: six-ratio-table preserves undefined

- GIVEN `answerSpec.kind = "six-ratio-table"` and `tan(90°) = undefined`
- WHEN the codec serializes the payload
- THEN the `tan` cell carries the explicit `undefined` marker and comparison treats `undefined` equal to `undefined`

### Requirement: Versioned Pure Codec

The codec that serializes structured drafts to canonical JSON MUST be a pure function. The serialized string MUST carry a codec version tag. `encode(decode(s))` and `decode(encode(p))` MUST round-trip for every variant. The codec MUST NOT depend on React, Next.js, Supabase, or browser APIs. The codec MUST be invoked through the existing submit/snapshot boundaries; no new persistence column is required.

#### Scenario: codec round-trip

- GIVEN a canonical payload `p` for any structured variant
- WHEN `encode(p)` then `decode` runs
- THEN the result equals `p` under deterministic equality

#### Scenario: codec version is present

- GIVEN any submitted structured answer string
- WHEN the string is parsed
- THEN it carries the codec version tag and is rejected if the tag is unsupported

### Requirement: No Free-Form Structured Mathematics

The system MUST NOT accept free-form text input for any structured math answer (roots, fractions with radicals, intervals, sets with union/intersection, complex numbers in `a+bi`, multiple solutions, full logarithmic expressions). Every structured answer MUST use one of the supported variants or a multiple-choice render. Domain code MUST NOT import React, Next.js, Supabase, or DOM APIs.

#### Scenario: free-form root rejected

- GIVEN a structured exercise whose prompt asks for a radical expression
- WHEN the learner submits free-form text
- THEN the input is rejected by the variant control before evaluation

### Requirement: Incremental Variant Implementation Under TDD

Each structured variant MUST be implemented only in the first pedagogical slice that consumes it, under strict TDD (RED → GREEN → REFACTOR), with regression tests for codec round-trip, normalization idempotence, deterministic equality, and previously supported variants.

#### Scenario: variant lands with first consumer

- GIVEN a pedagogical slice that needs `angular-solution-set`
- WHEN the slice lands
- THEN the variant ships with RED tests for valid/invalid shapes, canonical serialization, equivalence, boundaries, and dedup order