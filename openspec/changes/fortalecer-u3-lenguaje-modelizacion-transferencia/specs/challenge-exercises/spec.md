# Delta for challenge-exercises

## MODIFIED Requirements

### Requirement: Pilot Skill Challenge Coverage

Every U1+U2 pilot skill MUST have 2 challenges. The 3 pre-existing (`complejos`, `valor_absoluto`, `ecuaciones_fraccionarias`) MUST keep their 2 and MUST NOT be doubled. Expansion adds 2 to each of the remaining 12 pilot skills (5 U1 + 7 U2). For PR 2, Unidad 3 MUST add at least 2 modeling-and-transfer challenges covering algebraic setup, multi-relation reasoning, verification, and contextual interpretation.
(Previously: challenge coverage applied only to U1+U2 pilot skills and did not require U3 challenges.)

| Set | Count | Source |
|-----|-------|--------|
| Pre-existing U1/U2 (3) | 2 each | shipped, untouched |
| Expansion U1/U2 (12) | 2 each | Batches A–D |
| U3 modeling transfer | at least 2 | PR 2 |

#### Scenario: uncovered skill reaches 2

- GIVEN `mat.u2.mcm_mcd_polinomios` has zero challenges before Batch D
- WHEN Batch D appends `desafio-01` and `desafio-02`
- THEN `queryChallengesBySkill("mat.u2.mcm_mcd_polinomios")` returns 2

#### Scenario: covered skill stays at 2

- GIVEN `mat.u1.complejos` has 2 challenges before this change
- WHEN any batch of this expansion lands
- THEN `queryChallengesBySkill("mat.u1.complejos")` STILL returns 2

#### Scenario: U3 modelización receives transfer challenges

- GIVEN Unit 3 has base modeling practice
- WHEN PR 2 challenge coverage is validated
- THEN at least 2 U3 challenges exist for modeling and transfer
- AND they are separate from base practice exercises

## ADDED Requirements

### Requirement: PR 2 — U3 integrative challenge transfer

Los desafíos U3 MUST evaluar transferencia tipo examen mediante problemas integradores con más de una relación, planteo justificable, resolución, verificación e interpretación contextual. El impacto pedagógico MUST aportar evidencia de madurez del alumno para el docente, no solo repetición de ejercicios base.

#### Scenario: El alumno resuelve un desafío con dos relaciones

- Given un desafío U3 con dos condiciones relevantes
- When el alumno identifica el planteo correcto y resuelve
- Then el sistema valida la coherencia entre relaciones, ecuación y respuesta
- And muestra feedback sobre la transferencia desde el enunciado

#### Scenario: El alumno justifica un planteo incorrecto

- Given un desafío que pide justificar el modelo elegido
- When el alumno selecciona una justificación incompatible con el enunciado
- Then el sistema rechaza el desarrollo
- And explica qué relación del texto fue usada incorrectamente

### Requirement: PR 2 — U3 challenge development validation

Cada desafío U3 MUST validar no solo la opción final, sino también evidencia mínima del desarrollo: incógnita, relación modelada, ecuación o inecuación, y verificación contextual. La validación MAY ser por opciones estructuradas; MUST NOT depender de respuesta libre simbólica frágil.

#### Scenario: Resultado correcto con desarrollo incoherente

- Given un desafío U3 con respuesta numérica coincidente por azar
- When el desarrollo seleccionado no corresponde al enunciado
- Then el sistema marca la respuesta como incorrecta o incompleta
- And prioriza feedback sobre planteo y verificación

#### Scenario: Desarrollo correcto con error de cálculo

- Given un desafío U3 con planteo correcto y cálculo final incorrecto
- When el alumno responde
- Then el sistema distingue error operativo de error de modelización
- And recomienda revisar la resolución sin invalidar el planteo
