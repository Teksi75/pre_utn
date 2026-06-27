# Design: `auth-sign-in-v0` — activate remote persistence with magic-link auth

## Technical Approach

Replace the dormant `createClient` browser factory with `@supabase/ssr`, add a Next.js middleware token refresh, and expose a small React session context. A magic-link flow produces a real Supabase session; `onAuthStateChange` events drive `reinitializePersistence()`, which flips the persistence selector between local and remote. The first `SIGNED_IN` also upserts the active local profile into `student_profiles` so subsequent `saveProgress()` calls satisfy the `student_progress_snapshots` FK.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|----------------------|-----------|
| Auth SDK | `@supabase/ssr` | Raw `@supabase/supabase-js` | Official Next.js integration; automatic cookie session storage; token refresh via middleware; avoids reinventing cookie plumbing. |
| Auth method | Magic link (`signInWithOtp`) | Email/password, OAuth | Matches existing *"cuenta del curso"* copy; no password UI; smallest brand-voice surface. |
| Session state | `SessionProvider` React context | Prop drilling, global store | Keeps auth state in one place; Nav and AuthBootstrap consume via `useSession`. |
| Persistence reaction | `AuthBootstrap` listens to context session | Direct `onAuthStateChange` in initializer | Decouples session management from adapter reconfiguration; easier to test. |
| Profile linking | `linkActiveProfileToAuthUser()` direct remote upsert, then `reinitializePersistence()` | Call `saveProfiles()` through configured adapter | Spec requires link before re-init; adapter may still be local/null at that moment, so direct remote call guarantees the FK row. |
| Sign-out UX | Minimal link in Nav + `/cuenta` stub | Full account panel | Out of scope for v0; enough to prove session teardown. |
| Cookie handling | Browser client uses default `document.cookie` | Custom cookie jar helper | `@supabase/ssr` handles browser cookies automatically when no `cookies` option is passed. |

## Data Flow

```
/cuenta/ingresar ──signInWithOtp──► Supabase Auth
                                      │
                                      ▼
                         user clicks magic link
                                      │
                                      ▼
                    /auth/callback?code=xxx
                           │
                           ▼
               createServerClient exchanges code
               sets session cookie → redirect /cuenta
                           │
                           ▼
              SessionProvider: getSession() / SIGNED_IN
                           │
                           ▼
              AuthBootstrap: linkActiveProfileToAuthUser()
                           │
                           ▼
                   reinitializePersistence()
                           │
                           ▼
               selector now returns remote adapter
                           │
                           ▼
                 saveProgress() → Supabase
```

On sign-out, `signOut()` clears the cookie session, `SIGNED_OUT` fires, `AuthBootstrap` calls `reinitializePersistence()`, and the selector falls back to local.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/supabase/browser.ts` | Modify | Swap `createClient` for `@supabase/ssr` `createBrowserClient`; keep singleton and null-on-missing-env behavior. |
| `src/lib/supabase/auth.ts` | Create | Thin wrappers: `signInWithMagicLink`, `getCurrentSession`, `signOut`, `onAuthStateChange`. |
| `src/middleware.ts` | Create | Per-request `createServerClient` that calls `auth.getUser()` to refresh tokens and write cookies. |
| `src/components/auth/SessionProvider.tsx` | Create | React context exposing `session`, `userEmail`, `isLoading`, `isAuthEnabled`, `signOut`. |
| `src/components/auth/AuthBootstrap.tsx` | Create | Watches `useSession()` and calls `linkActiveProfileToAuthUser()` + `reinitializePersistence()` on sign-in, `reinitializePersistence()` on sign-out. |
| `src/app/layout.tsx` | Modify | Wrap children with `SessionProvider`; mount `AuthBootstrap` alongside `PersistenceInitializer`. |
| `src/app/cuenta/ingresar/page.tsx` | Create | Magic-link form with email validation, loading, error, and success states. |
| `src/app/auth/callback/route.ts` | Create | Route handler that exchanges `?code` for a session and redirects to `/cuenta`. |
| `src/app/cuenta/page.tsx` | Create | Account stub showing sync status and a sign-out button. |
| `src/lib/persistence/adapter-config.ts` | Modify | Add `reinitializePersistence()`: reset `configuredAdapter`, re-run selection, preserve fallback sink. |
| `src/lib/auth/link-profile.ts` | Create | `linkActiveProfileToAuthUser()`: get active profile, build remote adapter, upsert via `saveProfiles()`. |
| `src/components/StudentGate.tsx` | Modify | Add secondary CTA `"Sincronizar con la cuenta del curso"` linking to `/cuenta/ingresar`. |
| `src/components/Nav.tsx` | Modify | Add sync status badge (`Sin sincronizar` / `Sincronizado como {email}`) and sign-out link when auth is enabled. |
| `src/components/__tests__/Nav-student.test.ts` | Modify | Allow approved auth copy (`Sincronizado`, `Cerrar la cuenta del curso`, `/cuenta` links) while keeping forbidden generic tokens blocked. |
| `package.json` | Modify | Add `@supabase/ssr` dependency. |
| `.env.example` | Modify | Document `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and callback URL convention. |

