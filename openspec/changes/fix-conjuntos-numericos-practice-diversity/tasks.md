# Tasks: fix-conjuntos-numericos-practice-diversity

## Phase 1: Identify and Fix Duplicates

- [x] 1.1 Replace `cn-cla-01` (duplicate of cn-per-01: "number 5") → new exercise about -2/3 (rational, smallest set Q)
- [x] 1.2 Replace `cn-cla-02` (duplicate of cn-per-02: "number -3") → new exercise about -7 (integer, smallest set Z)
- [x] 1.3 Replace `cn-cla-04` (duplicate of cn-per-03: "√9") → new exercise about √2 (irrational, smallest set R\Q)
- [x] 1.4 Replace `cn-cla-10` (duplicate of cn-per-04: "0,75") → new exercise about -0.5 (rational decimal, smallest set Q)

## Phase 2: Verify Exercise 22

- [x] 2.1 Verify exercise 22 answer correctness — original cn-cla-10 about 0.75 had correct answer (Q and R). New exercise 22 about -0.5 also correct (-0.5 = -1/2 ∈ Q).

## Phase 3: Verify and Test

- [x] 3.1 Run `pnpm run test` — 730/730 passed
- [x] 3.2 Run `pnpm run typecheck` — clean
- [x] 3.3 Run `pnpm run build` — success

## Review Workload Forecast

- 400-line budget risk: Low (data-only change, ~100 lines modified)
- Chained PRs recommended: No
- Decision needed before apply: No
