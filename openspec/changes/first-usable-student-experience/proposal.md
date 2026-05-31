# Proposal: First Usable Student Experience

## Intent

Deliver the first student practice loop with meaningful feedback. Current state: domain, evaluator, 30+ exercises exist — but evaluator returns generic "incorrect" without diagnosing *why*. No UI beyond placeholder.

## Scope

### In Scope
- ErrorTag auto-assignment in evaluator (domain-only, TDD)
- Guided practice UI: unit/skill selection → exercise → answer → tagged feedback
- Diagnostic shell: short skill-balanced selection → weak-skill estimation → practice suggestions

### Out of Scope
- Supabase persistence (local storage for now), Física, adaptive difficulty, teacher dashboard

## Capabilities

### New Capabilities
- `guided-practice`: Unit/skill selection, exercise display, answer input, tagged feedback → `openspec/specs/guided-practice/spec.md`
- `diagnostic-shell`: Balanced selection, accuracy-based skill estimation, weak-area suggestions → `openspec/specs/diagnostic-shell/spec.md`

### Modified Capabilities
- `math-answer-evaluator`: Add auto-assignment of `errorTag` via pattern matching against exercise's `commonErrorTags`. Spec defines behavior; implementation missing.

## Approach

**Phased PR chain** (each under 400 lines):

| PR | Scope | Lines |
|----|-------|-------|
| 1 | Domain: evaluator errorTag auto-assignment, strict TDD | ~150 |
| 2 | UI: guided practice (select → exercise → feedback) | ~300 |
| 3 | UI: diagnostic shell (selection → estimation → suggestions) | ~350 |

PR1 is prerequisite — both feedback and diagnostic depend on tagged errors.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/evaluators/` | Modified | Pattern-matching for errorTag |
| `src/domain/__tests__/` | Modified | TDD tests for patterns |
| `src/app/` | New | Practice and diagnostic routes |
| `src/components/` | New | Exercise cards, input, feedback |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Pattern matching brittleness | Medium | Start simple (sign, order-of-ops); iterate |
| Diagnostic too naive | Low | Ship accuracy-based v1; refine with data |
| Review budget exceeded | Low | Strict PR splitting per 400 lines |

## Rollback Plan

Each PR independently revertable. PR1: only affects evaluator return values. PR2/3: revert removes routes without breaking domain.

## Dependencies

- Existing math domain — already implemented, no external deps needed

## Success Criteria

- [ ] Evaluator returns correct `errorTag` for ≥5 error patterns
- [ ] Student can select unit → skill → exercise → see tagged feedback
- [ ] Diagnostic identifies weakest 2 skills from 6-10 exercises
- [ ] All existing tests pass; each PR under 400 lines
