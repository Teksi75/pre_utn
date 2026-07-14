# Delta for Math Skill Model

## Purpose

Remove static provisional U5 skill declarations and edges from the live catalog. This is repository retirement only; no persistence behavior changes.

## ADDED Requirements

### Requirement: Provisional U5 Skill and Edge Retirement

The system MUST remove exactly these six IDs from active catalog surfaces and dependency edges: `mat.u5.angulos`, `mat.u5.radianes`, `mat.u5.circunferencia_trigonometrica`, `mat.u5.identidades`, `mat.u5.ecuaciones_trigonometricas`, `mat.u5.complejos_forma_polar`. `UNIT_5_SKILLS` MUST be empty. No canonical U5 skill, alias, mapping, migration, persistence adapter change, or data transform is added. Matching MUST use exact string equality.

#### Scenario: six provisional IDs are absent from active catalog surfaces

- GIVEN the active skill catalog after U5-01
- WHEN `UNIT_5_SKILLS`, `ALL_SKILLS`, `KNOWN_SKILL_IDS`, and `SKILL_DEPENDENCIES` are enumerated
- THEN none of the six IDs is present
- AND `UNIT_5_SKILLS` is empty
- AND U1/U2/U3/U4/U6 dependency edges are unchanged
