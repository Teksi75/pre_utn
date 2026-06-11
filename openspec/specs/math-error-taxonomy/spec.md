# Math Error Taxonomy Specification

## Purpose

Defines normalized mathematics error tags used by exercises, evaluation, and future recommendations.

## Requirements

### Requirement: Error Tag Identity and Metadata

The system SHALL define an ErrorTag with tag ID, unit, description, and examples. Tag IDs MUST follow `u{1-6}_{slug}`.

#### Scenario: valid tag is accepted

- GIVEN a tag with ID `u1_signo_racionalizacion`, unit 1, description, and examples
- WHEN the tag is validated
- THEN validation succeeds with the normalized tag

#### Scenario: invalid tag is rejected

- GIVEN a tag with malformed ID, unit 7, missing description, or no examples
- WHEN the tag is validated
- THEN validation fails with the relevant field error

### Requirement: Minimum Coverage and Uniqueness

The taxonomy SHALL contain at least 2 error tags per mathematics unit and every tag MUST be unique.

#### Scenario: complete taxonomy loads

- GIVEN each unit has at least 2 unique error tags
- WHEN the taxonomy is loaded
- THEN loading succeeds

#### Scenario: duplicate or missing coverage fails

- GIVEN a duplicate tag or fewer than 2 tags for a unit
- WHEN the taxonomy is loaded
- THEN loading fails with duplicate or coverage details

### Requirement: Lookup and Filtering

The taxonomy SHALL support lookup by tag and filtering by unit.

#### Scenario: lookup existing tag

- GIVEN the taxonomy contains a requested tag
- WHEN the tag is looked up
- THEN the matching ErrorTag is returned

#### Scenario: filter by unit

- GIVEN multiple tags across units
- WHEN tags are requested for unit 2
- THEN only unit 2 tags are returned

### Requirement: Pedagogical Interpretation

Each error tag SHOULD describe an observable misconception in terms useful to both learners and teachers.

#### Scenario: learner and teacher can interpret error

- GIVEN an error tag assigned after evaluation
- WHEN its metadata is displayed or reported
- THEN it explains the misconception without requiring canonical source text

### Requirement: Complex Number Error Tags

The taxonomy SHALL include 6-8 error tags with prefix `u1_complejo_*` for common complex number misconceptions. Each tag MUST follow the `u{1-6}_{slug}` ID convention and include description and examples.

| Tag ID | Misconception |
|--------|---------------|
| `u1_complejo_i_definicion` | Treats i as sqrt(-1) in real numbers; thinks i is a real number |
| `u1_complejo_partes_confusion` | Swaps real and imaginary parts: Re(a+bi) = b instead of a |
| `u1_complejo_suma_real` | Adds complex numbers as if only real parts matter; ignores imaginary component |
| `u1_complejo_i_cuadrado_signo` | Forgets i^2 = -1 in multiplication; uses i^2 = 1 or i^2 = i |
| `u1_complejo_conjugado_signo` | Errors in conjugate sign: writes conjugate of a+bi as a+bi or -a-bi |
| `u1_complejo_division_sin_conjugado` | Divides complex numbers without multiplying by conjugate |
| `u1_complejo_potencia_ciclo` | Misapplies powers-of-i cycle: e.g., i^5 = 1 instead of i |
| `u1_complejo_igualdad_parcial` | Considers two complex numbers equal if only real or only imaginary parts match |

#### Scenario: all complex error tags load

- GIVEN the taxonomy is loaded
- THEN all `u1_complejo_*` tags are present with valid ID, unit 1, description, and examples
- AND no duplicate tag IDs exist

#### Scenario: complex tags pass validation

- GIVEN each `u1_complejo_*` tag
- WHEN validated against ErrorTag schema
- THEN validation succeeds with normalized tag

### Requirement: Unit 2 Error Tags

The taxonomy MUST include 6 new error tags with prefix `u2_*` for common polynomial and polynomial algebra misconceptions.

| Tag ID | Label | Description | Impact |
|--------|-------|-------------|--------|
| `u2_signo_operacion` | Sign in operation | The student changed or omitted a sign in addition, subtraction, or multiplication of polynomials | Exercise incorrect |
| `u2_termino_semejante` | Like terms | The student did not reduce like terms when operating on polynomials | Partially incorrect |
| `u2_ruffini_signo_a` | Sign of a in Ruffini | The student used `+a` instead of `-a` in Ruffini's synthetic division | Exercise incorrect |
| `u2_grado_incorrecto` | Incorrect degree | The student calculated the polynomial degree incorrectly | Exercise incorrect |
| `u2_termino_faltante` | Missing term | The student did not complete the polynomial with zero coefficients | Partially incorrect |
| `u2_factorizacion_incompleta` | Incomplete factorization | The student stopped before fully factoring (distractor in operations) | Partially incorrect |

### Requirement: Detection Patterns

Each tag MUST have at least one detection pattern in `error-tagging.ts`:

| Tag ID | Detection pattern | Example wrong answer | Example correct answer |
|--------|------------------|---------------------|----------------------|
| `u2_signo_operacion` | Absolute value of result matches but opposite sign in coefficients (MC/symbolic) | `2x² + 5x - 3` (expected: `2x² - 5x - 3`) | `2x² - 5x - 3` |
| `u2_termino_semejante` | Result has unreduced terms that when simplified give the correct answer (symbolic) | `2x² + 3x + 2x - 3` (expected: `2x² + 5x - 3`) | `2x² + 5x - 3` |
| `u2_ruffini_signo_a` | Remainder calculated with `P(+a)` instead of `P(-a)` (numerical) | `P(2)` gives -3, expected `P(-2)` gives 5 | `5` |
| `u2_grado_incorrecto` | Declared degree does not match highest exponent after normalization (MC) | Degree 3 for `2x² + 3x + 1` | Degree 2 |
| `u2_termino_faltante` | Polynomial without intermediate terms that should have coefficient 0 (symbolic) | `[2, 1]` for degree 3 (expected: `[2, 0, 0, 1]`) | `[2, 0, 0, 1]` |
| `u2_factorizacion_incompleta` | Product of factors that is not fully factored (MC distractor) | `x(x² - 4)` (expected: `x(x-2)(x+2)`) | `x(x-2)(x+2)` |

