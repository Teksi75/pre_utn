# Proposal: `auth-sign-in-v0` — activate the dormant remote persistence adapter

## Intent

`supabase-adapter-v0-fallback` (I-24, merged `cfe3a75`) shipped a remote Supabase persistence adapter that is **dormant**: `src/lib/persistence/selector.ts:265-296` requires `client.auth.getSession() !== null`, but `src/lib/supabase/browser.ts` ships with `persistSession: false`, `autoRefreshToken: false`, `detectSessionInUrl: false`, and there is zero auth UI in `src/`. The remote adapter never runs in production. This change ships the minimal auth entry point that produces a Supabase session and wires `SIGNED_IN` / `SIGNED_OUT` events into the existing selector boundary — turning the dormant adapter into the live path for users who choose to sync.

**Pedagogical payoff**: the `student-local-identity` spec already promises *"Este perfil es local. Más adelante podrá sincronizarse con la cuenta del curso."* This change makes that promise actionable.

## Scope

### In scope (v0)

- Add `@supabase/ssr` dep + `src/middleware.ts` for token refresh.
- `src/app/cuenta/ingresar/page.tsx` — single email input, magic-link submit.
- `src/app/auth/callback/route.ts` — completes the email-redirect handshake.
- `src/components/auth/AuthBootstrap.tsx` — mounted in `layout.tsx`, subscribes to `onAuthStateChange`, calls `reinitializePersistence()` on every event.
- `src/lib/supabase/auth.ts` — thin helpers (`signInWithMagicLink`, `getCurrentSession`, `signOut`, `onAuthStateChange`).
- `reinitializePersistence()` export from `src/lib/persistence/adapter-config.ts`.
- `linkActiveProfileToAuthUser()` — upserts the active local profile via `saveProfiles()` to close the FK gap on `student_progress_snapshots`.
- `StudentGate` gains a secondary *"Sincronizar con la cuenta del curso"* action linking to `/cuenta/ingresar`.
- `Nav` gains a small `Sincronizado` / `Sin sincronizar` badge next to the active-student chip (invisible when env vars are absent).
- Brand-voice source-scan test mirroring `StudentGate.test.ts:126-194`.
- `persistence-selector.test.ts` — flip the `persistSession=false` assertion (see R-12 note); add `SIGNED_IN → selector picks remote` scenario.
- Vercel env vars for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (pre-merge orchestrator action).

### Out of scope (deferred)

- OAuth providers, email + password, password reset, email change.
- Custom Supabase email template (uses default).
- `signOut` UI affordance beyond a small Nav link (full account panel later).
- Profile merging, multi-device sync UX, conflict resolution.
- `/docente` panel, admin entry, server-component auth-gated routes.

## Capabilities

### New Capabilities

- `student-account-sync`: magic-link auth + reactive bootstrap + active-profile linking + sign-out, all wired through `getActiveProfileId()` boundary and the existing selector.

### Modified Capabilities

- `student-local-identity`: extend with a *"Linked Remote Account"* requirement (per-`(authUser, studentId)` row in `student_profiles`; linking is idempotent and best-effort; local profile survives sign-out).

## Approach

1. Swap `src/lib/supabase/browser.ts` from `@supabase/supabase-js`'s `createClient` to `@supabase/ssr`'s `createBrowserClient`, with `isSingleton: true` and cookie handlers; flip the three auth toggles to `true`.
2. `src/middleware.ts` runs `createServerClient` on every request to refresh tokens, no-op for non-auth paths.
3. `AuthBootstrap` mounts in `layout.tsx` next to `PersistenceInitializer`. On mount: `getCurrentSession()`. On `SIGNED_IN`: `linkActiveProfileToAuthUser()` → `reinitializePersistence()`. On `SIGNED_OUT`: `reinitializePersistence()` (falls back to local).
4. `linkActiveProfileToAuthUser()` reads `loadProfiles()` and calls `saveProfiles(state)`; the remote adapter's `(user_id, student_id)` upsert closes the FK gap before any `saveProgress()`.
5. Routes: `/cuenta/ingresar` (sign-in) and `/cuenta` (account stub with sign-out).
6. Strict TDD per `AGENTS.md`. Tests pin to the existing patterns from `StudentGate.test.ts:126-194` (JSX-text extractor) and `supabase-adapter-v0-fallback`.

## Assumptions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Auth method | Magic link (`signInWithOtp`) via `@supabase/ssr` | Smallest brand-voice surface; no `contraseña` copy; honors *"la cuenta del curso"* promise already in copy. |
| 2 | Route placement | `/cuenta/ingresar`, `/cuenta`, `/auth/callback` | Neutral Spanish, consistent with the *"cuenta del curso"* terminology. |
| 3 | Email scope | Any email accepted | Supabase Auth handles verification; restricting to a domain is dashboard config, out of band for v0. |
| 4 | Sign-out UX | Small `Cerrar la cuenta del curso` link in Nav, next to the sync badge | Mirrors sync badge location; minimal for v0. |
| 5 | Multi-account handling | Per-`(authUser, studentId)` row in `student_profiles`; only the active profile links on `SIGNED_IN`; local profiles persist across sign-out | Idempotent via the `(user_id, student_id)` unique key. Future change can add an explicit switch-account flow. |

## Risks

