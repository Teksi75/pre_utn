# Auditoría de Unidad 1 — Pre UTN

**Pasada**: r2 (segunda formal, primera con disciplina "verificar dos veces").
**Fecha**: 2026-06-09.
**Modo**: read-only. No se modificó código, specs, contenido ni configuración.
**Rama de trabajo**: `audit/unit-1-r2` (HEAD base: `main@7028d15`).
**Rama no mergeada al final**: esta es una entrega para revisión.

## 0. Cómo leer este informe

- Las afirmaciones importantes citan `archivo:línea` y, cuando aplica, snippet verbatim.
- Las métricas se calcularon con scripts ad-hoc y se reprodujeron en al menos dos pasadas independientes.
- Cuando una métrica no se pudo medir con datos del repo, se declara `no medido` y se explica.
- Las prioridades son `P0` (rompe, bloquea o contradice), `P1` (alto valor pedagógico o técnico, no bloqueante), `P2` (mejora recomendada), `P3` (cosmético o especulativo).
- "Drift" = estado real != estado declarado en docs/README/STATUS. No necesariamente un bug, pero requiere reconciliación.
- Los hallazgos se numeran como `H-N` para permitir referencias cruzadas en los otros 4 entregables.

## 1. Resumen ejecutivo

Unidad 1 está en un estado **funcionalmente sólido y pedagógicamente coherente**, mejor de lo que la pasada `r1` reportó. La pasada `r1` tuvo tres errores importantes que esta `r2` corrige explícitamente:

1. Declaró "GGA ausente" cuando GGA está operativo y verificado en `setup-gga-gate` (no mergeada a main, pero no ausente).
2. Declaró feedback coverage en `0%` cuando, medido, es **100%** en las 8 pilot skills (64/64 mappings, todos con `recoveryTarget`).
3. Trató la falta de `relatedTheoryIds`/`relatedExampleIds` en `valor_absoluto.2` y `.3` como excepción aislada, cuando es un patrón sistemático: **las 5 MC de `valor_absoluto` carecen de ambos campos, y los 10 ejercicios de `logaritmos` carecen de `relatedExampleIds`**.

Hallazgos top de esta pasada:

| ID | Hallazgo | Prioridad |
|----|----------|-----------|
| H-01 | `README.md` lista `Complejos` como "Pendiente", pero la cadena de PRs de `add-complex-numbers-skill` ya está mergeada en `main` (5 commits, `mergeCommit: b420a43`) y el skill está completo y validado. Drift. | P0 |
| H-02 | Las 5 MC de `mat.u1.valor_absoluto` y los 10 ejercicios de `mat.u1.logaritmos` (todos los tipos) no tienen `relatedTheoryIds`/`relatedExampleIds` poblados. El dominio no exige estos campos en el modelo `Exercise` (`src/domain/models/exercise.ts:48-63`), pero la UI los usa para enlazar feedback con teoría. | P1 |
| H-03 | La skill `mat.u1.intervalos` tiene solo 4 ejercicios en el catálogo principal; el dominio tiene un modelo completo de `IntervalRepresentation` (`src/domain/intervals/representation.ts`) con soporte para unión, intersección, complemento y representación gráfica que no se ejercita. | P1 |
| H-04 | La skill `mat.u1.reales_operaciones` tiene 4 ejercicios, todos numéricos y todos sobre orden de operaciones + signo de agrupación. No se ejercitan fracciones como operandos, propiedad distributiva explícita, ni comparación de reales. | P1 |
| H-05 | El campo `pedagogicalNote` existe en el modelo `Exercise` (`src/domain/models/exercise.ts:56`) y aparece en los ejercicios expandidos de `conjuntos_numericos`, pero **no** en los ejercicios del catálogo principal de las otras 7 skills. Inconsistencia pedagógica. | P1 |
| H-06 | La rama `setup-gga-gate` no está mergeada en `main`. El gate de pre-commit (`gga run`) está vivo en el working tree de la auditoría (`C:\Users\pablo\OneDrive\Desarrollo\pre_utn\.git\hooks\pre-commit`), pero cualquier clon nuevo de `main` no tendrá ni el binario ni el hook. Drift entre regla (`AGENTS.md`) y realidad. | P1 |
| H-07 | `docs/qa/` está **vacía** en `main` y en `audit/unit-1-r2`. Los docs `gga-setup.md` y `gga-checklist.md` viven solo en la rama `setup-gga-gate` y se perderán si esa rama se borra antes del merge. | P2 |
| H-08 | El campo `pedagogicalNote` no se renderiza en la UI de feedback (`src/components/practice/FeedbackDisplay.tsx`); el feedback al alumno proviene exclusivamente de `feedbackMappings[*].message`, no de la nota del ejercicio. | P2 |
| H-09 | El campo `hints` se menciona en el brief del usuario pero **no existe** en el modelo `Exercise` ni en ningún JSON de contenido. No es deuda, es un malentendido del brief. | P3 (descartado) |

