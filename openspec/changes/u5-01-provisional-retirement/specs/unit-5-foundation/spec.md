# Delta for Unit 5 Foundation

## Purpose

Retire static provisional Unit 5 repository artifacts. The provisional unit was never exposed as practicable user content, so U5-01 has no migration or persistence responsibility. Add the empty-unit availability contract the practice selector MUST honor for the post-retirement Unit 5 state.

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

The practice unit selector MUST derive each unit's availability from `SKILLS_BY_UNIT[unit].length > 0`. Hard-coded per-unit unavailability flags (including a U5-specific exception) MUST NOT be used; the value MUST update on the next render after `SKILLS_BY_UNIT` changes.

#### Scenario: availability follows active-skill count

- GIVEN any unit with `SKILLS_BY_UNIT[unit].length === 0` (currently Unit 5 after U5-01) or `>= 1`
- WHEN the selector renders
- THEN zero-skill units are unavailable and others are selectable

### Requirement: Visible Disabled Unit 5 with Próximamente

An unavailable unit (currently Unit 5) MUST remain visible in the selector as `Unidad 5` (or `Unidad 5 — Próximamente`). Selecting it — by mouse, keyboard, form submit, or assistive activation — MUST NOT invoke `onSkillSelect` and MUST NOT render a zero-skill list. The listbox availability pill for any zero-skill list render path MUST read exactly `Próximamente`.

#### Scenario: Unit 5 stays visible and rejects selection

- GIVEN the post-retirement `SKILLS_BY_UNIT` table
- WHEN the selector renders and processes an empty-unit selection
- THEN `Unidad 5` is rendered as a visible option
- AND `onSkillSelect` is not invoked and no zero-skill list is rendered

### Requirement: Disabled Option Accessibility Semantics

Each unavailable unit option MUST carry native `disabled` AND `aria-disabled="true"`. The visual treatment MUST include a muted text style and `cursor-not-allowed`.

#### Scenario: native and ARIA disabled semantics with Próximamente label

- GIVEN an empty unit
- WHEN rendered as an `<option>` and pill in the listbox path
- THEN the option carries `disabled` and `aria-disabled="true"`
- AND any availability pill in the same path reads exactly `Próximamente`

### Requirement: Stale or Direct Unavailable-Unit Selection Fallback

When a persisted, in-memory, or direct unit selection reaches an unavailable unit, the practice flow MUST return to the selector phase and display exactly `Unidad 5 todavía no está disponible. Estamos preparando sus contenidos.` The fallback MUST NOT transition to theory or example, MUST NOT render a zero-skill list, and MUST NOT introduce or change any persistence, URL format, localStorage schema, SQL, sidecar, marker, write gate, adapter, remote schema, or stored-data transform.

#### Scenario: direct or stale selection returns to selector with exact banner

- GIVEN an unavailable unit reached via direct selection, in-memory state, or any persisted surface
- WHEN the practice flow evaluates the request
- THEN the selector phase is rendered
- AND the banner reads exactly `Unidad 5 todavía no está disponible. Estamos preparando sus contenidos.`

#### Scenario: fallback adds no persistence or URL contract

- GIVEN the fallback path is active
- WHEN persistence, URL, and localStorage are inspected
- THEN no new key, parameter, route, or schema is introduced or mutated

### Requirement: Automatic Re-enable on Content Arrival

The selector MUST re-enable a previously-empty unit on the next render after active skills are added to `SKILLS_BY_UNIT`. No flag mutation, persistence change, new component, or routing change is required.

#### Scenario: re-enable happens on next render

- GIVEN the selector previously rendered an empty unit as disabled
- WHEN active skills are added and the selector re-renders
- THEN the unit becomes selectable without code or contract change
