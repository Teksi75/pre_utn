# Design: Active Session Module

## Technical Approach

Add a tiny session boundary in `src/lib/active-session.ts` that exposes `getActiveProfileId(): string | null` and delegates to the existing profile storage adapter. `src/lib/student-profile-storage.ts` remains the owner of `pre-utn.profiles.v1` parsing, writes, migration-created profile state, and full-profile recovery. Existing persistence adapters that only need the active id will import the new boundary instead of parsing the profile key directly.

This preserves the `student-local-identity` behavior: no UI-visible change, no anonymous fallback, and corrupt or unavailable storage stays non-throwing.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Active-session API shape | Create `getActiveProfileId(): string \| null` in `src/lib/active-session.ts`. | Move all profile parsing into the new module; expose profile objects from session. | The change only needs current identity. Keeping the API narrow avoids coupling future adapters to local profile shape. |
| Profile key ownership | `active-session.ts` delegates to `getActiveStudentId()` from `student-profile-storage.ts`. | Duplicate JSON parsing in `active-session.ts`; move `getActiveStudentId()` out of profile storage. | Existing profile storage already centralizes safe parsing and swallows storage errors. Duplicating parsing would make the new boundary cosmetic, not architectural. |
| Adapter migration | Replace private `getActiveStudentIdInternal()` in `practice-progress.ts` and `diagnostic-storage.ts`; keep full-profile flows unchanged. | Rewrite all storage modules; change storage shapes. | The spec is a boundary refactor, not a data model migration. Minimal replacement lowers regression risk. |
| Legacy migration exception | Keep `practice-progress.ts` legacy migration writes to `pre-utn.profiles.v1` via profile-storage-owned helper only if implementation introduces one; otherwise leave write exception documented. | Force migration through active-session; remove migration. | Active-session is read-only. Legacy migration creates profile state and must preserve I-21 behavior without broad refactor. |

## Data Flow

```text
practice/diagnostic adapter
        │
        ▼
getActiveProfileId()  ──→  student-profile-storage.getActiveStudentId()
        │                         │
        │                         └─ safe read of pre-utn.profiles.v1
        ▼
student-scoped persistence or blocked no-write result
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/active-session.ts` | Create | Read-only active session boundary exporting `getActiveProfileId()`. |
| `src/lib/student-profile-storage.ts` | Modify | Remains profile storage owner; may only add a narrow helper if needed for legacy migration write containment. |
| `src/lib/practice-progress.ts` | Modify | Import `getActiveProfileId()` for active-id reads; preserve lazy legacy migration and blocked saves. |
| `src/lib/diagnostic-storage.ts` | Modify | Replace private profile-key parsing with `getActiveProfileId()` for diagnostic and study-plan operations. |
| `src/lib/advanced-practice-progress.ts` | Modify | Optionally switch from `getActiveStudentId()` to `getActiveProfileId()` for naming consistency; behavior unchanged. |
| `src/lib/__tests__/active-session.test.ts` | Create | Boundary tests for valid active id, missing key, corrupt JSON, and no thrown exceptions. |
| `src/lib/__tests__/practice-progress.test.ts` | Modify | Characterize adapter behavior after boundary refactor. |
| `src/lib/__tests__/diagnostic-storage.test.ts` | Modify | Characterize blocked/no-throw behavior after boundary refactor. |
| `src/lib/__tests__/active-session-boundary.test.ts` | Create | Scan source for direct `localStorage.getItem("pre-utn.profiles.v1")` outside approved boundary files. |

## Interfaces / Contracts

```ts
// src/lib/active-session.ts
export function getActiveProfileId(): string | null;
```

Contract: returns the current local `activeStudentId`, or `null` for missing, corrupt, unavailable, or unreadable profile storage. It never throws and never creates profiles.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Active-session boundary returns id/null and swallows corrupt storage. | New RED tests in `active-session.test.ts` before module creation. |
| Integration | Practice and diagnostic adapters preserve active-student scoping and blocked no-write behavior. | Update existing adapter tests first, then refactor imports. |
| Characterization | No direct `localStorage.getItem("pre-utn.profiles.v1")` outside `student-profile-storage.ts` and approved boundary. | Source scan test using `fs`/path allowlist. |
| E2E | Not required. | No UI behavior changes. |

## Migration / Rollout

No persisted data migration required. Storage keys and shapes remain unchanged. Rollout is a local refactor guarded by tests. If regressions appear, revert the new module and restore previous adapter-local reads.

## Non-Goals

- Supabase, Auth, remote sync, RLS, or API routes.
- `trackId`/`subjectId`, multi-track, teacher dashboard, or `/docente`.
- I-19/I-20 skill-id work or broader persistence refactors.

## Open Questions

- [ ] Should legacy migration profile writes be moved behind a new `student-profile-storage` helper now, or accepted as a write-side exception because the spec only bans direct profile-key reads?
