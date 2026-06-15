# Delta for teacher-digital-home

Mechanical rename of legacy `Teacher*` / `TeacherDigital*` Home implementation identifiers to student/mission-facing names. No behavior, copy, route, persisted-data, or public UX change. Dead-code cleanup is explicitly deferred. The pre-existing dangling `aria-labelledby` reference on the dashboard wrapper was removed because B3 intentionally leaves `MissionCard` without a visible title heading.

## ADDED Requirements

### Requirement: No Legacy Home Identifiers in Implementation

The student-home module and its tests MUST NOT contain the legacy Home identifiers `TeacherHomeInput`, `TeacherHomeViewModel`, `TeacherHomeAction`, `TeacherRouteUnit`, `TeacherPlanStep`, `deriveTeacherHomeViewModel`, `buildTeacherMessage`, `teacherMessage`, `TeacherDigitalHero`, `tdh-hero-title`, `tmr-route-title`, or `tdb-decisions-title`, except inside historical specs or explicit out-of-scope notes. The test suite MUST assert this absence for the targeted module only.

#### Scenario: targeted module is identifier-clean

- GIVEN the `src/domain/student-home/` and `src/components/home/student-home/` trees and their `__tests__/`
- WHEN scanned for the listed legacy identifiers
- THEN none of those tokens appear outside historical specs or out-of-scope notes

#### Scenario: rename leaves unrelated teacher references untouched

- GIVEN code or docs outside the student-home module that legitimately use the word "teacher" (e.g., ADR-007 notes, future `/docente` planning)
- WHEN the rename pass runs
- THEN those references are NOT modified by this change

## MODIFIED Requirements

### Requirement: Derive View-Model

The system MUST expose `deriveStudentHomeViewModel(input: StudentHomeInput): StudentHomeViewModel` as a pure function with no I/O, no randomness, no API calls. The `StudentHomeInput` type contract MUST preserve the implemented pure domain API: `{ progress: PracticeProgress; diagnosticResult?: DiagnosticResult | null; availableSkills: readonly ReadySkill[]; pilotSkills: readonly PilotSkill[]; nextStep: HomeNextStep }`.
(Previously: `deriveTeacherHomeViewModel` / `TeacherHomeInput` / `TeacherHomeViewModel`.)

#### Scenario: Happy path with progress

- GIVEN a `StudentHomeInput` with attempts and diagnostic data
- WHEN `deriveStudentHomeViewModel` is called
- THEN it returns a complete `StudentHomeViewModel` with no undefined fields

#### Scenario: Missing data tolerance

- GIVEN a `StudentHomeInput` where `progress.accuracyBySkill` is empty or missing entries
- WHEN `deriveStudentHomeViewModel` is called
- THEN it MUST treat missing accuracy as 0 and missing trend as "stable"
- AND it MUST NOT throw or return partial data

#### Scenario: Input type contract matches implementation

- GIVEN the `StudentHomeInput` type definition
- WHEN compared to the implemented `deriveStudentHomeViewModel` function signature
- THEN all fields match: `progress`, `diagnosticResult`, `availableSkills`, `pilotSkills`, `nextStep`

### Requirement: No Invented Evidence

The system MUST NOT fabricate progress data. If `PracticeProgress.attempts` is empty, the view-model MUST reflect zero readiness, no mastery gaps, and a diagnostic CTA.
(Previously: scenarios used `TeacherHomeInput` / `TeacherHomeViewModel`.)

#### Scenario: Empty progress produces deterministic defaults

- GIVEN a `StudentHomeInput` with `progress.attempts = []`
- WHEN `deriveStudentHomeViewModel` is called
- THEN `readinessPercent` MUST be 0
- AND `masteryGaps` MUST be empty
- AND `suggestedActions` MUST recommend diagnostic

### Requirement: Skill Label Source Priority

The system MUST resolve display labels from `PilotSkill.label` (PILOT_SKILLS catalog). It MUST NOT expose raw skill IDs (e.g., `mat.u1.conjuntos_numericos`) in any `StudentHomeViewModel` field.
(Previously: `TeacherHomeViewModel`.)

#### Scenario: Labels from catalog

- GIVEN a skill with `skillId: "mat.u1.conjuntos_numericos"` and `label: "Conjuntos numéricos"`
- WHEN the view-model references this skill
- THEN it MUST use "Conjuntos numéricos" as display text

### Requirement: Decision Priority — Recovery Beats Advance

When both weak skills and unattempted skills exist, the system MUST prioritize recovery over advancement.
(Previously: scenario used `TeacherHomeInput`.)

#### Scenario: Weak skill wins over new skill

- GIVEN a `StudentHomeInput` with a weak skill with low accuracy AND an unattempted next skill
- WHEN `deriveStudentHomeViewModel` computes `nextActions`
- THEN the first action MUST target the weak skill, not the new skill

### Requirement: Safe Links

All `StudentHomeAction.href` values MUST come from verified constants (`/diagnostic`, `/practice?skill={id}`, `/learn/matematica`). The system MUST NOT produce hrefs with unverified paths.
(Previously: `TeacherHomeAction.href`.)

#### Scenario: Practice link uses safe skill param

- GIVEN a recommended skill `mat.u1.conjuntos_numericos`
- WHEN an action href is generated
- THEN href MUST be `/practice?skill=mat.u1.conjuntos_numericos` (verified route)

### Requirement: Route Unit Statuses

`StudentRouteUnit.status` MUST be derived from constituent skill mastery:
- "mastered": ALL skills in unit are mastered
- "in-progress": ANY skill has attempts but unit is not mastered
- "not-started": NO skills in unit have attempts
(Previously: `TeacherRouteUnit.status`.)

#### Scenario: Mixed-unit status derivation

- GIVEN unit-1 with 3 mastered skills, 2 learning skills, 1 not-started
- WHEN route units are computed
- THEN unit-1 status MUST be "in-progress"

### Requirement: Home Renders for the Active Local Student

The Home page (`Tu profesor digital`) MUST load its `PracticeProgress` from the per-student adapter and MUST render the view-model for the active local student only. The existing `deriveStudentHomeViewModel(input: StudentHomeInput): StudentHomeViewModel` contract is preserved; the contract change lives in the loader that builds the `PracticeProgress` argument. When the active profile changes, the Home MUST re-derive and re-render with the new student's progress.
(Previously: `deriveTeacherHomeViewModel` / `TeacherHomeInput` / `TeacherHomeViewModel`. Section copy `Tu profesor digital` is OUT OF SCOPE for this rename.)

#### Scenario: Home shows the active student's progress

- GIVEN an active local profile with progress
- WHEN the Home page renders
- THEN `deriveStudentHomeViewModel` is called with the active student's `PracticeProgress` only

#### Scenario: switching student changes visible progress

- GIVEN the user has two profiles with different progress
- WHEN the user activates the second profile via `Cambiar alumno`
- THEN the Home re-renders with the second profile's `readinessPercent`, `masteryGaps`, `nextActions`, `routeUnits`, `suggestedActions`, and `studentSituation`

#### Scenario: empty state still shows the diagnostic CTA

- GIVEN the active profile has no attempts
- WHEN the Home page renders
- THEN `readinessPercent` is 0 AND `masteryGaps` is empty AND `suggestedActions` recommends `/diagnostic`
