# Unit 5 Foundation Specification

## Purpose

Establish the post-retirement contract for Unit 5. The catalog is intentionally empty until later work adds live skills; no provisional skills or exercises remain in active repository surfaces, and no persistence behavior is introduced.

## Requirements

### Requirement: Empty Unit 5 Catalog State

The system MUST permit Unit 5 to contain zero active skills and zero placeholder exercises. `UNIT_5_SKILLS` MUST be the empty array. `UNIT_THRESHOLDS["unit-5"]` MUST equal `0`. The static retirement applies by exact string equality to `mat.u5.angulos`, `mat.u5.radianes`, `mat.u5.circunferencia_trigonometrica`, `mat.u5.identidades`, `mat.u5.ecuaciones_trigonometricas`, `mat.u5.complejos_forma_polar`, `ex.u5.angulos.1`, `ex.u5.radianes.1`, `ex.u5.circunferencia_trigonometrica.1`, `ex.u5.identidades.1`, and `ex.u5.ecuaciones_trigonometricas.1`.

#### Scenario: Unit 5 loads with zero threshold

- GIVEN the catalog after retirement
- WHEN Unit 5 is queried
- THEN it is intentionally empty without a threshold failure

### Requirement: Unit Availability Is Derived From Live Skills

The practice selector MUST derive a unit's availability from its current live skill count. A zero-skill unit MUST remain visible as a native disabled option labelled `Unidad N — Próximamente`, with `aria-disabled="true"` and muted unavailable styling. A populated unit MUST be selectable.

The selector MUST defensively clear an unavailable value received by its change handler. It MUST derive its rendered selection from the current catalog so that a selected unit which becomes empty renders no skill listbox, and becomes usable again after live skills return. This behavior MUST NOT add a unit URL, stored unit selection, persistence behavior, or banner contract.

#### Scenario: Unit 5 is visibly unavailable while empty

- GIVEN `UNIT_5_SKILLS` has zero entries
- WHEN the practice selector renders
- THEN Unit 5 is visible as `Unidad 5 — Próximamente`
- AND its option is disabled and `aria-disabled="true"`
- AND no Unit 5 skill listbox is rendered

#### Scenario: live catalog changes preserve a non-empty listbox invariant

- GIVEN a populated unit is selected
- WHEN its live skill list becomes empty and the selector rerenders
- THEN the selector renders no selected unit and no skill listbox
- WHEN live skills return and the selector rerenders
- THEN that unit is enabled and selectable again

### Requirement: No Persistence or Migration Surface

The system MUST NOT introduce a migration, sidecar, marker, SQL artifact, remote schema change, write gate, blocking behavior, adapter change, or stored-data transform for this retirement.

### Requirement: Synthetic Diagnostic Fixtures Are Retained

Synthetic diagnostic fixtures `mat.u5.trigonometria_basica`, `ex.u5.bad.1`, and `ex.u5.good.1` remain test-only and MUST NOT be promoted to live catalog entries.

### Requirement: Scope Boundaries Preserved

U3, U4, U5-02, archived U5-00, canonical U5 content, SQL, and persistence are outside this change.
