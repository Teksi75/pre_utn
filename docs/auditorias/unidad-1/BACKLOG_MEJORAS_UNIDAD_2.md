# Backlog de mejoras — Pre UTN (Unidad 2)

Backlog priorizado para cerrar antes de empezar Unidad 2 (Polinomios) o durante su ejecución. Cada ítem tiene: problema, evidencia, acción concreta, criterio de aceptación, y estimación.

**4 carriles**:

- **A — Imprescindible antes de U2**: bloquea el inicio de U2.
- **B — Conveniente durante U2**: se puede hacer en paralelo al slice 1 de U2.
- **C — Deuda técnica**: no bloquea, pero suma.
- **D — Deuda pedagógica**: contenido a mejorar; sin impacto técnico.

## A — Imprescindible antes de U2

### A1. Mergear `setup-gga-gate` a `main`

- **Problema**: GGA está operativo en working tree y en la rama `setup-gga-gate`, pero no en `main`. Cualquier clon nuevo de `main` no tiene ni el binario ni el hook ni los docs.
- **Evidencia**: `git show main:docs/qa/gga-setup.md` → "fatal: path does not exist" (medido). `git log main..setup-gga-gate` → 2 commits, 14 files changed, 712 insertions. `AGENTS.md:14` en main dice "Pasar GGA antes de cerrar tareas o commits" sin instrucciones de instalación.
- **Acción concreta**:
  1. PR de `setup-gga-gate` → `main` con `--no-ff` para preservar contexto.
  2. Después del merge, actualizar `openspec/changes/STATUS.json`: agregar entrada `setup-gga-gate` con `status: "done"`, `mergedTo: "main"`, `branch: null`, `mergeCommit: <hash>`.
  3. Borrar la rama local y remota.
  4. Correr `pnpm run audit:branches` para confirmar.
- **Criterio de aceptación**:
  - `main` contiene `docs/qa/gga-setup.md` y `docs/qa/gga-checklist.md`.
  - `main` contiene la versión actualizada de `.gga` y `AGENTS.md` y `README.md`.
  - `openspec/changes/STATUS.json` tiene la entrada `setup-gga-gate` con `status: "done"`.
  - En un clon nuevo de `main`, `pnpm run audit:branches` no marca la rama como zombie.
- **Estimación**: 30 min (revisión + merge + limpieza).

### A2. Corregir drift de `README.md` sobre `Complejos`

- **Problema**: `README.md:28` dice que `Complejos` está "Pendiente", pero la cadena de PRs de `add-complex-numbers-skill` está mergeada.
- **Evidencia**: `README.md:28` vs `openspec/changes/STATUS.json:45-51` (`status: "done"`, `mergeCommit: b420a43`) vs `git log main` (5 commits de la cadena). `content/matematica/exercises.json` contiene `ex.u1.complejos.1` con `relatedTheoryIds: ["theory-complejos"]`.
- **Acción concreta**:
  1. Mover `Complejos` de la lista "Pendiente" a la lista "Listo" en `README.md`.
  2. Eliminar la línea 28 ("- Complejos") de la sección de pendientes.
  3. Cambiar `Complejos | Pendiente` a `Complejos | Listo` en la tabla de la sección "Camino actual de Unidad 1" (líneas 60-66).
- **Criterio de aceptación**:
  - `README.md` lista las 8 skills como "Listo" en la sección "Estado real del MVP".
  - `git diff main README.md` muestra solo el cambio de estado.
  - La línea 28 de pendientes está vacía o eliminada.
- **Estimación**: 10 min (edit + commit + PR).

### A3. Tipar `recoveryTarget` en el modelo de feedback

- **Problema**: `recoveryTarget: string` es un string libre. La UI (`PracticeRecoveryPhase:48-55`) lo renderiza como texto, no como link discriminable entre teoría y ejemplo.
- **Evidencia**: `content/matematica/feedback/unit-1.json` y `unit-1-conjuntos-numericos.json` (revisado: todos los mappings tienen `recoveryTarget` con valores como `"theory-conjuntos-numericos"`, `"example-logaritmos-1"`, etc., pero el modelo no distingue). `src/components/practice/PracticeRecoveryPhase.tsx` lee `recoveryTarget` y lo muestra raw.
- **Acción concreta**:
  1. Cambiar el tipo en `src/domain/feedback/index.ts` de `recoveryTarget: string` a `recoveryTarget: { kind: "theory" | "example"; id: string }`.
  2. Actualizar el JSON de feedback (`unit-1.json`, `unit-1-conjuntos-numericos.json`): para cada mapping, inferir `kind` del prefijo (`theory-*` o `example-*`) y reformatear.
  3. Actualizar `PracticeRecoveryPhase` para resolver el `id` y mostrar un link real a `/learn/matematica/<skillId>#<id>`.
  4. Agregar tests en `src/domain/feedback/__tests__/recoveryTarget.test.ts` que verifiquen la inferencia automática.
