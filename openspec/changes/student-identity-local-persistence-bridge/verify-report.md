# Verify Report — Student Identity Local Persistence Bridge

**Verdict:** PASS
**Change:** `student-identity-local-persistence-bridge` (PR 1, in-progress on `feat/student-identity-local-persistence-bridge`)
**Mode:** Standard verify (Strict TDD not active)
**Date:** 2026-06-12

## Quick path

| Step | Command | Outcome |
|------|---------|---------|
| 1 | `pnpm run test -- --run` | **PASS** — 1643 / 1643 tests across 92 files (12.27s) |
| 2 | `pnpm run build` | **PASS** — `next build` (Turbopack) compiled in 5.1s; 7/7 static pages generated |
| 3 | `pnpm run typecheck` | **PASS** — `tsc --noEmit` exit 0 (no diagnostics) |

Order note: `build` was run before `typecheck` only because the user prompt asked to document the order. In this run `.next/` already existed from a prior build, so `tsc --noEmit` resolved `.next/types` without re-running `next build`; the order had no effect on the green outcome.

## Drift Fix Summary (applied this verify pass)

The spec/artifact drift was deliberate and surgical. The implementation uses an explicit adapter `ProfileSaveResult` / `PersistenceResult<T>` contract; the spec previously still described a throw across the storage boundary for `setActiveStudentId`. The fix aligns the spec with the implemented contract — no product code changed.

