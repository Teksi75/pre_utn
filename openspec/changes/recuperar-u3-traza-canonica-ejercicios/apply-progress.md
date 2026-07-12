# Apply Progress — PR1 Contracts

**Change**: `recuperar-u3-traza-canonica-ejercicios` · **PR slice**: PR1 contracts · **Branch**: `feat/u3-traza-canonica-contracts` (off `origin/main`, cleanBase `08da4b2f`) · **Mode**: Strict TDD · **Status**: GREEN — ready for orchestrator commit + PR

## Summary
Compilable contract seam: optional `Exercise.canonicalTrace` with general 4-value `ExerciseSourceUse` (U2-compatible, includes `alignment`); `ChallengeExercise extends ExerciseBaseShape` so the general trace and the challenge trace stay independent. New named `EvaluableExercise` structural contract (only the six fields the evaluator reads) lets both surfaces evaluate through the same `evaluateAnswer` path. The previous `as unknown as Exercise` bypass cast in `ChallengeFlow.tsx` is **removed** — `evaluateAnswer(challenge, ...)` now type-checks with no cast. No loader/parser/JSON/evaluator/store/U2/audit/PR2 changes.

## TDD Cycle Evidence
| Task | Test File | RED | GREEN |
|---|---|---|---|
| Add `EvaluableExercise` contract + re-export + evaluator signature change (`evaluator/index.ts`, `error-tagging.ts`) | `src/domain/__tests__/exercise-canonical-trace.test.ts` | ✅ TS2305 (`EvaluableExercise` missing) + TS2345 (`ChallengeExercise`→`Exercise`) | ✅ 12 tests pass + clean typecheck |
| Remove `as unknown as Exercise` cast in `ChallengeFlow.tsx` | same | ✅ Cast no longer compiles against the contract signature | ✅ Typecheck clean; no JSX change |

Safety net: ✅ 3168 pre-existing tests. Triangulate: ✅ both Exercise & ChallengeExercise + missing-field negative.

## Work Unit Evidence
- **Focused**: `pnpm vitest run src/domain/__tests__/exercise-canonical-trace.test.ts` → **12/12** passed (1 file).
- **Runtime**: `pnpm run test:run` → **3171/3171** passed (186 files); `pnpm run typecheck` → clean; `pnpm run build` → **11/11** routes compiled.
- **Rollback**: revert `exercise.ts` (EvaluableExercise), `evaluator/index.ts` + `error-tagging.ts` (signatures), `index.ts` (re-export), `ChallengeFlow.tsx` (cast restore), `tests/exercise-canonical-trace.test.ts`, 4 OpenSpec artifacts.

## Files Changed
Modified: `src/domain/models/exercise.ts` (+EvaluableExercise), `src/domain/evaluator/index.ts` + `error-tagging.ts` (signatures), `src/domain/index.ts` (re-export), `src/components/practice/challenges/ChallengeFlow.tsx` (cast removed).
Created: `src/domain/__tests__/exercise-canonical-trace.test.ts` (12 tests).
Modified artifacts: `apply-progress.md` + 3 spec files (line accounting).

## Remaining Tasks
- Commit proposal + model/challenge specs + design + STATUS — out of apply scope.
- PR2 (`feat/u3-traza-canonica-parser`): parser/defaulting + U3 audit.
- Post-apply merge lifecycle — outside the apply phase.

## Workload / PR Boundary
Chained PR slice (PR1 of 2); stacked-to-main. Final `git diff --shortstat` additions+deletions ≤400 — no size exception.
