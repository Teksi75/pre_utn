# Exploration: unit-2-pedagogical-slice

> **Status:** Complete
> **Date:** 2026-06-10
> **Depends on:** unit-1-pedagogical-slice (infraestructura), canonical-math-pedagogy-map, UNIDAD2_matemática.pdf

---

## 1. Resumen del alcance

La Unidad 2 del material canónico de UTN Mendoza cubre **Polinomios y álgebra polinómica**. El PDF canónico (`UNIDAD2_matemática.pdf`, 16 páginas) presenta el contenido como un cuadernillo de actividades con definiciones guiadas, ejemplos resueltos y ejercicios para completar. El módulo abarca desde la definición de expresión algebraica hasta ecuaciones fraccionarias, pasando por todas las operaciones con polinomios, Ruffini, teorema del resto y factorización (7 casos más teorema de Gauss).

El proyecto ya tiene definidas 7 habilidades (`skillId`) para la Unidad 2 en `skill-catalog.ts` y 5 ejercicios placeholder en `exercises.json`, pero carece de teoría, ejemplos trabajados, feedback pedagógico y etiquetas de error para esta unidad. La infraestructura pedagógica construida en el slice de Unidad 1 (modelos `TheoryNode`, `WorkedExample`, motor de feedback, flujo de práctica guiada, persistencia, métricas) está lista para ser reutilizada. El desafío de U2 no es construir infraestructura, sino producir contenido pedagógico de calidad y garantizar que los evaluadores cubran los nuevos tipos de respuesta que requieren los ejercicios de polinomios.

---

## 2. Mapa de temas

### 2.1 Estructura del PDF canónico (16 páginas)

| # | Tema canónico | Páginas | Conceptos clave | Conocimiento previo asumido (U1) |
|---|---|---|---|---|
| 1 | Expresiones algebraicas | 3 | Término, coeficiente, variable, grado, clasificación (entera/racional/irracional) | Operaciones con reales, potenciación |
| 2 | Polinomio en una variable | 3–4 | Definición formal, coeficientes, términos, monomio/binomio/trinomio, grado, mónico | Conjuntos numéricos, notación de potencias |
| 3 | Reducción de términos semejantes | 4 | Suma algebraica de coeficientes, parte literal | Operaciones con reales |
| 4 | Valor numérico | 4 | Evaluación P(k), sustitución | Aritmética básica |
| 5 | Raíces de un polinomio | 4–5 | P(x) = 0, grado → máximo de raíces | Igualdades, resolución de ecuaciones simples |
| 6 | Polinomios ordenados y completos | 5 | Orden creciente/decreciente, completar con ceros | — |
| 7 | Polinomios idénticos | 5 | Igualdad de coeficientes término a término | Comparación de números reales |
| 8 | Polinomios opuestos | 6 | Coeficientes opuestos, polinomio nulo | Números opuestos (U1) |
| 9 | Operaciones entre polinomios | 6–8 | Suma, resta, multiplicación (distributiva), división larga | Propiedades de operaciones reales, algoritmo de división |
| 10 | Regla de Ruffini | 8 | División sintética por (x − a), coeficientes | División de polinomios |
| 11 | Teorema del resto | 9 | R = P(a), verificación | Valor numérico |
| 12 | Reconstrucción a partir de raíces | 9 | Polinomio como producto (x − raíz) | Raíces, multiplicación de binomios |
| 13 | Factorización de polinomios | 9–14 | Factor común, factor común por grupos, trinomio cuadrado perfecto, cuatrinomio cubo perfecto, diferencia de cuadrados, suma/diferencia de potencias de igual grado, trinomio de segundo grado, Teorema de Gauss | Productos notables, operaciones, raíces |
| 14 | MCM y MCD de polinomios | 14–15 | Factorización previa, factores comunes/no comunes, menor/mayor exponente | Factorización, MCM/MCD numérico (U1) |
| 15 | Ecuaciones fraccionarias | 15–16 | Restricciones de dominio (denominador ≠ 0), resolución por producto cruzado | Factorización, operaciones con fracciones |

### 2.2 Mapeo a habilidades existentes

