# Lecciones aprendidas — Unidad 1 (Pre UTN)

Las siguientes lecciones emergen de auditar la Unidad 1 dos veces. La pasada `r1` cometió errores que la pasada `r2` corrigió. Cada lección incluye evidencia y regla operativa.

Las lecciones están agrupadas por área. El orden dentro de cada área es por impacto, no por fecha.

---

## A. Sesgo de confirmación en auditorías (LA MÁS IMPORTANTE)

### L-A1. "Si declarás 'X falta', verificá X fuera del lugar donde buscaste"

**Evidencia (pasada r1)**: la pasada `r1` declaró "GGA ausente" basándose en que la rama actual de trabajo no tenía los archivos `.gga` actualizados ni `docs/qa/`. Lo que no hizo fue: (a) mirar la rama `setup-gga-gate`, donde GGA está vivo; (b) leer el working tree, donde el hook está instalado; (c) ejecutar `Get-Command gga` para confirmar que el binario existe. Tres chequeos, ninguno hecho, una conclusión falsa.

**Regla**: para cada hallazgo "X falta", enumerar **al menos 2 lugares** donde X podría estar (binario, hook, config, docs, git, runtime, env vars) y verificar los 2 antes de escribir el hallazgo. Si solo lo buscaste en un lugar, no lo declares; marcalo como `no verificado`.

### L-A2. "El modelo es la fuente, no el JSON"

**Evidencia (pasada r1)**: la pasada `r1` probablemente mencionó campos como `hints` o `feedbackId` como faltantes, basándose en supuestos sobre el schema. La pasada `r2` confirmó: `hints` no existe en el modelo (`src/domain/models/exercise.ts:48-63`), `feedbackId` tampoco, y `explanation` tampoco. El campo real es `pedagogicalNote`. Asumir la existencia de un campo es un error frecuente.

**Regla**: antes de declarar "falta X", leer el tipo TypeScript del modelo y verificar que el campo existe conceptualmente. Si el campo no existe en el modelo, lo que falta no es un valor: es una decisión de diseño (¿lo necesitamos? ¿lo agregamos?).

### L-A3. "El reporte es ejecutable, no narrativo"

**Evidencia (r1 → r2)**: la pasada `r1` escribió métricas como "feedback coverage es bajo" sin cálculo. La pasada `r2` ejecutó un script Node sobre los JSON y reportó `mappings=64, recovery=64, missing=NONE` para todas las 8 skills. La diferencia no es estilística: cambia la confiabilidad del reporte.

**Regla**: toda métrica en un reporte de auditoría debe incluir el comando o el snippet que la produce. Si no se puede ejecutar en una línea, no es una métrica — es una observación.

### L-A4. "Un patrón no es un caso aislado; un caso aislado no es un patrón"

**Evidencia (r1)**: la pasada `r1` probablemente flageó `valor_absoluto.2` y `.3` como faltantes de `relatedTheoryIds`/`relatedExampleIds`. La pasada `r2` midió las 8 skills: el patrón es **5/5 MC de `valor_absoluto` + 10/10 ejercicios de `logaritmos`**, no dos ejercicios puntuales. El sesgo inverso también es riesgo: declarar "X pasa en todas las skills" sin medirlo es idénticamente frágil.

**Regla**: cuando se detecta un caso, escanear al menos 2 skills o 5 ejercicios adyacentes antes de generalizar. La métrica debe ser `count/total` sobre la población, no opinión sobre un caso.

### L-A5. "Drift ≠ bug"

**Evidencia (r2)**: `README.md:28` dice que `Complejos` está "Pendiente", pero el cambio está mergeado y archivado. Esto es drift, no bug. Tratarlo como bug hubiera generado una rama de "fix" innecesaria; tratarlo como drift genera un PR de sincronización de docs.

**Regla**: clasificar el hallazgo como `bug` (código rompe) / `drift` (código vs docs) / `deuda` (mejora pendiente) / `diseño` (decisión consciente, documentar). Mezclar las categorías confunde al lector y mezcla prioridades.

---

## B. Pedagogía y contenido

### L-B1. "El feedback coverage debe medirse contra los `commonErrorTags`, no contra los distractores"

