# Exploration: student-identity-local-persistence-bridge

> **Status:** Complete (diagnostic only, no code changes)
> **Date:** 2026-06-12
> **Change:** `student-identity-local-persistence-bridge`
> **Depends on:** `consolidate-math-mvp-before-unit-3` (archived 2026-06-12, `eae6ddb`), `teacher-digital-home` (archived 2026-06-11), `feat-practice-attempt-timing-and-retry` (archived 2026-06-10)

---

## 1. Current State (verified 2026-06-12)

Progress is **global, single-tenant, localStorage-only**. There is **no `studentId`** anywhere in the domain, the storage layer, or the OpenSpec specs. A new term in this change is a greenfield addition.

### 1.1 Storage surface (the only places to touch)

| Key | Module | Shape today | Owner |
|-----|--------|-------------|-------|
| `pre-utn.practice.v1` | `src/lib/practice-progress.ts` | `PracticeProgress` (global, no `studentId`) | Practice flow + Home dashboard |
| `pre-utn.diagnostic.v1` | `src/lib/diagnostic-storage.ts` | `DiagnosticResult` (global) | Diagnostic page → Home dashboard |
| `pre-utn.study-plan.v1` | `src/lib/diagnostic-storage.ts` | `StudyPlan` (global) | Diagnostic results page → Home |

All three adapters follow the same pattern: versioned key, swallow `localStorage` errors, default to empty/null on bad JSON. `addAttempt()` is the only mutator; the rest are load/save/reset.

### 1.2 Domain surface (the only place to add `studentId`)

`src/domain/progress/index.ts` defines:

```ts
export interface PracticeAttempt {
  readonly exerciseId: string;
  readonly skillId: SkillId;
  readonly correct: boolean;
  readonly errorTag?: string;
  readonly answeredAt: string;
  readonly difficulty?: Difficulty;
  readonly timeMs: number;
  readonly attemptIndex: number;
  // ← studentId does NOT exist
}

export interface PracticeProgress {
  readonly attempts: readonly PracticeAttempt[];
  readonly accuracyBySkill: Record<string, number>;
  readonly trendBySkill: Record<string, Trend>;
  readonly lastPracticedBySkill: Record<string, string>;
  readonly diagnosticResult: DiagnosticResult | null;
  readonly studyPlan: StudyPlan | null;
}
```

`PracticeAttempt` is consumed by `computeAccuracy`, `computeTrend`, `computeMasteryLevel`, `deriveHomeNextStep`, `deriveTeacherHomeViewModel` (Home dashboard), and the `usePracticeFlow` hook. The whole domain already runs on a `Pick<PracticeProgress, "attempts" | ...>` shape — so the pure functions don't need to know about `studentId`, but the storage layer does.

### 1.3 Integration points (where the wiring lives)

| File | Current call | Will need to know the active `studentId` |
|------|--------------|----------------------------------------|
| `src/app/practice/usePracticeFlow.ts:110` | `setProgress(loadProgress())` | YES — must load per-student |
| `src/app/practice/usePracticeFlow.ts:287-298` | `addAttempt({ exerciseId, skillId, correct, ... })` | YES — must include `studentId` |
| `src/components/home/HomeNextStepClient.tsx:37` | `const progress = loadProgress()` | YES — must load per-student |
| `src/app/diagnostic/page.tsx:21, 175` | `loadProgress()` to read existing accuracy for study plan | YES — must load per-student |
| `src/app/diagnostic/page.tsx:104` | `saveDiagnosticResult(result)` | YES — must include `studentId` |
| `src/lib/diagnostic-storage.ts` | `loadDiagnosticResult` / `saveDiagnosticResult` / `loadStudyPlan` / `saveStudyPlan` | YES — keyed by student |
| `src/lib/practice-progress.ts` | `loadProgress` / `addAttempt` / `saveProgress` | YES — keyed by student |