- **Criterio de aceptación**:
  - El modelo discrimina `kind`.
  - Todos los 68 mappings tienen `recoveryTarget` con `kind` y `id` poblados.
  - `pnpm run test:run` pasa con los tests nuevos.
  - `pnpm run typecheck` pasa.
  - `pnpm run build` pasa.
  - La UI muestra un link clickeable (no texto) en `PracticeRecoveryPhase`.
- **Estimación**: 1 día (refactor de modelo + migración de 68 mappings + tests + UI).

### A4. Extender `PracticeAttempt` con `timeMs` y `attemptIndex`

- **Problema**: el modelo `PracticeAttempt` no captura tiempo por intento ni número de reintento. Esto bloquea el modelo `PedagogyEvent` (Entregable 5).
- **Evidencia**: `src/lib/practice-progress.ts` (revisado en `usePracticeFlow.ts:222-229`): el `addAttempt` no mide tiempo ni reintentos. `src/domain/progress/index.ts` consume `PracticeAttempt` sin esos campos.
- **Acción concreta**:
  1. En `src/lib/practice-progress.ts` y/o en el modelo `PracticeAttempt` (`src/domain/progress/index.ts`): agregar `timeMs: number` y `attemptIndex: number` como campos requeridos.
  2. En `usePracticeFlow.ts`: medir `performance.now()` entre el `setState` de "ejercicio mostrado" y el submit. Pasar `timeMs` y `attemptIndex` a `addAttempt`.
  3. Migrar los datos de `localStorage` existentes: al cargar progreso viejo, asignar `timeMs: 0` y `attemptIndex: 1` (o descartar — decisión de UX).
  4. Agregar tests en `src/lib/__tests__/practice-progress.test.ts` que verifiquen el cálculo de `timeMs`.
- **Criterio de aceptación**:
  - `PracticeAttempt` requiere `timeMs` y `attemptIndex` en el tipo.
  - En un test e2e local, un intento registra `timeMs > 0`.
  - Los datos viejos de `localStorage` no rompen la app.
  - Tests + typecheck + build pasan.
- **Estimación**: 1 día (modelo + hook + tests + migración de localStorage).

## B — Conveniente durante U2

### B1. Poblar `pedagogicalNote` en las 7 skills no-expandidas

- **Problema**: `pedagogicalNote` existe en el modelo y se usa en `conjuntos_numericos` per-skill, pero no en los ejercicios de las otras 7 skills.
- **Evidencia**: medición directa sobre `content/matematica/exercises.json` + `exercises/conjuntos-numericos.json`: 49/49 ejercicios de `conjuntos_numericos` tienen `pedagogicalNote`, 0/57 de las otras 7 skills (medido por inspección del JSON; los 4 numéricos de `reales_operaciones` no lo tienen, los 4 MC de `intervalos` no lo tienen, etc.).
- **Acción concreta**: para cada uno de los 57 ejercicios sin `pedagogicalNote`, escribir una nota de 1-2 oraciones en estilo "voz del docente" (puede ser copy-paste de la `theoryNode` correspondiente, abreviado). Migración de contenido, no de código.
- **Criterio de aceptación**: 100% de los 106 ejercicios de U1 tienen `pedagogicalNote` no vacío. Un test `validateExercise` rechaza ejercicios sin `pedagogicalNote` (configurable por tipo).
- **Estimación**: 1 día (escritura de 57 notas).

### B2. Agregar `relatedTheoryIds`/`relatedExampleIds` a `valor_absoluto` y `logaritmos`

- **Problema**: 5/5 MC de `valor_absoluto` y 10/10 ejercicios de `logaritmos` (6 MC + 4 numéricos) no tienen estos campos. La UI los usa para "Repasar" pero no puede hacerlo.
- **Evidencia**: medición directa. Listado de IDs faltantes: `ex.u1.valor_absoluto.2, .3, .5, .6, .8` y `ex.u1.logaritmos.1, .2, .3, .4, .5, .6, .7, .8, .9, .10`.
- **Acción concreta**: para cada ID, poblar `relatedTheoryIds: ["theory-<skillId>"]` y `relatedExampleIds: ["example-<skillId>-<relevant>"]` (1-2 ejemplos por ejercicio).
- **Criterio de aceptación**: 100% de los 106 ejercicios tienen `relatedTheoryIds` con al menos 1 entrada y `relatedExampleIds` con al menos 1 entrada (o array vacío explícito si no aplica, pero tipado).
- **Estimación**: 0.5 día (10 ejercicios de `logaritmos` + 5 de `valor_absoluto`).

