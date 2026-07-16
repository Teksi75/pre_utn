# Unit 5 Foundation Specification

## Purpose

Define Unit 5's retirement and selector contract: students avoid dead ends; teachers see honest availability.

## Requirements

### Requirement: Empty Unit 5 Catalog State

The system MUST permit zero active Unit 5 skills and zero placeholder exercises. `UNIT_5_SKILLS` MUST equal `[]`; `UNIT_THRESHOLDS["unit-5"]` MUST equal `0`. Retirement MUST match by exact equality only skills `mat.u5.angulos`, `mat.u5.radianes`, `mat.u5.circunferencia_trigonometrica`, `mat.u5.identidades`, `mat.u5.ecuaciones_trigonometricas`, `mat.u5.complejos_forma_polar` and exercises `ex.u5.angulos.1`, `ex.u5.radianes.1`, `ex.u5.circunferencia_trigonometrica.1`, `ex.u5.identidades.1`, `ex.u5.ecuaciones_trigonometricas.1`.

#### Scenario: Unit 5 loads with zero threshold

- GIVEN the post-retirement catalog
- WHEN Unit 5 is queried
- THEN it is intentionally empty without a threshold failure

#### Scenario: provisional inventory is absent from active surfaces

- GIVEN the active catalogs after retirement
- WHEN `UNIT_5_SKILLS`, `ALL_SKILLS`, `KNOWN_SKILL_IDS`, and active exercise references are enumerated
- THEN none of the six skill or five exercise IDs is active
- AND `UNIT_5_SKILLS` is empty

### Requirement: No Persistence or Migration Surface

Retirement MUST be static-only: no local/remote migration, sidecar map, per-student marker/per-row column, write gate/blocking, persistence adapter/behavior, SQL/remote-schema artifact, or stored-data transform.

#### Scenario: static retirement does not change persistence

- GIVEN the repository before and after retirement
- WHEN persistence and SQL surfaces are inspected
- THEN no prohibited mechanism or artifact exists

### Requirement: Synthetic Diagnostic Fixtures Are Retained

Fixtures `mat.u5.trigonometria_basica`, `ex.u5.bad.1`, and `ex.u5.good.1` MUST remain test-only diagnostic inputs for `selectBalancedSet`, never retirement keys or live catalog entries.

#### Scenario: synthetic fixtures remain only in test code

- GIVEN the diagnostic fixtures
- WHEN the live catalog loads
- THEN all three IDs are absent

### Requirement: Unencumbered Future Reuse

`mat.u5.ecuaciones_trigonometricas` MUST remain reusable without alias, compatibility, or migration. Reintroduction MUST use a new SDD change with its own spec, design, and review budget; retirement MUST NOT constrain naming.

#### Scenario: future reuse needs no retirement compatibility

- GIVEN a future SDD reintroduces the ID
- WHEN its catalog entry loads
- THEN no retirement compatibility is consulted

### Requirement: Scope Boundaries Preserved

U1–U4/U6 specs, persistence, tests, and content MUST remain semantically unchanged except for removed U5 references. U3 work, the active complex-numbers spec, archived U5-00 artifacts, and U5-02 MUST remain untouched.

#### Scenario: non-U5 units are preserved

- GIVEN the repository after retirement
- WHEN U1–U4/U6 surfaces are inspected
- THEN their content, dependencies, error taxonomy, and tests match the prior state

### Requirement: Derived Unit Availability

Selector availability MUST equal active skill count (`SKILLS_BY_UNIT[unit].length > 0`), without hard-coded per-unit flags. Populated units MUST remain usable; count changes MUST apply on the next render.

#### Scenario: active-skill counts control usability

- GIVEN one empty unit and one populated unit
- WHEN the selector renders and the populated unit is selected
- THEN the empty unit is unavailable
- AND the populated unit exposes its skill list and permits skill selection

#### Scenario: content arrival automatically re-enables a unit

- GIVEN a disabled empty unit
- WHEN active skills are added and the selector re-renders
- THEN the unit automatically becomes enabled and usable

### Requirement: Visible and Accessible Disabled Unit 5

Zero-skill units MUST remain visible. Unit 5 MUST read `Unidad 5 — Próximamente` and carry native `disabled`, `aria-disabled="true"`, muted text, and `cursor-not-allowed` treatment.

#### Scenario: Unit 5 remains visible with disabled semantics

- GIVEN Unit 5 has zero active skills
- WHEN the selector renders
- THEN its visible option reads `Unidad 5 — Próximamente`
- AND it has native, ARIA, and visual disabled semantics

### Requirement: Programmatic Unavailable-Unit Selection Is Rejected

The selector MUST reject programmatic selection of any zero-skill unit, retain no unavailable selection, MUST NOT invoke `onSkillSelect`, and MUST keep an empty skill list unreachable.

#### Scenario: programmatic Unit 5 selection is rejected

- GIVEN Unit 5 has zero active skills
- WHEN a programmatic selector change requests Unit 5
- THEN no unavailable unit is selected and `onSkillSelect` is not invoked
- AND no skill list is rendered
