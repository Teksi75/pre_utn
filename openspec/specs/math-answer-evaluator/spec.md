# Math Answer Evaluator Specification

## Purpose

Defines behavioral evaluation of a student's answer against an exercise's expected answer.

## Requirements

### Requirement: Evaluation Result

The system SHALL return an evaluation result with correctness, optional error tag, and optional feedback. The evaluator MUST be deterministic and framework-free.

#### Scenario: correct answer succeeds

- GIVEN an exercise and a student answer equivalent to the expected answer
- WHEN the answer is evaluated
- THEN the result is correct with no error tag

#### Scenario: empty answer is incorrect

- GIVEN any evaluable exercise
- WHEN the student submits an empty answer
- THEN the result is incorrect with no error tag

### Requirement: Type-Specific Matching

The evaluator MUST normalize answers according to exercise type: numeric tolerance for `numerical` answers, trimmed exact match for `symbolic` answers, case-insensitive matching for `multiple-choice` and `fill-blank`, and Spanish/English boolean aliases for `true-false`. The evaluator MUST NOT attempt numeric parsing on answers that are not valid numbers; if a `numerical` exercise receives a non-numeric expected answer, the evaluator MUST return a configuration-error result rather than silently marking it incorrect.

#### Scenario: numerical tolerance is accepted

- GIVEN a numerical exercise expecting `3.14`
- WHEN the student answers `3.1405`
- THEN the result is correct

#### Scenario: boolean aliases are accepted

- GIVEN a true-false exercise expecting true
- WHEN the student answers `v` or `verdadero`
- THEN the result is correct

#### Scenario: multiple-choice matches by value not position

- GIVEN a multiple-choice exercise with options `["x = 2, x = 3", "x = -2, x = -3", ...]` and expected answer `x = 2, x = 3`
- WHEN the student selects the option with value `x = 2, x = 3` regardless of its display position
- THEN the result is correct

#### Scenario: numerical exercise with non-numeric expected answer reports config error

- GIVEN an exercise with type `numerical` and expected answer `x = -2, x = 2`
- WHEN the evaluator processes it
- THEN the result is a configuration error, not a silent incorrect

(Previously: the evaluator dispatched by type without validating that the expected answer shape was parseable for that type, causing silent always-incorrect results for mismatched exercises.)

### Requirement: Error Tag Assignment

