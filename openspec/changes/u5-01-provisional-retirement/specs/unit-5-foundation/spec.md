# Delta for Unit 5 Foundation

## Purpose

Retire static provisional Unit 5 repository artifacts. The provisional unit was never exposed as practicable user content, so U5-01 has no migration or persistence responsibility. Add the empty-unit availability contract the practice selector MUST honor for the post-retirement Unit 5 state. This prevents student dead ends and preserves an honest curriculum signal for teachers.

## MODIFIED Requirements

### Requirement: Static Provisional Retirement

U5-01 MUST retire only active repository references to the exact six provisional skill IDs `mat.u5.angulos`, `mat.u5.radianes`, `mat.u5.circunferencia_trigonometrica`, `mat.u5.identidades`, `mat.u5.ecuaciones_trigonometricas`, `mat.u5.complejos_forma_polar` and five placeholder exercise IDs `ex.u5.angulos.1`, `ex.u5.radianes.1`, `ex.u5.circunferencia_trigonometrica.1`, `ex.u5.identidades.1`, `ex.u5.ecuaciones_trigonometricas.1`. Matching MUST be exact string equality. U5-01 MUST NOT introduce a data migration, sidecar, marker, write gate, persistence behavior, SQL change, remote schema change, or stored-data transform. Archived U5-00 artifacts remain immutable.

#### Scenario: static retirement does not change persistence

- GIVEN the repository before and after U5-01
- WHEN persistence and SQL surfaces are inspected
- THEN no migration, sidecar, marker, write gate, blocking behavior, adapter change, or SQL artifact is added

### Requirement: U5 Scope, Zero Threshold, and Deferred Exclusions

U5-01 MUST permit Unit 5 to contain zero active provisional skills and zero placeholder exercises with threshold `0`. It MUST NOT add canonical U5 content, π encoding, a stronger external source locator, per-subitem trace keys, U3 work, U5-02 work, or `mate-explorer` changes.

#### Scenario: Unit 5 loads with zero threshold

- GIVEN the catalog after U5-01
- WHEN Unit 5 is queried
- THEN it is intentionally empty without a threshold failure

## ADDED Requirements

### Requirement: Derived Unit Availability

The practice unit selector MUST derive availability solely from active skill count (`SKILLS_BY_UNIT[unit].length > 0`) and MUST NOT use hard-coded per-unit flags. Populated units MUST remain enabled and usable. Count changes MUST apply on the next render. Per-skill readiness/map state MUST recompute every render from the live `SKILLS_BY_UNIT` contents and the `accessibleSkills` prop, so a skill newly added to a previously empty unit is rendered as usable (enabled, with the `Disponible` pill) instead of being erroneously disabled by a stale memoization.

#### Scenario: active-skill counts control usability

- GIVEN one unit with zero active skills and one with at least one
- WHEN the selector renders and the populated unit is selected
- THEN the empty unit is unavailable
- AND the populated unit exposes its non-empty skill list and permits skill selection

#### Scenario: content arrival automatically re-enables a unit

- GIVEN a unit rendered disabled because it had zero active skills
- WHEN active skills are added and the selector re-renders
- THEN the unit automatically becomes enabled and usable
- AND selecting the unit renders each newly-available skill as an
  enabled listbox option that calls `onSkillSelect` on click

### Requirement: Visible and Accessible Disabled Unit 5

A zero-skill unit MUST remain visible. In the current post-retirement state, Unit 5 MUST appear as `Unidad 5 — Próximamente`; its option MUST carry native `disabled` and `aria-disabled="true"`, muted text, and `cursor-not-allowed` treatment.

#### Scenario: Unit 5 remains visible with disabled semantics

- GIVEN Unit 5 has zero active skills
- WHEN the selector renders
- THEN a visible option reads `Unidad 5 — Próximamente`
- AND it has native and ARIA disabled semantics plus the required visual treatment

### Requirement: Programmatic Unavailable-Unit Selection Is Rejected and No Empty Skill List Is Reachable

The selector MUST reject any programmatic attempt to select a zero-skill unit. `handleUnitChange` resets `selectedUnit` to `null` before the unavailable value reaches component state; the skill-list render path is gated on `selectedUnit !== null`, which under defensive selection always implies `skillsForUnit.length > 0`. `onSkillSelect` MUST NOT be invoked. No listbox (empty or otherwise) is reachable from any user-facing flow. No render-time empty-list fallback branch is required.

#### Scenario: programmatic Unit 5 selection is rejected

- GIVEN Unit 5 has zero active skills
- WHEN a programmatic selector change requests Unit 5
- THEN no unavailable unit is selected and `onSkillSelect` is not invoked
- AND no listbox (empty or otherwise) is rendered

### Requirement: Live-Removal Invariant for Selected Units

The selector MUST derive an `effectiveSelectedUnit` on every render from the CURRENT live `SKILLS_BY_UNIT[unit].length > 0` count. If a previously-selected populated unit's live skill array is emptied between renders (HMR or test fixtures mutating the catalog), the rendered `<select>` value MUST reset to `""`, the skill-list render gate MUST collapse (no listbox rendered), the affected unit's option MUST flip to disabled with `Próximamente` / muted / `cursor-not-allowed` treatment, and `onSkillSelect` MUST NOT be invoked. A different contentful (unaffected) unit MUST remain selectable through the same catalog mutation. If the live catalog repopulates on a later render, the original selection MUST be observable again without any user action. The invariant MUST be enforced by per-render derivation; no new URL parameter, localStorage key, persistence seam, or component-state setter is introduced.

#### Scenario: empty-ing a selected populated unit removes its listbox without touching component state

- GIVEN a populated unit (U1) is selected through the change handler and its listbox is rendered with its enabled skill options
- WHEN the live `SKILLS_BY_UNIT[1]` array is emptied and the selector re-renders the same instance
- THEN no listbox is rendered
- AND the `<select>` value reflects the null state
- AND the U1 option flips to disabled + `Próximamente` + muted/cursor-not-allowed
- AND a different contentful unit (U2) can still be selected and renders its listbox through the same rendered instance

#### Scenario: repopulating the live skills restores the original selection

- GIVEN the U1 selection was lost via the live-removal invariant
- WHEN `SKILLS_BY_UNIT[1]` is repopulated and the student re-selects U1 through the change handler
- THEN the listbox returns with the freshly-added skills as enabled listbox options carrying the `Disponible` pill
- AND clicking a restored skill invokes `onSkillSelect` with the skill id
