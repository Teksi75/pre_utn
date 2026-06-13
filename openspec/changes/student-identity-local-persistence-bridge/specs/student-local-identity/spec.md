# Student Local Identity Specification

## Purpose

Adds minimal local student identity so practice attempts, diagnostic results, and study plans stop being anonymous on a given device. Profiles live in the browser, persist to `localStorage` behind a Supabase-ready adapter boundary, and migrate legacy global progress to a default `Alumno local` profile without losing any attempt. No authentication, no server, no teacher/admin entry point in this slice. The shape is the contract that a future Supabase + Auth + RLS + `/docente` stack will swap in for, without rewriting the domain.

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | Practice is contextualised: the cockpit knows *who* is studying, and that student's progress is durable across sessions on the same device. The alumno can change or add profiles without losing prior work. |
| Docente | No direct change in this slice. Progress becomes traceable to a profile, which is the prerequisite for any future multi-student insight; the teacher surface itself stays out of scope. |

## Types

| Type | Role |
|------|------|
| `StudentProfile` | `{ studentId: string; displayName: string; createdAt: string; lastActiveAt: string }` — canonical local identity, all fields `readonly`. |
| `CreateProfileInput` | `{ displayName: string; studentId?: string }` — input to `createProfile`; `studentId` is generated when omitted. |
| `ProfileValidationError` | Discriminated tag: `"empty"` \| `"too-long"` \| `"invalid-chars"`. |
| `ProfilesState` | `{ profiles: readonly StudentProfile[]; activeStudentId: string \| null }` — adapter shape. |
| `ProgressState<T>` | `{ students: Record<studentId, T>; activeStudentId: string \| null }` — central map per persistence key. |

## Requirements

### Requirement: StudentProfile Model

The system MUST define `StudentProfile` with the four canonical fields (`studentId`, `displayName`, `createdAt`, `lastActiveAt`), all `readonly`. The type MUST live under `src/domain/student-profile/` and MUST NOT import React, Next.js, Supabase, or perform any I/O.

#### Scenario: profile shape is canonical

- GIVEN the `StudentProfile` type
- WHEN inspected
- THEN it has exactly `studentId: string`, `displayName: string`, `createdAt: string`, `lastActiveAt: string` (all `readonly`)

### Requirement: Validate Display Name

`validateDisplayName(input: string): ProfileValidationError | null` MUST return `null` for acceptable input and a `ProfileValidationError` tag otherwise. Input MUST be trimmed before validation. Acceptable: 1–40 characters from Unicode letter/number/space categories (`\p{L}\p{N}\p{Z}`).

#### Scenario: empty after trim is rejected

- GIVEN an input of only whitespace
- WHEN `validateDisplayName` is called
- THEN it returns `"empty"`

#### Scenario: over 40 chars is rejected

- GIVEN a 41-character display name
- WHEN `validateDisplayName` is called
- THEN it returns `"too-long"`

#### Scenario: characters outside the allowed set are rejected

- GIVEN an input made up entirely of emojis
- WHEN `validateDisplayName` is called
- THEN it returns `"invalid-chars"`

### Requirement: Normalize Display Name

`normalizeDisplayName(input: string): string` MUST trim leading/trailing whitespace and collapse internal runs of whitespace to a single space. Original casing MUST be preserved.

#### Scenario: trim and collapse

- GIVEN input `"  María  Paz  "`
- WHEN `normalizeDisplayName` is called
- THEN it returns `"María Paz"`

### Requirement: Stable Opaque Student ID

`createStudentId(): string` MUST return a stable, opaque, locally-unique identifier using a non-PII scheme (recommended: prefixed random, e.g. `local-{nanoid}`). The ID MUST NOT contain the display name, email, or any user-supplied data.

#### Scenario: generated id is opaque

- GIVEN a fresh generation
- WHEN `createStudentId` is called
- THEN the returned string does NOT include the display name or any user-supplied data

#### Scenario: collisions are vanishingly unlikely

- GIVEN 10 000 generated ids
- WHEN checked for duplicates
- THEN the count of unique values is >= 9 999

### Requirement: Create Profile

