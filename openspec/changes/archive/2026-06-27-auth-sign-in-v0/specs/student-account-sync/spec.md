# Student Account Sync Specification

## Purpose

Define magic-link sign-in, SSR session handling, persistence re-initialization, non-destructive local-to-remote linking, and brand-voice compliance for syncing a local profile to the remote course account.

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-AUTH-1 | `/cuenta/ingresar` is the single entry point; valid email submits `signInWithOtp(email, { emailRedirectTo: "/auth/callback" })`; `/auth/callback` exchanges code for session and redirects to `/cuenta`. |
| REQ-NEW-1 | No local profile/progress → `/cuenta/ingresar` shows new-account variant (email + visible name) with approved copy; on `SIGNED_IN` creates remote `student_profiles` first, then local backup. |
| REQ-NEW-2a | Before remote switch, read active local profile and local progress. |
| REQ-NEW-2b | Local progress exists → `/cuenta/ingresar` shows linking variant with approved copy, only email (name if missing), and aux text. |
| REQ-NEW-2c | Remote empty + local has progress → import profile + progress + diagnostic + study plan to Supabase non-destructively; preserve IDs; do not auto-delete localStorage. |
| REQ-NEW-2d | Both have progress → no overwrite; remote wins reads, local backup; open GitHub issue for conflict UI. |
| REQ-NEW-3 | Student UI SHALL NOT show technical jargon; SHALL use simple language. |
| REQ-NEW-SEC | No service_role/secret/admin keys in client; env key is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; callback route removes `NEXT_PUBLIC_SUPABASE_ANON_KEY` fallback. |
| REQ-NEW-ARCH-1 | New students with no local profile generate `student_id` optimistically and create remote profile (then local backup) so selector gate passes and FK is valid. |
| REQ-AUTH-2 | `@supabase/ssr` cookie storage; middleware refreshes tokens per request. |
| REQ-AUTH-3 | `AuthBootstrap` calls `linkActiveProfileToAuthUser()` then `reinitializePersistence()` on `SIGNED_IN`; `reinitializePersistence()` on `SIGNED_OUT`. |
| REQ-AUTH-4 | (Superseded by REQ-NEW-2c.) |
| REQ-AUTH-5 | `signOut` clears session, emits `SIGNED_OUT`, falls back to local. |
| REQ-AUTH-6 | Auth UI copy matches brand-voice table; source-scan rejects forbidden tokens. |

## Scenarios

| Req | Scenario | Given | When | Then |
|-----|----------|-------|------|------|
| 1 | valid email | sign-in page rendered | user enters valid email and clicks action | `signInWithOtp` invoked with `/auth/callback` |
| 1 | valid callback | callback route receives valid code | handler runs | session created, redirect to `/cuenta` |
| NEW-1 | new student flow | no local profile/progress | `/cuenta/ingresar` renders | shows email + name fields and new-account copy; remote profile created before local backup |
| NEW-2a | detect local | local profile + progress exist | sign-in begins | local state read before any remote write |
| NEW-2b | linking UI | local progress exists | `/cuenta/ingresar` renders | shows linking variant with approved copy, only email (name if missing) |
| NEW-2c | import to empty remote | local progress exists, remote empty | user signs in | progress imported to Supabase; localStorage intact |
| NEW-2c | import failure | local progress exists, remote import fails | user signs in | local progress intact, app usable via fallback |
| NEW-2d | conflict | both remote and local progress exist | user signs in | no overwrite, localStorage preserved |
| NEW-3 | no jargon | student-facing auth screens | copy scanned | forbidden jargon absent |
| NEW-SEC | hardening | callback + client code scanned | key references checked | uses publishable key; no ANON_KEY fallback; no secret keys |
| NEW-ARCH-1 | selector gate | no local profile | new-student sign-in completes | valid `student_id` exists, remote adapter selectable |
| 2 | reload | signed-in user refreshes | app mounts | `getSession` returns active session |
| 3 | SIGNED_IN | user signs in | listener emits `SIGNED_IN` | profile linked, remote adapter selected |
| 5 | sign out | signed-in user | `signOut` called | session cleared, `SIGNED_OUT` emitted |
| 6 | sign-in copy | `/cuenta/ingresar` source scanned | copy checked | approved copy present |