The `usePracticeFlow` hook is the only **mutator** path. The other three are read-only consumers.

### 1.4 Route layout (no new routes needed)

```
/              → Home (uses HomeNextStepClient — needs per-student progress)
/diagnostic    → Diagnostic (writes DiagnosticResult, reads PracticeProgress)
/practice      → Practice flow (mutates PracticeProgress via addAttempt)
/practice?skill=…  (param-driven deep link)
```

No teacher route, no admin route, no student-list route. The change is purely **a storage shape change + a first-run UX + a migration**, not a new screen beyond the "Enter your name" gate.

### 1.5 Specs that already cover this surface

| Spec | Relevant requirement |
|------|----------------------|
| `openspec/specs/teacher-digital-home/spec.md` | `deriveTeacherHomeViewModel(input)` consumes `progress: PracticeProgress`; the type contract travels with the change. |
| `openspec/specs/diagnostic-shell/spec.md` | Diagnostic writes `DiagnosticResult` then derives `StudyPlan` from `loadProgress()` — both must become per-student. |
| `openspec/specs/guided-practice/spec.md` | Practice flow uses `addAttempt()` and `loadProgress()` — both must become per-student. |

No existing spec mentions `studentId`, `student`, or `profile`. This is the first.

### 1.6 OpenSpec / multi-PC state

- `openspec/changes/STATUS.json` has 15 entries, all `done`. **`activeBranches: []`**, `lastAudit: 2026-06-10T23:30:00-03:00`. Working tree clean on `main` (HEAD `ee44100`, parent `eae6ddb`).
- This change must register in `STATUS.json` with `status: "in-progress"` and a branch name (per AGENTS.md §"Gestión de ramas SDD").
- Working tree currently has uncommitted teacher-home code (per `teacher-digital-home` STATUS entry, `ee44100` is the archive commit, not the working commit). **Verify before opening a new branch.**

---

## 2. Affected Areas

### 2.1 Will change (new + modified)

| Path | Change kind | Why |
|------|-------------|-----|
| `src/domain/student-profile/` (new) | NEW | Pure `StudentProfile` type + `validateDisplayName`, `normalizeDisplayName`, `createStudentId`, `createProfile`, `selectActiveProfile`, `updateLastActiveAt`. Zero React, zero I/O. |
| `src/domain/progress/index.ts` | MODIFY | Add `studentId: string` to `PracticeAttempt` (optional for backward compat, like `difficulty`). Add pure helper `progressForStudent(progress, studentId)`. |
| `src/lib/practice-progress.ts` | MODIFY | `addAttempt` includes `studentId`; storage key becomes `pre-utn.practice.v1.<studentId>` OR a single `pre-utn.practice.v1` holding `Record<studentId, PracticeProgress>`. **See Approach A vs B below.** |
| `src/lib/student-profile-storage.ts` (new) | NEW | localStorage adapter for profile list + active profile id, versioned `pre-utn.profiles.v1`. |
| `src/lib/diagnostic-storage.ts` | MODIFY | `DiagnosticResult` and `StudyPlan` keys become per-student OR central map. |
| `src/app/practice/usePracticeFlow.ts` | MODIFY | Read active studentId via a thin hook (`useActiveStudent`); pass it to `addAttempt`. |
| `src/components/home/HomeNextStepClient.tsx` | MODIFY | Read active studentId, load per-student progress. |
| `src/app/diagnostic/page.tsx` | MODIFY | Same. |
| `src/components/StudentGate.tsx` (new) | NEW | "Enter your name/nick" UI shown when no active profile. |
| `src/app/practice/page.tsx` | MODIFY | Wrap with `<StudentGate>` OR read from a context provider. |
| `src/app/diagnostic/page.tsx` | MODIFY | Same. |
| `src/app/page.tsx` | MODIFY | Same. |
| `openspec/changes/student-identity-local-persistence-bridge/specs/...` (new) | NEW | Delta spec for `student-profile`, `practice-attempt-telemetry` (MODIFIED: add `studentId`), `teacher-digital-home` (note: `PracticeProgress` shape still compatible because domain functions use `Pick<>`). |
| `openspec/changes/STATUS.json` | MODIFY | Register this change as `in-progress` with branch. |

