# Math Answer Evaluator Specification

## Purpose

Defines behavioral evaluation of a student's answer against an exercise's expected answer.

## Requirements

### Requirement: Evaluation Result

The system SHALL return an evaluation result with correctness, optional error tag, and optional feedback. The evaluator MUST be deterministic and framework-free.

#### Scenario: correct answer succeeds

- GIVEN an exercise and a student answer equivalent to the expected answer
- WHEN the answer is evaluated
- THEN the result is correct with no error tag

#### Scenario: empty answer is incorrect

- GIVEN any evaluable exercise
- WHEN the student submits an empty answer
- THEN the result is incorrect with no error tag

### Requirement: Type-Specific Matching

The evaluator MUST normalize answers according to exercise type: numeric tolerance for `numerical` answers, trimmed exact match for `symbolic` answers, case-insensitive matching for `multiple-choice` and `fill-blank`, and Spanish/English boolean aliases for `true-false`. The evaluator MUST NOT attempt numeric parsing on answers that are not valid numbers; if a `numerical` exercise receives a non-numeric expected answer, the evaluator MUST return a configuration-error result rather than silently marking it incorrect.

#### Scenario: numerical tolerance is accepted

- GIVEN a numerical exercise expecting `3.14`
- WHEN the student answers `3.1405`
- THEN the result is correct

#### Scenario: boolean aliases are accepted

- GIVEN a true-false exercise expecting true
- WHEN the student answers `v` or `verdadero`
- THEN the result is correct

#### Scenario: multiple-choice matches by value not position

- GIVEN a multiple-choice exercise with options `["x = 2, x = 3", "x = -2, x = -3", ...]` and expected answer `x = 2, x = 3`
- WHEN the student selects the option with value `x = 2, x = 3` regardless of its display position
- THEN the result is correct

#### Scenario: numerical exercise with non-numeric expected answer reports config error

- GIVEN an exercise with type `numerical` and expected answer `x = -2, x = 2`
- WHEN the evaluator processes it
- THEN the result is a configuration error, not a silent incorrect

(Previously: the evaluator dispatched by type without validating that the expected answer shape was parseable for that type, causing silent always-incorrect results for mismatched exercises.)

### Requirement: Error Tag Assignment

