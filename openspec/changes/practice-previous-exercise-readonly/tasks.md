# Tasks: Read-Only Previous Exercise View

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250–340 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | auto-chain (not triggered — low risk) |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Foundation — Pure Answer-Mapping Helper

- [x] 1.1 **RED** — Create `src/components/exercises/__tests__/submitted-answer-display.test.ts` with failing tests for: text answer, true/false labels, multiple-choice with shuffled options (maps stored value → displayed label), and fallback when option not found.
- [x] 1.2 **GREEN** — Create `src/components/exercises/submitted-answer-display.ts` exporting `mapSubmittedAnswer(exercise, submittedAnswer): DisplayRow[]`. Make all tests pass. Cover `ExerciseType` variants from domain.
- [x] 1.3 **REFACTOR** — Extract any duplicated label/value resolution into small pure helpers within the same file; keep 100% test coverage.

## Phase 2: Core — Snapshot State + Read-Only Component

- [x] 2.1 Add `PreviousExerciseSnapshot` interface and `ExerciseDraftState` interface in `src/app/practice/usePracticeFlow.ts`. Add state: `previousSnapshot`, `isViewingPreviousExercise`, `currentAnswerDraft`.
- [x] 2.2 In `handleAnswerSubmit()`, capture snapshot `{ exercise, submittedAnswer, evaluation, feedback }` **before** answer string is discarded. Overwrite on each submission.
- [x] 2.3 Add `viewPreviousExercise()` and `returnToCurrentExercise()` handlers. Clear `previousSnapshot` + `isViewingPreviousExercise` on `resetToSelect()` and skill change.
- [x] 2.4 Create `src/components/exercises/SubmittedAnswerDisplay.tsx` — static markup only, uses `mapSubmittedAnswer()`. No inputs, no submit button. Renders evaluation result indicator and feedback text.

## Phase 3: Integration — Wire UI and Lift Draft State

- [x] 3.1 Modify `src/components/exercises/ExerciseAnswerInput.tsx` to accept optional controlled `value` / `onChange` props while preserving uncontrolled fallback for other callers.
- [x] 3.2 Modify `src/components/practice/AnswerForm.tsx` to forward controlled draft props from `usePracticeFlow` into `ExerciseAnswerInput`.
- [x] 3.3 Modify `src/components/practice/PracticeExercisePhase.tsx`: render `SubmittedAnswerDisplay` + snapshot data when `isViewingPreviousExercise`; otherwise render current exercise form. Show `Ver anterior` button only when `previousSnapshot` exists. Show `Volver al ejercicio actual` button only in previous view.
- [x] 3.4 Modify `src/app/practice/page.tsx` to pass snapshot, view/return handlers, and draft props from hook to `PracticeExercisePhase`.

## Phase 4: Verification

- [x] 4.1 Run `pnpm run test:run` — all unit tests pass including new `submitted-answer-display` tests.
- [x] 4.2 Run `pnpm run typecheck` — strict TypeScript passes with no errors.
- [x] 4.3 Run `pnpm run build` — production build succeeds.
- [x] 4.4 Manual/GGA check: verify `Ver anterior` hidden on first exercise, visible after submission; previous view shows exercise + answer + result + feedback read-only; no submit controls present; `Volver al ejercicio actual` preserves draft state; snapshot cleared on page refresh.
