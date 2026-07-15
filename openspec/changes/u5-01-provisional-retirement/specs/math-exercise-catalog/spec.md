# Delta for Math Exercise Catalog

## Purpose

Permit an empty static Unit 5 catalog while retiring exactly five provisional placeholder exercises. No persisted exercise data is migrated.

## MODIFIED Requirements

### Requirement: Catalog Coverage

The system SHALL provide at least five exercises for each active unit 1, 2, 3, 4, and 6. Unit 5 MAY contain zero exercises during U5-01. The five exact placeholder IDs `ex.u5.angulos.1`, `ex.u5.radianes.1`, `ex.u5.circunferencia_trigonometrica.1`, `ex.u5.identidades.1`, `ex.u5.ecuaciones_trigonometricas.1` MUST be removed from active catalog content using exact string equality. U5-01 MUST NOT add migration, persistence, sidecar, marker, SQL, or write-gate behavior.

#### Scenario: empty Unit 5 is permitted

- GIVEN the catalog after U5-01
- WHEN it is loaded
- THEN Unit 5 is represented as empty without threshold failure
- AND Units 1, 2, 3, 4, and 6 retain their coverage contract
