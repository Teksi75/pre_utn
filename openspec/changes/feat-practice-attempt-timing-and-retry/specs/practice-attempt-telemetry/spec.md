# Delta Spec — Practice Attempt Telemetry

**Change**: `feat-practice-attempt-timing-and-retry`
**Status**: done (merged to main, commit 6bedff1; verify fix in 00d20ea)
**Date**: 2026-06-10
**Capability modified**: `guided-practice`

## Purpose

Extend `PracticeAttempt` with timing (`timeMs`) and retry tracking (`attemptIndex`), add a "Reintentar este ejercicio" button with a pedagogical cap of 3, and fix `computeAccuracy`/`computeTrend`/`computeMasteryLevel` to deduplicate by last attempt per `exerciseId`. Resolves audit item H-22 and unblocks `PedagogyEvent`.

## Background

Audit items H-22, H-18, H-19 from Unidad 1 r2 review identified that `computeAccuracy` and `computeTrend` count all attempts per `skillId`, **including retries of the same `exerciseId`**. With retries enabled, a persistent learner who fails 2 times and then passes on the 3rd would have accuracy `0.33` for that exercise (3 attempts, 1 correct), when pedagogically the relevant metric is `1.0` (1 unique exercise, 1 correct).

The `PedagogyEvent` model (Entregable 5) was deferred, but its prerequisites (`timeMs` and `attemptIndex` per attempt) can be implemented now. This spec establishes the data foundation for `PedagogyEvent` while fixing the immediate metric accuracy issue.

## Requirements

### Requirement: PracticeAttempt extension (R1)

`PracticeAttempt` SHALL require `timeMs: number` and `attemptIndex: number` as part of the existing record. Both fields MUST be present on every attempt persisted to `localStorage` or computed in `addAttempt`. Range: `timeMs >= 0`, `attemptIndex >= 1`.

#### Scenario: New attempt has both fields

Given a fresh practice session
When the user submits an answer
Then the `PracticeAttempt` saved to `localStorage` MUST have `timeMs > 0` and `attemptIndex >= 1`.

### Requirement: Backward compatibility migration (R2)

`loadProgress` SHALL normalize old attempts that lack `timeMs` and `attemptIndex` to `timeMs: 0` and `attemptIndex: 1`. Old `localStorage` data MUST NOT break the app.

#### Scenario: Loading pre-A4 data

Given `localStorage` contains attempts without `timeMs` or `attemptIndex`
When the user opens the app
Then `loadProgress` returns a `PracticeProgress` where all attempts have `timeMs: 0` and `attemptIndex: 1`, and the UI loads without errors.

### Requirement: Invisible timer (R3)

The hook `usePracticeFlow` SHALL measure the time between "exercise shown" and "submit" using `performance.now()`. There MUST NOT be a visible countdown timer in the UI — telemetry is silent. The timer MUST start when the exercise becomes visible (in `handleNextExercise`, `handleNextExample`, and `handleRetryExercise`), NOT inside the 300ms `setTimeout` of `handleAnswerSubmit`.

#### Scenario: Timer starts on exercise shown

Given an exercise becomes visible
When the user reads and thinks about the answer for 20 seconds
And then submits
Then the `PracticeAttempt` persisted has `timeMs` close to 20000 (±300 for evaluation delay, which is constant and gets absorbed).

### Requirement: Automatic attemptIndex calculation (R4)

`addAttempt` SHALL calculate `attemptIndex` automatically by reading the `attemptIndexByExerciseId` Map in the hook, incrementing by 1, and storing the new value. The Map MUST be session-scoped (in-memory, not persisted) and reset when changing skills or refreshing the page.

#### Scenario: First attempt

Given the user has not yet attempted `ex.u1.x.1`
When they submit an answer (correct or wrong)
Then the persisted `attemptIndex` is `1`.

#### Scenario: Second attempt after retry

Given the user has 1 attempt for `ex.u1.x.1` and the warm legend or retry button is shown
When they click "Reintentar este ejercicio" and submit again
Then the persisted `attemptIndex` is `2`.

### Requirement: computeAccuracy deduplication (R5)

`computeAccuracy` SHALL filter attempts to the last one (by `attemptIndex`) per `exerciseId` per `skillId` before computing the ratio. The metric measures comprehension of unique exercises, not persistence across retries.

#### Scenario: Persistent learner

Given a skill with 5 unique exercises, the user attempted 3 of them twice each (always correct on 2nd try)
When `computeAccuracy` is called
Then it returns `1.0` (3 of 3 unique exercises correct), NOT `0.5` (6 of 12 submits correct).

### Requirement: computeTrend deduplication (R6)

`computeTrend` SHALL apply the same deduplication as `computeAccuracy` before comparing halves of the chronological order.

#### Scenario: Retry on second half