**Evidencia (r2)**: la pasada `r2` calculó `tags/distractor` (0.42 a 0.58) y `mappings/tags_referenciados` (1.0). La primera métrica es pedagógica: un tag cubre una familia. La segunda es operativa: cada tag tiene al menos un mapping. La pasada `r1` pudo haberlas confundido y reportado 0% por mirar la primera.

**Regla**: separar siempre "cobertura de feedback" (`mappings que cubren tags referenciados`) de "densidad de explicación por distractor" (`mappings o notas por opción`). Son métricas distintas con significados distintos.

### L-B2. "El nombre de la skill debe coincidir con su banco"

**Evidencia (H-04)**: `reales_operaciones` se llama "Números reales y operaciones" pero su banco es "orden de operaciones con enteros". Faltan fracciones, distributiva, comparación, valor absoluto como operación. El alumno que entra esperando "operaciones con reales" encuentra un subconjunto.

**Regla**: el spec de cada skill debe enumerar explícitamente las sub-habilidades que cubre. Al cerrar el slice, validar `count(ejercicios por sub-habilidad) > 0`. Si una sub-habilidad queda vacía, la skill está incompleta, no el banco.

### L-B3. "El `pedagogicalNote` es un acierto del modelo; úsalo en todo el contenido"

**Evidencia (H-05)**: `pedagogicalNote` está en el modelo (`src/domain/models/exercise.ts:56`) y se usa en los 44 ejercicios expandidos de `conjuntos_numericos`. Está ausente en las otras 7 skills. La nota es la "voz del docente" en cada ejercicio.

**Regla**: en U2, exigir `pedagogicalNote` poblado en el PR de contenido, no como follow-up. La validación de `validateExercise` debería rechazar ejercicios sin `pedagogicalNote` para los tipos que aplique.

### L-B4. "El `relatedTheoryIds`/`relatedExampleIds` no son del modelo"

**Evidencia (r2)**: el modelo `Exercise` no declara estos campos. Aparecen en el JSON de contenido pero no se validan en `validateExercise`. La UI los usa implícitamente pero sin contrato.

**Regla**: o se tipan en el modelo (recomendado para U2: `relatedTheoryIds?: readonly TheoryId[]`) y se validan, o se eliminan del contenido. La opción intermedia (JSON huérfano, sin tipo, sin validación) es deuda silenciosa.

---

## C. Código y arquitectura

### L-C1. "`src/domain/` puro es el activo más valioso del proyecto"

**Evidencia (H-21)**: la pasada `r2` confirmó que `src/domain/` no importa React, Next ni Supabase. Esto es una decisión arquitectónica deliberada que se ve en `AGENTS.md` y `README.md`.

**Regla**: cualquier PR que intente importar React/Next/Supabase desde `src/domain/` debe ser rechazado en review. Mantener este invariante es lo que permite que el dominio sea testeable en `environment: "node"` (`vitest.config.ts`) sin mocks.

### L-C2. "Los `Result<T,E>` son la convención de errores; usalos"

**Evidencia**: el dominio usa `Result<T, ValidationError>` en `validateSkill`, `validateExercise`, `validateErrorTag`, `validateTheoryNode`, `validateWorkedExample`, `validateIntervalRepresentation` (visto en `src/domain/index.ts`). Las funciones `loadCatalog`, `loadTheoryContent`, etc. también devuelven `Result`.

**Regla**: en U2, ninguna función de dominio debe `throw`. Si lo hace, es un smell. La excepción controlada es `parseX` que devuelve `Option<T>` o un tipo discriminado equivalente.

### L-C3. "El dispatcher de evaluador es la frontera de extensibilidad"

**Evidencia (H-24)**: 6 evaluadores cubren solo 3 de los 9 tipos de `Exercise` declarados. El dispatcher es el punto donde se agregan nuevos tipos. Si se agrega un `symbolic` o `graphical` en U2 sin actualizar el dispatcher, el contenido cargará pero no se podrá evaluar.

**Regla**: en la fase `tasks` de cualquier slice de U2 que agregue un tipo de `Exercise`, listar explícitamente: (1) actualizar `ExerciseType`, (2) implementar el evaluador, (3) agregar tests del evaluador, (4) documentar en `conventions.md`. TDD estricto.