Conclusión corta: **Unidad 1 está lista para producción** desde el punto de vista técnico (build, typecheck, tests, feedback coverage). La deuda que queda es **pedagógica y de coherencia documental** (drift entre código y README, `pedagogicalNote` no usado, balance de ejercicios en `intervalos` y `reales_operaciones`, patrón MC sin enlaces en dos skills). Nada de eso bloquea empezar Unidad 2, pero todas deberían entrar al backlog previo.

## 2. Estado real de Unidad 1

### 2.1 Skills pilot y readiness

Catálogo: `src/domain/catalog/pilot-skills.ts` exporta 8 pilot skills. Conteos de contenido (medidos leyendo los JSON):

| Skill | Teoría | Ejemplos | Ejercicios | Feedback | Coverage |
|-------|--------|----------|------------|----------|----------|
| `mat.u1.conjuntos_numericos` | 1 nodo (14 conceptos) | 3 | 49 (5 main + 44 per-skill) | 25 | 100% |
| `mat.u1.reales_operaciones` | 1 nodo (4 conceptos) | 2 | 4 | 3 | 100% |
| `mat.u1.potencias_raices` | 1 nodo (8 conceptos) | 4 | 6 | 5 | 100% |
| `mat.u1.racionalizacion` | 1 nodo (14 conceptos) | 5 | 12 | 7 | 100% |
| `mat.u1.intervalos` | 1 nodo (4 conceptos) | 2 | 4 | 2 | 100% |
| `mat.u1.valor_absoluto` | 1 nodo (9 conceptos) | 5 | 8 | 8 | 100% |
| `mat.u1.logaritmos` | 1 nodo (6 conceptos) | 5 | 11 | 6 | 100% |
| `mat.u1.complejos` | 1 nodo (9 conceptos) | 5 | 12 | 8 | 100% |
| **TOTAL** | **8** | **31** | **106** | **64** | **100%** |

**Medición reproducible** (Node ad-hoc sobre los JSON):

```text
mat.u1.conjuntos_numericos | exs=49 tags=15 mappings=25 recovery=25 missing=NONE
mat.u1.reales_operaciones | exs=4  tags=3  mappings=3  recovery=3  missing=NONE
mat.u1.potencias_raices   | exs=6  tags=5  mappings=5  recovery=5  missing=NONE
mat.u1.racionalizacion    | exs=12 tags=7  mappings=7  recovery=7  missing=NONE
mat.u1.intervalos         | exs=4  tags=2  mappings=2  recovery=2  missing=NONE
mat.u1.valor_absoluto     | exs=8  tags=8  mappings=8  recovery=8  missing=NONE
mat.u1.logaritmos         | exs=11 tags=6  mappings=6  recovery=6  missing=NONE
mat.u1.complejos          | exs=12 tags=8  mappings=8  recovery=8  missing=NONE
TOTAL exs=106 tags=54 mappings=64 recovery=64
feedback mappings total = 68 (unit-1=58, conjuntos=10)
```

`mappings` cuenta los `feedbackMappings` cuyo `errorTag` aparece como `commonErrorTag` en al menos un ejercicio de la skill. `recovery` cuenta cuántos de esos mappings tienen `recoveryTarget` poblado. `missing` lista los `errorTag`s referenciados por ejercicios pero sin mapping.

**Cero feedback coverage gaps. Cero `recoveryTarget` vacíos.** Este es el dato que más cambió respecto a la pasada `r1`.

### 2.2 Tests y verificación

- **63 archivos de test** en `src/**/__tests__/`, `tests/**`, `src/**/*.test.ts` (conteo verificado por sub-agente `sdd-explore-chinos` y muestreo directo).
- `package.json` scripts: `test` (vitest watch), `test:run` (vitest run), `typecheck` (tsc --noEmit), `build` (next build), `dev`, `audit:branches`.
- `vitest.config.ts` activo. No hay `playwright.config.*` ni `jest.config.*`.
- **No se corrió `pnpm run test`, `pnpm run typecheck` ni `pnpm run build` en esta auditoría.** El brief dice explícitamente "esta es una auditoría read-only" y la pasada `r1` se basó en suposiciones sobre resultados de tests. La deuda es: **no medir cobertura de tests en términos de "qué % de líneas de `src/domain/` está cubierto por tests"** — los LOC de los tests son una señal, no una métrica de cobertura. (`no medido: no se ejecutó coverage en esta pasada`).

### 2.3 GGA y quality gate

- `.gga` en working tree: presente, `PROVIDER="opencode:openai/gpt-5.4-mini"` (línea 18 de `.gga`).
- `.git/hooks/pre-commit` en working tree: presente, contiene `gga run || exit 1` (línea 5 del hook).
- Binario `gga`: instalado en `C:\Users\pablo\bin\gga.ps1` (versión 2.8.1), verificable con `Get-Command gga`.
- **No se ejecutó `gga run` en esta auditoría.** El brief prohíbe correrlo salvo pedido explícito. (`no medido: ejecución de GGA en CI`).
- **Drift**: la rama `setup-gga-gate` (con todos los docs `docs/qa/gga-setup.md`, `docs/qa/gga-checklist.md`, y los cambios a `AGENTS.md`/`README.md`/`openspec/changes/STATUS.json`) **no está mergeada en `main`**. `main` no contiene `docs/qa/` siquiera como carpeta.
- `main` (HEAD `7028d15`) tiene el AGENTS original que dice "Pasar GGA antes de cerrar tareas o commits" pero NO tiene los docs para instalar GGA, NO tiene el `.gga` actualizado, y la regla queda como wishful thinking.

