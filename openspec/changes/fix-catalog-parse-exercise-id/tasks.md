# Tasks: fix-catalog-parse-exercise-id
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low
- [x] 1.1 Safety baseline: confirm `main` is green via `pnpm test` + `pnpm typecheck` + `pnpm build` + GGA pre-commit; record pre-change state at `src/domain/__tests__/content-loaders.test.ts`.
- [x] 1.2 RED characterization: add parameterized acceptance (`ex.u3.operaciones_polinomios.4` + `ex.u2.mcm-mcd-polinomios.1`) and rejection (`exx.u3.polinomios.1`, `ex.u7.polinomios.1`, `ex.u3..1`, `ex.u3.polinomios.`) tests via public `applyExerciseDefaults`; expected RED = GGA 2.10.1 TDD finding clearance, NOT runtime failure if current contract already holds.
- [x] 2.1 GREEN focused: tests must pass against current `parseExerciseId` impl; if any `specs/math-exercise-catalog/spec.md` fixture fails → STOP, no production edit, reassess scope.
- [x] 3.1 Candidate gates passed: focused test green, full `pnpm test` green, `pnpm typecheck` green, `pnpm build` green, isolated GGA reproduction clean, diff scoped to `src/domain/__tests__/content-loaders.test.ts` only, changed lines ≤80 (hard cap ≤120). Publication, merge, and archive lifecycle are outside apply scope; `STATUS.json` remains `in-progress` until real merge to `main`.