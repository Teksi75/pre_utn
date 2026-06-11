# Exploration: unit-2-factorizacion-slice

> **Status:** Complete
> **Date:** 2026-06-10
> **Depends on:** unit-2-pedagogical-slice (archivado), polynomial-evaluator-input-validation (bugfix, archivado), UNIDAD2_matemática.pdf (caps 12-13)

---

## 1. Resumen del alcance

La Unidad 2 del material canónico de UTN Mendoza dedica sus capítulos 12 y 13 (páginas 9 a 14 del PDF) a la factorización de polinomios y al teorema de Gauss para factorización con raíces racionales. Estos temas representan el corazón algebraico de la unidad: donde convergen todas las herramientas construidas en los capítulos 1 a 11 (definiciones, operaciones, Ruffini, teorema del resto) para aplicarse a un objetivo concreto: descomponer polinomios en factores irreducibles.

El slice anterior (`unit-2-pedagogical-slice`, archivado con 3 PRs y 1267 tests) implementó los primeros 3 skills de U2: `polinomios_basico`, `operaciones_polinomios` y `ruffini_resto`. La infraestructura está operativa: el evaluador polinómico (`polynomial-evaluator.ts`) soporta formas factorizadas, expandidas y arreglos de coeficientes con equivalencia vía expansión y comparación de coeficientes. La taxonomía de errores ya contiene 6 etiquetas `u2_*`, incluyendo `u2_factorizacion_incompleta`. Los loaders de contenido U2, los modelos de teoría/ejemplos/feedback y el flujo de práctica guiada están verificados y funcionando.

Este slice implementa los 2 skills restantes de la cadena principal de U2: `mat.u2.factorizacion` (7 casos de factoreo) y `mat.u2.gauss` (teorema de Gauss para raíces racionales). La densidad de factorización (7 casos canónicos) es el principal desafío pedagógico y de scope del slice.

---

## 2. Mapa de temas

### 2.1 Referencia canónica

| Tema canónico | Cap. PDF | Páginas | Conceptos clave | Prerrequisito U2 ya implementado |
|---|---|---|---|---|
| Reconstrucción a partir de raíces | 12 | 9 | Polinomio como producto (x − raíz), coeficiente principal | ruffini_resto |
| Factor común | 13 | 9–10 | Extraer factor repetido en todos los términos | operaciones_polinomios |
| Factor común por grupos | 13 | 10 | Agrupar términos con factor común parcial | factor común |
| Trinomio cuadrado perfecto | 13 | 10–11 | Reconocer a² ± 2ab + b² = (a ± b)² | productos notables (operaciones) |
| Cuatrinomio cubo perfecto | 13 | 11 | Reconocer a³ ± 3a²b + 3ab² ± b³ = (a ± b)³ | productos notables |
| Diferencia de cuadrados | 13 | 11–12 | a² − b² = (a − b)(a + b) | productos notables |
| Suma/diferencia de potencias de igual grado | 13 | 12–13 | aⁿ ± bⁿ según paridad de n | Ruffini, teorema del resto |
| Trinomio de segundo grado | 13 | 13–14 | ax² + bx + c → buscar p, q tales que p+q=b y p·q=ac | operaciones, Ruffini |
| Teorema de Gauss | 12+13 | 9, 14 | Raíces racionales p/q con p\|a₀ y q\|aₙ | ruffini_resto, factorización |

### 2.2 Mapeo a skills existentes

| Skill ID | Temas canónicos | Prerrequisitos declarados | Ejercicios existentes |
|---|---|---|---|
| `mat.u2.factorizacion` | 7 casos de factoreo (cap. 13, págs. 9–14) | `mat.u2.operaciones_polinomios` | 1 (`ex.u2.factorizacion.1` — MC, trinomio 2do grado, dif. 2) |
| `mat.u2.gauss` | Reconstrucción + teorema de Gauss (caps. 12+13, págs. 9, 14) | `mat.u2.ruffini_resto` | 0 (el placeholder `ex.u2.gauss.1` fue reubicado a `mat.u3.sistemas` en el slice anterior) |

### 2.3 Volumen estimado de ejercicios

| Skill | Ejercicios mínimos | Existentes (aprovechables) | Nuevos a crear |
|---|---|---|---|
| factorizacion | 6–8 (los 7 casos + combinaciones) | 1 (aprovechable: trinomio 2do grado) | 5–7 |
| gauss | 3–4 | 0 | 3–4 |
| **Total** | **9–12** | **1** | **8–11** |

### 2.4 Contexto: el ejercicio existente `ex.u2.factorizacion.1`

```json
{
  "id": "ex.u2.factorizacion.1",
  "skillId": "mat.u2.factorizacion",
  "type": "multiple-choice",
  "difficulty": 2,
  "prompt": "Factoriza x² - 5x + 6",
  "expectedAnswer": "(x - 2)(x - 3)",
  "options": ["(x - 2)(x - 3)", "(x - 2)(x + 3)", "(x + 2)(x - 3)", "(x + 2)(x + 3)"],
  "commonErrorTags": [],
  "pedagogicalNote": "Busca dos números que sumen -5 y multipliquen 6: -2 y -3."
}
```

