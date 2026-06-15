# Teacher Digital Home Specification

## Purpose

Pedagogical decision dashboard replacing the Home hero/roadmap with deterministic domain data: readiness, mastery gaps, recommended next actions, and suggested actions. No AI, no chat — pure domain view-model.

## Types

| Type | Role |
|------|------|
| `StudentHomeInput` | `{ progress: PracticeProgress; diagnosticResult?: DiagnosticResult \| null; availableSkills: readonly ReadySkill[]; pilotSkills: readonly PilotSkill[]; nextStep: HomeNextStep }` |
| `StudentHomeViewModel` | Output: `readinessPercent`, `masteryGaps`, `nextActions`, `routeUnits`, `suggestedActions`, `studentSituation`, `studentMessage` |
| `StudentHomeAction` | `{ label: string; href: string; description: string }` — safe link with verified route |
| `StudentRouteUnit` | `{ unitKey: string; unitNumber: number; status: "mastered" \| "in-progress" \| "not-started"; skillCount: number }` |
| `StudentSuggestedAction` | `{ skillId: string; skillLabel: string; reason: string }` — suggested action entry |

## Requirements

### Requirement: No Legacy Home Identifiers in Implementation

The student-home module and its tests MUST NOT contain legacy teacher-home identifiers, except inside archived historical specs. The test suite MUST assert this absence for the targeted module only.

#### Scenario: targeted module is identifier-clean

- GIVEN the `src/domain/student-home/` and `src/components/home/student-home/` trees and their `__tests__/`
- WHEN scanned for the listed legacy identifiers
- THEN none of those tokens appear outside historical specs or out-of-scope notes

#### Scenario: rename leaves unrelated teacher references untouched

- GIVEN code or docs outside the student-home module that legitimately use the word "teacher" (e.g., ADR-007 notes, future `/docente` planning)
- WHEN the rename pass runs
- THEN those references are NOT modified by this change

### Requirement: Derive View-Model

The system MUST expose `deriveStudentHomeViewModel(input: StudentHomeInput): StudentHomeViewModel` as a pure function with no I/O, no randomness, no API calls. The `StudentHomeInput` type contract MUST preserve the implemented pure domain API: `{ progress: PracticeProgress; diagnosticResult?: DiagnosticResult | null; availableSkills: readonly ReadySkill[]; pilotSkills: readonly PilotSkill[]; nextStep: HomeNextStep }`.

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

### Requirement: Weak Skill Thresholds

A skill is "weak" when `accuracy < 0.7` OR `trend === "needs-review"`. The system MUST include weak skills in `masteryGaps`.

#### Scenario: Low accuracy skill appears in gaps

- GIVEN a skill with `accuracyBySkill["mat.u1.potencias_raices"] = 0.5`
- WHEN `deriveStudentHomeViewModel` is called
- THEN the skill MUST appear in `masteryGaps` with its catalog label

#### Scenario: Regressing skill appears in gaps

- GIVEN a skill with `trendBySkill["mat.u1.potencias_raices"] = "needs-review"`
- WHEN `deriveStudentHomeViewModel` is called
- THEN the skill MUST appear in `masteryGaps` regardless of accuracy

### Requirement: Mastered Definition

A skill is "mastered" when `accuracy >= 0.8` AND `uniqueAttempts >= 5` AND `trend !== "needs-review"`. This MUST match `computeMasteryLevel` from `src/domain/progress/index.ts`.

#### Scenario: Mastery criteria met

- GIVEN a skill with accuracy 0.85, 5+ unique attempts, trend "stable"
- WHEN mastery is evaluated
- THEN the skill status MUST be "mastered"

### Requirement: Decision Priority — Recovery Beats Advance

When both weak skills and unattempted skills exist, the system MUST prioritize recovery (weak skill recommendation) over advancement (new skill recommendation).
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

### Requirement: Suggested Action Variants

`suggestedActions` MUST be one of:
- Diagnostic CTA (no attempts)
- Weak skill recovery list (when gaps exist)
- Advance to next ready skill (when no gaps)
- Generic review message (all skills progressing)

#### Scenario: Diagnostic CTA when no attempts

- GIVEN empty progress
- WHEN suggested actions are computed
- THEN it MUST contain a single step recommending `/diagnostic`

### Requirement: No SkillRoadmap on Home

The Home page MUST NOT render `SkillRoadmap`. The component file stays; only the render is removed.

#### Scenario: Home page excludes SkillRoadmap

- GIVEN the Home page component
- WHEN it renders
- THEN `SkillRoadmap` MUST NOT appear in the render tree

### Requirement: UI Accessibility

Dashboard cards with visible headings MUST use `aria-labelledby` referencing heading IDs. The mission card MUST NOT add a visible brand/title heading solely to satisfy a label hook; the surrounding dashboard section MUST NOT reference a missing heading ID. Status text MUST be explicit (not color-only). Mobile layout MUST stack sections vertically without overflow.

#### Scenario: Section has aria-labelledby

- GIVEN a dashboard section with heading "Tu estado"
- WHEN the section renders
- THEN it MUST have `aria-labelledby` pointing to the heading's `id`

#### Scenario: Mission card has no dangling label reference

