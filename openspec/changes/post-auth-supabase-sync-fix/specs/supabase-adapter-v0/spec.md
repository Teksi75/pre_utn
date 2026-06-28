# Delta for Supabase Adapter v0

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | Remote activation cannot hide valid local learning history or block practice. |
| Docente | Future evidence is safer because empty remote data is not treated as confirmed learning state. |

## MODIFIED Requirements

### Requirement: Remote Student Persistence

When Supabase is configured, the system MUST persist student profiles and progress remotely through row-level student isolation. Remote reads and writes MUST be scoped to the active student identity and MUST NOT expose another student's data. An empty or missing remote snapshot MUST be treated as recoverable, not as canonical deletion, when local progress exists.
(Previously: remote persistence scoped data but did not define remote-empty fallback semantics.)

#### Scenario: configured Supabase stores profile and progress

- GIVEN Supabase is configured and an active student exists
- WHEN profile or progress data is saved
- THEN the data is persisted remotely for that student

#### Scenario: active student isolation is enforced

- GIVEN students A and B both have remote progress
- WHEN student A is active and progress is loaded
- THEN only student A's remote progress is returned

#### Scenario: remote empty falls back to local progress

- GIVEN an auth session, no prepared remote snapshot, and local progress
- WHEN progress is loaded
- THEN local progress remains the returned learning state
- AND no local storage is deleted

### Requirement: Graceful Remote Failure

Remote persistence MUST fail closed for cross-student access and fail gracefully for availability or readiness errors. If remote read/write fails or readiness is incomplete, the app MUST keep Diagnostic and Practice usable through local fallback or an explicit non-destructive state.
(Previously: availability fallback was required, but post-auth remote-readiness gaps were not explicit.)

#### Scenario: failed remote read does not block practice

- GIVEN Supabase is configured but unavailable
- WHEN the active student opens Practice
- THEN the app remains usable via local fallback or recoverable state

#### Scenario: unauthorized cross-student read is blocked

- GIVEN a request attempts to read another student's remote data
- WHEN Supabase evaluates the request
- THEN the data is not returned

#### Scenario: new and linked students can access flows

- GIVEN a new student or linked local-progress student has an active profile
- WHEN they open Diagnostic or Practice after callback
- THEN the flow renders an actionable state

## ADDED Requirements

### Requirement: Adapter tests preserve invariants

Characterization-first tests MUST prove that `EMPTY_PROGRESS` from remote is not destructive and that profile readiness precedes progress snapshot persistence.

#### Scenario: invariant trace exists

- GIVEN adapter tests are reviewed
- WHEN post-auth remote-empty and ordered-save cases are inspected
- THEN each test maps to a named invariant in this delta
