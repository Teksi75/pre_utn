# Tasks: Fix Diagnostic and Practice Answer Handling

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~300–450 (data + audit test + shuffle helper + UI + tests) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (audit + data) → PR 2 (evaluator + model) → PR 3 (shuffle + UI) → PR 4 (diagnostic + docs) |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

## Phase 1 — Catalog Audit (Unit 1, strict TDD)

- [x] 1.1 RED: add `src/domain/__tests__/catalog-answer-contract.test.ts` asserting the catalog rejects `numerical` with multi-value/set notation; same test passes for the 3 known IDs after correction.
- [x] 1.2 RED: in the same file, assert `multiple-choice` has ≥3 unique options and the expected answer equals one of them.
- [x] 1.3 Run `pnpm run test` — confirm both tests fail on current JSON.
- [x] 1.4 GREEN: in `content/matematica/exercises.json` change `ex.u6.ceros_positividad_negatividad.1` to `multiple-choice` with `x = -2, x = 2` plus misconception distractors.
- [x] 1.5 GREEN: correct `ex.u3.ecuaciones_cuadraticas.1` and `ex.u2.gauss.1` per design rationale.
- [x] 1.6 GREEN + REFACTOR: re-run `pnpm run test`; extract option-shape helpers if duplication appears.

## Phase 2 — Evaluator + Model (Unit 2, TDD)

- [x] 2.1 RED: in `src/domain/__tests__/evaluator-index.test.ts` assert a `numerical` exercise with non-numeric expected answer returns a `ConfigurationError` result.
- [x] 2.2 GREEN: update `src/domain/evaluator/index.ts` (and `numeric.ts` if needed) to return the config-error result; keep domain framework-free.
- [x] 2.3 RED: in `src/domain/__tests__/exercise.test.ts` assert model validation rejects the 3 known mismatched shapes.
- [x] 2.4 GREEN: tighten `src/domain/models/exercise.ts` per `math-exercise-model` delta.
- [x] 2.5 REFACTOR: extract `isFiniteNumericAnswer` if duplication emerges; run `pnpm run test` + `pnpm run typecheck`.

## Phase 3 — Shuffle + UI (Unit 3, TDD)

- [x] 3.1 RED: create `src/components/exercises/exercise-option-shuffle.test.ts` covering seed reproducibility, per-call randomness, empty/single-option edges.
- [x] 3.2 GREEN: create `src/components/exercises/exercise-option-shuffle.ts` exporting `shuffleExerciseOptions(options, random?)` and `createSeededRandom(seed)`.
- [x] 3.3 RED: in `src/components/exercises/__tests__/exercise-answer-state.test.ts` assert shuffled options memoize per exercise id and selected value maps to the original option string.
- [x] 3.4 GREEN: modify `src/components/exercises/ExerciseAnswerInput.tsx` to import the helper, memoize per exercise id, and submit option value (never display index).
- [x] 3.5 Run `pnpm run test`, `pnpm run typecheck`, `pnpm run build`.

## Phase 4 — Diagnostic + Docs (Unit 4)

- [x] 4.1 RED: in `src/domain/__tests__/diagnostic.test.ts` assert diagnostic selection excludes exercises failing the audit or triggering evaluator config error.
- [x] 4.2 GREEN: update diagnostic selection in `src/app/diagnostic/page.tsx` (or its domain helper) to skip non-reliable exercises and exclude them from accuracy.
- [x] 4.3 Restore `docs/sdd/13-adr-foundation.md` (currently missing) or update proposal/spec references so the ADR pointer resolves.
- [x] 4.4 Add content guidelines note to `content/matematica/conventions.md` covering answer-type selection criteria.
- [x] 4.5 Run `pnpm run test`, `pnpm run typecheck`, `pnpm run build`.
