# Tasks: Active Session Module

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~140 (1 new src + 2 new tests + 3 src refactors + 2 test characterization) |
| 450-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | auto-chain (force-chained is conditional on budget breach) |
| Chain strategy | pending — single PR fits the budget |
| Suggested split | Not needed |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
450-line budget risk: Low

Rationale: I-23 is intended size S. New `active-session.ts` (~20 lines), two test files (~70 lines combined), three adapter refactors (~30 line diff), and two test characterizations (~20 lines). All work touches one bounded concern (active-profile id boundary) and `pnpm run test` provides the regression net. Force-chained is held in reserve; we do NOT pre-split when the diff fits in one reviewable PR.

## Phase 1 — Characterization & Scan (RED)

- [x] 1.1 Write `src/lib/__tests__/active-session-boundary.test.ts` (fs/path allowlist scan). Expected RED — 3 violations of `localStorage.getItem("pre-utn.profiles.v1")`.
- [x] 1.2 Baseline: `practice-progress.ts:104` (legacy migration), `:262` (private helper), `diagnostic-storage.ts:46` (private helper).

## Phase 2 — Active Session Boundary (TDD)

- [x] 2.1 RED `src/lib/__tests__/active-session.test.ts`: returns stored `studentId` when active profile valid.
- [x] 2.2 RED: returns `null` when storage missing/unreadable; never throws.
- [x] 2.3 RED: corrupt JSON → `null`, no exception escapes.
- [x] 2.4 GREEN: create `src/lib/active-session.ts` exporting `getActiveProfileId(): string | null`, delegating to `getActiveStudentId()` from `./student-profile-storage`.
- [x] 2.5 REFACTOR: confirm no JSON parsing duplication; module minimal and read-only.

## Phase 3 — Adapter Migration

- [x] 3.1 RED characterization in `practice-progress.test.ts`: blocked save on missing id, lazy legacy migration runs, active-id reads correct.
- [x] 3.2 Replace `getActiveStudentIdInternal()` in `practice-progress.ts` with `getActiveProfileId()`; delete private helper.
- [x] 3.3 RED characterization in `diagnostic-storage.test.ts`: blocked/no-write preserved, corrupt storage no-throw.
- [x] 3.4 Replace `getActiveStudentIdInternal()` in `diagnostic-storage.ts` with `getActiveProfileId()`; delete private helper.
- [x] 3.5 Add `hasProfilesStorage(): boolean` to `student-profile-storage.ts` (read-only, never throws).
- [x] 3.6 Replace `practice-progress.ts:104` direct read in `runLegacyMigration()` with `hasProfilesStorage()`; legacy write stays in profile storage.

## Phase 4 — Naming Consistency (optional)

- [x] 4.1 Update `advanced-practice-progress.ts` import to `getActiveProfileId()` from `./active-session`; behavior unchanged.

## Phase 5 — Verification

- [x] 5.1 `pnpm run test` — green, including new boundary scan.
- [x] 5.2 `pnpm run typecheck` — clean.
- [x] 5.3 `pnpm run build` — clean.
- [x] 5.4 Boundary scan GREEN: 0 direct `localStorage.getItem("pre-utn.profiles.v1")` outside `student-profile-storage.ts` and `active-session.ts`.
- [x] 5.5 Manual `rg "pre-utn\.profiles\.v1" src` shows only approved files.

## Phase 6 — Verify Warning Fixes

- [x] W.1 Fix `advanced-practice-progress.test.ts` mock coupling: retarget mock from `getActiveStudentId` (`../student-profile-storage`) to `getActiveProfileId` (`../active-session`). 35/35 tests pass, 2503/2503 full suite green.
- [x] W.2 Persist `apply-progress.md` with TDD Cycle Evidence for all tasks.
- [x] W.3 Legacy migration write exception (`practice-progress.ts:162`) — documented, no code change. `active-session.ts` is read-only by design; the `setItem` for `pre-utn.profiles.v1` is an intentional write-side exception for migration only.

## Out of Scope (do NOT do)

- Supabase adapter, Auth, RLS, API routes, remote sync.
- `trackId`/`subjectId`, multi-track, persistence-shape migration.
- Panel docente, `/docente`, teacher dashboard, Pablo-facing reads.
- I-19/I-20 skill-id work, `loadProfiles`/`recoverActiveProfile` rewrites, `src/domain` changes.
- `src/hooks`/`src/app`/`src/components` direct localStorage outside this boundary (separate change).

## Open Question Resolved

Legacy migration read at `practice-progress.ts:104` is contained via a new profile-storage-owned helper (`hasProfilesStorage`) — keeps the spec promise that ONLY profile storage and the new active-session boundary read `pre-utn.profiles.v1`.
