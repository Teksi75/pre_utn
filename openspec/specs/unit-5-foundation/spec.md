# Unit 5 Foundation Specification

## Purpose

Establish the static-retirement contract for Unit 5 (trigonometry and complex numbers): the catalog is intentionally empty at this stage, no provisional skills or exercises remain in active repository surfaces, and no migration, sidecar, marker, SQL change, remote-schema change, or persistence behavior is introduced. This document is the canonical specification for the post-retirement Unit 5 state.

## Requirements

### Requirement: Empty Unit 5 Catalog State

The system MUST permit Unit 5 to contain zero active skills and zero placeholder exercises. `UNIT_5_SKILLS` MUST be the empty array. `UNIT_THRESHOLDS["unit-5"]` MUST equal `0`. The static retirement applies to exactly the six provisional skill IDs `mat.u5.angulos`, `mat.u5.radianes`, `mat.u5.circunferencia_trigonometrica`, `mat.u5.identidades`, `mat.u5.ecuaciones_trigonometricas`, `mat.u5.complejos_forma_polar` and exactly the five placeholder exercise IDs `ex.u5.angulos.1`, `ex.u5.radianes.1`, `ex.u5.circunferencia_trigonometrica.1`, `ex.u5.identidades.1`, `ex.u5.ecuaciones_trigonometricas.1`, matched by exact string equality.

#### Scenario: Unit 5 loads with zero threshold

- GIVEN the catalog after the retirement
- WHEN Unit 5 is queried
- THEN it is intentionally empty without a threshold failure

#### Scenario: six provisional skill IDs are absent from active catalog surfaces

- GIVEN the active skill catalog after the retirement
- WHEN `UNIT_5_SKILLS`, `ALL_SKILLS`, and `KNOWN_SKILL_IDS` are enumerated
- THEN none of the six IDs is present
- AND `UNIT_5_SKILLS` is the empty array

### Requirement: No Persistence or Migration Surface

The system MUST NOT introduce any local or remote persistence change as part of the retirement. There is no migration contract, no sidecar map, no per-student marker, no per-row column, no SQL artifact, no remote schema change, no write gate, no blocking behavior, no adapter change, and no stored-data transform. The retirement is a static repository operation only.

#### Scenario: static retirement does not change persistence

- GIVEN the repository before and after the retirement
- WHEN persistence and SQL surfaces are inspected
- THEN no migration, sidecar, marker, write gate, blocking behavior, adapter change, or SQL artifact is added

### Requirement: Synthetic Diagnostic Fixtures Are Retained

Synthetic diagnostic fixtures `mat.u5.trigonometria_basica`, `ex.u5.bad.1`, and `ex.u5.good.1` are NOT retirement keys. They exist only inside test code as diagnostic fixtures for `selectBalancedSet` behavior. They MUST NOT be promoted to live catalog entries.

#### Scenario: synthetic fixtures remain only in test code

- GIVEN the active catalog and the diagnostic test fixtures
- WHEN the catalog is loaded
- THEN `mat.u5.trigonometria_basica`, `ex.u5.bad.1`, and `ex.u5.good.1` are absent from the live catalog

### Requirement: Unencumbered Future Reuse

The retired ID `mat.u5.ecuaciones_trigonometricas` is unencumbered for future reuse. No alias, no compatibility layer, and no migration contract is reserved against it. Any future slice that re-introduces a skill with this ID MUST do so via a new SDD change with its own spec, design, and review budget. The retirement does not block that future work and does not constrain its naming.

#### Scenario: future slice can reuse the ID without aliasing

- GIVEN a future change that introduces a new `mat.u5.ecuaciones_trigonometricas`
- WHEN its catalog entry is loaded alongside the retired state
- THEN no alias or compatibility code from this retirement is consulted

### Requirement: Scope Boundaries Preserved

Units 1, 2, 3, 4, and 6, the active specifications that reference them, and the existing persistence, test, and content surfaces for those units MUST remain unchanged in byte-for-byte semantic terms except where the retirement removes a Unit 5 reference. Unit 3, the active complex-numbers spec, the unit-5-foundation archive, and any U5-02 work are out of scope.

#### Scenario: non-U5 units are preserved

- GIVEN the repository after the retirement
- WHEN U1, U2, U3, U4, and U6 surfaces are inspected
- THEN their content, dependencies, error taxonomy, and tests match the pre-retirement state

### Requirement: Derived Unit Availability in Practice Selector

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
