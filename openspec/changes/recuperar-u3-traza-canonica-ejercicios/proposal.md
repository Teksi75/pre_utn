# Proposal: Recover U3 Canonical Trace Compatibility (Contracts + Parser)

## Intent

Recover the minimal optional `Exercise.canonicalTrace` layer without changing established U2 semantics. The general `ExerciseSourceUse` contract includes `alignment`; U3-only auditing may apply the narrower `adapted|reinforcement|reference` policy. `ChallengeExercise` remains an independent surface with its own source-use contract.

## Scope

### In Scope
- `src/domain/models/exercise.ts`: `ExerciseBaseShape`, `ExerciseCanonicalTrace`, `ExerciseSourceUse` (`adapted|reinforcement|reference|alignment`); `Exercise extends ExerciseBaseShape` + optional `canonicalTrace?`.
- `src/domain/catalog/challenges/types.ts`: `ChallengeExercise extends ExerciseBaseShape`.
- `src/domain/catalog/content-loaders.ts`: general parser accepts all four exercise literals and rejects challenge-only/unknown literals; a separate U3 audit rejects `alignment` only for U3 audit inputs.
- `src/domain/index.ts`: re-export the new public exercise types.
- `src/components/practice/ExerciseCard.tsx` and `src/components/exercises/ExerciseAnswerInput.tsx`: accept `ExerciseBaseShape` so the existing challenge path compiles. This only widens their accepted structural input; it changes no UI behavior.
- Focused tests cover optional/absent trace, general `alignment` compatibility, challenge-only rejection, U3-only narrowing, legacy content, and the unchanged challenge contract.

## Approach

TDD RED/GREEN/REFACTOR in a mandatory two-PR stacked chain: PR1 delivers shared contracts, exports, consumer prop widening, and contract tests; PR2, targeting PR1, adds parser/defaulting plus the independent U3 audit and their tests. No size exception.

## Affected Areas

- `src/domain/models/exercise.ts`
- `src/domain/catalog/challenges/types.ts`
- `src/domain/catalog/content-loaders.ts`
- `src/domain/index.ts`
- `src/components/practice/ExerciseCard.tsx`
- `src/components/exercises/ExerciseAnswerInput.tsx`
- `src/domain/__tests__/*` -- focused tests covering five scenarios

## Risks

- U2 regression -> general Exercise parser and type retain `alignment`; no U2 content migration occurs.
- Contract conflation -> `ChallengeExercise` keeps its own `ChallengeCanonicalTrace` and `ChallengeSourceUse` type.
- Loader silent-fail -> helper throws on malformed shapes or challenge-only/unknown literals; the U3 audit, not the loader, owns the U3 narrowing.
- PR > 400 lines -> mandatory `chained-pr` split; no size:exception
- Legacy content breaks -> TDD test: legacy load returns `undefined` for `canonicalTrace`

## Rollback Plan

Revert PR2 first (parser/defaulting and its tests), then PR1 (contracts, exports, widened consumer props, and tests). Mark STATUS `abandoned`; archived `recuperar-u3-fundacion-minima` and the read-only source stay immutable.

## Dependencies

Prerequisite `recuperar-u3-fundacion-minima` (merged `0cf2c51`). Read-only source `0f79d634843651366eb0ee8b0cb1467fb77f73de`. Clean base `08da4b2f23ad7aaa3bad6e35e260cbbb0c0b55d1` (`origin/main`, post PR #94).

## Success Criteria

- `pnpm run test`/`typecheck`/`build` green
- General Exercise contract accepts `adapted`, `reinforcement`, `reference`, and `alignment`; U3 audit rejects only `alignment` for U3 inputs.
- `Exercise.canonicalTrace` is optional; `ChallengeExercise` keeps its independent typed trace.
- Zero change to `validateTracePath`, `useChallengeFlow`, persistence, content JSON
- Mandatory two-PR stacked chain; each PR is <=400 changed lines; no size:exception