| Skill ID (existente) | Temas canónicos cubiertos | Prerrequisitos declarados | Ejercicios existentes |
|---|---|---|---|
| `mat.u2.polinomios_basico` | 1–8 (definiciones, evaluación, raíces, orden, identidad, opuestos) | Ninguno explícito (implícito: U1 operaciones) | 1 (ex.u2.polinomios_basico.1) |
| `mat.u2.operaciones_polinomios` | 9 (suma, resta, multiplicación, división larga) | polinomios_basico | 1 (ex.u2.operaciones_polinomios.1) |
| `mat.u2.ruffini_resto` | 10–11 (Ruffini + teorema del resto) | operaciones_polinomios | 1 (ex.u2.ruffini_resto.1) |
| `mat.u2.factorizacion` | 13 (7 casos de factoreo) | operaciones_polinomios | 1 (ex.u2.factorizacion.1) |
| `mat.u2.gauss` | 12 + 13 (reconstrucción y Teorema de Gauss) | Ninguno declarado (debería: ruffini_resto + factorización) | 1 (ex.u2.gauss.1 — **incorrecto**: es eliminación gaussiana de sistemas, no factorización) |
| `mat.u2.mcm_mcd_polinomios` | 14 (MCM y MCD de polinomios) | Ninguno declarado (debería: factorización) | 0 |
| `mat.u2.ecuaciones_fraccionarias` | 15 (ecuaciones con variable en denominador) | factorización | 0 |

### 2.3 Volumen estimado de ejercicios necesarios

| Skill | Ejercicios mínimos recomendados | Ejercicios existentes (aprovechables) | Nuevos a crear |
|---|---|---|---|
| polinomios_basico | 4–5 | 1 (aprovechable) | 3–4 |
| operaciones_polinomios | 5–6 | 1 (aprovechable) | 4–5 |
| ruffini_resto | 3–4 | 1 (aprovechable) | 2–3 |
| factorizacion | 6–8 | 1 (aprovechable) | 5–7 |
| gauss | 3–4 | 0 (el actual es incorrecto) | 3–4 |
| mcm_mcd_polinomios | 2–3 | 0 | 2–3 |
| ecuaciones_fraccionarias | 2–3 | 0 | 2–3 |
| **Total** | **25–33** | **4 (aprovechables)** | **21–29** |

### 2.4 Ejemplos trabajados en el PDF canónico

El PDF contiene aproximadamente 18-22 ejemplos trabajados (completos o parciales) distribuidos entre todos los temas. Los casos de factorización son los más ricos en ejemplos. El estilo del material es de "cuadernillo de actividades" — algunas resoluciones están completas y otras dejan espacios para que el alumno complete.

---

## 3. Objetivos pedagógicos

### 3.1 Taxonomía de Bloom aplicada a U2

| Nivel Bloom | Objetivo — El alumno debe ser capaz de... | Temas relacionados |
|---|---|---|
| **Recordar** | Definir: expresión algebraica, polinomio, grado, coeficiente, raíz, polinomio mónico, polinomios idénticos, polinomios opuestos. | 1–8 |
| **Comprender** | Clasificar expresiones algebraicas (entera, racional, irracional). Interpretar qué significa que un valor sea raíz. Explicar por qué dos polinomios son idénticos u opuestos. | 1–8 |
| **Aplicar** | Evaluar numéricamente un polinomio. Reducir términos semejantes. Ordenar y completar polinomios. Sumar, restar, multiplicar y dividir polinomios. Aplicar Ruffini y el teorema del resto. | 3–11 |
| **Analizar** | Identificar qué caso de factorización aplicar. Distinguir entre factor común, trinomio cuadrado perfecto, diferencia de cuadrados, etc. Detectar restricciones de dominio en ecuaciones fraccionarias. | 13–15 |
| **Evaluar** | Verificar si una factorización es correcta expandiendo. Comprobar que las soluciones de una ecuación fraccionaria no anulan denominadores. Validar raíces encontradas con el teorema del resto. | 5, 11, 13, 15 |
| **Crear** | Reconstruir un polinomio a partir de sus raíces. Factorizar completamente un polinomio combinando múltiples casos. Resolver ecuaciones fraccionarias que requieren factorización previa. | 12–15 |