`createProfile(input: CreateProfileInput, now: () => Date = () => new Date()): StudentProfile` MUST validate the `displayName`, normalize it, generate a `studentId` if missing, and return a `StudentProfile` with ISO-8601 `createdAt` and `lastActiveAt` equal to `now()`.

#### Scenario: minimal input produces a valid profile

- GIVEN `CreateProfileInput = { displayName: "Ana" }` and a fixed clock
- WHEN `createProfile` is called
- THEN the returned profile has the normalized name, a generated `studentId`, and `createdAt === lastActiveAt === now().toISOString()`

#### Scenario: invalid name throws

- GIVEN `CreateProfileInput = { displayName: "" }`
- WHEN `createProfile` is called
- THEN it throws a `ProfileValidationError`

### Requirement: Select Active Profile

`selectActiveProfile(state: ProfilesState): StudentProfile | null` MUST return the profile whose `studentId` equals `state.activeStudentId`, or `null` when no match exists. The function MUST NOT mutate state and MUST NOT auto-create a profile.

#### Scenario: match returns profile

- GIVEN a `ProfilesState` with `activeStudentId` pointing at an existing profile
- WHEN `selectActiveProfile` is called
- THEN it returns that profile

#### Scenario: dangling id returns null

- GIVEN a `ProfilesState` with `activeStudentId` that no profile has
- WHEN `selectActiveProfile` is called
- THEN it returns `null`

### Requirement: Update Last Active

`updateLastActiveAt(profile: StudentProfile, now: () => Date = () => new Date()): StudentProfile` MUST return a new `StudentProfile` with `lastActiveAt = now().toISOString()` and all other fields equal to the input. It MUST be a pure replacement — no shared references mutated.

#### Scenario: only lastActiveAt changes

- GIVEN a profile and a fixed later clock
- WHEN `updateLastActiveAt` is called
- THEN the returned profile has identical `studentId`, `displayName`, `createdAt` and a new `lastActiveAt`

### Requirement: Profile Storage Adapter

A `localStorage` adapter under `src/lib/student-profile-storage.ts` MUST expose `loadProfiles()`, `saveProfiles(state)`, `getActiveStudentId()`, `setActiveStudentId(id)`, `createProfileAndActivate(input)`, `recoverActiveProfile()`. The adapter MUST use the versioned key `pre-utn.profiles.v1` and MUST swallow `localStorage` errors by returning an empty state — never throw across the boundary.

#### Scenario: empty storage returns empty state

- GIVEN `localStorage` has no `pre-utn.profiles.v1`
- WHEN `loadProfiles` is called
- THEN it returns `{ profiles: [], activeStudentId: null }`

#### Scenario: corrupt JSON is recovered

- GIVEN `pre-utn.profiles.v1` contains invalid JSON
- WHEN `loadProfiles` is called
- THEN it returns an empty state and does not throw

#### Scenario: createProfileAndActivate writes a new profile and sets it active

- GIVEN valid input and an empty state
- WHEN `createProfileAndActivate` is called
- THEN `loadProfiles` returns a state with exactly one profile and `activeStudentId` equal to its `studentId`

### Requirement: Switch Active Profile

`setActiveStudentId(id: string): ProfileSaveResult` MUST return `{ ok: true, state }` with `state.activeStudentId` equal to the given id and the profile list unchanged when the id matches an existing profile. When the id does not match any existing profile, the adapter MUST return `{ ok: false, reason: "profile-not-found" }` and MUST NOT mutate persisted state — silent switch to an unknown id is forbidden, and the adapter MUST NOT throw across the storage boundary (consistent with `localStorage` error-swallowing policy in the storage adapter requirement above).

#### Scenario: valid id is set

- GIVEN a state with two profiles
- WHEN `setActiveStudentId` is called with the second id
- THEN the result is `{ ok: true, state }` and the returned state has `activeStudentId` equal to the second id and both profiles intact

#### Scenario: unknown id returns a blocked result

- GIVEN a state with two profiles
- WHEN `setActiveStudentId` is called with a non-existent id
- THEN the result is `{ ok: false, reason: "profile-not-found" }` and persisted state is unchanged

### Requirement: Recover Active Profile

