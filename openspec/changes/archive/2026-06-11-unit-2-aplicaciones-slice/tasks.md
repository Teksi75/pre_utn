# Tasks: Unit 2 Aplicaciones Slice

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~430 (domain ~120 + content ~310) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Phase 1: tags+detectors) → PR 2 (Phases 2-4: content+verify) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Error tags + detectors + TDD tests | PR 1 | ~120 lines; standalone domain slice |
| 2 | Exercises, theory, examples, feedback, shape tests, build verify | PR 2 | ~310 lines; depends on PR 1 |

## Phase 1: Error Tags & Detectors (TDD)

- [x] 1.1 **RED**: Create `src/domain/__tests__/error-tagging-u2-aplicaciones.test.ts` with failing tests for `u2_denominador_cero` detector (MC exercise with denominator factor, student picks excluded value → returns tag) and `u2_confunde_mcm_mcd` detector (MC exercise asking MCM, student picks MCD option → returns tag)
- [x] 1.2 **GREEN**: Add `u2_denominador_cero` and `u2_confunde_mcm_mcd` entries to `src/domain/error-taxonomy/index.ts` with id, unit, description, examples
- [x] 1.3 **GREEN**: Implement `detectU2DenominadorCero()` and `detectU2ConfundeMcmMcd()` in `src/domain/evaluator/error-tagging.ts`; wire both into `tagError()` dispatch
- [x] 1.4 **VERIFY**: Run `pnpm run test` — all detector tests green; run `pnpm run typecheck`

## Phase 2: Exercises

- [x] 2.1 Add 3-5 `mat.u2.mcm_mcd_polinomios` exercises to `content/matematica/exercises.json` (IDs `ex.u2.mcm_mcd_polinomios.N`, ≥1 MC + ≥1 symbolic, difficulty 1-4, chapter 14 ref, `u2_confunde_mcm_mcd` in commonErrorTags)
- [x] 2.2 Add 3-5 `mat.u2.ecuaciones_fraccionarias` exercises to `content/matematica/exercises.json` (IDs `ex.u2.ecuaciones_fraccionarias.N`, ≥1 MC with domain-exclusion distractor + ≥1 numerical, chapter 15 ref, `u2_denominador_cero` in commonErrorTags)
- [x] 2.3 Update `src/domain/__tests__/exercises-u2-shape.test.ts`: add both new skills to `allU2Exercises()`, assert ≥3 exercises per skill, difficulty range, canonical refs, error tag presence

## Phase 3: Theory, Examples, Feedback

- [x] 3.1 Add 2 TheoryNodes to `content/matematica/theory/unit-2.json` (MCM/MCD concepts + ecuaciones fraccionarias concepts)
- [x] 3.2 Add 4-6 WorkedExamples to `content/matematica/examples/unit-2.json` (2-3 per skill, step-by-step solutions)
- [x] 3.3 Add 2-4 FeedbackMappings to `content/matematica/feedback/unit-2.json` for `u2_denominador_cero` and `u2_confunde_mcm_mcd` with pedagogical explanations

## Phase 4: Integration & Build Verification

- [x] 4.1 Run `pnpm run test` — full suite green including new detector tests, shape tests, taxonomy validation, skill-bank loading
- [x] 4.2 Run `pnpm run typecheck` — zero errors
- [x] 4.3 Run `pnpm run build` — production build succeeds
