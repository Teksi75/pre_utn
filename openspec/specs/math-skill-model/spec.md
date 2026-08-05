# Math Skill Model Specification

## Purpose

Defines the mathematics skill model used to organize practice by unit, prerequisites, and pedagogical intent.

## Requirements

### Requirement: Skill Identity and Metadata

The system SHALL define a Skill with stable identity, unit, display name, description, prerequisites, and pedagogical tags. Skill IDs MUST follow `mat.u{1-6}.{slug}`.

#### Scenario: valid skill is accepted

- GIVEN a skill with ID `mat.u1.numeros_reales`, unit 1, metadata, empty prerequisites, and tags
- WHEN the skill is validated
- THEN validation succeeds with the normalized skill

#### Scenario: invalid identity is rejected

- GIVEN a skill with ID `math-1` or unit 7
- WHEN the skill is validated
- THEN validation fails with an identity or unit error

### Requirement: Prerequisite Integrity

The system MUST reject unknown prerequisite IDs and circular prerequisite chains.

#### Scenario: known prerequisites are accepted

- GIVEN skill B lists skill A as prerequisite
- WHEN both skills exist and no cycle is present
- THEN catalog validation succeeds

#### Scenario: invalid prerequisites are rejected

- GIVEN a skill references a missing prerequisite or creates a cycle
- WHEN the skill catalog is validated
- THEN validation fails with the affected skill IDs

### Requirement: Pedagogical Usefulness

Each skill SHALL identify what the student practices and what a teacher can interpret from performance on that skill.

#### Scenario: skill supports learning interpretation

- GIVEN a validated skill
- WHEN its metadata is inspected
- THEN it exposes learner-facing purpose and teacher-facing interpretation tags

---

## Provisional U5 Skill Retirement (from u5-01-provisional-retirement)

### Requirement: Provisional U5 Skill and Edge Retirement

The system MUST remove exactly these six IDs from active catalog surfaces and dependency edges: `mat.u5.angulos`, `mat.u5.radianes`, `mat.u5.circunferencia_trigonometrica`, `mat.u5.identidades`, `mat.u5.ecuaciones_trigonometricas`, `mat.u5.complejos_forma_polar`. `UNIT_5_SKILLS` MUST be empty. No canonical U5 skill, alias, mapping, migration, persistence adapter change, or data transform is added. Matching MUST use exact string equality.

#### Scenario: six provisional IDs are absent from active catalog surfaces

- GIVEN the active skill catalog after U5-01
- WHEN `UNIT_5_SKILLS`, `ALL_SKILLS`, `KNOWN_SKILL_IDS`, and `SKILL_DEPENDENCIES` are enumerated
- THEN none of the six IDs is present
- AND `UNIT_5_SKILLS` is empty
- AND U1/U2/U3/U4/U6 dependency edges are unchanged

---

## Unit 2 Factorizacion Skill Catalog Edits (from unit-2-factorizacion-slice)

### Requirement: Factorizacion Prerequisite Update

El skill `mat.u2.factorizacion` DEBE declarar `mat.u2.ruffini_resto` como prerrequisito adicional en `SKILL_DEPENDENCIES` (`src/domain/models/skill-catalog.ts`). Actualmente solo declara `mat.u2.operaciones_polinomios`; DEBE incluir ambos.

**Justificacion**: El caso 7 (trinomio de segundo grado) usa Ruffini para encontrar factores cuando el coeficiente principal a != 1. Sin Ruffini, el alumno no puede factorizar completamente polinomios como `6x² + 7x + 2 = (2x+1)(3x+2)`.

**Estado actual** (linea 115 de `skill-catalog.ts`):
```
{ skillId: "mat.u2.factorizacion", prerequisites: ["mat.u2.operaciones_polinomios"] }
```

**Estado esperado**:
```
{ skillId: "mat.u2.factorizacion", prerequisites: ["mat.u2.operaciones_polinomios", "mat.u2.ruffini_resto"] }
```

#### Scenario: U2FAC-SKILL-001 — Factorizacion tiene ruffini_resto como prerrequisito