Este ejercicio es pedagógicamente válido (trinomio de segundo grado) pero no tiene error tags asignados. Debería declarar al menos `u2_factorizacion_incompleta` (aunque para este caso el trinomio ya está completamente factorizado, el tag aplica más a ejercicios con factor común previo) y posiblemente un nuevo tag `u2_signo_factorizacion` (los distractores son variantes de signo). Se aprovecha como ejercicio 1 del nuevo catálogo de factorización.

---

## 3. Los 7 casos de factoreo

Cada caso se lista con su nombre canónico, referencia al PDF, dificultad estimada (1–4), y un ejemplo representativo.

| # | Caso | PDF (cap. 13) | Dificultad | Ejemplo |
|---|---|---|---|---|
| 1 | **Factor común** | pág. 9–10 | 1 | 6x³ + 4x² − 2x = 2x(3x² + 2x − 1) |
| 2 | **Factor común por grupos** | pág. 10 | 2 | ax + ay + bx + by = (a + b)(x + y) |
| 3 | **Trinomio cuadrado perfecto** | pág. 10–11 | 2 | x² + 6x + 9 = (x + 3)² |
| 4 | **Cuatrinomio cubo perfecto** | pág. 11 | 3 | x³ + 6x² + 12x + 8 = (x + 2)³ |
| 5 | **Diferencia de cuadrados** | pág. 11–12 | 2 | x² − 25 = (x − 5)(x + 5) |
| 6 | **Suma/resta de potencias de igual grado** | pág. 12–13 | 3 | x³ + 8 = (x + 2)(x² − 2x + 4) |
| 7 | **Trinomio de segundo grado** | pág. 13–14 | 2–3 | 6x² + 7x + 2 = (2x + 1)(3x + 2) |

**Nota pedagógica**: Los casos 1, 3, 5 y 7 son los más frecuentes en ejercicios de ingreso. Los casos 2, 4 y 6 son menos frecuentes pero conceptualmente importantes. El ejercicio existente `ex.u2.factorizacion.1` cubre el caso 7 (trinomio de segundo grado con a=1).

---

## 4. Teorema de Gauss para factorización con raíces racionales

### 4.1 Enunciado

Sea P(x) = aₙxⁿ + aₙ₋₁xⁿ⁻¹ + ... + a₁x + a₀ un polinomio con coeficientes enteros, aₙ ≠ 0, a₀ ≠ 0. Si p/q es una raíz racional de P(x) expresada en forma irreducible (fracción simplificada), entonces:

- **p** (numerador) divide al término constante a₀
- **q** (denominador) divide al coeficiente principal aₙ

### 4.2 Algoritmo

1. Listar todos los divisores de a₀ (posibles valores de p)
2. Listar todos los divisores positivos de aₙ (posibles valores de q)
3. Formar todas las fracciones irreducibles p/q (con p positivo y negativo)
4. Evaluar P(x) en cada candidato p/q usando Ruffini o sustitución directa
5. Los candidatos para los que P(p/q) = 0 son raíces
6. Por cada raíz r encontrada, factorizar (x − r) del polinomio (división por Ruffini)
7. Repetir el proceso con el cociente resultante hasta agotar las raíces racionales o llegar a un polinomio irreducible

### 4.3 Ejemplo trabajado

**Factorizar** P(x) = 2x³ + 3x² − 8x + 3

1. a₀ = 3 → divisores de 3: {±1, ±3} (posibles p)
2. aₙ = 2 → divisores de 2: {1, 2} (posibles q)
3. Candidatos p/q: ±1, ±3, ±1/2, ±3/2
4. Evaluar: P(1) = 2+3−8+3 = 0 ✓ (raíz)
5. Ruffini con a=1 sobre [2, 3, −8, 3] → cociente [2, 5, −3], resto 0
6. P(x) = (x − 1)(2x² + 5x − 3)
7. Factorizar 2x² + 5x − 3 (trinomio de 2do grado): (2x − 1)(x + 3)
8. **Factorización completa**: P(x) = (x − 1)(2x − 1)(x + 3)

### 4.4 Relación con los otros skills

El teorema de Gauss depende de:
- **ruffini_resto**: para evaluar P(p/q) eficientemente y dividir por (x − r)
- **factorizacion**: porque después de encontrar raíces con Gauss, el cociente resultante puede requerir casos de factoreo adicionales (trinomio, diferencia de cuadrados, etc.)

La dependencia `mat.u2.gauss ← mat.u2.ruffini_resto` ya está declarada en `skill-catalog.ts`. El skill `mat.u2.gauss` NO declara dependencia directa de `mat.u2.factorizacion` — esto es correcto porque Gauss puede usarse ANTES de la factorización completa (encuentra raíces que luego habilitan factorizar). Sin embargo, en la práctica pedagógica Gauss se enseña como el "último recurso" de factorización, cuando ningún caso de factoreo aplica directamente a un polinomio de grado ≥ 3.

---

## 5. Mapeo de skills y prerrequisitos

| Skill | Prerrequisitos directos | Prerrequisitos pedagógicos (implícitos) | Estado actual |
|---|---|---|---|
| `mat.u2.factorizacion` | `mat.u2.operaciones_polinomios` | Ruffini para verificar factores; productos notables para TCP, diferencia de cuadrados | ✅ Declarado en `SKILL_DEPENDENCIES`. Tiene 1 ejercicio placeholder. Sin teoría/ejemplos/feedback. |
| `mat.u2.gauss` | `mat.u2.ruffini_resto` | Divisibilidad numérica (U1); factorización para completar | ✅ Declarado en `SKILL_DEPENDENCIES`. Sin ejercicios. Sin teoría/ejemplos/feedback. |

