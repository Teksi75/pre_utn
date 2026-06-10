## Verification Report

**Change**: feat-practice-attempt-timing-and-retry
**Version**: N/A (artifacts not committed to repo)
**Mode**: Strict TDD
**Date**: 2026-06-10

### Quick path

1. All automated gates pass — 1117/1117 tests, typecheck clean, 7 routes build, 0 audit anomalies.
2. 10 of 11 spec requirements fully compliant — one CRITICAL wiring bug found in `page.tsx`.
3. Strict TDD evidence present — 52 new tests (29 hook + 19 component + 4 domain), RED/GREEN/TRIANGULATE cycles documented in Engram but not in artifacts.
4. 6 PR1 commits lack GGA-WAIVE documentation — project rule AP-9 debt.

---

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 19 (T1.1–T1.9 + T2.1–T2.10) |
| Tasks complete | 19 |
| Tasks incomplete | 0 |
| Artifact files on disk | 0 (only in Engram) |

> **Note**: SDD artifacts (`proposal.md`, `design.md`, `tasks.md`, `specs/practice-attempt-telemetry/spec.md`, `exploration.md`) were never committed to the git repository. They exist only in Engram persistent memory (obs-131, obs-134, obs-135, obs-133, obs-129). This is a portability risk — another machine won't have these artifacts. See WARNING-3 below.

---

### Build & Tests Execution

**Build**: ✅ Passed
```
next build — 7 routes generated
○ /, ○ /_not-found, ○ /diagnostic, ○ /learn, ○ /learn/matematica,
ƒ /learn/matematica/[skillId], ○ /practice
```

**Tests**: ✅ 1117 passed / ❌ 0 failed / ⚠️ 0 skipped
```
Test Files  64 passed (64)
     Tests  1117 passed (1117)
  Duration  15.07s
```

**TypeScript**: ✅ No errors
```
tsc --noEmit — clean exit
```

**Audit**: ✅ 0 zombies, 0 stale, 0 drift
```
✓ No zombie branches detected
✓ No stale entries
✓ No significant drift
```
*(jq parse error at end is cosmetic — script output issue, not a data issue)*

**Coverage**: ➖ Not available (no coverage tool in capabilities)

---

### Spec Compliance Matrix

| Requirement | Scenario | Implementation | Test | Result |
|-------------|----------|----------------|------|--------|
| R1 — PracticeAttempt requires timeMs + attemptIndex | Model has both fields required | `src/domain/progress/index.ts:24-33` | `progress.test.ts:23-39` | ✅ COMPLIANT |
| R2 — loadProgress normalizes legacy attempts | Old data defaults to timeMs:0, attemptIndex:1 | `src/lib/practice-progress.ts:42-55` | `practice-progress.test.ts:124-158, 527-560` | ✅ COMPLIANT |
| R3 — Invisible timer via performance.now() | Timer starts on exercise shown, ends on submit | `src/app/practice/usePracticeFlow.ts:131, 273-276, 325, 358, 378` | `usePracticeFlow.retry.test.ts:224-233, 284-338` | ✅ COMPLIANT |
| R4 — attemptIndex calculated automatically | resolveNextAttemptIndex + attemptIndexByExerciseId Map | `src/app/practice/usePracticeFlow.ts:44-49, 278-282` | `usePracticeFlow.retry.test.ts:112-141` | ✅ COMPLIANT |
| R5 — computeAccuracy deduplicated by last attempt per exerciseId | deduplicateByLastAttempt + time filter | `src/domain/progress/index.ts:87-98, 111-121` | `progress.test.ts:41-76, 130-181` | ✅ COMPLIANT |
| R6 — computeTrend deduplicated | deduplicateByLastAttempt in computeTrend | `src/domain/progress/index.ts:133-152` | `progress.test.ts:256-271` | ✅ COMPLIANT |
| R7 — computeMasteryLevel counts unique exercises | deduplicateByLastAttempt, MASTERY_MIN_ATTEMPTS=5 unique | `src/domain/progress/index.ts:175-201` | `progress.test.ts:381-431` | ✅ COMPLIANT |
| R8 — Retry button when !correct && attemptIndex < 3 | shouldShowRetryButton + JSX rendering | `PracticeFeedbackPhase.tsx:21-27, 178-182` | `PracticeFeedbackPhase.retry.test.ts:57-77, 142-148` | ❌ DRIFT (see CRITICAL-1) |
| R9 — Warm legend when !correct && attemptIndex >= 3 | shouldShowWarmLegend + amber card with role="status" | `PracticeFeedbackPhase.tsx:33-38, 185-192` | `PracticeFeedbackPhase.retry.test.ts:83-110, 159-200` | ✅ COMPLIANT |
| R10 — handleRetryExercise resets form → exercise phase | Resets evaluation/feedback/draft, sets phase "exercise" | `src/app/practice/usePracticeFlow.ts:372-379` | `usePracticeFlow.retry.test.ts:306-314` | ✅ COMPLIANT |
| R11 — Invalid time filter (timeMs < 100 \|\| timeMs > 600_000) | Filter in computeAccuracy + computeTrend | `src/domain/progress/index.ts:117, 139` | `progress.test.ts:141-168`, `usePracticeFlow.retry.test.ts:172-198` | ✅ COMPLIANT |

