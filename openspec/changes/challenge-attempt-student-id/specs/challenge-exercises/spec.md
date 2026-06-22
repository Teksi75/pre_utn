# Delta for challenge-exercises

## ADDED Requirements

### Requirement: Student-Scoped Challenge Attempts

Challenge attempt persistence MUST associate every new `ChallengeAttempt` with the active student profile. Challenge readiness and progress MUST read only the active student's challenge attempts. Legacy anonymous challenge attempts MUST remain loadable through a safe compatibility path, but MUST NOT be aggregated into another student's readiness. The existing challenge-exercises storage contract MUST remain compatible for consumers that read challenge progress. Pedagogical impact: each alumno sees their own advanced readiness, so the teacher can trust challenge progress as profile-specific evidence instead of mixed device history.

#### Scenario: new challenge attempt belongs to active student

- GIVEN an active student profile with `studentId: "student-a"`
- WHEN the alumno submits a challenge answer
- THEN the persisted `ChallengeAttempt` includes `studentId: "student-a"`
- AND challenge progress for that student includes the attempt

#### Scenario: no active student blocks challenge write

- GIVEN no active student profile exists
- WHEN a challenge answer is submitted
- THEN no new `ChallengeAttempt` is persisted
- AND the caller receives an explicit blocked result compatible with the StudentGate flow

#### Scenario: legacy anonymous attempts remain loadable safely

- GIVEN stored challenge progress contains attempts without `studentId`
- WHEN challenge progress is loaded for the active profile
- THEN the legacy attempts remain parseable without data loss
- AND the load does not throw because `studentId` is missing

#### Scenario: readiness does not leak across students

- GIVEN student A and student B have challenge attempts for the same skill
- WHEN advanced readiness is computed while student A is active
- THEN only student A's attempts contribute to the readiness score
- AND student B's attempts are ignored

#### Scenario: storage contract remains compatible

- GIVEN existing challenge-exercises consumers load advanced practice progress
- WHEN student-scoped challenge attempts are present
- THEN they can still read challenge progress for the active student
- AND base practice progress remains unchanged
