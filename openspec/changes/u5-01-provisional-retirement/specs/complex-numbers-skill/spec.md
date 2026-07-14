# Delta for Complex Numbers Skill

## Purpose

Drop the static retired polar-form dependency from the active graph. This catalog correction does not change persistence or user data.

## MODIFIED Requirements

### Requirement: Skill Order and Prerequisites

`mat.u1.complejos` MUST remain the 8th `PILOT_SKILLS` entry after `mat.u1.logaritmos`, with `mat.u1.propiedades_operaciones_reales` as its prerequisite. `mat.u5.complejos_forma_polar` MUST NOT be present in `SKILL_DEPENDENCIES` and MUST NOT list `mat.u1.complejos` as a downstream prerequisite. No new downstream edge, migration, persistence change, or data transform is added.

#### Scenario: active prerequisite graph resolves without the polar skill

- GIVEN the active catalog after U5-01
- WHEN `mat.u1.complejos` prerequisites are resolved
- THEN no active edge references `mat.u5.complejos_forma_polar`
- AND the U1 prerequisite remains unchanged