When an answer is incorrect, the evaluator SHALL return an applicable error tag only when the exercise declares that tag in `commonErrorTags` and the answer pattern supports it; otherwise it SHALL return no tag. Matching MUST be deterministic, side-effect free, and limited to known pedagogical patterns.
(Previously: incorrect answers could be tagged, but the spec did not explicitly bind matching to the exercise's declared `commonErrorTags`.)

#### Scenario: recognizable misconception is tagged

- GIVEN an exercise with a sign-error tag in `commonErrorTags` and expected answer `5`
- WHEN the student answers `-5`
- THEN the result is incorrect with the sign-error tag

#### Scenario: recognized but undeclared misconception is not tagged

- GIVEN an exercise without a sign-error tag in `commonErrorTags` and expected answer `5`
- WHEN the student answers `-5`
- THEN the result is incorrect with no error tag

#### Scenario: unrelated wrong answer has no tag

- GIVEN an exercise with declared error tags
- WHEN the wrong answer does not match any known pattern
- THEN the result is incorrect with no error tag

### Requirement: Unsupported Exercise Types

The evaluator MUST NOT guess correctness for unsupported types such as free-response, graphical, matching, or ordering. It SHALL return a manual-review result.

#### Scenario: manual review required

- GIVEN an unsupported exercise type
- WHEN the answer is evaluated
- THEN the result is incorrect with `unsupported_type` and manual-review feedback

### Requirement: Pedagogical Feedback Boundary

Feedback SHOULD help the learner correct direction without exposing full solution steps unless the exercise explicitly allows it.

#### Scenario: feedback avoids giving away answer

- GIVEN an incorrect answer with an identified error tag
- WHEN feedback is produced
- THEN it names the misconception category without revealing the final answer

### Requirement: Deterministic Testability

The evaluator MUST be a pure function: given the same exercise and student answer, it MUST always return the same result. It MUST NOT depend on runtime state, random seeds, or display order. All evaluation logic MUST be testable without React, Next.js, Supabase, or DOM dependencies.

#### Scenario: evaluator produces consistent results across calls

- GIVEN the same exercise and student answer
- WHEN the evaluator is called 100 times
- THEN every call returns an identical result

#### Scenario: evaluator tests run without framework dependencies

- GIVEN a test file importing only from `src/domain/evaluator`
- WHEN the test runs via `pnpm run test`
- THEN it passes without importing React, Next.js, or browser APIs

### Requirement: Pluggable Polynomial Evaluator

When an exercise declares `evaluatorId: "polynomial"` (or its type is `symbolic` and the skill belongs to U2), the evaluator MUST delegate comparison to `polynomial-evaluator`. For exercises without this identifier, it MUST use the existing evaluation chain unchanged.

#### Scenario: U2-EVAL-001 — Routing to polynomial-evaluator

- GIVEN an exercise with `evaluatorId: "polynomial"` and expectedAnswer `"(x-2)(x+3)"`
- WHEN the student answers `"x^2 + x - 6"`
- THEN the result is `correct: true` (equivalence by expansion)

#### Scenario: U2-EVAL-002 — Routing by U2 skill

- GIVEN a `symbolic` exercise whose skillId is `mat.u2.operaciones_polinomios`
- WHEN the student answers a polynomial expression
- THEN evaluation uses `polynomial-evaluator` for comparison

#### Scenario: U2-EVAL-003 — Fallback for exercises without polynomial

- GIVEN a `numerical` U2 exercise without `evaluatorId: "polynomial"`
- WHEN the student answers
- THEN the existing evaluation chain (numeric) is used

### Requirement: Unit 2 Error Tagging

When a U2 answer is incorrect, `error-tagging.ts` MUST attempt to match against the `u2_*` patterns defined in the taxonomy. Matching MUST respect the existing contract: only tag if the exercise declares the tag in `commonErrorTags`.

#### Scenario: U2-EVAL-004 — U2 error tag assigned

- GIVEN a U2 exercise with `commonErrorTags: ["u2_signo_operacion"]`
- WHEN the student answers with inverted sign in a coefficient
- THEN the result includes `errorTag: "u2_signo_operacion"`

#### Scenario: U2-EVAL-005 — U2 error tag not declared

- GIVEN a U2 exercise without `u2_ruffini_signo_a` in `commonErrorTags`
- WHEN the student makes the Ruffini sign error
- THEN the result is incorrect WITHOUT error tag

### Requirement: Polynomial Equivalence Rules

The polynomial evaluator MUST apply these equivalence rules:

| Rule | Example |
|------|---------|
| Expanded ≡ factored | `(x-2)(x-3) ≡ x² - 5x + 6` |
| Sign flip | `-P(x) ≡ 0 - P(x)` |
| Integer scaling | `2·P(x) ≡ P(x) + P(x)` |
| Factor commutativity | `(x-2)(x+3) ≡ (x+3)(x-2)` |

The evaluator MUST reject: `1/0`, undefined forms, negative root under even index.

#### Scenario: U2-EVAL-006 — Factor commutativity

- GIVEN expectedAnswer `"(x-2)(x+3)"` and response `"(x+3)(x-2)"`
- WHEN evaluated
- THEN the result is `correct: true`

#### Scenario: U2-EVAL-007 — Undefined form rejected

- GIVEN a response containing division by zero
- WHEN attempting to parse
- THEN `PolynomialParseError` or `UnsupportedPolynomialFormError` is thrown

### Requirement: Telemetry Compatibility

Each U2 evaluation MUST emit the same telemetry as U1: `evaluationTimeMs`, `errorTags` (if incorrect), `partialCredit` (if applicable). The `EvaluationResult` format MUST NOT change.

#### Scenario: U2-EVAL-008 — Consistent telemetry

- GIVEN a U2 evaluation
- WHEN the result is inspected
- THEN it includes the same fields as a U1 evaluation

### Requirement: Unit 1 Regression Safety

U1 evaluators MUST NOT be modified. A regression test MUST exist that runs all U1 evaluator tests on the new build and confirms they still pass.

#### Scenario: U2-EVAL-009 — U1 regression

- GIVEN the full U1 evaluator test suite
- WHEN executed after U2 changes
- THEN all U1 tests pass without modifications
