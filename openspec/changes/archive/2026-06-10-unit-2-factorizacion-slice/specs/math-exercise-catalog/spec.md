# Delta: math-exercise-catalog (Unit 2 Factorizacion + Gauss)

## ADDED Requirements

**Referencias**: `unit-2-factorizacion-slice/proposal.md` | `unit-2-factorizacion-slice/exploration.md`

### Requirement: Unit 2 Factorizacion + Gauss Exercise Coverage

El catalogo DEBE incluir 8 ejercicios nuevos para la Unidad 2, distribuidos equitativamente entre 2 skills del slice:

| Skill | Cantidad | Ejercicios |
|-------|----------|------------|
| `mat.u2.factorizacion` | 4 | ex.u2.factorizacion.{1-4} (el .1 existe, se actualiza; se crean .2-.4) |
| `mat.u2.gauss` | 4 | ex.u2.gauss.{1-4} (el ID .1 fue liberado por reubicacion; se crean .1-.4) |

Cada skill DEBE incluir exactamente: 2 multiple-choice (reconocimiento de caso / identificacion) + 1 numerical (calculo de resultado o raices) + 1 symbolic (factorizacion completa verificada por polynomial-evaluator).

#### Scenario: U2FAC-CAT-001 — Cobertura por skill

- GIVEN el catalogo cargado con ejercicios U2 de factorizacion y Gauss
- WHEN se consultan los ejercicios por skill
- THEN `mat.u2.factorizacion` tiene 4 ejercicios y `mat.u2.gauss` tiene 4 ejercicios

#### Scenario: U2FAC-CAT-002 — Distribucion de tipos

- GIVEN los 8 ejercicios nuevos de este slice
- WHEN se agrupan por tipo
- THEN hay 4 multiple-choice, 2 numerical y 2 symbolic

### Requirement: Unit 2 Factorizacion Exercise Concepts

Los 4 ejercicios de `mat.u2.factorizacion` DEBEN cubrir al menos 4 de los 7 casos de factoreo del capitulo 13 del PDF canonico. Cada ejercicio PUEDE cubrir multiples casos. La distribucion de casos por ejercicio DEBE ser:

| ID | Concepto | Caso(s) cubierto(s) | Dificultad | Tipo | Input esperado | Error tags |
|----|----------|---------------------|------------|------|----------------|------------|
| ex.u2.factorizacion.1 | Identificar caso: trinomio 2do grado vs TCP | Caso 7 + Caso 3 | 2 | multiple-choice | Seleccionar opcion MC | u2_caso_incorrecto, u2_signo_factorizacion |
| ex.u2.factorizacion.2 | Factorizar diferencia de cuadrados | Caso 5 | 2 | multiple-choice | Seleccionar opcion MC | u2_signo_factorizacion, u2_factorizacion_incompleta |
| ex.u2.factorizacion.3 | Calcular factor comun maximo | Caso 1 | 3 | numerical | Input numerico (coeficiente extraido) | u2_factorizacion_incompleta |
| ex.u2.factorizacion.4 | Factorizar completamente trinomio 2do grado (a!=1) | Caso 7 | 4 | symbolic | polynomial-evaluator (forma factorizada) | u2_signo_factorizacion, u2_signo_operacion |

#### Scenario: U2FAC-CAT-003 — Ejercicios factorizacion cubren >= 4 casos

- GIVEN los 4 ejercicios de `mat.u2.factorizacion`
- WHEN se listan los casos de factoreo cubiertos
- THEN al menos 4 casos distintos del capitulo 13 estan representados

#### Scenario: U2FAC-CAT-004 — ex.u2.factorizacion.1 actualizado con error tags

- GIVEN el ejercicio existente `ex.u2.factorizacion.1`
- WHEN se inspeccionan sus `commonErrorTags`
- THEN contiene al menos `u2_caso_incorrecto` y `u2_signo_factorizacion`

### Requirement: Unit 2 Gauss Exercise Concepts

Los 4 ejercicios de `mat.u2.gauss` DEBEN cubrir el teorema de Gauss para factorizacion con raices racionales (capitulo 12 + 13 del PDF canonico):

| ID | Concepto | Dificultad | Tipo | Input esperado | Error tags |
|----|----------|------------|------|----------------|------------|
| ex.u2.gauss.1 | Encontrar raices racionales de un cubico | 2 | multiple-choice | Seleccionar opcion MC (raices) | u2_ruffini_signo_a, u2_signo_operacion |
| ex.u2.gauss.2 | Identificar candidatos p/q correctos | 2 | multiple-choice | Seleccionar opcion MC (lista de candidatos) | u2_ruffini_signo_a |
| ex.u2.gauss.3 | Calcular raices racionales de un polinomio grado 4 | 3 | numerical | Dos inputs numericos separados (raices) | u2_ruffini_signo_a, u2_signo_operacion |
| ex.u2.gauss.4 | Factorizar completamente usando Gauss + trinomio | 4 | symbolic | polynomial-evaluator (forma factorizada) | u2_signo_factorizacion, u2_factorizacion_incompleta |

