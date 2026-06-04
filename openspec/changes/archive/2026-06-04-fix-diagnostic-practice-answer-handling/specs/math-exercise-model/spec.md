# Delta for Math Exercise Model

## MODIFIED Requirements

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
