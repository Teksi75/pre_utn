# Spec Delta: fix-profile-isolation-on-switch

**Issue**: #56  
**Modifies**: `openspec/specs/student-local-identity/spec.md`

## Why

`extractActiveProgress()` reads `map.activeStudentId` from `pre-utn.practice.v1` instead of `getActiveProfileId()`. `setActiveStudentId()` only updates `pre-utn.profiles.v1`, so the practice pointer freezes to the last student who wrote progress, violating the existing "Per-Student Progress Adapter" requirement. After a switch, reads return the previous student's slice and `addAttempt` corrupts the new student's slot.

## Pedagogical Impact

| Audience | Effect |
|---|---|
| Alumno | Profile switches no longer leak another student's progress. |
| Docente | Identity evidence stays isolated per local profile. |

## MODIFIED Requirements

### Requirement: Per-Student Progress Adapter

**ID**: REQ-ISOL-1, REQ-ISOL-3  
**Strengthens**: Per-Student Progress Adapter

Adapters MUST resolve the active student via `getActiveProfileId()` on every read and write and MUST NOT use `map.activeStudentId` from any progress key. `addAttempt` MUST write to the active student's slice only.

(Previously: adapters used the central map shape but did not explicitly forbid `map.activeStudentId` reads.)

#### Scenario: stale practice pointer returns active student's slice

- GIVEN `profiles.v1.activeStudentId = "B"` and `practice.v1.activeStudentId = "A"` with attempts under A only
- WHEN `loadProgress()` is called
- THEN it returns B's progress, not A's

#### Scenario: null practice pointer returns active student's slice

- GIVEN `profiles.v1.activeStudentId = "B"` and `practice.v1.activeStudentId = null`
- WHEN `loadProgress()` is called
- THEN it returns B's progress from `students.B`

#### Scenario: unknown practice pointer returns active student's slice

- GIVEN `profiles.v1.activeStudentId = "B"` and `practice.v1.activeStudentId = "ghost"`
- WHEN `loadProgress()` is called
- THEN it returns B's progress, not `EMPTY_PROGRESS`

#### Scenario: addAttempt after switch does not corrupt new slot

- GIVEN active profile is B, `practice.v1.activeStudentId = "A"`, A has `[a1]`, B has `[]`
- WHEN `addAttempt(b1)` is called
- THEN B's attempts equal `[b1]` and A's slot stays `[a1]`

#### Scenario: existing matching-pointer behavior preserved

- GIVEN a stored map with two students and matching pointers
- WHEN `loadProgress` is called for student A
- THEN it returns A's `PracticeProgress`

#### Scenario: existing single-student addAttempt preserved

- GIVEN a stored map with one student
- WHEN `addAttempt` is called
- THEN the attempt is appended to that student's `attempts`

## ADDED Requirements

### Requirement: Corrupted Active-Slot Repair

**ID**: REQ-ISOL-2  
**Strengthens**: Per-Student Progress Adapter

When `loadProgress()` detects `practice.v1.activeStudentId` exists and differs from `getActiveProfileId()`, the active student's slot MUST be dropped and re-seeded from `EMPTY_PROGRESS`. Other students' slots MUST remain untouched.

#### Scenario: corrupted active slot is dropped

- GIVEN `profiles.v1.activeStudentId = "B"`, `practice.v1.activeStudentId = "A"`, and B's slot has a hybrid blob
- WHEN `loadProgress()` is called
- THEN it returns `EMPTY_PROGRESS` for B and leaves A's slot intact

### Requirement: Selector-Wired Local Fallback Isolation

**ID**: REQ-ISOL-4  
**Strengthens**: Active Profile ID Boundary

The selector-wired local fallback adapter MUST resolve the active student via `getActiveProfileId()` and apply the same corrupted-slot repair.

#### Scenario: fallback returns active student's slice

- GIVEN selector chose local adapter and `practice.v1.activeStudentId = "A"` while active profile is B
- WHEN fallback `loadProgress()` is called
- THEN it returns B's progress, not A's

### Requirement: Post-Switch View Isolation

**ID**: REQ-ISOL-5  
**Strengthens**: Active Profile Gates Practice, Home, and Diagnostic

After a switch, `/practice`, `/diagnostic`, and the home next-step view MUST show the new student's slice (or empty state). `usePracticeFlow` MUST subscribe to active-student changes.

#### Scenario: home shows new student's empty state

- GIVEN A has a diagnostic result and B has none
- WHEN active profile switches to B and home re-renders
- THEN it shows B's empty-state prompt, not A's result

#### Scenario: practice flow re-loads on student change

- GIVEN `usePracticeFlow` is mounted with A active
- WHEN active student changes to B without unmount
- THEN the progress-loading effect re-runs and `progress` becomes B's slice
- (Assert via `renderHook(usePracticeFlow)` + act.)

#### Scenario: diagnostic resets in-progress state on switch

- GIVEN the diagnostic page state has attempts `[a1]` for A
- WHEN active student changes to B
- THEN `attempts`, `estimates`, and `suggestions` become `[]`

### Requirement: Reload Identity Resolution

**ID**: REQ-ISOL-6  
**Strengthens**: Active Profile ID Boundary

After a switch and full page reload, the active student MUST be resolved from `getActiveProfileId()`, not from any persisted `activeStudentId` shortcut.

#### Scenario: reload after switch is correct

- GIVEN A was active, then switched to B, and `practice.v1.activeStudentId` still equals "A"
- WHEN the page reloads and `loadProgress()` is called
- THEN it returns B's progress, not A's

## REMOVED Requirements

### Requirement: StudyPlanSection Component

**ID**: REQ-ISOL-7

`src/components/study-plan/StudyPlanSection.tsx` and its dedicated test MUST be removed.

#### Scenario: dead component and its test are absent

- GIVEN the codebase after the change
- WHEN `StudyPlanSection.tsx` and its test are searched
- THEN neither file exists and no other test imports `StudyPlanSection`

(Reason: dead code with the same mount-only bug pattern.)
(Migration: delete both files; future study-plan delivery needs its own SDD.)

## FUTURE-PR-NOTE

### Requirement: activeStudentId Mirror Field

**ID**: REQ-ISOL-8

The `practice.v1.activeStudentId` field MAY remain as a write-side mirror. Removing it from the central map shape requires its own delta spec.
