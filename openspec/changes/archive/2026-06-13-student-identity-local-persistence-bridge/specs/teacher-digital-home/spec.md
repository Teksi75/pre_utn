# Delta for Teacher Digital Home

## ADDED Requirements

### Requirement: Home Renders for the Active Local Student

The Home page (`Tu profesor digital`) MUST load its `PracticeProgress` from the per-student adapter and MUST render the view-model for the active local student only. The existing `deriveTeacherHomeViewModel(input: TeacherHomeInput): TeacherHomeViewModel` contract is preserved; the contract change lives in the loader that builds the `PracticeProgress` argument. When the active profile changes, the Home MUST re-derive and re-render with the new student's progress.

#### Scenario: Home shows the active student's progress

- GIVEN an active local profile with progress
- WHEN the Home page renders
- THEN `deriveTeacherHomeViewModel` is called with the active student's `PracticeProgress` only

#### Scenario: switching student changes visible progress

- GIVEN the user has two profiles with different progress
- WHEN the user activates the second profile via `Cambiar alumno`
- THEN the Home re-renders with the second profile's `readinessPercent`, `masteryGaps`, `nextActions`, `routeUnits`, `todayPlan`, and `studentSituation`

#### Scenario: empty state still shows the diagnostic CTA

- GIVEN the active profile has no attempts
- WHEN the Home page renders
- THEN `readinessPercent` is 0 AND `masteryGaps` is empty AND `todayPlan` recommends `/diagnostic` (consistent with the existing "No Invented Evidence" requirement)

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

## Pedagogical Impact

| Audience | Effect |
|----------|--------|
| Alumno | The Home becomes a personal study cockpit: it always shows "who is studying" alongside "what to study next". The alumno can switch profiles without losing the other profile's history. |
| Docente | No direct effect. The Home is the alumno's surface, not a teacher entry point. The fact that progress is now per-profile is the prerequisite for any future teacher comparison view. |