### L-C4. "El `usePracticeFlow` tiene 315 líneas — el sweet spot está cerca del límite"

**Evidencia (r2)**: `src/app/practice/usePracticeFlow.ts` es un custom hook de 315 líneas. No es un bug (es cohesivo, hace una sola cosa), pero es un riesgo: si se agregan features (timer, hints, attempts múltiples), el archivo va a romperse.

**Regla**: para U2, considerar extraer `useAttemptTimer` y `useRecovery` como hooks separados antes de que `usePracticeFlow` supere las 400 líneas. El threshold es 400 por la regla de los demás archivos del proyecto (los `__tests__/` de dominio están entre 50 y 540 líneas, pero los de app/practice son 55-262).

---

## D. UX/UI

### L-D1. "El feedback sin link a la teoría es corrección sin continuidad"

**Evidencia (H-15)**: `FeedbackDisplay` muestra "Incorrecto + descripción del errorTag + ejemplo del error", pero no muestra un link a la teoría o ejemplo que el alumno debería repasar. El alumno recibe corrección conceptual pero tiene que buscar él mismo el material.

**Regla**: en U2, todo feedback post-error debe terminar en una acción clara: "Repasar: <nombre de la teoría>". Esto se conecta con el modelo de telemetría (Entregable 5): la acción se trackea.

### L-D2. "La accesibilidad está bien resuelta en lo que existe; falta documentar"

**Evidencia (H-27)**: `lang="es"`, `skip-link`, `aria-current`, `aria-live`, `role="progressbar"`, `aria-expanded`, `min-h-[44px]`. No hay atajos de teclado documentados.

**Regla**: para U2, documentar la navegación por teclado (Tab/Shift-Tab, Enter, Esc, Arrow keys si aplica) en `docs/qa/` o en el `README`. No es deuda técnica: es contenido para usuarios que no pueden usar mouse.

### L-D3. "Los tests de presentación de las fases de práctica faltan"

**Evidencia (H-25)**: hay 16 archivos de test de componentes, pero los `Practice*Phase.tsx` no tienen tests. La state machine de `phases.ts` sí se testea, pero la presentación de cada fase (qué se muestra, qué se oculta, qué pasa al hacer click) no.

**Regla**: para U2, agregar al menos 1 test de render por cada `Practice*Phase` (smoke test: renderiza con datos mínimos, verifica que el texto clave está presente). Si se agrega un test de interacción, mejor.

---

## E. Calidad y verificación

### L-E1. "Los LOC de test no son cobertura"

**Evidencia (r2)**: la pasada `r2` contó 63 archivos de test, ~14k líneas agregadas. Esa es una medida de esfuerzo, no de cobertura. Cobertura real requiere correr `vitest --coverage` y mirar el reporte.

**Regla**: para U2, agregar `vitest --coverage` al CI y exigir `> 80%` en `src/domain/`. Los `src/components/` y `src/app/` pueden tener umbral menor (60%) por la naturaleza de integración con React/Next.

### L-E2. "GGA corre, pero hay que mergearlo"

**Evidencia (H-06)**: la pasada `r2` confirmó que GGA está vivo en `setup-gga-gate` y en el working tree local, pero no en `main`. Si U2 se empieza desde `main`, ningún clon nuevo tendrá GGA.

**Regla**: antes de empezar U2, mergear `setup-gga-gate` a `main`. Esto es un PR de sincronización, no de feature. Documentar la regla en `AGENTS.md` para que la auditoría siguiente no repita el hallazgo.

### L-E3. "El audit de branches es la única defensa contra zombies"

**Evidencia (general)**: el script `scripts/audit-branches.sh` (con fix cross-OS en `5868482`) detecta ramas sin entrada en `STATUS.json`. Es la única verificación sistemática del estado multi-PC.

**Regla**: para U2, correr `pnpm run audit:branches` antes de mergear cualquier PR. Si aparece un zombie, la causa es humana, no técnica.

### L-E4. "El lint de notación matemática (decimal-comma) ya existe; no es deuda, es guard"

**Evidencia (r2)**: `src/components/math/__tests__/decimal-comma-convention.test.ts:78` y `__tests__/conjuntos-render-safety.test.ts:151` corren automáticamente sobre el contenido. El alumno nunca verá un math mal renderizado por coma/punto porque el test lo bloquea en CI.