- GIVEN el `SKILL_DEPENDENCIES` actualizado
- WHEN se consulta la entrada de `mat.u2.factorizacion`
- THEN `mat.u2.ruffini_resto` esta en la lista de prerequisites
- AND `mat.u2.operaciones_polinomios` sigue en la lista

#### Scenario: U2FAC-SKILL-002 — Cadena de dependencia cerrada

- GIVEN el `SKILL_DEPENDENCIES` actualizado
- WHEN se valida el grafo de prerrequisitos de U2
- THEN la cadena es: `polinomios_basico → operaciones_polinomios → ruffini_resto → factorizacion → gauss → mcm_mcd_polinomios`
- AND no hay ciclos

#### Scenario: U2FAC-SKILL-003 — computeReadiness bloquea factorizacion sin ruffini

- GIVEN que el alumno completo `mat.u2.operaciones_polinomios` pero NO `mat.u2.ruffini_resto`
- WHEN se consulta `computeReadiness` para `mat.u2.factorizacion`
- THEN el skill NO esta ready (su prerrequisito `mat.u2.ruffini_resto` no esta completo)

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

---

## Added by interval-unlock-clarify (issue #62)

### Requirement: Root-Skill Bifurcation Convention

La Unidad 1 de Matemática DEBE declarar dos skills raíz en paralelo (`mat.u1.conjuntos_numericos` y `mat.u1.intervalos`) sin prerrequisitos. Esta convención codifica el diseño intencional bifurcado de U1: dos puntos de entrada paralelos, NO una cadena lineal a través de `racionalizacion`. El catálogo (`SKILL_DEPENDENCIES` en `src/domain/models/skill-catalog.ts`) omite la entrada de `intervalos` por construcción, lo cual es semántico (es raíz) y NO un edge faltante.

**Justificacion**: El issue #62 reportó que `intervalos` aparece como "Disponible" sin chip de "Requiere:" y se leyó como bug de prerrequisito faltante. La evidencia (test contract en `accessibility.test.ts:113` y `:212`, docstring de `prerequisitesFor()`, fuente pedagógica canónica `utn-ingreso-app-spec/docs/pedagogy/06-skill-map.md`) confirma que la bifurcación es intencional. Cualquier contribuidor futuro que agregue un prerrequisito a `intervalos` o a otro skill raíz DEBE abrir un cambio SDD encadenado con ADR nuevo y plan de migración de progreso del alumno.

**Regla**: agregar o quitar un edge de prerrequisito sobre un skill raíz DEBE pasar por un cambio SDD con ADR (numerado después de ADR-008) que documente la razón pedagógica y la migración de progreso. El comment in-code `// INTENTIONAL: parallel-branch design — see ADR-009 and issue #62` por encima de `SKILL_DEPENDENCIES` Y la nota expandida en el docstring de `prerequisitesFor()` son los anclajes que cualquier contribuidor encuentra al investigar la bifurcación.

#### Scenario: U1INT-BIF-001 — Dos skills raíz identificados en U1

- GIVEN el catálogo `SKILL_DEPENDENCIES` cargado
- WHEN se enumeran los skills sin entrada de prerequisites en U1
- THEN `mat.u1.conjuntos_numericos` Y `mat.u1.intervalos` ambos estan en la lista
- AND ningun otro skill U1 tiene lista de prerequisites vacía por diseño

#### Scenario: U1INT-BIF-002 — Regla de chained-ADR al modificar un skill raíz

- GIVEN un skill raíz existente (`mat.u1.conjuntos_numericos` o `mat.u1.intervalos`)
- WHEN un contribuidor agrega una entrada de prerequisites para ese skill en `SKILL_DEPENDENCIES`
- THEN el commit NO entra sin un ADR nuevo (ADR-NNN, N >= 9) que documente la razón y la migración
- AND la migración cubre el progreso de los alumnos actuales que ya tienen el skill accesible

#### Scenario: U1INT-BIF-003 — Sin "Requiere:" pill para skills raíz en práctica

- GIVEN el `FocusSelector` renderiza la lista de U1 para un alumno con progreso vacío
- WHEN se inspeccionan `conjuntos_numericos` e `intervalos`
- THEN ninguno muestra chip "Requiere:" (no hay prerrequisito para mostrar)
- AND los demas skills U1 muestran "Requiere:" con el skill correspondiente
