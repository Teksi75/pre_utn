# Delta for Math Exercise Model

## ADDED Requirements

### Requirement: Exercise Base Shape and Optional Trace

The exercise model MUST expose `ExerciseBaseShape` with the shared structural fields (id, skillId, type, difficulty, prompt, expectedAnswer, commonErrorTags, pedagogicalNote, unit, options?, category?, tags?). `Exercise` MUST extend `ExerciseBaseShape` and MAY carry an optional `canonicalTrace?: readonly ExerciseCanonicalTrace[]`. The compatible general `ExerciseSourceUse` MUST be exactly `"adapted" | "reinforcement" | "reference" | "alignment"`. `ExerciseCanonicalTrace` MUST contain `path: string`, optional `section?: string`, `sourceUse: ExerciseSourceUse`, and `pedagogicalIntent: string`. Legacy entries whose JSON omits `canonicalTrace` MUST load with no `canonicalTrace` field attached; the four absence expressions `undefined`, `null`, `[]`, and `{}` are all valid no-trace and MUST NOT raise a parse error.

#### Scenario: the four absence expressions load as no-trace

- GIVEN exercise JSON entries whose `canonicalTrace` is respectively omitted, `null`, `[]`, and `{}`
- WHEN each entry is parsed and defaults are applied
- THEN the resulting `Exercise` has no `canonicalTrace` property attached
- AND no parse error is raised for any of the four shapes

#### Scenario: trace entry is typed against the compatible general sourceUse set

- GIVEN a JSON entry with `canonicalTrace: [{ path: "UNIDAD3_matemática.pdf", section: "3.2", sourceUse: "reference", pedagogicalIntent: "..." }]`
- WHEN the entry is parsed
- THEN the resulting `Exercise.canonicalTrace` contains one `ExerciseCanonicalTrace` with `sourceUse: "reference"`

#### Scenario: U2-compatible alignment remains assignable

- GIVEN a trace entry with `sourceUse: "alignment"`
- WHEN it is assigned to `ExerciseCanonicalTrace.sourceUse`
- THEN the TypeScript type checker accepts the assignment
- AND this change does not require a U2 content migration

#### Scenario: challenge-only sourceUse literal is not assignable to ExerciseCanonicalTrace

- GIVEN a value with `sourceUse: "canonical-source"` (or `calibrated-from-exam`, `solution-pattern`)
- WHEN assignment to `ExerciseCanonicalTrace.sourceUse` is attempted
- THEN the TypeScript type checker rejects the assignment
- AND the runtime parser rejects the same shape with a parse error naming the challenge-only literal
