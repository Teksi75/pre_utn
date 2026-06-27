# Exploration: `auth-sign-in-v0` — minimal auth flow to activate the remote persistence adapter

**Change**: `auth-sign-in-v0`
**Trigger**: prior change `supabase-adapter-v0-fallback` (I-24) shipped a remote Supabase persistence adapter with localStorage fallback. The remote adapter is **dormant** because the selector requires a Supabase Auth session (`client.auth.getSession() !== null`), which never happens without a sign-in entry point. This change adds the minimal auth flow that produces a session and wires it into the existing selector boundary.
**Status**: exploration (read-only)
**Date**: 2026-06-26
**Author**: sdd-explore agent

---

## 1. Current state

### What exists

- **Supabase client factory**: `src/lib/supabase/browser.ts` — singleton `createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })`. All three auth toggles are **explicitly disabled** with the comment "v0 has no auth UI".
- **Persistence selector**: `src/lib/persistence/selector.ts:265-296` — `selectPersistenceAdapter()` returns local by default, and only returns the fallback-wrapped remote adapter when **all** of:
  1. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set (`selector.ts:271-275`).
  2. `getActiveProfileId() !== null` (selector.ts:278-281) — auth gate.
  3. `config.hasRemoteSession === true` (selector.ts:284-287) — explicit backend-session signal.
  4. `remoteAdapter` is provided (selector.ts:290-293).
- **Persistence initializer**: `src/components/PersistenceInitializer.tsx` mounted from `src/app/layout.tsx:27`. Calls `initializePersistence()` once on mount (`adapter-config.ts:182-226`). `initializePersistence()` calls `client.auth.getSession()` and configures the adapter only if a session exists.
- **Supabase adapter**: `src/lib/persistence/supabase-adapter.ts` — already implements all read/write methods scoped to `auth.uid() === user_id` AND `getActiveProfileId() === student_id`. **No adapter changes are needed**; it's dormant, not broken.
- **Active profile boundary**: `src/lib/active-session.ts` reads from local `pre-utn.profiles.v1` via `getActiveStudentId()`. Local profile is opaque `local-{uuid}` (`domain/student-profile/index.ts:85-87`), no PII, no link to a Supabase auth user.
- **Supabase migration**: `supabase/migrations/20260622_supabase_adapter_v0.sql` — `student_profiles (user_id uuid references auth.users(id), student_id text, ...)` with `(user_id, student_id)` unique. `student_progress_snapshots` has FK to `(user_id, student_id)`. RLS scoped to `(select auth.uid()) = user_id`.
- **Tests**: 7 test files reference `client.auth.getSession()` as a mock target (`src/lib/__tests__/persistence-selector.test.ts`, `initialization-race.test.ts`, `initializer-rejection-sink.test.ts`, `active-student-isolation.test.ts`, `supabase-adapter-serialization.test.ts`, `remote-fk-profile-creation.test.ts`). Existing pattern: mock returns `{data: {session: {user: {id: 'test-auth-user-id'}}}}`.
- **Env vars**: `.env.example` (public vars only) + `.env.local` (dev only, with a real project URL). Both already configured for the supabase-adapter-v0-fallback change.
- **Routes**: `/`, `/learn`, `/practice`, `/diagnostic`, `/api/persistence/fallback`. **No `/auth/*` or `/signin` routes exist.**

### What doesn't exist

- **Zero auth UI in `src/`** — grep for `signIn|signUp|signOut|useSession|AuthProvider|SupabaseProvider|onAuthStateChange` returns 18 hits across `src/`, **none of which are Supabase Auth calls**. All matches are unrelated (React `useCallback`, `onDone` callbacks, React hook patterns).
- **No `/signin`, `/auth`, `/cuenta`, or `/login` route.**
- **No `middleware.ts` / `middleware.tsx`** in `src/` (verified).
- **`@supabase/ssr` is NOT installed** — only `@supabase/supabase-js@2.108.2`. Confirmed via `package.json` and `pnpm-lock.yaml`.
- **No sign-out flow, no auth provider/context, no auth state listener** wired anywhere in the tree.
- **No mapping between local `studentId` (opaque `local-{uuid}`) and a Supabase auth user** (`auth.users.id` UUID). The Supabase adapter scopes by both: `user_id = auth.uid()` and `student_id = getActiveProfileId()`. If a user signs in but their local profile was never written to Supabase, `loadProfiles()` returns empty and `saveProfiles()` writes a fresh row keyed to `(auth.uid(), activeStudentId)`. There is no migration that links an existing local profile to a Supabase user.

### Why the remote adapter is dormant

`initializePersistence()` (`adapter-config.ts:194-200`):

```ts
const { data, error } = await client.auth.getSession();
if (error || !data.session) {
  configuredAdapter = null;
  return;
}
```

With `persistSession: false` (`browser.ts:54`), `getSession()` only returns the in-memory session set by a same-page `signInWith*` call. Since there is no sign-in entry point anywhere, `data.session` is **always null**, so `configuredAdapter` stays null, the selector stays on local, and the remote adapter never runs.