**Regla**: para U2, agregar más guards del mismo tipo: (1) "no math fuera de `$...$`" extendido a todas las 8 skills, (2) "no IDs duplicados en `exercises.json`", (3) "no `expectedAnswer` vacío", (4) "no `feedbackId` huérfano" (si se reintroduce).

---

## F. Documentación

### L-F1. "El `STATUS.json` es la fuente, el `README` es la postal"

**Evidencia (H-01)**: el `README` quedó desactualizado porque el `STATUS.json` se actualizó con cada merge, pero nadie sincronizó el `README`. El `STATUS.json` es la fuente porque es JSON testeable; el `README` es prosa humana, propensa a olvidarse.

**Regla**: agregar al `audit:branches` (o un script nuevo) una verificación que differee `STATUS.json` contra `README.md` y falle si hay skills en `STATUS.json` con `status: "done"` y `mergedTo: "main"` que no aparezcan como "Listo" en el `README`.

### L-F2. "El `conventions.md` no es opcional"

**Evidencia (general)**: el archivo `content/matematica/conventions.md` define IDs, `N` sin cero, y criterios de tipo de respuesta. Lo que **no** define: convenciones de `pedagogicalNote`, `relatedTheoryIds`/`relatedExampleIds`, `recoveryTarget`, slug vs numérico. Son decisiones que viven en el código pero no en el contrato.

**Regla**: para U2, expandir `conventions.md` con: (1) cuándo usar `pedagogicalNote` (siempre), (2) qué tipo de contenido va en `relatedTheoryIds` (uno o dos nodos), (3) esquema de `recoveryTarget` (después de tiparlo), (4) política de slug vs numérico (decidir y aplicar retroactivamente).

### L-F3. "La rama archivada no es la rama mergeada"

**Evidencia (H-29)**: `setup-gga-gate` tiene su change archivado en `openspec/changes/archive/2026-06-09-setup-gga-gate/`, pero el merge a `main` no se hizo. **Archivar ≠ mergear**. La auditoría tiene que verificar ambos.

**Regla**: en el PR de cierre de cualquier change, el `STATUS.json` debe tener `status: "done"`, `mergedTo: "main"`, `branch: null` **después** del merge, no antes.

---

## G. Operación multi-PC

### L-G1. "El setup cross-OS ya tuvo un fix; no perderlo"

**Evidencia (memoria)**: el commit `5868482 fix(tooling): make branch audit cross-platform` arregló `scripts/audit-branches.sh` para Windows + CachyOS. Cualquiera de los dos PCs puede correr el audit.

**Regla**: para U2, mantener el invariante `.gitattributes` con `*.sh text eol=lf` y `*.bat text eol=crlf`. Si se agregan scripts nuevos, decidir el EOL antes de commitear.

### L-G2. "El cambio local se completa cuando se pushea desde cada PC"

**Evidencia (memoria)**: la cadena de PRs de `add-complex-numbers-skill` requirió `git push` desde cada PC y la sincronización del `STATUS.json` por separado. La auditoría debe recordar que un commit local en un PC no es visible en el otro.

**Regla**: en el PR de cierre de la auditoría `r2`, después de mergear, hacer `git push` desde el PC local. Si el otro PC tiene commits no pusheados, mergearlos antes de cerrar la rama de auditoría.

---

## H. Resumen ejecutivo de las lecciones

Las 15 lecciones anteriores se reducen a 3 principios:

1. **Verificar dos veces antes de declarar**: cada hallazgo debe tener evidencia de al menos 2 fuentes independientes.
2. **El modelo es la fuente, no el JSON**: si un campo no está en el tipo TypeScript, no existe como contrato.
3. **Drift ≠ bug ≠ deuda**: clasificar antes de proponer acción.

Estos 3 principios guían la [`PLANTILLA_IMPLEMENTACION_UNIDADES.md`](./PLANTILLA_IMPLEMENTACION_UNIDADES.md) (Entregable 4) y la lista de reglas obligatorias para U2 (Sección 6 de [`AUDITORIA_UNIDAD_1.md`](./AUDITORIA_UNIDAD_1.md)).
