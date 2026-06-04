# Proposal: Fix Diagnostic and Practice Answer Handling

## Intent

Prevent valid student answers from being marked wrong due to mismatched exercise types, brittle text matching, or biased multiple-choice presentation. This protects diagnostic accuracy and practice fairness.

## Scope

### In Scope
- Audit math exercises whose `type` conflicts with `expectedAnswer`, starting with `ex.u6.ceros_positividad_negatividad.1`, `ex.u3.ecuaciones_cuadraticas.1`, and `ex.u2.gauss.1`.
- Convert ambiguous mathematical sets/solutions to structured answer types or multiple-choice unless a robust domain evaluator exists.
- Shuffle multiple-choice options at runtime while preserving deterministic evaluation by answer value.
- Document answer-type selection criteria for future catalog additions.

### Out of Scope
- Building a full symbolic algebra evaluator.
- Changing user progress/history storage beyond what is required by corrected answers.
- Physics content.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `math-exercise-model`: tighten the contract between exercise type and expected answer shape.
- `math-exercise-catalog`: require catalog validation/audit for type-answer mismatches and pedagogically plausible multiple-choice distractors.
- `math-answer-evaluator`: clarify that ambiguous sets must not rely on exact free-text matching without a domain evaluator.
- `guided-practice`: require runtime option shuffling for multiple-choice practice attempts.
- `diagnostic-shell`: ensure diagnostic attempts use answer types that produce reliable skill evidence.

## Approach

Follow the exploration recommendation: prefer data correction and multiple-choice conversion for high-ambiguity answers, add runtime shuffling for multiple-choice UI, and defer symbolic equivalence parsing. Specs should reference `docs/sdd/13-adr-foundation.md` and preserve the pure-domain boundary.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `content/matematica/exercises.json` | Modified | Correct mismatched types/answers and add distractors where converting to multiple-choice. |
| `src/domain/evaluator/*` | Modified | Keep evaluation deterministic; avoid treating non-numeric strings as numerical answers. |
| `src/components/exercises/ExerciseAnswerInput.tsx` | Modified | Support shuffled option display without leaking answer position. |
| `src/app/diagnostic/page.tsx` | Modified | Preserve reliable diagnostic grading with corrected answer contracts. |
| `src/components/practice/AnswerForm.tsx` | Modified | Present shuffled multiple-choice options during practice. |
| `openspec/specs/*` | Modified | Add behavior deltas for affected capabilities. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Poor distractors reduce learning value | Med | Base distractors on common error tags and canonical misconceptions. |
| Shuffling causes flaky tests | Med | Inject deterministic randomness or test option-set equivalence. |
| Incomplete audit leaves hidden mismatches | Med | Add validation/test coverage for all catalog exercises. |

## Rollback Plan

Revert the proposal/spec/implementation change set and restore prior `exercises.json` plus option rendering. If needed, temporarily disable runtime shuffling behind a small presentation-layer guard while keeping evaluator tests intact.

## Dependencies

- Canonical mathematics material and existing error taxonomy.
- TDD with `pnpm run test`, then `pnpm run typecheck`, `pnpm run build`.

## Success Criteria

- [ ] Known mismatches no longer fail valid answers due to type errors.
- [ ] Multiple-choice options are not position-biased at runtime.
- [ ] Catalog tests catch future type-answer mismatches.
- [ ] Domain evaluator remains framework-free and side-effect-free.