The selector also requires `hasRemoteSession: true` (selector.ts:284-287). Even if a session existed, the initializer hard-codes `hasRemoteSession: true` only after `getSession()` returns a session. The wiring is consistent — it's the missing session entry that breaks the chain.

---

## 2. Affected areas (file paths + reason)

| Path | Why it's affected |
|---|---|
| `src/lib/supabase/browser.ts` | All three auth toggles (`persistSession`, `autoRefreshToken`, `detectSessionInUrl`) are explicitly disabled. Must be flipped for auth-sign-in-v0 to work across reloads. |
| `src/components/PersistenceInitializer.tsx` | Runs once on mount. If the user signs in mid-session, the adapter won't re-initialize. Needs either an `onAuthStateChange` listener that re-runs `initializePersistence()`, or an exposed `reinitializePersistence()` function called from the sign-in handler. |
| `src/lib/persistence/adapter-config.ts` | `initializePersistence()` only resolves the session once. Need a path to re-init when `SIGNED_IN` / `SIGNED_OUT` events fire. |
| `src/app/layout.tsx` | Mounts `PersistenceInitializer`. Needs an auth-state bootstrap component alongside it (or the initializer becomes the bootstrap). |
| `src/app/page.tsx` and `src/app/diagnostic/page.tsx` and `src/app/practice/page.tsx` | May need to mount a sign-in CTA when the user has a local profile but no remote session, OR when `NEXT_PUBLIC_SUPABASE_URL` is configured but `getSession()` is null. |
| `src/components/StudentGate.tsx` | Already says "Este perfil es local. Más adelante podrá sincronizarse con la cuenta del curso." The promise is now real — needs a "Sincronizar con la cuenta del curso" action that navigates to `/signin`. Spec `student-local-identity` already establishes "la cuenta del curso" as the legitimate terminology. |
| `src/components/Nav.tsx` | Has the "Alumno activo: {name}" chip when an active profile exists. Needs a sign-in affordance (next to the chip, or as a secondary nav item) when env vars are configured but no Supabase session exists. |
| `src/lib/student-profile-storage.ts` | `createProfileAndActivate()` writes to the configured adapter (already remote-aware). When the user signs in with an existing local profile, no row in `student_profiles` exists for `(auth.uid(), activeStudentId)`. The remote `saveProfiles()` will write one on the next profile mutation, but the **first remote write** must happen after sign-in to avoid the FK gap on `student_progress_snapshots`. |
| `supabase/migrations/` (new) | May need a new migration for `student_profiles.user_id` to be non-null relaxed, OR a new table for auth-link, OR a server-side function (out of scope, since admin/service-role is forbidden in client). Cleanest path: a thin **client-side linking flow** that calls `saveProfiles()` to upsert the active local profile under `auth.uid()`. |
| `package.json` | Add `@supabase/ssr` if the recommendation is adopted. |
| `next.config.ts` (or `src/middleware.ts`) | If `@supabase/ssr` is adopted, a `middleware.ts` is required to refresh tokens on every server request. Without `@supabase/ssr`, no middleware is needed. |
| `.env.example` and `.env.local` | No new vars for `signInWithOtp` (uses existing public vars). If OAuth is added later, additional env vars are needed. |
| Tests | Need new test files for: sign-in flow (`src/lib/supabase/__tests__/sign-in.test.ts`), re-init on `SIGNED_IN` event (`src/components/__tests__/auth-bootstrap.test.ts`), profile-linking flow (`src/lib/__tests__/sign-in-link-profile.test.ts`), updated `migration-rls-shape.test.ts` to confirm linking semantics, and an updated `no-service-role-scan.test.ts` to confirm no service-role leakage in the new auth paths. |

---

## 3. Existing auth-relevant patterns in the codebase

### Mock pattern for `client.auth.getSession()`

From `src/lib/__tests__\supabase-adapter-serialization.test.ts:206-215`:

```ts
const auth = {
  getSession: vi.fn(async () => ({
    data: {
      session: {
        user: { id: "test-auth-user-id" },
      },
    },
    error: null,
  })),
};
```

The pattern mocks `getSession()` to return a synchronous `{user: {id}}` shape. New auth tests will need to extend this to also mock `signInWithOtp`, `signInWithPassword`, `signOut`, `onAuthStateChange`, and `getUser`.

### Existing fallback-sink observability pattern

`src/lib/persistence/fallback-sink.ts` already produces a `persistence:fallback` CustomEvent and POSTs to `/api/persistence/fallback` for observability. This same observability pattern can be extended to auth events (`auth:signed-in`, `auth:signed-out`) without introducing new dependencies.

### Existing test source-scan pattern

`src/components/__tests__/production-fallback-sink.test.ts:39-47` is the model for source-inspection tests that enforce "no service-role key in client code". A new `no-service-role-scan.test.ts` extension (or new `no-auth-leak.test.ts`) can enforce "no service-role / admin / anon-but-powerful key in any auth-sign-in path".