`recoverActiveProfile(): StudentProfile | null` MUST return `selectActiveProfile(loadProfiles())`. If the result is `null` (no profiles, or dangling active id), it MUST return `null` and MUST NOT auto-create a profile.

#### Scenario: dangling id is reported as null

- GIVEN a state where `activeStudentId` has no matching profile
- WHEN `recoverActiveProfile` is called
- THEN it returns `null`

### Requirement: Per-Student Progress Adapter

The practice, diagnostic, and study-plan adapters MUST internally key by `studentId` using the central map shape (`{ students: Record<studentId, T>; activeStudentId: string | null }`). Existing public signatures (`loadProgress`, `addAttempt`, `saveProgress`, `loadDiagnosticResult`, `saveDiagnosticResult`, `loadStudyPlan`, `saveStudyPlan`) MUST be preserved and MUST return data for the active student only. Adapter keys MUST stay versioned (`pre-utn.practice.v1`, `pre-utn.diagnostic.v1`, `pre-utn.study-plan.v1`).

#### Scenario: loadProgress returns active student's slice

- GIVEN a stored map with two students
- WHEN `loadProgress` is called with `activeStudentId` set to student A
- THEN it returns student A's `PracticeProgress` and never student B's

#### Scenario: addAttempt writes to active student only

- GIVEN a stored map with one student
- WHEN `addAttempt` is called for an exercise
- THEN the attempt is appended to that student's `attempts` and the map is re-saved

### Requirement: Legacy Global Progress Migration

When an adapter loads for the first time and detects the legacy global shape (no `students` field, plus pre-existing `pre-utn.practice.v1` / `pre-utn.diagnostic.v1` / `pre-utn.study-plan.v1` in the old global payload), the adapter MUST:

1. Generate a default `studentId`.
2. Create a `StudentProfile` with `displayName: "Alumno local"`.
3. Re-key the legacy data under that `studentId` in the new map shape.
4. Set `activeStudentId` to that `studentId`.
5. Persist the new shape and the `pre-utn.profiles.v1` state.

The migration MUST be idempotent: a second run MUST NOT duplicate the profile or re-key attempts. It MUST NOT delete or rewrite the legacy data without first producing a valid migration.

#### Scenario: legacy practice + no profiles migrates to one profile

- GIVEN `pre-utn.practice.v1` with global attempts and no `pre-utn.profiles.v1`
- WHEN any adapter loads
- THEN exactly one `Alumno local` profile is created, all attempts are preserved under that profile, and `activeStudentId` is set to it

#### Scenario: legacy practice + legacy diagnostic migrate to the same profile

- GIVEN both `pre-utn.practice.v1` and `pre-utn.diagnostic.v1` in the old global shape
- WHEN any adapter loads
- THEN a single `Alumno local` profile owns both migrated progress and the diagnostic result

#### Scenario: migration is idempotent

- GIVEN a migration already completed
- WHEN the adapter loads again
- THEN the profile list still has exactly one `Alumno local` and no attempts are duplicated

#### Scenario: no legacy data does not auto-create a profile

- GIVEN no `pre-utn.practice.v1` and no `pre-utn.diagnostic.v1`
- WHEN any adapter loads
- THEN no `Alumno local` profile is created and `activeStudentId` is `null`

#### Scenario: every legacy attempt is preserved

- GIVEN a legacy global progress with 12 attempts (any field)
- WHEN the migration runs
- THEN the active student's `attempts` array contains exactly the same 12 attempts with identical `exerciseId`, `correct`, `errorTag`, `answeredAt`, `difficulty`, `timeMs`, `attemptIndex`

### Requirement: Anonymous Attempts Forbidden

The system MUST NOT record a new `PracticeAttempt`, `DiagnosticResult`, or `StudyPlan` when no active profile exists. The gate is a precondition, not a UI choice: the record functions SHALL NOT write to storage and SHALL signal a blocked state to the caller — no silent swallow.

#### Scenario: addAttempt without active profile writes nothing

- GIVEN no active profile
- WHEN the user submits a practice answer
- THEN no `PracticeAttempt` is written to storage AND the UI is informed the action was blocked (gating UI is shown)

#### Scenario: diagnostic save without active profile writes nothing

- GIVEN no active profile
- WHEN the diagnostic tries to persist a result
- THEN no `DiagnosticResult` is written to storage

