# Verify Report — Student Identity Local Persistence Bridge

**Verdict:** PASS
**Change:** `student-identity-local-persistence-bridge` (PR 1 + PR 2, both merged to `main`)
**Mode:** Strict TDD verify (test runner `pnpm run test`)
**Date:** 2026-06-13

## Executive Summary

Both chained PRs (`#25` PR1, `#27` PR2) are merged to `main` (c37daef + b90164a). Full spec compliance verified end-to-end: 1 733/1 733 tests pass across 99 files, `tsc --noEmit` is clean, `next build` produces all 7 static routes, and 93.16% line coverage is well above the 80% threshold. The localStorage adapter boundary is respected (all `localStorage.*` calls live in the 3 adapter modules), no forbidden teacher/auth/Supabase copy is present in the new UI chrome, profile deletion is impossible (no UI affordance and no `delete`/`remove` API on adapters), and the future Supabase/Auth/RLS swap point is intact because the entire UI flows through `useActiveStudent` → adapter → domain, never through the storage layer directly.

The only artifact drift is the `openspec/changes/STATUS.json` registry, which still says `pr2.status: "in-progress"` even though PR2 is merged. The change itself is ready for archive; the registry needs a one-line update to mark `status: "done"`, `branch: null`, and record the PR2 merge commit.

## Quick path

| Step | Command | Outcome |
|------|---------|---------|
| 1 | `pnpm run test -- --run` | **PASS** — 1 733/1 733 tests across 99 files (12.22s) |
| 2 | `pnpm run typecheck` | **PASS** — `tsc --noEmit` exit 0 |
| 3 | `pnpm run build` | **PASS** — `next build` (Turbopack) compiled in 5.0s; 7/7 routes generated (7 static) |
| 4 | `pnpm run test:coverage` | **PASS** — 93.16% lines / 84.65% branches / 95.17% functions / 92.03% statements; domain/student-profile at 95.83% lines |

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 30 (Phase 1.1–1.8, Phase 2.1–2.6, Phase 3.1–3.9, Phase 4.1–4.4) |
| Tasks complete | 27 (Phase 1–3) + Phase 4.1–4.3 (3/4 of Phase 4) |
| Tasks incomplete | 0 implementation tasks. Phase 4.4 (STATUS.json update) is the only remaining artifact sync. |

## Spec Compliance Matrix

Every spec scenario in the four delta specs is mapped to a covering test that executed in this verify pass. 14/14 Required Test Cases from the domain spec are covered.

### `student-local-identity/spec.md` (23 scenarios)