### 3.2 Referencia al PDF canónico por capítulo

- **Cap. 1–8 (págs. 3–6)**: Conceptos fundamentales. El alumno debe poder identificar, clasificar y manipular la notación polinómica. Nivel: Recordar, Comprender, Aplicar.
- **Cap. 9 (págs. 6–8)**: Operaciones. El alumno debe dominar suma, resta, multiplicación y división larga. Nivel: Aplicar. La división larga es el procedimiento más extenso y propenso a errores.
- **Cap. 10–11 (págs. 8–9)**: Ruffini y teorema del resto. Herramientas de eficiencia. Nivel: Aplicar, Evaluar.
- **Cap. 12–13 (págs. 9–14)**: Reconstrucción y factorización. El corazón algebraico de la unidad. Nivel: Analizar, Evaluar, Crear.
- **Cap. 14–15 (págs. 14–16)**: Aplicaciones (MCD/mcm y ecuaciones fraccionarias). Nivel: Aplicar, Analizar.

---

## 4. Propuesta de slice

### 4.1 Slice recomendado: U2-Fundamentos (primeros 3 skills)

**Alcance**: `mat.u2.polinomios_basico` + `mat.u2.operaciones_polinomios` + `mat.u2.ruffini_resto`

**Temas canónicos incluidos**: Capítulos 1 al 11 (págs. 3–9 del PDF).

**Justificación**:
1. **Cadena de dependencia cerrada**: polinomios_basico → operaciones_polinomios → ruffini_resto forman una cadena donde cada habilidad es prerrequisito directo de la siguiente. Esto permite al alumno recorrer un camino pedagógico completo y coherente.
2. **Volumen manejable**: ~12–15 ejercicios (4–5 por habilidad), 3 nodos de teoría, 4–6 ejemplos trabajados. Estimación de líneas modificadas: ~350–400 (dentro del presupuesto de revisión de 400 líneas).
3. **Valor demostrable rápido**: Con estos 3 skills el alumno ya puede leer, escribir, operar y evaluar polinomios. Son las herramientas básicas que habilitan todo el resto de la unidad.
4. **La factorización se difiere con criterio**: La factorización (skill `mat.u2.factorizacion`) cubre 7 casos de factoreo más el teorema de Gauss. Es un tema denso que por sí solo justifica un slice separado (U2-Factorización). Intentar incluirlo en este slice dispararía el volumen muy por encima del presupuesto de revisión.
5. **Patrón de slice vertical**: Sigue exactamente el mismo patrón que U1: teoría → ejemplos trabajados → práctica guiada → feedback → persistencia → métricas. La infraestructura ya existe; el trabajo es de contenido.

### 4.2 Qué queda para slices posteriores

| Slice futuro | Skills | Depende de |
|---|---|---|
| U2-Factorización | factorización + gauss | ruffini_resto (del slice actual) |
| U2-Aplicaciones | mcm_mcd_polinomios + ecuaciones_fraccionarias | factorización |

### 4.3 Ejercicio `ex.u2.gauss.1` — corrección necesaria

El ejercicio `ex.u2.gauss.1` actualmente presenta un sistema de ecuaciones lineales (x + y = 5, x − y = 1) resuelto por eliminación gaussiana. Esto es un **error de dominio**: en la Unidad 2, "Gauss" refiere al **Teorema de Gauss para factorización de polinomios** (búsqueda de raíces racionales p/q), no a eliminación gaussiana de sistemas (que corresponde a la Unidad 3, `mat.u3.sistemas`). Este ejercicio debe ser **reemplazado** por uno de factorización con Gauss o **reubicado** en `mat.u3.sistemas`. No se incluye en el slice actual porque `mat.u2.gauss` no forma parte de él.

---

## 5. Plan de reutilización de componentes

### 5.1 Capacidades que se REUTILIZAN sin modificación