**Compliance summary**: 10/11 scenarios compliant, 1 DRIFT (CRITICAL)

---

### TDD Compliance (Strict TDD)

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ⚠️ Partial | TDD cycles documented in Engram apply-progress (obs-138, obs-145), not in on-disk artifacts |
| All tasks have tests | ✅ | 19/19 tasks have covering test files |
| RED confirmed (tests exist) | ✅ | 4 test files verified: progress.test.ts, practice-progress.test.ts, usePracticeFlow.retry.test.ts, PracticeFeedbackPhase.retry.test.ts |
| GREEN confirmed (tests pass) | ✅ | 64/64 test files pass (1117/1117), including all new tests |
| Triangulation adequate | ✅ | Retry cap tested at multiple boundary values (1, 2, 3, 4, custom cap 5, cap 1). Dedupe tested with 1, 2, 3-exercise scenarios. Timer tested with edge values including floating-point tolerance. |
| Safety Net for modified files | ✅ | All pre-existing tests (1065→1117) continue to pass. Conjuntos-render-safety intact. |

**TDD Compliance**: 5/6 checks passed, 1 partial (evidence not in artifacts)

---

### Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | 48 | 2 | vitest (pure functions extracted) |
| Integration (source assertions) | 4 | 4 | vitest + node:fs (readFileSync) |
| **Total** | **52** | **6** | vitest |

> **Note**: The project test environment is Node (no jsdom). React hooks and components are tested via (a) pure-logic extraction and (b) source-code assertions (readFileSync + expect().toMatch). This is a deliberate architectural choice documented in the test file headers. No E2E tests exist — tools not in capabilities.

---

### Assertion Quality

| File | Line | Assertion | Issue | Severity |
|------|------|-----------|-------|----------|
| (none) | — | — | — | — |

**Assertion quality**: ✅ All assertions verify real behavior. No tautologies, ghost loops, type-only assertions, or smoke tests found across 52 new/updated tests.

---

### Changed File Coverage

➖ Coverage analysis skipped — no coverage tool detected in project capabilities.

---

### Quality Metrics

**Linter**: ➖ Not available (not in project scripts)
**Type Checker**: ✅ No errors

---

### Correctness (Static Evidence)