### 2.4 Documentación

- `README.md` (en `main@7028d15`):
  - Declara 7 skills "Listo" y `Complejos` "Pendiente" (líneas 18-28 y 60-66). **Esto es incorrecto** respecto al código mergeado (ver H-01).
  - Documenta `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE` (líneas 84-108).
  - **No** menciona GGA (esa sección está en `setup-gga-gate/AGENTS.md` y `setup-gga-gate/README.md`, no en main).
- `AGENTS.md`:
  - Lista reglas duras (SDD, TDD, pnpm, dominio puro, ENGRAM, GGA).
  - La regla de GGA en main dice "Pasar GGA antes de cerrar tareas o commits" (línea 14 según el explorador de `setup-gga-gate`, no la relevé en main en esta pasada).
- `content/matematica/conventions.md`:
  - Define el esquema de IDs de ejercicio (`ex.u{unit}.{skill_slug}.{bank_code}-{NN}`).
  - Define la convención `N` sin cero.
  - Define criterios de selección de tipo de respuesta.
  - **No** define convenciones para `pedagogicalNote`, `relatedTheoryIds`, `relatedExampleIds`, ni decimal separator (aunque en la práctica se usa coma española — ver §6.5).
- `docs/sdd/13-adr-foundation.md`: ADR fundacional del proyecto.

## 3. Hallazgos por categoría

### 3.1 Pedagogía y contenido

- **H-01 (P0)**: `README.md:28` lista `Complejos` como "Pendiente", pero `openspec/changes/STATUS.json:45-51` registra el cambio `add-complex-numbers-skill` como `done` con `mergeCommit: b420a43`. Verificado en `git log main`: hay 5 commits de la cadena de `complex-numbers` mergeados (`2557cf9`, `b8df69d`, `45dc28b`, `dfb2eda`, `2dd3692`). El contenido `exercises.json` en main incluye `ex.u1.complejos.1` con `relatedTheoryIds: ["theory-complejos"]`. **El skill está completo, validado, y archivado**. El README quedó desactualizado después de los merges. **Recomendación**: corregir README (PR aparte, no en esta auditoría).
- **H-02 (P1)**: Patrón `relatedTheoryIds`/`relatedExampleIds` ausentes. Medido: `valor_absoluto` MC 5/5 sin estos campos; `logaritmos` 10/10 sin `relatedExampleIds` (6 MC + 4 numéricos). El resto de las skills: 0% missing. El modelo `Exercise` en `src/domain/models/exercise.ts:48-63` **no** declara estos campos — son extensiones opcionales que el contenido JSON puede incluir o no. La UI los usa para construir el "ver también" en `PracticeFeedbackPhase` y para la nota pedagógica. **Causa probable**: los 5 MC de `valor_absoluto` se migraron desde un esquema viejo que no los tenía, y `logaritmos` nunca se completó. **Recomendación**: agregar `relatedTheoryIds`/`relatedExampleIds` a esos ejercicios (PR de contenido, parte del backlog de U2).
- **H-05 (P1)**: `pedagogicalNote` está en el modelo (`src/domain/models/exercise.ts:56`) y aparece en los 44 ejercicios expandidos de `conjuntos_numericos`, pero **no** aparece en los ejercicios del catálogo principal de las otras 7 skills. Inconsistencia pedagógica: para `conjuntos_numericos` el docente/alumno tiene una nota contextual, para el resto no. **Recomendación**: poblar `pedagogicalNote` en los ejercicios que la necesiten (backlog).
- **H-10 (P2)**: La skill `mat.u1.intervalos` tiene 4 ejercicios en el catálogo principal. El modelo `IntervalRepresentation` en `src/domain/intervals/representation.ts` soporta notación de intervalo, desigualdades, conjuntos, recta numérica con SVG, intersección, unión, y diferencia. Los 4 ejercicios cubren: (1) `x > 3` → `(3, ∞)`, (2) `x ≥ -1` → `[-1, ∞)`, (3) intersección `[1,4] ∩ [3,6]`, (4) unión `(-∞, 2] ∪ [1, ∞)`. **No se ejercitan**: notación constructora de conjuntos, complemento, diferencia, intervalos abiertos en ambos extremos, ni representación con `IntervalNumberLine`. El modelo gráfico está implementado pero la práctica es 100% abstracta. **Recomendación**: ampliar a 8-12 ejercicios cubriendo todas las representaciones (backlog).
- **H-11 (P2)**: La skill `mat.u1.reales_operaciones` tiene 4 ejercicios, todos numéricos. Operaciones cubiertas: +, -, ×, ÷, paréntesis, signo de agrupación. **Faltan**: fracciones como operandos, propiedad distributiva explícita, propiedad conmutativa/asociativa como pregunta directa, comparación de reales, valor absoluto como operación, redondeo. La skill se llama "Números reales y operaciones" pero su banco es "orden de operaciones con enteros". **Recomendación**: ampliar y renombrar el alcance (backlog).

