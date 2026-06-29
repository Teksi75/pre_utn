# Delta for Student Local Identity

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | The active local profile remains the safe learning boundary while account linking is incomplete. |
| Docente | Local evidence is preserved for future interpretation instead of being erased by premature remote selection. |

## MODIFIED Requirements

### Requirement: Active Profile Identity Boundary

The system MUST expose one active-session boundary for reading the current local `studentId` and remote-session/readiness state. `hasRemoteSession` alone MUST NOT make remote progress authoritative. Existing adapters MUST use `getActiveProfileId()` and MUST preserve current local profile behavior during post-auth linking.
(Previously: the boundary tracked remote session state but not sync readiness.)

#### Scenario: active profile id is read through one boundary

- GIVEN a valid active profile exists in local profile storage
- WHEN practice or diagnostic storage needs the active `studentId`
- THEN it obtains the id through `getActiveProfileId()`
- AND the returned id matches the current active profile id

#### Scenario: signed-in user links active profile to remote account

- GIVEN a signed-in user has an active local profile
- WHEN the auth listener emits `INITIAL_SESSION` or `SIGNED_IN`
- THEN the active profile is linked/imported without deleting local storage
- AND local profile remains active until remote readiness is confirmed

#### Scenario: remote session is not enough for remote authority

- GIVEN auth is signed in but profile/import readiness is pending
- WHEN persistence selection asks for the active identity state
- THEN local progress remains readable as fallback

### Requirement: Active Profile Gates Practice, Home, and Diagnostic

The Practice, Home, and Diagnostic pages MUST read the active `studentId` and render an actionable state for the active profile. After auth callback, Home MUST NOT finish as a skeleton or blank state; it MUST render either confirmed remote state or fallback local state.
(Previously: pages were gated by active profile but post-callback skeleton fallback was not specified.)

#### Scenario: Home resolves to actionable fallback

- GIVEN callback sync fails or remains pending
- WHEN Home finishes loading
- THEN it renders an actionable local or recoverable state
- AND it does not remain blank or skeleton-only

#### Scenario: Diagnostic and Practice stay accessible

- GIVEN a new student or linked local-progress student has an active profile
- WHEN they navigate to Diagnostic or Practice
- THEN the page allows the existing student action path

## ADDED Requirements

### Requirement: Local identity tests protect non-deletion

Tests MUST be written characterization-first for local profile/session boundaries and MUST assert that post-auth sync never deletes local profile or progress data.

#### Scenario: local evidence remains after callback

- GIVEN local profile and progress exist before auth callback
- WHEN sync is pending, fails, or sees remote empty
- THEN tests prove local profile and progress still exist