| Requirement | Status | Implementation Evidence |
|------------|--------|------------------------|
| PracticeAttempt model extension | ✅ | `timeMs: number` (L31) and `attemptIndex: number` (L32) both required, with JSDoc |
| Legacy migration | ✅ | `loadProgress()` normalizes missing fields to `timeMs: 0`, `attemptIndex: 1` |
| Timer invisible + monotonic | ✅ | `performance.now()` (monotonic), no visible countdown, starts on exercise show |
| Attempt index auto-calculation | ✅ | `resolveNextAttemptIndex()` reads Map, returns `(get(id) ?? 0) + 1` |
| Deduplication by last attempt per exerciseId | ✅ | `deduplicateByLastAttempt()` keeps highest `attemptIndex` per `exerciseId` |
| Retry button label + variant | ✅ | "Reintentar este ejercicio", `Button variant="secondary"`, `className="w-full"` |
| Warm legend exact text | ✅ | "Parecés estar con la cabeza en otro lado. Pasemos al siguiente y volvé a este después si querés." |
| Warm legend styling | ✅ | Amber card (`border-amber-200 bg-amber-50 text-amber-800`), `role="status"` |
| Retry flow resets form | ✅ | `handleRetryExercise` clears evaluation, feedback, draft; sets phase "exercise" |
| GGA bug fix (timer placement) | ✅ | Timer moved from `setTimeout` to `handleNextExercise`/`handleNextExample`/`handleRetryExercise` (commit ccee069) |
| Timer NOT in handleAnswerSubmit setTimeout | ✅ | Verified by source assertion test (L316-338) — `assignments` regex returns null |
| Cap = 3 | ✅ | `MAX_RETRY_ATTEMPTS = 3` (L37), comparison `attemptIndex < maxAttempts` |

---

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| D1 — attemptIndex session-scoped (not persisted) | ✅ Yes | `attemptIndexByExerciseId` is React state, resets on refresh |
| D2 — Dedupe by max attemptIndex per exerciseId | ✅ Yes | `deduplicateByLastAttempt()` uses `a.attemptIndex > existing.attemptIndex` |
| D3 — MASTERY_MIN_ATTEMPTS=5 counts unique exercises | ✅ Yes | JSDoc updated; `computeMasteryLevel` deduplicates before counting |
| D4 — Retry goes directly to exercise phase | ✅ Yes | `handleRetryExercise` sets `setPhase("exercise")` without theory/example detour |
| D5 — Timer uses performance.now() (monotonic) | ✅ Yes | `exerciseStartTimeRef.current = performance.now()`; no `Date.now()` |
| D? — canRetry wiring passes current attemptIndex | ❌ No | See CRITICAL-1 — page.tsx passes `(index ?? 0) + 1` instead of `index ?? 1` |

---

### Pedagogical Verification

| Check | Result |
|-------|--------|
| Button label "Reintentar este ejercicio" | ✅ Exact match at `PracticeFeedbackPhase.tsx:180` |
| Warm legend exact text | ✅ Exact match at `PracticeFeedbackPhase.tsx:41-42` |
| Timer starts in handleNextExercise | ✅ `exerciseStartTimeRef.current = performance.now()` at L325 |
| Timer starts in handleNextExample (exercise transition) | ✅ `exerciseStartTimeRef.current = performance.now()` at L358 |
| Timer starts in handleRetryExercise | ✅ `exerciseStartTimeRef.current = performance.now()` at L378 |
| Timer NOT in handleAnswerSubmit setTimeout | ✅ Verified by source assertion test L316-338 |
| Cap is 3 (not 2, not 4) | ✅ `MAX_RETRY_ATTEMPTS = 3`, comparison `attemptIndex < 3` |
| recoveryTarget not touched | ✅ A3 scope, not in this change |
| pedagogicalNote not touched | ✅ B1, already done in prior change |

---

### Issues Found

#### CRITICAL

**CRITICAL-1 — `canRetry` off-by-one in `page.tsx` (retry cap reached one step early)**

- **File**: `src/app/practice/page.tsx:156-164`
- **Root cause**: The wiring computes `canRetryExercise((attemptIndex ?? 0) + 1)` — adding 1 advances past the actual attempt. After 2 attempts (index=2), the code passes 3 to `canRetryExercise`, which returns `false` (3 < 3 = false). But `canRetryExercise(2)` returns `true` (2 < 3 = true). The student should get 2 retries (3 total attempts); they only get 1 (2 total).
- **Evidence**: The `canRetryExercise` unit tests at `usePracticeFlow.retry.test.ts:82-106` confirm the correct contract:
  - `canRetryExercise(1)` → true (first try, can retry) ✓
  - `canRetryExercise(2)` → true (one retry used, can retry again) ✓
  - `canRetryExercise(3)` → false (cap reached) ✓