## Interfaces / Contracts

```ts
// src/components/auth/SessionProvider.tsx
interface SessionContextValue {
  session: Session | null;
  userEmail: string | null;
  isLoading: boolean;
  isAuthEnabled: boolean;
  signOut: () => Promise<void>;
}

// src/lib/supabase/auth.ts
async function signInWithMagicLink(email: string): Promise<{ error: AuthError | null }>;
async function getCurrentSession(): Promise<{ session: Session | null; error: AuthError | null }>;
async function signOut(): Promise<{ error: AuthError | null }>;
function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { unsubscribe: () => void };

// src/lib/persistence/adapter-config.ts
export async function reinitializePersistence(options?: {
  onFallback?: SelectorConfig["onFallback"];
}): Promise<void>;

// src/lib/auth/link-profile.ts
export async function linkActiveProfileToAuthUser(): Promise<void>;
```

## Testing Strategy

| Layer | What to test | Approach |
|-------|-------------|----------|
| Unit | `signInWithMagicLink`, `getCurrentSession`, `signOut` | Mock `@supabase/ssr` client returned by `createBrowserClient`. |
| Unit | `SessionProvider` state transitions | Render with mocked client; simulate `SIGNED_IN`/`SIGNED_OUT` events; assert context values. |
| Unit | `reinitializePersistence` | Reset adapter, call with mocked client/session, assert `getConfiguredAdapter()` returns fallback-wrapped remote adapter. |
| Unit | `linkActiveProfileToAuthUser` | Mock active profile and remote client; assert `student_profiles` upsert path called; assert no-op when no active profile. |
| Integration | Auth → persistence interaction | Sign-in event triggers re-init; selector `hasRemoteSession` becomes `true`; sign-out falls back to local. |
| Integration | `/auth/callback` route | Pass valid/missing `code`; assert redirect and session exchange. |
| Brand voice | Sign-in page, Nav, StudentGate | Source-scan tests mirroring `StudentGate.test.ts:159-177`; allow `email` as label and approved copy; forbid `login`, `contraseña`, `profe digital`, `Supabase`. |
| E2E (Playwright, future) | Full magic-link round trip | Real Supabase project in preview; verify row created and progress persists. |

Unit tests mock `@supabase/ssr`; no real network calls in CI.

## RLS and Security

No new SQL needed. The existing migration (`20260622_supabase_adapter_v0.sql`) already has:

- `student_profiles` RLS: select/insert/update own rows where `user_id = auth.uid()`.
- `student_progress_snapshots` RLS: same, plus FK to `(user_id, student_id)`.
- No delete policies (data retention).

The browser client only uses the publishable key. `linkActiveProfileToAuthUser()` reads the active local profile and upserts with the authenticated user's ID from the Supabase session; RLS prevents cross-user writes. Server-side, middleware uses `createServerClient` with `getUser()` for token refresh only; it does not gate routes.

## Package Decisions

- **`@supabase/ssr`** — chosen because it is the official Supabase SSR helper, gives automatic cookie-based session storage on the client, and provides `createServerClient` for Next.js middleware token refresh. It keeps auth tokens out of `localStorage` and avoids custom cookie parsing.
- **`@supabase/supabase-js`** — already installed; `@supabase/ssr` depends on it and returns the same `SupabaseClient` type, so the existing `supabase-adapter.ts` needs no changes.

## Migration / Rollout

No data migration required. Existing local profiles remain authoritative.

Pre-merge checklist:
1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on Vercel production.
2. Configure Supabase Auth redirect URL: `https://<host>/auth/callback`.
3. Deploy; verify a signed-in user's progress appears in Supabase tables.