**Cadena de dependencia completa**:

```
polinomios_basico → operaciones_polinomios → ruffini_resto → gauss
                                                  ↘ factorizacion
```

La cadena tiene un fork: después de `operaciones_polinomios`, el alumno puede tomar `ruffini_resto` (prerrequisito de gauss) o `factorizacion`. Ruffini es prerrequisito PEDAGÓGICO de factorización (aunque no declarado como dependencia formal en el catálogo) porque la verificación de factores y la división sintética se usan constantemente.

---

## 6. Objetivos pedagógicos (taxonomía de Bloom)

| Nivel Bloom | Objetivo — El alumno debe ser capaz de... | Skills relacionados |
|---|---|---|
| **Recordar** | Enunciar los 7 casos de factoreo y reconocer sus patrones. Enunciar el teorema de Gauss. | factorizacion, gauss |
| **Comprender** | Explicar por qué un polinomio es reducible o irreducible. Interpretar qué significa que p/q sea raíz racional. | factorizacion, gauss |
| **Aplicar** | Aplicar factor común, diferencia de cuadrados, TCP y trinomio de 2do grado a polinomios dados. Encontrar candidatos de Gauss y evaluar P(p/q). | factorizacion, gauss |
| **Analizar** | Dado un polinomio, identificar qué caso(s) de factoreo aplicar y en qué orden. Distinguir entre trinomio cuadrado perfecto y trinomio de segundo grado. | factorizacion |
| **Evaluar** | Verificar una factorización expandiendo el producto y confirmando equivalencia. Descartar candidatos de Gauss que no son raíces. Validar que la factorización está completa. | factorizacion, gauss |
| **Crear** | Factorizar completamente un polinomio combinando múltiples casos (factor común + diferencia de cuadrados, Gauss + trinomio). | factorizacion, gauss |

---

## 7. Propuesta de slice

### 7.1 Recomendación: slice unificado (factorización + Gauss, 2–3 PRs)

**Skills**: `mat.u2.factorizacion` + `mat.u2.gauss`

**Justificación**:

1. **Unidad pedagógica indivisible**: El teorema de Gauss (cap. 12 del PDF) y los 7 casos de factoreo (cap. 13) se enseñan como una unidad en el material canónico. El PDF presenta la reconstrucción a partir de raíces (cap. 12) como introducción natural a la factorización, y cierra con Gauss como herramienta para polinomios de grado ≥ 3. Separarlos rompería el hilo pedagógico.

2. **Gauss sin factorización es incompleto**: El algoritmo de Gauss encuentra raíces racionales, pero el objetivo final es FACTORIZAR el polinomio. Sin los casos de factoreo, Gauss queda como un procedimiento mecánico sin propósito. La combinación permite ejercicios del tipo "factorizar completamente usando Gauss + trinomio/diferencia de cuadrados".

3. **Volumen manejable con 2–3 PRs**: Estimación ~500–700 líneas (según archive-report del slice anterior, §6). Dividido en: PR-1 (extensión de error taxonomy + tagging, ~150 líneas), PR-2 (contenido JSON + ejercicios, ~350 líneas), PR-3 (QA + regresión, ~100 líneas). La estimación es alta pero no excede la capacidad del proceso (el slice anterior entregó 930 líneas en 3 PRs exitosamente).

4. **El evaluador ya está listo**: El `polynomial-evaluator` (bug-fixed, 1273 tests pasando) ya soporta formas factorizadas, expandidas y arreglos. La guarda de routing en `evaluator/index.ts` ya deriva TODOS los ejercicios `mat.u2.*` con type=symbolic al evaluador polinómico. No se necesita nuevo código de dominio para el evaluador.

5. **Solo 1 ejercicio existente que rescatar**: `ex.u2.factorizacion.1` (trinomio de 2do grado) se reutiliza. Se crean 7–10 ejercicios nuevos. Es menos trabajo de creación de ejercicios que el slice anterior (que creó 12 ejercicios de cero).

6. **Completa la Unidad 2**: Con este slice, los skills principales de U2 quedan terminados. Solo quedarían `mcm_mcd_polinomios` y `ecuaciones_fraccionarias` para un futuro slice U2-Aplicaciones.

### 7.2 Qué queda para el slice U2-Aplicaciones

| Slice futuro | Skills | Depende de |
|---|---|---|
| U2-Aplicaciones | mcm_mcd_polinomios + ecuaciones_fraccionarias | factorizacion (del slice actual) |

---

## 8. Plan de reutilización de componentes

### 8.1 Capacidades que se REUTILIZAN sin modificación

