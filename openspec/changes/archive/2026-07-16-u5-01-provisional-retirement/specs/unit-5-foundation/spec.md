# Delta for Unit 5 Foundation

## Purpose

Retire static provisional Unit 5 repository artifacts and reconcile the selector with the resulting live empty catalog. The provisional unit was never exposed as practicable user content, so U5-01 has no migration or persistence responsibility.

## MODIFIED Requirements

### Requirement: Static Provisional Retirement

U5-01 MUST retire only active repository references to `mat.u5.angulos`, `mat.u5.radianes`, `mat.u5.circunferencia_trigonometrica`, `mat.u5.identidades`, `mat.u5.ecuaciones_trigonometricas`, `mat.u5.complejos_forma_polar`, `ex.u5.angulos.1`, `ex.u5.radianes.1`, `ex.u5.circunferencia_trigonometrica.1`, `ex.u5.identidades.1`, and `ex.u5.ecuaciones_trigonometricas.1`. Matching MUST be exact string equality. U5-01 MUST NOT introduce a migration, sidecar, marker, write gate, persistence behavior, SQL change, remote schema change, or stored-data transform. Archived U5-00 artifacts remain immutable.

### Requirement: U5 Scope and Zero Threshold

U5-01 MUST permit Unit 5 to contain zero active provisional skills and zero placeholder exercises with threshold `0`. It MUST NOT add canonical U5 content, U3 work, U5-02 work, or `mate-explorer` changes.

#### Scenario: Unit 5 loads with zero threshold

- GIVEN the catalog after U5-01
- WHEN Unit 5 is queried
- THEN it is intentionally empty without a threshold failure

### Requirement: Derived Selector Availability

U5-01 MUST derive practice-unit availability from the live skill count, not a per-unit availability flag. Empty units MUST remain visible as disabled native options labelled `Unidad N — Próximamente`, with `aria-disabled="true"` and muted unavailable styling. The change handler MUST reject unavailable values, including programmatic changes.

The selector MUST avoid an empty skill listbox if a selected unit loses all live skills between renders, and MUST re-enable that unit when live skills return. U5-01 MUST NOT add a unit URL, stored unit selection, persistence behavior, banner, or external recovery contract.

#### Scenario: empty Unit 5 is disabled without disappearing

- GIVEN Unit 5 has zero live skills
- WHEN the practice selector renders
- THEN `Unidad 5 — Próximamente` is visible and disabled
- AND a change to Unit 5 leaves no selected unit or skill listbox

#### Scenario: a live unit recovers after catalog changes

- GIVEN a selected unit has live skills
- WHEN its live skills are removed and later restored across rerenders
- THEN no empty listbox is rendered while it is empty
- AND the restored unit is enabled and selectable