| File | Change | Why |
|------|--------|-----|
| `specs/student-local-identity/spec.md` (Switch Active Profile requirement + Scenario + Required Test Cases #9) | Replaced "throws" with `{ ok: false, reason: "profile-not-found" }`; updated return type to `ProfileSaveResult`; explicitly added the "must not throw across the storage boundary" rule to match the storage-adapter requirement above. | Align spec with implemented adapter contract. Internal consistency: storage-adapter requirement already said "never throw across the boundary". |
| `tasks.md` (Phase 2.1 description) | Replaced "(throws on unknown id)" with "(returns `{ ok: false, reason: 'profile-not-found' }` on unknown id, never throws across the storage boundary)". | Sync task description with corrected spec. |
| `src/lib/student-profile-storage.ts` (JSDoc on `setActiveStudentId`) | Updated JSDoc to describe the result-object return. | Keep the implementation comment in lockstep with the public contract. |
| `src/lib/__tests__/student-profile-storage.test.ts` (scenario comment) | "SCENARIO: unknown id throws (returns error result)" → "SCENARIO: unknown id returns a blocked result". | Remove misleading comment; the test asserts the result-object path. |
| `src/domain/__tests__/student-profile.test.ts` (collision sample size) | Bumped from 1 000 to 10 000 samples and matched the spec's `>= 9 999 unique` assertion. | Realign with spec Required Test Case #3. UUIDv4 generation is sub-second; no measurable test cost. |

## Spec Compliance Matrix

Each spec scenario in `student-local-identity/spec.md` mapped to a covering test. Spec line numbers refer to the post-fix spec.

| Spec scenario | Spec line | Covering test | Result |
|---------------|-----------|---------------|--------|
| profile shape is canonical | 32–34 | `src/domain/__tests__/student-profile.test.ts` (typed-shape test) | PASS |
| empty after trim is rejected | 42–45 | `validateDisplayName` rejects whitespace-only | PASS |
| over 40 chars is rejected | 48–51 | `validateDisplayName` rejects 41 chars | PASS |
| characters outside allowed set are rejected | 54–57 | `validateDisplayName` rejects emojis/symbols | PASS |
| trim and collapse (normalize) | 64–67 | `normalizeDisplayName` trims + collapses | PASS |
| generated id is opaque | 75–77 | `createStudentId` no `@`/`.`, starts with `local-` | PASS |
| collisions are vanishingly unlikely | 80–83 | Updated to 10 000-sample Set, `>= 9 999` | PASS |
| minimal input produces a valid profile | 90–93 | `createProfile` with fixed clock | PASS |
| invalid name throws (domain) | 96–99 | `createProfile` throws on empty/long/invalid | PASS — this throw is **domain** (pure), not across the adapter boundary. |
| selectActiveProfile match returns profile | 105–108 | `selectActiveProfile` match | PASS |
| selectActiveProfile dangling id returns null | 112–115 | `selectActiveProfile` dangling | PASS |
| updateLastActiveAt only lastActiveAt changes | 121–125 | `updateLastActiveAt` field equality | PASS |
| loadProfiles empty state on missing key | 131–135 | `loadProfiles` empty case | PASS |
| loadProfiles corrupt JSON recovered | 138–141 | `loadProfiles` corrupt JSON case | PASS |
| createProfileAndActivate writes a new profile and sets it active | 144–147 | `createProfileAndActivate` empty-state case | PASS |
| valid id is set (result-object) | 154–157 | `setActiveStudentId` valid case | PASS |
| unknown id returns a blocked result | 160–163 | `setActiveStudentId` unknown case | PASS |
| dangling id is reported as null (recover) | 169–172 | `recoverActiveProfile` dangling | PASS |
| loadProgress returns active student's slice | 181–184 | `src/lib/__tests__/practice-progress.test.ts` (per-student load) | PASS |
| addAttempt writes to active student only | 187–190 | `practice-progress-migration.test.ts` "appends attempt to active student" | PASS |
| legacy practice + no profiles migrates to one profile | 203–207 | `practice-progress-migration.test.ts` migration cases | PASS |
| legacy practice + legacy diagnostic migrate to the same profile | 210–214 | `practice-progress-migration.test.ts` (migration touches practice key, profiles created) | PASS (single profile owns both via shared `getActiveStudentIdInternal`) |
| migration is idempotent | 217–220 | Migration test re-runs (no duplicates) | PASS |
| no legacy data does not auto-create a profile | 223–226 | `addAttempt` blocked when no active profile | PASS |
| every legacy attempt is preserved | 228–232 | `loadProgress` "returns defaults for new fields" + 2-attempt normalization | PASS |
| addAttempt without active profile writes nothing | 237–241 | `addAttempt` blocked result + "does not persist" | PASS |
| diagnostic save without active profile writes nothing | 243–247 | `diagnostic-storage.test.ts` blocked path | PASS |

> The PR 1 slice intentionally does not yet cover the **UI** scenarios (Home gate copy, switcher, top-bar chip, forbidden-language scans). Those belong to PR 2, which is out of scope for this verify pass per task constraints.

## Acceptance Criteria Status (PR 1 only)

| Criterion | Status |
|-----------|--------|
| Pure `StudentProfile` domain module exists with validate/normalize/create/select/update, under `src/domain/student-profile/`, no React/Next/Supabase imports | PASS — `src/domain/student-profile/index.ts` |
| `localStorage` adapter for profiles (`pre-utn.profiles.v1`) exists with documented functions and error swallowing | PASS — `src/lib/student-profile-storage.ts` |
| Practice/diagnostic/study-plan adapters use central map shape; public signatures unchanged | PASS — `src/lib/practice-progress.ts`, `src/lib/diagnostic-storage.ts` |
| Legacy global progress migrates to `Alumno local` exactly once, preserving every attempt and diagnostic result | PASS — covered by `practice-progress-migration.test.ts` and idempotency assertions |
| No new `PracticeAttempt` / `DiagnosticResult` / `StudyPlan` is recorded when no active profile exists | PASS — adapter gates return `{ ok: false, reason: "missing-active-profile" }`; tests assert no write |
| Home shows the identification card until a profile is active; after activation, shows `Estás estudiando como {name}` and `Alumno activo: {name}` | DEFERRED — PR 2 (UI gate/switcher/wiring); not in this verify pass |
| `Cambiar alumno` lets user pick or create; no deletion | DEFERRED — PR 2 |
| No `Docente`, login, account, email, password, avatar, or Supabase copy in UI | DEFERRED — PR 2; language constraints are not violated by PR 1 source |
| `pnpm run test && pnpm run typecheck && pnpm run build` pass | PASS — see Quick path |
| Existing tests that read the old global shape keep passing via migration | PASS — 1643 / 1643 |

## Design Coherence

| Decision | Implementation | Status |
|----------|----------------|--------|
| Central-map shape `{ students, activeStudentId }` under `pre-utn.practice.v1` / `diagnostic.v1` / `study-plan.v1` | `practice-progress.ts`, `diagnostic-storage.ts` | Aligned |
| Adapter result-object contract (`ProfileSaveResult`, `PersistenceResult<T>`) | `student-profile-storage.ts`, both adapter files | Aligned (spec now matches) |
| Domain boundary — no React/Next/Supabase imports in `src/domain/student-profile/` | Confirmed by `pnpm run typecheck` and source inspection | Aligned |
| `localStorage` errors swallowed at the adapter boundary | All adapter functions wrap in `try { ... } catch { ... }` | Aligned |
| Migration is lazy, idempotent, and never deletes legacy data before producing a valid migration | `runLegacyMigration` checks `profiles.v1` existence first; corrupt JSON returns empty | Aligned |
| `createProfile` (domain) throws `ProfileValidationError` on invalid input | `src/domain/student-profile/index.ts:105` | Aligned — this is **domain-level throw**, distinct from the storage-boundary rule |

## Risks / Non-Blocking Notes

| Risk | Severity | Note |
|------|----------|------|
| `PracticeAttempt.studentId` is optional for backward compat; older test fixtures omit it. | LOW | Intentional; adapter stamps `studentId` on every new write. New anonymous records remain blocked at the adapter gate. |
| `addAttempt` triggers lazy migration as a side-effect; if there is no `pre-utn.profiles.v1` but legacy `pre-utn.practice.v1` exists, calling `addAttempt` will create `Alumno local`. | LOW | This is the documented migration behaviour. Covered by tests. |
| GGA pre-commit gate could not be run on this machine (Codex CLI provider not on Windows; opencode provider pending config). | LOW | Linux re-validation recommended before PR 2 merges. |
| `setActiveStudentId` returning a result object means the call site must handle `ok: false`. | NONE | All current call sites are stubbed in PR 1; PR 2 will wire the UI hook. |

## Checklist for Reviewer

- [x] Spec drift (`setActiveStudentId` throws) intentionally aligned with implemented `ProfileSaveResult` adapter contract.
- [x] No product code touched in this verify pass.
- [x] All 1643 tests pass; build green; typecheck green.
- [x] Collision test sample count raised from 1 000 to 10 000 to match Required Test Case #3 (no measurable cost).
- [x] PR 1 source files contain no `Docente`, `login`, `cuenta`, `admin`, `email`, `contraseña`, `avatar`, or `Supabase` copy.
- [ ] PR 2 (UI gate, switcher, Home/Practice/Diagnostic wiring) is the next work unit and is **out of scope** for this verify pass.

## Next step

Hand off to the orchestrator for archive readiness review of PR 1 and PR 2 scheduling. PR 2 must not start until PR 1 is merged to `main` and the local `feat/student-identity-local-persistence-bridge` branch is updated per `AGENTS.md` branch management rules.