| Componente | Archivo/Spec | Uso en este slice |
|---|---|---|
| `polynomial-evaluator` | `src/domain/evaluator/polynomial-evaluator.ts` | **REUSE** — parseo de formas factorizadas y expandidas, equivalencia. Es el evaluador principal para ejercicios simbólicos de factorización. |
| `evaluator routing guard` | `src/domain/evaluator/index.ts` (línea 66) | **REUSE** — el guard `exercise.type === "symbolic" && /^mat\.u2\./.test(exercise.skillId)` ya cubre todos los skills U2, incluyendo factorizacion y gauss. |
| `theory-content` | `specs/theory-content/spec.md` | **REUSE** — mismo schema de TheoryNode. |
| `worked-examples` | `specs/worked-examples/spec.md` | **REUSE** — mismo schema de WorkedExample. |
| `pedagogical-feedback` | `specs/pedagogical-feedback/spec.md` | **REUSE** — mismo schema de FeedbackMapping. |
| `guided-practice` | `specs/guided-practice/spec.md` | **REUSE** — el flujo de práctica guiada y `usePracticeFlow` sin cambios. |
| `math-exercise-model` | `specs/math-exercise-model/spec.md` | **REUSE** — tipos `multiple-choice`, `numerical`, `symbolic` cubren todos los ejercicios. |
| `math-render-safety` | `specs/math-render-safety/spec.md` | **REUSE** — KaTeX para renderizar expresiones polinómicas factorizadas. |
| `persistencia + métricas` | `src/domain/progress/`, `src/lib/practice-progress.ts` | **REUSE** — sin cambios. |

### 8.2 Capacidades que se EXTIENDEN

| Componente | Qué se extiende | Justificación |
|---|---|---|
| `math-error-taxonomy` | Agregar 2–3 etiquetas `u2_*` en `src/domain/error-taxonomy/index.ts` | Factorización requiere tags específicos: `u2_signo_factorizacion` (error de signo al elegir los factores), `u2_factor_comun_incompleto` (extrae factor común pero no el máximo), `u2_caso_incorrecto` (aplica TCP donde es diferencia de cuadrados). El tag `u2_factorizacion_incompleta` ya existe. |
| `math-answer-evaluator` (error-tagging) | Agregar 2–3 detectores en `src/domain/evaluator/error-tagging.ts` | Los nuevos tags requieren funciones de detección. `u2_factorizacion_incompleta` ya tiene detector (`isU2IncompleteFactorError`). |
| `math-exercise-catalog` | Agregar ejercicios a `exercises.json`; crear/extender `theory/unit-2.json`, `examples/unit-2.json`, `feedback/unit-2.json` | Extensión de contenido, no de modelo. Los archivos JSON de U2 ya existen; se agregan nodos/ejemplos/feedback para los 2 nuevos skills. |
| `content-loaders` | Agregar registro para nuevos JSON si se crean archivos separados | Si se crean archivos nuevos (ej. `unit-2-factorizacion.json`), registrar en `REGISTRY`. Alternativa: extender los JSON existentes con nuevos nodos (recomendado — más simple). |

### 8.3 Capacidades NUEVAS — NINGUNA

A diferencia del slice anterior que requirió crear `polynomial-evaluator` desde cero, este slice NO requiere nuevos módulos de dominio. La infraestructura de evaluación polinómica ya existe y funciona. Todo el trabajo es de contenido y extensión de la taxonomía de errores.

### 8.4 Capacidades que NO se necesitan

- `cas-externo`: innecesario — el polynomial-evaluator ya maneja equivalencia.
- `factorización-inversa`: innecesario — el alumno no necesita escribir factorizaciones como texto libre; los ejercicios son MC o usan el evaluador para comparar equivalencia de formas factorizadas vía symbolic.
- `nuevo-tipo-ejercicio`: innecesario — los tipos existentes cubren todos los ejercicios de factorización.

---

## 9. Riesgos

### 9.1 Riesgos pedagógicos

| Riesgo | Severidad | Mitigación |
|---|---|---|
| **Sobrecarga cognitiva**: 7 casos de factoreo en un solo skill puede abrumar al alumno. Cada caso tiene su propio patrón de reconocimiento y procedimiento. | **Alta** | Dividir el contenido del TheoryNode en sub-bloques por caso, con progresión clara. Los ejercicios deben forzar al alumno a IDENTIFICAR el caso antes de aplicarlo. Considerar separar en 2 bloques dentro del mismo skill: casos básicos (1, 3, 5, 7) primero, avanzados (2, 4, 6) después. |
| **Confusión entre casos similares**: TCP vs. trinomio de 2do grado; diferencia de cuadrados vs. suma de potencias. | **Media** | Ejercicios de "identificar el caso" (MC) ANTES de "factorizar". Los distractores deben representar confusión entre casos (ej: opciones que asumen TCP cuando es trinomio de 2do grado). |
| **Factorización incompleta**: el alumno aplica factor común pero no verifica si el factor restante es factorizable. | **Alta** | El error tag `u2_factorizacion_incompleta` ya existe. Ejercicios diseñados específicamente para forzar factorización en múltiples pasos (ej: `2x³ − 8x = 2x(x² − 4) = 2x(x − 2)(x + 2)`). |
| **Gauss sin comprensión de divisibilidad**: el alumno memoriza el algoritmo p/q pero no entiende por qué p divide a a₀ y q divide a aₙ. | **Media** | El TheoryNode de gauss debe explicar el POR QUÉ, no solo el CÓMO. Incluir un WorkedExample con verificación explícita de cada candidato. |
| **Dependencia no declarada**: `factorizacion` depende pedagógicamente de `ruffini_resto` pero no está declarado como prerrequisito formal en `SKILL_DEPENDENCIES`. | **Media** | Evaluar si agregar `ruffini_resto` como prerrequisito de `factorizacion` en el catálogo. El `computeReadiness` bloquearía el acceso si Ruffini no está completo, forzando al alumno a seguir el orden correcto. |

