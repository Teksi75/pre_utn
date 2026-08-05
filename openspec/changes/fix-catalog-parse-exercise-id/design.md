# Design: Fix Catalog parseExerciseId
## Approach
Add focused parameterized acceptance (numeric, slug-hyphen) and rejection (prefix, unit, empty segment) tests in `src/domain/__tests__/content-loaders.test.ts`, exclusively through public `applyExerciseDefaults`.
## Constraints
Strict TDD: write RED first; if it proves an existing specified contract violation, stop and reassess—no production edit. No PR2, `canonicalTrace`, U3, or GGA configuration changes; threat matrix N/A (no process boundary).
## Gates / Budget
Green requires `pnpm run test`, `pnpm run typecheck`, `pnpm run build`, and GGA; target ≤80 and hard cap ≤120 total changed lines (tests ~18 plus this 8-line design).
**Rollback:** Revert the single test-only commit; no migration, rollout, or interface change.
