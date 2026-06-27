# Supabase Adapter v0 Specification

## Purpose

Define optional Supabase-backed persistence for student profiles and progress while preserving local operation when remote persistence is unavailable.

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | Progress can persist remotely when configured, without blocking practice when Supabase is absent or failing. |
| Docente | Future evidence remains student-isolated, but this slice MUST NOT add a teacher panel or teacher workflow. |

## Requirements

### Requirement: Public Supabase Client Safety

The system MUST create browser Supabase access using only public configuration. It MUST NOT expose, require, document, or bundle a service role key in client code or public environment examples.

#### Scenario: configured client uses public credentials

- GIVEN public Supabase URL and anon key are configured
- WHEN the app initializes remote persistence
- THEN Supabase access is available through public credentials only

#### Scenario: service role key is absent from client surface

- GIVEN implementation and env examples are scanned
- WHEN client-facing Supabase configuration is inspected
- THEN no service role key is required, referenced, or exposed

### Requirement: Remote Student Persistence

When Supabase is configured, the system MUST persist student profiles and progress remotely through row-level student isolation. Remote reads and writes MUST be scoped to the active student identity and MUST NOT expose another student's profile, practice, diagnostic, study-plan, or challenge progress.

#### Scenario: configured Supabase stores profile and progress

- GIVEN Supabase is configured and an active student exists
- WHEN profile or progress data is saved
- THEN the data is persisted remotely for that student

#### Scenario: active student isolation is enforced

- GIVEN students A and B both have remote progress
- WHEN student A is active and progress is loaded
- THEN only student A's remote progress is returned

### Requirement: Graceful Remote Failure

Remote persistence MUST fail closed for cross-student access and fail gracefully for availability errors. If a remote read or write fails because Supabase is unreachable or rejects a non-security operation, the app MUST keep the student workflow usable through local fallback or an explicit non-destructive result.

#### Scenario: failed remote read does not block practice

- GIVEN Supabase is configured but unavailable
- WHEN the active student opens a practice flow
- THEN the app remains usable via local fallback or an explicit recoverable state

#### Scenario: unauthorized cross-student read is blocked

- GIVEN a request attempts to read another student's remote data
- WHEN Supabase evaluates the request
- THEN the data is not returned

### Requirement: I-24 Scope Boundaries

This slice MUST stay adapter-level persistence only. It MUST NOT add authentication, `/docente`, multi-track support, deep `trackId`/`subjectId` migration, I-19/I-20 behavior, content changes, evaluators, or UI beyond the minimum needed to keep existing flows working.

#### Scenario: no teacher or track expansion ships

- GIVEN the I-24 change is complete
- WHEN routes, copy, and persistence models are inspected
- THEN no teacher panel, multi-track behavior, or deep track/subject migration is introduced
