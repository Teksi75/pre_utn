# Design: Fix post-auth Supabase sync

## Technical Approach

Make the post-callback client path deterministic: `INITIAL_SESSION` and `SIGNED_IN` both enter one idempotent link/import orchestrator, then persistence is reselected only after the profile FK row and safe import path finish. Remote reads remain usable through the existing fallback wrapper, but remote-empty is treated as recoverable when local progress exists. Home must always derive a renderable view model from remote-or-local data; Nav must distinguish “session exists” from “sync is ready”.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Auth event handling | Treat `INITIAL_SESSION` as equivalent to `SIGNED_IN` in `AuthBootstrap`. | Server callback import; ignore initial session. | Supabase emits `INITIAL_SESSION` after callback page load; the client has localStorage access needed for import. |
| Idempotency | Add a module-level in-flight/done guard keyed by `session.user.id` plus active `studentId`. | UI-only dedupe; DB-only upsert. | Prevents duplicate import when both events fire while preserving DB idempotency for profile upsert. |
| FK ordering | Upsert `student_profiles` before `importLocalProgressToRemote()` writes snapshots. | Keep current final FK link. | Snapshot writes require the FK row; final link is too late for import branch. |
| Readiness | Add post-auth sync readiness state/promise in `adapter-config.ts`. | Visual loading gate; arbitrary timeout. | Existing storage APIs already await initialization; extending that boundary avoids blank UI without blocking Diagnostic/Practice navigation. |
| Remote empty fallback | Detect empty remote progress/snapshot state and delegate to local when local has data. | Treat `EMPTY_PROGRESS` as canonical. | A newly linked remote account starts empty; hiding local progress is destructive UX even if no deletion occurred. |

## Data Flow

```text
/auth/callback -> /cuenta -> client mount
  AuthBootstrap INITIAL_SESSION/SIGNED_IN
    -> beginPostAuthSync(session)
      -> ensure local profile exists
      -> linkActiveProfileToAuthUser()   # student_profiles FK first
      -> probe remote state
      -> import local only when local-has + remote-empty
    -> reinitializePersistence()
  Home/Nav read readiness + fallback-safe persistence
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/components/auth/AuthBootstrap.tsx` | Modify | Handle `INITIAL_SESSION`; call shared sync runner for both sign-in events; reinitialize after sync. |
| `src/lib/auth/link-and-import.ts` | Modify | Add per-user/student idempotency and move FK upsert before import writes. |
| `src/lib/auth/link-profile.ts` | Modify | Keep best-effort idempotent upsert contract; expose result only if needed by readiness. |
| `src/lib/persistence/adapter-config.ts` | Modify | Add post-auth sync readiness promise/status and make reinitialization await it. |
| `src/components/PersistenceInitializer.tsx` | Modify | Initialize through readiness-aware selection; keep no visual gate. |
| `src/lib/persistence/selector.ts` | Modify | Extend fallback wrapper/selector contract for remote-empty + local-has reads. |
| `src/lib/persistence/supabase-adapter.ts` | Modify | Preserve `EMPTY_PROGRESS` as an empty sentinel; do not make it authoritative over local data. |
| `src/components/home/HomeNextStepClient.tsx` | Modify | Replace silent catch with explicit local/empty fallback view model. |
| `src/components/Nav.tsx` | Modify | Render sync badge from readiness status, not raw session only; keep links accessible. |
| `src/app/auth/callback/route.ts` | Keep | No Supabase/Vercel/env/middleware changes. |

## Interfaces / Contracts

```ts
type PostAuthSyncStatus =
  | "disabled"
  | "signed-out"
  | "pending"
  | "ready"
  | "local-fallback";

function beginPostAuthSync(session: Session | null): Promise<PostAuthSyncStatus>;
function getPostAuthSyncStatus(): PostAuthSyncStatus;
function waitForPostAuthSync(): Promise<void> | null;
```

`ready` means auth session exists, active local profile is linked/upserted, and import branch has completed or safely no-oped. `local-fallback` means the app must keep local progress visible. `pending` must not disable Diagnostic/Practice links.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `INITIAL_SESSION` + `SIGNED_IN` duplicate path imports once; FK upsert before snapshot save. | Extend `link-and-import.test.ts`; add ordering spies. |
| Unit | Remote empty + local has returns local progress and emits fallback. | Extend `persistence-selector.test.ts` / Supabase adapter tests. |
| Component | Nav badge says pending/fallback until sync ready; Diagnostic/Practice links remain present. | Extend `Nav-auth.test.ts`. |
| Component | Home catch path resolves to actionable fallback, not permanent skeleton. | Add/extend Home client test. |
| Route smoke | Callback still redirects and does not change env key contract. | Keep existing callback route tests. |

## Migration / Rollout

No migration required. Roll out as code-only change. Smoke: sign in with existing local progress, verify Home shows progress, Nav no false “Sincronizado”, Diagnostic/Practice reachable, and Supabase has `student_profiles` before snapshots.

## Open Questions

- [ ] None blocking.