### Existing "no forbidden language" test pattern

`src/components/__tests__/StudentGate.test.ts:126-194` is the model for a brand-voice test that scans JSX text content. `src/components/__tests__/Nav-student.test.ts` scans for `["Docente", "docente", "login", "admin", "email", "contraseña", "avatar", "Supabase"]` in the Nav. The same scan shape will be used for the new sign-in components.

### Existing migration test pattern

`src/lib/__tests__/migration-rls-shape.test.ts` (referenced in STATUS.json `fix-profile-isolation-on-switch.followUps` — currently failing on main per the same STATUS.json entry) is the model for asserting migration text shape. A new migration test will follow this pattern.

---

## 4. Approaches (with tradeoffs)

### Approach A: Magic link (`signInWithOtp`) with `@supabase/ssr` cookie-based session

**Description**: Add `@supabase/ssr`. Replace `createBrowserClient()` from `@supabase/supabase-js` with `createBrowserClient()` from `@supabase/ssr` (different function, same name — confusing but official). Persist session in cookies via Next.js's cookie API. Use `signInWithOtp({ email, options: { emailRedirectTo } })` from a new `/signin` page. Listen to `onAuthStateChange` to re-run `initializePersistence()`. Add `src/middleware.ts` to refresh tokens on every server request. On `SIGNED_IN`, upsert the active local profile to Supabase via `saveProfiles()` so the `(auth.uid(), student_id)` row exists before any `saveProgress()`.

**Pros**:
- Single email input → minimal UI surface, lowest copy burden (no password to label, no "crear cuenta" copy, no strength meter).
- `@supabase/ssr` is the **official** Next.js App Router integration; it handles cookie-based session persistence, automatic token refresh via `middleware.ts`, and works correctly with both client and server components.
- `onAuthStateChange` listener gives us reactive adapter re-initialization for free.
- Magic link requires the user to confirm email ownership — strongest low-friction auth without storing passwords.
- No password UX to design or test → lower PR review surface.
- Aligns with the brand-voice constraint: the UI can say "Ingresá tu email para sincronizar tu perfil con el curso" — no `login`, no `cuenta` (except "la cuenta del curso" which is already approved), no `contraseña`.

**Cons**:
- Requires email infrastructure. Supabase Auth sends the magic-link email via its built-in SMTP by default (rate-limited, generic template). Customization requires Supabase dashboard config (out-of-band). v0 should accept the default template.
- Magic link email contains a Supabase-branded URL by default; the user sees `supabase.co` in the link they click. Acceptable for v0, suboptimal long-term.
- Adds a dependency (`@supabase/ssr`).
- Requires a `middleware.ts` (new file) — small but it's a server-side file Next.js runs on every request, must be kept lean.
- The user must have email access during the class session to receive the magic link. If they sign in from a tablet without email configured, they can't sign in. The local profile alone still works.
- Server components that touch Supabase need a server-side client (`createServerClient` from `@supabase/ssr`). Currently, no server components touch Supabase — this is **forward-compatible**, not a current need.

**Effort**: **Medium** — new dep + middleware + sign-in page + callback route + re-init wiring + link-profile flow + ~10 new tests + brand-voice scan.

### Approach B: Email + password (`signInWithPassword`) with raw `@supabase/supabase-js`

**Description**: Keep `@supabase/supabase-js`. In `src/lib/supabase/browser.ts`, flip `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`. Add a `/signin` page with two inputs (email + password). Add a `signUpWithPassword()` flow for new accounts. Add an `onAuthStateChange` listener to re-run `initializePersistence()`. Skip `@supabase/ssr` and `middleware.ts`. Accept that server components won't see the session (acceptable because all Supabase access stays in client components — consistent with current architecture).

**Pros**:
- No new dependencies.
- Smaller diff: just flip three flags in `browser.ts` and add the sign-in page.
- Deterministic: the user doesn't need email access to re-sign-in.
- Recovers without email (a "forgot password" flow is standard Supabase Auth and works offline-on-recovery).

**Cons**:
- Two inputs → more UX to ship (form validation, error states, password-strength copy).
- Brand voice: "contraseña" appears in the copy. The StudentGate ALREADY says "No necesitás contraseña." (a *negative* statement). Adding a sign-in form requires *positive* copy that mentions password — even "Ingresá tu contraseña" risks triggering the existing `Nav-student.test.ts` FORBIDDEN list which has `contraseña`. Need a careful re-test of `StudentGate.test.ts:126-194` patterns. The fix is to use "clave" instead of "contraseña" if the test gate allows, or to re-frame the sign-in copy to not mention a password field by name (e.g. "Ingresá tu email y la clave que elegiste"). The account-context patterns `/admin.*login|login.*admin/i` etc. don't apply here since we're not building admin/login UX.
- Two flows to ship (sign-in + sign-up) → bigger PR surface, more tests, more review.
- Email confirmation (Supabase requires it by default for `signUp`) — adds a verification step that interrupts the flow.
- `persistSession: true` stores JWT in localStorage. The previously-documented #2341 decision chose `persistSession: false` specifically to avoid stale/phantom tokens. Reverting that decision needs a clear rationale captured in the commit message and a new `no-stale-token.test.ts` to prove the singleton pattern prevents duplicate timers (see R-5 below).

