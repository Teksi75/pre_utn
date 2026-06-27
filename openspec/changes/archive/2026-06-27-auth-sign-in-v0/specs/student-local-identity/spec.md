# Delta for Student Local Identity

## MODIFIED Requirements

### Requirement: Active Profile ID Boundary

The system MUST expose one active-session boundary for reading the current local `studentId`. The boundary MUST also track whether a backend-authenticated Supabase session is active; `hasRemoteSession` MUST be derived from Supabase Auth state changes and supplied to the persistence selector. Existing adapters MUST use `getActiveProfileId()` and MUST preserve current local profile behavior.

(Previously: the boundary only returned the local active student id.)

#### Scenario: active profile id is read through one boundary
- **Given** a valid active profile exists in local profile storage
- **When** practice or diagnostic storage needs the active `studentId`
- **Then** it obtains the id through `getActiveProfileId()`
- **And** the returned id matches the current active profile id

#### Scenario: no active profile remains blocked
- **Given** profile storage has no active profile
- **When** an adapter requests the active `studentId`
- **Then** `getActiveProfileId()` returns `null`
- **And** the adapter preserves its existing blocked/no-write behavior

#### Scenario: unsafe profile storage remains safe
- **Given** profile storage is missing, unreadable, or contains corrupt JSON
- **When** `getActiveProfileId()` is called
- **Then** the result preserves the current safe storage behavior
- **And** no exception escapes the boundary

#### Scenario: profile key parsing is contained
- **Given** implementation is complete
- **When** source files are scanned for `localStorage.getItem("pre-utn.profiles.v1")`
- **Then** matches exist only inside the approved profile-storage or active-session boundary

#### Scenario: signed-in user links active profile to remote account
- **Given** a signed-in user has an active local profile
- **When** the auth listener emits `SIGNED_IN`
- **Then** the active profile is upserted into `student_profiles` keyed by `(authUserId, studentId)`
- **And** the local profile remains active

#### Scenario: signed-out user keeps local profile
- **Given** a user signs out
- **When** the auth listener emits `SIGNED_OUT`
- **Then** `getActiveProfileId()` still returns the same local `studentId`
- **And** the persistence selector falls back to the local adapter

#### Scenario: remote session signal comes from auth listener
- **Given** the auth state changes
- **When** `reinitializePersistence()` reconfigures the selector
- **Then** `hasRemoteSession` is `true` on `SIGNED_IN` and `false` on `SIGNED_OUT`

### Requirement: StudentGate Routes to Sign-In

`StudentGate` SHALL NOT ask for a visible name as a prerequisite to using the app. When the user chooses to sync or create a course account, `StudentGate` SHALL route to `/cuenta/ingresar`. Name collection SHALL occur on `/cuenta/ingresar`.

(Previously: `StudentGate` collected the visible name before entering the app.)

#### Scenario: StudentGate redirects to sign-in instead of collecting name
- **Given** a new student sees `StudentGate`
- **When** they choose to start with a course account
- **Then** they are routed to `/cuenta/ingresar`
- **And** no name input is shown on `StudentGate`
