# Delta for Math Skill Model

## ADDED Requirements

### Requirement: Unit 5 Normative Nine-Skill Identity

The system MUST declare exactly nine Unit 5 skill IDs in the canonical catalog:

| # | Skill ID |
|---|---|
| 1 | `mat.u5.medicion_angulos_y_arcos` |
| 2 | `mat.u5.razones_trigonometricas_y_signos` |
| 3 | `mat.u5.relaciones_angulares_y_reduccion` |
| 4 | `mat.u5.angulos_notables_y_valores_exactos` |
| 5 | `mat.u5.identidades_trigonometricas` |
| 6 | `mat.u5.ecuaciones_trigonometricas` |
| 7 | `mat.u5.complejos_modulo_argumento_y_formas` |
| 8 | `mat.u5.complejos_rotaciones_y_transformaciones` |
| 9 | `mat.u5.potencias_y_raices_de_complejos` |

#### Scenario: catalog declares the nine IDs in stable order

- GIVEN the loaded skill catalog
- WHEN Unit 5 skills are enumerated in declared order
- THEN they match the nine IDs above with no extras and no duplicates

### Requirement: Unit 5 Dependency Graph

The Unit 5 dependency graph MUST match the following edges exactly and MUST NOT introduce any edge from a Unit 4 skill:

```text
mat.u5.medicion_angulos_y_arcos  ->  mat.u5.razones_trigonometricas_y_signos
mat.u5.razones_trigonometricas_y_signos  ->  mat.u5.relaciones_angulares_y_reduccion
mat.u5.razones_trigonometricas_y_signos  ->  mat.u5.angulos_notables_y_valores_exactos
{ mat.u5.razones_trigonometricas_y_signos, mat.u5.angulos_notables_y_valores_exactos }  ->  mat.u5.identidades_trigonometricas
{ mat.u5.relaciones_angulares_y_reduccion, mat.u5.angulos_notables_y_valores_exactos, mat.u5.identidades_trigonometricas }  ->  mat.u5.ecuaciones_trigonometricas
{ mat.u1.complejos, mat.u5.medicion_angulos_y_arcos, mat.u5.razones_trigonometricas_y_signos }  ->  mat.u5.complejos_modulo_argumento_y_formas
mat.u5.complejos_modulo_argumento_y_formas  ->  mat.u5.complejos_rotaciones_y_transformaciones
mat.u5.complejos_modulo_argumento_y_formas  ->  mat.u5.potencias_y_raices_de_complejos
```

`mat.u5.medicion_angulos_y_arcos` is a root (no prerequisite). The graph MUST be a DAG with zero Unit 4 edges.

#### Scenario: graph is U4-free

- GIVEN the Unit 5 dependency graph
- WHEN every edge is inspected
- THEN no edge has a prerequisite whose ID matches `mat.u4.*`

#### Scenario: graph is acyclic

- GIVEN the Unit 5 dependency graph
- WHEN the cycle detector runs
- THEN it returns zero cycles

### Requirement: Useful Prior Knowledge Note

U5 theory MAY include a single optional, non-blocking note titled `Useful prior knowledge`. The note MAY reference triangle ratios, Pythagoras, and sine/cosine laws as useful context. The note MUST NOT affect `computeReadiness`, MUST NOT appear in the `FocusSelector` "Requires" chip, and MUST NOT introduce a dependency edge.

#### Scenario: note does not affect readiness

- GIVEN a learner who has not completed any prerequisite outside Unit 5
- WHEN `computeReadiness` is queried for a Unit 5 skill
- THEN the presence of the `Useful prior knowledge` note does not change the readiness result

### Requirement: Reused Identifier Historical Data Boundary

`mat.u5.ecuaciones_trigonometricas` is reused as a normative skill ID. Historical provisional data (attempts, accuracy, trend, lastPracticed, diagnostic estimates/suggestions, study-plan priorities) under that ID MUST be removed by exact allowlist before the normative skill is published. The migration marker MUST be persisted, and after marking the loader MUST NOT filter newly written normative data under the same ID.

#### Scenario: new normative data is preserved post-marker

- GIVEN a student whose migration marker is already persisted
- AND who records a new attempt for `mat.u5.ecuaciones_trigonometricas`
- WHEN the snapshot is loaded
- THEN the new attempt and its derived aggregates are present and unchanged