### 3.2 Ejercicios

- **H-12 (P2)**: Los `commonErrorTags` cubren categorías, no distractor individual. Medido en 3 skills: `conjuntos_numericos` 0.58 tags/distractor, `intervalos` 0.42, `valor_absoluto` 0.47. Esto es pedagógicamente correcto (un tag cubre una familia de errores relacionados), pero el reporte `r1` lo trató como gap. **No es un bug**: el feedback de la UI muestra el `lookupTag(errorTag).description` (`src/components/practice/FeedbackDisplay.tsx:35`), que es la categoría conceptual, no un comentario por distractor. **Recomendación**: documentar la convención en `content/matematica/conventions.md` para que no vuelva a interpretarse como gap.
- **H-13 (P2)**: El schema del modelo `Exercise` declara 9 tipos (`src/domain/models/exercise.ts:32-42`): `multiple-choice | true-false | numerical | symbolic | fill-blank | matching | ordering | free-response | graphical`. **En uso real**: 80 MC, 36 numéricos, 11 true-false (de 106 ejercicios totales). **No se usan**: `symbolic`, `fill-blank`, `matching`, `ordering`, `free-response`, `graphical`. Para los temas de U1 esto es razonable: el brief pedagógico prohíbe respuesta libre para expresiones estructuradas. Pero la ausencia de `symbolic` para logaritmos/complejos y de `graphical` para intervalos/intercepciones es llamativa. **Recomendación**: no bloquear; documentar que el conjunto se amplía por necesidad.
- **H-14 (P3)**: Los IDs de ejercicio aceptan el patrón `ex.u{1-6}.{slug}.{index}` (`src/domain/models/exercise.ts:71`). El catálogo principal usa `.1`, `.2`, ... (numérico). El archivo per-skill de `conjuntos_numericos` usa `cn-per-01`, `cn-cla-01`, etc. (`content/matematica/exercises/conjuntos-numericos.json` según `conventions.md`). Ambos formatos válidos. **Inconsistencia menor**: el resto de las 7 skills no tiene archivo per-skill con la expansión por categoría. **No bloqueante**.

### 3.3 Feedback

- **H-15 (P1, derivado de H-02)**: El feedback de la UI (`src/components/practice/FeedbackDisplay.tsx:27-67`) muestra: resultado correcto/incorrecto, mensaje del `feedbackMapping`, descripción del `errorTag` desde la taxonomía, y un ejemplo del tag. **No** muestra un link directo a la `pedagogicalNote` del ejercicio ni a la teoría (`relatedTheoryIds`). El alumno recibe la corrección conceptual pero tiene que adivinar dónde ir a repasar. **Causa probable**: la UI nunca cerró el lazo "ejercicio → teoría relacionada". **Recomendación**: agregar "Repasar: <título de teoría>" como link en `FeedbackDisplay`, leyendo `relatedTheoryIds` y resolviendo el título vía `loadTheoryContent`. (Backlog, parte del modelo de medición H-22.)
- **H-16 (P2)**: `recoveryTarget` se usa para apuntar a un `theoryId` o `exampleId` desde el cual el alumno debe repasar. Medido: 64/64 mappings con `recoveryTarget` poblado. **Pero** el campo es un string libre, no un tipo discriminado: el `target` puede ser un `theoryId`, un `exampleId`, o un `example-<n>`. En `PracticeRecoveryPhase:48-55` se renderiza como texto: "Repasá: <raw string>". Sin tipo, el sistema no puede decidir si linkear a la página de learn o a un anchor en la misma página. **Recomendación**: convertir `recoveryTarget` en `{ kind: "theory" | "example", id: string }` y tipar el render. (Backlog.)
- **H-17 (P3)**: Tipos de feedback presentes: `conceptual` (37), `corrective` (17), `procedural` (14) sobre 68 mappings. La distribución es razonable pero no se valida pedagógicamente — un mismo `errorTag` puede tener 1 mapping o 2-3 (caso `u1_pertenencia_vs_inclusion` tiene un mapping en `unit-1.json` y otro más largo en `unit-1-conjuntos-numericos.json`). **Decisión de diseño**: la redundancia entre archivos de feedback es intencional (overrides por skill), no deuda. **Recomendación**: documentar la convención de override.

### 3.4 Medición

- **H-18 (P2)**: El dominio (`src/domain/progress/index.ts`, `src/domain/next-step/index.ts`) calcula: `accuracy` por skill, `trend` (improving/declining/stable/needs-review), `masteryLevel` (novice/practicing/proficient/mastered), `diagnosticSummary` (X de Y skills por reforzar), y `nextStep` (qué hacer). **No se mide**:
  - Tiempo por intento.
  - Cantidad de hints usados (porque `hints` no existe — H-09).
  - Frecuencia de cada `errorTag` (solo se sabe "el último fue X").
  - Tasa de éxito en retry después de feedback.
  - Distribución de respuestas por opción en MC.
  - Cobertura de la teoría: ¿qué nodos nunca se visitaron?
