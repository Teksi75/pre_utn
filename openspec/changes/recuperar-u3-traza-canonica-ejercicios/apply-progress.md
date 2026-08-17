# Apply Progress — PR1 + PR2 Closeout

**Change**: `recuperar-u3-traza-canonica-ejercicios` · **Delivery**: two PRs, stacked-to-main · **Mode**: Strict TDD · **Status**: implementation, review, and publication lifecycle complete — apply `all_done`; native verify handoff awaits review-path reconciliation

## Summary
Compilable contract seam: optional `Exercise.canonicalTrace` with general 4-value `ExerciseSourceUse` (U2-compatible, includes `alignment`); `ChallengeExercise extends ExerciseBaseShape` so the general trace and the challenge trace stay independent. PR1 also introduced the named `EvaluableExercise` structural contract so both surfaces use the same evaluator path without the previous bypass cast. PR2 added optional trace parsing/defaulting plus an isolated U3-only source-use audit. No content JSON, U2 migration, persistence, challenge contract, or UI behavior changed.

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

## Lifecycle Status
- PR1 contracts: commit `d12f61f`, PR #97, merged to `main` as `d03010ef8f1b5a27d72e3c4c74cef894682085ff`.
- PR2 parser + U3 audit: commit `d4c77a5`, fresh review lineage `review-bee22a9f19c068c4`, PR #98, merged to `main` as `e553648079cd7b6f9864683d4ab4d694b4f6a8e7`.
- Issue #95 remains open for final archive publication; native `sdd-status` requires review-path reconciliation before `sdd-verify`.

## Workload / PR Boundary
Both stacked-to-main work units are published. PR1 final diff: **400 changed lines**; PR2 final diff: **277 changed lines**. Both stayed within the hard budget with no size exception.
## PR2 Parser + U3 Audit — published · `feat/u3-traza-canonica-parser` → `main` · Strict TDD · implementation and final gates GREEN.
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

## PR2 final implementation gates (commit `d4c77a5`, off `origin/main` `29c68328`)
- focused (`pnpm vitest run …parser …trace …content-loaders`) → **PASS (94) FAIL (0)**.
- `pnpm run typecheck` → clean (`tsc --noEmit`, exit 0).
- `pnpm run test:run` → **3185/3185** PASS (187 files), exit 0, 66.46s.
- `pnpm run build` → Next.js 16.2.7 (Turbopack) compiled 11.8s, TypeScript 28.9s, **11/11 routes**, exit 0.
- `git diff --check` → no whitespace issues, exit 0.
- final PR #98 diff: **262 additions + 15 deletions = 277 changed lines** across 8 files; within the 400-line budget, no size exception.
- fresh review lineage `review-bee22a9f19c068c4` completed before publication; PR2 commit `d4c77a5` merged as `e553648079cd7b6f9864683d4ab4d694b4f6a8e7`.
