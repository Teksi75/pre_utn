# Delta for Math Skill Model

## MODIFIED Requirements

### Requirement: Exercise Count Soft Minimum

El catalogo DEBE mantener un minimo suave de 4 ejercicios por skill para los skills U2 implementados. Este minimo NO se enforce en codigo; es una convencion de contenido para consistencia pedagogica.

| Skill | Ejercicios | Estado |
|-------|-----------|--------|
| `mat.u2.polinomios_basico` | 4 | Implementado |
| `mat.u2.operaciones_polinomios` | 4 | Implementado |
| `mat.u2.ruffini_resto` | 4 | Implementado |
| `mat.u2.factorizacion` | 4 | Implementado |
| `mat.u2.gauss` | 4 | Implementado |
| `mat.u2.mcm_mcd_polinomios` | >= 3 | Este slice |
| `mat.u2.ecuaciones_fraccionarias` | >= 3 | Este slice |

(Previously: table ended at `mat.u2.gauss` with 5 skills; now includes 2 new skills with >= 3 exercises each.)

#### Scenario: U2FAC-SKILL-004 — Skills U2 tienen >= 4 ejercicios

- GIVEN el catalogo cargado
- WHEN se cuentan los ejercicios por skill U2 para los primeros 5 skills
- THEN cada skill U2 implementado (polinomios_basico through gauss) tiene al menos 4 ejercicios

#### Scenario: U2APP-SKILL-001 — Nuevos skills tienen >= 3 ejercicios

- GIVEN el catalogo cargado
- WHEN se cuentan los ejercicios por skill para mcm_mcd_polinomios y ecuaciones_fraccionarias
- THEN cada nuevo skill tiene al menos 3 ejercicios