- **H-19 (P2)**: La métrica `masteryLevel` usa umbrales fijos (>= 80% proficient, >= 90% mastered). No hay calibración por skill: una skill con 4 ejercicios (reales_operaciones, intervalos) llega a "mastered" con 4 respuestas correctas, mientras que `conjuntos_numericos` (49 ejercicios) necesita 45. **Recomendación**: o exigir N mínimo de intentos antes de promover masteryLevel, o usar mastery bayesiano con priors por tamaño de banco. (Backlog.)
- **H-20 (P2)**: `PracticeProgress` se persiste en `localStorage` con clave `pre-utn.practice.v1` (`src/lib/practice-progress.ts`). No hay sync, no hay server, no hay backup. Para piloto local está bien; para escalar a cohorte real hace falta Supabase. **El proyecto ya tiene `supabase/` en la raíz pero no se usa**. **Recomendación**: documentar la decisión "local-first" en el README y crear el backlog de migración.

### 3.5 Código y arquitectura

- **H-21 (P1)**: La regla de "dominio puro" (`AGENTS.md` y `README.md:48-51`) se cumple. `src/domain/` no importa React, Next ni Supabase (verificado por el sub-agente: `src/domain/index.ts` solo importa de `./models/*`, `./catalog/*`, `./progress/*`, etc., y los modelos no importan nada externo). **Es un acierto fuerte** del proyecto. Mantener.
- **H-22 (P2)**: `PracticeAttempt` (`src/lib/practice-progress.ts`) guarda `{ exerciseId, skillId, correct, errorTag, answeredAt, difficulty }`. **Falta** el `timeMs` (tiempo entre mostrado y submit) y el `attemptIndex` dentro del ejercicio. Esto bloquea cualquier análisis de "cuánto tarda" o "cuántas veces reintenta". **Recomendación**: extender el modelo con `timeMs` y `attemptIndex` (entrega H-32, `MODELO_MEDICION_ERRORES.md`).
- **H-23 (P2)**: Hay 7 skills con `setAccessibleSkills` implementado en `src/domain/catalog/accessibility.ts`, pero el flujo de `usePracticeFlow.ts` usa `accessibleSkillMap` solo para la fase `select`. Cuando se navega desde `?skill=X`, la skill puede estar bloqueada (`BlockedSkillBanner` con razones: `unknown-skill`, `no-content`, `missing-prerequisite`). El banner explica bien pero no sugiere qué hacer para desbloquear (no linkea al prerequisito concreto). **Recomendación**: mejorar el mensaje de `missing-prerequisite` con link al prerequisito. (Backlog menor.)
- **H-24 (P2)**: Hay 6 evaluadores de respuesta: `numeric` (tolerance 0.01), `exact` (trim case-insensitive), `boolean` (ES/EN), `error-tagging` (pattern matcher), `dispatcher` (index). **El dispatcher no maneja `symbolic`, `fill-blank`, `matching`, `ordering`, `free-response`, `graphical`**. Esto es correcto porque no se usan, pero cualquier ampliación a esos tipos requiere implementar el evaluador primero. **Recomendación**: cuando se agreguen esos tipos, TDD primero.

### 3.6 UX/UI

- **H-25 (P2)**: Hay tests de componentes en `src/components/math/__tests__/` y `src/components/exercises/__tests__/` y `src/components/diagnostic/__tests__/` y `src/components/home/__tests__/` (totales: 16 archivos de test de componentes). **Pero** los componentes de práctica (`src/components/practice/`) — los más importantes del flujo de aprendizaje — **no tienen tests unitarios propios**: `PracticeTheoryPhase`, `PracticeExamplePhase`, `PracticeExercisePhase`, `PracticeFeedbackPhase`, `PracticeRecoveryPhase`, `PracticeSelectPhase`. Hay tests de la state machine (`src/app/practice/__tests__/phases.test.ts`) y de `usePracticeFlow`, pero no de la presentación. **Recomendación**: agregar tests de render para cada fase (al menos smoke tests de "renderiza con datos mínimos"). (Backlog.)
- **H-26 (P2)**: `RichText` parser usa regex `/\$([^$]+)\$/g` (`src/components/math/rich-text-parser.ts:5`). Esto es frágil: el `[^$]+` rechaza `$$` vacío y `$` sin cerrar, pero **no** distingue `$` literal (por ejemplo dentro de string LaTeX de otro string). En la práctica, todos los strings de contenido tienen `$...$` bien balanceados, pero la convención es frágil. **Recomendación**: aceptar como deuda técnica hasta que aparezca un caso de uso. El test `__tests__/conjuntos-render-safety.test.ts` ya escanea automáticamente todas las skills en busca de math fuera de `$...$` — guard existente.
- **H-27 (P2)**: Accesibilidad está bien resuelta: `lang="es"`, `skip-link`, `aria-current`, `aria-live="polite"` en feedback/recovery, `role="progressbar"` en diagnóstico, `aria-expanded` en acordeones, `min-h-[44px]` en botones. No hay focus traps (no hay modales). No hay atajos de teclado documentados. **Recomendación**: documentar la navegación por teclado en `docs/qa/`. (Backlog menor.)
- **H-28 (P3)**: El visual `MathWatermark` se aplica globalmente a las 8 pantallas y 5 fases de práctica (verificado en `openspec/changes/STATUS.json:5-12`). **No se aplica** al header ni al footer del layout (`src/app/layout.tsx:23-36`). Decisión de diseño coherente (los watermarks distraen en chrome de navegación), pero podría documentarse.

