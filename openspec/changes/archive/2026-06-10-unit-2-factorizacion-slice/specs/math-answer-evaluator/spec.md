# Delta: math-answer-evaluator (Unit 2 Factorizacion Evaluation Paths)

## ADDED Requirements

**Referencias**: `unit-2-factorizacion-slice/proposal.md` | `unit-2-factorizacion-slice/exploration.md`

### Requirement: Polynomial Evaluator Routing Guard Reuse

El routing guard existente (`exercise.type === "symbolic" && /^mat\.u2\./.test(exercise.skillId)`) DEBE seguir derivando todos los ejercicios symbolic de `mat.u2.factorizacion` y `mat.u2.gauss` hacia `polynomial-evaluator` para comparacion por equivalencia. No se requieren cambios en `evaluator/index.ts`.

#### Scenario: U2FAC-EVAL-001 — Routing factorizacion symbolic

- GIVEN un ejercicio symbolic con skillId `mat.u2.factorizacion` y expectedAnswer `"(x-2)(x+3)"`
- WHEN el alumno responde `"x^2 + x - 6"`
- THEN el resultado es `correct: true` (equivalencia por expansion via polynomial-evaluator)

#### Scenario: U2FAC-EVAL-002 — Routing gauss symbolic

- GIVEN un ejercicio symbolic con skillId `mat.u2.gauss` y expectedAnswer `"(x-1)(2x-1)(x+3)"`
- WHEN el alumno responde `"2x^3 + 3x^2 - 8x + 3"`
- THEN el resultado es `correct: true` (equivalencia por expansion)

### Requirement: Unit 2 Factorizacion Error Tagging Patterns

`error-tagging.ts` DEBE incluir 2 funciones detectoras nuevas para los tags de factorizacion:

| Funcion | Tag | Aplica a | Logica de deteccion |
|---------|-----|----------|---------------------|
| `isU2SignoFactorizacionError` | `u2_signo_factorizacion` | MC y symbolic en `mat.u2.factorizacion` | MC: el alumno selecciono un distractor con los mismos factores pero signo opuesto en al menos uno. Symbolic: la forma factorizada del alumno difiere del esperado solo en signo de factores (verificar expandiendo ambos y comparando coeficientes; si la expansion tiene coeficientes con valor absoluto igual pero signos opuestos en terminos especificos, es error de signo) |
| `isU2CasoIncorrectoError` | `u2_caso_incorrecto` | MC en `mat.u2.factorizacion` donde el prompt pide identificar el caso | El alumno selecciono un distractor que representa un caso de factoreo diferente al correcto. El detector compara el caso declarado en la opcion correcta vs el caso declarado en la opcion elegida |

#### Scenario: U2FAC-EVAL-003 — Signo factorizacion MC detectado

- GIVEN un ejercicio MC de `mat.u2.factorizacion` con `commonErrorTags: ["u2_signo_factorizacion"]`
- AND expectedAnswer `"(x-3)(x+3)"` (diferencia de cuadrados)
- WHEN el alumno selecciona `"(x-3)²"` (signo incorrecto en segundo factor)
- THEN el resultado incluye `errorTag: "u2_signo_factorizacion"`

#### Scenario: U2FAC-EVAL-004 — Caso incorrecto MC detectado

- GIVEN un ejercicio MC de `mat.u2.factorizacion` con `commonErrorTags: ["u2_caso_incorrecto"]`
- AND el prompt pide identificar el caso de factoreo de `x² - 25`
- WHEN el alumno selecciona "Trinomio cuadrado perfecto" (esperado: "Diferencia de cuadrados")
- THEN el resultado incluye `errorTag: "u2_caso_incorrecto"`

#### Scenario: U2FAC-EVAL-005 — Signo factorizacion no declarado no tagea

- GIVEN un ejercicio de `mat.u2.factorizacion` SIN `u2_signo_factorizacion` en `commonErrorTags`
- WHEN el alumno comete un error de signo en la factorizacion
- THEN el resultado es incorrecto SIN error tag

### Requirement: Gauss-Specific Routing

Los ejercicios de `mat.u2.gauss` con `evaluatorId: "gauss"` (o type `numerical` con respuesta de raices) DEBEN rutearse por un helper que: (a) extrae los candidatos de raices racionales de la respuesta esperada, (b) compara con las raices del alumno (insensible a orden, correcto en signo), (c) retorna equivalente si todas las raices esperadas estan presentes y no hay extras.

#### Scenario: U2FAC-EVAL-006 — Gauss raices equivalentes sin importar orden

- GIVEN un ejercicio de Gauss con expectedAnswer `"1, -3, 1/2"`
- WHEN el alumno responde `"-3, 1/2, 1"`
- THEN el resultado es `correct: true` (mismas raices, orden diferente)

#### Scenario: U2FAC-EVAL-007 — Gauss raices con extra es incorrecto

- GIVEN un ejercicio de Gauss con expectedAnswer `"1, -3"`
- WHEN el alumno responde `"1, -3, 2"`
- THEN el resultado es `correct: false` (raiz extra)

### Requirement: Unit 1 and Unit 2 Fundamentos Regression Safety

Los evaluadores de U1 y U2-Fundamentos NO DEBEN modificarse. DEBE existir un test de regresion que ejecute todos los tests de U1 y U2-Fundamentos evaluator sobre el build nuevo y confirme que siguen pasando.

#### Scenario: U2FAC-EVAL-008 — Regresion U1 + U2-Fundamentos

- GIVEN el suite completo de tests de U1 y U2-Fundamentos evaluator
- WHEN se ejecuta tras los cambios de factorizacion
- THEN todos los tests pasan sin modificaciones

---

## Impacto Pedagogico

**(alumno)**: El alumno recibe evaluacion correcta para respuestas de factorizacion en cualquier forma equivalente (factorizada, expandida). Los 2 nuevos detectores de error de signo y caso incorrecto generan feedback especifico para los errores mas frecuentes en factorizacion.

**(docente)**: Los patrones de error de factorizacion permiten identificar si el alumno confunde signos entre factores o aplica casos incorrectos, facilitando intervenciones focalizadas. La regresion U1+U2-Fundamentos garantiza estabilidad.

---

## Fuera de alcance

- Evaluacion de MCM/MCD y ecuaciones fraccionarias (slice U2-Aplicaciones)
- Cambios a polynomial-evaluator (ya soporta formas factorizadas necesarias)
- Cambios al routing guard en evaluator/index.ts (ya cubre todos los skills U2)
- Modificaciones a evaluadores U1 o U2-Fundamentos

---

## Referencias cruzadas

- `polynomial-evaluator`: modulo existente al que se delega la equivalencia
- `math-error-taxonomy`: tags `u2_signo_factorizacion`, `u2_caso_incorrecto` que `error-tagging.ts` debe detectar
- `math-exercise-catalog`: ejercicios de factorizacion y Gauss que declaran `evaluatorId`
- `math-exercise-model`: contrato Exercise que el evaluador consume
