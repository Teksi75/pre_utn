# Proposal: Read-Only Previous Exercise View

## Intent

Let students briefly reread the immediately previous practice exercise, their submitted answer, result, and available feedback without reopening submission. This supports reflection during guided practice while preserving the forward-only learning flow. Aligns with ADR-007 (pedagogical impact for students/teachers) and ADR-008 (SDD/TDD/ENGRAM/GGA).

## Scope

### In Scope
- Add a `Ver anterior` control when an immediately previous submitted exercise exists.
- Render previous exercise, submitted answer, correct/incorrect result, and available feedback in read-only mode.
- Add `Volver al ejercicio actual` to return to the active exercise.
- Keep the snapshot session-scoped and in memory only.

### Out of Scope
- Full practice session history or post-session review mode.
- Editing/resubmitting previous answers.
- Persisting answer text in `PracticeAttempt`, localStorage, Supabase, or domain schemas.
- Changing answer evaluation behavior.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `guided-practice`: allow a read-only, one-step previous exercise review during active practice.

## Approach

Use the exploration recommendation: capture an in-memory previous snapshot in `usePracticeFlow` when an answer is submitted, before the answer string is discarded. Track a UI-only “viewing previous” state under the practice exercise flow. Reuse existing exercise display where possible; introduce a read-only submitted-answer display instead of enabling `AnswerForm`. Preserve shuffled multiple-choice display by mapping stored option value back to the displayed option label/value.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/practice/usePracticeFlow.ts` | Modified | Store previous snapshot and expose view/return handlers. |
| `src/app/practice/page.tsx` | Modified | Wire buttons and conditional previous/current rendering. |
| `src/components/practice/PracticeExercisePhase.tsx` | Modified | Support read-only rendering for previous submission. |
| `src/components/exercises/ExerciseAnswerInput.tsx` | Modified | Add or bypass read-only answer display safely. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Previous answer is lost before capture | Med | Capture inside submit handler before evaluation state resets. |
| Read-only UI accidentally permits resubmission | Med | Do not render submit controls in previous view; test disabled path. |
| Multiple-choice value looks unclear after shuffle | Med | Display the stored selected value with matching option label where available. |

## Rollback Plan

Remove the previous-view state, buttons, and read-only rendering branch. Existing forward-only practice remains unchanged because no domain or persistence schema changes are introduced.

## Dependencies

- Existing `guided-practice` spec and practice flow components.
- Testing with `pnpm run test:run`, `pnpm run typecheck`, and `pnpm run build` in later phases.

## Success Criteria

- [ ] `Ver anterior` appears only after a prior submitted exercise exists.
- [ ] Previous view shows exercise, submitted answer, result, and feedback read-only.
- [ ] User can return with `Volver al ejercicio actual` without losing current exercise state.
- [ ] No answer persistence or domain model changes are required.