When an answer is incorrect, the evaluator SHALL return an applicable error tag only when the exercise declares that tag in `commonErrorTags` and the answer pattern supports it; otherwise it SHALL return no tag. Matching MUST be deterministic, side-effect free, and limited to known pedagogical patterns.
(Previously: incorrect answers could be tagged, but the spec did not explicitly bind matching to the exercise's declared `commonErrorTags`.)

#### Scenario: recognizable misconception is tagged

- GIVEN an exercise with a sign-error tag in `commonErrorTags` and expected answer `5`
- WHEN the student answers `-5`
- THEN the result is incorrect with the sign-error tag

#### Scenario: recognized but undeclared misconception is not tagged

- GIVEN an exercise without a sign-error tag in `commonErrorTags` and expected answer `5`
- WHEN the student answers `-5`
- THEN the result is incorrect with no error tag

#### Scenario: unrelated wrong answer has no tag

- GIVEN an exercise with declared error tags
- WHEN the wrong answer does not match any known pattern
- THEN the result is incorrect with no error tag

### Requirement: Unsupported Exercise Types

The evaluator MUST NOT guess correctness for unsupported types such as free-response, graphical, matching, or ordering. It SHALL return a manual-review result.

#### Scenario: manual review required

- GIVEN an unsupported exercise type
- WHEN the answer is evaluated
- THEN the result is incorrect with `unsupported_type` and manual-review feedback

### Requirement: Pedagogical Feedback Boundary

Feedback SHOULD help the learner correct direction without exposing full solution steps unless the exercise explicitly allows it.

#### Scenario: feedback avoids giving away answer

- GIVEN an incorrect answer with an identified error tag
- WHEN feedback is produced
- THEN it names the misconception category without revealing the final answer

### Requirement: Deterministic Testability

The evaluator MUST be a pure function: given the same exercise and student answer, it MUST always return the same result. It MUST NOT depend on runtime state, random seeds, or display order. All evaluation logic MUST be testable without React, Next.js, Supabase, or DOM dependencies.

#### Scenario: evaluator produces consistent results across calls

- GIVEN the same exercise and student answer
- WHEN the evaluator is called 100 times
- THEN every call returns an identical result

#### Scenario: evaluator tests run without framework dependencies

- GIVEN a test file importing only from `src/domain/evaluator`
- WHEN the test runs via `pnpm run test`
- THEN it passes without importing React, Next.js, or browser APIs

### Requirement: Pluggable Polynomial Evaluator

When an exercise declares `evaluatorId: "polynomial"` (or its type is `symbolic` and the skill belongs to U2), the evaluator MUST delegate comparison to `polynomial-evaluator`. For exercises without this identifier, it MUST use the existing evaluation chain unchanged.

#### Scenario: U2-EVAL-001 — Routing to polynomial-evaluator

- GIVEN an exercise with `evaluatorId: "polynomial"` and expectedAnswer `"(x-2)(x+3)"`
- WHEN the student answers `"x^2 + x - 6"`
- THEN the result is `correct: true` (equivalence by expansion)

#### Scenario: U2-EVAL-002 — Routing by U2 skill

- GIVEN a `symbolic` exercise whose skillId is `mat.u2.operaciones_polinomios`
- WHEN the student answers a polynomial expression
- THEN evaluation uses `polynomial-evaluator` for comparison

#### Scenario: U2-EVAL-003 — Fallback for exercises without polynomial

- GIVEN a `numerical` U2 exercise without `evaluatorId: "polynomial"`
- WHEN the student answers
- THEN the existing evaluation chain (numeric) is used

### Requirement: Unit 2 Error Tagging

When a U2 answer is incorrect, `error-tagging.ts` MUST attempt to match against the `u2_*` patterns defined in the taxonomy. Matching MUST respect the existing contract: only tag if the exercise declares the tag in `commonErrorTags`.

#### Scenario: U2-EVAL-004 — U2 error tag assigned

- GIVEN a U2 exercise with `commonErrorTags: ["u2_signo_operacion"]`
- WHEN the student answers with inverted sign in a coefficient
- THEN the result includes `errorTag: "u2_signo_operacion"`

#### Scenario: U2-EVAL-005 — U2 error tag not declared

- GIVEN a U2 exercise without `u2_ruffini_signo_a` in `commonErrorTags`
- WHEN the student makes the Ruffini sign error
- THEN the result is incorrect WITHOUT error tag

---

## Structured Answer Evaluation (from u5-02-medicion-angulos-y-arcos)

### Requirement: Structured Answer Dispatch

The evaluator MUST dispatch on `exercise.type === "structured"` BEFORE the legacy type-based branches. The structured dispatcher MUST parse the submitted string as canonical JSON v1, normalize it according to the matching `answerSpec.kind`, and delegate to the matching evaluator (`pi-rational` or `angle-dms`). The dispatch MUST be deterministic, framework-free, and side-effect free.

| Dispatch step | Behavior |
|---|---|
| Parse | Strict JSON parse of the submitted string; reject anything that is not an object with integer `v === 1` |
| Kind lookup | Read `kind`; reject unknown kinds |
| Normalize | Apply `pi-rational` sign-to-numerator + GCD reduction, or `angle-dms` bounds check (0 ≤ minutes < 60, 0 ≤ seconds < 60) |
| Delegate | Compare normalized submission to normalized expected per the kind's rule |
| Fallback | Unknown kind or unparseable submission → `incorrect` with feedback (or `configuration_error` when the malformed data is the expected spec) |

#### Scenario: dispatch routes structured before legacy types

- GIVEN an exercise with `type === "structured"` and `answerSpec.kind === "pi-rational"`
- WHEN `evaluateAnswer` is called
- THEN the structured dispatcher runs first
- AND the legacy numerical path is NOT executed

#### Scenario: dispatcher is pure

- GIVEN the same structured exercise and submission
- WHEN `evaluateAnswer` is called 100 times
- THEN every result is identical (no runtime state, no random seed, no DOM dependency)

### Requirement: Pi-Rational Evaluation

The π-rational evaluator MUST compare the normalized submitted coefficient to the normalized expected coefficient by EXACT reduced-form equality. The decimal field is then compared by absolute difference against the declared `tolerance`. Both checks MUST succeed for `correct: true`. Either failure returns `incorrect` and gates any error tag on `commonErrorTags` declared by the exercise.

| Check | Rule |
|---|---|
| Coefficient | `submitted.numerator * expected.denominator === expected.numerator * submitted.denominator` AFTER each side is reduced |
| Decimal | `|submitted.decimal - expected.decimal| ≤ expected.tolerance` |

#### Scenario: exact coefficient and within tolerance is correct

- GIVEN expected `{numerator: 1, denominator: 5, decimal: 0.6283, tolerance: 0.0001}`
- WHEN submission is `{numerator: 1, denominator: 5, decimal: 0.6283}`
- THEN result is `correct: true`

#### Scenario: coefficient off, decimal within tolerance is incorrect

- GIVEN the same expected
- WHEN submission is `{numerator: 2, denominator: 5, decimal: 0.6283}`
- THEN result is `correct: false`
- AND if `u5_degree_radian_factor` is declared, `errorTag === "u5_degree_radian_factor"`

#### Scenario: coefficient exact, decimal outside tolerance is incorrect

- GIVEN the same expected
- WHEN submission is `{numerator: 1, denominator: 5, decimal: 0.65}`
- THEN result is `correct: false`

#### Scenario: equivalence under reduction is correct

- GIVEN expected `{numerator: 1, denominator: 5, ...}`
- WHEN submission is `{numerator: 2, denominator: 10, decimal: 0.6283}`
- THEN normalization reduces the submission to `{1, 5}`
- AND result is `correct: true`

### Requirement: Angle DMS Evaluation

The angle-dms evaluator MUST compare total arc-seconds: `expected.degrees * 3600 + expected.minutes * 60 + expected.seconds` against `submitted.degrees * 3600 + submitted.minutes * 60 + submitted.seconds`. The difference MUST satisfy `|Δ| ≤ expected.tolerance` (in arc-seconds) for `correct: true`. Tolerance for U5-02 item 2 is `0.5` arc-seconds. The canonical expected display string for item 2 is `11° 27′ 33″`.

#### Scenario: 11° 27′ 33″ exact is correct

- GIVEN expected `{degrees: 11, minutes: 27, seconds: 33, tolerance: 0.5}`
- WHEN submission is `{degrees: 11, minutes: 27, seconds: 33}`
- THEN the difference is `0` arc-seconds
- AND result is `correct: true`

#### Scenario: 11° 27′ 32.7″ within tolerance is correct

- GIVEN the same expected
- WHEN submission is `{degrees: 11, minutes: 27, seconds: 32.7}`
- THEN the difference is `0.3` arc-seconds
- AND result is `correct: true`

#### Scenario: 11° 27′ 32″ outside tolerance is incorrect

- GIVEN the same expected
- WHEN submission is `{degrees: 11, minutes: 27, seconds: 32}`
- THEN the difference is `1.0` arc-seconds
- AND result is `correct: false`
- AND if `u5_dms_conversion` is declared, `errorTag === "u5_dms_conversion"`

#### Scenario: minutes overflow rejected

- GIVEN an `angle-dms` submission with `minutes === 60`
- WHEN the dispatcher normalizes it
- THEN the submission is rejected as malformed
- AND result is `incorrect` (or `configuration_error` if the violation is on the expected spec)

### Requirement: Unit 5 Misconception Tagging

Three Unit 5 misconception detectors MUST be added to `src/domain/evaluator/error-tagging.ts`. Each detector MUST only tag when the exercise declares the matching tag in `commonErrorTags`. Detectors MUST be deterministic and side-effect free.

| Detector | Tag | Triggers when |
|---|---|---|
| `isU5DegreeRadianFactorError` | `u5_degree_radian_factor` | `pi-rational` submission has the right numerator/denominator magnitudes but inverted `π/180` vs `180/π` factor |
| `isU5DmsConversionError` | `u5_dms_conversion` | `angle-dms` submission is a carry/bounds/rounding mistake against the declared tolerance |
| `isU5ArcTimeFractionError` | `u5_arc_time_fraction` | `pi-rational` submission for item 3 reflects wrong time fraction |

#### Scenario: detector fires only when declared

- GIVEN exercise 2d declaring `commonErrorTags: ["u5_dms_conversion"]`
- WHEN the student submits `11° 27′ 32″`
- THEN result includes `errorTag: "u5_dms_conversion"`

- GIVEN the same exercise WITHOUT `u5_dms_conversion` in `commonErrorTags`
- WHEN the same wrong submission is graded
- THEN result is `correct: false` with NO error tag

#### Scenario: arc-time detector on wrong fraction

- GIVEN exercise `.3` declaring `commonErrorTags: ["u5_arc_time_fraction"]` and expected `{8, 1, 25.1327}`
- WHEN submission is `{4, 1, 12.5663}` (10-minute fraction)
- THEN result includes `errorTag: "u5_arc_time_fraction"`

### Requirement: Scalar Items 1.c and 1.d Stay on the Numerical Path

Items 1.c (`3π/4 → 135°`) and 1.d (`2.3456 rad → 134.392980…°`) MUST remain `numerical` exercises evaluated by the existing numerical branch with absolute tolerance. They MUST NOT be promoted to `structured` because their answer forms are scalar degrees. A regression test MUST prove both items still pass under the new dispatch order.

> **Tolerance note (reconciled at archive):** Item 1.d is graded on the existing numerical path with the platform-fixed tolerance of 0.01 (not 0.0001). Per-exercise tolerance metadata is a future enhancement; the regression test `evaluator-numeric-u5-scalar.test.ts` explicitly pins the current behavior.

#### Scenario: 1.c evaluates as numerical

- GIVEN `ex.u5.medicion_angulos_y_arcos.1c` with `type === "numerical"`, expected `135`
- WHEN student submits `135`
- THEN result is `correct: true` via the legacy numerical path

#### Scenario: 1.d evaluates as numerical with platform tolerance 0.01

- GIVEN `ex.u5.medicion_angulos_y_arcos.1d` with expected `134.392980`
- WHEN student submits `134.3931`
- THEN `|Δ| === 0.00012 < 0.01` (platform tolerance)
- AND result is `correct: true`
- NOTE: the spec originally described 0.0001 tolerance; this was reconciled to 0.01 to match the existing platform numeric evaluator behavior. See `evaluator-numeric-u5-scalar.test.ts` for the explicit pinning.

#### Scenario: dispatch order does not regress legacy types

- GIVEN the full U1 and U2 evaluator regression suites
- WHEN executed after this change
- THEN every test passes without modification (proves the structured branch is additive, not replacing)

### Requirement: Structured Submissions Respect Configuration Error Semantics

When the malformed data is the EXPECTED spec (caught at load by `content-loaders.ts`), the evaluator MUST NOT be reachable for that exercise; loading fails first. When the malformed data is the SUBMITTED string (caught at parse/normalize time inside `evaluateAnswer`), the evaluator MUST return `incorrect` with feedback, NOT `configuration_error`. This preserves the existing distinction: configuration errors signal broken content, not student mistakes.

#### Scenario: malformed expected never reaches the evaluator

- GIVEN a structured exercise with a malformed expected spec
- WHEN the catalog loads
- THEN loading fails before any `evaluateAnswer` call
- AND no runtime student answer can ever produce a `configuration_error` for that exercise

#### Scenario: malformed submission is incorrect with feedback

- GIVEN a well-formed structured exercise
- WHEN a student submits `{"v":1,"kind":"pi-rational"}` (missing fields)
- THEN result is `correct: false`
- AND feedback explains the missing fields without revealing the expected answer

### Requirement: Polynomial Equivalence Rules

The polynomial evaluator MUST apply these equivalence rules:

| Rule | Example |
|------|---------|
| Expanded ≡ factored | `(x-2)(x-3) ≡ x² - 5x + 6` |
| Sign flip | `-P(x) ≡ 0 - P(x)` |
| Integer scaling | `2·P(x) ≡ P(x) + P(x)` |
| Factor commutativity | `(x-2)(x+3) ≡ (x+3)(x-2)` |

The evaluator MUST reject: `1/0`, undefined forms, negative root under even index.

#### Scenario: U2-EVAL-006 — Factor commutativity

- GIVEN expectedAnswer `"(x-2)(x+3)"` and response `"(x+3)(x-2)"`
- WHEN evaluated
- THEN the result is `correct: true`

#### Scenario: U2-EVAL-007 — Undefined form rejected

- GIVEN a response containing division by zero
- WHEN attempting to parse
- THEN `PolynomialParseError` or `UnsupportedPolynomialFormError` is thrown

### Requirement: Telemetry Compatibility

Each U2 evaluation MUST emit the same telemetry as U1: `evaluationTimeMs`, `errorTags` (if incorrect), `partialCredit` (if applicable). The `EvaluationResult` format MUST NOT change.

#### Scenario: U2-EVAL-008 — Consistent telemetry

- GIVEN a U2 evaluation
- WHEN the result is inspected
- THEN it includes the same fields as a U1 evaluation

### Requirement: Unit 1 Regression Safety

U1 evaluators MUST NOT be modified. A regression test MUST exist that runs all U1 evaluator tests on the new build and confirms they still pass.

#### Scenario: U2-EVAL-009 — U1 regression

- GIVEN the full U1 evaluator test suite
- WHEN executed after U2 changes
- THEN all U1 tests pass without modifications

---

## Unit 2 Factorizacion Evaluation Paths (from unit-2-factorizacion-slice)

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