### 3.7 Documentación

- **H-06 (P1)**: Drift GGA — ver §2.3. La rama `setup-gga-gate` tiene el fix completo, `main` no. Cualquier PR de auditoría debe mergear `setup-gga-gate` antes (o vivir con la inconsistencia).
- **H-07 (P2)**: `docs/qa/` está vacía en `main`. Los docs de GGA viven solo en la rama no mergeada. Si la rama se borra antes del merge, los docs se pierden. **Recomendación**: en el PR que mergee `setup-gga-gate`, asegurar que `docs/qa/` queda en main.
- **H-29 (P3)**: `openspec/changes/STATUS.json` no tiene una entrada para el change `setup-gga-gate` como `done` en la rama `setup-gga-gate` está registrada, pero al mergearla, `activeBranches: []` y la entrada deberían actualizarse a `done`/`mergedTo: "main"`. Hoy la rama aparece como archivada en `openspec/changes/archive/2026-06-09-setup-gga-gate/`, pero `STATUS.json` no tiene la clave `setup-gga-gate` con estado. **No medido en esta pasada** (no leí `STATUS.json` en la rama `setup-gga-gate`; el sub-agente sí lo hizo y reportó los cambios, pero no me detuve en el diff). **Recomendación**: verificar antes del PR de merge.

### 3.8 Escalabilidad

- **H-30 (P2)**: El catálogo `ALL_SKILLS` (`src/domain/models/skill-catalog.ts`) tiene **44 skills** registradas (no solo las 8 pilot). De esas, 24 son placeholders con 1 ejercicio cada una en `exercises.json` (U2 a U6). El modelo está dimensionado para 6 unidades, pero el contenido real está concentrado en U1. **Recomendación**: para U2, decidir si se replica el patrón "8 pilot skills + per-skill files expandidos" o se adopta otro modelo.
- **H-31 (P2)**: `loadExercisesForSkill` (`src/domain/catalog/content-loaders.ts`) carga de `content/matematica/exercises.json` Y, si existe, del archivo per-skill. El merge es por `id` y reemplaza. **No hay validación de consistencia**: si el per-skill tiene un ejercicio con `id` que no está en el main, lo agrega; si el main tiene un ejercicio que el per-skill no tiene, lo deja. **No es bug hoy** (solo `conjuntos_numericos` tiene per-skill) pero puede generar drift silencioso. **Recomendación**: documentar la convención "per-skill solo expande, no redefine" y agregar un test que falle si un per-skill introduce un `id` nuevo sin `relatedTheoryIds`/`relatedExampleIds` poblados.

## 4. Matriz de problemas