### 2.2 Must NOT change

| Path | Reason |
|------|--------|
| `src/domain/evaluator/*` | Pure evaluators don't read progress. |
| `src/domain/catalog/*` | Content loaders don't read progress. |
| `src/domain/feedback/*` | Mappings are static. |
| `src/domain/intervals/*`, `src/domain/models/*` | Pure model types. |
| `src/components/practice/*.tsx` | Components are dumb; they consume `usePracticeFlow`'s output. |
| `src/domain/shared/skill-id.ts` | No change. |
| All `*.test.ts` for unchanged modules | If `PracticeAttempt` shape stays backward-compatible (additive `studentId?`), existing 1606 tests keep passing. |

### 2.3 Storage key decision (the heart of the change)

Two viable shapes. The choice is **architectural**, not cosmetic:

**Shape A — per-student keys**
```
pre-utn.practice.v1.<studentId>   → PracticeProgress
pre-utn.diagnostic.v1.<studentId> → DiagnosticResult
pre-utn.study-plan.v1.<studentId> → StudyPlan
pre-utn.profiles.v1               → { profiles: StudentProfile[], activeStudentId: string }
```
- Pros: smallest payloads per write; trivial to "delete a student" by removing two keys; matches the user's mental model.
- Cons: profile adapter must know all keys; a `Record<string, string>` enumeration via `Object.keys(localStorage)` becomes the only way to list students; tests must mock multiple keys.

