# Delta for Student Local Identity

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | No visible change; current profile-scoped progress and blocked no-profile behavior remain stable. |
| Docente | No direct change; identity evidence stays clean for future review surfaces by avoiding anonymous/global fallbacks. |

## ADDED Requirements

### Requirement: Active Profile ID Boundary

The system MUST expose one active-session boundary for reading the current local `studentId`. Existing adapters that only need the active id MUST use `getActiveProfileId()` and MUST preserve current local profile behavior.

#### Scenario: active profile id is read through one boundary

- GIVEN a valid active profile exists in local profile storage
- WHEN practice or diagnostic storage needs the active `studentId`
- THEN it obtains the id through `getActiveProfileId()`
- AND the returned id matches the current active profile id

#### Scenario: no active profile remains blocked

- GIVEN profile storage has no active profile
- WHEN an adapter requests the active `studentId`
- THEN `getActiveProfileId()` returns `null`
- AND the adapter preserves its existing blocked/no-write behavior without falling back to global or anonymous identity

#### Scenario: unsafe profile storage remains safe

- GIVEN profile storage is missing, unreadable, or contains corrupt JSON
- WHEN `getActiveProfileId()` is called
- THEN the result preserves the current safe storage behavior
- AND no exception escapes the boundary

#### Scenario: profile key parsing is contained

- GIVEN implementation is complete
- WHEN source files are scanned for `localStorage.getItem("pre-utn.profiles.v1")`
- THEN matches exist only inside the approved profile-storage or active-session boundary

## MODIFIED Requirements

### Requirement: Supabase-Ready Adapter Boundary

The profile storage adapter and the active-session boundary MUST be the ONLY modules that read the profile key `pre-utn.profiles.v1`. Progress, diagnostic, study-plan, UI, hook, and page call sites MUST NOT parse that profile storage key directly. Identity-bearing persistence MUST still go through adapter modules so future Supabase-backed adapters can replace local storage without changing domain code or call-site behavior.
(Previously: profile and progress adapters were allowed as the only modules touching `localStorage` for identity-bearing data; this narrows profile-id reads to profile storage plus the active-session boundary.)

#### Scenario: call sites do not read localStorage directly for identity

- GIVEN the `src/hooks`, `src/app`, and `src/components` tree
- WHEN scanned for `localStorage`
- THEN identity-related reads/writes go through adapter modules

#### Scenario: adapters do not parse profile storage directly

- GIVEN progress, diagnostic, and study-plan adapters
- WHEN scanned for `localStorage.getItem("pre-utn.profiles.v1")`
- THEN no direct read is present outside the approved profile-storage or active-session boundary