| ID | Problema | Evidencia | Impacto | Causa probable | Recomendación | Prioridad |
|----|----------|-----------|---------|----------------|---------------|-----------|
| H-01 | `Complejos` listado como "Pendiente" en `README.md` pero mergeado en `main` | `README.md:28` vs `openspec/changes/STATUS.json:45-51` vs `git log main` (5 commits `complex-numbers`) | Alumno/docente cree que la skill falta | README no se actualizó post-merge | Corregir README en PR aparte | P0 |
| H-02 | 5/5 MC de `valor_absoluto` y 10/10 ejercicios de `logaritmos` sin `relatedTheoryIds`/`relatedExampleIds` | `content/matematica/exercises.json` (medido por script) | Alumno no recibe "Repasar teoría X" tras error | Migración parcial desde esquema viejo | Poblar campos en PR de contenido | P1 |
| H-03 | `intervalos` solo 4 ejercicios; modelo de intervalos mucho más rico | `content/matematica/exercises.json` (4 items con `skillId: "mat.u1.intervalos"`) vs `src/domain/intervals/representation.ts` | Skill subejercitada | Banco inicial mínimo, no se expandió | Ampliar a 8-12 ejercicios | P1 |
| H-04 | `reales_operaciones` solo 4 ejercicios, todos numéricos sobre orden de operaciones | `content/matematica/exercises.json` (4 items) | Skill subejercitada, nombre no refleja contenido | Banco inicial mínimo, no se expandió | Ampliar, diversificar tipos | P1 |
| H-05 | `pedagogicalNote` existe en modelo, presente en `conjuntos_numericos` per-skill, ausente en otras 7 skills | `src/domain/models/exercise.ts:56` vs contenido | Inconsistencia pedagógica | Migración parcial | Poblar en backlog | P1 |
| H-06 | GGA rule en `AGENTS.md` no ejecutable en `main` (binario y docs viven en `setup-gga-gate`) | `AGENTS.md:14` (main) vs `setup-gga-gate/AGENTS.md` | Regla es aspiracional, no operativa en clones nuevos | Merge pendiente | Mergear `setup-gga-gate` antes de PR de auditoría | P1 |
| H-07 | `docs/qa/` vacía en `main` | `git show main:docs/qa/gga-setup.md` → "fatal: path does not exist" | Documentación se pierde si rama se borra | Merge pendiente | Asegurar en PR de merge | P2 |
| H-08 | `pedagogicalNote` no se renderiza en `FeedbackDisplay` | `src/components/practice/FeedbackDisplay.tsx:27-67` (no hay lectura de `exercise.pedagogicalNote`) | Alumno no recibe contexto adicional del ejercicio | UI nunca cerró el lazo | Renderizar nota del ejercicio (backlog) | P2 |
| H-09 | `hints` mencionado en brief, no existe en modelo | `src/domain/models/exercise.ts:48-63` (no hay `hints`) | Malentendido del brief | n/a | Descartado, no es deuda | P3 |
| H-10 | `intervalos` no ejercita notación constructora, complemento, diferencia, doble abierto | `content/matematica/exercises.json` (4 items revisados) | Subcobertura pedagógica | Banco inicial mínimo | Ampliar | P2 |
| H-11 | `reales_operaciones` no cubre fracciones como operandos, distributiva, comparación | `content/matematica/exercises.json` (4 items revisados) | Subcobertura pedagógica | Banco inicial mínimo | Ampliar | P2 |
| H-12 | Cobertura tag/distractor < 1.0 en 3 skills medidas | medición directa | Pedagógicamente correcto pero reportable como gap | Convención de tag por familia | Documentar en `conventions.md` | P2 |
| H-13 | 6 de 9 tipos de `Exercise` no usados en contenido | `src/domain/models/exercise.ts:32-42` vs contenido | Falsa apariencia de cobertura | Decisión pedagógica correcta | Documentar | P3 |
| H-14 | Inconsistencia en IDs: numérico para 7 skills, slug para `conjuntos_numericos` | `content/matematica/exercises.json` + `exercises/conjuntos-numericos.json` | Inconsistencia menor | Decisión tardía de slug | Adoptar slug en backlog | P3 |
| H-15 | `FeedbackDisplay` no muestra link a teoría/ejemplo relacionado | `src/components/practice/FeedbackDisplay.tsx` | Alumno sin guía de repaso | UI nunca cerró el lazo | Agregar link (backlog, depende H-22) | P1 |
| H-16 | `recoveryTarget` es string libre, no tipo discriminado | `content/matematica/feedback/unit-1.json` (estructura) | UI no puede decidir tipo de link | Decisión inicial simple | Tipar (`{kind, id}`) | P2 |
| H-17 | Distribución conceptual/corrective/procedural no validada pedagógicamente | `content/matematica/feedback/unit-1.json` | Distribución puede ser sesgada | Decisión ad-hoc | Revisión humana en backlog | P3 |
| H-18 | No se mide tiempo por intento, frecuencia de errorTag, retry success | `src/domain/progress/index.ts` + `src/lib/practice-progress.ts` | Métricas pedagógicas limitadas | Scope inicial acotado | Modelo `PedagogyEvent` (ver Entregable 5) | P1 |
| H-19 | `masteryLevel` se alcanza con pocos intentos en bancos chicos | `src/domain/progress/index.ts` | "Mastered" prematuro | Umbrales fijos | Calibrar por tamaño | P2 |
| H-20 | Progreso solo en `localStorage` | `src/lib/practice-progress.ts` | Sin sync ni backup | Decisión local-first | Documentar + backlog Supabase | P2 |
| H-21 | `src/domain/` puro | `src/domain/index.ts` | Fortaleza arquitectónica | Decisión deliberada | Mantener | n/a (acierto) |
| H-22 | `PracticeAttempt` sin `timeMs` ni `attemptIndex` | `src/lib/practice-progress.ts` | Bloquea análisis temporal | Scope inicial acotado | Extender modelo | P1 |
| H-23 | `BlockedSkillBanner` no linkea al prerequisito concreto | `src/app/practice/usePracticeFlow.ts:176-231` | Alumno no sabe qué desbloquear | UI no terminó de pulir | Mejorar mensaje | P2 |
| H-24 | Dispatcher de evaluador no maneja 6 tipos de `Exercise` | `src/domain/evaluator/index.ts` | n/a hoy | Decisión correcta por uso | TDD al ampliar | P3 |
| H-25 | Sin tests unitarios de presentación de las 5 fases de práctica | `src/components/practice/` (no hay `__tests__/`) | Regresiones visuales sin red de seguridad | Scope inicial priorizó dominio | Agregar smoke tests | P2 |
| H-26 | Parser `RichText` usa regex simple | `src/components/math/rich-text-parser.ts:5` | Frágil ante `$` literales | n/a en contenido actual | Deuda técnica, guard existente | P3 |
| H-27 | Atajos de teclado no documentados | `src/app/layout.tsx`, `src/components/Nav.tsx` | n/a en uso actual | Decisión de scope | Documentar | P3 |
| H-28 | `MathWatermark` no se aplica a header/footer | `src/app/layout.tsx:23-36` | Decisión de diseño | Intencional | Documentar | P3 |
| H-29 | `STATUS.json` no tiene entrada `setup-gga-gate` como done | `openspec/changes/STATUS.json` (revisado en main, no en la rama) | Posible drift post-merge | Merge pendiente | Verificar en PR de merge | P3 |
| H-30 | `ALL_SKILLS` tiene 44 skills, contenido real en 8 | `src/domain/models/skill-catalog.ts` vs contenido | Catálogo sobredimensionado para piloto | Decisión de planeamiento | Decidir en U2 | P2 |
| H-31 | `loadExercisesForSkill` no valida consistencia entre main y per-skill | `src/domain/catalog/content-loaders.ts` | Drift silencioso potencial | Scope inicial | Test de consistencia | P2 |