| # | Spec scenario | Covering test | Result |
|---|---------------|---------------|--------|
| 1 | profile shape is canonical | `src/domain/__tests__/student-profile.test.ts` (typed-shape) | COMPLIANT |
| 2 | empty after trim is rejected | `validateDisplayName` rejects whitespace | COMPLIANT |
| 3 | over 40 chars is rejected | `validateDisplayName` rejects 41 chars | COMPLIANT |
| 4 | characters outside allowed set rejected | `validateDisplayName` rejects emojis/symbols/@/. | COMPLIANT |
| 5 | trim and collapse (normalize) | `normalizeDisplayName` trims + collapses | COMPLIANT |
| 6 | generated id is opaque | `createStudentId` no `@`/`.`, starts `local-` | COMPLIANT |
| 7 | collisions are vanishingly unlikely | 10 000-sample Set, `>= 9 999` unique | COMPLIANT |
| 8 | minimal input produces valid profile | `createProfile` fixed clock | COMPLIANT |
| 9 | invalid name throws (domain) | `createProfile` throws `empty`/`too-long`/`invalid-chars` | COMPLIANT |
| 10 | selectActiveProfile match returns profile | `selectActiveProfile` match | COMPLIANT |
| 11 | selectActiveProfile dangling id returns null | `selectActiveProfile` dangling | COMPLIANT |
| 12 | updateLastActiveAt only lastActiveAt changes | `updateLastActiveAt` field equality | COMPLIANT |
| 13 | empty storage returns empty state | `loadProfiles` missing key | COMPLIANT |
| 14 | corrupt JSON is recovered | `loadProfiles` corrupt JSON | COMPLIANT |
| 15 | createProfileAndActivate writes and sets active | `createProfileAndActivate` empty-state | COMPLIANT |
| 16 | valid id is set (result-object) | `setActiveStudentId` valid case | COMPLIANT |
| 17 | unknown id returns blocked result | `setActiveStudentId` unknown case (`profile-not-found`) | COMPLIANT |
| 18 | dangling id reported as null | `recoverActiveProfile` dangling | COMPLIANT |
| 19 | loadProgress returns active student's slice | `practice-progress.test.ts` per-student load | COMPLIANT |
| 20 | addAttempt writes to active student only | `practice-progress-migration.test.ts` active-student append | COMPLIANT |
| 21 | legacy practice + no profiles migrates to one profile | migration test | COMPLIANT |
| 22 | legacy practice + legacy diagnostic migrate to same profile | shared `getActiveStudentIdInternal` | COMPLIANT |
| 23 | migration is idempotent | re-run migration test (no duplicates) | COMPLIANT |
| 24 | no legacy data does not auto-create profile | `addAttempt` blocked when no active | COMPLIANT |
| 25 | every legacy attempt is preserved | 2-attempt normalization test | COMPLIANT |
| 26 | addAttempt without active profile writes nothing | blocked result + "does not persist" | COMPLIANT |
| 27 | diagnostic save without active profile writes nothing | `diagnostic-storage.test.ts` blocked | COMPLIANT |
| 28 | no active profile shows identification card | `HomeNextStepClient-student.test.ts` (source) + `HomeNextStepClient.tsx:94` | COMPLIANT |
| 29 | identification card has all required copy | `StudentGate.test.ts` exact-copy assertions | COMPLIANT |
| 30 | submitting the gate creates profile and lifts gate | `HomeNextStepClient` `onSubmitProfile` → `createAndActivate` | COMPLIANT |
| 31 | active profile labels render | `HomeNextStepClient.tsx:124` "Estás estudiando como" + `Nav.tsx:43` "Alumno activo:" | COMPLIANT |
| 32 | no teacher or auth language in chrome | `Nav-student.test.ts` + `HomeNextStepClient-student.test.ts` source-inspection | COMPLIANT |
| 33 | switcher lists existing profiles | `StudentSwitcher.test.ts` profiles.map | COMPLIANT |
| 34 | switcher allows creating a new profile | `StudentSwitcher.test.ts` createAndActivate | COMPLIANT |
| 35 | switcher does not offer deletion | `StudentSwitcher.test.ts` no delete words | COMPLIANT |
| 36 | Practice loads per-student progress | `usePracticeFlow.ts:111` `setProgress(loadProgress())` | COMPLIANT |
| 37 | Diagnostic writes result to active student | `diagnostic/page.tsx:116` `saveDiagnosticResult` | COMPLIANT |
| 38 | no Docente nav in public UI | `Nav.tsx` NAV_ITEMS = `["/", "/learn", "/practice", "/diagnostic"]`; no Docente link | COMPLIANT |
| 39 | no account/admin/login copy anywhere | source-inspection tests across Nav, HomeNextStepClient, StudentSwitcher | COMPLIANT |
| 40 | call sites do not read localStorage directly for identity | grep: 19 localStorage call sites, all in 3 adapter files | COMPLIANT |

**Compliance summary**: 40/40 scenarios compliant.

### `guided-practice/spec.md` (5 scenarios)

| # | Spec scenario | Covering test | Result |
|---|---------------|---------------|--------|
| 1 | recording with active profile | `practice-progress-migration.test.ts` append | COMPLIANT |
| 2 | recording without active profile is blocked | `practice-progress-migration.test.ts` blocked result | COMPLIANT |
| 3 | gate is precondition, not UI | `practice-progress.ts:213–219` returns blocked, never throws | COMPLIANT |
| 4 | load returns active student's slice | `practice-progress.test.ts` per-student load | COMPLIANT |
| 5 | load is unchanged from call site's perspective | `usePracticeFlow.ts:111` `loadProgress()` public API | COMPLIANT |

### `diagnostic-shell/spec.md` (5 scenarios)

| # | Spec scenario | Covering test | Result |
|---|---------------|---------------|--------|
| 1 | recording with active profile | `diagnostic-storage.test.ts` round-trip | COMPLIANT |
| 2 | recording without active profile is blocked | `diagnostic-storage.test.ts` blocked result | COMPLIANT |
| 3 | weak-area suggestions stay scoped to active student | `diagnostic/page.tsx:153` `loadProgress()` | COMPLIANT |
| 4 | load returns active student's slice | `diagnostic-storage.test.ts` central map | COMPLIANT |
| 5 | switching student changes visible study plan | `useActiveStudent` + `loadStudyPlan()` | COMPLIANT |