- **Impact**: Breaks R8 — retry button should appear at `attemptIndex=2` but doesn't. Student only gets 1 retry instead of the spec-mandated 2.
- **Fix**: Remove the `+ 1`:
  ```diff
  - (flow.attemptIndexByExerciseId.get(flow.currentExercise.id) ?? 0) + 1,
  + flow.attemptIndexByExerciseId.get(flow.currentExercise.id) ?? 1,
  ```
  Or alternatively, change `canRetryExercise` to use `attemptIndex <= maxAttempts` and keep the `+ 1`. Either alignment works; the contract must be consistent between the function and its call site.

#### WARNING

**WARNING-1 — 6 PR1 commits lack GGA-WAIVE documentation**

- **Scope**: Commits `259f4e9` through `d138e02` (6 commits in PR1) used `--no-verify` without documenting `GGA-WAIVE` in commit messages. The bridge commit `15a39b6` does document it.
- **Rule**: Project AP-9 requires explicit `GGA-WAIVE` in commit body when gating hook is skipped.
- **Mitigation**: The PR1 merge commit (`f27dbb6`) includes GGA context. The PR2 merge commit (`2cb0ef6`) documents the provider switch to codex and the GGA-caught bug (ccee069). The debt is documented in Engram (obs-138).
- **Severity**: WARNING — documented out-of-band, no code impact. Future commits must include GGA-WAIVE inline.

**WARNING-2 — SDD artifacts not committed to repository**

- **Detail**: `proposal.md`, `design.md`, `tasks.md`, `specs/practice-attempt-telemetry/spec.md`, and `exploration.md` exist only in Engram persistent memory (obs-131, obs-134, obs-135, obs-133, obs-129). The `openspec/changes/feat-practice-attempt-timing-and-retry/` directory does not exist on disk.
- **Impact**: Another machine won't have full spec/design context for this change. The `STATUS.json` entry and Engram summaries provide partial recovery.
- **Severity**: WARNING — the archive phase can reconstruct the delta specs from Engram. The design/tasks/proposal content is summarized in Engram.

**WARNING-3 — Test layer limitation (no jsdom)**

- **Detail**: 48 of 52 new tests are pure-function unit tests extracted from hook/component logic. 4 tests use source-code assertions (`readFileSync` + regex) instead of component rendering. React hooks and JSX rendering are not directly tested.
- **Impact**: The page.tsx wiring bug (CRITICAL-1) was NOT caught by tests because `page.tsx` is a Next.js page component — no test covers its prop wiring. Source assertions cover hook and component internals, not the integration point.
- **Severity**: WARNING — architectural limitation. When jsdom becomes available, add a rendering test for the page.tsx → PracticeFeedbackPhase wiring.

#### SUGGESTION

**SUGGESTION-1 — Add `page.tsx` wiring test when jsdom available**

When jsdom is added to the test environment, a rendering test for the feedback phase wiring in `page.tsx` would catch off-by-one errors like CRITICAL-1. Current source assertions cover `PracticeFeedbackPhase.tsx` internals and `usePracticeFlow.ts` hook logic, but not the prop plumbing between them.

---

### Verdict

**FAIL**

**Reason**: CRITICAL-1 — the `canRetry` wiring in `page.tsx` has an off-by-one that causes the retry cap to trigger one attempt early. The student only gets 1 retry (2 total attempts) instead of the spec-mandated 2 retries (3 total attempts). This is a one-line fix (remove `+ 1` at L159). All other dimensions pass: 1117/1117 tests, typecheck clean, build green, 10/11 spec requirements fully compliant, pedagogical labels exact, GGA-validated timer fix applied.