#### Scenario: U2FAC-CAT-005 — ex.u2.gauss.1 es el primer ejercicio correcto de Gauss U2

- GIVEN el catalogo actualizado
- WHEN se busca `ex.u2.gauss.1`
- THEN su skillId es `mat.u2.gauss` (no `mat.u3.sistemas`)
- AND su prompt pide encontrar raices racionales de un polinomio cubico
- AND tiene `commonErrorTags` no vacio

### Requirement: Unit 2 Factorizacion Difficulty Progression

Dentro de cada skill, los ejercicios DEBEN tener dificultad creciente (1 -> 4). Cada ejercicio DEBE ser resoluble en menos de 120 segundos (factorizacion es mas densa que U2-Fundamentos).

#### Scenario: U2FAC-CAT-006 — Progresion de dificultad factorizacion

- GIVEN los ejercicios de `mat.u2.factorizacion` ordenados por ID
- WHEN se inspeccionan sus dificultades
- THEN la secuencia es monotonamente creciente

#### Scenario: U2FAC-CAT-007 — Progresion de dificultad gauss

- GIVEN los ejercicios de `mat.u2.gauss` ordenados por ID
- WHEN se inspeccionan sus dificultades
- THEN la secuencia es monotonamente creciente

### Requirement: Unit 2 Factorizacion Exercise Validation

Cada ejercicio nuevo DEBE cumplir: ID estable `ex.u2.<skill>.N`, referencia al PDF canonico (capitulo 12 o 13, pagina en `pedagogicalNote`), al menos un error tag del conjunto `u2_*` (incluyendo los 2 nuevos: `u2_signo_factorizacion`, `u2_caso_incorrecto`).

#### Scenario: U2FAC-CAT-008 — Validacion de ejercicio nuevo

- GIVEN un ejercicio nuevo de factorizacion o Gauss
- WHEN se valida contra el schema
- THEN tiene ID estable, referencia canonica y commonErrorTags no vacio

### Requirement: Unit 2 Factorizacion Input Type Restriction

Ningun ejercicio de factorizacion o Gauss DEBE usar texto libre para expresiones polinomicas. Las respuestas polinomicas DEBEN usar: opciones multiples renderizadas, input numerico simple, multiples inputs numericos separados, o polynomial-evaluator con forma factorizada.

#### Scenario: U2FAC-CAT-009 — Sin texto libre en factorizacion/Gauss

- GIVEN cualquier ejercicio de `mat.u2.factorizacion` o `mat.u2.gauss`
- WHEN se inspecciona su tipo
- THEN el tipo NO es `free-response`

---

## Impacto Pedagogico

**(alumno)**: 8 ejercicios con progresion de dificultad cubren reconocimiento de casos de factoreo, aplicacion de Gauss y factorizacion completa. Los MC de identificacion de caso entrenan el reconocimiento de patrones antes de la aplicacion. Los error tags `u2_signo_factorizacion` y `u2_caso_incorrecto` detectan los errores mas frecuentes y generan feedback correctivo especifico.

**(docente)**: La distribucion por skill y tipo permite diagnosticar que casos de factoreo generan mas confusion. El ejercicio `ex.u2.gauss.1` ahora tiene contenido correcto (antes era un placeholder de sistemas).

---

## Fuera de alcance

- Ejercicios de MCM/MCD y ecuaciones fraccionarias (slice U2-Aplicaciones futuro)
- Division larga interactiva como ejercicio
- Casos avanzados de factoreo (grupos, cuatrinomio cubo perfecto, potencias de igual grado) como ejercicios independientes — se cubren como sub-bloques en el TheoryNode
- Actualizar error tags de ejercicios U2-Fundamentos existentes (ex.u2.polinomios_basico.1, etc.)

---

## Referencias cruzadas

- `math-exercise-model`: tipos de ejercicio y contrato prompt/answer
- `math-error-taxonomy`: error tags `u2_signo_factorizacion`, `u2_caso_incorrecto` (ver delta de taxonomia)
- `math-answer-evaluator`: polynomial-evaluator para ejercicios symbolic
- `polynomial-evaluator`: modulo existente que soporta formas factorizadas `(ax+b)`