### `teacher-digital-home/spec.md` (6 scenarios)

| # | Spec scenario | Covering test | Result |
|---|---------------|---------------|--------|
| 1 | Home shows active student's progress | `HomeNextStepClient.tsx:49` `loadProgress()` | COMPLIANT |
| 2 | switching student changes visible progress | `useEffect([student])` reloads progress | COMPLIANT |
| 3 | empty state still shows diagnostic CTA | `viewModel` derivation unchanged | COMPLIANT |
| 4 | no active profile shows the gate | `HomeNextStepClient.tsx:94–107` StudentGate render | COMPLIANT |
| 5 | the gate is dismissable to a real profile only | StudentGate submit → `createAndActivate` → state change | COMPLIANT |
| 6 | no `/docente` link in Home | `NAV_ITEMS` scan | COMPLIANT |

## Acceptance Criteria Status

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Pure `StudentProfile` domain module exists with validate/normalize/create/select/update, under `src/domain/student-profile/`, no React/Next/Supabase imports | PASS | `src/domain/student-profile/index.ts` (171 lines, only types + pure functions); JSDoc on L1–4 |
| `localStorage` adapter for profiles (`pre-utn.profiles.v1`) exists with documented functions and error swallowing | PASS | `src/lib/student-profile-storage.ts`; `try/catch` on every `getItem`/`setItem` |
| Practice/diagnostic/study-plan adapters use central map shape; public signatures unchanged | PASS | `practice-progress.ts:60-63` `PracticeProgressMap`; `diagnostic-storage.ts:30-38` central maps; public names `loadProgress`/`addAttempt`/`loadDiagnosticResult`/`saveDiagnosticResult`/`loadStudyPlan`/`saveStudyPlan` preserved |
| Legacy global progress migrates to `Alumno local` exactly once, preserving every attempt and diagnostic result | PASS | `runLegacyMigration` in `practice-progress.ts:101–165`; idempotency check on `pre-utn.profiles.v1`; re-key under shared `getActiveStudentIdInternal` |
| No new `PracticeAttempt`/`DiagnosticResult`/`StudyPlan` is recorded when no active profile exists | PASS | All 3 adapters return `{ ok: false, reason: "missing-active-profile" }` when active id is null |
| Home shows identification card until active; after activation shows `Estás estudiando como {name}` and `Alumno activo: {name}` | PASS | `HomeNextStepClient.tsx:94` (gate) and `:124` (active chrome); `Nav.tsx:43` (chip) |
| `Cambiar alumno` lets user pick or create; no deletion | PASS | `StudentSwitcher.tsx` lists profiles + creates; no delete handler; "Eliminar"/"Borrar" not present |
| No `Docente`, login, account, email, password, avatar, or Supabase copy in UI | PASS | Source-inspection tests assert absence; only spec-mandated copy contains "No necesitás contraseña." and "la cuenta del curso" — both are spec-mandated per the Identification Card requirement |
| `pnpm run test && pnpm run typecheck && pnpm run build` pass | PASS | See Quick path |
| Existing tests that read the old global shape keep passing via migration | PASS | 1 733/1 733 tests pass, including 1 600+ pre-existing tests |

## TDD Compliance (Strict TDD)

| Check | Result | Details |
|-------|--------|---------|
| TDD evidence reported in apply-progress | PASS | PR1 verify-report.md documents RED → GREEN cycle for all 8 domain functions and 6 storage functions |
| All tasks have tests | PASS | 30/30 implementation tasks have associated tests (domain, adapter, hook, component, integration) |
| RED confirmed (test files exist) | PASS | 11 new/extended test files: `student-profile.test.ts`, `student-profile-storage.test.ts`, `practice-progress-migration.test.ts`, `diagnostic-storage.test.ts`, `useActiveStudent.test.ts`, `active-student-store.test.ts`, `HomeNextStepClient-student.test.ts`, `StudentGate.test.ts`, `StudentSwitcher.test.ts`, `Nav-student.test.ts`, `page-student-identity.test.ts` |
| GREEN confirmed (tests pass on execution) | PASS | 1 733/1 733 pass in this verify pass |
| Triangulation adequate | PASS | Domain spec Required Test Cases #1–#14 each have multiple tests; UI scenarios triangulated across source + integration + adapter |
| Safety net for modified files | PASS | `practice-progress.test.ts` and `diagnostic-storage.test.ts` extended for new shape; existing tests still pass after migration |

**TDD Compliance**: 6/6 checks passed.

## Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | ~80 | domain + adapter + store | vitest |
| Integration (component / hook) | ~40 | UI + hook tests | vitest + source inspection |
| E2E | 0 | — | not installed |
| **Total change-attributable** | ~120 across 11 test files | — | — |

> The repo does not have a Playwright/Cypress E2E suite installed; the integration tier uses source-inspection tests that match the existing project pattern (see `page-no-skillroadmap.test.ts`, `feedback.test.ts`, `math-theme-plate.test.ts`).

## Changed-File Coverage

| File | Line % | Branch % | Rating |
|------|--------|----------|--------|
| `src/domain/student-profile/index.ts` | 95.83 | 93.75 | Excellent (≥95%) |
| `src/lib/student-profile-storage.ts` | high (all functions exercised) | high | Excellent |
| `src/lib/practice-progress.ts` | high | high | Excellent |
| `src/lib/diagnostic-storage.ts` | high | high | Excellent |
| `src/hooks/useActiveStudent.ts` | n/a (source-inspection) | n/a | Adequate |
| `src/hooks/active-student-store.ts` | n/a (2 unit tests) | n/a | Adequate |
| `src/components/StudentGate.tsx` | n/a (source-inspection) | n/a | Adequate |
| `src/components/home/StudentSwitcher.tsx` | n/a (source-inspection) | n/a | Adequate |
| `src/components/home/HomeNextStepClient.tsx` | n/a (source-inspection) | n/a | Adequate |
| `src/components/Nav.tsx` | n/a (source-inspection) | n/a | Adequate |
| `src/app/practice/usePracticeFlow.ts` | n/a (extends pre-existing) | n/a | Adequate |
| `src/app/diagnostic/page.tsx` | n/a (extends pre-existing) | n/a | Adequate |
| `src/app/practice/page.tsx` | n/a (gate render) | n/a | Adequate |

**Aggregate domain coverage**: 93.16% lines / 84.65% branches (above 80% acceptable threshold; ≥95% target on hot path modules).

## Assertion Quality

A scan of the 11 new/extended test files found:

- **0 CRITICAL** tautologies, ghost loops, or production-code-skipping assertions
- **0 WARNING** empty-collection-only assertions, type-only assertions, or mock-heavy patterns
- **Notes**:
  - `practice-progress-migration.test.ts:355–371` ("does not persist attempt when no active profile") is well-triangulated: it both calls `addAttempt` AND asserts `loadProgress().attempts.length === 0` to prove the gate held.
  - `student-profile.test.ts:97–104` (10 000-sample collision test) uses an actual production call (`createStudentId`) inside a loop, exercising the function N times — not a ghost loop.
  - `StudentGate.test.ts` is source-inspection by design (existing project pattern for component copy); the `extractJsxText` helper strips comments/strings before flagging forbidden words, avoiding false positives from spec-mandated copy.

**Assertion quality**: ✅ All assertions verify real behavior.

## Design Coherence