| Componente | Spec/Archivo | Estado en U1 | Uso en U2 |
|---|---|---|---|
| `theory-content` | `specs/theory-content/spec.md` | Implementado | **REUSE** — el modelo `TheoryNode`, `ConceptBlock`, `CanonicalTrace` y los loaders de teoría funcionan para cualquier unidad. |
| `worked-examples` | `specs/worked-examples/spec.md` | Implementado | **REUSE** — `WorkedExample`, `SolutionStep` aplican a ejemplos de polinomios sin cambios. |
| `pedagogical-feedback` | `specs/pedagogical-feedback/spec.md` | Implementado | **REUSE** — el motor `generateFeedback()` es agnóstico a la unidad; solo necesita mappings de error tag → mensaje. |
| `guided-practice` | `specs/guided-practice/spec.md` | Implementado | **REUSE** — el flujo de fases (teoría → ejemplo → práctica → feedback) y `usePracticeFlow` no requieren cambios. |
| `math-exercise-model` | `specs/math-exercise-model/spec.md` | Implementado | **REUSE** — los tipos de ejercicio (`multiple-choice`, `numerical`, `symbolic`, `true-false`) cubren las necesidades de U2. |
| `diagnostic-shell` | `specs/diagnostic-shell/spec.md` | Implementado | **REUSE** — el diagnóstico y las recomendaciones funcionan con cualquier skill. |
| `math-render-safety` | `specs/math-render-safety/spec.md` | Implementado | **REUSE** — KaTeX/LaTeX para renderizar expresiones polinómicas. |
| `persistencia + métricas` | `src/domain/progress/`, `src/lib/practice-progress.ts` | Implementado | **REUSE** — `PracticeAttempt`, `PracticeProgress`, localStorage adapter sin cambios. |

### 5.2 Capacidades que se EXTIENDEN

| Componente | Qué se extiende | Justificación |
|---|---|---|
| `math-exercise-catalog` | Agregar ejercicios U2 a `exercises.json`; crear `content/matematica/theory/unit-2.json`, `content/matematica/examples/unit-2.json`, `content/matematica/feedback/unit-2.json` | Extensión de contenido, no de modelo. El spec `math-exercise-catalog` ya exige ≥5 ejercicios por unidad. |
| `math-error-taxonomy` | Agregar ≥6 etiquetas de error con prefijo `u2_*` en `src/domain/error-taxonomy/index.ts` | La taxonomía exige ≥2 tags por unidad. U2 necesita tags para: signo en operaciones, olvido de completar polinomio, error en Ruffini (no cambiar signo de a), confusión factor común/grupos, etc. |
| `math-answer-evaluator` | Agregar detección de patrones de error U2 en `src/domain/evaluator/error-tagging.ts` | Los patrones de error de polinomios son nuevos: signo al restar, coeficiente mal sumado, error en Ruffini (a vs −a), factorización incompleta. |
| `skill-catalog.ts` | Agregar metadatos U2 (descripciones, prerrequisitos pendientes para gauss y mcm_mcd) | Las dependencias de `mat.u2.gauss` y `mat.u2.mcm_mcd_polinomios` están incompletas. |

### 5.3 Capacidades NUEVAS a crear

| Componente | Spec nuevo | Justificación |
|---|---|---|
| `polynomial-evaluator` | `specs/polynomial-evaluator/spec.md` | **NECESARIO**. El evaluador actual cubre respuestas numéricas, simbólicas y multiple-choice, pero no tiene lógica específica para verificar equivalencia de expresiones polinómicas factorizadas (ej: `(x−2)(x+3)` vs `x²+x−6`). Se necesita un evaluador que normalice y compare polinomios. |
| `polynomial-input` | No requiere spec separado — se integra en exercise model | Los ejercicios de U2 pueden resolverse con los tipos existentes (`multiple-choice`, `numerical`, `symbolic`), pero algunos requieren input de coeficientes (ej: "completá los coeficientes del cociente en Ruffini"). Esto podría manejarse con `fill-blank` o un nuevo `coefficient-input`. |

### 5.4 Capacidades que NO se necesitan para U2

- `interval-representation`: Los intervalos no aparecen en la Unidad 2.
- `complex-numbers-skill`: Sin uso en U2.
- `valor-absoluto-skill`: Sin uso directo en U2.

