# Apply Progress: Read-Only Previous Exercise View

**Change**: `practice-previous-exercise-readonly`
**Project**: `pre_utn`
**Mode**: Strict TDD
**Date**: 2026-06-08
**Status**: All 15 tasks complete

## Completed Tasks

### Phase 1: Foundation — Pure Answer-Mapping Helper
- [x] 1.1 RED — `submitted-answer-display.test.ts` (11 tests)
- [x] 1.2 GREEN — `submitted-answer-display.ts` with `mapSubmittedAnswer()`
- [x] 1.3 REFACTOR — Extracted `resolveOptionLabel()` helper

### Phase 2: Core — Snapshot State + Read-Only Component
- [x] 2.1 Added `PreviousExerciseSnapshot`, `ExerciseDraftState` interfaces + state
- [x] 2.2 Captured snapshot in `handleAnswerSubmit()` before answer discard
- [x] 2.3 Added `viewPreviousExercise()`, `returnToCurrentExercise()`, cleared on reset/skill change
- [x] 2.4 Created `SubmittedAnswerDisplay.tsx` — static markup, no inputs

### Phase 3: Integration — Wire UI and Lift Draft State
- [x] 3.1 Controlled draft props added to `ExerciseAnswerInput` (backward-compatible)
- [x] 3.2 `AnswerForm` forwards controlled draft props
- [x] 3.3 `PracticeExercisePhase` renders previous view or current form, with buttons
- [x] 3.4 `page.tsx` wired with snapshot, handlers, and draft props

### Phase 4: Verification
- [x] 4.1 `pnpm run test:run` — 60 files, 961 tests — all pass
- [x] 4.2 `pnpm run typecheck` — strict TypeScript, no errors
- [x] 4.3 `pnpm run build` — production build succeeds
- [x] 4.4 Manual/GGA — visually verified behavior

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `submitted-answer-display.test.ts` | Unit | N/A (new) | ✅ Written | ✅ 11/11 passed | ✅ 11 cases covering all types + fallback | ➖ N/A |
| 1.2 | `submitted-answer-display.ts` | Unit | N/A (new) | — | — | — | — |
| 1.3 | Same file | Unit | ✅ 11/11 | — | — | — | ✅ Extracted `resolveOptionLabel` |
| 2.1–2.3 | `previous-snapshot.test.ts` | Unit | ✅ 947/947 | ✅ Written | ✅ 3/3 passed | ➖ Structural (interfaces + state wiring) | ➖ None needed |
| 2.4 | `SubmittedAnswerDisplay.tsx` | Component | ✅ 961/961 | N/A (no RTL) | ✅ Build passes | ➖ Visual verified | ➖ Clean by design |
| 3.1–3.4 | Integration wiring | Integration | ✅ 961/961 | N/A (structural) | ✅ Typecheck + build + tests | N/A | ➖ Clean |

## Test Summary
- **Total tests written**: 14 (11 + 3)
- **Total tests passing**: 961 (947 pre-existing + 14 new)
- **Layers used**: Unit (14), Component (1, build-verified), Integration (manual/GGA)
- **Approval tests**: None — no refactoring tasks for existing production code
- **Pure functions created**: 3 (`mapSubmittedAnswer`, `resolveOptionLabel`, `createPreviousExerciseSnapshot`)

## Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| `src/components/exercises/submitted-answer-display.ts` | Created | Pure `mapSubmittedAnswer()` + `resolveOptionLabel()` helper |
| `src/components/exercises/__tests__/submitted-answer-display.test.ts` | Created | 11 unit tests covering all exercise types |
| `src/app/practice/previous-snapshot.ts` | Created | Interfaces + pure `createPreviousExerciseSnapshot()` |
| `src/app/practice/__tests__/previous-snapshot.test.ts` | Created | 3 unit tests for snapshot creation |
| `src/components/exercises/SubmittedAnswerDisplay.tsx` | Created | Static read-only display component |
| `src/app/practice/usePracticeFlow.ts` | Modified | Snapshot state, capture, view/return handlers, clear on reset |
| `src/app/practice/page.tsx` | Modified | Wire hook values to PracticeExercisePhase |
| `src/components/practice/PracticeExercisePhase.tsx` | Modified | Previous/current view rendering with buttons |
| `src/components/practice/AnswerForm.tsx` | Modified | Forward controlled draft props |
| `src/components/exercises/ExerciseAnswerInput.tsx` | Modified | Controlled draft mode with uncontrolled fallback |

## Deviations from Design
None — implementation matches design.

## Issues Found
None.

## Key Discoveries
1. Vitest Node environment cannot import `usePracticeFlow.ts` directly (heavy React/domain chain). Extracted `createPreviousExerciseSnapshot` into its own pure module (`previous-snapshot.ts`) for clean unit testing.
2. `ExerciseAnswerInput` controlled draft uses inline props (`draftAnswer`, `draftSelectedOption`, `onDraftChange`) instead of importing `ExerciseDraftState` from the practice module, avoiding cross-layer dependency.
3. No React Testing Library available — component rendering verified via `pnpm run typecheck` + `pnpm run build` + manual/GGA.
