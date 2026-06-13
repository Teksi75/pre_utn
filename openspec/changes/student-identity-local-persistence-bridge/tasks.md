# Tasks: Student Identity Local Persistence Bridge

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~650–850 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Domain + Storage + Migration · PR 2: UI Gate + Switcher + Wiring |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain model + pure functions + storage adapters + migration + all TDD tests | PR 1 | Base = main; domain, lib/adapters, migration tests; no UI |
| 2 | UI gate, switcher, hook, Home/Diagnostic/Practice wiring | PR 2 | Base = main (after PR 1 merges); StudentGate, StudentSwitcher, useActiveStudent, Nav chip, HomeNextStepClient integration, practice/diagnostic gate wiring |

---

## Phase 1: Domain Model (Pure — No I/O, No React)

- [x] 1.1 Create `src/domain/student-profile/index.ts` with `StudentProfile`, `CreateProfileInput`, `ProfileValidationError`, `ProfilesState`, `ProgressState<T>` types (all fields `readonly`)
- [x] 1.2 Implement `validateDisplayName(input: string): ProfileValidationError | null` — rejects empty/too-long/invalid-chars after trim; Unicode `\p{L}\p{N}\p{Z}` allowed
- [x] 1.3 Implement `normalizeDisplayName(input: string): string` — trim + collapse internal whitespace; preserve casing
- [x] 1.4 Implement `createStudentId(): string` — `crypto.randomUUID()` with `local-` prefix; no PII
- [x] 1.5 Implement `createProfile(input: CreateProfileInput, now?): StudentProfile` — validate, normalize, generate ID, set timestamps
- [x] 1.6 Implement `selectActiveProfile(state: ProfilesState): StudentProfile | null` — lookup by `activeStudentId`; no auto-create
- [x] 1.7 Implement `updateLastActiveAt(profile: StudentProfile, now?): StudentProfile` — returns new object, `lastActiveAt` updated
- [x] 1.8 Write TDD tests for all domain functions in `src/domain/__tests__/student-profile.test.ts`

## Phase 2: Storage Adapters + Migration (localStorage I/O)

- [x] 2.1 Create `src/lib/student-profile-storage.ts` — `loadProfiles()`, `saveProfiles(state)`, `getActiveStudentId()`, `setActiveStudentId(id)` (returns `{ ok: false, reason: "profile-not-found" }` on unknown id, never throws across the storage boundary), `createProfileAndActivate(input)`, `recoverActiveProfile()`; key `pre-utn.profiles.v1`; swallow errors
- [x] 2.2 Add `studentId?: string` to `PracticeAttempt` in `src/domain/progress/index.ts` (optional for backward compat)
- [x] 2.3 Rewrite `src/lib/practice-progress.ts` — central-map shape `{ students: Record<studentId, PracticeProgress>; activeStudentId: string | null }` under `pre-utn.practice.v1`; `loadProgress()` reads active slice; `addAttempt()` gated — returns `{ ok: false, reason: "missing-active-profile" }` if null
- [x] 2.4 Rewrite `src/lib/diagnostic-storage.ts` — central-map shape for `DiagnosticResult` and `StudyPlan`; `loadDiagnosticResult()`, `saveDiagnosticResult(result)`, `loadStudyPlan()`, `saveStudyPlan(plan)` all gated on active profile
- [x] 2.5 Implement legacy migration in `practice-progress.ts` (lazy on adapter load): detect old flat shape → create `Alumno local` profile → re-key all attempts under new `studentId`; idempotent (check profiles.v1 exists before migrating)
- [x] 2.6 Write adapter + migration tests in `src/lib/__tests__/student-profile-storage.test.ts` and `src/lib/__tests__/practice-progress-migration.test.ts`

## Phase 3: Client Hook + UI Components (React)

- [ ] 3.1 Create `src/hooks/useActiveStudent.ts` — `useActiveStudent()` returning `{ student: StudentProfile | null; createAndActivate: (name: string) => void; switchTo: (id: string) => void; refresh: () => void; isLoading: boolean }`
- [ ] 3.2 Create `src/components/StudentGate.tsx` — identification card with exact copy: heading `¿Quién está estudiando ahora?`, body, label `Nombre o apodo`, button `Empezar a estudiar`, info line; validates via domain `validateDisplayName`; no forbidden language
- [ ] 3.3 Create `src/components/home/StudentSwitcher.tsx` — lists existing profiles, allows picking one or creating new; no delete/edit
- [ ] 3.4 Modify `src/components/home/HomeNextStepClient.tsx` — call `useActiveStudent`; if null render `<StudentGate>` instead of dashboard; if active render `Estás estudiando como {displayName}` in dashboard zone; reload progress on student switch
- [ ] 3.5 Modify `src/components/Nav.tsx` — add `Alumno activo: {displayName}` chip when profile is active (top bar, right side)
- [ ] 3.6 Modify `src/app/practice/usePracticeFlow.ts` — on `handleAnswerSubmit`, check `recoverActiveProfile()` before calling `addAttempt`; if null, surface `StudentGate` instead of persisting
- [ ] 3.7 Modify `src/app/diagnostic/page.tsx` — gate on `recoverActiveProfile()`; show `StudentGate` if null; write to active student
- [ ] 3.8 Verify no `Docente`, `login`, `cuenta`, `admin`, `email`, `contraseña`, `avatar`, or `Supabase` copy in any new or modified UI files
- [ ] 3.9 Run `pnpm run test`, `pnpm run typecheck`, `pnpm run build`; all must pass

## Phase 4: Verification

- [ ] 4.1 Verify all 14 required test cases from spec pass
- [ ] 4.2 Verify existing 1600+ tests still pass (migration backward compat)
- [ ] 4.3 Verify `pnpm run test && pnpm run typecheck && pnpm run build` passes end-to-end
- [ ] 4.4 Update `openspec/changes/STATUS.json` — change branch to null, status to done, add merge commit once both PRs are stacked and merged

---

## File Targets Summary

| File | Phase | Action |
|------|-------|--------|
| `src/domain/student-profile/index.ts` | 1 | Create |
| `src/domain/__tests__/student-profile.test.ts` | 1 | Create |
| `src/domain/progress/index.ts` | 2 | Modify |
| `src/lib/student-profile-storage.ts` | 2 | Create |
| `src/lib/__tests__/student-profile-storage.test.ts` | 2 | Create |
| `src/lib/practice-progress.ts` | 2 | Rewrite |
| `src/lib/__tests__/practice-progress-migration.test.ts` | 2 | Create |
| `src/lib/diagnostic-storage.ts` | 2 | Rewrite |
| `src/hooks/useActiveStudent.ts` | 3 | Create |
| `src/components/StudentGate.tsx` | 3 | Create |
| `src/components/home/StudentSwitcher.tsx` | 3 | Create |
| `src/components/home/HomeNextStepClient.tsx` | 3 | Modify |
| `src/components/Nav.tsx` | 3 | Modify |
| `src/app/practice/usePracticeFlow.ts` | 3 | Modify |
| `src/app/diagnostic/page.tsx` | 3 | Modify |
