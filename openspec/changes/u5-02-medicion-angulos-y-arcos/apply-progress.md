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
| 4 | Wiring (UNIT_5_SKILLS, PILOT_SKILLS, RAW_REGISTRY, UNIT_EXERCISE_FILES[5], catalog, UNIT_THRESHOLDS, learn page) | ⏳ In progress | pending |
| 5 | Flow/regression + FocusSelector + brand voice scan | pending | pending |

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