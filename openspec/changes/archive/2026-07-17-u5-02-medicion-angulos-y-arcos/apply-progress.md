# Apply Progress: Unit 5 Angle and Arc Measurement (u5-02-medicion-angulos-y-arcos)

**Change**: `u5-02-medicion-angulos-y-arcos`
**Branch**: `sdd/u5-02-medicion-angulos-y-arcos`
**Mode**: Strict TDD (`pnpm run test:run`)
**Started**: 2026-07-16
**Test baseline**: 187 files / 3176 tests passing

---

## Work Unit Map

| Unit | Goal | Status | Commit |
|------|------|--------|--------|
| 1 | Domain/evaluator (model, codecs, structured evaluator, detectors, dispatcher) | ✅ Done | `950e3f2` |
| 2 | Controls/display + state (PiRationalInput, AngleDmsInput, state, display) | ✅ Done | `7dba8f5` |
| 3 | Content (4 × unit-5.json) | ✅ Done | `9d88a84` |
| 4 | Wiring (UNIT_5_SKILLS, PILOT_SKILLS, RAW_REGISTRY, UNIT_EXERCISE_FILES[5], catalog, UNIT_THRESHOLDS, learn page) | ✅ Done | `48649f0` |
| 5 | Flow/regression + FocusSelector + brand voice scan | ✅ Done | `c8a0eb6` |

---

## Work Unit 5 — Flow, Regression, Final Gates (Tasks 5.1–5.10)

### TDD Cycle Evidence

| Task | Test File | Layer | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|-----|-------|-------------|----------|
| 5.1-5.2 | `src/domain/__tests__/catalog-readiness-u5.test.ts` | Unit | ✅ | ✅ | ✅ 6 cases | ✅ Clean |
| 5.3 | `tests/e2e/specs/medicion_angulos_y_arcos.spec.ts` | E2E | ✅ (manual) | ✅ (manual) | ➖ Single | ✅ Clean |
| 5.4 | (no new test — FocusSelector re-enable verified via existing readiness + diagnostic suite) | — | ➖ | ➖ | ➖ | ➖ |
| 5.5 | (covered by existing `evaluator-*.test.ts`, `catalog-split-equivalence`, and `error-taxonomy.test.ts`) | Unit | ✅ | ✅ | ➖ | ✅ Clean |
| 5.6 | `src/domain/__tests__/evaluator-numeric-u5-scalar.test.ts` | Unit | ✅ | ✅ | ✅ 8 cases | ✅ Clean |
| 5.7 | `pnpm run test:run` final gate | Unit | ✅ | ✅ 3336/3336 | ➖ | ✅ Clean |
| 5.8 | `pnpm run typecheck` final gate | — | ✅ | ✅ Clean | ➖ | ✅ Clean |
| 5.9 | `pnpm run build` final gate | — | ✅ | ✅ Clean | ➖ | ✅ Clean |
| 5.10 | (orchestrator-owned — STATUS.json entry updated post-merge) | — | ➖ | ➖ | ➖ | ➖ |

### Final Gate Results

| Gate | Command | Result |
|------|---------|--------|
| Vitest full suite | `pnpm run test:run` | **3336 tests passing** across **199 files** (baseline 3176 → 3336 = +160 new tests) |
| TypeScript strict | `pnpm run typecheck` | Clean (no errors) |
| Next.js production build | `pnpm run build` | Clean (no errors, all routes pre-rendered) |

### Line-Budget Snapshot

