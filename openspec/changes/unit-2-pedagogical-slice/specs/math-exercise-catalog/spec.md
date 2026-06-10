# Delta: math-exercise-catalog (Unit 2)

## ADDED Requirements

**Referencias**: `unit-2-pedagogical-slice/proposal.md` | `unit-2-pedagogical-slice/exploration.md`

### Requirement: Unit 2 Exercise Coverage

El catalogo DEBE incluir 12 ejercicios nuevos para la Unidad 2, distribuidos equitativamente entre 3 skills del slice:

| Skill | Cantidad | Ejercicios |
|-------|----------|------------|
| `mat.u2.polinomios_basico` | 4 | ex.u2.polinomios_basico.{2-5} |
| `mat.u2.operaciones_polinomios` | 4 | ex.u2.operaciones_polinomios.{2-5} |
| `mat.u2.ruffini_resto` | 4 | ex.u2.ruffini_resto.{2-5} |

Cada skill DEBE incluir exactamente: 2 multiple-choice (reconocimiento conceptual) + 1 numerical (evaluacion directa) + 1 symbolic (multi-paso con input estructurado).

#### Scenario: U2-CAT-001 — Cobertura por skill

- GIVEN el catalogo cargado con ejercicios U2
- WHEN se consultan los ejercicios por skill
- THEN cada skill del slice tiene exactamente 4 ejercicios nuevos

#### Scenario: U2-CAT-002 — Distribucion de tipos

- GIVEN los 12 ejercicios nuevos de U2
- WHEN se agrupan por tipo
- THEN hay 6 multiple-choice, 3 numerical y 3 symbolic

### Requirement: Unit 2 Input Type Restriction

Ningun ejercicio U2 DEBE usar texto libre para expresiones polinomicas. Las respuestas polinomicas DEBEN usar: opciones multiples renderizadas, input numerico simple, multiples inputs numericos separados, o chips matematicos.

#### Scenario: U2-CAT-003 — Sin texto libre para polinomios

- GIVEN cualquier ejercicio U2 con respuesta polinomica
- WHEN se inspecciona su tipo
- THEN el tipo NO es `free-response` ni `symbolic` con expectedAnswer polinomica en texto libre

### Requirement: Unit 2 Exercise Concepts

Los 12 ejercicios nuevos DEBEN cubrir los siguientes conceptos:

| ID | Concepto | Dificultad | Tipo | Error tags esperados |
|----|----------|------------|------|---------------------|
| ex.u2.polinomios_basico.2 | Identificar grado de un polinomio dado | 1 | multiple-choice | u2_grado_incorrecto |
| ex.u2.polinomios_basico.3 | Clasificar como monomio/binomio/trinomio | 1 | multiple-choice | u2_termino_faltante |
| ex.u2.polinomios_basico.4 | Evaluar P(3) para P(x) = 2x² - 5x + 1 | 2 | numerical | u2_signo_operacion |
| ex.u2.polinomios_basico.5 | Completar polinomio con coeficientes cero | 3 | symbolic | u2_termino_faltante |
| ex.u2.operaciones_polinomios.2 | Suma de dos polinomios | 1 | multiple-choice | u2_signo_operacion, u2_termino_semejante |
| ex.u2.operaciones_polinomios.3 | Resta de polinomios (distribuir signo) | 2 | multiple-choice | u2_signo_operacion |
| ex.u2.operaciones_polinomios.4 | Multiplicacion (x-a)(x-b) → expandida | 3 | numerical | u2_signo_operacion, u2_termino_semejante |
| ex.u2.operaciones_polinomios.5 | Operacion combinada: suma + producto | 4 | symbolic | u2_signo_operacion, u2_termino_semejante |
| ex.u2.ruffini_resto.2 | Resto por teorema del resto, divisor (x-3) | 2 | numerical | u2_ruffini_signo_a |
| ex.u2.ruffini_resto.3 | Cociente y resto por Ruffini | 3 | symbolic | u2_ruffini_signo_a, u2_termino_faltante |
| ex.u2.ruffini_resto.4 | Verificar si un valor es raiz via teorema | 3 | multiple-choice | u2_ruffini_signo_a |
| ex.u2.ruffini_resto.5 | Reconstruir polinomio a partir de raices | 4 | symbolic | u2_signo_operacion, u2_ruffini_signo_a |

#### Scenario: U2-CAT-004 — Todos los conceptos tienen ejercicio

- GIVEN la tabla de conceptos U2
- WHEN se busca cada ID en el catalogo
- THEN existe un ejercicio valido con el concepto, dificultad, tipo y error tags indicados

### Requirement: Unit 2 Difficulty Progression

Dentro de cada skill, los ejercicios DEBEN tener dificultad creciente (1 → 4). Cada ejercicio DEBE ser resoluble en menos de 90 segundos.

#### Scenario: U2-CAT-005 — Progresion de dificultad

- GIVEN los ejercicios de un skill U2 ordenados por ID
- WHEN se inspeccionan sus dificultades
- THEN la secuencia es monotonamente creciente

### Requirement: Unit 2 Exercise Validation

Cada ejercicio nuevo DEBE cumplir: ID estable `ex.u2.<skill>.N` (N desde 2, ya que el .1 existe), referencia al PDF canonico (pagina/capitulo en `pedagogicalNote`), al menos un error tag del conjunto `u2_*`.

#### Scenario: U2-CAT-006 — Validacion de ejercicio nuevo

- GIVEN un ejercicio U2 nuevo
- WHEN se valida contra el schema
- THEN tiene ID estable, referencia canonica y commonErrorTags no vacio

### Requirement: Relocation of ex.u2.gauss.1

El ejercicio `ex.u2.gauss.1` (actualmente eliminacion gaussiana de sistemas) DEBE cambiar su `skillId` de `mat.u2.gauss` a `mat.u3.sistemas`. El ID `ex.u2.gauss.1` queda como placeholder para un ejercicio futuro del teorema de Gauss para factorizacion.

#### Scenario: U2-CAT-007 — Gauss relocated

- GIVEN el catalogo actualizado
- WHEN se busca `ex.u2.gauss.1`
- THEN su skillId es `mat.u3.sistemas`

---

## Impacto Pedagogico

**(alumno)**: 12 ejercicios con progresion de dificultad cubren lectura, operacion y evaluacion de polinomios. Los error tags `u2_*` generan feedback correctivo especifico.

**(docente)**: La distribucion por skill y tipo permite diagnosticar que conceptos de polinomios domina el alumno y cuales requieren refuerzo.

---

## Fuera de alcance

- Ejercicios de factorizacion (slice U2-Factorizacion)
- Ejercicios de MCM/MCD y ecuaciones fraccionarias
- Division larga como ejercicio interactivo
- Actualizar error tags de los 3 ejercicios U2 existentes (ex.u2.*.1) — se documentan como deuda

---

## Referencias cruzadas

- `math-exercise-model`: tipos de ejercicio y contrato prompt/answer
- `math-error-taxonomy`: error tags `u2_*` (ver delta de taxonomia)
- `math-answer-evaluator`: evaluador polinomico para ejercicios symbolic
- `polynomial-evaluator`: modulo nuevo para equivalencia polinomica
