# Delta for Math Exercise Catalog

## ADDED Requirements

### Requirement: U3 Exponenciales Bank Size and Append Discipline

The system MUST expose a bank for `mat.u3.exponenciales`
containing 15–19 exercises (target 17), append-only on this
skill. No other U3 skill (`traduccion_lenguaje_verbal`,
`ecuaciones_lineales`, `inecuaciones_*`, `recta`, `sistemas`,
`logaritmicas`) MAY be rewritten or repurposed.

#### Scenario: bank meets the target band

- GIVEN the catalog is loaded from `unit-3.json`
- WHEN `loadExercisesForSkill("mat.u3.exponenciales")` is enumerated
- THEN the count is `>= 15 AND <= 19` (target 17)

#### Scenario: append-only discipline

- GIVEN any U3 entry in `unit-3.json`
- WHEN the diff is reviewed
- THEN non-exponenciales U3 entries have no deletions/edits.

### Requirement: Stable Existing IDs with Allowed Difficulty Normalization

Entries `ex.u3.exponenciales.2`, `.3`, `.4`, `.5` MUST keep
their `id`, `skillId`, `prompt`, `expectedAnswer`, `type`,
`options`, `hints`, and `solution` stable. The only field
MAY be normalized on an existing entry is `difficulty`, only
when strictly necessary to keep the natural-ID sequence
non-decreasing after append, and only to the minimum value
required for monotonicity.

#### Scenario: prompts and answers unchanged

- GIVEN the four pre-existing entries `.2`–`.5`
- WHEN the change is applied
- THEN `prompt`, `expectedAnswer`, `type`, and `options`
  are unchanged byte-for-byte

#### Scenario: difficulty may be normalized when needed

- GIVEN the natural-ID sequence `.2=1, .3=3, .4=1, .5=3`
  would break monotonic progression after append
- WHEN the change is applied
- THEN any `difficulty` on `.2`–`.5` MAY be raised to the
  minimum value that keeps the sequence non-decreasing;
  no other field is altered.

### Requirement: U3 Exponenciales Technique Coverage

The new bank MUST cover at least 8 distinct exponential
technique families benchmarked against P39 of `03_ej_utn.pdf`.
Each appended entry MUST declare its family and procedure in
`pedagogicalNote`, and MUST NOT reproduce a canonical P39a–q
prompt or expected answer verbatim.

#### Scenario: at least 8 families present

- GIVEN the appended entries
- WHEN family descriptors are collected from `pedagogicalNote`
- THEN at least 8 distinct families are present

#### Scenario: no canonical copy

- GIVEN a candidate `prompt` and `expectedAnswer`
- WHEN compared against the literal P39a–q catalog
- THEN a verbatim match on either field is rejected

### Requirement: U3 Exponenciales Difficulty Coverage

The composed bank MUST include >= 1 entry at each difficulty
in `{1, 2, 3, 4}` and >= 2 entries at difficulty `5`. The
non-decreasing difficulty contract in
`difficulty-progression/spec.md` MUST hold when ordered by
natural numeric ID.

#### Scenario: difficulty spread

- GIVEN the composed bank filtered by difficulty
- WHEN counts are read at d = 1, 2, 3, 4, 5
- THEN each of 1–4 is `>= 1` and d = 5 is `>= 2`

#### Scenario: monotonic across natural IDs

- GIVEN the composed bank ordered by numeric ID
- WHEN `validateDifficultyProgression` runs
- THEN the difficulty sequence is non-decreasing

### Requirement: U3 Exponenciales Renderer-Supported Response Types

The new bank MUST use at least 3 of the 4 renderer-supported
types `multiple-choice`, `true-false`, `numerical`, `fill-blank`.
No other `type` MAY appear, so `ExerciseAnswerInput` never
triggers its unsupported-type fallback.

#### Scenario: only supported types appear

- GIVEN the appended entries
- WHEN `type` values are inspected
- THEN each value is in `{ multiple-choice, true-false,
  numerical, fill-blank }` AND distinct count `>= 3`

### Requirement: U3 Exponenciales Input Discipline

No appended entry MAY ask the learner to type, in free text,
roots, fractions with radicals, intervals, solution sets with
union or intersection, complex `a+bi` forms, dual `x = -2 or
x = 2` solutions, or full logarithmic expressions. Structured
or dual-solution answers MUST be rendered as `multiple-choice`
or `true-false` options (not `numerical`/`fill-blank`).

#### Scenario: structured answers are rendered

- GIVEN an appended entry whose answer would be a root,
  interval, dual solution, or log expression
- WHEN the entry is inspected
- THEN its `type` is `multiple-choice` or `true-false`, and
  the prompt avoids every forbidden free-text shape

## MODIFIED Requirements

*None.*

## REMOVED Requirements

*None.*

## RENAMED Requirements

*None.*