### 9.2 Riesgos técnicos

| Riesgo | Severidad | Mitigación |
|---|---|---|
| **Polynomial-evaluator no soporta algunos formatos factorizados**: factores como `(x² + 1)` (grado > 1 dentro del factor) o `(2x + 1)` (coeficiente ≠ 1) podrían no parsearse correctamente. | **Media** | Verificar con tests que el parser soporta `(ax + b)` y factores de grado > 1. Si no los soporta, los ejercicios deben usar solo factores lineales con coeficiente 1 en x, o extenderse el parser antes de crear ejercicios. Revisar `parseFactored()` en `polynomial-evaluator.ts` línea 246. |
| **Combinatoria de Gauss explosiva**: para polinomios con a₀ y aₙ con muchos divisores (ej: a₀ = 60, aₙ = 12), los candidatos p/q pueden ser numerosos. | **Baja** | Los ejercicios de Gauss usarán polinomios con coeficientes pequeños (≤12) para mantener acotado el conjunto de candidatos. Esto es una decisión de diseño de ejercicios, no de código. |
| **Conflicto con `u2_signo_operacion` en factorización**: el tag actual de signo en operaciones podría dispararse incorrectamente en ejercicios de factorización donde el error es de otro tipo (ej: confundir `(x − 2)(x + 3)` con `(x + 2)(x − 3)` es un error de signo en la FACTORIZACIÓN, no en la operación). | **Media** | Crear un tag específico `u2_signo_factorizacion` que capture errores de signo al elegir los factores. El detector debe activarse solo en contexto de factorización (MC con prompt que contiene "factoriza"). |
| **Volumen de contenido JSON**: 1–2 TheoryNodes + 2–4 WorkedExamples + 3–5 FeedbackMappings + 8–11 ejercicios nuevos. Aproximadamente 300–500 líneas de JSON. | **Baja** | Es contenido, no código. El slice anterior manejó ~250 líneas de JSON sin problemas. |

### 9.3 Riesgos de alcance

| Riesgo | Severidad | Mitigación |
|---|---|---|
| **Scope creep hacia casos avanzados**: los casos 2 (grupos), 4 (cuatrinomio) y 6 (potencias de igual grado) son más difíciles de ejercitar. Puede ser tentador agregar más ejercicios para "cubrirlos mejor". | **Media** | Límite estricto: 1–2 ejercicios por caso avanzado. Los casos básicos (1, 3, 5, 7) reciben más ejercicios por ser más frecuentes en el ingreso. |
| **Gauss se come el slice**: el algoritmo de Gauss es proceduralmente rico y puede generar muchos ejercicios interesantes. | **Baja** | Límite: 3–4 ejercicios de Gauss (1 MC, 1 numérico, 1–2 simbólico). Es un skill complementario, no el foco del slice. |
| **El slice U2-Aplicaciones queda colgado**: si este slice es el último de U2 en implementarse antes de un hiato largo, `mcm_mcd_polinomios` y `ecuaciones_fraccionarias` quedan sin contenido. | **Baja** | Documentado. No es un riesgo del slice presente sino del roadmap. |

---

## 10. Preguntas abiertas

1. **¿Agregar `ruffini_resto` como prerrequisito formal de `mat.u2.factorizacion`?** Actualmente el catálogo declara `factorizacion ← operaciones_polinomios`. Pero Ruffini y el teorema del resto son herramientas esenciales para verificar factores. Agregar la dependencia forzaría al alumno a completar Ruffini antes de factorizar — pedagógicamente correcto, pero cambia el grafo de dependencias.

2. **¿Dividir `mat.u2.factorizacion` en dos sub-skills?** El slice anterior consideró esta posibilidad (exploration §6.1). Alternativas:
   - (a) Mantener un solo skill con 7 casos — más simple, menos cambios de modelo.
   - (b) Dividir en `factorizacion_basica` (casos 1, 3, 5, 7) y `factorizacion_avanzada` (casos 2, 4, 6, Gauss) — mejor progresión pedagógica, pero requiere cambiar el catálogo de skills.
   - (c) Mantener factorización unificada y separar Gauss como ya está — recomendado.

3. **¿El polynomial-evaluator soporta `(2x + 1)(x − 3)` (coeficiente ≠ 1 en el factor)?** Verificar antes de diseñar ejercicios. Si no lo soporta, limitar los ejercicios simbólicos a factores con coeficiente 1 en x.

4. **¿Cuántos ejercicios por caso de factoreo?** El patrón del slice anterior fue 4 ejercicios por skill. Para factorización con 7 casos, ¿1 ejercicio por caso (7) + 1 ejercicio combinado (1) = 8? ¿O 4 ejercicios en total para todo el skill? La distribución más razonable: 6–8 ejercicios, priorizando los casos más frecuentes en el ingreso (factor común, diferencia de cuadrados, TCP, trinomio de 2do grado).

5. **¿El error tag `u2_factorizacion_incompleta` existente es suficiente, o necesitamos uno nuevo para "factor común no máximo"?** Ejemplo: factorizar `4x² − 16` como `2(2x² − 8)` en vez de `4(x² − 4) = 4(x − 2)(x + 2)`. Esto es un error diferente a "factorización incompleta" — es "factor común no máximo".