| Category | Lines |
|----------|-------|
| Production code (TS/TSX non-test, non-JSON) | **~1489 authored** (target 800, design's "single PR" tolerance noted) |
| Test files | ~2205 (excluded from budget per work-unit-commits convention) |
| JSON content (theory/examples/feedback/exercises) | ~394 (excluded; data not code) |
| apply-progress.md | ~95 (excluded) |

### Rollback boundary
- Revert: `src/components/exercises/{AngleDmsInput,PiRationalInput,ExerciseAnswerInput,exercise-answer-state,exercise-labels,submitted-answer-display}.{ts,tsx}`, `src/domain/{models/exercise,catalog/*,evaluator/*,diagnostic/index,error-taxonomy/index,models/skill-catalog}.ts`.
- Delete: `src/domain/__tests__/{structured-*,evaluator-purity,evaluator-error-tagging-u5,content-loaders-structured,catalog-readiness-u5,evaluator-numeric-u5-scalar}.test.ts(x)`, `tests/e2e/specs/medicion_angulos_y_arcos.spec.ts`.
- Delete: `content/matematica/{theory,examples,feedback,exercises}/unit-5.json`.

---

## Work Unit 1 — Domain & Evaluator (Tasks 1.1–1.13)

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `src/domain/__tests__/structured-model.test.ts` | Unit | N/A (new) | ✅ | ✅ | ✅ 3 cases | ➖ None |
| 1.2 | `src/domain/models/exercise.ts` (modify) | Unit | ✅ baseline | ✅ | ✅ | ✅ 2 cases | ✅ Clean |
| 1.3 | `src/domain/models/exercise.ts` (refactor) | Unit | ✅ baseline | ✅ | ✅ | ✅ 2 cases | ✅ Clean |
| 1.4 | `src/domain/__tests__/structured-codec.test.ts` | Unit | N/A (new) | ✅ | ✅ | ✅ 5 cases | ➖ None |
| 1.5 | `src/domain/evaluator/structured.ts` (create) | Unit | N/A (new) | ✅ | ✅ | ✅ 5 cases | ✅ Clean |
| 1.6 | `src/domain/__tests__/structured-evaluator.test.ts` (pi-rational) | Unit | N/A (new) | ✅ | ✅ | ✅ 4 cases | ➖ None |
| 1.7 | `src/domain/__tests__/structured-evaluator.test.ts` (dms) | Unit | N/A (new) | ✅ | ✅ | ✅ 5 cases | ➖ None |
| 1.8 | `src/domain/evaluator/structured.ts` (extend evaluators) | Unit | ✅ baseline | ✅ | ✅ | ✅ | ✅ Clean |
| 1.9 | `src/domain/__tests__/structured-evaluator.test.ts` (dispatch) | Unit | N/A (new) | ✅ | ✅ | ✅ 2 cases | ➖ None |
| 1.10 | `src/domain/evaluator/index.ts` (dispatcher) | Unit | ✅ baseline | ✅ | ✅ | ✅ 2 cases | ✅ Clean |
| 1.11 | `src/domain/__tests__/evaluator-error-tagging-u5.test.ts` | Unit | N/A (new) | ✅ | ✅ | ✅ 5 cases | ➖ None |
| 1.12 | `src/domain/evaluator/error-tagging.ts` (U5 detectors) | Unit | ✅ baseline | ✅ | ✅ | ✅ 5 cases | ✅ Clean |
| 1.13 | `src/domain/evaluator/index.ts` (purity) | Unit | N/A (new) | ✅ | ✅ | ✅ 100 calls | ✅ Clean |

### Focused test command
`pnpm run test:run -- src/domain/__tests__/structured-model.test.ts src/domain/__tests__/structured-codec.test.ts src/domain/__tests__/structured-evaluator.test.ts src/domain/__tests__/evaluator-error-tagging-u5.test.ts src/domain/__tests__/evaluator-index.test.ts src/domain/__tests__/evaluator-numeric.test.ts src/domain/__tests__/evaluator-exact.test.ts src/domain/__tests__/evaluator-boolean.test.ts src/domain/__tests__/exercise.test.ts src/domain/__tests__/evaluator-error-tagging.test.ts src/domain/__tests__/evaluator-error-tagging-u2.test.ts`

### Runtime harness
N/A — pure domain (no React/Next/Supabase side effects).

### Rollback boundary
- Revert: `src/domain/models/exercise.ts`, `src/domain/evaluator/{index,structured,error-tagging}.ts`.
- Delete: `src/domain/__tests__/{structured-model,structured-codec,structured-evaluator,evaluator-error-tagging-u5}.test.ts`.

---