### B3. Tipar `relatedTheoryIds` y `relatedExampleIds` en el modelo

- **Problema**: el modelo `Exercise` no declara estos campos; viven como JSON huérfano.
- **Evidencia**: `src/domain/models/exercise.ts:48-63` (revisado, no están).
- **Acción concreta**:
  1. Agregar `relatedTheoryIds?: readonly TheoryId[]` y `relatedExampleIds?: readonly WorkedExampleId[]` al tipo `Exercise`.
  2. Actualizar `validateExercise` para que estos campos, si están presentes, referencien IDs conocidos.
  3. Migrar el contenido para que use el contrato.
- **Criterio de aceptación**: el modelo declara los campos. `validateExercise` los valida. `pnpm run typecheck` y `pnpm run test:run` pasan.
- **Estimación**: 0.5 día.

### B4. Renderizar `pedagogicalNote` en `FeedbackDisplay`

- **Problema**: el campo está en el modelo y en el contenido, pero la UI no lo lee.
- **Evidencia**: `src/components/practice/FeedbackDisplay.tsx:27-67` (revisado, no lee `exercise.pedagogicalNote`).
- **Acción concreta**: agregar al `FeedbackDisplay` un bloque "Nota del ejercicio: <RichText>{pedagogicalNote}</RichText>" debajo del `feedbackMapping.message`.
- **Criterio de aceptación**: en una corrida local con `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true`, abrir un ejercicio de `conjuntos_numericos` (que tiene `pedagogicalNote`), equivocarse adrede, ver la nota en la pantalla de feedback.
- **Estimación**: 2 horas.

### B5. Link "Repasar teoría" desde `FeedbackDisplay`

- **Problema**: el feedback muestra el error y la corrección conceptual, pero no linkea a la teoría o ejemplo.
- **Evidencia**: mismo lugar, H-15. La UI no cierra el lazo.
- **Acción concreta**:
  1. Resolver `relatedTheoryIds[0]` → cargar `loadTheoryContent` → encontrar el nodo → link a `/learn/matematica/<skillId>#<theoryId>`.
  2. Mostrar el link como botón "Repasar: <título de la teoría>".
  3. Combinar con B3 (tipar) y A3 (tipar `recoveryTarget`).
- **Criterio de aceptación**: tras equivocarse, el alumno ve un link clickeable que lo lleva al nodo de teoría correspondiente.
- **Estimación**: 4 horas (incluye test e2e).

### B6. Implementar el modelo `PedagogyEvent` (Entregable 5)

- **Problema**: el dominio no captura eventos pedagógicos (hint usado, tiempo, reintento, recuperación exitosa).
- **Evidencia**: `src/lib/practice-progress.ts` solo guarda `PracticeAttempt` plano. El Entregable 5 de esta auditoría define el modelo `PedagogyEvent` con union discriminada.
- **Acción concreta**:
  1. Crear `src/domain/pedagogy-event/index.ts` con los tipos `PedagogyEvent` (union discriminada de 8 tipos: `ExerciseShown`, `AnswerSubmitted`, `HintRequested`, `TheoryLinkClicked`, `RetryStarted`, `RecoveryViewed`, `PracticeCompleted`, `DiagnosticStarted/Completed`).
  2. Crear `src/lib/pedagogy-event-logger.ts` con la función `log(event)` que appendea a `localStorage` con clave `pre-utn.pedagogy.v1`.
  3. Integrar el logger en `usePracticeFlow` y `useDiagnostic`.
  4. Crear `src/hooks/useAttemptTimer.ts` (cuenta tiempo entre mostrado y submit).
  5. Tests unitarios de cada tipo de evento.
- **Criterio de aceptación**: ver Entregable 5, sección "Criterios de aceptación".
- **Estimación**: 3 días.

### B7. Tests de render de las 5 fases de práctica