**Effort**: **Medium-High** — form validation + sign-up flow + email confirmation handling + same re-init wiring as A + more tests.

### Approach C: OAuth (Google or GitHub) with `@supabase/ssr`

**Description**: Same `@supabase/ssr` setup as A, but use `signInWithOAuth({ provider: 'google' })` instead of magic link. Configure the OAuth provider in Supabase dashboard (out-of-band). Add `/auth/callback` route to handle the OAuth redirect.

**Pros**:
- Zero password UX.
- Lowest friction for users with Google accounts.

**Cons**:
- **Does not align with the brand**: the app is a preuniversitario for one Instituto (Bárbara Tomba). Tying sign-in to Google pushes a vendor (Google) into the relationship between the student and the Instituto. The user expects to sign in with the Instituto's brand, not a third party.
- OAuth in Supabase requires dashboard configuration (out-of-band) and an OAuth client ID/secret pair — adds setup steps that can't be verified by automated tests.
- Supabase Auth rate limits OAuth attempts per project; not a problem for v0 with one student testing it, but worth noting.
- Brand-voice test would need to scan for "Google", "GitHub", etc. — easier to keep clean than email + password, but introduces a forbidden-vendor-list check.
- **Not recommended for this app's positioning** unless the user explicitly chooses OAuth over email-based flows.

**Effort**: **High** — OAuth setup is out-of-band and partially outside the repo's automated verification.

### Approach D: "Anonymous sign-in" (`signInAnonymously`) — REJECT