### Requirement: Home Cockpit Identity UI

When no active profile exists, the Home page MUST render an identification card in the top zone where `Tu profesor digital` would appear. The card MUST show exactly:

- heading: `¿Quién está estudiando ahora?`
- body: `Ingresá tu nombre o apodo para guardar tu progreso en este dispositivo. No necesitás contraseña.`
- input label: `Nombre o apodo`
- primary action: `Empezar a estudiar`
- informational line: `Este perfil es local. Más adelante podrá sincronizarse con la cuenta del curso.`

The Home MUST NOT render `Tu profesor digital` until a profile is active.

#### Scenario: no active profile shows the identification card

- GIVEN no active profile
- WHEN the Home page renders
- THEN it shows the identification card and does NOT render `Tu profesor digital`

#### Scenario: identification card has all required copy

- GIVEN the identification card is visible
- WHEN its text is inspected
- THEN it contains the exact heading, body, label, primary action, and informational line above

#### Scenario: submitting the gate creates the profile and lifts the gate

- GIVEN the identification card is visible
- WHEN the user enters a valid name and clicks `Empezar a estudiar`
- THEN a new profile is created, `activeStudentId` is set, and the Home re-renders with the active state

### Requirement: Active Student Home Chrome

When an active profile exists, the Home page MUST:

- In the `Tu profesor digital` zone: show `Estás estudiando como {displayName}`.
- In the top bar: show a chip `Alumno activo: {displayName}`.
- Expose a secondary action `Cambiar alumno` (visible to the user; not in the top bar).

The chrome MUST use pedagogical language (`alumno`, `progreso`, `estudio`, `perfil local`) and MUST NOT use `login`, `cuenta`, `admin`, `usuario`, `email`, `contraseña`, `avatar`, or mention Supabase.

#### Scenario: active profile labels render

- GIVEN an active profile with `displayName: "Ana"`
- WHEN the Home page renders
- THEN it shows `Estás estudiando como Ana` in the dashboard zone AND `Alumno activo: Ana` in the top bar

#### Scenario: no teacher or auth language in chrome

- GIVEN the active-state Home
- WHEN the rendered text is scanned
- THEN it does NOT contain `login`, `cuenta`, `admin`, `usuario`, `email`, `contraseña`, `avatar`, or `Supabase`

### Requirement: Switch Student Without Deletion

`Cambiar alumno` MUST open a flow that lists the existing local profiles and lets the user activate one of them OR create a new one. The flow MUST NOT provide profile deletion, password/email, avatar, or per-student theme.

#### Scenario: switcher lists existing profiles

- GIVEN two local profiles
- WHEN the user opens `Cambiar alumno`
- THEN both are listed and one can be activated

#### Scenario: switcher allows creating a new profile

- GIVEN the switcher is open
- WHEN the user enters a new name and confirms
- THEN a new profile is created and activated; the previous profile and its progress are NOT deleted

#### Scenario: switcher does not offer deletion

- GIVEN the switcher is open
- WHEN scanned
- THEN no `Eliminar`, `Borrar`, or other destructive action is offered for any profile

### Requirement: Active Profile Gates Practice, Home, and Diagnostic

The Practice, Home (when reading progress), and Diagnostic pages MUST read the active `studentId` and pass it to the relevant adapter on every read or write. If no active profile exists, the page MUST show the gate (Home) or the same identification card pattern before letting the user act (Practice and Diagnostic) — not silently fall back to global state.

#### Scenario: Practice loads per-student progress

- GIVEN an active profile
- WHEN the Practice page initializes
- THEN the loaded `PracticeProgress` is the active student's slice

#### Scenario: Diagnostic writes the result to the active student

- GIVEN an active profile
- WHEN the user finishes the diagnostic
- THEN the `DiagnosticResult` is written under the active `studentId`

### Requirement: No Visible Teacher Access

This slice MUST NOT introduce a `Docente` navigation item, teacher login, master password, protected `/docente` route, multi-student teacher panel, or any account/admin language. `Tu profesor digital` is the student-facing "digital teacher" dashboard, NOT a human-teacher entry. The future route `/docente` MAY exist behind a separate, future-locked change; it MUST NOT be linked from any public UI in this slice.

