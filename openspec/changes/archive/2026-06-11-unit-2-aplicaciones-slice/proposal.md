# Proposal: Unit 2 Aplicaciones Slice

## Intent

Complete the U2 skill chain by adding the last two skills: `mat.u2.mcm_mcd_polinomios` and `mat.u2.ecuaciones_fraccionarias`. These close the U2 curriculum, covering canonical PDF chapters 14-15. Both depend on the archived factorization infrastructure.

## Scope

### In Scope
- 6-10 exercises (3-5 per skill): MC, numerical, symbolic types
- 2 TheoryNodes in `content/matematica/theory/unit-2.json`
- 4-6 WorkedExamples in `content/matematica/examples/unit-2.json`
- 2-4 FeedbackMappings in `content/matematica/feedback/unit-2.json`
- 1-2 new error tags (`u2_denominador_cero`, `u2_confunde_mcm_mcd`) + detectors in `error-tagging.ts`

### Out of Scope
- New domain evaluator modules (existing polynomial-evaluator + routing guards cover all paths)
- Automated domain-exclusion checking (handled via MC distractors)
- `exercises.json` refactoring (deferred)

## Capabilities

### New Capabilities
- `mcm-mcd-polinomios`: MCM/MCD from factorized polynomials via MC and symbolic (polynomial-evaluator)
- `ecuaciones-fraccionarias`: Fractional equations via MC (domain-exclusion distractors) and numerical (single-solution)

### Modified Capabilities
- `math-error-taxonomy`: add `u2_denominador_cero`, `u2_confunde_mcm_mcd` with detection patterns
- `math-exercise-catalog`: add 6-10 U2 exercises with canonical references
- `math-skill-model`: exercise counts for both new skills (>= 3 each)
- `pedagogical-feedback-coverage`: FeedbackMapping entries for new tags

## Approach

Domain-code-minimal (Approach A). Reuse polynomial-evaluator and U2 routing guard. Ecuaciones domain checking via MC distractors — exercise design, not evaluator code. Replicate the 2-PR pattern from factorizacion-slice.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `content/matematica/exercises.json` | Modified | +6-10 exercises |
| `content/matematica/theory/unit-2.json` | Modified | +2 TheoryNodes |
| `content/matematica/examples/unit-2.json` | Modified | +4-6 WorkedExamples |
| `content/matematica/feedback/unit-2.json` | Modified | +2-4 FeedbackMappings |
| `src/domain/error-taxonomy/index.ts` | Modified | +1-2 error tags |
| `src/domain/evaluator/error-tagging.ts` | Modified | +1-2 detectors |
| `src/domain/__tests__/` | Modified | Detector + shape tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Ecuaciones numerical domain checking not automated | Med | MC for domain-sensitive equations; numerical only for unambiguous cases |
| mcm_mcd exercises feel thin | Low | Vary types and polynomial complexity |

## Rollback Plan

Revert merge commit. No migrations or breaking API changes. Content JSON additions are additive-only.

## Dependencies

- `unit-2-factorizacion-slice` (archived)
- `polynomial-evaluator-input-validation` (archived)

## Success Criteria

- [ ] All exercises pass catalog validation (type-answer, error tags, canonical refs)
- [ ] `pnpm run test`, `typecheck`, `build` green
- [ ] U2 chain complete through mcm_mcd + ecuaciones
- [ ] >= 3 exercises per new skill, increasing difficulty
