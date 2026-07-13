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
## PR2 Parser + U3 Audit — candidate · `feat/u3-traza-canonica-parser` → `main` (PR1 merged) · Strict TDD · implementation GREEN; final delegated build/verify pending.
**Cycle evidence**: safety net `pnpm vitest run src/domain/__tests__/exercise-canonical-trace.test.ts src/domain/__tests__/content-loaders.test.ts` → 80/80 passed; RED `pnpm vitest run src/domain/__tests__/exercise-canonical-trace-parser.test.ts` → exact `PASS (0) FAIL (14)` from missing parser/audit; GREEN same command → exact `PASS (14) FAIL (0)`.
| Task | Test | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|
| 2.1 | parser test | 14 failed | 14 passed | 4 absence shapes | focused suite green |
| 2.2 | parser test | 14 failed | 14 passed | object + ordered array | focused suite green |
| 2.3 | parser test | 14 failed | 14 passed | 4 general + 4 rejected sets | focused suite green |
| 2.4 | parser test | 14 failed | 14 passed | primitives + missing/empty fields + legacy | focused suite green |
| 2.5 | parser test | 14 failed | 14 passed | public catalog import | focused suite green |
| 2.6 | parser test | 14 failed | 14 passed | attach vs omit-own-property | focused suite green |
| 2.7 | parser test | 14 failed | 14 passed | U3 alignment vs allowed literals | focused suite green |
| 2.8 | parser test | 14 failed | 14 passed | U2 getter proves no inspection | focused suite green |
**Work unit evidence**: focused `pnpm vitest run src/domain/__tests__/exercise-canonical-trace-parser.test.ts src/domain/__tests__/exercise-canonical-trace.test.ts src/domain/__tests__/content-loaders.test.ts` → 94/94 passed; `pnpm run typecheck` → clean; runtime harness N/A (pure deterministic domain boundary). Rollback: revert the PR2 parser test, `content-loaders.ts`, `catalog/index.ts`, `u3-trace-audit.ts`, and these PR2 artifact/status deltas; PR1 contracts remain.

## PR2 final candidate gates (off `origin/main` 29c68328)
- focused (`pnpm vitest run …parser …trace …content-loaders`) → **PASS (94) FAIL (0)**.
- `pnpm run typecheck` → clean (`tsc --noEmit`, exit 0).
- `pnpm run test:run` → **3185/3185** PASS (187 files), exit 0, 66.46s.
- `pnpm run build` → Next.js 16.2.7 (Turbopack) compiled 11.8s, TypeScript 28.9s, **11/11 routes**, exit 0.
- `git diff --check` → no whitespace issues, exit 0.
- exact vs `origin/main` (uncommitted working tree): 5 tracked (+77/-14) + 2 new (+155/-0) → **+232/-14 = 246 changed lines** (within 400 budget).
- post-metadata (task 2.9 [x] + this evidence): **+243/-15 ≈ 258 changed lines** (small bump from 246 explained by 1 task checkbox flip + ~10 lines of evidence; still ≪ 400).
- 2.10 / 2.11 still `[ ]`: commit + post-apply review lifecycle not in apply scope.
