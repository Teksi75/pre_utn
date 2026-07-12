# Delta for Math Exercise Catalog

## ADDED Requirements

### Requirement: Optional Exercise canonicalTrace Parser

The exercise loader MUST expose `parseOptionalCanonicalTrace(raw: unknown, id: string): readonly ExerciseCanonicalTrace[] | null` as the canonical entry point that attaches an optional `canonicalTrace` to a parsed `Exercise`. The helper MUST return `null` (no trace attached) when `raw` is `undefined`, `null`, `[]`, or `{}`. It MUST return a parsed `readonly ExerciseCanonicalTrace[]` when `raw` is a single non-empty trace entry object OR a non-empty array of trace entry objects, in input order. It MUST accept every general `ExerciseSourceUse` literal, including `alignment`. Legacy content whose JSON omits `canonicalTrace` MUST load with no `canonicalTrace` field attached and no parse error.

`parseOptionalCanonicalTrace` MUST throw a parse error when any of the following holds:

| # | Rejection condition |
|---|---------------------|
| 1 | `raw` is present but is a non-object primitive (number, string, boolean). |
| 2 | An entry is missing a non-empty `path` or `pedagogicalIntent`. |
| 3 | An entry has `sourceUse` outside the general exercise set (`adapted`/`reinforcement`/`reference`/`alignment`) — including any challenge-only literal (`canonical-source`, `calibrated-from-exam`, `solution-pattern`) or any unknown value. |

#### Scenario: valid single or array trace parses as a typed array

- GIVEN `raw` is either a single non-empty trace entry object (e.g. `{ path: "UNIDAD3_matemática.pdf", section: "3.2", sourceUse: "reference", pedagogicalIntent: "..." }`) or a non-empty array of such entries
- WHEN `parseOptionalCanonicalTrace(raw, "ex.u3.x.1")` is called
- THEN the result is a 1-element or N-element `readonly ExerciseCanonicalTrace[]` in input order

#### Scenario: the four absence expressions return null with no error

- GIVEN `raw` is respectively omitted, `null`, `[]`, and `{}`
- WHEN `parseOptionalCanonicalTrace(raw, id)` is called for each shape
- THEN it returns `null` and no error is raised

#### Scenario: general alignment input is accepted

- GIVEN a trace entry whose `sourceUse` is `"alignment"`
- WHEN `parseOptionalCanonicalTrace(raw, id)` is called
- THEN it returns the typed trace without a parse error

#### Scenario: malformed or challenge-only input is rejected

- GIVEN `raw` matches any rejection condition (non-object primitive, entry missing `path` or `pedagogicalIntent`, or entry with challenge-only/unknown `sourceUse`)
- WHEN `parseOptionalCanonicalTrace(raw, id)` is called
- THEN it throws a parse error identifying the invalid shape
- AND no `canonicalTrace` is attached

### Requirement: U3-Only Trace Source-Use Audit

A U3-specific validator/audit MUST evaluate only exercises whose `skillId` belongs to Unit 3. For those audit inputs, `sourceUse` MUST be one of `adapted`, `reinforcement`, or `reference`; `alignment` MUST produce a U3 audit violation but MUST NOT make the general parser reject the entry. The audit MUST NOT inspect, reject, or migrate U2 exercises.

#### Scenario: U3 audit narrows without changing the general contract

- GIVEN a U3 exercise trace with `sourceUse: "alignment"` and a U2 exercise trace with the same literal
- WHEN the general parser and U3 audit run
- THEN both traces parse successfully
- AND only the U3 trace receives an audit violation
- AND the U2 trace is not inspected by that audit