---

## 6. Riesgos

### 6.1 Riesgos pedagógicos

| Riesgo | Severidad | Mitigación |
|---|---|---|
| **Confusión Gauss lineal vs. Gauss polinomios**: El ejercicio `ex.u2.gauss.1` actualmente implementa eliminación gaussiana de sistemas, no el teorema de Gauss para factorización. Esto confundiría a cualquier alumno. | **Alta** | Corregir o eliminar `ex.u2.gauss.1` antes de habilitar cualquier contenido de U2. El slice propuesto no incluye `mat.u2.gauss`, así que el riesgo se mitiga por exclusión. |
| **Factorización prematura**: Si un alumno intenta factorizar sin dominar operaciones y Ruffini, fracasará. El orden del slice (básico → operaciones → Ruffini → factorización después) es correcto, pero la app debe **bloquear** el acceso a skills cuyos prerrequisitos no están listos (la infraestructura de `computeReadiness` ya lo hace). | **Media** | El grafo de dependencias ya está implementado. Solo falta declarar `ruffini_resto` como prerrequisito de `factorización` (actualmente no lo está en `skill-catalog.ts`). |
| **Sobrecarga de casos de factorización**: Factorización tiene 7 casos + Gauss. Compactarlos en un solo skill `mat.u2.factorizacion` puede abrumar. | **Media** | Para el slice actual esto está fuera de alcance. En el slice futuro de factorización, considerar dividir en 2 skills: `factorizacion_basica` (4 casos) y `factorizacion_avanzada` (3 casos + Gauss). |
| **Dependencia de U1 no verificada**: Varios temas de U2 asumen dominio de operaciones con reales, potencias y fracciones. Si el alumno no consolidó U1, U2 será frustrante. | **Media** | El diagnóstico ya cubre skills de U1. Se podría agregar una verificación de prerrequisitos inter-unidad (U1 → U2) en la fase de propuesta. |

### 6.2 Riesgos técnicos

| Riesgo | Severidad | Mitigación |
|---|---|---|
| **Evaluación de polinomios factorizados**: Comparar `(x−2)(x+3)` con `x²+x−6` requiere expandir o normalizar. Si el evaluador actual solo hace string match, fallará. | **Alta** | Implementar `polynomial-evaluator` con normalización (expandir, ordenar, comparar coeficientes) como nuevo módulo en `src/domain/evaluator/`. Esto requiere TDD riguroso. |
| **Renderizado de división larga**: La división de polinomios es notoriamente difícil de representar en UI. El PDF canónico usa formato tabular. | **Media** | Para el slice inicial (que no incluye división larga como foco principal — está en operaciones), usar ejemplos trabajados con KaTeX. La división larga como ejercicio interactivo puede diferirse. |
| **Completar polinomios como input**: Pedir al alumno que "complete el polinomio" (agregar términos con coeficiente 0) no encaja bien en multiple-choice ni numerical. | **Media** | Usar multiple-choice para identificar el polinomio correctamente completado, o diferir este tipo de ejercicio al slice de factorización. |
| **Volumen de contenido JSON**: Crear theory + examples + feedback + exercises para 3 skills puede generar ~200-300 líneas de JSON. | **Baja** | Es contenido, no código. No afecta el presupuesto de revisión de código (400 líneas de TS/TSX). |

### 6.3 Riesgos de alcance

| Riesgo | Severidad | Mitigación |
|---|---|---|
| **Scope creep hacia factorización**: La factorización es el tema más rico y tentador de U2. Es fácil que el slice "fundamentos" se expanda para incluir "solo factor común". | **Alta** | Límite estricto: 3 skills. Cualquier contenido de factorización va en un slice separado. Si durante la propuesta se detecta que Ruffini no es suficiente sin factorización, reconsiderar el límite del slice en ese momento. |
| **Subestimar complejidad de división larga**: La división de polinomios es el algoritmo más extenso de U2. | **Media** | Incluir división larga en `operaciones_polinomios` pero limitar los ejercicios a división exacta (resto 0) o usar Ruffini para los casos (x−a). La división con resto no nulo puede ser un ejercicio de dificultad 4–5, no del slice inicial. |
| **Multiplicación de slices**: Si cada unidad genera 2–3 slices como U1 (que tuvo ~16 fases en 3 PRs), el proyecto se alarga. | **Media** | U1 fue costoso porque construyó infraestructura. U2 debería ser más rápido: contenido + evaluador + tests. Apuntar a 1 PR por slice de U2. |

