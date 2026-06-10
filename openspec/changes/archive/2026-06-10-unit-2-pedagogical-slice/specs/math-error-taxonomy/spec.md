# Delta: math-error-taxonomy (Unit 2 Tags)

## ADDED Requirements

**Referencias**: `unit-2-pedagogical-slice/proposal.md` | `unit-2-pedagogical-slice/exploration.md`

### Requirement: Unit 2 Error Tags

La taxonomia DEBE incluir 6 etiquetas de error nuevas con prefijo `u2_*` para errores frecuentes en polinomios y algebra polinomica.

| Tag ID | Etiqueta | Descripcion | Impacto |
|--------|----------|-------------|---------|
| `u2_signo_operacion` | Signo en operacion | El alumno cambio u omitio un signo en suma, resta o multiplicacion de polinomios | Ejercicio incorrecto |
| `u2_termino_semejante` | Términos semejantes | El alumno no redujo términos semejantes al operar polinomios | Parcialmente incorrecto |
| `u2_ruffini_signo_a` | Signo de a en Ruffini | El alumno uso `+a` en vez de `-a` en la division sintetica de Ruffini | Ejercicio incorrecto |
| `u2_grado_incorrecto` | Grado incorrecto | El alumno calculo mal el grado del polinomio | Ejercicio incorrecto |
| `u2_termino_faltante` | Término faltante | El alumno no completo el polinomio con coeficientes cero | Parcialmente incorrecto |
| `u2_factorizacion_incompleta` | Factorizacion incompleta | El alumno se detuvo antes de factorizar completamente (distractor en operaciones) | Parcialmente incorrecto |

### Requirement: Detection Patterns

Cada tag DEBE tener al menos un patron de deteccion para `error-tagging.ts`:

| Tag ID | Patron de deteccion | Ejemplo respuesta incorrecta | Ejemplo respuesta correcta |
|--------|---------------------|------------------------------|---------------------------|
| `u2_signo_operacion` | Valor absoluto del resultado coincide pero signo opuesto en coeficientes (ejercicio multiple-choice/symbolic) | `2x² + 5x - 3` (esperado: `2x² - 5x - 3`) | `2x² - 5x - 3` |
| `u2_termino_semejante` | Resultado tiene términos no reducidos que al simplificar dan el correcto (ejercicio symbolic) | `2x² + 3x + 2x - 3` (esperado: `2x² + 5x - 3`) | `2x² + 5x - 3` |
| `u2_ruffini_signo_a` | Resto calculado con `P(+a)` en vez de `P(-a)` (ejercicio numerical) | `P(2)` da -3, esperado `P(-2)` da 5 | `5` |
| `u2_grado_incorrecto` | Grado declarado no coincide con el mayor exponente tras normalizar (ejercicio multiple-choice) | Grado 3 para `2x² + 3x + 1` | Grado 2 |
| `u2_termino_faltante` | Polinomio sin términos intermedios que deberian tener coeficiente 0 (ejercicio symbolic) | `[2, 1]` para grado 3 (esperado: `[2, 0, 0, 1]`) | `[2, 0, 0, 1]` |
| `u2_factorizacion_incompleta` | Producto de factores que no es fully factored (distractor en multiple-choice) | `x(x² - 4)` (esperado: `x(x-2)(x+2)`) | `x(x-2)(x+2)` |

### Requirement: Error Tag Metadata

Cada tag `u2_*` DEBE incluir: ID valido, etiqueta en espanol neutro, descripcion de la misconception, al menos un ejemplo de respuesta incorrecta, al menos un ejemplo de respuesta correcta, e indicacion de impacto (ejercicio completamente incorrecto o parcialmente incorrecto).

#### Scenario: U2-TAG-001 — Todos los tags U2 cargan

- GIVEN la taxonomia actualizada
- WHEN se consultan los tags de unidad 2
- THEN los 6 tags `u2_*` estan presentes con metadata completa

#### Scenario: U2-TAG-002 — Tags pasan validacion

- GIVEN cada tag `u2_*`
- WHEN se valida contra el schema ErrorTag
- THEN la validacion pasa con tag normalizado

#### Scenario: U2-TAG-003 — Sin duplicados

- GIVEN la taxonomia con tags U2 agregados
- WHEN se verifican IDs unicos
- THEN no hay tags duplicados

#### Scenario: U2-TAG-004 — Filtrado por unidad

- GIVEN tags de unidades 1 y 2
- WHEN se filtran por unidad 2
- THEN solo se devuelven tags con prefijo `u2_*`

---

## Impacto Pedagogico

**(alumno)**: Los 6 tags cubren los errores mas frecuentes en polinomios: signo al operar, no reducir terminos semejantes, confundir el signo de `a` en Ruffini, calcular mal el grado, olvidar coeficientes cero, y factorizar incompletamente. Cada tag genera feedback especifico que acelera la autocorreccion.

**(docente)**: La taxonomia U2 permite identificar que conceptos de polinomios generan mas confusion y planificar el slice de factorizacion con evidencia.

---

## Fuera de alcance

- Tags para factorizacion avanzada (7 casos) — slice U2-Factorizacion
- Tags para MCM/MCD y ecuaciones fraccionarias
- Patrones de deteccion heuristicamente complejos (se priorizan patrones exactos)

---

## Referencias cruzadas

- `math-answer-evaluator`: `error-tagging.ts` consume estos tags
- `math-exercise-catalog`: ejercicios U2 declaran estos tags en `commonErrorTags`
- `pedagogical-feedback-coverage`: cada tag requiere un FeedbackMapping
