# Delta: math-answer-evaluator (Unit 2 Evaluation Paths)

## ADDED Requirements

**Referencias**: `unit-2-pedagogical-slice/proposal.md` | `unit-2-pedagogical-slice/exploration.md`

### Requirement: Pluggable Polynomial Evaluator

Cuando un ejercicio declara `evaluatorId: "polynomial"` (o su tipo es `symbolic` y el skill pertenece a U2), el evaluador DEBE delegar la comparacion a `polynomial-evaluator`. Para ejercicios sin este identificador, DEBE usar la cadena de evaluacion existente sin cambios.

#### Scenario: U2-EVAL-001 — Routing a polynomial-evaluator

- GIVEN un ejercicio con `evaluatorId: "polynomial"` y expectedAnswer `"(x-2)(x+3)"`
- WHEN el alumno responde `"x^2 + x - 6"`
- THEN el resultado es `correct: true` (equivalencia por expansion)

#### Scenario: U2-EVAL-002 — Routing por skill U2

- GIVEN un ejercicio `symbolic` cuyo skillId es `mat.u2.operaciones_polinomios`
- WHEN el alumno responde una expresion polinomica
- THEN la evaluacion usa `polynomial-evaluator` para comparar

#### Scenario: U2-EVAL-003 — Fallback para ejercicios sin polynomial

- GIVEN un ejercicio `numerical` U2 sin `evaluatorId: "polynomial"`
- WHEN el alumno responde
- THEN se usa la cadena de evaluacion existente (numeric)

### Requirement: Unit 2 Error Tagging

Cuando una respuesta U2 es incorrecta, `error-tagging.ts` DEBE intentar emparejar contra los patrones `u2_*` definidos en la taxonomia. El emparejamiento DEBE respetar el contrato existente: solo tagea si el ejercicio declara el tag en `commonErrorTags`.

#### Scenario: U2-EVAL-004 — Error tag U2 asignado

- GIVEN un ejercicio U2 con `commonErrorTags: ["u2_signo_operacion"]`
- WHEN el alumno responde con signo invertido en un coeficiente
- THEN el resultado incluye `errorTag: "u2_signo_operacion"`

#### Scenario: U2-EVAL-005 — Error tag U2 no declarado

- GIVEN un ejercicio U2 sin `u2_ruffini_signo_a` en `commonErrorTags`
- WHEN el alumno comete el error de signo de Ruffini
- THEN el resultado es incorrecto SIN error tag

### Requirement: Polynomial Equivalence Rules

El evaluador polinomico DEBE aplicar estas reglas de equivalencia:

| Regla | Ejemplo |
|-------|---------|
| Expandida ≡ factorizada | `(x-2)(x-3) ≡ x² - 5x + 6` |
| Sign flip | `-P(x) ≡ 0 - P(x)` |
| Escalar entero | `2·P(x) ≡ P(x) + P(x)` |
| Conmutatividad de factores | `(x-2)(x+3) ≡ (x+3)(x-2)` |

El evaluador DEBE rechazar: `1/0`, formas indefinidas, raiz negativa bajo indice par.

#### Scenario: U2-EVAL-006 — Conmutatividad de factores

- GIVEN expectedAnswer `"(x-2)(x+3)"` y respuesta `"(x+3)(x-2)"`
- WHEN se evalua
- THEN el resultado es `correct: true`

#### Scenario: U2-EVAL-007 — Forma indefinida rechazada

- GIVEN una respuesta que contiene division por cero
- WHEN se intenta parsear
- THEN se lanza `PolynomialParseError` o `UnsupportedPolynomialFormError`

### Requirement: Telemetry Compatibility

Cada evaluacion U2 DEBE emitir la misma telemetria que U1: `evaluationTimeMs`, `errorTags` (si incorrecta), `partialCredit` (si aplica). El formato de `EvaluationResult` NO DEBE cambiar.

#### Scenario: U2-EVAL-008 — Telemetria consistente

- GIVEN una evaluacion U2
- WHEN se inspecciona el resultado
- THEN incluye los mismos campos que una evaluacion U1

### Requirement: Unit 1 Regression Safety

Los evaluadores de U1 NO DEBEN modificarse. DEBE existir un test de regresion que ejecute todos los tests de U1 sobre el build nuevo y confirme que siguen pasando.

#### Scenario: U2-EVAL-009 — Regresion U1

- GIVEN el suite completo de tests de U1 evaluator
- WHEN se ejecuta tras los cambios de U2
- THEN todos los tests de U1 pasan sin modificaciones

---

## Impacto Pedagogico

**(alumno)**: El alumno recibe evaluacion correcta para respuestas polinomicas en cualquier forma equivalente. Los error tags `u2_*` detectan errores frecuentes y generan feedback especifico.

**(docente)**: La cadena de evaluacion pluggeable permite agregar nuevos evaluadores (factorizacion, ecuaciones) sin tocar los existentes. La regresion U1 garantiza estabilidad.

---

## Fuera de alcance

- Evaluacion de factorizacion (requiere polynomial-evaluator con factorizacion inversa)
- Evaluacion de ecuaciones fraccionarias (requiere verificacion de dominio)
- Cambios a la telemetria existente
- Modificaciones a evaluadores U1

---

## Referencias cruzadas

- `polynomial-evaluator`: modulo nuevo al que se delega
- `math-error-taxonomy`: tags `u2_*` que `error-tagging.ts` debe detectar
- `math-exercise-catalog`: ejercicios U2 que declaran `evaluatorId`
- `math-exercise-model`: contrato Exercise que el evaluador consume