### Requirement: Error Tag Metadata

Each `u2_*` tag MUST include: valid ID, label in neutral Spanish, misconception description, at least one example wrong answer, at least one example correct answer, and impact indication (completely incorrect or partially incorrect).

#### Scenario: U2-TAG-001 — All U2 tags load

- GIVEN the updated taxonomy
- WHEN unit 2 tags are queried
- THEN all 6 `u2_*` tags are present with complete metadata

#### Scenario: U2-TAG-002 — Tags pass validation

- GIVEN each `u2_*` tag
- WHEN validated against the ErrorTag schema
- THEN validation passes with normalized tag

#### Scenario: U2-TAG-003 — No duplicates

- GIVEN the taxonomy with added U2 tags
- WHEN unique IDs are verified
- THEN no duplicate tags exist

#### Scenario: U2-TAG-004 — Filter by unit

- GIVEN tags from units 1 and 2
- WHEN filtered for unit 2
- THEN only tags with prefix `u2_*` are returned

---

## Unit 2 Factorizacion Tags (from unit-2-factorizacion-slice)

### Requirement: Unit 2 Factorizacion Error Tags

La taxonomia DEBE incluir 2 etiquetas de error nuevas con prefijo `u2_*` para errores frecuentes en factorizacion de polinomios. El tag existente `u2_factorizacion_incompleta` SE REUTILIZA (no se duplica).

| Tag ID | Etiqueta | Descripcion | Impacto |
|--------|----------|-------------|---------|
| `u2_signo_factorizacion` | Signo en factorizacion | El alumno perdio o cambio un signo al elegir los factores de la factorizacion. Ejemplo: factoriza x²-9 como (x-3)² en vez de (x-3)(x+3); o factoriza x²-4 como (x-2)² en vez de (x-2)(x+2) | Ejercicio incorrecto |
| `u2_caso_incorrecto` | Caso incorrecto de factoreo | El alumno aplico un caso de factoreo que no corresponde al polinomio dado. Ejemplo: aplica factor comun donde se necesita diferencia de cuadrados; trata un trinomio como diferencia de cuadrados (x²+4 queda como x²+4); intenta aplicar trinomio-cuadrado-perfecto a un binomio como (x+1)² | Ejercicio incorrecto |

### Requirement: Factorizacion Detection Patterns

Cada tag nuevo DEBE tener al menos un patron de deteccion para `error-tagging.ts`:

| Tag ID | Patron de deteccion | Ejemplo respuesta incorrecta | Ejemplo respuesta correcta |
|--------|---------------------|------------------------------|---------------------------|
| `u2_signo_factorizacion` | En MC: el alumno selecciono un distractor que tiene los mismos factores pero con signo opuesto en uno de ellos. En symbolic: la forma factorizada difiere del esperado solo en el signo de un factor (verificar expandiendo ambos y comparando coeficientes) | MC: `(x-3)²` (esperado: `(x-3)(x+3)`) — mismo factor repetido con signo cambiado. Symbolic: `(x+2)(x+3)` (esperado: `(x-2)(x-3)`) — todos los signos invertidos | `(x-3)(x+3)` |
| `u2_caso_incorrecto` | En MC donde el prompt pide identificar el caso: el alumno selecciono un distractor que representa un caso de factoreo diferente al correcto. El detector verifica que la opcion elegida corresponde a un caso distinto (ej: eligio "factor comun" cuando el caso correcto es "diferencia de cuadrados") | Prompt: "¿Que caso aplica a x²-25?" Respuesta: "Trinomio cuadrado perfecto" (esperado: "Diferencia de cuadrados") | "Diferencia de cuadrados" |

### Requirement: Factorizacion Error Tag Metadata

Cada tag nuevo `u2_*` DEBE incluir: ID valido, etiqueta en espanol neutro, descripcion de la misconception, al menos un patron regex/hint para `error-tagging.ts`, al menos un ejemplo de respuesta incorrecta, al menos un ejemplo de respuesta correcta, e indicacion de impacto (ejercicio completamente incorrecto o parcialmente incorrecto).

#### Scenario: U2FAC-TAG-001 — Todos los tags de factorizacion cargan

- GIVEN la taxonomia actualizada
- WHEN se consultan los tags de factorizacion
- THEN `u2_signo_factorizacion` y `u2_caso_incorrecto` estan presentes con metadata completa
- AND `u2_factorizacion_incompleta` sigue presente (reutilizado, no duplicado)

#### Scenario: U2FAC-TAG-002 — Tags pasan validacion

- GIVEN cada tag nuevo `u2_*`
- WHEN se valida contra el schema ErrorTag
- THEN la validacion pasa con tag normalizado

#### Scenario: U2FAC-TAG-003 — Sin duplicados con tags existentes

- GIVEN la taxonomia con tags U2 de factorizacion agregados
- WHEN se verifican IDs unicos
- THEN no hay tags duplicados (ningun `u2_signo_factorizacion` ni `u2_caso_incorrecto` preexistente)

#### Scenario: U2FAC-TAG-004 — Total de tags U2 tras el slice

- GIVEN la taxonomia completa
- WHEN se cuentan los tags con prefijo `u2_*`
- THEN el total es >= 10 (8 existentes + 2 nuevos)
