# Delta for Challenge Exercises

## ADDED Requirements

### Requirement: Challenge Surface Composition

`ChallengeExercise` MUST extend `ExerciseBaseShape`, NOT `Exercise`, so the independent challenge surface keeps its own `ChallengeCanonicalTrace` and `ChallengeSourceUse` contract without colliding with the general Exercise trace contract. `ChallengeSourceUse` MUST remain exactly `"canonical-source" | "adapted" | "calibrated-from-exam" | "solution-pattern"`. `ChallengeCanonicalTrace` MUST keep `path`, `section`, `sourceUse`, and `pedagogicalIntent` all required. The challenge loader, challenge attempt store, `useChallengeFlow`, advanced readiness metric, and `pre-utn.advanced-practice.v1` MUST remain structurally unchanged. A `ChallengeExercise` instance MUST NOT be assignable to a parameter typed against `Exercise` directly (the base shape is shared, the trace field is not).

#### Scenario: ChallengeExercise is assignable to ExerciseBaseShape but not to Exercise

- GIVEN a `ChallengeExercise` value carrying `canonicalTrace: [{ path: "...", sourceUse: "canonical-source", ... }]`
- WHEN the value is assigned to a parameter typed `ExerciseBaseShape`
- THEN the assignment compiles
- AND the same value assigned to a parameter typed `Exercise` is rejected at compile time

#### Scenario: challenge surface keeps its 4-value sourceUse contract

- GIVEN the `ChallengeSourceUse` type and an existing challenge JSON entry declaring `sourceUse: "canonical-source"`
- WHEN the entry is loaded through the challenge loader
- THEN the entry loads successfully
- AND the same `"canonical-source"` value would be rejected by the general exercise-surface `parseOptionalCanonicalTrace` helper
- AND the U3-only audit does not redefine or inspect the challenge contract

#### Scenario: no runtime behavior change in the challenge flow

- GIVEN the existing challenge loader, advanced store, `useChallengeFlow`, and challenge UI components
- WHEN this change is applied
- THEN `loadChallengesForSkill(skillId)` returns the same challenges as before
- AND `pre-utn.advanced-practice.v1` and `pre-utn.practice.v1` are unchanged in shape and key