Given the user struggled early (first 2 attempts wrong) but improved with retries (later 3 attempts correct)
When `computeTrend` is called
Then it returns "improving" (based on unique-exercise accuracy, not raw submit count).

### Requirement: computeMasteryLevel counts unique exercises (R7)

`computeMasteryLevel` SHALL use the deduplicated attempt set when checking against `MASTERY_MIN_ATTEMPTS`. A learner who retries the same exercise 5 times MUST NOT reach "mastered" with that single exercise — they need 5 unique exercises attempted at >= 0.8 accuracy.

#### Scenario: Single exercise retries

Given the user retries the same exercise 5 times and gets it correct on the 5th try
When `computeMasteryLevel` is called
Then the level is "learning" (only 1 unique exercise, not 5), NOT "mastered".

### Requirement: Retry button (R8)

`PracticeFeedbackPhase` SHALL render a secondary "Reintentar este ejercicio" button when `!evaluation.correct` AND `attemptIndex < 3`. The button MUST be reachable via keyboard and have `aria-label` or visible text.

#### Scenario: After first wrong attempt

Given the user has submitted wrong on attempt #1
When the feedback phase renders
Then the "Reintentar este ejercicio" button is visible, and clicking it returns to the exercise phase with the same `currentExercise` and a reset form.

### Requirement: Warm legend at cap (R9)

`PracticeFeedbackPhase` SHALL render a warm legend card (reusing the amber `Card variant="accent"` pattern) with the text "Parecés estar con la cabeza en otro lado. Pasemos al siguiente y volvé a este después si querés." when `!evaluation.correct` AND `attemptIndex >= 3`. The retry button MUST NOT render in this state.

#### Scenario: After third wrong attempt

Given the user has submitted wrong 3 times for the same exercise
When the feedback phase renders
Then the retry button is NOT shown, and the warm legend card is displayed instead.

### Requirement: Retry flow reset (R10)

`handleRetryExercise` SHALL reset the answer draft (`currentAnswerDraft` to `{ answer: "", selectedOption: null }`), reset the `evaluation` and `feedbackMsg`, return to the `exercise` phase with the same `currentExercise`, and restart the solving timer. The retry MUST NOT advance the `exerciseIndex`.

#### Scenario: Click retry

Given the user is in `feedback` phase after a wrong attempt
When they click "Reintentar este ejercicio"
Then `phase` becomes `exercise`, `currentExercise` is unchanged, `currentAnswerDraft` is empty, the form is ready for a new answer, and the timer restarts.

### Requirement: Invalid time filtering (R11)

Metrics (`computeAccuracy`, `computeTrend`, `computeMasteryLevel`) SHALL exclude attempts with `timeMs < 100` (probable timer bug) or `timeMs > 600_000` (probable tab abandonment) from their calculations. The filtered attempts MUST still be persisted to `localStorage` for debugging.

#### Scenario: Suspicious time

Given an attempt with `timeMs: 50` (under 100ms threshold)
When `computeAccuracy` is called
Then the attempt is excluded from the count.

## Non-functional Requirements

### NFR1: Backward compat with localStorage

The app MUST load pre-A4 `localStorage` data without errors. The migration in `loadProgress` (R2) handles this.

### NFR2: Performance

The calculation of `attemptIndex` in `addAttempt` is O(n) per `exerciseId` in `attempts`. For a typical user with < 1000 attempts, this is sub-millisecond.

### NFR3: Session-scoped attemptIndex

The `attemptIndex` is session-scoped: a page refresh resets the cap to 0. This is a deliberate product decision: the warm legend incentivizes advancing, not punishing. Cross-session caps are deferred to `PedagogyEvent`.

### NFR4: Breaking semantic change

The change in `computeAccuracy` semantics (R5) is **breaking** from the model perspective. Documentation MUST be updated:
- JSDoc on `computeAccuracy`, `computeTrend`, `computeMasteryLevel` in `src/domain/progress/index.ts`.
- The comment on `MASTERY_MIN_ATTEMPTS` constant.
- A test assertion in `src/domain/__tests__/progress.test.ts` that explicitly validates the dedupe behavior.

## Out of Scope

- `PedagogyEvent` full implementation (Entregable 5) — deferred.
- Visible countdown timer in UI.
- "Tu ritmo" end-of-session stats — depends on `PedagogyEvent`.
- Migration to Supabase.
- Skill catalog or U1/U2 content changes.

## Acceptance Criteria

- [x] `pnpm run test:run` passes (1119 tests).
- [x] `pnpm run typecheck` passes.
- [x] `pnpm run build` passes.
- [x] All 106 U1 exercises function with new model.
- [x] A learner who fails 2x then passes 3rd: accuracy >= 0.5 for that exercise (not 0.33).
- [x] Retry button appears for attempts 1 and 2, warm legend for attempt 3.
- [x] GGA with `codex` provider validates (after timer bug fix and off-by-one fix in 00d20ea).