6. **¿Ejercicios de Gauss: solo numéricos (encontrar raíces racionales) o también simbólicos (factorizar completamente)?** Los ejercicios simbólicos usarían el polynomial-evaluator y permitirían respuestas factorizadas. Los numéricos pedirían "encontrar todas las raíces racionales de P(x)". Una combinación de ambos es ideal.

---

## 11. Alternativas consideradas

### Alternativa A: Dos sub-slices (factorización básica → factorización avanzada + Gauss)

**Descripción**: Dividir en dos cambios separados. Slice 1: 4 casos básicos (factor común, TCP, diferencia de cuadrados, trinomio de 2do grado). Slice 2: 3 casos avanzados (grupos, cuatrinomio, potencias) + Gauss.

| Pros | Contras |
|---|---|
| Cada slice es más pequeño (~300 líneas, 1 PR c/u) | Rompe la unidad pedagógica del capítulo 13 del PDF |
| Menor riesgo de scope creep por slice | Requiere 2 ciclos SDD completos (propuesta, spec, design, tasks, apply, verify, archive × 2) |
| El alumno puede practicar factorización básica antes que avanzada | Gauss queda en el segundo slice, demorando la herramienta más potente |
| Mejor para el presupuesto de revisión (400 líneas) | Mayor overhead de proceso SDD |

**Veredicto**: Viable si el usuario prefiere slices más pequeños y frecuentes. No es la recomendación principal porque duplica el overhead de proceso SDD.

### Alternativa B: Slice mínimo — solo factorización (sin Gauss)

**Descripción**: Implementar solo `mat.u2.factorizacion` (7 casos). Dejar Gauss para un slice posterior independiente.

| Pros | Contras |
|---|---|
| Foco exclusivo en factorización | Gauss sin factorización previa es incoherente pedagógicamente |
| ~400 líneas, 1 PR | El PDF presenta Gauss como parte del capítulo de factorización |
| Menos riesgo de scope creep | El alumno tiene factorización pero no puede factorizar polinomios de grado ≥ 3 con coeficientes no triviales |

**Veredicto**: Pedagógicamente inferior. Gauss es el cierre natural de la factorización. Separarlos crea un vacío: el alumno aprende los 7 casos pero no tiene herramienta para polinomios que no encajan en ningún caso.

### Alternativa C: Slice unificado con 3 skills nuevos (factorización + gauss + mcm_mcd)

**Descripción**: Agregar también `mcm_mcd_polinomios` que depende de factorización.

| Pros | Contras |
|---|---|
| Termina 3 skills en un solo ciclo | ~700–900 líneas, excede el presupuesto de revisión |
| mcm_mcd es aplicación directa de factorización | mcm_mcd requiere teoría y ejercicios adicionales que diluyen el foco en factorización |
| | El slice anterior ya mostró que 3 skills es el máximo manejable (y esos eran skills más simples) |

**Veredicto**: Rechazada. mcm_mcd es conceptualmente más simple que factorización pero requiere su propio TheoryNode, ejemplos y ejercicios. Agregarlo aquí excede el presupuesto y diluye el foco.

---

## 12. Dependencias y supuestos

### 12.1 Dependencias

- **Slice anterior (`unit-2-pedagogical-slice`)**: Completado y archivado. Los 3 skills base (polinomios_basico, operaciones_polinomios, ruffini_resto) están implementados con 12 ejercicios, 3 TheoryNodes, 6 WorkedExamples y 6 FeedbackMappings.
- **Bugfix `polynomial-evaluator-input-validation`**: Completado y mergeado. El polynomial-evaluator está estable (1273 tests, 3 bugs corregidos: trailing content, multivariate-before-transcendental, unhandled throws en routing guard).
- **Polynomial-evaluator**: Soporta formas factorizadas con factores `(x ± a)` y constantes iniciales. El parseo de `(ax + b)` con a ≠ 1 debe verificarse antes de diseñar ejercicios que usen ese formato.
- **Error taxonomy**: Ya contiene `u2_factorizacion_incompleta` y otras 5 etiquetas U2. Los nuevos tags deben seguir la convención `u2_*`.
- **Evaluator routing guard**: La guarda `exercise.type === "symbolic" && /^mat\.u2\./.test(exercise.skillId)` ya cubre factorizacion y gauss sin cambios.
- **Catálogo de skills**: `SKILL_DEPENDENCIES` ya declara `factorizacion ← operaciones_polinomios` y `gauss ← ruffini_resto`.

### 12.2 Supuestos

1. **El polynomial-evaluator soporta factores con coeficiente ≠ 1**: `(2x + 1)(x − 3)` debe parsearse correctamente. Si no, los ejercicios simbólicos se limitan a factores con coeficiente 1 en x, y los ejercicios con coeficientes ≠ 1 usan MC.

2. **Los 7 casos de factoreo se enseñan como UN solo skill `mat.u2.factorizacion`**, con sub-bloques dentro del TheoryNode. No se crean sub-skills separados.

3. **Los ejercicios de factorización no usan texto libre**: todas las respuestas son MC (elegir la factorización correcta), numerical (encontrar el valor de una raíz) o symbolic (escribir el polinomio factorizado y que el evaluador verifique equivalencia). Esto cumple con AGENTS.md.

4. **El contenido de teoría para factorización se escribe en español neutro/profesional**, siguiendo el tono del material canónico de UTN.

