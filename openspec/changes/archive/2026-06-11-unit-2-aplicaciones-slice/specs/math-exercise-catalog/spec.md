# Delta for Math Exercise Catalog

## ADDED Requirements

### Requirement: Unit 2 Aplicaciones Exercise Coverage

The catalog MUST include 6-10 new exercises for Unit 2, distributed across 2 new skills (3-5 per skill):

| Skill | Count | Type Distribution |
|-------|-------|-------------------|
| `mat.u2.mcm_mcd_polinomios` | 3-5 | >= 1 MC + >= 1 symbolic |
| `mat.u2.ecuaciones_fraccionarias` | 3-5 | >= 1 MC (with domain-exclusion distractors) + >= 1 numerical |

#### Scenario: U2APP-CAT-001 — Coverage by skill

- GIVEN the loaded catalog
- WHEN exercises are queried by `mat.u2.mcm_mcd_polinomios` or `mat.u2.ecuaciones_fraccionarias`
- THEN each skill has at least 3 exercises

#### Scenario: U2APP-CAT-002 — Type distribution

- GIVEN the new exercises
- WHEN grouped by type
- THEN MC, numerical, and symbolic types are represented across both skills

### Requirement: Unit 2 Aplicaciones Exercise Validation

Each new exercise MUST have: stable ID `ex.u2.<skill>.N`, canonical PDF reference (chapter 14 or 15 in `pedagogicalNote`), at least one error tag from the `u2_*` set (including `u2_denominador_cero`, `u2_confunde_mcm_mcd`).

#### Scenario: U2APP-CAT-003 — Exercise validation

- GIVEN a new U2 aplicaciones exercise
- WHEN validated against the schema
- THEN it has stable ID, canonical reference, and non-empty commonErrorTags

### Requirement: Unit 2 Aplicaciones Input Type Restriction

No new exercise MUST use free text for polynomial or equation answers. Answers MUST use rendered MC options, simple numerical input, or polynomial-evaluator symbolic input.

#### Scenario: U2APP-CAT-004 — No free text

- GIVEN any new U2 aplicaciones exercise
- WHEN its type is inspected
- THEN the type is NOT `free-response`