#### Scenario: no Docente nav in public UI

- GIVEN the rendered app
- WHEN the navigation is scanned
- THEN no `Docente`, `Teacher`, or admin-style link is present

#### Scenario: no account/admin/login copy anywhere

- GIVEN the rendered app
- WHEN copy is scanned
- THEN no `login`, `cuenta`, `admin`, `master password`, or `contraseña maestra` appears

### Requirement: Supabase-Ready Adapter Boundary

The profile and progress adapters MUST be the ONLY modules that touch `localStorage` for identity-bearing data. Call sites (Practice flow, Diagnostic, Home, hooks) MUST NOT import `localStorage` directly for this data. The adapter interface is the future swap point: a `SupabaseProfileAdapter` and `SupabaseProgressAdapter` will implement the same function signatures, so call sites and the domain do not change when persistence moves server-side.

#### Scenario: call sites do not read localStorage directly for identity

- GIVEN the `src/hooks`, `src/app`, and `src/components` tree
- WHEN scanned for `localStorage`
- THEN identity-related reads/writes go through the adapter modules

## Non-Goals

- Supabase, Auth, RLS, API, real-time sync, cross-device sync.
- Email/password, avatar, per-student theme, social profile features.
- Teacher multi-student panel, `/docente` route, protected routes, master password.
- Profile deletion, editing of `studentId`, merging profiles, renaming `Alumno local`.
- Unit 3 content, new exercise types, new answer evaluators.

## Acceptance Criteria

- [ ] Pure `StudentProfile` domain module exists with validate/normalize/create/select/update functions, under `src/domain/student-profile/`, with no React/Next/Supabase imports.
- [ ] `localStorage` adapter for profiles (`pre-utn.profiles.v1`) exists with the documented functions and error swallowing.
- [ ] Practice/diagnostic/study-plan adapters use the central map shape; their public signatures are unchanged.
- [ ] Legacy global progress migrates to `Alumno local` exactly once, preserving every attempt and diagnostic result.
- [ ] No new `PracticeAttempt`, `DiagnosticResult`, or `StudyPlan` is recorded when no active profile exists.
- [ ] Home shows the identification card until a profile is active; after activation, it shows `Estás estudiando como {name}` and `Alumno activo: {name}`.
- [ ] `Cambiar alumno` lets the user pick or create a profile; no deletion is offered.
- [ ] No `Docente`, login, account, email, password, avatar, or Supabase copy appears in the UI.
- [ ] `pnpm run test && pnpm run typecheck && pnpm run build` pass.
- [ ] Existing tests that read the old global shape keep passing via the migration.

## Required Test Cases (Domain, Pure)

| # | Case | Key Assertion |
|---|------|---------------|
| 1 | `validateDisplayName` rejects empty / too-long / invalid-chars | Each branch returns the right `ProfileValidationError` |
| 2 | `normalizeDisplayName` trims and collapses whitespace | Output matches the canonical string |
| 3 | `createStudentId` is opaque and unique across 10k samples | No PII, no collisions above 1 in 10k |
| 4 | `createProfile` returns a valid profile from a fixed clock | `createdAt === lastActiveAt` |
| 5 | `createProfile` throws on invalid input | Throws `ProfileValidationError` |
| 6 | `selectActiveProfile` returns null for dangling id | No auto-create |
| 7 | `updateLastActiveAt` returns a new object, not a mutation | Field-by-field equality on unchanged fields |
| 8 | Adapter returns empty state on missing key and on corrupt JSON | Both branches covered |
| 9 | `setActiveStudentId` returns a blocked result on unknown id | Returns `{ ok: false, reason: "profile-not-found" }`; persisted state is unchanged |
| 10 | `recoverActiveProfile` returns null for dangling id | No auto-create |
| 11 | Legacy global progress migrates to `Alumno local` preserving every attempt | Count + fields match |
| 12 | Migration is idempotent across re-runs | No duplicate profile, no duplicated attempts |
| 13 | No `Alumno local` is created when no legacy data exists | State remains empty |
| 14 | `addAttempt` without active profile writes nothing and signals blocked | Storage unchanged, signal emitted |