Supabase Auth supports `signInAnonymously()` which creates a user without email. This would activate the remote adapter without any UI. But it conflicts with the existing copy "Más adelante podrá sincronizarse con la cuenta del curso" (the implication is that there's an identity behind the account). It also doesn't match the brand voice ("cuenta del curso" implies a named, recoverable identity). The prior decision in `student-local-identity` spec explicitly keeps profiles **local-only** until the user opts into sync. **This approach is rejected as not honoring the product decision.**

---

## 5. Recommendation

**Approach A: Magic link + `@supabase/ssr`** is the strongest fit for this app:

1. **Smallest brand-voice surface** — single email input, no `contraseña`/`clave` copy to ship, no `signUp`/`signIn` UX split, no OAuth vendor names.
2. **Honors the prior copy contract** — "Este perfil es local. Más adelante podrá sincronizarse con la cuenta del curso" becomes real. The sign-in affordance can read: "Sincronizá tu perfil con la cuenta del curso — ingresá tu email y te mandamos un enlace." This uses approved terminology ("la cuenta del curso") and respects Ingenium voice (no profe-digital claims, no personalization claims).
3. **Forward-compatible with the existing architecture** — `@supabase/ssr` is what the Supabase team itself recommends for Next.js App Router. Adding it now prevents a future rewrite when the user asks for SSR-rendered auth-gated routes.
4. **Lowest UI complexity** — magic link requires only one input and one button. The "sent — check your email" confirmation state is trivial. No password UX, no strength meter, no recovery flow in v0.
5. **The dependency cost is small** — `@supabase/ssr` is small (~5KB gzipped) and maintained by Supabase.
6. **Reversible** — if the user later wants email+password or OAuth, the change adds the flow, doesn't replace the magic-link one.

**For the proposal/sdd-design phase, the implementation should**:

1. Add `@supabase/ssr` to `package.json` and the lockfile.
2. Replace `src/lib/supabase/browser.ts` `createClient(...)` with `createBrowserClient(...)` from `@supabase/ssr`, configured with cookie handlers (the same ones used by `createServerClient`).
3. Add `src/middleware.ts` that runs `createServerClient(...)` on every request to refresh tokens. The middleware MUST be a no-op for non-auth paths (just refresh + forward).
4. Add `src/lib/supabase/auth.ts` with helpers: `signInWithMagicLink(email)`, `getCurrentSession()`, `signOut()`, and `onAuthStateChange(handler)`.
5. Add `src/components/auth/AuthBootstrap.tsx` (mounted in layout.tsx) that:
   - On mount, calls `getCurrentSession()` once (reads from cookies via the SSR-aware browser client).
   - Subscribes to `onAuthStateChange`. On `SIGNED_IN`, calls `linkActiveProfileToAuthUser()` (upserts the active local profile to Supabase via the configured adapter), then calls `reinitializePersistence()` to swap to the remote adapter.
   - On `SIGNED_OUT`, calls `reinitializePersistence()` to fall back to local.
6. Add `src/app/signin/page.tsx` (or `src/app/cuenta/ingresar/page.tsx`) with a single email input and a "Sincronizar" button. The page MUST respect the brand voice (see §6 below).
7. Add `src/app/auth/callback/route.ts` for OAuth compatibility (magic link also benefits from a callback if `emailRedirectTo` is set).
8. Add a "Sincronizar con la cuenta del curso" secondary action in `StudentGate.tsx` (or in a new section) that navigates to `/signin`. Update the existing `StudentGate.test.ts` source-assertion to confirm the new CTA exists.
9. Add a small "Cuenta del curso" indicator in `Nav.tsx` next to the active-student chip, showing email or "Sincronizado" / "Sin sincronizar" status.
10. Update `src/components/PersistenceInitializer.tsx` to delegate to `AuthBootstrap` (or replace it). The existing `PersistenceInitializer.test.ts` may need to be updated.
11. Add tests:
    - `src/lib/supabase/__tests__/sign-in.test.ts` — signInWithMagicLink wires `emailRedirectTo`, returns error shape, and the singleton client preserves state.
    - `src/components/__tests__/auth-bootstrap.test.ts` — listens to onAuthStateChange, calls `linkActiveProfileToAuthUser` on SIGNED_IN, calls `reinitializePersistence` on SIGNED_OUT.
    - `src/lib/__tests__/link-active-profile.test.ts` — when an active local profile exists and a SIGNED_IN event fires, `saveProfiles` is called with the active profile under `auth.uid()`.
    - `src/app/signin/__tests__/page-brand-voice.test.ts` — source-scan ensures no forbidden strings (mirror of `StudentGate.test.ts:126-194`).
    - Extend `src/lib/__tests__/migration-rls-shape.test.ts` (currently failing on main per `fix-profile-isolation-on-switch.followUps`) to assert no service-role or auth-leakage in the linking flow.
12. Update `.env.example` and `.env.local` — no new vars needed for magic link, but document the new `emailRedirectTo` URL.

**The proposal should explicitly call out**:

- Magic link requires the user to have email access. v0's local-first behavior is preserved — a user without email can still use the app entirely offline.
- The Supabase default email template is generic (no Ingenium branding). v0 accepts this; future change may customize via dashboard.
- `linkActiveProfileToAuthUser` is best-effort: if it fails (network error), the local profile is preserved and the user can re-attempt sync later. No data loss.
- Multiple local profiles + one sign-in: the active profile gets linked. Other profiles remain local-only. Future change can link them on demand.

---

## 6. Brand/voice constraints (CRITICAL)

From `AGENTS.md` §"Marca y voz (Ingenium — Instituto Bárbara Tomba)":

> **Voz prohibida**: "Soy tu profe…", "te marco qué practicar", "primero miro tu punto de partida", "vamos a armar un plan a tu medida" (cuando no hay tal loop), o cualquier variante que personifique la app como tutor. También: claims de personalización ("plan personalizado para vos") que la app cumple de forma limitada (basado en errores taggeados) y que confunden al alumno sobre qué es la app y qué es la clase.

> **Lo que la app SÍ puede prometer honestamente**: "Empezá por el diagnóstico inicial o seguí donde dejaste"; "Seguí donde dejaste o repasá algún tema que ya viste"; "El alumno va encaminado" / "Hay N habilidades que necesitan atención".

**Specific forbidden tokens** (from existing tests, enforced today):
- `src/components/__tests__/StudentGate.test.ts:135-156`: `login`, `avatar`, `Supabase`, `Docente`, `docente`, `password`. Plus account-context patterns: `/admin.*login|login.*admin`, `/admin.*email|email.*admin`, `/mi\s+cuenta`, `/tu\s+cuenta`, `/crear\s+cuenta`, `/eliminar\s+cuenta`.
- `src/components/__tests__/Nav-student.test.ts:34`: `["Docente", "docente", "login", "admin", "email", "contraseña", "avatar", "Supabase"]` (raw scan, more conservative than StudentGate's text-only scan).
- `src/domain/__tests__/copy-strings-acceptance.test.ts:26-33`: `profe digital`, `tu profesor`, `plan personalizado`, `te marco qué practicar`, `vamos a armar un plan a tu medida`, `soy tu tutor`.

**Already-approved tokens** (must continue to be allowed):
- "No necesitás contraseña." (StudentGate info body, line 77-79) — explicit, marked OK in `StudentGate.test.ts:142-145`.
- "Más adelante podrá sincronizarse con la cuenta del curso" (StudentGate info line, line 132-133) — explicit, marked OK in `StudentGate.test.ts:43-48`.
- "la cuenta del curso" (in pedagogical context) — explicit, marked OK in `StudentGate.test.ts:145`.

**Implications for the new sign-in UI**:

- **Headings**: prefer "Sincronizá tu perfil", "Cuenta del curso", "Sincronizar con la cuenta del curso" — avoid "Iniciar sesión", "Login", "Acceder a tu cuenta".
- **Body**: "Ingresá tu email y te mandamos un enlace para sincronizar tu perfil con la cuenta del curso. Tu progreso va a quedar guardado en el servidor del Instituto."
- **Input label**: "Email" (lowercase) — note `Nav-student.test.ts` forbids `email` in account-management contexts; the new test for the sign-in page must use a `text-only` extractor like `StudentGate.test.ts:159-177` to avoid false positives, OR explicitly allow `email` in the sign-in page context (the word is unavoidable for a magic-link form).
- **Primary action**: "Enviar enlace" — not "Sign in", "Log in", "Iniciar sesión".
- **Secondary action** (when session exists): "Cerrar la cuenta del curso" — not "Cerrar sesión", "Logout", "Salir".
- **Confirmation state**: "Listo. Revisá tu email y hacé clic en el enlace que te mandamos." — observation of state, not a promise.
- **Error state**: "No pudimos enviar el enlace. Probá de nuevo en un rato." — observation of state.
- **Indicator** (when env vars set, no session): "Tu perfil todavía no está sincronizado con la cuenta del curso." — observation of state.

The new brand-voice test for `/signin` MUST follow the `StudentGate.test.ts:159-177` JSX-text-extractor pattern to allow `email` as a label while still flagging `cuenta` in account-management patterns.

---

## 7. Integration points (where auth plugs into the existing selector)

### 7.1 The two gates the selector checks today

```text
selector.ts:265-296  (gate #1, #2, #3, #4)
  ├── gate #1: env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  ├── gate #2: getActiveProfileId() !== null             ← local-only check
  ├── gate #3: hasRemoteSession === true                  ← explicit signal
  └── gate #4: remoteAdapter is provided

adapter-config.ts:182-226  (initializePersistence)
  ├── gate A: createBrowserClient() !== null              ← depends on env vars
  ├── gate B: client.auth.getSession() returns session    ← currently always null
  └── gate C: hasRemoteSession: true is passed to selector
```

### 7.2 What changes when auth-sign-in-v0 ships

- `browser.ts`: persistSession/autoRefreshToken/detectSessionInUrl flipped to `true`. The singleton pattern (cachedClient) is preserved to avoid multiple `autoRefreshToken` timers.
- `initializePersistence()`: still works as-is — `getSession()` will now return a real session after sign-in.
- **New behavior needed**: `initializePersistence()` must be re-runnable. Today it's designed to run once. Add a `reinitializePersistence()` exported from `adapter-config.ts` that resets `configuredAdapter = null`, awaits any pending `initializationPromise`, then re-runs the same logic.
- **New listener**: `AuthBootstrap` subscribes to `onAuthStateChange` and calls `reinitializePersistence()` on `SIGNED_IN` and `SIGNED_OUT` events. The listener is mounted in `src/app/layout.tsx` alongside (or replacing) `PersistenceInitializer`.
- **New linking flow**: on `SIGNED_IN`, after `reinitializePersistence()` confirms the remote adapter is wired, call `saveProfiles(currentProfilesState)` once to upsert the active local profile to Supabase. This closes the FK gap for any subsequent `saveProgress()` call.

### 7.3 The student-identity ↔ auth-user link

Today the relationship is **null**. The Supabase adapter expects `(auth.uid(), activeStudentId)` rows in `student_profiles`. None exist on first sign-in. After auth-sign-in-v0 ships, the linking flow creates the row.

Edge cases the proposal/spec must address:

- **No local profile + signed in**: the user goes through StudentGate first (creates a local profile), then signs in. The linking flow then upserts to Supabase. Order matters — StudentGate MUST come first; the sign-in CTA on StudentGate must be a "next step" not a "first step".
- **Local profile + signed in with no Supabase row**: linking flow creates the row. ✓
- **Local profile + signed in + Supabase row exists for a different studentId**: this can only happen if the auth user previously synced a different profile on the same device, OR if two users share a device. RLS scopes to `auth.uid()`, so a different user can't see this user's rows. The linking flow should upsert the active profile by `(auth.uid(), activeStudentId)` key. If a different `studentId` exists for this auth user, it's preserved (the user has multiple profiles under one auth user).
- **No local profile + signed in**: sign-in must not auto-create a local profile — that violates the StudentGate contract. The user sees StudentGate, creates a profile, then signs in.
- **Local profile + sign-out**: local profile is preserved. The user can sign in again later with the same email and the linking flow upserts again (idempotent via `(user_id, student_id)` unique key).

### 7.4 Nav integration

`src/components/Nav.tsx` today has:
- Brand mark (left): `INGENIUM` + subtitle.
- Active-student chip (when `student !== null`): `Alumno activo: {name}`.
- 4 nav items: `/`, `/learn`, `/practice`, `/diagnostic`.

The proposal should add:
- A small badge next to the chip when env vars are set: "Sincronizado" (with a subtle visual indicator, no emoji per `AGENTS.md` "Anti-patrones visuales asociados") or "Sin sincronizar" with a link to `/signin`. The badge is conditional on `getSession() !== null` and is invisible when env vars are missing.
- Or: a new compact button in the chip area "Sincronizar con la cuenta del curso" when `getSession() === null && env vars are set`.

The `Nav-student.test.ts` test enforces `["Docente", "docente", "login", "admin", "email", "contraseña", "avatar", "Supabase"]` MUST NOT appear. The new copy must use "Sincronizar", "cuenta del curso", etc.

### 7.5 Test surface to update

- `src/components/__tests__/PersistenceInitializer.test.ts` — replace with `AuthBootstrap.test.ts` if the initializer is removed, or extend it.
- `src/components/__tests__/production-fallback-sink.test.ts` — unchanged (still uses initializePersistence with onFallback).
- `src/lib/__tests__/persistence-selector.test.ts` — extended: a new "test: when `hasRemoteSession` toggles from false to true via SIGNED_IN event, selector picks remote" scenario.
- `src/lib/__tests__/initialization-race.test.ts` — extended: a new "reinitializePersistence cancels in-flight initialization" scenario.
- `src/lib/__tests__/migration-rls-shape.test.ts` — currently failing on main per `STATUS.json` `fix-profile-isolation-on-switch.followUps`. Out of scope for auth-sign-in-v0 but the new linking flow's RLS assertions should slot in here.
- `src/lib/__tests__/no-service-role-scan.test.ts` — extended: scan new auth paths for any accidental service-role import.
- New: `src/lib/supabase/__tests__/sign-in.test.ts`, `src/components/__tests__/auth-bootstrap.test.ts`, `src/lib/__tests__/link-active-profile.test.ts`, `src/app/signin/__tests__/page-brand-voice.test.ts`, `src/app/auth/callback/__tests__/route.test.ts`.

---

## 8. Risks and gaps

### R-1: `initializePersistence()` is one-shot today

**Risk**: `PersistenceInitializer.tsx` runs `initializePersistence()` once on mount with `[]` deps. If the user signs in mid-session (or signs out, then back in), the adapter won't re-initialize.

**Mitigation**: Add `reinitializePersistence()` that resets `configuredAdapter = null`, awaits pending `initializationPromise`, then re-runs. `AuthBootstrap` calls it on every `SIGNED_IN` / `SIGNED_OUT` event. Backed by a test that proves re-initialization picks up the new session state.

### R-2: FK gap on first sign-in

**Risk**: After sign-in, `auth.uid()` is set but no row exists in `student_profiles` for `(auth.uid(), activeStudentId)`. The first `saveProgress()` after sign-in fails the FK on `student_progress_snapshots`. This is the same FK gap that `remote-fk-profile-creation.test.ts` solved for `createProfileAndActivate` — but the sign-in path doesn't go through that function.

**Mitigation**: `AuthBootstrap` calls a new `linkActiveProfileToAuthUser()` helper on `SIGNED_IN` that reads the current profiles state via `loadProfiles()` and calls `saveProfiles(state)`. This upserts the active profile under `auth.uid()` and closes the FK gap. Backed by a new test.

### R-3: Multiple local profiles + one sign-in

**Risk**: If the device has 3 local profiles and the user signs in, only the active one gets linked. The other 2 stay local-only. Is this the right behavior?

**Decision (for proposal)**: yes — link only the active profile. Each local profile represents an independent `studentId`. Linking happens when that profile is active and the user signs in. If the user switches profiles after signing in, the next `saveProfiles()` call (triggered by any profile mutation) upserts that profile too. No data loss.

**Documentation**: this should be in the proposal's "Approach" section as an explicit decision.

### R-4: Next.js App Router + cookie-based session

**Risk**: Without `@supabase/ssr` + `middleware.ts`, server components can't see the session. Currently, no server components touch Supabase — this is consistent with today's architecture. But future auth-gated server components will need `@supabase/ssr` retrofitted. The sooner we add it, the smaller the future diff.

**Mitigation**: Approach A adds `@supabase/ssr` from day one. The `middleware.ts` is small and stateless (refresh tokens + forward). Approach B accepts the limitation but the proposal should flag it as a known debt.

### R-5: Duplicate `autoRefreshToken` timers

**Risk**: With `persistSession: true`, the Supabase client starts a `setInterval` to refresh tokens before they expire. In Next.js dev mode with hot reload, the singleton pattern in `browser.ts` (cachedClient) prevents duplicate clients, but the timer can still be created multiple times if React strict mode double-invokes effects.

**Mitigation**: The cachedClient singleton ensures only one Supabase client exists. The `onAuthStateChange` subscription in `AuthBootstrap` is created inside `useEffect(..., [])` and cleaned up in the return. Backed by a test that mounts `AuthBootstrap` twice and asserts only one `onAuthStateChange` subscription is registered.

### R-6: Brand voice in the new sign-in UI

**Risk**: The forbidden-strings list is enforced by source-scan tests today. New sign-in copy risks tripping the gate.

**Mitigation**: A new `page-brand-voice.test.ts` for `/signin` that mirrors `StudentGate.test.ts:126-194` (JSX-text-only extractor, account-context patterns, allowlist for "la cuenta del curso" and the email field label). The proposal must include exact copy strings in the design so they're reviewable before code lands.

### R-7: Magic link requires email access during class

**Risk**: A student in class with a tablet that has no email configured can't sign in. v0 must preserve local-only operation as a fallback.

**Mitigation**: The selector's existing gate #2 (`getActiveProfileId() !== null`) means the app works fully offline as long as a local profile exists. Sign-in is a **sync-only** step, not a prerequisite. The StudentGate CTA "Sincronizar con la cuenta del curso" is a secondary action, not the primary path. The primary path is still "Empezar a estudiar" with the local profile.

### R-8: Supabase default email template

**Risk**: The magic link email user receives is a generic Supabase-branded template, not Ingenium-branded.

**Mitigation**: v0 accepts the default. Customization requires Supabase dashboard config (out-of-band) and is non-blocking. A future change can customize the template without touching client code.

### R-9: Sign-out doesn't delete the local profile

**Risk**: If the user signs out, the local profile is preserved (correct — the user can re-sign-in and re-link). But if the user signs in with a DIFFERENT email on the same device, the previously-linked profile's remote row still exists. The new auth user can't see the old user's rows (RLS scopes by `auth.uid()`), so no data leak. But the UX may surprise the user.

**Mitigation**: Document this in the proposal. Future change can add a "Switch account" affordance with explicit "sign out and switch" copy. v0 doesn't need it.

### R-10: Existing `.env.local` is dev-only

**Risk**: `.env.local` is configured but `.env.example` notes "WARNING: not loaded in Vercel production yet. Production stays localStorage-only until auth-sign-in-v0 ships." Vercel production env vars must be added before merge to deploy.

**Mitigation**: The proposal's "Rollout" section MUST include setting `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on Vercel BEFORE merge. The deploy step should be on the orchestrator's pre-merge checklist.

### R-11: Email enumeration via sign-in

**Risk**: `signInWithOtp` doesn't reveal whether an email is registered (Supabase returns the same success message either way — this is correct behavior, no enumeration). But the UX must show the same confirmation regardless of whether the email exists. The proposal must include the confirmation copy.

**Mitigation**: Standard pattern — "Si el email está registrado, te enviamos un enlace." v0 uses the simpler "Revisá tu email y hacé clic en el enlace que te mandamos" which is honest regardless.

### R-12: Pre-existing `migration-rls-shape.test.ts` failure

**Risk**: STATUS.json flags `migration-rls-shape.test.ts` as currently failing on main (`fix-profile-isolation-on-switch.followUps` + `u3-inecuaciones-ejemplo-distinto.verify`). Out of scope for auth-sign-in-v0.

**Mitigation**: The new auth-sign-in-v0 tests should not depend on this test passing. If RLS assertions need to live somewhere, they go in a new `src/lib/__tests__/sign-in-rls-shape.test.ts` file to avoid coupling with the pre-existing failure.

---

## 9. Open questions for the user (proposal phase)

The following are decisions the user (Pablo) needs to make during `sdd-propose`. Each is a single-choice question; the orchestrator should ask them one at a time per the gentle-ai persona rule.

1. **Auth method**: A (magic link + `@supabase/ssr`) or B (email+password + raw client) or C (OAuth)? Recommendation: A.
2. **Route placement**: `/signin` (simple) or `/cuenta/ingresar` (matches "la cuenta del curso" terminology)? Recommendation: `/cuenta/ingresar` for brand consistency.
3. **Email scope**: should sign-in be available only for `@ingenium.edu` emails (if such a domain exists), or any email? Recommendation: any email for v0; future change can restrict via Supabase RLS or trigger.
4. **Sign-out UX**: button in Nav (visible to all users with a session) or only in StudentSwitcher (hidden in a modal)? Recommendation: small badge/button in Nav, matching the active-student chip area.
5. **Multiple-account support**: if the user has 3 local profiles and signs in with email A, then signs out and signs in with email B on the same device, what happens? Recommendation: each `(authUser, localProfile)` pair gets its own linked row in `student_profiles`. The local profiles persist across sign-out. Future change can add explicit "switch account" flow.

---

## 10. Ready for proposal?

**Yes**, with the following conditions for the orchestrator:

- The orchestrator must ask the user the 5 open questions in §9 before launching `sdd-propose`. The recommendation is A / `/cuenta/ingresar` / any email / Nav badge / per-(user,profile) linking.
- The proposal must include exact copy strings in the design phase (no placeholders). The brand-voice test pattern from `StudentGate.test.ts:126-194` should be in the design as a code-style snippet so the reviewer can see how the test will enforce the copy.
- The proposal must flag R-10 (Vercel env vars) as a pre-merge action item on the orchestrator's checklist.
- The proposal must reference the prior change's `apply-progress.md` PR2 size exception pattern. Auth-sign-in-v0's total diff (sign-in page + middleware + auth bootstrap + linking flow + ~15 new tests + brand-voice tests) is likely 500-800 lines. Forecast may exceed the 400-line budget. The orchestrator should pre-decide between chained PRs and `size:exception` before `sdd-tasks`.

**Next phase**: `sdd-propose` (after the orchestrator asks the user the 5 open questions and gets answers).
