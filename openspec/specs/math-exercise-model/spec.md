# Math Exercise Model Specification

## Purpose

Defines the exercise model used by the mathematics catalog and evaluator.

## Requirements

### Requirement: Exercise Identity and References

The system SHALL define an Exercise with ID, skill reference, type, difficulty, prompt, expected answer, and error tags. Exercise IDs MUST follow `ex.u{1-6}.{skill_slug}.{index}`.

#### Scenario: valid exercise is accepted

- GIVEN an exercise referencing an existing skill and valid error tags
- WHEN the exercise is validated
- THEN validation succeeds with the normalized exercise

#### Scenario: invalid references are rejected

- GIVEN an exercise references an unknown skill or error tag
- WHEN the exercise is validated
- THEN validation fails with the invalid reference

### Requirement: Exercise Type and Difficulty

The system MUST support exactly these exercise types: `multiple-choice`, `true-false`, `numerical`, `symbolic`, `fill-blank`, `matching`, `ordering`, `free-response`, `graphical`, and `structured`. Difficulty MUST be an integer from 1 to 5.

> (Previously: the supported-type list did not include `structured`; first consumer is U5-02.)

#### Scenario: supported types are accepted

- GIVEN one valid exercise for each supported type
- WHEN each exercise is validated
- THEN all validations succeed

#### Scenario: unsupported type or difficulty fails

- GIVEN an exercise with type `essay` or difficulty 0 or 6
- WHEN it is validated
- THEN validation fails with a type or difficulty error

### Requirement: Prompt and Answer Contract

Each exercise MUST include a student-facing prompt and an expected answer whose shape is valid for its declared type. An exercise whose answer represents a mathematical set, tuple, or multi-value solution MUST NOT declare type `numerical`; it MUST use `multiple-choice`, or a structured type whose evaluator accepts equivalent representations. Content MAY use canonical material when pedagogically justified; otherwise it SHOULD vary the source pattern to create additional practice value.

#### Validated type-answer pairs

| Type | Expected answer shape |
|------|----------------------|
| `numerical` | Single numeric value (integer or decimal) |
| `multiple-choice` | One of the declared `options` values (exact string) |
| `true-false` | Boolean alias (Spanish/English) |
| `symbolic` | Single symbolic expression or value (trimmed string match) |
| `fill-blank` | Short text (case-insensitive match) |

#### Scenario: missing evaluable data is rejected

- GIVEN an exercise without prompt or expected answer
- WHEN it is validated
- THEN validation fails listing the missing fields

#### Scenario: pedagogically transformed content is accepted

- GIVEN a prompt that practices the same skill pattern with changed wording and values
- WHEN the exercise is reviewed for catalog inclusion
- THEN it is allowed as transformed content

#### Scenario: multi-value answer with numerical type is rejected

- GIVEN an exercise with type `numerical` and expected answer `x = -2, x = 2`
- WHEN the exercise is validated
- THEN validation fails with a type-answer shape mismatch error

#### Scenario: multi-value answer converted to multiple-choice is accepted

- GIVEN an exercise with type `multiple-choice`, options containing the correct zero set, and expected answer matching one option
- WHEN the exercise is validated
- THEN validation succeeds

(Previously: the contract required an expected answer suitable for its type but did not enforce shape compatibility; exercises like `ex.u6.ceros_positividad_negatividad.1` could declare type `numerical` with a multi-value string answer.)

---

## Structured Answer Specification (from u5-02-medicion-angulos-y-arcos)

### Requirement: Structured Answer Specification

An exercise whose `type === "structured"` MUST declare an `answerSpec` discriminator with `kind` in `{ "pi-rational", "angle-dms" }` (only these two in this slice). `content-loaders.ts` MUST validate the discriminator at load time. No alias or retired structured kind is accepted.

| `kind` | Required fields | Bounds |
|---|---|---|
| `pi-rational` | `expected.numerator` (integer), `expected.denominator` (positive integer), `decimal` (finite number), `tolerance` (positive finite) | numerator ∈ ℤ; denominator ∈ ℤ, `> 0`, `≠ 0`; sign of the coefficient MUST live in the numerator |
| `angle-dms` | `expected.degrees` (integer), `expected.minutes` (integer), `expected.seconds` (finite), `tolerance` (positive finite) | minutes ∈ [0, 60); seconds ∈ [0, 60); total ≥ 0 |

Normalization rules: π-rational MUST reduce `gcd(|numerator|, denominator)` and place the sign in the numerator; `denominator === 0` MUST be rejected; non-integer numerator/denominator MUST be rejected. Angle-dms MUST accept non-negative totals only (signed DMS generalization is explicitly out of scope for this slice).

