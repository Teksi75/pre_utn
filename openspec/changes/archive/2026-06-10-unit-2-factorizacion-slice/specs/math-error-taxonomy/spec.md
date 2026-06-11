# Delta: math-error-taxonomy (Unit 2 Factorizacion Tags)

## ADDED Requirements

**Referencias**: `unit-2-factorizacion-slice/proposal.md` | `unit-2-factorizacion-slice/exploration.md`

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

---

## Impacto Pedagogico

**(alumno)**: Los 2 tags cubren los errores mas frecuentes en factorizacion: perder/cambiar signo al elegir factores y aplicar un caso de factoreo incorrecto. Cada tag genera feedback especifico que acelera la autocorreccion y refuerza el reconocimiento de patrones.

**(docente)**: La taxonomia extendida permite identificar que casos de factoreo generan mas confusion (via `u2_caso_incorrecto`) y si el problema es de signo (via `u2_signo_factorizacion`), facilitando intervenciones focalizadas.

---

## Fuera de alcance

- Tags para MCM/MCD y ecuaciones fraccionarias (slice U2-Aplicaciones)
- Tag para "factor comun no maximo" (extraer factor comun pero no el maximo posible) — se captura parcialmente via `u2_factorizacion_incompleta`
- Patrones de deteccion heuristicamente complejos (se priorizan patrones exactos y comparacion por expansion)

---

## Referencias cruzadas

- `math-answer-evaluator`: `error-tagging.ts` consume estos tags
- `math-exercise-catalog`: ejercicios de factorizacion declaran estos tags en `commonErrorTags`
- `pedagogical-feedback-coverage`: cada tag requiere un FeedbackMapping
