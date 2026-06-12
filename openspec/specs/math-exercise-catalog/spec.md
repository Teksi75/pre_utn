# Math Exercise Catalog Specification

## Purpose

Defines the loadable mathematics exercise catalog for the MVP practice loop.

## Requirements

### Requirement: Catalog Coverage

The system SHALL provide at least 30 mathematics exercises, with at least 5 exercises for each unit 1 through 6.

#### Scenario: complete catalog loads

- GIVEN the catalog contains at least 5 valid exercises per unit
- WHEN the catalog is loaded
- THEN loading succeeds with all 6 units represented

#### Scenario: incomplete coverage fails

- GIVEN any unit has fewer than 5 valid exercises
- WHEN the catalog is loaded
- THEN loading fails naming the insufficient unit

### Requirement: Pedagogically Valuable Content

Catalog content MUST provide pedagogical value beyond mechanical duplication. It MAY reuse canonical material directly when repetition is intentionally used to reinforce a concept; otherwise it SHOULD vary values, wording, representation, or context while preserving the target skill.

#### Scenario: transformed pattern is accepted

- GIVEN an exercise changes values, wording, and context while assessing the same skill
- WHEN the catalog is reviewed
- THEN the exercise is eligible for inclusion

#### Scenario: intentional repetition is accepted

- GIVEN an exercise prompt matches canonical UTN material
- WHEN the catalog is reviewed
- THEN it is eligible when metadata explains the reinforcement purpose

### Requirement: Catalog Querying

The catalog SHALL support querying by unit, skill, and difficulty range. Results MUST be deterministic: difficulty ascending, then ID ascending.

#### Scenario: query by skill orders results

- GIVEN three exercises for one skill with difficulties 2, 1, and 4
- WHEN exercises are requested by skill
- THEN results are returned in difficulty order 1, 2, 4

#### Scenario: query with no matches is safe

- GIVEN no exercises match a requested skill or difficulty range
- WHEN the catalog is queried
- THEN an empty result is returned without error

### Requirement: Pedagogical Traceability

Each catalog exercise SHOULD retain pedagogical source notes describing the practiced pattern, intended learner evidence, and whether any canonical repetition is intentional.

#### Scenario: teacher can interpret intent

- GIVEN a catalog exercise
- WHEN its pedagogical metadata is inspected
- THEN it identifies the practiced skill and observable evidence of mastery

### Requirement: Catalog Type-Answer Audit

The catalog MUST provide a validation pass that checks every exercise for type-answer shape consistency. Exercises whose expected answer contains multiple values, variable assignments, or set notation MUST NOT pass validation under type `numerical`. The audit MUST be executable as an automated test.

#### Scenario: catalog with mismatched types fails audit

- GIVEN a catalog containing an exercise with type `numerical` and expected answer `x = -2, x = 2`
- WHEN the catalog audit runs
- THEN the audit fails and reports the exercise ID and mismatch reason

#### Scenario: catalog with all types consistent passes audit

- GIVEN a catalog where every exercise's expected answer shape matches its declared type
- WHEN the catalog audit runs
- THEN the audit passes with no errors

### Requirement: Multiple-Choice Distractor Quality

Exercises converted to `multiple-choice` type MUST include at least 3 options with exactly one correct answer. Distractors SHOULD be derived from common error patterns declared in `commonErrorTags` or canonical misconceptions for the skill. The correct answer MUST be identifiable by value, not by position in the `options` array.

#### Scenario: multiple-choice exercise has valid distractors

- GIVEN a multiple-choice exercise with 4 options, one matching the expected answer
- WHEN the exercise is validated
- THEN validation succeeds and confirms exactly one correct option

#### Scenario: multiple-choice with no correct option fails

- GIVEN a multiple-choice exercise whose expected answer does not match any option
- WHEN the exercise is validated
- THEN validation fails listing the exercise ID

### Requirement: Known Mismatch Correction

