# Design: Fix Diagnostic and Practice Answer Handling

## Technical Approach

Correct the exercise contract at the source: exercise definitions live in `content/matematica/exercises.json` and per-skill JSON files loaded by `src/domain/catalog/content-loaders.ts`; automated grading lives in pure domain evaluators under `src/domain/evaluator/*`. The change keeps `src/domain/` framework-free, adds catalog-level tests for answer-shape mismatches, converts ambiguous multi-solution answers to reliable multiple-choice where no robust evaluator exists, and adds presentation-layer option shuffling without changing the answer value submitted to `evaluateAnswer`.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Fix ambiguous roots | Convert `ex.u6.ceros_positividad_negatividad.1` from `numerical` to `multiple-choice` with options containing `x = -2, x = 2` and misconception-based distractors. | Keep `numerical`; add symbolic parser; accept several free-text aliases. | The expected answer is a set of two roots, not one number. Multiple-choice preserves the intent of identifying zeros without brittle free text or out-of-scope symbolic equivalence. |
| Audit mismatches | Add domain/catalog tests that scan all loaded exercise JSON and fail when `numerical` expected answers are not parseable finite numbers or when `multiple-choice` lacks/omits the expected answer. | Manually inspect only the three known IDs. | Prevents recurrence and safely flags `ex.u2.gauss.1` plus future catalog drift. |
| Similar fixes | Keep `ex.u3.ecuaciones_cuadraticas.1` as multiple-choice if its options contract passes; convert `ex.u2.gauss.1` to multiple-choice unless a system-solution evaluator is introduced later. | Rewrite both as symbolic/free-response. | Quadratic roots already use value selection; systems produce ordered pairs that exact text would grade unfairly. |
| Shuffle location | Shuffle only in `ExerciseAnswerInput.tsx` via an injected pure shuffle function/seed prop; submit the selected option string unchanged. | Mutate catalog order; shuffle in domain loader. | Runtime bias is UI concern. Keeping catalog stable supports deterministic tests and keeps domain pure. |

## Data Flow

```text
content/matematica/exercises.json
  -> domain catalog loaders / validators
  -> diagnostic or practice selects Exercise
  -> ExerciseAnswerInput shuffles display options
  -> selected option value
  -> evaluateAnswer(exercise, value)
```

## File Changes

| File | Action | Description |
|---|---|---|
| `content/matematica/exercises.json` | Modify | Correct known mismatches; add pedagogically plausible distractors for converted multiple-choice exercises. |
| `src/domain/__tests__/catalog-answer-contract.test.ts` | Create | TDD coverage for catalog-wide type/expectedAnswer/options consistency, including the three known IDs. |
| `src/domain/models/exercise.ts` | Modify | Tighten validation for numerical expected answers and option uniqueness if tests require model-level enforcement. |
| `src/domain/evaluator/index.ts` | Modify | Only if tests expose unsupported numeric/string behavior not already covered by `evaluateNumeric`. |
| `src/components/exercises/exercise-option-shuffle.ts` | Create | Pure deterministic shuffle helper usable by UI tests without React. |
| `src/components/exercises/ExerciseAnswerInput.tsx` | Modify | Memoize shuffled multiple-choice options per exercise and preserve selected answer by option value. |
| `src/components/exercises/__tests__/exercise-answer-state.test.ts` | Modify | Add deterministic shuffling/answer mapping tests if the helper is colocated here. |

## Interfaces / Contracts

```ts
type ShuffleRandom = () => number;
function shuffleExerciseOptions(
  options: readonly string[],
  random?: ShuffleRandom
): readonly string[];
```

Contract rules: `numerical.expectedAnswer` MUST parse to a finite number after the existing minus normalization; `multiple-choice.options` MUST contain `expectedAnswer`, SHOULD be unique, and UI MUST submit option values, never display indices.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Domain | Known IDs and catalog-wide answer contracts | RED tests in `src/domain/__tests__/catalog-answer-contract.test.ts` before changing JSON/model code. |
| Evaluator | Correct converted exercises grade by selected value | Extend `evaluator-index.test.ts` only for behavior not covered by catalog tests. |
| UI/helper | Option order changes while submitted value still maps correctly | Test pure shuffle helper with injected deterministic random; React UI tests only if current Vitest setup supports component rendering. |
| E2E | Not required | Add later only if a regression cannot be proven at unit/helper level. |

## Migration / Rollout

No data migration required. Existing progress snapshots keep exercise IDs; corrected future attempts will produce more reliable evidence. Rollback is restoring prior JSON and disabling UI shuffling while keeping validator tests as guardrails.

## Open Questions

- [x] `docs/sdd/13-adr-foundation.md` is referenced by the proposal but is absent in this checkout; implementation should either restore the ADR doc or update the reference during a documentation task. ✅ Restored from `utn-ingreso-app-spec/docs/sdd/13-adr-foundation.md`.