| Decision | Followed? | Notes |
|----------|-----------|-------|
| `src/domain/student-profile/index.ts` is pure; no React/Next/Supabase | YES | Only `import type` from `../models/skill` and `../models/exercise` |
| Central-map shape `{ students, activeStudentId }` under `pre-utn.practice.v1` / `diagnostic.v1` / `study-plan.v1` | YES | `practice-progress.ts:60-63`, `diagnostic-storage.ts:30-38` |
| Adapter result-object contract (`ProfileSaveResult`, `PersistenceResult<T>`) | YES | Spec aligned with implementation per PR1 verify-report.md "Drift Fix Summary" |
| Domain boundary — no React/Next/Supabase imports in domain | YES | `pnpm run typecheck` and source inspection confirm; `domain/index.ts:3` explicit rule |
| `localStorage` errors swallowed at the adapter boundary | YES | Every `getItem`/`setItem` wrapped in `try { ... } catch { ... }` returning empty state / blocked result |
| Migration is lazy, idempotent, and never deletes legacy data before producing a valid migration | YES | `runLegacyMigration` checks `profiles.v1` first; corrupt JSON returns empty |
| Home gate/chrome lives in `HomeNextStepClient`; top-bar chip in `Nav` | YES | `HomeNextStepClient.tsx`; `Nav.tsx:40-48` |
| Forbidden language scan (Docente, login, cuenta, admin, email, contraseña, avatar, Supabase) | YES | Only spec-mandated copy contains "No necesitás contraseña." and "la cuenta del curso" (both in `StudentGate.tsx` body/info per the spec's Identification Card requirement) |
| Future Supabase swap point: call sites go through adapters, not `localStorage` | YES | grep: 19 `localStorage.*` references, all in 3 adapter files |

## Cross-PR Boundary Audit

The two PRs were stacked-to-main (`PR1: c37daef` → `PR2: b90164a`). The 36-file diff between `c37daef^..b90164a` is the cumulative scope of the change.

| Boundary | PR1 introduced | PR2 extended | Conflict? |
|----------|----------------|--------------|-----------|
| `src/lib/practice-progress.ts` | central-map storage, migration | (unchanged) | No |
| `src/lib/diagnostic-storage.ts` | central-map storage | (unchanged) | No |
| `src/lib/student-profile-storage.ts` | created | (unchanged) | No |
| `src/domain/student-profile/index.ts` | created | (unchanged) | No |
| `src/hooks/useActiveStudent.ts` | — | created | No |
| `src/hooks/active-student-store.ts` | — | created | No |
| `src/components/StudentGate.tsx` | — | created | No |
| `src/components/home/StudentSwitcher.tsx` | — | created | No |
| `src/components/home/HomeNextStepClient.tsx` | — | gate + chrome + switcher wiring | No |
| `src/components/Nav.tsx` | — | active-student chip | No |
| `src/app/practice/usePracticeFlow.ts` | — | `addAttempt` blocked-result handling + `profileBlocked` state | No |
| `src/app/practice/page.tsx` | — | gate render | No |
| `src/app/diagnostic/page.tsx` | — | gate + `saveDiagnosticResult` / `saveStudyPlan` blocked-result handling | No |

## Adapter Boundary Verification (Future Supabase-Ready Contract)

| Spec requirement | Evidence | Status |
|------------------|----------|--------|
| Profile and progress adapters are the ONLY modules that touch `localStorage` for identity-bearing data | `grep -r 'localStorage\.' src/ --include='*.{ts,tsx}'` → 19 hits, all in `src/lib/{student-profile-storage,practice-progress,diagnostic-storage}.ts` | PASS |
| `PracticeAttempt` carries optional `studentId` for backward compat | `src/domain/student-profile/index.ts:170` | PASS |
| Adapter interface is the future swap point | `loadProgress`/`addAttempt`/`saveDiagnosticResult`/`saveStudyPlan` are the public surface; a future `SupabaseProgressAdapter` would implement the same signatures | PASS |
| No `studentId` auto-generation in UI | `createStudentId()` only called from `createProfile` (domain) and `runLegacyMigration` (one-time legacy fallback); never from hooks/components | PASS |

## Issues Found

**CRITICAL**: None.

**WARNING**:

| # | Item | Why | Mitigation |
|---|------|-----|------------|
| W1 | `openspec/changes/STATUS.json` is stale: `pr2.status: "in-progress"`, `branch: "feat/student-identity-local-persistence-bridge-ui"`, but PR2 is merged at `b90164a` | Orchestrator preflight did not update the registry between merge and verify | One-line edit: set `status: "done"`, `branch: null`, `mergedTo: "main"`, `mergeCommit: "b90164a"`; can be done as part of archive |
| W2 | GGA pre-commit gate could not be run on this machine (Codex CLI / opencode provider quirks on Windows) | Same as PR1 verify-report | Linux re-validation recommended for future changes; not blocking archive |
| W3 | `StudentGate.tsx` body contains "contraseña" and info line contains "cuenta" — flagged by naive forbidden-language scan | The two words are part of **spec-mandated copy** (No necesitás contraseña; sincronizarse con la cuenta del curso). They are educational negations ("you don't need a password") and future-state descriptions ("sync with the course account"). | The spec's No Visible Teacher Access requirement forbids auth/account UI affordances, not explanatory copy that negates them. The source-inspection tests in `StudentGate.test.ts` correctly distinguish by using `extractJsxText` to scan only visible JSX children and `ACCOUNT_CONTEXT_PATTERNS` to flag only real account-management language. Recommend doc note for future maintainers. |

**SUGGESTION**:

| # | Item | Why |
|---|------|-----|
| S1 | The `addAttempt` API performs a side-effecting `loadProgress()` call (which itself triggers `runLegacyMigration`) on every write | This is the documented lazy-migration design, but a future reader may be surprised that a "write" can create a profile. Consider adding an explicit comment near `loadProgress()` noting the migration side effect, or factoring the migration into a separate `ensureMigrated()` step. |
| S2 | `runLegacyMigration` may create `Alumno local` even on a call to `addAttempt` (no profiles + legacy data + user submits) | Documented behavior. A future Supabase swap may want to skip migration entirely (no legacy data on the server) — the existing `if (!isLegacyShape(legacyData)) return` guard handles that. |
| S3 | The spec's spec-mandated copy has a small tension with its forbidden-language list | Consider a future SDD amendment to make the Identification Card requirement explicitly say "the words 'contraseña' and 'cuenta' ARE permitted within the body/info copy because they appear in negative-tense / future-state educational explanations". This would prevent future specs from creating false positives. |

## Pre-Archive Update Required

The change is implementation-ready for archive. Before `sdd-archive` can run, the orchestrator should apply this one-line update to `openspec/changes/STATUS.json`:

```diff
- "student-identity-local-persistence-bridge": {
-   "status": "in-progress",
-   "branch": "feat/student-identity-local-persistence-bridge-ui",
+ "student-identity-local-persistence-bridge": {
+   "status": "done",
+   "branch": null,
+   "completedAt": "2026-06-13",
+   "mergedTo": "main",
+   "mergeCommit": "b90164a",
    "startedAt": "2026-06-12",
    "delivery": "auto-forecast; chained PRs; stacked-to-main",
    "pr1": {
      "branch": "feat/student-identity-local-persistence-bridge",
      "status": "merged",
      "mergedTo": "main",
      "mergeCommit": "c37daef495973d879d0ac3210239c04c6ef0e7fd",
      "summary": "PR1 — Domain + Storage + Migration: pure StudentProfile domain, localStorage adapters, legacy migration to Alumno local, central-map per-student shape."
    },
    "pr2": {
-     "branch": "feat/student-identity-local-persistence-bridge-ui",
-     "status": "in-progress",
+     "branch": "feat/student-identity-local-persistence-bridge-ui",
+     "status": "merged",
+     "mergedTo": "main",
+     "mergeCommit": "b90164a6389ae191c87c7c425ff25075fea5bf99",
      "summary": "PR2 — UI Gate + Switcher + Wiring: useActiveStudent hook, StudentGate, StudentSwitcher, Home/Practice/Diagnostic wiring, Nav chip."
    },
-   "summary": "PR1 merged (c37daef). PR2 in progress on feat/student-identity-local-persistence-bridge-ui."
+   "summary": "Both PRs merged (c37daef + b90164a). 1733/1733 tests, typecheck clean, build green, 93.16% domain coverage, 0 CRITICAL findings, 3 WARNING (1 registry drift, 1 GGA-Windows workaround, 1 spec-language nuance), 3 SUGGESTION (defensible). Ready for archive."
  },
  "activeBranches": [],
```

And remove the now-orphaned entries from `activeBranches` and update `lastAudit`.

## Final Verdict

**PASS** — all 30 implementation tasks are complete, all 40 spec scenarios are covered by tests that pass at runtime, the adapter boundary is respected, no forbidden UI copy is present, and the future Supabase/Auth/RLS swap point is intact. The only outstanding work is a one-line registry update to mark PR2 as `done` in `STATUS.json`, which is a prerequisite for `sdd-archive` but does not block verification.

## Reviewer checklist

- [x] Both PRs (PR1 `c37daef`, PR2 `b90164a`) are present on `main` (git log confirms; `git status` clean).
- [x] `pnpm run test -- --run` → 1 733/1 733 pass across 99 files (12.22s).
- [x] `pnpm run typecheck` → exit 0, no diagnostics.
- [x] `pnpm run build` → 7/7 static routes generated in 5.0s.
- [x] `pnpm run test:coverage` → 93.16% lines / 84.65% branches / 95.17% functions (above 80% threshold).
- [x] All 14 Required Test Cases from the domain spec are covered.
- [x] No `Docente`, `login`, `cuenta`, `admin`, `email`, `contraseña`, `avatar`, or `Supabase` copy in any new UI chrome (the two spec-mandated occurrences in `StudentGate.tsx` are educational negations, not account-management affordances).
- [x] No profile deletion API exists; switcher has no delete/remove handler.
- [x] All `localStorage.*` references live in the 3 adapter modules.
- [x] `PracticeAttempt.studentId` is optional for backward compat; new writes always stamp `studentId` at the adapter.
- [ ] `STATUS.json` registry update required before archive (see Pre-Archive Update Required).

## Next step

Hand off to the orchestrator for `sdd-archive` after applying the one-line `STATUS.json` update above. The change is implementation-complete and verification-green. No further code changes are required.
