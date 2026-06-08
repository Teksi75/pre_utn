## Exploration: Read-Only Previous Exercise View

### Current State

The guided practice flow is a **forward-only phase machine** managed by `usePracticeFlow` (`src/app/practice/usePracticeFlow.ts`). Phases: `select → theory → example → exercise → feedback → recovery → complete`.

**Exercise navigation**: `exerciseIndex` tracks position in `exercises[]`. `handleNextExercise()` increments the index and clears evaluation/feedback. There is no backward navigation between exercises — every `onBack` prop calls `resetToSelect()` which abandons the entire session.

**Answer persistence**: `PracticeAttempt` (domain model) stores `exerciseId`, `skillId`, `correct`, `errorTag`, `answeredAt`, `difficulty` — but **NOT the student's answer text**. The answer string is passed to `evaluateAnswer()` and then discarded.

**Component architecture**: `PracticeExercisePhase` composes `ExerciseCard` (read-only prompt display) + `AnswerForm` → `ExerciseAnswerInput` (manages local `answer`/`selectedOption` state, resets on `exercise.id` change).

### Affected Areas

- `src/app/practice/usePracticeFlow.ts` — Must track previous exercise data (exercise + answer) and expose navigation handlers.
- `src/components/practice/PracticeExercisePhase.tsx` — Must support a read-only mode that shows the exercise with the submitted answer but no submit capability.
- `src/app/practice/page.tsx` — Must conditionally render the "view previous" button and wire the read-only phase.
- `src/components/exercises/ExerciseAnswerInput.tsx` — May need a `readOnly` + `initialAnswer` mode, OR a separate display component for the submitted answer.
- `src/domain/progress/index.ts` — NOT affected if we keep answers in-memory only (session-scoped).

### Approaches

1. **In-Memory Previous Snapshot (Recommended)** — Store `{ exercise, answer }` in `usePracticeFlow` state whenever an answer is submitted. Add a `viewingPrevious` boolean and a `handleViewPrevious` / `handleBackToCurrent` toggle. Render `PracticeExercisePhase` in read-only mode.
   - Pros: Minimal surface area, no domain/schema changes, session-scoped (no stale data risk), reuses existing `ExerciseCard`.
   - Cons: Previous answer is lost on page refresh. Only one exercise back (not full history).
   - Effort: **Low**

2. **Extend PracticeAttempt with answerText** — Add `answerText: string` to `PracticeAttempt` in the domain model and localStorage schema. Enables full history review, not just one exercise back.
   - Pros: Enables richer future features (session review, mistake analysis). Persistent across refreshes.
   - Cons: Domain model change requires migration for existing stored data. Larger blast radius. Over-engineered for "reread last exercise."
   - Effort: **Medium**

3. **Post-Session Review Mode** — Add a separate review screen after `complete` phase showing all exercises + answers from the session.
   - Pros: Most comprehensive. Clear separation between practice and review.
   - Cons: Much larger scope. Requires storing all session answers. Different feature from what was requested.
   - Effort: **High**

### Recommendation

**Approach 1 (In-Memory Previous Snapshot)** is the right fit. The user request is narrow: "go back and reread the previous exercise, read-only." This is a session-scoped, single-step-back feature. No domain model changes needed. The implementation stays within `usePracticeFlow` + a read-only variant of `PracticeExercisePhase`.

Key design decisions:
- The "View previous exercise" button appears only when `exerciseIndex > 0` AND a previous answer exists.
- In read-only mode: show `ExerciseCard` + the submitted answer (rendered as static text or disabled input) + correct/incorrect indicator from the evaluation. No submit button.
- A "Back to current exercise" button returns to the active exercise.
- The previous snapshot is overwritten each time a new answer is submitted (only one step back, not full history).

### Risks

- **Answer text not currently persisted**: The `PracticeAttempt` model does not store the answer string. The hook must capture it at submission time (in `handleAnswerSubmit`) before it's discarded.
- **Multiple-choice answer display**: The submitted answer is the option value (e.g., "true", "42"), but the UI showed shuffled labels. The read-only view must map the value back to the original option label for display.
- **Phase machine complexity**: Adding a `viewingPrevious` sub-state to the `exercise` phase is cleaner than adding a new phase, but must be tested to avoid state machine bugs.

### Ready for Proposal

**Yes.** The scope is well-defined, the approach is low-risk, and the affected files are known. The orchestrator can proceed to `sdd-propose`.
