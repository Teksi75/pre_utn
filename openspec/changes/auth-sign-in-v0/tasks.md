# Tasks: auth-sign-in-v0

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

PR1 `auth-shell` ~800 lines (size:exception requested — ~60% tests; matches supabase-adapter-v0-fallback PR2 precedent). PR2 `auth-ui` ~400 lines (borderline; UI + brand-voice tests). Strategy: stacked-to-main.

## Phase 1: PR1 — auth-shell (infra, middleware, provider)

- [x] **T-AUTH-S1.1** Add `@supabase/ssr`. Files: `package.json`. Acceptance: typecheck passes; lockfile regenerates.
- [x] **T-AUTH-S1.2** Swap `src/lib/supabase/browser.ts` to `@supabase/ssr` (TDD). RED: env-missing → null; `persistSession/autoRefreshToken/detectSessionInUrl` all true; singleton preserved. GREEN: rewrite with `createBrowserClient`. Files: `browser.ts`, `__tests__/browser.test.ts`. Deps: S1.1.
- [x] **T-AUTH-S1.3** Auth helpers `src/lib/supabase/auth.ts` (TDD). RED: `signInWithMagicLink(email,{emailRedirectTo:"/auth/callback"})`; `getCurrentSession`; `signOut`; `onAuthStateChange` returns unsubscribe. GREEN: wrappers around singleton. Files: `auth.ts`, `__tests__/auth.test.ts`. Deps: S1.2.
- [x] **T-AUTH-S1.4** `src/middleware.ts` token refresh (TDD). RED: `createServerClient` per request; `auth.getUser()`; refreshed cookies; matcher excludes `_next/static`. Files: `middleware.ts`, `middleware.test.ts`. Deps: S1.1.
- [x] **T-AUTH-S1.5** `reinitializePersistence()` in adapter-config (TDD). RED: resets `configuredAdapter`; re-runs selection; preserves sink; local when no env; remote when env+session. GREEN: share selection core with `initializePersistence`. Files: `adapter-config.ts`, `__tests__/adapter-config-reinit.test.ts`, `index.ts`. Deps: S1.2.
- [x] **T-AUTH-S1.6** `linkActiveProfileToAuthUser()` in `src/lib/auth/link-profile.ts` (TDD). RED: no profile → no-op; active+session → upsert `(user_id, student_id)`; idempotent; best-effort on error. Files: `link-profile.ts`, `__tests__/link-profile.test.ts`. Deps: S1.3.
- [x] **T-AUTH-S1.7** `SessionProvider` context (TDD source-scan). RED: exposes `session, userEmail, isLoading, isAuthEnabled, signOut`; `isAuthEnabled=false` when env missing; one listener survives Strict Mode. GREEN: `useState`+`useEffect`+`onAuthStateChange` with cleanup. Files: `SessionProvider.tsx`, `__tests__/SessionProvider.test.tsx`. Deps: S1.3.
- [x] **T-AUTH-S1.8** `AuthBootstrap` listener (TDD source-scan). RED: `SIGNED_IN` → `linkActiveProfileToAuthUser()` BEFORE `reinitializePersistence()`; `SIGNED_OUT` → reinit only. Files: `AuthBootstrap.tsx`, `__tests__/AuthBootstrap.test.tsx`. Deps: S1.5, S1.6, S1.7.
- [x] **T-AUTH-S1.9** Wire `SessionProvider`+`AuthBootstrap` in `src/app/layout.tsx`. Acceptance: no hydration mismatch; stable server placeholder for Nav badge. Files: `layout.tsx`. Deps: S1.7, S1.8.

## Phase 2: PR2 — auth-ui (pages, Nav badge, StudentGate CTA)

- [x] **T-AUTH-U2.1** `/cuenta/ingresar` sign-in form (TDD source-scan). RED: heading "Sincronizá tu perfil"; body copy; `Email` label; `Enviar enlace`; forbids `login|contraseña|profe digital|Supabase`. GREEN: form → `signInWithMagicLink`; loading/error/success. Files: `cuenta/ingresar/page.tsx`, `__tests__/page-brand-voice.test.ts`. Deps: S1.3.
- [x] **T-AUTH-U2.2** `/auth/callback` route (TDD). RED: `?code` → server exchange → redirect `/cuenta`; missing → redirect `/cuenta/ingresar` (no throw). Files: `auth/callback/route.ts`, `__tests__/route.test.ts`. Deps: S1.4.
- [x] **T-AUTH-U2.3** `/cuenta` account stub (TDD source-scan). RED: sync status + `Cerrar la cuenta del curso` button via `useSession().signOut()`. Files: `cuenta/page.tsx`, `__tests__/page-brand-voice.test.ts`. Deps: S1.7.
- [x] **T-AUTH-U2.4** `Nav.tsx` sync badge + sign-out (TDD source-scan). RED: `Sin sincronizar` / `Sincronizado como {email}` + `Cerrar la cuenta del curso`. Update `Nav-student.test.ts` allowlist. Files: `Nav.tsx`, `__tests__/Nav-student.test.ts`. Deps: S1.7.
- [x] **T-AUTH-U2.5** `StudentGate.tsx` secondary CTA (TDD source-scan). RED: `Sincronizar con la cuenta del curso` button → `/cuenta/ingresar`. Files: `StudentGate.tsx`, `__tests__/StudentGate.test.ts`. Deps: none.
- [x] **T-AUTH-U2.6** Document `NEXT_PUBLIC_SUPABASE_*` + emailRedirectTo convention. Files: `.env.example`. Deps: none.

## Rollout Checklist (orchestrator action, before PR2 merge)

- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on Vercel production.
- [ ] Add `https://<host>/auth/callback` to Supabase Auth → URL Configuration.
- [ ] `pnpm run test && pnpm run typecheck && pnpm run build` after each PR; GGA via pre-commit.
- [ ] Preview smoke: magic-link for `alumno@example.com`; verify `student_profiles` row + progress round-trip.
- [ ] Rollback: remove Vercel env vars → local-only mode, or revert branch.