#### Scenario: pi-rational normalization reduces and signs the numerator

- GIVEN raw `{ numerator: -2, denominator: 8 }`
- WHEN the structured loader normalizes it
- THEN the stored expected is `{ numerator: -1, denominator: 4 }`
- AND the decimal `tolerance` is preserved unchanged

#### Scenario: pi-rational zero denominator rejected at load

- GIVEN a `pi-rational` `answerSpec` with `expected.denominator === 0`
- WHEN `content-loaders.ts` processes it
- THEN validation fails with a configuration error citing the offending exercise id

#### Scenario: angle-dms bounds enforced at load

- GIVEN an `angle-dms` `answerSpec` with `expected.minutes === 60` OR `expected.seconds === 60`
- WHEN `content-loaders.ts` processes it
- THEN validation fails with a configuration error

### Requirement: Canonical Versioned JSON Submission Format

Structured submissions MUST be serialized as versioned canonical JSON strings, preserving the existing string flow through `evaluateAnswer`, progress snapshots, and retries. The current schema is version 1 with two allowed shapes:

| `kind` | JSON shape |
|---|---|
| `pi-rational` | `{"v":1,"kind":"pi-rational","numerator":<int>,"denominator":<int>,"decimal":<number>}` |
| `angle-dms` | `{"v":1,"kind":"angle-dms","degrees":<int>,"minutes":<int>,"seconds":<number>}` |

The version field `v` MUST equal `1` in this slice. Unknown `kind`, missing `v`, or wrong field types MUST be treated as malformed submissions per existing error semantics. Future versions MUST be additive and MUST NOT change the meaning of `v=1`.

#### Scenario: pi-rational submission round-trips

- GIVEN exercise `ex.u5.medicion_angulos_y_arcos.1a` (kind `pi-rational`)
- WHEN a student submits `{"v":1,"kind":"pi-rational","numerator":1,"denominator":5,"decimal":0.6283}`
- THEN `evaluateAnswer` parses it as canonical JSON v1
- AND `pi-rational` evaluation runs against the expected `{1, 5, 0.6283, 0.0001}`

#### Scenario: angle-dms submission round-trips

- GIVEN `ex.u5.medicion_angulos_y_arcos.2d`
- WHEN a student submits `{"v":1,"kind":"angle-dms","degrees":11,"minutes":27,"seconds":33}`
- THEN `evaluateAnswer` parses it as canonical JSON v1
- AND `angle-dms` evaluation runs against `{11, 27, 33, 0.5}`

#### Scenario: malformed submission does not crash

- GIVEN any structured exercise
- WHEN the submission is `{"v":1,"kind":"pi-rational"}` (missing fields) OR an unparseable string
- THEN `evaluateAnswer` returns `incorrect` with feedback (or `configuration_error` when the malformed data is the expected spec, per existing error semantics)

### Requirement: Structured Spec Malformed at Load Returns Configuration Error

`content-loaders.ts` MUST validate every structured `answerSpec`. A malformed expected spec (unknown `kind`, missing required fields, out-of-bounds numeric values, wrong field types, or versioned `v` other than `1`) MUST cause the loader to surface a `configuration_error` and MUST NOT be promoted into the catalog. The error message MUST include the offending exercise id.

#### Scenario: unknown kind rejected at load

- GIVEN a structured exercise with `answerSpec.kind === "set-tuple"`
- WHEN the loader processes it
- THEN loading fails with a configuration error naming the exercise id
- AND the exercise is not present in the loaded catalog

#### Scenario: missing decimal in pi-rational rejected at load

- GIVEN a `pi-rational` `answerSpec` with no `decimal` field
- WHEN the loader processes it
- THEN loading fails with a configuration error naming the exercise id

### Requirement: Structured Submissions Coexist With Existing String Flow

The structured submission string MUST flow through the same inputs as multiple-choice/numerical answers: `evaluateAnswer(exercise, submittedString)`, progress snapshots, and the retry payload. The existing `submitted-answer-display` MUST render the canonical JSON in a human-readable row without changing its read-only display contract for other types.

#### Scenario: snapshot stores the canonical JSON string

- GIVEN a structured submission `{"v":1,"kind":"pi-rational","numerator":1,"denominator":5,"decimal":0.6283}`
- WHEN the practice flow records `PreviousExerciseSnapshot`
- THEN the snapshot's `submittedAnswer` field equals that exact string verbatim

#### Scenario: read-only display surfaces the structured fields

- GIVEN the same submission after grading
- WHEN `SubmittedAnswerDisplay` renders
- THEN it shows the coefficient (`1/5`), the decimal (`0.6283`), and any unit declared in the prompt
- AND it remains read-only (no edit affordance)
