# Delta for Unit 5 Foundation

## Purpose

Retire static provisional Unit 5 repository artifacts. The provisional unit was never exposed as practicable user content, so U5-01 has no migration or persistence responsibility.

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
