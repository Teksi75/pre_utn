# Auditoría de Unidad 3 — Pre UTN

**Modo**: read-only. No se modificaron specs, contenido ni configuración productiva.
**Fuentes**: repositorio en `C:\dev\pre_utn` (HEAD `8eab60f`) + material canónico local bajo `material_canonico/utn-frm/matematica/unidad-03/`. Engram `pre_utn` (#1191) confirmó convenciones SDD/TDD y stack reciente (Next.js, Supabase, post-auth-sync). Engram `mate-explorer` (#2687) es la única traza escrita de la app complementaria — el repo `Teksi75/mate-explorer` no es accesible en este momento.
**Marco institucional**: la app es multi-institución; las fuentes canónicas citadas son `utn-frm` (Universidad Tecnológica Nacional — Facultad Regional Mendoza) y la auditoria referencia ese origen SOLO cuando cita el PDF concreto. Cualquier afirmación que trascienda la institucion debe leerse como cobertura del tema en la app, no como cobertura de la currícula UTN-FRM.

---

## 1. Tabla de habilidades evaluables

Esta tabla enumera las habilidades que el alumno debería poder demostrar al terminar la Unidad 3 si la app entrenara lo que un examen de ingreso razonable exige. La columna _Estado actual_ se llena contra el contenido de la app; las columnas de las secciones 2-4 dan el detalle de cada fila.

| Habilidad | Estado actual | Sub-habilidades esperadas | Notas |
|---|---|---|---|
| Ecuaciones lineales en una variable | ✅ cubierto | Forma `ax+b=c`, signo al mover, coeficiente negativo, coeficiente racional, ecuaciones equivalentes, despeje con la variable en ambos miembros | Ejercicios 1-5; teoría 4 conceptos |
| Ecuaciones con valor absoluto (igualdad) | ❌ **ausente como skill** | `|x| = k`, `|ax+b| = c`, `|ax+b| = |cx+d|`, sin solución cuando k<0 | El PDF canónico (p. 7) y la guía práctica (Problem 8, p. 6) la incluyen como sección propia. La app solo cubre la versión con inecuación. |
| Ecuaciones cuadráticas | ⚠️ parcial | Forma general, factorización, cuadrados perfectos, diferencia de cuadrados, **discriminante**, **fórmula cuadrática / resolvente** | El PDF canónico (p. 5-7) y los exámenes (TEMA 1/2 Q3 con `log_2(x)+log_4(x)+log_16(x)=7`) requieren discriminante y fórmula general. La app solo cubre factorización. |
| Ecuaciones con discriminante/parámetro | ❌ **ausente** | "Para qué valores de k la ecuación tiene raíces iguales / reales distintas / complejas" | Problema 6 de la guía práctica (p. 5-6) y Problema 21 de la guía (p. 9-10) para rectas. No hay skill ni ejercicios. |
| Traducción de lenguaje verbal a algebra | ❌ **ausente** | "El consecutivo par de un número par", "el 20% de una cantidad", modelado de enunciados con una variable | Problema 2 de la guía práctica (p. 3-4), 14 sub-items. No hay skill, no hay ejercicios, no hay teoría. |
| Problemas verbales / modelado | ❌ **ausente** | Mezclas, salarios, velocidades, balanzas, ascensores, presupuesto, costo-ingreso-utilidad | Problemas 3-7, 10, 13-15, 31 de la guía práctica. No aparece en la app. |
| Inecuaciones lineales | ✅ cubierto | `ax+b<c`, flip al dividir por negativo, inecuaciones con la variable en ambos miembros, inecuaciones con paréntesis | Ejercicios 1-5; teoría 3 conceptos |
| Inecuaciones con valor absoluto | ⚠️ parcial | `|x| < c` (conjunción), `|x| > c` (disyunción), variantes con `|ax+b|` y `|ax+b| ≤/≥ c` | Faltan los casos **con término a ambos lados** (p. ej. `|2x-1|-2 ≥ 4`) que el TEMA 1 pregunta Q4. |
| Inecuaciones producto y cociente | ❌ **ausente** | `(ax+b)(cx+d) ≥ 0`, `x/(x+1) < 3`, `x² ≤ x`, análisis de signos | Problema 9p-w de la guía práctica (p. 6-7). El visual `sign-chart` ya está soportado por el dominio (`src/domain/visuals/parse.ts:148`) — solo falta skill + contenido. |
| Recta: pendiente, ordenada, raíz, formas | ⚠️ parcial | `y = mx + b` (pendiente-ordenada), pendiente entre dos puntos, ordenada, **forma general** `ax+by+c=0`, **forma segmentaria** `x/x₀ + y/b = 1`, **forma punto-pendiente** `y - y₁ = m(x - x₁)`, **raíz** como `x = -b/m` | La app cubre solo 2 de las 6 formas. El PDF canónico (p. 18-22) trabaja con punto-pendiente, dos puntos y forma segmentaria. |
| Recta: paralelas y perpendiculares | ❌ **ausente** | `m₁ = m₂` para paralelas, `m₁·m₂ = -1` para perpendiculares | Problema 12c-g y Problema 20a-c de la guía práctica (p. 9-10); TEMA 1 Q5 y TEMA 2 Q5 (paralela/perpendicular por un punto). La teoría tiene el dominio visual `cartesian-line` con formas `slope-intercept / point-slope / two-point / horizontal / vertical` (types.ts:33-67) — basta con agregar contenido. |
| Recta: parámetro | ❌ **ausente** | "Hallar k para que la recta 2kx-5y+2k+3=0 pase por un punto / tenga una pendiente / tenga una ordenada" | Problema 21 de la guía práctica (p. 9-10). No hay skill. |
| Sistemas: sustitución y eliminación | ✅ cubierto | Ambos métodos analíticos + verificación | Ejercicios 1-5; teoría 2 conceptos |
| Sistemas: clasificación geométrica | ❌ **ausente** | Compatible determinado (secante) / compatible indeterminado (coincidente) / incompatible (paralelo no coincidente) | El PDF canónico (p. 24-30) y el Problema 24-29 de la guía práctica lo trabajan explícitamente. El visual `systems-of-lines` ya soporta `secant | parallel | coincident` (parse.ts:182-204, types.ts:101-104). La teoría U3 solo usa `secant`. |
| Sistemas: método gráfico | ❌ **ausente** | Lectura de la solución a partir de la intersección de dos rectas en el plano | El visual `systems-of-lines` cubre el render; falta la dimensión pedagógica (interpretar pendiente y ordenada, no solo graficar). |
| Sistemas: homogéneos | ❌ **ausente** | `ax + by = 0`, `cx + dy = 0`, siempre compatibles, solución trivial vs no trivial | PDF canónico p. 31; Problema 25g y 32b de la guía práctica. No hay skill. |
| Sistemas: con parámetro | ❌ **ausente** | "Hallar k para que el sistema sea compatible det/indet/incompatible" | Problema 27-29, 33 de la guía práctica. No hay skill. |
| Exponenciales: igualación de bases | ✅ cubierto | `2^x = 2^k`, `4^x = 32` por descomposición en base prima, base < 1 con exponente negativo | Ejercicios 1-5; teoría 3 conceptos |
| Exponenciales: métodos no triviales | ❌ **ausente** | Factor común cuando hay sumas de potencias, **cambio de variable** (p. ej. `2^{2x}-2·2^x-8=0` con `z=2^x` resulta en cuadrática), aplicación de logaritmos cuando no se puede igualar bases | PDF canónico p. 32-33; Problema 39 de la guía práctica (16 sub-items). |
| Logarítmicas: definición y propiedades básicas | ✅ cubierto | Definición, producto→suma, potencia→factor, cambio de base, valor simple `log_a(b)` | Ejercicios 1-5; teoría 4 conceptos |
| Logarítmicas: resolución de ecuaciones | ❌ **ausente** | "Resolver `log(x+6)=1+log(x-3)`", "Resolver `log_2(x)+log_4(x)+log_16(x)=7`", "Verificar que las soluciones halladas pertenezcan al dominio" | PDF canónico p. 34-36; Problema 40 de la guía práctica (15 sub-items); TEMA 1 Q3 y TEMA 2 Q3. La app no distingue entre conocer las propiedades y saber usarlas para resolver. |
| Logarítmicas: **dominio y validez** | ❌ **ausente** | "x=3 da `log_2(3²-7·3+8)=log_2(-4)` → no está definida → 3 no es solución" | El PDF canónico (p. 35-36) lo trabaja explícitamente: "obtenemos soluciones numéricas que no son válidas, lo que nos obliga a comprobar las soluciones obtenidas en la ecuación inicial". |

**Total**: 22 habilidades evaluables detectadas; **12 con cobertura ✅ / ⚠️ parcial** y **10 con cobertura ❌ ausente**.

---

## 2. Tabla de cobertura actual en teoría

Fuente: `content/matematica/theory/unit-3.json` (531 líneas, 8 `TheoryNode`, 27 `ConceptBlock`).

| SkillId | Conceptos | Notación | Errores comunes | Prompts práctica | `visualExamples` (kinds) | Sub-habilidades cubiertas |
|---|---|---|---|---|---|---|
| `mat.u3.ecuaciones_lineales` | 4 (definición, aislamiento, signo al mover, coeficiente negativo) | 3 | 3 | 3 | 0 | Lineales básicas, signo, coeficiente negativo |
| `mat.u3.ecuaciones_cuadraticas` | 4 (forma general, factorización, dos raíces, cuadrados perfectos) | 3 | 3 | 3 | 0 | Factorización, diferencia de cuadrados, cuadrados perfectos |
| `mat.u3.inecuaciones_lineales` | 3 (definición, resolver como ecuación, flip por negativo) | 3 | 3 | 3 | 1 (`interval-set`) | Lineal, flip, intervalo |
| `mat.u3.inecuaciones_valor_absoluto` | 3 (definición + 2 casos, < y >) | 3 | 3 | 3 | 2 (`distance-on-line`, `interval-set`) | Conjunción y disyunción |
| `mat.u3.recta` | 3 (pendiente-ordenada, pendiente entre dos puntos, lectura de ordenada) | 3 | 3 | 3 | 1 (`cartesian-line` slope-intercept) | Pendiente, ordenada, dos puntos |
| `mat.u3.sistemas` | 3 (definición, sustitución, eliminación) | 3 | 4 | 3 | 1 (`systems-of-lines` secant) | Sustitución, eliminación, secante |
| `mat.u3.exponenciales` | 3 (definición, misma base, propiedades) | 3 | 3 | 3 | 0 | Igualación de bases, potencia de potencia |
| `mat.u3.logaritmicas` | 4 (recordatorio, producto, potencia, cambio de base) | 4 | 3 | 3 | 0 | Definición, propiedades básicas, cambio de base |
| **Total** | **27** | **25** | **25** | **24** | **5** | — |

**Observaciones**:

- Las 8 skill cubren los "ejes canónicos" del PDF UTN-FRM (capítulos 1-8 de la teoría) **sin** los sub-capítulos extendidos (paralelas/perpendiculares, forma segmentaria, discriminante, parámetro, sistemas homogéneos/clasificación, cambio de variable exponencial, resolución de ecuaciones logarítmicas con dominio).
- No hay ningún `visualExample` para `mat.u3.recta` que ilustre **dos rectas distintas en el mismo plano** (necesario para visualizar paralelas/perpendiculares); solo hay uno de una recta sola (`y = 3x + 2`).
- No hay `visualExample` de tipo `sign-chart` en toda la unidad 3, a pesar de que la guía práctica UTN-FRM tiene 7+ inecuaciones producto/cociente (Problema 9p-w).
- La teoría nunca menciona la **fórmula cuadrática / resolvente** (`x = (-b ± √(b²-4ac)) / 2a`) ni el **discriminante** explícitamente, aunque la guía de práctica (Problema 6, p. 5-6) pregunta "para qué k las raíces son iguales/reales distintos/complejas".
- La teoría nunca menciona la **traducción de lenguaje verbal a algebra** ni los **problemas verbales**, aunque son Problema 2-7 y 10-15 de la guía práctica (16+ items).

---

## 3. Tabla de cobertura actual en `/practice`

Fuentes (composicion confirmada por `loadExercisesForSkill` en `src/domain/catalog/content-loaders.ts:646`):
- `content/matematica/exercises.json` (5 entradas U3 legadas con `.1` en el sufijo)
- `content/matematica/exercises/unit-3.json` (32 entradas U3 nuevas con `.2`-`.5`)
- Catálogo compuesto: 5+32 = 37 ejercicios (verificado en runtime por la deduplicación por `id` en content-loaders.ts:657-660)

| SkillId | Total | Por dificultad (1/2/3/4/5) | Tipos (numerical / MC) | Por fuente (legacy/expansion) |
|---|---|---|---|---|
| `mat.u3.ecuaciones_lineales` | 5 | 2 / 2 / 1 / 0 / 0 | 5 numerical / 0 MC | 1 + 4 |
| `mat.u3.ecuaciones_cuadraticas` | 5 | 1 / 2 / 2 / 0 / 0 | 0 / 5 MC | 1 + 4 |
| `mat.u3.inecuaciones_lineales` | 5 | 1 / 3 / 1 / 0 / 0 | 0 / 5 MC | 1 + 4 |
| `mat.u3.inecuaciones_valor_absoluto` | 4 | 0 / 3 / 1 / 0 / 0 | 0 / 4 MC | 0 + 4 |
| `mat.u3.recta` | 5 | 1 / 3 / 1 / 0 / 0 | 1 numerical / 4 MC | 1 + 4 |
| `mat.u3.sistemas` | 5 | 0 / 2 / 2 / 1 / 0 | 0 / 5 MC | 1 + 4 |
| `mat.u3.exponenciales` | 4 | 2 / 0 / 2 / 0 / 0 | 1 numerical / 3 MC | 0 + 4 |
| `mat.u3.logaritmicas` | 4 | 2 / 2 / 0 / 0 / 0 | 1 numerical / 3 MC | 0 + 4 |
| **Total** | **37** | **9 / 17 / 11 / 1 / 0** | **8 numerical / 29 MC** | **5 legacy + 32 expansion** |

**Umbrales del proyecto**:
- `UNIT_THRESHOLDS["unit-3"] = 24` (src/domain/catalog/content-loaders.ts:872) — **cubierto** (37 ≥ 24, ratio 154%).
- Catálogo total declarado: 184 (BASELINE_TOTAL) = 152 anteriores + 32 nuevos. (Implementación `consolidate-math-mvp-before-unit-3`, archivado en `openspec/changes/archive/`).

**Hallazgos sobre la distribución**:

- **Sin ejercicios de dificultad 5** en toda la unidad 3. La rampa de dificultad llega hasta 4 (solo `ex.u3.sistemas.5`). Para una unidad introductoria de examen de ingreso es aceptable, pero no permite entrenar la integración multi-concepto (composición de discriminante + cambio de variable exponencial, etc.) sin pasar por el flujo de challenges.
- **Sin desafíos / challenges para Unidad 3**: `content/matematica/challenges/` solo contiene `unit-1.json` (16 entradas) y `unit-2.json` (14 entradas) (verificado por `Get-ChildItem`). El loader `src/lib/challenges/loader.ts:18-19` solo importa esos dos archivos. `loadChallengesForUnit(3)` retorna `[]` para cualquier skillId `mat.u3.*`, y la pantalla "Complete" de la práctica (`src/app/practice/page.tsx:223`) salta el `ChallengeFlow` para todas las 8 skills U3 porque `hasChallengesForSkill()` retorna `false`. Resultado: el alumno que termina la práctica base de U3 **no recibe la rampa de dificultad 4-5 que sí recibe el alumno U1/U2**.
- **No hay campo `category` en los 32 ejercicios nuevos de U3** (verificado por `Get-Content | Select-String '"category":'` — el campo no aparece en `unit-3.json`). Esto es asimétrico con U1 per-skill (`unit-1.json` y `conjuntos-numericos.json` sí lo usan). El validador `validatePracticeBank` (content-loaders.ts:797) **no exige** `category` para U3 (las mínimas por categoría en `CATEGORY_MINIMUMS` son específicos de U1), pero la asimetría dificulta el reporte y la priorización de generación.
- **No hay `relatedTheoryIds` / `relatedExampleIds`** en los 32 ejercicios nuevos de U3 (verificado por búsqueda de `"relatedTheoryIds"` y `"relatedExampleIds"` en el archivo). La convención del proyecto (verificada en `consolidate-math-mvp-before-unit-3`) exige el campo en el JSON pero el modelo `Exercise` no lo requiere estrictamente.
- **Cobertura de `commonErrorTags` pobre**: solo 1 de los 32 ejercicios nuevos tiene `commonErrorTags` poblados (`exercises.json` line 9-12, `ex.u3.ecuaciones_lineales.1`). Esto significa que **en 31 de 32 ejercicios el feedback se muestra como "correcto/incorrecto" pero sin ruta de recuperación específica** (`u3_aislamiento_incorrecto`, `u3_signo_desigualdad`, etc.) — los 8 mappings en `feedback/unit-3.json` quedan subutilizados.
- **Cobertura por sub-habilidad de la Sección 1** (verificación manual contra los 37 IDs):

| Sub-habilidad (Sección 1) | Ejercicios en `/practice` | Comentario |
|---|---|---|
| Ecuaciones lineales con signo/coeficiente negativo | 3/5 (ex.u3.ecuaciones_lineales.2/3/5) | Cubierto, falta ecuación equivalente explícita |
| `|x| = k` (igualdad con valor absoluto) | **0** | Ausente — no hay skill |
| Cuadrática factorización + 2 raíces | 3/5 (ex.u3.ecuaciones_cuadraticas.1/2/5) | Cubierto |
| Cuadrática con cuadrados perfectos | 2/5 (ex.u3.ecuaciones_cuadraticas.3/4) | Cubierto |
| Cuadrática con discriminante/fórmula general | **0** | Ausente |
| Ecuación con parámetro (discriminante) | **0** | Ausente |
| Traducción lenguaje verbal → algebra | **0** | Ausente |
| Problemas verbales / modelado | **0** | Ausente |
| Inecuación lineal con flip | 3/5 (ex.u3.inecuaciones_lineales.2/4/5) | Cubierto |
| Inecuación lineal con paréntesis | 1/5 (ex.u3.inecuaciones_lineales.5) | Cubierto |
| `|x| < c` / `|x| > c` con `x` puro | 2/4 (ex.u3.inecuaciones_valor_absoluto.2/3) | Cubierto |
| `|x-a| < c` / `|x-a| > c` | 2/4 (ex.u3.inecuaciones_valor_absoluto.4/5) | Cubierto |
| `|ax+b| - k ≤/≥ m` con término a ambos lados | **0** | Ausente (TEMA 1/2 Q4) |
| Inecuación producto `(ax+b)(cx+d) ≥ 0` | **0** | Ausente (sign-chart visual ya existe) |
| Inecuación cociente `x/(x+1) < 3` | **0** | Ausente |
| Inecuación cuadrática `x² ≤ x` | **0** | Ausente |
| Recta: pendiente entre 2 puntos | 1/5 (ex.u3.recta.2) | Cubierto |
| Recta: ordenada al origen | 1/5 (ex.u3.recta.3) | Cubierto |
| Recta: ecuación a partir de pendiente y ordenada | 1/5 (ex.u3.recta.5) | Cubierto |
| Recta: pasa por origen | 1/5 (ex.u3.recta.4) | Cubierto |
| Recta: forma general / segmentaria / punto-pendiente | **0** | Ausente |
| Recta paralela a una recta dada, pasa por un punto | **0** | Ausente (TEMA 1 Q5) |
| Recta perpendicular a una recta dada, pasa por un punto | **0** | Ausente (TEMA 2 Q5) |
| Recta con parámetro | **0** | Ausente (Problema 21) |
| Sistemas: eliminación / sustitución | 5/5 | Cubierto |
| Sistemas: clasificación (det / indet / incompatible) | **0** | Ausente |
| Sistemas: método gráfico (interpretación) | 0 (con visual secant pero sin pregunta) | Ausente |
| Sistemas: homogéneos | **0** | Ausente |
| Sistemas con parámetro | **0** | Ausente (Problema 27-29) |
| Exponenciales: igualación de bases | 4/4 (incluye base < 1 con exp negativo) | Cubierto |
| Exponenciales: factor común / cambio de variable | **0** | Ausente |
| Exponenciales: aplicación de logaritmos | **0** | Ausente (Problema 39) |
| Logaritmos: propiedades básicas (single log) | 2/4 (ex.u3.logaritmicas.2/5) | Cubierto |
| Logaritmos: propiedades con suma/resta de log | 1/4 (ex.u3.logaritmicas.3 = log(100)) | Parcial |
| Logaritmos: resolver `log(x) = 2` por definición | 1/4 (ex.u3.logaritmicas.4) | Cubierto |
| Logaritmos: cambio de base para resolver ecuación | **0** | Ausente (TEMA 1/2 Q3) |
| Logaritmos: dominio y verificación de validez | **0** | Ausente (PDF canónico p. 35-36) |

---

## 4. Tabla de cobertura visual en `mate-explorer`

**Estado de la fuente**: el repo `Teksi75/mate-explorer` retorna HTTP 404 al fetch público; la ruta local `C:\dev\mate-explorer` no existe; `C:\dev\absolute-inequality-lab` tampoco. La única traza escrita del proyecto es la observación Engram #2687 (`project: mate-explorer`, `scope: project`, `type: discovery`, `2026-07-01 08:22:04`). Reproduzco textualmente lo que sé del lado del dominio:

> "Current app has 2 available labs (absolute inequalities and line equation). The catalog still includes a stale `/matematica/ecuaciones-lineales` route wired to LineEquationLab while the catalog marks `ecuaciones-lineales` as coming-soon with null href; new modules should follow `src/<topic>/components|lib|tests` per repo standards."
> "Where": `src/App.tsx`, `src/lib/explorations.ts`, `src/components/ExplorationSelector.tsx`, `src/ecuaciones-lineales/components/LineEquationLab.tsx`, `src/components/AbsoluteInequalityLab.tsx`.

**Implicación para la auditoria**: no puedo afirmar nada sobre la cobertura visual de U3 en `mate-explorer` mas alla de la inferencia razonable de que (a) existe un `AbsoluteInequalityLab` (relevante para `|x-a| < c` y `|x-a| > c`) y (b) existe un `LineEquationLab` (relevante para pendiente/ordenada). **No tengo evidencia** de que `mate-explorer` hoy cubra sistemas, parámetro, paralelas/perpendiculares, ni inecuaciones producto/cociente. La tabla siguiente marca con `?` todo lo no verificable.

| Habilidad visual de la Unidad 3 | Soporte en `mate-explorer` (según Engram) | Notas |
|---|---|---|
| `\|x-a\| < c` (recta numérica con punto) | ✅ `AbsoluteInequalityLab` (asumido por nombre) | Necesita verificación del repo |
| `\|x-a\| > c` (dos rayos disjuntos) | ✅ `AbsoluteInequalityLab` (asumido por nombre) | Necesita verificación del repo |
| Recta en `y = mx + b` | ✅ `LineEquationLab` (asumido por nombre) | Necesita verificación del repo |
| Pendiente entre dos puntos | ❓ | No evidenciado |
| Forma punto-pendiente `y - y₁ = m(x - x₁)` | ❓ | No evidenciado |
| Recta paralela (misma pendiente) | ❓ | No evidenciado |
| Recta perpendicular (m₁·m₂ = -1) | ❓ | No evidenciado |
| Sistemas de rectas — interpretación secante | ❓ | El visual existe en `pre_utn` (`systems-of-lines`), no en `mate-explorer` |
| Sistemas — clasificación (compatible det/indet/incompatible) | ❓ | No evidenciado |
| Inecuaciones producto/cociente (sign-chart) | ❓ | No evidenciado |
| Inecuaciones cuadráticas (`x² ≤ x`) | ❓ | No evidenciado |
| Cambio de variable exponencial | ❓ | No evidenciado |
| Validación de dominio logarítmico | ❓ | No evidenciado |

**Recomendación de gating**: la siguiente fase de la auditoría de U3 no debería proponer visualizaciones en `mate-explorer` sin acceso al repo. El plan debe limitarse a: (a) declarar las visualizaciones que `pre_utn` ya soporta a nivel dominio (sign-chart, distance-on-line, cartesian-line, systems-of-lines, interval-set) y que podrían activarse con solo contenido; (b) marcar como follow-up "verificar `mate-explorer`" sin proponer implementación.

---

## 5. Brechas priorizadas

Priorización pedagógica: `P0` rompe la cobertura de un examen real; `P1` alto valor pedagógico no bloqueante; `P2` mejora recomendada; `P3` cosmético.

### P0 — Bloquean la transferencia a examen real

1. **Falta `mat.u3.ecuaciones_valor_absoluto`** como skill y como contenido. La sección 7 del PDF canónico (p. 7) y el Problema 8 de la guía práctica (p. 6) son una sección con identidad propia. Los exámenes TEMA 1/2 (Q3, Q4) la requieren. Sin ella, el alumno confunde `|x-2| = 5` con la inecuación y descarta soluciones válidas.

2. **Falta `mat.u3.traduccion_lenguaje_verbal`** como skill. El Problema 2 de la guía práctica (p. 3-4) tiene 14+ sub-items y es prerrequisito lógico para todo problema verbal posterior. Sin esta skill, el alumno no puede pasar de "el consecutivo par de un número par" a `2n + 2`. Este es el **gap más grave** de toda la unidad porque rompe la cadena de modelado.

3. **Falta la resolucion de ecuaciones cuadraticas con discriminante / fórmula general**. Solo se cubre factorización; los exámenes reales (TEMA 1/2) y el Problema 6 de la guía (p. 5-6) preguntan "para qué k las raíces son iguales / reales distintas / complejas", que requiere la fórmula `x = (-b ± √(b²-4ac)) / 2a` y el análisis de signo del discriminante.

4. **Falta la resolucion de ecuaciones logarítmicas con cambio de base y verificación de dominio**. La teoría cubre propiedades y la práctica cubre `log_a(b) = c` como una sola sustitución, pero los exámenes TEMA 1/2 Q3 (`log_2(x)+log_4(x)+log_16(x)=7`) requieren cambio de base + verificación del dominio. El PDF canónico (p. 35-36) lo trabaja como punto crítico: "obtenemos soluciones numéricas que no son válidas, lo que nos obliga a comprobar las soluciones obtenidas".

5. **Falta `mat.u3.recta.paralelas_perpendiculares`**. TEMA 1 Q5 y TEMA 2 Q5 son preguntas completas sobre paralela/perpendicular. La teoría no las cubre, no hay ejercicios. Sin esta skill, el alumno entra al examen sin la herramienta más usada en problemas de recta.

### P1 — Alto valor pedagógico, no bloqueante

6. **Falta `mat.u3.sistemas.clasificacion_y_parametro`**. Compatible det/indet/incompatible y sistemas con parámetro son los Problemas 24-29 y 33 de la guía práctica. El visual `systems-of-lines: { secant | parallel | coincident }` ya está implementado en el dominio (parse.ts:182-204) — falta contenido, no infraestructura.

7. **Falta `mat.u3.exponenciales.metodos_avanzados`**. Cambio de variable (Problema 39m de la guía práctica), factor común de `a^x`, aplicación de logaritmos cuando no se puede igualar bases. La teoría U3 solo cubre el caso de igualación directa.

8. **Falta `mat.u3.inecuaciones.producto_y_cociente`**. El visual `sign-chart` ya está implementado (parse.ts:148). Los Problemas 9p-w de la guía práctica (7+ sub-items) requieren esta skill. Cubre también inecuaciones cuadráticas (`x² ≤ x`) y racionales (`x/(x+1) < 3`).

9. **Falta `mat.u3.recta.forma_general_y_segmentaria`**. La forma `ax+by+c=0` y la segmentaria `x/x₀ + y/b = 1` son la base para entender parámetro en recta (Problema 21 de la guía práctica) y la intersección con los ejes.

10. **Falta `mat.u3.problemas_verbales`**. Mezclas, salarios, velocidades, costo-ingreso-utilidad. Problemas 3-7, 10, 13-15, 31 de la guía práctica. Esta es la **puerta de entrada** a la aplicación real de la unidad: el alumno entra al examen y le dan un problema verbal, no una ecuación pelada.

### P2 — Mejoras recomendadas

11. **Falta `mat.u3.inecuaciones_valor_absoluto.caso_avanzado`**: la variante `|2x-1|-2 ≥ 4` (TEMA 1 Q4) que requiere desplazar el término a un solo lado antes de aplicar la conjunción/disyunción. Cobertura: 0/4 ejercicios actuales.

12. **Falta `mat.u3.recta.distancia_entre_dos_puntos`** (no en el listado del usuario pero en el PDF canónico p. 16).

13. **Asimetría de `category`**: los 32 ejercicios U3 nuevos no tienen campo `category`, mientras que U1 per-skill sí. Si se quiere reportar cobertura por categoría o alimentar el diagnóstico, esta asimetría es deuda.

14. **`commonErrorTags` subutilizado en U3**: 31/32 ejercicios sin tags, los 8 mappings de `feedback/unit-3.json` quedan sin ejercicio que los dispare consistentemente.

15. **0 challenges en U3**: `content/matematica/challenges/` no tiene `unit-3.json`; el loader solo importa U1 y U2. El alumno que termina la práctica base de U3 no recibe la rampa 4-5 que sí recibe el alumno U1/U2.

### P3 — Cosmético

16. **No hay ejercicios de dificultad 5** en U3 (rampa llega hasta 4 en 1 solo ejercicio). Aceptable para una unidad introductoria pero no permite entrenar integración sin pasar por el flujo de challenges (que, además, no existe para U3).

17. **No hay `relatedTheoryIds` / `relatedExampleIds`** en los 32 ejercicios U3 nuevos. Convención del proyecto, no exigencia del modelo.

---

## 6. Recomendaciones de modificación

Ordenadas por valor pedagógico × costo de implementación. **Ninguna se ejecuta en esta entrega** (modo explore-only).

### Recomendación 1 — `traduccion-lenguaje-verbal-u3` (P0, esfuerzo medio)
- Crear skill nueva `mat.u3.traduccion_lenguaje_verbal` en `src/domain/models/skill-catalog.ts:36-45` (UNIT_3_SKILLS) y en `src/domain/catalog/pilot-skills.ts:86-124` (PILOT_SKILLS).
- Crear `TheoryNode` en `content/matematica/theory/unit-3.json` con 3-4 conceptos: "del enunciado a la variable", "doble/triple/mitad", "consecutivo/anterior/par", "20%/tarifa/media".
- Crear 4-6 `WorkedExample` en `content/matematica/examples/unit-3.json` (cubrir los 14 sub-items del Problema 2 con agrupamiento).
- Crear `FeedbackMapping` para errores típicos (`u3_traduccion_variable_no_identificada`).
- Crear 8-10 ejercicios MC en `content/matematica/exercises/unit-3.json` (rango difficulty 1-3).
- **Por qué P0**: prerrequisito lógico para todos los problemas verbales posteriores; el alumno que no puede modelar el enunciado está perdido en el resto de la unidad.

### Recomendación 2 — `cuadraticas-discriminante-u3` (P0, esfuerzo bajo)
- Agregar 2 conceptos al `TheoryNode` existente `mat.u3.ecuaciones_cuadraticas` (formula cuadrática + análisis del discriminante), sin crear skill nueva.
- Crear 1 `WorkedExample` con la fórmula y 1 con discriminante para "decidir el tipo de raíces".
- Crear 4 ejercicios MC en `exercises/unit-3.json` (discriminante: 0/<0/>0, fórmula general: -b±√(b²-4ac)/2a).
- Crear 1 `FeedbackMapping` `u3_discriminante_signo` (señalar la confusión entre "sin raíces reales" y "raíz doble").
- **Por qué P0**: el Problema 6 de la guía práctica y el flujo natural de TEMA 1/2 lo requieren.

### Recomendación 3 — `ecuaciones-valor-absoluto-u3` (P0, esfuerzo medio)
- Crear skill nueva `mat.u3.ecuaciones_valor_absoluto` (separada de `inecuaciones_valor_absoluto`).
- Crear `TheoryNode` con 3 conceptos: `|x|=k` y la disyunción, `|ax+b|=c`, `|ax+b|=|cx+d|`.
- Crear 2 `WorkedExample`, 2 `FeedbackMapping` (`u3_ecuacion_abs_sin_sol`, `u3_ecuacion_abs_dos_casos`).
- Crear 5-6 ejercicios MC en `exercises/unit-3.json`.
- **Por qué P0**: el PDF canónico p. 7 lo separa de las inecuaciones; los exámenes TEMA 1/2 mezclan ambas formas.

### Recomendación 4 — `logaritmicas-resolucion-u3` (P0, esfuerzo medio)
- Agregar 2 conceptos al `TheoryNode` existente: "resolución por definición" y "cambio de base en ecuación".
- Crear 2 `WorkedExample` (cambio de base, dominio).
- Crear 4 ejercicios MC en `exercises/unit-3.json` (uno de los cuales es el TEMA 1 Q3 reformulado).
- Crear 1 `FeedbackMapping` `u3_log_dominio_solucion_invalida` (el alumno que no verifica el dominio).
- **Por qué P0**: TEMA 1/2 Q3 lo preguntan; el PDF canónico p. 35-36 lo trabaja como punto crítico.

### Recomendación 5 — `recta-paralelas-perpendiculares-u3` (P0, esfuerzo bajo)
- Agregar 3 conceptos al `TheoryNode` existente: "rectas paralelas (misma pendiente)", "rectas perpendiculares (m₁·m₂ = -1)", "hallar la ecuación a partir de las condiciones".
- Crear 1 `WorkedExample` con paralela y 1 con perpendicular.
- Crear 4 ejercicios MC en `exercises/unit-3.json` (reformular TEMA 1 Q5 y TEMA 2 Q5).
- Crear 1 `FeedbackMapping` `u3_recta_paralela_signo_incorrecto`.
- El visual `cartesian-line` con `point-slope` y `two-point` (types.ts:42-51) ya soporta el render.
- **Por qué P0**: TEMA 1/2 Q5 lo preguntan explícitamente.

### Recomendación 6 — `sistemas-clasificacion-y-parametro-u3` (P1, esfuerzo medio)
- Agregar 2 conceptos al `TheoryNode` existente: "clasificación (compatible det/indet/incompatible)" y "sistemas con parámetro".
- Crear 1 `WorkedExample` con cada caso.
- Crear 4 ejercicios MC en `exercises/unit-3.json` (reformular Problema 24-29).
- Activar los `systems-of-lines` con clasificación `parallel` y `coincident` (visual ya implementado).
- Crear 1 `FeedbackMapping` `u3_sistemas_clasificacion_erronea`.
- **Por qué P1**: no es P0 porque el TEMA 1/2 no pregunta explícitamente por clasificación, pero el Problema 24-29 de la guía práctica la requiere.

### Recomendación 7 — `inecuaciones-producto-cociente-u3` (P1, esfuerzo medio)
- Crear skill nueva `mat.u3.inecuaciones_producto_cociente` (separada de `inecuaciones_lineales`).
- Crear `TheoryNode` con 3 conceptos: "tabla de signos", "inecuación producto", "inecuación cociente".
- Crear 1 `WorkedExample` con visual `sign-chart` (ya implementado).
- Crear 4 ejercicios MC en `exercises/unit-3.json` (reformular Problema 9p-w).
- Crear 1 `FeedbackMapping` `u3_inecuacion_signo_invertido`.
- **Por qué P1**: el visual ya existe, el gap es solo contenido.

### Recomendación 8 — `problemas-verbales-u3` (P1, esfuerzo medio-alto)
- Crear skill nueva `mat.u3.problemas_verbales` con prerrequisito de `mat.u3.traduccion_lenguaje_verbal`.
- Crear `TheoryNode` con 3-4 conceptos: "modelado con una variable", "estructura mezcla/velocidad/costo-ingreso", "interpretación de la solución".
- Crear 4 `WorkedExample` (uno por tipo: mezcla, velocidad, costo-ingreso, sistema verbal).
- Crear 6 ejercicios MC con 4 opciones y enunciado verbal (reformular Problema 3-7, 10, 13-15, 31).
- **Por qué P1**: el TEMA 1/2 no pregunta explícitamente por problemas verbales, pero la **mitad** de la guía práctica son problemas verbales.

### Recomendación 9 — `challenges-u3` (P2, esfuerzo bajo si se hace junto a otra)
- Crear `content/matematica/challenges/unit-3.json` con 2 challenges por skill × 8 skills = 16 challenges, todos `difficulty: 4-5`, `type: "multiple-choice"`, 4 opciones, `challengeSection: true`, `category: "desafio"`, `tags: ["desafio", "integrador"]`, `canonicalTrace` válido.
- Actualizar `src/lib/challenges/loader.ts:18-19` para importar `unit-3` en `UNIT_REGISTRY`.
- Sigue el precedente del PR `challenge-exercises-expansion` (STATUS.json línea 395-402).
- **Por qué P2**: el alumno que termina la práctica U3 hoy no recibe rampa 4-5, asimétrico con U1/U2.

### Recomendación 10 — `metadatos-u3-2026` (P3, esfuerzo bajo)
- Agregar campo `category` a los 32 ejercicios U3 nuevos siguiendo la convención U1 (`errores-comunes`, `caso-1`, etc.) o definir nuevas categorías U3 (`factorizacion`, `discriminante`, `forma-pendiente-ordenada`, etc.).
- Poblar `commonErrorTags` en los 32 ejercicios U3 nuevos (mapeo 1-a-1 con los 8 mappings de `feedback/unit-3.json`).
- Poblar `relatedTheoryIds` y `relatedExampleIds` con los IDs reales de la teoría y los ejemplos.
- **Por qué P3**: no es pedagógicamente bloqueante, pero la asimetría con U1 y el subutilizo del feedback library son deuda visible.

---

## 7. Recomendaciones de eliminación / baja prioridad

- **No eliminar nada del contenido U3 actual.** Las 8 skills están activas, el catálogo de 37 ejercicios cumple el umbral de 24, los 16 ejemplos cubren los 8 ejes básicos, y los 8 feedback mappings son correctos. La expansión es aditiva, no sustitutiva.

- **No priorizar visualizaciones para todo.** `mate-explorer` (estado no verificable) y los visuales del dominio de `pre_utn` ya cubren los casos donde la visualización SÍ aporta. Para los casos algebraicos puros (factorización de trinomio, propiedades de logaritmos, demostración de ecuación equivalente) **no** recomiendo visualización — agregaría ruido pedagógico. La política del usuario es clara: "Do not recommend visualizing everything by default".

- **No mover el visual `systems-of-lines: parallel / coincident` a `mate-explorer`.** El visual ya está implementado en `pre_utn/src/domain/visuals/` y se renderiza correctamente. Sacarlo a `mate-explorer` duplicaría implementación sin valor pedagógico adicional. La regla es: si el visual cabe en el flujo de práctica guiado (teoría → ejemplo → ejercicio), se queda en `pre_utn`; si requiere exploración libre del alumno, se evalúa caso por caso.

- **No expandir `mat.u3.exponenciales` ni `mat.u3.logaritmicas` con difficulty 5** hasta que existan los challenges de U3 (Recomendación 9). Sin challenges, los ejercicios de difficulty 4-5 quedan en el limbo entre práctica base y desafío.

- **No introducir `mat.u3.complejos` ni temas que la guía UTN-FRM no pide para U3.** Aunque el TEMA 1/2 pregunta por complejos (Q1), eso es **revisión de U1**, no contenido de U3. Mezclar unidades sería un error pedagógico.

---

## 8. Propuesta de issues separados

Para alinear con la práctica del proyecto (PRs por scope, auto-forecast cuando aplica), propongo **un issue por recomendación P0/P1** (5-7 issues), todos independientes y con un orden de merge sugerido que respeta prerrequisitos pedagógicos.

| # | Issue (título candidato) | Recomendación | Tipo | Prerrequisitos | PRs estimados |
|---|---|---|---|---|---|
| 1 | `feat(u3): agregar skill traducción de lenguaje verbal` | R1 | content+theory+examples+feedback+exercises | ninguno | 1 PR (~350 líneas) |
| 2 | `feat(u3): agregar discriminante y fórmula general a cuadráticas` | R2 | content+theory+examples+feedback+exercises | ninguno | 1 PR (~200 líneas) |
| 3 | `feat(u3): agregar skill ecuaciones con valor absoluto` | R3 | nueva skill + contenido completo | ninguno | 1 PR (~400 líneas) |
| 4 | `feat(u3): agregar resolución de ecuaciones logarítmicas (cambio de base + dominio)` | R4 | theory+examples+feedback+exercises | ninguno | 1 PR (~250 líneas) |
| 5 | `feat(u3): agregar rectas paralelas y perpendiculares` | R5 | theory+examples+feedback+exercises+visual | ninguno | 1 PR (~300 líneas) |
| 6 | `feat(u3): agregar clasificación y parámetro en sistemas` | R6 | theory+examples+feedback+exercises+visual (`systems-of-lines: parallel/coincident`) | ninguno | 1 PR (~350 líneas) |
| 7 | `feat(u3): agregar inecuaciones producto y cociente` | R7 | nueva skill + contenido + visual `sign-chart` | ninguno | 1 PR (~300 líneas) |
| 8 | `feat(u3): agregar problemas verbales / modelado` | R8 | nueva skill + contenido (recomendado después de #1) | issue #1 | 1 PR (~400 líneas) |
| 9 | `feat(u3): poblar challenges unit-3.json (16 challenges)` | R9 | content + loader | issues #1-#6 (al menos 2-3 de los PRs previos) | 1 PR (~250 líneas) |
| 10 | `chore(u3): poblar category, commonErrorTags, relatedTheoryIds en ejercicios U3 existentes` | R10 | metadata (no toca domain) | ninguno | 1 PR (~200 líneas) |

**Orden de merge sugerido**:
1. #1 (traducción) — desbloquea #8 (problemas verbales).
2. #5 (rectas paralelas/perpendiculares) — única skill visual que no existía en absoluto en U3.
3. #2 (cuadráticas) — incrementa la calidad de `ecuaciones_cuadraticas` sin crear skill.
4. #3 (valor absoluto) — skill nueva pero contenido corto.
5. #4 (logarítmicas) — incrementa `logaritmicas` sin crear skill.
6. #6 (sistemas) — incrementa `sistemas` sin crear skill.
7. #7 (producto/cociente) — skill nueva con visual ya listo.
8. #8 (problemas verbales) — depende de #1.
9. #9 (challenges) — depende de 2-3 de los anteriores.
10. #10 (metadata) — independiente, en cualquier momento.

**Cadena vs auto-forecast**: la entrega pasada `implement-unit-3-mathematics` usó chained PRs apilados a main con 3 PRs y ~750 líneas combinadas (STATUS.json línea 543-559). El orden sugerido arriba es compatible con esa estrategia: cada PR es reviewable independientemente y se mergea antes de que el siguiente se abra.

**Presupuesto de revisión**: 400 líneas por PR. Cada issue individual cabe en ese presupuesto. Si se quisiera agrupar (p. ej. #1 + #8 = problemas verbales completos), el combinado cabe en 2 PRs con la excepción de tamaño permitida para cohesión pedagógica.

---

## 9. Riesgos pedagógicos

### Riesgo 1 — **Sobre-ponderar `mate-explorer` en el plan sin acceso al repo**
Si la próxima fase asume que `mate-explorer` ya cubre sistemas, parámetro, paralelas/perpendiculares, e inecuaciones producto/cociente, y basa el plan en eso, el resultado será un plan de contenido duplicado o un plan de visualizaciones que no se puede entregar. **Mitigación**: ninguna recomendación de esta auditoría depende de `mate-explorer`. Las visualizaciones propuestas se quedan en `pre_utn/src/domain/visuals/` que ya tiene el código.

### Riesgo 2 — **Multiplicación de skills sin consolidar**
Cada `P0` que crea skill nueva (`traduccion_lenguaje_verbal`, `ecuaciones_valor_absoluto`, `inecuaciones_producto_cociente`, `problemas_verbales`) suma al `FocusSelector` del alumno. El selector ya muestra 8 skills U3; pasar a 12 puede diluir el foco. **Mitigación**: las skills nuevas deben agruparse en el `FocusSelector` por _agrupador_ (un "wrapper" de problema verbal que contiene los 14 sub-items como un solo nodo, no 14 nodos separados). El audit de Unidad 1 (H-03 sobre `intervalos`) ya marcó este patrón.

### Riesgo 3 — **Migración de los 5 ejercicios U3 legados de `exercises.json`**
El audit pass de U3 dejó los 5 ejercicios originales (`.1`) en `exercises.json` con tags `u2_aislamiento_variable` y `u2_signo_al_mover` (verificado en `exercises.json:9-12`). Estos tags son **incorrectos** (son de U2, no U3) y la observación del propio cambio `implement-unit-3-mathematics` lo marcó: "los 5 legacy `exercises.json` U3 monolith entries carry `u2_*` tags from an older migration era". Si los nuevos ejercicios U3 (que tienen tags U3 correctos) compiten con estos 5, el feedback puede quedar ruidoso. **Mitigación**: el issue #10 debería incluir la limpieza de los 5 legados, no solo poblar los 32 nuevos.

### Riesgo 4 — **Romper la secuencia de prerrequisitos**
Las skills nuevas propuestas (R1 `traduccion_lenguaje_verbal`, R8 `problemas_verbales`) se convierten automáticamente en prerrequisitos de las existentes si no se decide explícitamente. Si `problemas_verbales` se vuelve prerrequisito de `ecuaciones_lineales`, la práctica de `ecuaciones_lineales` queda bloqueada para cualquier alumno que no haya pasado por `problemas_verbales`. **Mitigación**: las skills nuevas deben ser **hojas**, no prerrequisitos de las existentes. Solo `problemas_verbales` puede tener `traduccion_lenguaje_verbal` como prerrequisito (R8 explícitamente lo dice).

### Riesgo 5 — **Inconsistencia entre las opciones MC y el dominio del input**
El audit U3 verificó que las opciones de los 32 ejercicios nuevos son strings o `{ value, label }` puros (parse.ts:215-224). Sin embargo, el Problema 2 de la guía práctica UTN-FRM tiene items con respuestas en `2n+2`, `0.20x`, `2x-1` — formato simbólico. La app puede aceptar `symbolic` (`conventions.md:48`) pero solo cuando hay una sola representación canónica. Parafrasear "el consecutivo par de un número par" en MC con 4 opciones requiere opciones que sean `2n`, `2n+1`, `2n+2`, `n+2` y validar que el alumno entiende **por qué** la respuesta es `2n+2`. **Mitigación**: la skill `traduccion_lenguaje_verbal` debería usar `multiple-choice` con distractores semánticos (no numéricos), no `symbolic` para evitar el problema que la guía `math-render-safety` quiere evitar.

### Riesgo 6 — **Pérdida de trazabilidad canónica al expandir contenido**
Cada ejercicio nuevo tiene un `canonicalTrace` con `path` apuntando a `material_canonico/Matemática/UNIDAD3_matemática.pdf` (un path que ya no existe en disco porque la deduplicación de `material_canonico/` movió todo a `utn-frm/matematica/unidad-03/`). Los 8 mappings de `feedback/unit-3.json` apuntan al path viejo, y los 32 ejercicios nuevos no tienen `canonicalTrace` propio (verificado por búsqueda de `"canonicalTrace"` en `exercises/unit-3.json` — no aparece). **Mitigación**: el issue #10 debería corregir los paths en `feedback/unit-3.json` y poblar `canonicalTrace` en los ejercicios nuevos, apuntando a `material_canonico/utn-frm/matematica/unidad-03/teoria/UNIDAD 3_2025 TEORÍA.pdf` y `practica/03_ej_utn.pdf` respectivamente.

### Riesgo 7 — **Voice drift con el modelo de marca**
Cualquier copy de feedback o practicePrompt que diga "yo te ayudo a modelar", "vamos a traducir tu enunciado", "yo te corrijo el planteo" viola la decisión de marca B3 (AGENTS.md líneas sobre Ingenium). La app es material de apoyo, no profe digital. **Mitigación**: pasar todo copy nuevo por la brand-voice source scan antes de mergear.

---

## 10. Próximo paso recomendado

**Siguiente acción concreta**: si el usuario decide priorizar una sola entrega, **recomiendo el issue #1 (`traduccion-lenguaje-verbal-u3`)** como primera.

- **Por qué primero**: es la **puerta de entrada** a todas las habilidades de modelado (R8, R2, R3, R4, R5 dependen implícitamente de que el alumno pueda traducir lenguaje verbal a algebra). Sin esta skill, las otras expansiones siguen dejando al alumno sin la herramienta fundamental.
- **Por qué bajo riesgo**: contenido-only (1 PR ~350 líneas, dentro del presupuesto de 400), no toca el modelo `Exercise`, no toca el loader, no cambia prerrequisitos. Se puede mergear con confianza después de los gates existentes (test, typecheck, build).
- **Por qué reversible**: si la pedagogía no funciona, se remueve la skill del `FocusSelector` y se archivan los 8-10 ejercicios sin afectar el resto.
- **Por qué descongestiona**: 1 PR de ~350 líneas es la mitad del presupuesto; deja margen para mergear el #5 (rectas) en la misma sesión si el usuario tiene tiempo.

**Orden de las próximas dos**: #5 (rectas paralelas/perpendiculares) + #1 (traducción) en paralelo, o #1 → #5. La razón: ambas son content-only, ambas cubren TEMA 1/2, y ambas son prerrequisitos de otras (R5 lo es de R6 sistemas con parámetro; R1 lo es de R8 problemas verbales).

**Qué NO hacer todavía**: no iniciar R6 (sistemas) ni R9 (challenges) sin haber puesto al menos 2-3 de los issues P0. Challenges de U3 sin contenido nuevo siguen siendo una rampa de difficulty 4-5 sobre los 8 ejes básicos — útil pero no transformador.

**Antes de empezar, validar**:
- Confirmar con el usuario si la prioridad de las recomendaciones P0 sigue el orden sugerido o si hay una (p. ej. R5 sobre R1) que pesa más.
- Confirmar acceso a `mate-explorer` o decidir que esta entrega no toca la app complementaria.
- Confirmar que el cambio `implement-unit-3-mathematics` (STATUS.json línea 543-559) sigue siendo la fuente de verdad del estado U3 y que no hay issues abiertos nuevos sobre U3.

---

## Apéndice A — Evidencia cruda y archivos inspeccionados

**App / repo (`C:\dev\pre_utn`)**:
- `content/matematica/theory/unit-3.json:1-531` — 8 theory nodes, 27 conceptos
- `content/matematica/examples/unit-3.json:1-463` — 16 worked examples
- `content/matematica/feedback/unit-3.json:1-49` — 8 feedback mappings
- `content/matematica/exercises.json:1-274` — 5 entradas U3 legadas (líneas 3-74)
- `content/matematica/exercises/unit-3.json:1-471` — 32 entradas U3 nuevas
- `content/matematica/challenges/` — solo `unit-1.json` y `unit-2.json` (no `unit-3.json`)
- `src/app/practice/page.tsx:1-356` — `PracticePage`, fases 1-4, integración `ChallengeFlow` en línea 223-228
- `src/app/practice/usePracticeFlow.ts:80-435` — flow state machine, `handleSkillSelect` carga teoría+ejemplos+feedback+ejercicios por skillId
- `src/app/practice/start-skill.ts:12-14, 69-104` — `PRACTICE_SKILL_UNIT_MAP`, `analyzeRequestedSkill` con prerequisite check (umbral 0.7)
- `src/domain/catalog/pilot-skills.ts:9-141` — `PILOT_SKILLS` con 23 entradas (8 U1 + 7 U2 + 8 U3)
- `src/domain/models/skill-catalog.ts:36-45` — `UNIT_3_SKILLS` con 8 skill IDs
- `src/domain/catalog/content-loaders.ts:30, 33, 36, 41, 632-636, 870-873` — `theoryUnit3`, `examplesUnit3`, `feedbackUnit3`, `unit3Exercises`, `UNIT_EXERCISE_FILES[3]`, `UNIT_THRESHOLDS["unit-3"] = 24`
- `src/domain/catalog/content-loaders.ts:483-521, 646-693` — `loadTheoryContent`, `loadExampleContent`, `loadFeedbackContent`, `loadExercisesForSkill`
- `src/lib/challenges/loader.ts:18-30, 196-213` — `unit1ChallengesRaw`, `unit2ChallengesRaw`, `loadChallengesForUnit`, `loadChallengesForSkill`
- `src/domain/visuals/types.ts:17-125` — `SignChartVisual`, `CartesianLineVisual` (5 formas), `DistanceOnLineVisual`, `SystemsOfLinesVisual` (3 clasificaciones), `IntervalSetVisual`, `PedagogicalVisual`
- `src/domain/visuals/parse.ts:148, 163, 167, 182-205, 326-331` — parsers de las 5 clases de visual
- `openspec/changes/implement-unit-3-mathematics/verify-report.md:44-156` — reporte de verificación del slice U3
- `openspec/changes/STATUS.json:543-559` — entrada del change `implement-unit-3-mathematics` (status: done)
- `openspec/specs/challenge-exercises/spec.md:1-198` — contrato de challenges (Pilot Skill Challenge Coverage: 2 per skill)
- `openspec/specs/practice-coverage/spec.md:102-128` — Per-Unit Validation Scope (validador usa `UNIT_THRESHOLDS`)

**Material canónico local (UTN-FRM, en `material_canonico/utn-frm/matematica/unidad-03/`)**:
- `teoria/UNIDAD 3_2025 TEORÍA.pdf` (36 páginas, 1.14 MB) — extraído con PyMuPDF
- `practica/03_ej_utn.pdf` (16 páginas, 536 KB)
- `examenes/Examen_Matemática_TEMA 1 RESPUESTAS.pdf` (5 páginas, 1.0 MB) — parcial, solo Q1-Q5 tienen contenido, Q6-Q10 son enunciados
- `examenes/Examen_Matemática_TEMA 2 RESPUESTAS.pdf` (5 páginas, 1.0 MB) — análogo al TEMA 1
- `resoluciones/` (vacío, registrado en `fuentes.local.json` pero no poblado)
- `README_LOCAL.md:1-9` — confirma multi-institución, no versionado
- `fuentes.local.json:1-34` — 4 entradas U3 con `institution: "utn-frm"`

**Engram**:
- `sdd-init/pre_utn` (#1191) — stack y convenciones SDD/TDD
- `sdd/{change-name}/explore` candidates pre-existentes: `implement-unit-3-mathematics`, `challenge-exercises`, `consolidate-math-mvp-before-unit-3`
- `mate-explorer` #2687 — única traza de la app complementaria, 2 labs (Absolute, LineEquation)

**Fuentes no disponibles en esta sesión**:
- `Teksi75/mate-explorer` (HTTP 404)
- `C:\dev\mate-explorer` (no existe)
- `C:\dev\absolute-inequality-lab` (no existe)
- `docs/sources/sources.manifest.json` (no existe; `docs/sources/` tampoco)

## Apéndice B — Limitaciones y siguientes pasos para refinar

1. **No accedí a mate-explorer**: la tabla de cobertura visual está mayormente marcada con `?`. Si se quiere una auditoría de la app complementaria con base firme, hay que: (a) clonar el repo en `C:\dev\mate-explorer`, o (b) pedir al usuario acceso de lectura, o (c) extender Engram con un observation específica sobre la estructura de `mate-explorer`.

2. **No corrí `pnpm run test / typecheck / build`** (modo read-only). El baseline declarado en la sección 8 (184 ejercicios totales, `UNIT_THRESHOLDS["unit-3"] = 24`, 8 feedback mappings) es el del último verify-report. Si el usuario está en otra rama, los conteos pueden variar.

3. **No medí cobertura de tests de los 32 ejercicios U3** (qué % de los modelos de dominio están cubiertos por los `shape tests` de U3). El proyecto tiene `src/domain/__tests__/content-loaders-u3.test.ts:1-412` que ya cubre el shape mínimo (8 skill IDs, 16 ejemplos, 8 feedback mappings, 32 ejercicios); no verifiqué que cada `commonErrorTag` en los nuevos ejercicios tenga matching feedback (esa auditoría está en el issue #10 propuesto).

4. **No inspeccioné el render de los 5 `visualExamples` en la UI de `mate-explorer` (no hay acceso)**. La inspección del dominio en `pre_utn/src/domain/visuals/` confirma que el código existe y está testeado en `parse.test.ts:1-700+`, pero no vi la página de práctica renderizando el visual de la teoría de inecuaciones con valor absoluto en un browser real.

5. **No validé con el alumno**: las recomendaciones P0 son **inferencias** desde la fuente canónica, no validadas con Pablo (profesor) ni con alumnos reales. Si la siguiente fase es implementar R1, valida con Pablo que "el consecutivo par de un número par" se trabaja como `2n+2` y no como `2n` (distractor) o `2n-2`. La ambigüedad puede estar en el modelo que el examen real espera.

6. **Cuentas de práctica por skill y dificultad (Sección 3)**: hice el conteo por grep + script Python sobre los JSON. No validé contra `loadExercisesForSkill` en runtime. Si hay un bug en el loader (p. ej. deduplicación agresiva), el conteo real puede diferir.

7. **`examenes/Examen_Matemática_TEMA X RESPUESTAS.pdf` solo tienen contenido en Q1-Q5** (las páginas Q6-Q10 son escaneos sin texto extraíble o están en blanco). Las 5 preguntas con texto son las que usé para la auditoría. Si Pablo tiene acceso a la versión con enunciados + respuestas para Q6-Q10 (probablemente con más contenido de U3: problemas verbales, parámetro, sistemas), la auditoría debería extenderse.

8. **No audité la cobertura cross-unit**: la práctica de `mat.u3.logaritmicas` (con prerrequisito `mat.u1.logaritmos`) y `mat.u3.exponenciales` (con prerrequisito `mat.u1.potencias_raices`) asume que el alumno ya domina U1. No verifiqué si el contenido de U1 cubre todo lo que U3 da por hecho. El propio verify-report de `implement-unit-3-mathematics` lo validó en su momento, pero si U1 cambió desde entonces, la auditoría U3 puede tener gaps implícitos.
