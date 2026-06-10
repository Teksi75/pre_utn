# Proposal: Practice Attempt Timing and Retry

**Change**: `feat-practice-attempt-timing-and-retry`
**Status**: done (merged to main)

## Intent

Extend `PracticeAttempt` with timing (`timeMs`) and retry tracking (`attemptIndex`), add a "Reintentar este ejercicio" button with a pedagogical cap of 3, and fix `computeAccuracy`/`computeTrend`/`computeMasteryLevel` to deduplicate by last attempt per `exerciseId`. Resolves audit item H-22 and unblocks `PedagogyEvent`.

## Scope

### In Scope
- `PracticeAttempt` model: add required `timeMs: number` and `attemptIndex: number`
- localStorage migration: old attempts default to `timeMs: 0`, `attemptIndex: 1`
- Invisible timer via `performance.now()` in `usePracticeFlow` (silent telemetry)
- "Reintentar este ejercicio" button in `PracticeFeedbackPhase` when `!correct && attemptIndex < 3`
- Warm legend at cap: "Parecés estar con la cabeza en otro lado. Pasemos al siguiente y volvé a este después si querés."
- `computeAccuracy`, `computeTrend`, `computeMasteryLevel` deduplicated by last `attemptIndex` per `exerciseId`
- Test migration: ~25 literal sites across 4 files + 2 new test files

### Out of Scope
- `PedagogyEvent` model (Entregable 5) — deferred
- Visible countdown timer
- "Tu ritmo" end-of-session stats — depends on `PedagogyEvent`
- Supabase migration
- Skill catalog or U1/U2 content changes

## Capabilities

### New Capabilities
- `practice-retry`: Retry button, attempt cap, warm legend, invisible per-exercise timer

### Modified Capabilities
- `guided-practice`: `PracticeAttempt` gains `timeMs` + `attemptIndex`; accuracy/trend/mastery deduplicate by last attempt per `exerciseId`

## Approach

Required fields + factory migration. `loadProgress` normalizes old data at boundary. `computeAccuracy` filters to last attempt per `exerciseId` before computing ratio. Timer starts at exercise shown (not at submit) to avoid measuring the 300ms evaluation `setTimeout`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/progress/index.ts` | Modified | Add fields to `PracticeAttempt`; dedupe `computeAccuracy`, `computeTrend`, `computeMasteryLevel` |
| `src/lib/practice-progress.ts` | Modified | Normalize old attempts in `loadProgress`; populate new fields in `addAttempt` |
| `src/app/practice/usePracticeFlow.ts` | Modified | Timer via `performance.now()` (started in `handleNextExercise`/`handleNextExample`/`handleRetryExercise`); `handleRetryExercise` handler |
| `src/components/practice/PracticeFeedbackPhase.tsx` | Modified | Retry button + warm legend |
| `src/app/practice/page.tsx | Modified | Wire `onRetry` + `attemptIndex` props |
| 4 test files | Modified | Factory defaults + literal updates |
| 2 new test files | New | `usePracticeFlow.retry.test.ts`, `PracticeFeedbackPhase.retry.test.ts` |

## Risks (and how they were resolved)

| Risk | Resolution |
|------|------------|
| ~25 test sites break with required fields | Factory migration via `makeAttempt()` |
| `computeAccuracy` semantic change breaks downstream consumers | Dedupe by last attempt per `exerciseId`; explicit test assertions for retry scenarios |
| Session indicator resets on page refresh | Acceptable for MVP; deferred to `PedagogyEvent` |
| Retry cap resets on refresh (session-scoped) | Warm legend nudges forward; `PedagogyEvent` can add cross-session caps |
| Timer measuring evaluation delay instead of solving time | Detected by GGA with codex; fixed in commit ccee069 by starting timer on exercise shown |
| Off-by-one in `canRetry` wiring in `page.tsx` | Detected by verify; fixed in commit 00d20ea |
| Forecast 478 lines, actual 1241 lines | size:exception approved by user |

## Product Decisions (Validated)

1. Retry button in `PracticeFeedbackPhase` when `!correct && attemptIndex < 3`
2. Cap of 3 attempts (2 retries) with warm legend after the 3rd
3. Invisible timer via `performance.now()` — no visible countdown
4. `timeMs` and `attemptIndex` required; old data migrated with defaults
5. Backward compat follows existing `loadProgress` pattern
6. Single PR with size:exception (was originally chained PRs)

## Success Criteria

- [x] `pnpm run test:run` passes (1119 tests)
- [x] `pnpm run typecheck` passes
- [x] `pnpm run build` passes
- [x] All 106 U1 exercises function with new model
- [x] Student who fails 2x then passes 3rd: accuracy >= 0.5 for that exercise (not 0.33)
- [x] Retry cap of 3 enforced (after off-by-one fix in 00d20ea)
