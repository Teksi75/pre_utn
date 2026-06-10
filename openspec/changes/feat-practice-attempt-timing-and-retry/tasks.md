# Tasks — feat/practice-attempt-timing-and-retry

**Status**: All 19 tasks completed across 2 PRs (PR1 + PR2, both merged).
**Final**: 1241 lines diff + 9 lines off-by-one fix = 1250 total.
**Strategy**: Chained PRs (stacked-to-main) → final single PR with size:exception.

## PR1 — Domain + Persistence (✅ merged at 15a39b6)

- [x] **T1.1** — Extend `PracticeAttempt` with `timeMs` + `attemptIndex` (required fields, model pure)
- [x] **T1.2** — Normalize legacy attempts in `loadProgress` (backward compat: `timeMs: 0`, `attemptIndex: 1`)
- [x] **T1.3** — Helper `deduplicateByLastAttemptPerExercise` in `src/domain/progress/`
- [x] **T1.4** — `computeAccuracy` deduplicated + invalid time filter (`<100ms`, `>600_000ms`)
- [x] **T1.5** — `computeTrend` deduplicated
- [x] **T1.6** — `computeMasteryLevel` counts unique exercises (not submits) for `MASTERY_MIN_ATTEMPTS`
- [x] **T1.7** — Migrate `practice-progress.test.ts`, `accessibility.test.ts`, `study-plan.test.ts`, `next-step.test.ts` literals
- [x] **T1.8** — New tests: `addAttempt` with `timeMs`/`attemptIndex`, `loadProgress` with partial legacy data
- [x] **T1.9** — Gate: 1065 tests pass, typecheck clean, build 7 routes

## PR2 — UI + Hook (✅ merged at 6bedff1; timer fix ccee069; off-by-one fix 00d20ea)

- [x] **T2.1** — `attemptIndexByExerciseId` Map + `exerciseStartTimeRef` in `usePracticeFlow`
- [x] **T2.2** — `handleAnswerSubmit` uses `performance.now()` + `resolveNextAttemptIndex` (bridge removed, timer fixed)
- [x] **T2.3** — `handleRetryExercise` handler in `usePracticeFlow`
- [x] **T2.4** — `PracticeFeedbackPhase`: retry button (secondary) + warm legend with new props `onRetry`, `attemptIndex`, `canRetry`
- [x] **T2.5** — Warm legend text exact match: "Parecés estar con la cabeza en otro lado. Pasemos al siguiente y volvé a este después si querés." (amber card, `role="status"`)
- [x] **T2.6** — `page.tsx` wires retry props (with off-by-one fix in 00d20ea)
- [x] **T2.7** — Hook tests: 29 tests in `usePracticeFlow.retry.test.ts` (pure logic + source assertions)
- [x] **T2.8** — Component tests: 19 tests in `PracticeFeedbackPhase.retry.test.ts` (pure logic + source assertions)
- [x] **T2.9** — Render safety: `conjuntos-render-safety.test.ts` intact
- [x] **T2.10** — Gate: 1119 tests pass (final), typecheck clean, build 7 routes

## Chained PRs (delivered)

- **PR1**: `feat/practice-attempt-timing-and-retry-domain` → `main`. Self-contained, mergeable.
- **PR2**: `feat/practice-attempt-timing-and-retry-ui` → `main`. Replaces PR1 bridge, adds UI/hook.

**Strategy**: stacked-to-main, then both merged. PR1 was self-contained, PR2 depended on the PR1 model changes (replacing the bridge).

## Commits (chronological)

1. `259f4e9` — feat(domain): add timeMs and attemptIndex to PracticeAttempt model
2. `2c35816` — feat(persistence): normalize legacy attempts in loadProgress
3. `3db5a58` — feat(domain): add deduplicateByLastAttempt helper
4. `5fcea12` — feat(domain): deduplicate computeAccuracy, computeTrend, and computeMasteryLevel
5. `f31020b` — test(persistence): add timeMs and attemptIndex to practice-progress test literals
6. `d138e02` — test: add timeMs and attemptIndex to remaining test literals
7. `4eb2f4a` — chore(sdd): register feat-practice-attempt-timing-and-retry PR1
8. `15a39b6` — fix(bridge): provide timeMs + attemptIndex at usePracticeFlow call site (PR1→PR2 bridge)
9. `f27dbb6` — merge: PR1 to main
10. `1732d46` — feat(hook): add attemptIndex state, performance.now() timer, handleRetryExercise
11. `11335d2` — feat(ui): add retry button and warm legend to PracticeFeedbackPhase
12. `59bd8a6` — feat(page): wire retry props from usePracticeFlow to PracticeFeedbackPhase
13. `d0298a2` — chore(sdd): mark PR2 in-progress, verify gate green
14. `ccee069` — fix(hook): start attempt timer on exercise shown, not on evaluation timeout (GGA-flagged)
15. `6bedff1` — chore(gga): switch provider to codex
16. `2cb0ef6` — merge: PR2 to main
17. `7f10283` — chore(sdd): mark feat-practice-attempt-timing-and-retry done
18. `71261b3` — docs(sdd): verify-report for feat-practice-attempt-timing-and-retry
19. `00d20ea` — fix(ui): correct off-by-one in retry canRetry wiring (CRITICAL-1 from verify)

## Review Workload Forecast (post-hoc)

- **Total**: 1250 lines (PR1: 569, PR2: 672, fixes: 9)
- **400-line budget risk**: High. Resolved with size:exception.
- **Chained PRs recommended**: Initially yes (478 forecast), revised to single PR per scope when budget exceeded.
- **size:exception**: approved by user 2026-06-10, documented in STATUS.json.

## Learnings (for U2 and beyond)

1. **Forecast multiplier for semantic changes**: when a dedupe breaks the test surface, expect 2-3x the original estimate.
2. **Bridge pattern for chained PRs**: PR1 makes fields required → PR2 scope call site breaks. Patch with `timeMs: 0, attemptIndex: 1, TODO(PR2)`. PR2 must REPLACE the bridge, not add to it.
3. **Timer measurement**: start ref at moment exercise is shown (in `handleNextExercise`, `handleNextExample→exercise`, `handleRetryExercise`), NOT inside `setTimeout`. Otherwise the constant evaluation delay corrupts the metric. GGA caught this.
4. **Off-by-one in prop wiring**: `(map.get(id) ?? 0) + 1` in `page.tsx` shifted the retry window. Verify agent caught it; apply agents missed it. Always have a fresh reviewer.
5. **GGA with codex works** in headless shell. Opencode requires desktop session. Switch providers via `.gga` file.
6. **Engram is not portable across PCs** (multi-PC project). All SDD artifacts MUST be in the repo. This was a process gap.