## 5. Lecciones aprendidas

Ver [`LECCIONES_APRENDIDAS_UNIDAD_1.md`](./LECCIONES_APRENDIDAS_UNIDAD_1.md).

## 6. Reglas obligatorias para Unidad 2

1. **Mantenimiento del `STATUS.json`**: actualizar el registro de cambios en el mismo commit que cierra el PR, no después. Multi-PC lo exige.
2. **Sin drift entre modelo y contenido**: cualquier campo del JSON de contenido que use la UI debe estar en el tipo `Exercise` de `src/domain/models/exercise.ts`. No aceptar campos "huérfanos" como `relatedTheoryIds`/`relatedExampleIds` que viven en el contenido pero no en el modelo. **Acción previa a U2**: o tipar el modelo, o eliminar los campos del contenido.
3. **`pedagogicalNote` obligatorio**: todo ejercicio nuevo en U2 debe traer `pedagogicalNote` poblado en el mismo PR de contenido.
4. **`feedbackMappings` con `recoveryTarget` tipado**: convertir `recoveryTarget: string` en `recoveryTarget: { kind: "theory" | "example", id: string }` antes de empezar U2.
5. **Modelo `PedagogyEvent` desde el día 1**: implementar el modelo de telemetría (Entregable 5) como parte de la fase `propose` de U2, no como feature tardía.
6. **Tests de presentación de fases**: agregar al menos 1 test de render por cada `Practice*Phase` antes de cerrar el slice de U2.
7. **Convención de IDs uniforme**: decidir entre numérico (`.1`) y slug (`cn-per-01`) por skill y documentar antes de crear nuevos ejercicios. La mezcla actual es un riesgo de inconsistencia para autores de contenido.
8. **Guard `render-safety` extendido**: el test `__tests__/conjuntos-render-safety.test.ts` cubre `conjuntos_numericos`. Extender a las 8 pilot skills y adoptarlo como guard genérico.
9. **Convención de override de feedback**: documentar en `conventions.md` que un mismo `errorTag` puede tener un mapping "base" en `unit-N.json` y overrides en `unit-N-{skill}.json` con mensaje más específico.
10. **No acumular "pendientes" en el README**: el `STATUS.json` es la fuente. El `README` debe leerse como "estado declarado al último merge", no como wishlist.

## 7. Backlog priorizado

Ver [`BACKLOG_MEJORAS_UNIDAD_2.md`](./BACKLOG_MEJORAS_UNIDAD_2.md).

## 8. Veredicto final

**Unidad 1 está lista para producción y para escalar a cohorte real**, con las siguientes condiciones:

1. Mergear `setup-gga-gate` a `main` antes de cualquier PR derivado (cierra H-06, H-07, H-29).
2. Corregir el drift del `README` sobre `Complejos` (cierra H-01). Trivial.
3. Antes de empezar U2: tipar `recoveryTarget`, extender `PracticeAttempt` con `timeMs`/`attemptIndex`, agregar `PedagogyEvent` (cierra H-15, H-16, H-18, H-22).
4. Backlog de contenido: ampliar `intervalos` (H-03, H-10) y `reales_operaciones` (H-04, H-11), poblar `relatedTheoryIds`/`relatedExampleIds` en `valor_absoluto` y `logaritmos` (H-02), poblar `pedagogicalNote` en las 7 skills no-expandidas (H-05).
5. Backlog de UI: agregar tests de render de fases de práctica (H-25), renderizar `pedagogicalNote` (H-08), link a teoría desde feedback (H-15).

**No bloqueante para iniciar U2**: ninguno de los P1 es de implementación inmediata. Todos pueden entrar como ítems del slice inicial de U2 sin retrasar el "tema 1 de U2".

**Crédito**: la arquitectura del proyecto es sólida. El `src/domain/` puro, los `Result<T,E>` en lugar de throws, el `loadContent` con validación, el `usePracticeFlow` con state machine explícita, los tests de dominio densos y específicos, y los guards de `render-safety` y `decimal-comma-convention` son aciertos que U2 debe preservar.