| ID | Risk | Likelihood | Mitigation |
|----|------|------------|------------|
| R-1 | `initializePersistence()` is one-shot; mid-session sign-in won't re-init | Med | Add `reinitializePersistence()` that resets `configuredAdapter` and awaits `initializationPromise`; backed by test. |
| R-2 | FK gap on first `SIGNED_IN` (`saveProgress` fails before linking) | Med | `linkActiveProfileToAuthUser()` upserts the active profile via `saveProfiles()` before any progress write; backed by test. |
| R-5 | Duplicate `autoRefreshToken` timers under React strict mode | Low | `cachedClient` singleton + `onAuthStateChange` inside `useEffect(..., [])` with cleanup; backed by mount-twice test. |
| R-6 | Brand-voice gate trips on new sign-in copy | Med | Source-scan test mirrors `StudentGate.test.ts:159-177` JSX-text-only extractor; allowlist `email` as label; exact copy strings baked in the design. |
| R-8 | Default Supabase email template is generic | Low | v0 accepts the default; customization is a future out-of-band dashboard change. |
| R-10 | `.env.local` is dev-only; Vercel envs missing | **High** | Pre-merge orchestrator action: set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on Vercel production before merge. |
| R-12 | Pre-existing `migration-rls-shape.test.ts` failure on main | Already fixed in `c6dc79a` | No coupling — new auth tests live in their own files. |

## Rollback Plan

The change is opt-in: without Vercel env vars, `selectPersistenceAdapter` falls back to local exactly as today. If sign-in causes a regression in production, disable the production env vars (revert to local-only) without code changes. Code rollback: revert the `feat/auth-sign-in-v0` branch merges; the prior state is preserved because `student-local-identity` keeps local-only operation as the canonical fallback.

## Dependencies

- **New dep**: `@supabase/ssr` (~5KB gz, official Supabase Next.js integration).
- **Vercel production env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **`.env.example`**: document the new `emailRedirectTo` URL.

## Success Criteria

- [ ] A signed-in user sees their progress persist to Supabase (verifiable via `student_profiles` / `student_progress_snapshots` rows).
- [ ] A signed-out user can use the app fully offline; local-only behavior is unchanged.
- [ ] Sign-in mid-session triggers `reinitializePersistence()` and the next `saveProgress()` writes to Supabase.
- [ ] No forbidden brand-voice tokens appear in the new UI (source-scan test enforces).
- [ ] All forbidden tokens from `StudentGate.test.ts` and `Nav-student.test.ts` remain clean.
- [ ] `pnpm run test && pnpm run typecheck && pnpm run build` pass.
- [ ] Forecast 500-800 lines; orchestrator `auto-chain` directive + `supabase-adapter-v0-fallback` precedent → deliver via chained PRs (likely 2: PR1 = `auth-shell` dep + middleware + helpers + tests; PR2 = `auth-ui` sign-in page + Nav badge + StudentGate CTA + brand-voice scan + Vercel env wiring).

## Brand-Voice Compliance

| Element | Copy |
|---------|------|
| Page heading | *"Sincronizá tu perfil"* |
| Body | *"Ingresá tu email y te mandamos un enlace para sincronizar tu perfil con la cuenta del curso. Tu progreso va a quedar guardado en el servidor del Instituto."* |
| Input label | `Email` (lowercase — extractor pattern allows it as label) |
| Primary action | `Enviar enlace` |
| Confirmation | *"Listo. Revisá tu email y hacé clic en el enlace que te mandamos."* |
| Error | *"No pudimos enviar el enlace. Probá de nuevo en un rato."* |
| Indicator (no session) | `Sin sincronizar` → links to `/cuenta/ingresar` |
| Indicator (signed in) | `Sincronizado como {email}` + `Cerrar la cuenta del curso` link |
| StudentGate CTA | `Sincronizar con la cuenta del curso` (already approved in `student-local-identity` spec text) |

The new brand-voice source-scan test (`src/app/cuenta/ingresar/__tests__/page-brand-voice.test.ts`) MUST follow the `StudentGate.test.ts:159-177` JSX-text-only extractor pattern to allow `email` as a label without tripping the gate, while still flagging `login`, `cuenta` in account-management patterns, `contraseña`, `Docente`, `profe digital`, and `Supabase`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/supabase/browser.ts` | Modified | Swap `createClient` → `createBrowserClient` from `@supabase/ssr`; flip three auth toggles. |
| `src/lib/supabase/auth.ts` | New | Magic-link + session helpers. |
| `src/middleware.ts` | New | Token refresh on every request. |
| `src/components/auth/AuthBootstrap.tsx` | New | `onAuthStateChange` listener + link + re-init. |
| `src/app/cuenta/ingresar/page.tsx` | New | Sign-in form. |
| `src/app/cuenta/page.tsx` | New | Account stub (sync status + sign-out). |
| `src/app/auth/callback/route.ts` | New | Magic-link callback handshake. |
| `src/app/layout.tsx` | Modified | Mount `AuthBootstrap` alongside `PersistenceInitializer`. |
| `src/lib/persistence/adapter-config.ts` | Modified | Export `reinitializePersistence()`. |
| `src/lib/persistence/supabase-adapter.ts` | None | Already correct (dormant, not broken). |
| `src/components/StudentGate.tsx` | Modified | Add secondary *"Sincronizar con la cuenta del curso"* CTA. |
| `src/components/Nav.tsx` | Modified | Add sync status badge + sign-out link. |
| `package.json` | Modified | Add `@supabase/ssr`. |
| `.env.example` | Modified | Document `emailRedirectTo`. |
| Vercel production env | Action | Orchestrator sets the two public vars before merge. |