- GIVEN the B3 mission card intentionally has no visible title heading
- WHEN the Home dashboard renders
- THEN the surrounding section MUST NOT use `aria-labelledby` pointing to `mission-card-title`
- AND the mission card MUST NOT regain a visible brand/title heading

## Non-Goals

- Generative AI or chat features
- Backend/Supabase/API changes
- Teacher authentication or role-based routing
- Deleting `SkillRoadmap` component file

## Acceptance Criteria

- [ ] `deriveStudentHomeViewModel` passes all 11 domain test cases
- [ ] Home shows dashboard cards, NOT hero/roadmap
- [ ] No raw skill IDs in UI
- [ ] All links use verified routes
- [ ] Empty state shows diagnostic CTA
- [ ] Domain has ≥90% unit test coverage
- [ ] `pnpm run test && pnpm run typecheck && pnpm run build` pass

## Required Test Cases (11 Domain Cases)

| # | Case | Key Assertion |
|---|------|---------------|
| 1 | Missing data tolerance | No throw on empty maps |
| 2 | No invented evidence | Empty progress → zero readiness |
| 3 | Skill label priority | Catalog label, not raw ID |
| 4 | Initial no-progress | Diagnostic CTA in suggestedActions |
| 5 | Weak skill thresholds | accuracy < 0.7 OR needs-review → gap |
| 6 | Mastered definition | accuracy ≥ 0.8 + 5 attempts + not regressing |
| 7 | Decision priority | Recovery action before advance action |
| 8 | Recovery beats advance | Weak skill CTA precedes new skill CTA |
| 9 | Safe links | All hrefs from verified route constants |
| 10 | Route unit statuses | Derived from constituent skill mastery |
| 11 | Unit number extraction | `mat.u2.x` → unitNumber 2 |

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | The Home becomes a personal study cockpit: it always shows "who is studying" alongside "what to study next". The alumno can switch profiles without losing the other profile's history. |
| Docente | No direct effect. The Home is the alumno's surface, not a teacher entry point. The fact that progress is now per-profile is the prerequisite for any future teacher comparison view. |

## Added by student-identity-local-persistence-bridge

### Requirement: Home Renders for the Active Local Student

The Home page (`Tu profesor digital`) MUST load its `PracticeProgress` from the per-student adapter and MUST render the view-model for the active local student only. The existing `deriveStudentHomeViewModel(input: StudentHomeInput): StudentHomeViewModel` contract is preserved; the contract change lives in the loader that builds the `PracticeProgress` argument. When the active profile changes, the Home MUST re-derive and re-render with the new student's progress.

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
- THEN `readinessPercent` is 0 AND `masteryGaps` is empty AND `suggestedActions` recommends `/diagnostic` (consistent with the existing "No Invented Evidence" requirement)

### Requirement: Identification Card When No Active Profile

When `recoverActiveProfile()` returns `null`, the Home page MUST render the identification card from the `student-local-identity` spec in place of the `Tu profesor digital` dashboard. The card MUST appear in the same top zone and MUST show the exact copy documented in the `student-local-identity` spec. The Home MUST NOT render any partial dashboard, "empty state with a hidden gate", or auto-create a profile on the user's behalf.

#### Scenario: no active profile shows the gate

- GIVEN `recoverActiveProfile()` returns `null`
- WHEN the Home page renders
- THEN it shows the identification card and does NOT render `Tu profesor digital`

#### Scenario: the gate is dismissable to a real profile only

- GIVEN the identification card
- WHEN the user enters a name and submits
- THEN a profile is created, the active state is set, and the dashboard zone replaces the card

### Requirement: Active Student Chrome on Home

When an active profile exists, the Home page MUST display, in addition to the dashboard:

- In the `Tu profesor digital` zone: a line `Estás estudiando como {displayName}`.
- In the top bar: a chip `Alumno activo: {displayName}`.
- A secondary action `Cambiar alumno` (rendered in the dashboard zone or its adjacent chrome, not inside the top bar chip itself).

The chrome MUST use pedagogical language (`alumno`, `progreso`, `estudio`, `perfil local`) and MUST NOT use `login`, `cuenta`, `admin`, `usuario`, `email`, `contraseña`, `avatar`, or mention Supabase.

#### Scenario: active labels render correctly

- GIVEN an active profile with `displayName: "Ana"`
- WHEN the Home page renders
- THEN it shows `Estás estudiando como Ana` in the dashboard zone AND `Alumno activo: Ana` in the top bar

#### Scenario: no teacher or auth language in Home chrome

- GIVEN the active-state Home
- WHEN the rendered text is scanned
- THEN it does NOT contain `login`, `cuenta`, `admin`, `usuario`, `email`, `contraseña`, `avatar`, or `Supabase`

### Requirement: No Visible Teacher Access from Home

The Home page MUST NOT link to `/docente`, MUST NOT offer teacher login, MUST NOT show a master-password prompt, and MUST NOT use admin/account language. `Tu profesor digital` is the alumno-facing "digital teacher" dashboard — it is NOT a human-teacher entry. A future `/docente` route may exist behind a separate change; it MUST NOT be reachable from this slice.

#### Scenario: no Docente link in Home

- GIVEN the rendered Home
- WHEN the navigation and CTAs are scanned
- THEN no `/docente`, `Docente`, or `Teacher` link is present