The catalog MUST correct known type-answer mismatches for at least these exercises: `ex.u6.ceros_positividad_negatividad.1`, `ex.u3.ecuaciones_cuadraticas.1`, and `ex.u2.gauss.1`. Corrections MUST preserve the pedagogical intent and skill being assessed.

#### Scenario: known mismatch exercises pass audit after correction

- GIVEN the corrected catalog
- WHEN the catalog audit runs
- THEN `ex.u6.ceros_positividad_negatividad.1`, `ex.u3.ecuaciones_cuadraticas.1`, and `ex.u2.gauss.1` all pass validation

### Requirement: Unit 2 Exercise Coverage

The catalog MUST include 12 new exercises for Unit 2, distributed evenly across 3 skills in the slice:

| Skill | Count | Exercises |
|-------|-------|-----------|
| `mat.u2.polinomios_basico` | 4 | ex.u2.polinomios_basico.{2-5} |
| `mat.u2.operaciones_polinomios` | 4 | ex.u2.operaciones_polinomios.{2-5} |
| `mat.u2.ruffini_resto` | 4 | ex.u2.ruffini_resto.{2-5} |

Each skill MUST include exactly: 2 multiple-choice (conceptual recognition) + 1 numerical (direct evaluation) + 1 symbolic (multi-step with structured input).

#### Scenario: U2-CAT-001 — Coverage by skill

- GIVEN the loaded catalog with U2 exercises
- WHEN exercises are queried by skill
- THEN each slice skill has exactly 4 new exercises

#### Scenario: U2-CAT-002 — Type distribution

- GIVEN the 12 new U2 exercises
- WHEN grouped by type
- THEN there are 6 multiple-choice, 3 numerical, and 3 symbolic

### Requirement: Unit 2 Input Type Restriction

No U2 exercise MUST use free text for polynomial expressions. Polynomial answers MUST use: rendered multiple-choice options, simple numerical input, separate numerical inputs, or math chips.

#### Scenario: U2-CAT-003 — No free text for polynomials

- GIVEN any U2 exercise with a polynomial answer
- WHEN its type is inspected
- THEN the type is NOT `free-response` nor `symbolic` with free-text polynomial expectedAnswer

### Requirement: Unit 2 Exercise Concepts

The 12 new exercises MUST cover the following concepts:

| ID | Concept | Difficulty | Type | Expected error tags |
|----|---------|------------|------|---------------------|
| ex.u2.polinomios_basico.2 | Identify polynomial degree | 1 | multiple-choice | u2_grado_incorrecto |
| ex.u2.polinomios_basico.3 | Classify monomial/binomial/trinomial | 1 | multiple-choice | u2_termino_faltante |
| ex.u2.polinomios_basico.4 | Evaluate P(3) for P(x) = 2x² - 5x + 1 | 2 | numerical | u2_signo_operacion |
| ex.u2.polinomios_basico.5 | Complete polynomial with zero coefficients | 3 | symbolic | u2_termino_faltante |
| ex.u2.operaciones_polinomios.2 | Sum of two polynomials | 1 | multiple-choice | u2_signo_operacion, u2_termino_semejante |
| ex.u2.operaciones_polinomios.3 | Subtraction of polynomials (distribute sign) | 2 | multiple-choice | u2_signo_operacion |
| ex.u2.operaciones_polinomios.4 | Product (x-a)(x-b) → expanded form | 3 | numerical | u2_signo_operacion, u2_termino_semejante |
| ex.u2.operaciones_polinomios.5 | Combined operation: sum + product | 4 | symbolic | u2_signo_operacion, u2_termino_semejante |
| ex.u2.ruffini_resto.2 | Remainder via remainder theorem, divisor (x-3) | 2 | numerical | u2_ruffini_signo_a |
| ex.u2.ruffini_resto.3 | Quotient and remainder via Ruffini | 3 | symbolic | u2_ruffini_signo_a, u2_termino_faltante |
| ex.u2.ruffini_resto.4 | Verify if a value is a root via remainder theorem | 3 | multiple-choice | u2_ruffini_signo_a |
| ex.u2.ruffini_resto.5 | Reconstruct polynomial from roots | 4 | symbolic | u2_signo_operacion, u2_ruffini_signo_a |