- **Problema**: `PracticeTheoryPhase`, `PracticeExamplePhase`, `PracticeExercisePhase`, `PracticeFeedbackPhase`, `PracticeRecoveryPhase` no tienen tests unitarios propios.
- **Evidencia**: `src/components/practice/` (16 archivos `.tsx`, ninguno con `__tests__/` adyacente, verificado por el sub-agente).
- **Acción concreta**: agregar `src/components/practice/__tests__/` con un test de render mínimo por fase (smoke test: renderiza con datos sintéticos, verifica que el texto clave está en el DOM).
- **Criterio de aceptación**: 5 archivos de test nuevos, 1 por fase, todos pasan.
- **Estimación**: 1 día.

### B8. Extender el guard `render-safety` a las 8 skills

- **Problema**: `src/components/math/__tests__/conjuntos-render-safety.test.ts` cubre solo `conjuntos_numericos`. Si las otras 7 skills introducen math fuera de `$...$` por error, no hay guard.
- **Evidencia**: el test (revisado) hace `parseRichTextSegments` sobre el contenido de `conjuntos_numericos` y verifica offenders vacío. No se itera sobre las otras 7 skills.
- **Acción concreta**: parametrizar el test para que recorra las 8 skills y falle si alguna tiene caracteres peligrosos fuera de `$...$`.
- **Criterio de aceptación**: el test corre sobre las 8 skills y falla si cualquiera tiene math fuera de `$...$`.
- **Estimación**: 2 horas.

## C — Deuda técnica

### C1. `masteryLevel` calibrado por tamaño de banco

- **Problema**: una skill con 4 ejercicios (intervalos) llega a "mastered" con 4 respuestas correctas; una con 49 (conjuntos_numericos) necesita 45. No es comparable.
- **Evidencia**: `src/domain/progress/index.ts` (revisado por el sub-agente: `computeMasteryLevel` usa umbrales fijos >= 80% proficient, >= 90% mastered).
- **Acción concreta**:
  1. Agregar parámetro `minAttemptsForMastery: number` por skill.
  2. Si `attempts.length < minAttemptsForMastery`, devolver `practicing` como máximo.
  3. Documentar el `minAttemptsForMastery` por skill en `content/matematica/conventions.md` (sugerido: `reales_operaciones` y `intervalos` con `min: 8`, el resto con `min: 12`).
- **Estimación**: 1 día.

### C2. Validación de consistencia en `loadExercisesForSkill`

- **Problema**: el merge entre `exercises.json` y los per-skill files no valida que los per-skill no introduzcan `id`s nuevos sin `relatedTheoryIds`/`relatedExampleIds`.
- **Evidencia**: `src/domain/catalog/content-loaders.ts` (revisado por el sub-agente: hace merge por `id`, pero no valida consistencia).
- **Acción concreta**: agregar un test que itere sobre todos los per-skill files y falle si algún `id` introducido (no presente en main) no tiene `relatedTheoryIds` y `relatedExampleIds` poblados.
- **Estimación**: 4 horas.

### C3. Atajos de teclado documentados

- **Problema**: la navegación por teclado funciona (Tab, Enter, Esc, flechas) pero no está documentada.
- **Evidencia**: `src/app/layout.tsx`, `src/components/Nav.tsx` (revisados; el skip-link existe, los links son nativos).
- **Acción concreta**: agregar sección "Navegación por teclado" en `README.md` y en `docs/qa/accessibility.md` (nuevo).
- **Estimación**: 2 horas.

### C4. `MathWatermark` documentado en chrome

- **Problema**: el watermark se aplica a las 8 pantallas y 5 fases de práctica, pero no al header/footer del layout. La decisión es intencional pero no está documentada.
- **Evidencia**: `src/app/layout.tsx:23-36` (revisado; no hay MathWatermark en el header ni en el footer).
- **Acción concreta**: agregar un comentario JSDoc en `layout.tsx` explicando "watermarks aplicados a las páginas de contenido, no al chrome de navegación, por decisión de diseño".
- **Estimación**: 15 min.

### C5. `docs/qa/` mantenido

- **Problema**: `docs/qa/` está vacía en `main`. Si se mergea `setup-gga-gate`, queda con 2 archivos. Si U2 introduce nuevos QA concerns (por ejemplo, tests de render), deben ir a `docs/qa/`.
- **Evidencia**: `git show main:docs/qa/gga-setup.md` → fatal.
- **Acción concreta**: en cada slice de U2, si se introduce un nuevo "QA concern" (test manual, checklist, troubleshooting), agregarlo a `docs/qa/<topic>.md`.
- **Estimación**: continuo, parte del SDD.

## D — Deuda pedagógica

### D1. Ampliar `intervalos` a 8-12 ejercicios