---

## 7. Preguntas abiertas

1. **¿Dividir `mat.u2.polinomios_basico` en dos skills?** Actualmente cubre 8 temas canónicos (expresiones algebraicas hasta polinomios opuestos). ¿Es demasiado amplio? ¿Conviene separar "conceptos y clasificación" (temas 1–5) de "orden, identidad y opuestos" (temas 6–8)?

2. **¿El evaluador de polinomios debe soportar equivalencia algebraica completa?** Comparar `(x−2)(x+3)` con `x²+x−6` requiere expandir productos. ¿Hasta dónde debe llegar? ¿Solo expansión, o también factorización inversa? ¿Debe aceptar `(x+3)(x−2)` como equivalente a `(x−2)(x+3)` (conmutatividad)?

3. **¿Qué hacer con `ex.u2.gauss.1`?** Actualmente es un ejercicio de sistemas lineales mal ubicado. Opciones: (a) eliminarlo, (b) moverlo a `mat.u3.sistemas`, (c) reescribirlo como ejercicio de Gauss para factorización.

4. **¿Cuántos ejercicios por habilidad son "suficientes"?** El spec `math-exercise-catalog` exige ≥5 por unidad, pero no por habilidad. Para U1 se usaron 4 por habilidad piloto. ¿Mantener 4–5 por habilidad para U2?

5. **¿Incluir división larga en el slice inicial o diferirla?** La división larga de polinomios es el procedimiento más complejo de representar. ¿Se incluye como ejemplo trabajado (sin ejercicio interactivo) en el slice inicial y se agregan ejercicios en un slice posterior?

6. **¿Las dependencias entre unidades (U1 → U2) deben ser bloqueantes?** Actualmente el grafo de dependencias solo opera intra-unidad. ¿Debería `mat.u2.polinomios_basico` declarar prerrequisitos de U1 (ej. `mat.u1.propiedades_operaciones_reales`)?

---

## 8. Alternativas consideradas

### Alternativa A: Slice completo de U2 (7 skills)

**Descripción**: Implementar los 7 skills de una vez, cubriendo todo el PDF canónico (16 páginas).

| Pros | Contras | Complejidad |
|---|---|---|
| U2 queda "terminada" en un solo ciclo SDD | ~25–33 ejercicios, 7 nodos de teoría, ~14 ejemplos trabajados. Estimación: 800–1200 líneas modificadas. Excede el presupuesto de revisión (400 líneas). Requeriría 3–4 PRs encadenados. | **Alta** |
| El alumno ve la unidad completa | La factorización (7 casos + Gauss) es demasiado densa para un solo slice; los errores de contenido serían más probables. | |
| Sin deuda de slices pendientes | El riesgo de scope creep es máximo. | |

**Veredicto**: Rechazada por exceder el presupuesto de revisión y concentrar demasiado riesgo pedagógico.

### Alternativa B: Slice mínimo de 1 skill (solo polinomios_basico)

**Descripción**: Implementar únicamente `mat.u2.polinomios_basico` como piloto de U2.

| Pros | Contras | Complejidad |
|---|---|---|
| Mínimo riesgo, ~100 líneas | No demuestra el patrón de slice vertical (teoría → ejemplo → práctica → feedback) porque 1 skill aislado no forma una cadena pedagógica. | **Baja** |
| Rápido de implementar | El alumno puede "saber qué es un polinomio" pero no puede operar con él. La experiencia es incompleta. | |
| Fácil de revertir | No agrega suficiente valor pedagógico para justificar un ciclo SDD completo. | |

**Veredicto**: Rechazada por insuficiencia pedagógica. Un solo skill no constituye un slice vertical útil.

