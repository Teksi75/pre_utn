# Proposal: Fix parseExerciseId GGA blocker (test-only)
## Intent
Close GGA 2.10.1 domain-TDD gap at `parseExerciseId()` in `src/domain/catalog/content-loaders.ts`. No behavior/regex change unless RED proves established-contract violation. Direct prerequisite for PR to `main` and technical prerequisite for PR2 (`recuperar-u3-traza-canonica-ejercicios`); MUST NOT touch PR2 worktree/code/state.
## Scope
- In: parameterized acceptance + rejection tests in `src/domain/__tests__/content-loaders.test.ts` covering numeric IDs, slug-hyphen IDs, malformed prefix/unit/empty-segment.
- Out: production edits to `parseExerciseId`/`validateExercise`; PR2, canonicalTrace, U3, challenge, evaluator, UI, GGA config; regex tighten/share/refactor.
## Capabilities
New: None. Modified: None (test-only; `math-exercise-catalog` unchanged).
## Approach
Strict TDD: one parameterized acceptance + one parameterized rejection test at the existing boundary. Must pass green against current impl. Production edit only if RED reveals real contract bug → stop, reassess scope.
## Affected Areas
`src/domain/__tests__/content-loaders.test.ts` — Modified — Add ~18 boundary test lines.
## Risks / Rollback
RED reveals contract bug → stop, reassess scope (Low). Line-budget overrun → ~18 test lines + this artifact, <80/120 cap (Low). Revert single commit on `main`; test-only, trivial.
## Dependencies / Success
None. Tests cover numeric/slug-hyphen/malformed prefix/unit/empty-segment at boundary; green against current impl (no production edit); `pnpm test`/`typecheck`/`build` + GGA pre-commit green; total changed lines ≤80 (hard cap 120).