5. **El patrón de 4 ejercicios por skill del slice anterior se flexibiliza**: factorización recibe 6–8 ejercicios (por la densidad de 7 casos), gauss recibe 3–4.

6. **Los archivos JSON existentes de U2 se extienden** (no se crean archivos nuevos). `theory/unit-2.json` recibe 2 nuevos TheoryNodes, `examples/unit-2.json` recibe 2–4 nuevos WorkedExamples, `feedback/unit-2.json` recibe 3–5 nuevos FeedbackMappings.

7. **El slice se entrega en 2 PRs encadenados** (estimado en ~500–700 líneas). Si la estimación real supera 800 líneas, se consideran 3 PRs como el slice anterior.

---

## 13. Estado actual del código (inventario)

### 13.1 Archivos existentes con contenido relevante

| Archivo | Contenido relevante | Estado |
|---|---|---|
| `src/domain/evaluator/polynomial-evaluator.ts` | parsePolynomial (array, expanded, factored), expand, polynomialsEqual, areEquivalent | ✅ Bug-fixed, 1273 tests |
| `src/domain/evaluator/index.ts` | Routing guard para U2 simbólico (línea 66) | ✅ Cubre factorizacion y gauss |
| `src/domain/error-taxonomy/index.ts` | 6 tags `u2_*`, incluyendo `u2_factorizacion_incompleta` | ✅ 6/6 tags U2 |
| `src/domain/evaluator/error-tagging.ts` | `isU2IncompleteFactorError` (línea 413) | ✅ Detector existente |
| `src/domain/models/skill-catalog.ts` | `factorizacion ← operaciones_polinomios`, `gauss ← ruffini_resto` | ✅ Declarado |
| `content/matematica/exercises.json` | `ex.u2.factorizacion.1` (trinomio 2do grado, MC, dif. 2) | ✅ Aprovechable |
| `content/matematica/theory/unit-2.json` | 3 TheoryNodes (sin factorización ni gauss) | ⚠️ Necesita 2 nodos nuevos |
| `content/matematica/examples/unit-2.json` | 6 WorkedExamples (sin factorización ni gauss) | ⚠️ Necesita 2–4 ejemplos nuevos |
| `content/matematica/feedback/unit-2.json` | 6 FeedbackMappings (incluye `u2_factorizacion_incompleta`) | ⚠️ Necesita 3–5 mappings nuevos |

### 13.2 Archivos que DEBEN crearse — NINGUNO

Todos los archivos necesarios ya existen. El trabajo es de extensión, no de creación.

### 13.3 Archivos que deben MODIFICARSE

| Archivo | Cambio |
|---|---|
| `src/domain/error-taxonomy/index.ts` | Agregar 2–3 etiquetas `u2_*` (factorización) |
| `src/domain/evaluator/error-tagging.ts` | Agregar 2–3 detectores para nuevos tags |
| `content/matematica/theory/unit-2.json` | Agregar 2 TheoryNodes (factorización + gauss) |
| `content/matematica/examples/unit-2.json` | Agregar 2–4 WorkedExamples de factorización y Gauss |
| `content/matematica/feedback/unit-2.json` | Agregar 3–5 FeedbackMappings para nuevos tags |
| `content/matematica/exercises.json` | Agregar 5–7 ejercicios de factorización + 3–4 de gauss |

### 13.4 Archivos que NO deben modificarse

| Archivo | Razón |
|---|---|
| `src/domain/evaluator/polynomial-evaluator.ts` | Estable, bug-fixed, sin cambios necesarios para este slice |
| `src/domain/evaluator/index.ts` | La guarda ya cubre factorizacion y gauss |
| `src/domain/models/skill-catalog.ts` | Dependencias ya declaradas correctamente |
| `src/domain/catalog/content-loaders.ts` | Los loaders ya registran unit-2; solo se extienden los JSON |

---

## 14. Análisis del polynomial-evaluator para factorización

### 14.1 Lo que SÍ soporta (verificado en el código)

- **Factores lineales con coeficiente 1 en x**: `(x - 2)`, `(x + 3)` → ✅ `extractFactor()` líneas 191–240
- **Factores con coeficiente numérico**: `(2x + 1)` → ✅ match2 (línea 220) soporta `ax + b`
- **Factores con formato "número + x"**: `(3 + 2x)` → ✅ match3 (línea 230)
- **Factor constante inicial**: `2(x - 1)(x + 2)` → ✅ `leadingConstMatch` (línea 253)
- **Conmutatividad**: `(x + 3)(x - 2)` ≡ `(x - 2)(x + 3)` → ✅ ambos expanden a `[1, 1, -6]`
- **Polinomio cero y constantes**: `0`, `5` → ✅
- **Rechazo de formas inválidas**: multivariable, trascendentes, exponentes racionales → ✅

### 14.2 Lo que NO soporta (por diseño)

- **Factores de grado > 1**: `(x² + 1)` — `extractFactor()` espera patrones lineales. Esto NO es un problema para el slice porque los factores en factorización de ingreso son típicamente lineales.
- **Factorización inversa**: el evaluador expande y compara, no factoriza. Para ejercicios donde la respuesta esperada es una factorización, se usa MC (el alumno elige entre opciones factorizadas).
- **Verificación de "factorización completa"**: el evaluador compara equivalencia, pero no verifica que la factorización sea COMPLETA (ej: `2(x² - 4)` es equivalente a `2x² - 8`, pero no está completamente factorizada). Esto se maneja con MC (las opciones incorrectas son factorizaciones incompletas) y con el error tag `u2_factorizacion_incompleta`.

