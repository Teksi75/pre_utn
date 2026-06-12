# Delta for teacher-digital-home

## MODIFIED Requirements

### Requirement: Derive View-Model

The system MUST expose `deriveTeacherHomeViewModel(input: TeacherHomeInput): TeacherHomeViewModel` as a pure function with no I/O, no randomness, no API calls. The `TeacherHomeInput` type contract MUST preserve the implemented pure domain API: `{ progress: PracticeProgress; diagnosticResult?: DiagnosticResult | null; availableSkills: readonly ReadySkill[]; pilotSkills: readonly PilotSkill[]; nextStep: HomeNextStep }`.
(Previously: type contract was not explicitly aligned with implementation)

#### Scenario: Happy path with progress

- GIVEN a `TeacherHomeInput` with attempts and diagnostic data
- WHEN `deriveTeacherHomeViewModel` is called
- THEN it returns a complete `TeacherHomeViewModel` with no undefined fields

#### Scenario: Missing data tolerance

- GIVEN a `TeacherHomeInput` where `progress.accuracyBySkill` is empty or missing entries
- WHEN `deriveTeacherHomeViewModel` is called
- THEN it MUST treat missing accuracy as 0 and missing trend as "stable"
- AND it MUST NOT throw or return partial data

#### Scenario: Input type contract matches implementation

- GIVEN the `TeacherHomeInput` type definition
- WHEN compared to the implemented `deriveTeacherHomeViewModel` function signature
- THEN all fields match: `progress`, `diagnosticResult`, `availableSkills`, `pilotSkills`, `nextStep`

### Requirement: Unit Number Extraction

The system MUST extract unit numbers from skill IDs using the shared unit-parsing helper (see `math-exercise-catalog` delta). Unknown patterns default to unit 1.
(Previously: used inline pattern `mat.u{N}.{skill}` instead of shared helper)

#### Scenario: Extract unit from skill ID

- GIVEN `skillId = "mat.u2.polinomios_basico"`
- WHEN unit number is extracted
- THEN `unitNumber` MUST be 2

#### Scenario: Uses shared helper

- GIVEN the unit extraction logic
- WHEN inspected
- THEN it delegates to the shared unit-parsing helper from `src/domain/shared/skill-id.ts`