Rollback: remove Vercel env vars to force local-only mode, or revert the branch.

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| SSR hydration mismatch from session-dependent UI | `SessionProvider` initializes session on client only; Nav badge renders a stable placeholder server-side and resolves after hydration. |
| Duplicate `onAuthStateChange` listeners in Strict Mode | Subscription is created in `useEffect` with cleanup; `SessionProvider` uses a single client singleton. |
| FK race on first remote `saveProgress` | `linkActiveProfileToAuthUser()` runs before `reinitializePersistence()` on `SIGNED_IN`, guaranteeing the `(user_id, student_id)` row exists. |
| Brand-voice test trips on new auth copy | Update `Nav-student.test.ts` to allowlist approved strings; add source-scan tests for new auth components. |
| Missing env vars break build/runtime | `createBrowserClient` returns `null` when vars are missing; `SessionProvider` exposes `isAuthEnabled = false` and Nav hides the badge. |
| Token refresh not happening | Middleware calls `auth.getUser()` on every matched request, which refreshes expired access tokens and writes cookies. |

## Open Questions

None. Design is ready for task breakdown.

## Design Delta v2 (Revised Requirements)

This delta covers the revised `student-account-sync` spec (REQ-NEW-1/2/3, REQ-NEW-ARCH-1, REQ-NEW-SEC). It builds on the existing v0 design and only documents what changes.

### 1. `importLocalProgressToRemote()`

- **Location**: `src/lib/auth/import-local-progress.ts`
- **Signature**:
  ```ts
  export async function importLocalProgressToRemote(
    remoteAdapter: PersistenceAdapter,
    studentId: string,
  ): Promise<{
    ok: boolean;
    importedFields: ("progress" | "diagnostic" | "studyPlan")[];
    error?: Error;
  }>
  ```
- **Behavior**: Reads local raw state via `loadProgressRaw()`, `loadDiagnosticResultRaw()`, and `loadStudyPlanRaw()` for the active student. Calls `remoteAdapter.saveProgress`, `saveDiagnosticResult`, and `saveStudyPlan` sequentially to avoid row contention. Each step is wrapped in its own `try/catch`; the function never throws. On partial success `importedFields` lists what made it to Supabase and `error` carries the first failure.
- **Called from**: the `SIGNED_IN` orchestrator, only in the *local has + remote empty* branch.

### 2. `probeRemoteState()`

- **Location**: `src/lib/auth/probe-remote.ts`
- **Signature**:
  ```ts
  export async function probeRemoteState(
    remoteAdapter: PersistenceAdapter,
    studentId: string,
  ): Promise<{
    hasRemoteProgress: boolean;
    hasDiagnostic: boolean;
    hasStudyPlan: boolean;
  }>
  ```
- **Behavior**: Uses `remoteAdapter.loadProgress/loadDiagnosticResult/loadStudyPlan`. `hasRemoteProgress` is true only when the returned progress is non-empty (not the `EMPTY_PROGRESS` sentinel), because `supabase-adapter.ts` returns `EMPTY_PROGRESS` for missing rows. Any error returns all `false`, defaulting the orchestrator to the safe "remote empty" path where local data is preserved.

### 3. SIGNED_IN orchestrator

- **Location**: new `src/lib/auth/link-and-import.ts`
- **Signature**: `export async function linkAndImportLocalProgress(session: Session): Promise<void>`
- **Wiring**: `src/components/auth/AuthBootstrap.tsx` SIGNED_IN handler becomes:
  ```ts
  if (event === "SIGNED_IN") {
    await linkAndImportLocalProgress(session);
    await reinitializePersistence();
  }
  ```
- **Steps**:
  1. Build browser client; abort if no session/client.
  2. Resolve `activeId = getActiveProfileId()`.
  3. If no active profile, create a minimal local profile (see §4), upsert the remote `student_profiles` row first, then save the local backup. Set `activeId`.
  4. Build `remoteAdapter = createSupabaseAdapter(client)`.
  5. Probe remote state and compute `hasLocalProgress(activeId)` (`src/lib/auth/has-local-progress.ts`).
  6. Apply the 4-branch decision below.

#### 4-branch decision

| Local progress | Remote progress | Action |
|---|---|---|
| empty | empty | `linkActiveProfileToAuthUser()` only |
| has | empty | `linkActiveProfileToAuthUser()` then `importLocalProgressToRemote()` |
| has | has | `linkActiveProfileToAuthUser()` only; log conflict; do not overwrite |
| empty | has | `linkActiveProfileToAuthUser()` only; remote is canonical |

`linkActiveProfileToAuthUser()` in `src/lib/auth/link-profile.ts` stays unchanged: it guarantees the `(user_id, student_id)` FK row exists.

#### Flow diagram

