# Delta for Student Local Identity

## ADDED Requirements

### Requirement: Shared Persistence Adapter Contract

Identity-bearing profile and progress persistence MUST be accessible through a shared adapter contract so local storage and Supabase-backed persistence provide equivalent behavior to callers. Existing public storage operations SHOULD remain stable unless a blocked or recoverable result is already part of the persistence boundary.

#### Scenario: local adapter satisfies the shared contract

- GIVEN Supabase is not selected
- WHEN profile or progress persistence is invoked
- THEN the local adapter provides the same caller-visible behavior as before

#### Scenario: callers remain adapter-agnostic

- GIVEN a caller saves or loads student progress
- WHEN the selected adapter changes between local and Supabase
- THEN the caller does not need Supabase-specific branching

### Requirement: Adapter Selection and Local Fallback

The system MUST select Supabase persistence only when the required public Supabase configuration is present and usable. If configuration is missing, incomplete, or remote availability fails, the system MUST keep existing local persistence working instead of blocking the student.

#### Scenario: missing env uses local fallback

- GIVEN Supabase public URL or anon key is missing
- WHEN persistence is selected
- THEN the local adapter is used and profiles/progress still work

#### Scenario: failed remote operation falls back gracefully

- GIVEN Supabase was selected but a remote operation fails
- WHEN the active student continues practice or diagnostic work
- THEN the workflow remains usable through local fallback or an explicit recoverable result

### Requirement: Active Profile Identity Boundary for Persistence

Adapter-level persistence MUST use `getActiveProfileId()` as the active identity boundary. It MUST NOT introduce direct profile-key parsing outside approved boundaries, anonymous writes, service-role identity, authentication requirements, or deep `trackId`/`subjectId` migration in this slice.

#### Scenario: persistence uses active profile id

- GIVEN an active profile exists
- WHEN any adapter reads or writes student-scoped data
- THEN the active `studentId` comes from `getActiveProfileId()`

#### Scenario: no active profile remains blocked

- GIVEN no active profile exists
- WHEN persistence attempts to write learning evidence
- THEN no anonymous remote or local write is created

#### Scenario: I-24 does not expand identity scope

- GIVEN the I-24 change is complete
- WHEN identity and persistence code are inspected
- THEN there is no auth requirement, teacher identity, multi-track identity, or deep track/subject migration