- **Problema**: 4 ejercicios no cubren notación constructora, complemento, diferencia, doble abierto, representación gráfica con IntervalNumberLine.
- **Evidencia**: H-10. Revisión directa de los 4 IDs `ex.u1.intervalos.1, .2, .3, .4`.
- **Acción concreta**: crear `content/matematica/exercises/intervalos.json` con 8-12 ejercicios cubriendo las sub-habilidades faltantes. Mantener los 4 existentes en `exercises.json` (o migrarlos al per-skill). Decisión: mantener 4 en main + 6 en per-skill (mismo patrón que `conjuntos_numericos`).
- **Criterio de aceptación**: 10+ ejercicios en la skill, cubriendo: open, closed, half-open (left/right), infinito, intersección, unión, diferencia, complemento, notación constructora (`{x ∈ ℝ : x > 3}`), representación gráfica.
- **Estimación**: 2 días (escritura de 6-8 ejercicios nuevos con feedback mappings).

### D2. Ampliar `reales_operaciones` a 8-12 ejercicios

- **Problema**: 4 ejercicios, todos numéricos, todos sobre orden de operaciones. No cubre fracciones, distributiva, comparación, valor absoluto como operación.
- **Evidencia**: H-11. Revisión de los 4 IDs `ex.u1.reales_operaciones.1, .2, .3, .4`.
- **Acción concreta**: ampliar a 10 ejercicios cubriendo las sub-habilidades faltantes. Considerar renombrar la skill a "Orden de operaciones y propiedades de los reales" o mantener el nombre pero documentar el alcance real.
- **Criterio de aceptación**: 10+ ejercicios, cubriendo: orden de operaciones, signo de agrupación, propiedad distributiva, propiedad conmutativa, propiedad asociativa, fracciones como operandos, comparación de reales, valor absoluto como operación.
- **Estimación**: 2 días.

### D3. Renombrar `reales_operaciones` o documentar alcance

- **Problema**: el nombre sugiere "operaciones con reales" pero el contenido es "orden de operaciones con enteros".
- **Evidencia**: H-04 y D2.
- **Acción concreta**: decisión de UX + pedagógica. Opciones: (a) ampliar contenido y mantener nombre; (b) renombrar a `orden_operaciones`; (c) dividir en dos skills.
- **Criterio de aceptación**: el nombre refleja el contenido. Documentado en `content/matematica/conventions.md`.
- **Estimación**: depende de la decisión.

### D4. Documentar la convención de override de feedback

- **Problema**: un mismo `errorTag` puede tener un mapping "base" en `unit-N.json` y un override más específico en `unit-N-{skill}.json` (caso `u1_pertenencia_vs_inclusion`).
- **Evidencia**: `content/matematica/feedback/unit-1.json` y `unit-1-conjuntos-numericos.json` (revisado: 10 tags aparecen en ambos archivos, con mensajes diferentes).
- **Acción concreta**: agregar a `content/matematica/conventions.md` la sección "Override de feedback por skill" explicando la convención y la prioridad de resolución.
- **Estimación**: 30 min.

### D5. Documentar la convención de `tag/distractor < 1.0`

- **Problema**: la métrica `tags/distractor` está en 0.42-0.58 para las 3 skills medidas. Pedagógicamente correcto (un tag cubre una familia) pero la pasada `r1` lo interpretó como gap.
- **Evidencia**: H-12.
- **Acción concreta**: agregar a `content/matematica/conventions.md` la sección "Tags por familia de errores" explicando que un `commonErrorTag` cubre una categoría, no un distractor individual.
- **Estimación**: 30 min.

## Resumen de esfuerzo

| Carril | Ítems | Esfuerzo total estimado |
|--------|-------|------------------------|
| A — Imprescindible antes de U2 | 4 | ~3 días |
| B — Conveniente durante U2 | 8 | ~7 días |
| C — Deuda técnica | 5 | ~2 días |
| D — Deuda pedagógica | 5 | ~5 días |

**Total**: ~17 días de trabajo para cerrar todo el backlog.

**Sugerencia de secuenciamiento**:

1. **Antes de empezar U2 (semana 0)**: A1, A2, A3, A4 (~3 días).
2. **Slice 1 de U2 (semana 1)**: B6 (modelo `PedagogyEvent`) + B7 (tests de render).
3. **Slice 2 de U2 (semana 2)**: B3 (tipar related*) + B5 (link a teoría) + B1 (poblar `pedagogicalNote`).
4. **Slice 3 de U2 (semana 3)**: D1 (ampliar intervalos) + D2 (ampliar reales_operaciones).
5. **Post-U2**: C1 (calibrar mastery) + C2 (validación de consistencia) + resto.