```
SIGNED_IN event
│
├─► no active local profile?
│   ├─► read pending displayName from sessionStorage (keyed by email)
│   ├─► create minimal local profile { studentId, displayName }
│   ├─► upsert remote student_profiles row
│   └─► save local backup
│
├─► probeRemoteState(remoteAdapter, activeId)
├─► hasLocalProgress(activeId)
│
├─► branch
│   local empty + remote empty → link FK only
│   local has   + remote empty → link FK + importLocalProgressToRemote
│   local has   + remote has   → link FK only (conflict logged, no overwrite)
│   local empty + remote has   → link FK only
│
└─► reinitializePersistence()
```

### 4. `student_id` optimistic generation — decision

- **Chosen option: B** — generate `student_id` inside the `SIGNED_IN` handler, after the user confirms the magic link.
- **Rationale**: Option A writes local state before email confirmation, leaving orphan profiles if the link is ignored. Option B creates identity only when a verified session exists, keeping local and remote rows aligned.
- **DisplayName carry**: `/cuenta/ingresar` writes the typed name to `sessionStorage.setItem("pre-utn.pendingName:" + email, displayName)` on form submit. `linkAndImportLocalProgress()` reads it back with `session.user.email`, falls back to a neutral default if absent, and clears the key. Context7 docs for `@supabase/ssr` confirm `emailRedirectTo` and `shouldCreateUser` but do not guarantee stable user_metadata round-tripping for magic links, so we avoid relying on `signInWithOtp(...options.data)`.

### 5. `/cuenta/ingresar` page variants

- **File**: `src/app/cuenta/ingresar/page.tsx`
- On mount, a `useEffect` resolves:
  - `activeId = getActiveProfileId()`
  - `isLinking = activeId !== null && hasLocalProgress(activeId)`
- Show a loading skeleton while resolving.
- **Linking variant** (`isLinking === true`): approved linking copy, email field only, and an optional name field only when the local profile has no display name.
- **New-student variant** (`isLinking === false`): approved new-account copy, email + displayName fields.
- On submit: validate email and (new-student only) `displayName` via `validateDisplayName`; store the name in `sessionStorage` keyed by email; call `signInWithMagicLink(email)`.

### 6. `StudentGate` as global router

- **File**: `src/components/StudentGate.tsx`
- Convert from name-collection card to a wrapper component: `StudentGate({ children })`.
- Uses `useSession()` and `getActiveProfileId()`.
- When auth is enabled and both `session === null` and `activeProfileId === null`, call `router.replace("/cuenta/ingresar")`.
- Skip the redirect on `/cuenta/ingresar` and `/auth/callback` to avoid loops.
- Render `children` when a local profile or a session exists; otherwise render a minimal loading state.
- Remove the name input, `validateDisplayName`, `onSubmitProfile`, and `externalError` props. Profile creation for the sign-in flow moves into `linkAndImportLocalProgress()`.
- **Dependent call sites**: update `src/app/layout.tsx` to wrap the app shell with `<StudentGate>`; remove the now-redundant conditional `StudentGate` usage in `src/components/home/HomeNextStepClient.tsx`, `src/app/practice/page.tsx`, and `src/app/diagnostic/page.tsx`.
- **Tests**: replace `StudentGate.test.ts` / `StudentGate-auth.test.ts` with router-behavior tests.

### 7. `ANON_KEY` removal

- **File**: `src/app/auth/callback/route.ts` lines 51–56
- Remove `?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`; use only `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Add a JSDoc deprecation note: the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` fallback is removed; deployments must set the publishable key.

### 8. Testing strategy delta

| Layer | What to test | Approach |
|---|---|---|
| Unit | `importLocalProgressToRemote` | Mock remote adapter; assert all field combinations, partial failures, and that local data is untouched |
| Unit | `probeRemoteState` | Mock remote adapter returning `EMPTY_PROGRESS`, non-empty progress, values, and errors |
| Unit | `linkAndImportLocalProgress` | Mock session, sessionStorage, local state, and remote state; assert each of the 4 branches |
| Integration | `AuthBootstrap` SIGNED_IN | Emit `SIGNED_IN`; verify orchestrator runs before `reinitializePersistence` |
| UI | `/cuenta/ingresar` | Seed/unseed localStorage; assert variant copy and that `displayName` is stored by email |
| UX | Brand voice | Extend `FORBIDDEN_TOKENS` with "Regla de seguridad", "Supabase", "localStorage", "RLS", "merge strategy", "overwrite", "remote/local" as tech terms; source-scan for approved linking copy |
| Security | Key scan | Assert no `ANON_KEY` string in `src/` except a JSDoc deprecation comment |

### 9. Rollout checklist delta

1. Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Supabase Auth → Email provider enabled.
3. Supabase Auth → Site URL and redirect URL `https://<host>/auth/callback` configured.

### Open Questions (delta)

None blocking.