### 14.3 Verificación necesaria antes de diseñar ejercicios

Ejecutar estos tests manualmente o agregarlos al suite:

```typescript
// ¿Soporta (2x + 1)(x - 3)?
parsePolynomial("(2x+1)(x-3)") // debe dar [2, -5, -3]

// ¿Soporta factor repetido?
parsePolynomial("(x-2)(x-2)") // debe dar [1, -4, 4]

// ¿Soporta 3 factores?
parsePolynomial("(x-1)(x+2)(x-3)") // debe dar [1, -2, -5, 6]
```

Si alguno falla, limitar los ejercicios simbólicos a formatos que sí funcionen, o extender el parser antes de crear ejercicios.

---

## 15. Etiquetas de error propuestas

### 15.1 Tag existente a reutilizar

| Tag | Descripción | Estado |
|---|---|---|
| `u2_factorizacion_incompleta` | El alumno factoriza parcialmente pero no continúa hasta factores irreducibles | ✅ Existe (taxonomía + detector) |
| `u2_signo_operacion` | Error de signo al operar (aplica a expansión de factores) | ✅ Existe |
| `u2_termino_semejante` | Error al combinar términos (aplica a expansión) | ✅ Existe |

### 15.2 Tags nuevos propuestos

| Tag | Descripción | Ejemplo |
|---|---|---|
| `u2_signo_factorizacion` | Error de signo al elegir los factores: escribe `(x + a)(x + b)` en vez de `(x − a)(x − b)` o viceversa | Factorizar x² − 5x + 6 como (x + 2)(x + 3) en vez de (x − 2)(x − 3) |
| `u2_factor_comun_incompleto` | Extrae un factor común pero no el máximo posible (deja un factor común remanente) | Factorizar 4x² − 16 como 2(2x² − 8) en vez de 4(x² − 4) = 4(x − 2)(x + 2) |
| `u2_caso_incorrecto` | Aplica un caso de factoreo donde no corresponde (ej: asume TCP donde es trinomio de 2do grado simple) | Factorizar x² + 5x + 6 como (x + 3)² (asume TCP, pero 2·3 = 6 ≠ 5, no es TCP) |

---

## 16. Listo para propuesta

**Sí** — La exploración es suficiente para lanzar `sdd-propose`. El slice es viable técnicamente (el polynomial-evaluator ya soporta los formatos necesarios, la infraestructura de U2 está operativa) y pedagógicamente coherente (factorización + Gauss forman una unidad didáctica indivisible en el material canónico).

El orquestador debe:
1. Confirmar el alcance: `mat.u2.factorizacion` + `mat.u2.gauss` en un solo slice (2 skills)
2. Confirmar si se agrega `ruffini_resto` como prerrequisito formal de `factorizacion` (pregunta abierta #1)
3. Confirmar si se mantiene un solo skill `factorizacion` o se divide en básico/avanzado (pregunta abierta #2)
4. Confirmar los nuevos tags de error: ¿`u2_signo_factorizacion`, `u2_factor_comun_incompleto`, `u2_caso_incorrecto`? (pregunta abierta #5)
5. Confirmar el volumen de ejercicios: 6–8 para factorización, 3–4 para gauss
6. Verificar que `parsePolynomial("(2x+1)(x-3)")` funciona antes de diseñar ejercicios simbólicos (pregunta abierta #3)
7. Lanzar `sdd-propose` con esta exploración como contexto

---

## SDD Result Envelope

**Status**: success
**Summary**: La factorización de polinomios (7 casos canónicos + teorema de Gauss) representa el corazón algebraico de la Unidad 2. El slice anterior dejó la infraestructura lista: polynomial-evaluator con soporte de formas factorizadas, routing guard para todos los skills U2, 6 error tags con detectores, y 3 skills base verificados con 1267 tests. Este slice implementa los 2 skills restantes de la cadena principal de U2: factorización y Gauss. No se requiere nuevo código de dominio — solo extensión de la taxonomía de errores (2–3 tags nuevos), contenido JSON (2 TheoryNodes, 2–4 WorkedExamples, 3–5 FeedbackMappings) y 8–11 ejercicios nuevos. El principal riesgo es la densidad pedagógica de 7 casos de factoreo en un solo skill, mitigable con sub-bloques dentro del TheoryNode y ejercicios de identificación de casos antes de factorización. El polynomial-evaluator debe verificarse para factores con coeficiente ≠ 1 antes de diseñar ejercicios simbólicos. Se recomienda slice unificado (factorización + Gauss) en 2 PRs encadenados (~500–700 líneas).
**Artifacts**: `openspec/changes/unit-2-factorizacion-slice/exploration.md`
**Next**: sdd-propose (definir alcance preciso, confirmar tags de error, verificar polynomial-evaluator con `(2x+1)(x-3)`)
**Risks**: (1) ALTA — sobrecarga cognitiva de 7 casos en un skill; (2) ALTA — factorización incompleta como error frecuente no detectable automáticamente en symbolic; (3) MEDIA — polynomial-evaluator podría no soportar factores con coeficiente ≠ 1.
**Skill Resolution**: paths-injected — 1 skill (sdd-explore)