### Alternativa C: Slice de 5 skills (básico → operaciones → Ruffini → factorización → ecuaciones)

**Descripción**: Cubrir desde conceptos básicos hasta ecuaciones fraccionarias, excluyendo solo gauss y mcm_mcd.

| Pros | Contras | Complejidad |
|---|---|---|
| Cubre el 80% del valor pedagógico de U2 | La factorización sigue siendo densa (7 casos). ~20 ejercicios. Líneas estimadas: 500–700. Excede el presupuesto de revisión. | **Media-Alta** |
| Incluye el "premio" de aplicar polinomios a ecuaciones | gauss y mcm_mcd son temas complementarios que pueden esperar. | Requiere 2 PRs como mínimo. |

**Veredicto**: Rechazada por exceder el presupuesto, aunque es pedagógicamente más completa que la alternativa A. Podría ser viable si la factorización se parte en 2 slices.

### Alternativa D: Slice de 4 skills (básico → operaciones → Ruffini → factorización básica)

**Descripción**: Incluir solo los 4 primeros casos de factoreo (factor común, grupos, trinomio cuadrado perfecto, diferencia de cuadrados) y diferir los otros 3 + Gauss.

| Pros | Contras | Complejidad |
|---|---|---|
| Cubre la cadena completa hasta factorización básica | Requiere crear un skill nuevo o dividir `mat.u2.factorizacion`, lo cual es un cambio de modelo. | **Media** |
| | El ejercicio `ex.u2.factorizacion.1` (trinomio de segundo grado) ya está en el skill de factorización; habría que decidir si se incluye o no. | |

**Veredicto**: Potencialmente viable si el usuario prefiere llegar a factorización en el primer slice. Requiere partir `mat.u2.factorizacion`. No es la recomendación principal pero es una alternativa sólida.

---

## 9. Dependencias y supuestos

### 9.1 Dependencias

- **Infraestructura U1**: Los modelos `TheoryNode`, `WorkedExample`, `ConceptBlock`, `CanonicalTrace`, el motor de feedback, el flujo de práctica guiada (`usePracticeFlow`), la persistencia (`PracticeProgress`) y las métricas deben estar operativos. Estado actual: ✅ implementados y verificados.
- **Skill catalog**: Los 7 `skillId` de U2 ya existen en `skill-catalog.ts`. Las dependencias deben completarse para `mat.u2.gauss` (requiere `ruffini_resto`) y `mat.u2.mcm_mcd_polinomios` (requiere `factorizacion`).
- **Material canónico**: `UNIDAD2_matemática.pdf` disponible. El PDF de resolución de ejercicios (`RESOLUCIÓN DE EJERCICIOS SEMINARIO UNIVERSITARIO MATEMÁTICA.pdf`) también contiene ejercicios resueltos de polinomios que pueden servir como referencia.
- **Evaluador existente**: Debe extenderse con `polynomial-evaluator` para manejar equivalencia de expresiones factorizadas.

### 9.2 Supuestos

1. **El alumno consolidó las operaciones básicas de U1** (reales, potencias, fracciones). U2 no re-enseña aritmética; asume fluidez.
2. **Los ejercicios de polinomios pueden resolverse con los tipos existentes** (`multiple-choice`, `numerical`, `symbolic`). No se requiere un nuevo tipo de ejercicio para el slice inicial.
3. **La división larga de polinomios se enseña como ejemplo trabajado** pero no se evalúa como ejercicio interactivo en el slice inicial (se difiere a un slice posterior).
4. **El contenido de teoría para U2 se escribe en español neutro/profesional**, siguiendo el tono del material canónico de UTN (riguroso, no infantilizado).
5. **El patrón de slices de U1 (3 PRs encadenados) puede comprimirse a 1 PR** para U2 porque la infraestructura ya existe y el trabajo es mayormente contenido.

---

## 10. Estado actual del código (inventario)

### 10.1 Archivos existentes con contenido U2

