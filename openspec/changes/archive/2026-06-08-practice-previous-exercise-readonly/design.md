# Design: Read-Only Previous Exercise View

## Technical Approach

Implement a UI-only, session-scoped previous-submission snapshot inside `usePracticeFlow`. The snapshot is captured when `handleAnswerSubmit()` computes the `EvaluationResult` and generated feedback, before the answer string is discarded. The current exercise remains the source of progress; previous review is a sub-view, not a new practice phase, so `src/domain/` and persistence schemas stay unchanged.

To satisfy the “return preserves current exercise state” scenario, lift the in-progress current answer draft from `ExerciseAnswerInput` into `usePracticeFlow` via controlled props. Otherwise replacing the exercise view would unmount the input and lose unsent text/selection.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Add a new `PracticePhase` | More explicit, but pollutes the pure phase machine with UI-only navigation. | Do not change `phases.ts`; use `isViewingPreviousExercise` in the hook. |
| Persist answer text in `PracticeAttempt` | Enables history, but expands domain/storage scope and needs migration. | Keep one in-memory `PreviousExerciseSnapshot`; lost on refresh by design. |
| Add read-only mode to `ExerciseAnswerInput` | Reuses component but adds boolean-mode complexity and risks rendering form controls. | Create a dedicated submitted-answer display component/helper. |
| Leave answer draft local | Minimal code, but current answer is lost when previous view replaces the form. | Lift draft state to `usePracticeFlow` and pass controlled draft props. |

## Data Flow

```text
ExerciseAnswerInput ──draft changes──→ usePracticeFlow.currentAnswerDraft
        │
        └──submit(answer)──→ evaluateAnswer + generateFeedback
                              │
                              ├── setPreviousExerciseSnapshot({ exercise, submittedAnswer, evaluation, feedback })
                              ├── addAttempt(...) without answer text
                              └── phase = feedback

Current exercise ──Ver anterior──→ Previous view (snapshot only, no form)
Previous view ──Volver al ejercicio actual──→ Current exercise + preserved draft
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/practice/usePracticeFlow.ts` | Modify | Add `PreviousExerciseSnapshot`, `isViewingPreviousExercise`, view/return handlers, and controlled current draft state; clear all on `resetToSelect()` and skill change. |
| `src/app/practice/page.tsx` | Modify | Pass previous-view props to `PracticeExercisePhase`; render current or previous data according to hook state. |
| `src/components/practice/PracticeExercisePhase.tsx` | Modify | Compose current exercise form or read-only previous snapshot; show `Ver anterior` only when available and `Volver al ejercicio actual` only in previous view. |
| `src/components/practice/AnswerForm.tsx` | Modify | Forward controlled draft value/change props into `ExerciseAnswerInput`. |
| `src/components/exercises/ExerciseAnswerInput.tsx` | Modify | Support controlled draft state while preserving existing uncontrolled fallback for other callers. |
| `src/components/exercises/SubmittedAnswerDisplay.tsx` | Create | Render submitted answer as static content, including multiple-choice label/value mapping and true/false labels; no inputs or submit button. |
| `src/components/exercises/submitted-answer-display.ts` | Create | Pure helper to map `{ exercise, submittedAnswer }` to display rows for unit testing. |
| `src/components/exercises/__tests__/submitted-answer-display.test.ts` | Create | Unit tests for text, true/false, multiple-choice object labels, and fallback value display. |

## Interfaces / Contracts

```ts
interface PreviousExerciseSnapshot {
  readonly exercise: Exercise;
  readonly submittedAnswer: string;
  readonly evaluation: EvaluationResult;
  readonly feedback: string;
}

interface ExerciseDraftState {
  readonly answer: string;
  readonly selectedOption: string | null;
}
```

`SubmittedAnswerDisplay` MUST render static markup only. It MUST use `getOptionValue()` / `getOptionLabel()` to map submitted multiple-choice values back to labels, and the fixed `true`/`false` labels for true-false answers.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Snapshot shape, view toggles, reset behavior, draft preservation decisions | Extract pure reducer/helpers from `usePracticeFlow` if needed; Vitest node tests. |
| Unit | Submitted answer mapping for multiple-choice shuffled values | Test `submitted-answer-display.ts` helper directly. |
| Integration | No submit controls in previous view; buttons appear under correct conditions | If React Testing Library remains absent, document as manual/GGA check; otherwise add component tests. |
| Build | Strict TS and app compatibility | Later phases run `pnpm run test`, `pnpm run typecheck`, `pnpm run build`. |

## Migration / Rollout

No migration required. The feature is in-memory only and rolls back by removing the hook state, read-only display, and button wiring.

## Open Questions

None.