#### Scenario: U2-CAT-004 — All concepts have exercises

- GIVEN the U2 concept table
- WHEN each ID is searched in the catalog
- THEN a valid exercise exists with the stated concept, difficulty, type, and error tags

### Requirement: Unit 2 Difficulty Progression

Within each skill, exercises MUST have increasing difficulty (1 → 4). Each exercise MUST be solvable in under 90 seconds.

#### Scenario: U2-CAT-005 — Difficulty progression

- GIVEN the exercises of a U2 skill ordered by ID
- WHEN their difficulties are inspected
- THEN the sequence is monotonically increasing

### Requirement: Unit 2 Exercise Validation

Each new exercise MUST comply with: stable ID `ex.u2.<skill>.N` (N starting at 2, since .1 exists), canonical PDF reference (page/chapter in `pedagogicalNote`), at least one error tag from the `u2_*` set.

#### Scenario: U2-CAT-006 — New exercise validation

- GIVEN a new U2 exercise
- WHEN validated against the schema
- THEN it has stable ID, canonical reference, and non-empty commonErrorTags

### Requirement: Relocation of ex.u2.gauss.1

The exercise `ex.u2.gauss.1` (currently Gaussian elimination of systems) MUST change its `skillId` from `mat.u2.gauss` to `mat.u3.sistemas`. The ID `ex.u2.gauss.1` remains as a placeholder for a future Gauss theorem for factorization exercise.

#### Scenario: U2-CAT-007 — Gauss relocated

- GIVEN the updated catalog
- WHEN `ex.u2.gauss.1` is looked up
- THEN its skillId is `mat.u3.sistemas`

---

## Unit 2 Factorizacion + Gauss Requirements (from unit-2-factorizacion-slice)

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

## Unit 2 Aplicaciones Requirements (from unit-2-aplicaciones-slice)

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

---

## Added by consolidate-math-mvp-before-unit-3

### Requirement: Catalog Loading Across Split Files

The catalog MUST load exercises from multiple per-unit or per-skill files while preserving all existing Catalog Coverage, Catalog Querying, and validation behaviors. The total loaded count MUST equal the union of all split files.

#### Scenario: exercises load from split files

- GIVEN the catalog is split into per-unit files (e.g., `u1.json`, `u2.json`)
- WHEN the catalog is loaded
- THEN all exercises from all unit files are available

#### Scenario: split catalog preserves deterministic ordering

- GIVEN exercises loaded from multiple per-unit files
- WHEN queried by skill with difficulty filter
- THEN results are deterministic: difficulty ascending, then ID ascending

### Requirement: Shared Unit-Parsing Helper

The system MUST expose a shared pure helper that extracts unit number from skill IDs using the pattern `mat.u{N}.{skill}`. Both the catalog loader and teacher home view-model derivation MUST use this helper.

#### Scenario: helper extracts unit from valid skill ID

- GIVEN skill ID `mat.u2.polinomios_basico`
- WHEN the helper is called
- THEN it returns `2`

#### Scenario: helper defaults for unknown pattern

- GIVEN a skill ID that does not match `mat.u{N}.{skill}`
- WHEN the helper is called
- THEN it returns `1` as default

### Requirement: Supabase-Readiness Boundary Review

The catalog loading boundary MUST be reviewable for future adapter compatibility. Current file-based loading MUST NOT add throwaway persistence abstractions, but the loading interface SHOULD remain composable for a future Supabase adapter.

#### Scenario: loader interface is composable

- GIVEN the current catalog loader
- WHEN its interface is inspected
- THEN it accepts exercise data as input (not hardcoded file paths)
- AND adding a Supabase source would not require rewriting query logic
