# Delta for Student Account Sync

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | Post-link navigation must keep the student able to continue diagnosing or practicing without losing local progress. |
| Docente | Future evidence remains ordered: a profile exists before remote learning snapshots are accepted. |

## MODIFIED Requirements

### Requirement: REQ-AUTH-3 — Post-auth link/import orchestration

`AuthBootstrap` MUST treat `INITIAL_SESSION` and `SIGNED_IN` as equivalent post-callback sync triggers. The link/import handler MUST be idempotent for the same authenticated session and MUST call persistence reinitialization only after sync readiness resolves. On `SIGNED_OUT`, persistence MUST reinitialize to local fallback.
(Previously: only `SIGNED_IN` triggered profile linking before persistence reinitialization.)

#### Scenario: INITIAL_SESSION links after callback

- GIVEN a magic-link callback creates an auth session
- WHEN the app mounts and receives `INITIAL_SESSION`
- THEN profile link/import runs as it would for `SIGNED_IN`
- AND persistence is reinitialized after readiness is confirmed

#### Scenario: duplicate auth events do not duplicate import

- GIVEN `INITIAL_SESSION` already started sync for a session
- WHEN `SIGNED_IN` fires for the same session
- THEN the handler MUST NOT import or upsert progress twice
- AND the final state remains usable

### Requirement: REQ-NEW-2c — Ordered non-destructive local import

Remote empty + local progress MUST import local profile and learning evidence non-destructively. The system MUST upsert `student_profiles` before any `student_progress_snapshots` save/import. Local storage MUST remain intact even when remote is empty, missing, or not prepared.
(Previously: local import was required, but profile-before-snapshot ordering and remote-empty fallback were not explicit.)

#### Scenario: profile precedes snapshot

- GIVEN local progress exists and the remote profile row is missing
- WHEN post-auth import runs
- THEN `student_profiles` is ready before any progress snapshot is saved

#### Scenario: remote not ready preserves local

- GIVEN an auth session, empty remote state, and local progress
- WHEN sync readiness cannot confirm import completion
- THEN the app keeps reading local progress
- AND localStorage is not deleted or cleared

## ADDED Requirements

### Requirement: Sync-complete UI requires readiness

Navigation MUST NOT say or imply completed sync merely because an Auth session exists. A sync-complete state requires profile/import readiness confirmation; pending/in-progress wording MAY be shown.

#### Scenario: session alone is not synchronized

- GIVEN Supabase Auth has a session but import readiness is pending
- WHEN the Nav or header renders
- THEN it does not show sync-complete copy
- AND it may show an in-progress or pending state

### Requirement: Account-sync scope boundaries

This change MUST NOT require production, Vercel, or Supabase Dashboard changes. It MUST NOT add or reintroduce `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The `Diagnóstico` menu clipping issue is out of scope unless caused by this change.

#### Scenario: source and scope stay bounded

- GIVEN the change is reviewed
- WHEN config, env examples, and UI changes are inspected
- THEN no anon-key fallback or production-dashboard dependency is introduced
- AND unrelated menu clipping is not bundled