**Shape B — central map per key**
```
pre-utn.practice.v1   → { students: Record<studentId, PracticeProgress>, activeStudentId: string }
pre-utn.diagnostic.v1 → { students: Record<studentId, DiagnosticResult>, activeStudentId: string }
pre-utn.study-plan.v1 → { students: Record<studentId, StudyPlan>, activeStudentId: string }
pre-utn.profiles.v1   → { profiles: StudentProfile[], activeStudentId: string }
```
- Pros: one read per consumer (`loadProgress()` returns the active student's slice); `loadProgress` stays the same call signature; existing tests need almost no changes.
- Cons: full-map writes on every attempt; JSON serializes the whole `students` record even when only one changed; future Supabase swap is "easy" only if Supabase also has one table per key.

**Recommendation: Shape B.** The localStorage shape is throwaway; the goal is to make the **adapter interface** (`loadProgress` / `addAttempt`) stable so the Supabase swap is just a new adapter implementation behind the same `loadProgress()` call. Shape A leaks the storage key into the call site, which defeats the abstraction. See §3.

### 2.4 Migration shape

If `pre-utn.practice.v1` exists in the user's browser and `pre-utn.profiles.v1` does not, this is a first-time upgrade:

```
1. Read pre-utn.practice.v1 (legacy global PracticeProgress).
2. Generate studentId = "local-default" (or a UUID).
3. Build profile: { studentId, displayName: "Alumno local", createdAt: now, lastActiveAt: now }.
4. Build new shape: { students: { "local-default": legacyProgress }, activeStudentId: "local-default" }.
5. Write pre-utn.practice.v1 (new shape).
6. Write pre-utn.profiles.v1.
7. Same for pre-utn.diagnostic.v1 → migrate to { students: { "local-default": legacyResult } }.
```

**Risk**: a user with both `practice.v1` AND `diagnostic.v1` but different IDs in each must be treated as "one default student for both" — explicit acceptance criterion. The migration is one-shot, on first load, idempotent.

### 2.5 First-run UX

When `pre-utn.profiles.v1` is absent OR `activeStudentId` doesn't match any profile:
- Render `<StudentGate>` in place of the page content.
- Form: displayName (1–40 chars, trimmed), optional nick.
- On submit: create profile, set active, persist, gate lifts, page renders.

The gate sits in the **page component**, not in the domain. Pages already read from `useEffect`-loaded progress; they need a sibling `useEffect` that checks the active profile and either renders the gate or the content. The pattern matches how `EMPTY_PROGRESS` is used today in `usePracticeFlow:108`.

### 2.6 Switching student

Not a hard requirement of this slice, but acceptance says *"Switching student changes visible progress."* Minimum viable: profile list / "Cambiar alumno" button on the Home dashboard, opens a small dialog listing profiles. Each row: name, "Activar" button. On activate: write `activeStudentId`, reload page (or trigger re-fetch of progress). Out of scope: avatar, password, per-student theme.

---

## 3. Approaches

### Approach A — Domain-first TDD, two chained PRs (RECOMMENDED)

```
PR-1 (Domain + Storage, TDD-first)
  - src/domain/student-profile/ (new): StudentProfile type, validateDisplayName,
    normalizeDisplayName, createStudentId, createProfile, selectActiveProfile,
    updateLastActiveAt. ~150 lines, ~25 pure tests.
  - src/domain/progress/index.ts: add optional studentId to PracticeAttempt
    (backward compat: legacy attempts get studentId: "legacy" on load). Add
    progressForStudent(progress, studentId) pure helper. ~30 lines, ~10 tests.
  - src/lib/student-profile-storage.ts (new): adapter for profiles + active.
    ~80 lines, ~12 tests.
  - src/lib/practice-progress.ts + diagnostic-storage.ts: switch internal
    storage to Shape B (central map), with one-shot migration on first load.
    Adapter interface (loadProgress, addAttempt, saveProgress) UNCHANGED.
    ~120 lines changed, ~30 migration tests.
  - 0 lines in app/, components/, page.tsx.
  - 0 changes to Home, Practice, Diagnostic UI.
  - ~80 new tests, ~280 new lines.
  - Strict TDD: every test fails before code, passes after.
  - Pre-conditions: no app/ coupling, all existing 1606 tests still pass
    (PracticeAttempt gets an OPTIONAL studentId, defaulting to "legacy").

PR-2 (UX wiring + StudentGate + switching)
  - src/hooks/useActiveStudent.ts (new): hook returning { activeProfile, setActive, list, create }.
  - src/components/StudentGate.tsx (new): name/nick form.
  - src/app/page.tsx, /practice/page.tsx, /diagnostic/page.tsx: render gate
    when no active profile, else render content.
  - src/components/home/StudentSwitcher.tsx (new): dropdown of profiles on
    Home, "Activar" / "Agregar nuevo" actions.
  - HomeNextStepClient, usePracticeFlow, diagnostic/page: pass active
    studentId when reading/writing progress (no behavior change because PR-1
    already defaulted to active).
  - ~150 lines diff, ~15 tests (gate UX + switcher), GGA caught real issues
    expected in the gate copy + accessibility.
```

| Pros | Cons | Effort |
|------|------|--------|
| Each PR is reviewable in isolation (<400 lines per PR) | 2 PRs = 2 PR-cycles | Low per PR (Medium total) |
| Domain + storage land first; UI is a thin overlay | Migration test matrix grows fast (legacy practice + legacy diagnostic + both + neither) | |
| Backward compat keeps existing 1606 tests green | Profile switch UX is bare-bones (no avatar, no delete in PR-2) | |
| Supabase swap is a one-file change later | `studentId` is an optional field — easy to forget passing it | |
| F-06 (GGA) compliance easy: each PR is small, no Windows GGA ambiguity | | |

**Estimated total diff**: ~430 lines across 2 PRs, ~95 new tests, no behavior change for existing students. 400-line budget: **Medium** (PR-1 is 280 lines, PR-2 is 150).

### Approach B — Single mega-PR

Everything in one PR: domain, storage, migration, gate UI, switcher.

| Pros | Cons | Effort |
|------|------|--------|
| One PR to review end-to-end | 700+ lines = 400-line budget violation, requires `size:exception` (per STATUS.json precedent for `feat-practice-attempt-timing-and-retry`) | High |
| Single delivery | Hard to roll back partially; if migration has a bug, users lose data | |
| | Multi-PC GGA concerns amplified on a single 700-line diff | |

**Verdict**: Rejected. Violates the 400-line review budget. Use only if the user explicitly accepts a `size:exception`.

### Approach C — Domain-only, no UX (defer the gate)

Implement `StudentProfile` and per-student storage, but **no** StudentGate. Always auto-create `Alumno local` on first load.

| Pros | Cons | Effort |
|------|------|--------|
| Smallest diff | Acceptance criteria explicitly require "New student enters name/nick" | Low |
| No gate UX to design | "Switching student changes visible progress" is broken | |
| Fastest to ship | Doesn't answer the user's pedagogical question (no student agency) | |

**Verdict**: Rejected. Fails acceptance criteria #1 and #4.

### Approach D — Skip the slice, wait for Supabase

| Pros | Cons | Effort |
|------|------|--------|
| No localStorage debt to migrate | User said "pre-utn U3" requires this | — |
| | Supabase is "future storage, but this slice must NOT implement Auth, RLS, or API" — the localStorage layer IS the prerequisite | |
| | U3 would build on top of the same gap | |

**Verdict**: Rejected. The user's verified intent says "before Unit 3, minimal local student identity and student-separated progress."

---

## 4. Recommendation

**Approach A — Domain-first TDD, 2 chained PRs.**

### Why (in order of weight)

1. **Acceptance is multi-faceted.** "New student enters name/nick" + "attempts associated with active profile" + "switching student changes visible progress" + "old progress migrates" + "design ready for Supabase" — that's 5 distinct concerns. Lumping them into one PR hides the seams.
2. **Domain + storage are the only changes with risk.** The migration is a one-shot, idempotent operation that must be 100% correct or students lose attempts. Pure TDD on the migration with a test matrix (legacy-practice-only / legacy-diagnostic-only / both / neither) is the only way to prove correctness. Keeping the migration in PR-1 isolates it.
3. **UX is dumb on top of a clean adapter.** Once `loadProgress()` returns per-student data, the gate is a conditional render and the switcher is a dropdown. No domain risk in PR-2.
4. **Backward compat keeps the gate from blocking the slice.** Optional `studentId?` on `PracticeAttempt` defaults to `"legacy"` on load, so existing 1606 tests keep passing.
5. **Supabase readiness is the abstraction's job, not the storage key's.** The adapter interface (`loadProgress()`, `addAttempt()`, `saveProgress()`, `saveDiagnosticResult()`, `loadDiagnosticResult()`) is what gets reimplemented later. The internal JSON shape (Shape A vs B) is irrelevant — what matters is that the call sites never see localStorage.
6. **Multi-PC is a non-issue** because STATUS.json is the single source of truth and both PRs are autonomous.

### Out of scope (do NOT do in this change)

- Supabase implementation, Auth, RLS, API.
- Teacher multi-student panel (`/teacher` route) — separate change.
- Per-student theme, avatar, password.
- Deleting `SkillRoadmap` (already removed from Home render; not relevant here).
- Deleting old `pre-utn.practice.v1` legacy shape (we migrate in place; the field "students" becomes a map).
- Per-student study plan versioning (use existing `StudyPlan.version: 1`).
- `MathWatermark` personalization (no pedagogical value).
- Migration telemetry (we don't have analytics).

### Sequencing detail (for sdd-propose)

```
PR-1 (Domain + Storage, TDD-first, RED → GREEN → REFACTOR)
  Step 1 — Pure domain (TDD):
    - src/domain/student-profile/index.ts
      Types: StudentProfile, CreateProfileInput, ProfileValidationError
      Functions: validateDisplayName, normalizeDisplayName,
                 createStudentId, createProfile, selectActiveProfile,
                 updateLastActiveAt
    - src/domain/student-profile/__tests__/index.test.ts (~25 cases)
  Step 2 — Domain progress (TDD):
    - src/domain/progress/index.ts: add studentId?: string to PracticeAttempt
    - src/domain/progress/__tests__/index.test.ts: 10 new cases
  Step 3 — Storage adapters (TDD):
    - src/lib/student-profile-storage.ts (loadProfiles, saveProfiles,
      getActiveStudentId, setActiveStudentId)
    - src/lib/student-profile-storage.test.ts (~12 cases)
  Step 4 — Migrate practice-progress + diagnostic-storage (TDD):
    - Change internal shape to central map (Shape B)
    - Adapter signatures UNCHANGED
    - Add migrateLegacyProgressIfNeeded() in each adapter
    - Migration test matrix (4 cases × 2 adapters = ~16 cases)
  Step 5 — Domain test suite for legacy "studentId" backward compat
    (ensure no existing 1606 tests fail)
  Estimated: ~280 lines diff, ~63 new tests, 0 lines in app/ or components/.

PR-2 (UX + switching, TDD on gate logic)
  Step 1 — Hook + gate (TDD on logic):
    - src/hooks/useActiveStudent.ts: returns { activeProfile, setActive,
      list, create }
    - src/hooks/__tests__/useActiveStudent.test.ts (pure-ish with localStorage mock)
    - src/components/StudentGate.tsx: name/nick form, validation
    - src/components/__tests__/StudentGate.test.tsx
  Step 2 — Page composition:
    - src/app/page.tsx, /practice/page.tsx, /diagnostic/page.tsx:
      render gate when no active profile
    - src/components/home/StudentSwitcher.tsx: list + activate
    - src/components/home/__tests__/StudentSwitcher.test.tsx
  Step 3 — Wire loaders:
    - HomeNextStepClient, usePracticeFlow, diagnostic/page: read active
      studentId (no behavior change, but explicit)
  Step 4 — Verify gates: pnpm run test && pnpm run typecheck && pnpm run build
  Estimated: ~150 lines diff, ~15 new tests, GGA-validatable.
```

### Open questions for sdd-propose (1 max)

**Q1 — Display name character set**: Latin-only (current project is in Spanish) or Unicode? Recommendation: Unicode (`\p{L}\p{N}\p{Z}`), 1–40 chars after trim. Affects `validateDisplayName` only.

---

## 5. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Migration corrupts existing data** | Critical | TDD with full test matrix (legacy-practice-only / legacy-diagnostic-only / both / neither / corrupt JSON in either). Migration is idempotent (checks `profiles.v1` existence). Adapter swallows errors and returns empty state on first run. **Red flag: if a single existing user loses attempts, the change fails.** |
| **Existing 1606 tests break** | High | `studentId?` is **optional** on `PracticeAttempt`. Legacy data normalizes to `studentId: "legacy"` on load. Pure domain functions (`computeAccuracy`, `computeTrend`, `computeMasteryLevel`) don't read `studentId` — they operate on the slice they receive. |
| **400-line budget violation** | Medium | Approach A: PR-1 ~280 lines, PR-2 ~150 lines. Both safe. `sdd-tasks` must re-forecast. |
| **Gate UX locks out users** | Medium | Gate is dismissable to "Entrar como Alumno local" (one click, no text). Acceptance: "Existing user does not lose old data" — pre-migrated users never see the gate because migration creates the profile. |
| **Profile switching leaves stale UI state** | Medium | `useActiveStudent` exposes a refresh trigger; pages re-load progress on `activeStudentId` change. Existing useEffect pattern in `usePracticeFlow:109-111` already does this for progress. |
| **GGA Windows bypass (F-06 from consolidation report)** | Medium | Pre-existing risk. PR-1 is pure domain + storage — Windows-GGA-able. PR-2 is UX — also Windows-GGA-able because changes are presentational. Linux GGA can be a follow-up after the slice lands, as in previous slices. |
| **STATUS.json drift** | Low | Add entry to STATUS.json with `status: "in-progress"`, `branch: "feat/student-identity-local-persistence-bridge"` BEFORE opening the branch. Update on merge. |
| **Practice diagnostic link breakage** | Low | `diagnostic/page.tsx:175` calls `loadProgress()` then `createStudyPlan(result, progress)`. If the adapter returns the active student's progress (PR-1) and the diagnostic result was just saved for the same student (PR-1), this works. Verify in PR-2. |
| **Display name duplicates** | Low | Two profiles with `displayName: "Juan"` is allowed (the `studentId` is the canonical key, not the name). The switcher shows them both. `studentId` is a stable opaque ID (`local-${nanoid}` or similar). |
| **Supabase readiness overstated** | Low | The adapter interface is what gets re-implemented. The JSON shape (Shape B) is internal. A future `SupabaseProgressAdapter` will have the same `loadProgress()` / `addAttempt()` signature, so call sites don't change. |
| **Multi-PC `activeStudentId` mismatch** | Low | `activeStudentId` is per-browser (localStorage). If a student switches PCs, the migration logic on each PC creates an `Alumno local` profile if none exists. **Acceptance is per-PC, not cross-PC.** The future Supabase swap will fix this. |

---

## 6. Ready for Proposal

**Yes** — exploration is sufficient to launch `sdd-propose` on this same change name.

The orchestrator should confirm with the user:

1. **Scope**: 2-PR chain (PR-1: domain + storage + migration, PR-2: gate + switcher + wiring).
2. **Storage shape**: Shape B (central map per key, adapter interface unchanged). Trade-off documented in §2.3.
3. **Default name**: `Alumno local` for migrated users. Display name editable on the gate and on the switcher.
4. **Out of scope**: Supabase, Auth, RLS, teacher panel, avatars, per-student theme.
5. **Multi-PC**: STATUS.json entry before branch opens. No Supabase sync between PCs.
6. **Next change after this**: `unit-3-fundamentos-slice` (per `2026-06-11-post-u2-next-options.md`), but only after this slice's gates are green and Supabase-readiness is documented.

The orchestrator should also surface that this slice **must land before Unit 3** (per the user's verified intent) and that the per-student storage is the prerequisite for any future teacher/dashboard work that needs to compare students.

---

## 7. SDD Result Envelope

**Status**: success
**Summary**: Mapped the implementation surface for minimal local student identity + per-student progress persistence. Verified that the current codebase is single-tenant (`PracticeProgress` has no `studentId`, only one localStorage key per artifact) and that the integration points are confined to 3 lib/ files, 3 page/hook files, and the home dashboard. Recommended 2-PR chain (PR-1: domain + storage + migration TDD; PR-2: UX gate + switcher), ~430 lines total, ~95 new tests, with backward-compat strategy that keeps the existing 1606 tests green. Identified 11 risks, with migration correctness as the only critical one — fully mitigated by TDD with a 4×2 test matrix.
**Artifacts**: `openspec/changes/student-identity-local-persistence-bridge/exploration.md` | Engram `sdd/student-identity-local-persistence-bridge/explore`
**Next**: sdd-propose (write proposal.md for the 2-PR chain)
**Risks**: Migration data loss (Critical, mitigated by idempotent TDD); existing test breakage (High, mitigated by `studentId?` optional + `Pick<>` shape); 400-line budget (Medium, PR-1=280 / PR-2=150); gate UX lockout (Medium, mitigated by "Entrar como Alumno local" one-click); GGA Windows bypass (Medium, inherited from F-06).
**Skill Resolution**: paths-injected — 2 skills (sdd-explore, cognitive-doc-design)