| Archivo | Contenido U2 | Estado |
|---|---|---|
| `src/domain/models/skill-catalog.ts` | 7 skills U2 definidos, 4 dependencias declaradas | ✅ Correcto (faltan 2 dependencias) |
| `content/matematica/exercises.json` | 5 ejercicios U2 (1 por skill en 5 de 7 skills) | ⚠️ 4 aprovechables, 1 incorrecto (gauss.1) |
| `src/domain/__tests__/catalog.test.ts` | Tests de carga de skills U2 | ✅ Cubre identidades |
| `src/domain/__tests__/diagnostic.test.ts` | Tests con ejercicios U2 placeholder | ✅ Usa IDs U2 |
| `src/domain/__tests__/next-step.test.ts` | Test de next-step con skill U2 no-ready | ✅ Verifica que skills no-ready no generan links |

### 10.2 Archivos que DEBEN crearse

| Archivo | Propósito |
|---|---|
| `content/matematica/theory/unit-2.json` | 3 nodos de teoría (uno por skill del slice) |
| `content/matematica/examples/unit-2.json` | 4–6 ejemplos trabajados |
| `content/matematica/feedback/unit-2.json` | Mappings de error tag → mensaje para U2 |
| `src/domain/evaluator/polynomial-evaluator.ts` | Evaluador de equivalencia polinómica |
| `src/domain/__tests__/polynomial-evaluator.test.ts` | Tests TDD para el evaluador |

### 10.3 Archivos que deben MODIFICARSE

| Archivo | Cambio |
|---|---|
| `content/matematica/exercises.json` | Agregar 8–11 ejercicios U2 nuevos (total: 12–15 en el slice); eliminar o corregir `ex.u2.gauss.1` |
| `src/domain/error-taxonomy/index.ts` | Agregar ≥6 etiquetas de error `u2_*` |
| `src/domain/evaluator/error-tagging.ts` | Agregar patrones de detección para errores U2 |
| `src/domain/models/skill-catalog.ts` | Agregar prerrequisitos faltantes (gauss ← ruffini, mcm_mcd ← factorización) |
| `src/domain/catalog/content-loaders.ts` | Agregar loaders para theory/examples/feedback de unit-2 |
| `src/domain/index.ts` | Exportar polynomial-evaluator |

---

## 11. Listo para propuesta

**Sí** — La exploración es suficiente para lanzar `sdd-propose`.

El orquestador debe:
1. Confirmar el alcance del slice: 3 skills (polinomios_basico, operaciones_polinomios, ruffini_resto)
2. Confirmar si se divide `mat.u2.polinomios_basico` o se mantiene como está
3. Confirmar el destino de `ex.u2.gauss.1` (eliminar, reubicar o reescribir)
4. Confirmar el nivel de soporte del evaluador polinómico (solo expansión o también factorización inversa)
5. Lanzar `sdd-propose` con esta exploración como contexto

---

## SDD Result Envelope

**Status**: success
**Summary**: La Unidad 2 (Polinomios) del material canónico UTN cubre 15 temas en 16 páginas, desde expresiones algebraicas hasta ecuaciones fraccionarias. El proyecto ya tiene 7 skills U2 definidos y 5 ejercicios placeholder (4 aprovechables, 1 incorrecto). Se recomienda un primer slice vertical de 3 skills (polinomios_basico, operaciones_polinomios, ruffini_resto) que cubre los capítulos 1–11 del PDF. La infraestructura pedagógica de U1 se reutiliza casi por completo; el trabajo nuevo es contenido JSON, etiquetas de error U2, y un evaluador de equivalencia polinómica. La factorización (7 casos + Gauss) se difiere a un segundo slice para mantener el volumen dentro del presupuesto de revisión de 400 líneas.
**Artifacts**: `openspec/changes/unit-2-pedagogical-slice/exploration.md` | Engram `sdd/unit-2-pedagogical-slice/explore`
**Next**: sdd-propose (definir alcance preciso del slice U2-Fundamentos)
**Risks**: (1) ALTA — `ex.u2.gauss.1` implementa eliminación gaussiana en vez de factorización; (2) ALTA — el evaluador actual no maneja equivalencia de polinomios factorizados; (3) MEDIA — scope creep hacia factorización por ser el tema más rico.
**Skill Resolution**: paths-injected — 1 skill (sdd-explore)
