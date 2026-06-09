# Plantilla de implementación de unidades (U2+)

Checklist ejecutable para iniciar una nueva unidad pedagógica (U2, U3, ...) en Pre UTN. Esta plantilla codifica las lecciones aprendidas en U1 y el flujo SDD estándar del proyecto.

**Audiencia**: orchestrador SDD + agente de apply + revisor.

**Modo de uso**: copiar esta plantilla al inicio de cada unidad, llenar los placeholders (`<UNIT>`, `<SKILL_ID>`, etc.), y trabajar fase por fase. Marcar cada checkbox solo cuando el criterio de aceptación se cumple, no antes.

## Pre-flight (lo que tiene que estar mergeado antes de empezar)

Antes de crear la rama de la unidad, verificar que `main` contiene:

- [ ] `setup-gga-gate` mergeado (PR de sincronización aparte, ver Backlog A1).
- [ ] `docs/qa/gga-setup.md` y `docs/qa/gga-checklist.md` presentes.
- [ ] `AGENTS.md` actualizado con la sección de GGA operativa (no la versión "Pasar GGA antes de cerrar").
- [ ] `openspec/changes/STATUS.json` tiene la entrada `setup-gga-gate` con `status: "done"`, `mergedTo: "main"`, `branch: null`.
- [ ] Backlog de U1 cerrado (o ítems del backlog de U1 documentados como `wontfix` o `deferred` con justificación en `STATUS.json`).
- [ ] `pnpm run test:run`, `pnpm run typecheck`, `pnpm run build` pasan en `main` limpio.

Si alguno falla, **no empezar la unidad**. Crear un PR de sincronización primero.

## Fase 0: Bootstrap

### 0.1. Crear rama de trabajo

```bash
git checkout main
git pull
git checkout -b feat/unit-<N>-<topic-slug>
```

### 0.2. Verificar preflight de SDD

- [ ] Preflight de SDD (Pace, Artifacts, PRs, Review) completado en sesión.
- [ ] Init de SDD para esta unidad: `mem_search("sdd-init-chinos/pre_utn", project: "pre_utn")` y verificar que el contexto del proyecto está disponible.

### 0.3. Cargar convenciones

- [ ] Leer `content/matematica/conventions.md` y verificar que las convenciones aplican a la nueva unidad.
- [ ] Si la nueva unidad necesita convenciones nuevas (por ejemplo, `pedagogicalNote` obligatoria), decidir antes de la fase `propose` y documentar en el mismo PR que el spec.

## Fase 1: Explore (delegable a `sdd-explore-chinos`)

### 1.1. Mapear contenido canónico

- [ ] Listar los archivos en `material_canonico/Matemática/Unidad <N>/` y leer el `README` o índice.
- [ ] Identificar las sub-habilidades canónicas (típicamente 4-8 por unidad).
- [ ] Verificar que el catálogo tiene los `SkillId`s que se necesitan en `src/domain/models/skill-catalog.ts`.

### 1.2. Buscar trabajo previo

- [ ] `mem_search("mat.u<N>.*", project: "pre_utn", scope: "project")` para encontrar exploraciones previas.
- [ ] `mem_search("unit-<N>", project: "pre_utn", scope: "project")`.
- [ ] Revisar `openspec/changes/canonical-math-pedagogy-map/` y `openspec/changes/pedagogical-model-audit/` (exploration-only).

### 1.3. Identificar dependencias

- [ ] Para cada `SkillId` nuevo, listar los prerequisitos en `src/domain/models/skill-catalog.ts` (campo `SKILL_DEPENDENCIES`).
- [ ] Verificar que los prerequisitos están en el catálogo y tienen readiness (ver fase 2).

### 1.4. Decisión de slice

- [ ] Decidir el orden de las skills (topológica sobre el grafo de prerequisitos).
- [ ] Decidir si la unidad se entrega en 1 slice (1 PR) o múltiples (chained PRs).
  - Si el cambio total excede 400 líneas, usar `chained-pr` (ver Backlog A1 si excede 800).
  - Si es la primera unidad con contenido pedagógico denso, preferir 1 slice para revisar de punta a punta.

## Fase 2: Propose (delegable a `sdd-propose-chinos`)

### 2.1. Crear change SDD

- [ ] `openspec/changes/unit-<N>-<topic-slug>/proposal.md` con: goal, scope, non-goals, métricas de éxito, dependencias, riesgos.
- [ ] Status `in-progress` en `openspec/changes/STATUS.json`.
- [ ] Branch registrado en `openspec/changes/STATUS.json`.

### 2.2. Preguntas de producto (modo interactive)

En modo interactive, antes de generar el proposal, hacer 3-5 preguntas de producto:

- [ ] ¿Qué problema resuelve esta unidad para el alumno? (no "qué temas cubre", sino "qué duda frecuente ataca")
- [ ] ¿Qué errores comunes已知 tiene esta unidad? (listar 3-5)
- [ ] ¿Qué conocimiento previo asume? (linkear a las skills de U(N-1) que son prerequisito)
- [ ] ¿Cuál es el primer slice de práctica? (no el "tema 1" abstracto, sino los 3-4 ejercicios con los que arranca)
- [ ] ¿Cuál es la métrica de éxito pedagógica? (no "% de alumnos que aprueba", sino "después de 5 ejercicios, el alumno identifica X")

### 2.3. Riesgos y suposiciones

- [ ] Listar suposiciones que pueden ser falsas (típico: "los alumnos ya vieron fracciones en colegio" — verificar).
- [ ] Listar riesgos (típico: "el evaluador de `symbolic` no está implementado" — referenciar A3 del backlog).

## Fase 3: Specs (delegable a `sdd-spec-chinos`)

### 3.1. Specs delta

- [ ] `openspec/changes/unit-<N>-<topic-slug>/specs/<skill-id>/spec.md` por cada skill nueva.
- [ ] Cada spec incluye: purpose, requirements (con `### Requirement:`), scenarios (formato `#### Scenario:`), non-functional requirements.

### 3.2. Contratos de dominio

- [ ] Si se agregan campos al modelo `Exercise` (por ejemplo, `relatedTheoryIds` tipado), documentar en el spec.
- [ ] Si se agregan tipos de `Exercise` (por ejemplo, `symbolic` para logaritmos), documentar:
  - El evaluador necesario.
  - El render de input necesario.
  - Los tests del evaluador.

### 3.3. Pedagogía

- [ ] Cada spec de skill incluye la lista de sub-habilidades cubiertas (4-8 por skill).
- [ ] Cada sub-habilidad tiene al menos 1 ejercicio en el spec.
- [ ] Cada ejercicio en el spec tiene `commonErrorTags` no vacíos.

## Fase 4: Design (delegable a `sdd-design-chinos`)

### 4.1. Estructura de archivos

- [ ] Listar archivos a crear o modificar:
  - `content/matematica/theory/unit-<N>.json` (1 archivo con todas las theories de la unidad).
  - `content/matematica/examples/unit-<N>.json` (1 archivo con todos los examples).
  - `content/matematica/exercises.json` (1 array raíz, append-only).
  - `content/matematica/feedback/unit-<N>.json` (1 archivo con todos los mappings).
  - `content/matematica/exercises/<skill-id>.json` (per-skill expandido, opcional, mismo patrón que `conjuntos_numericos`).
  - `src/domain/catalog/pilot-skills.ts` (agregar la unidad a `PILOT_SKILL_UNIT_MAP`).
  - `src/domain/catalog/skill-catalog.ts` (registrar las `SkillId`s nuevas en `UNIT_<N>_SKILLS`).

### 4.2. Decisiones arquitectónicas

- [ ] ¿Se necesita un evaluador nuevo? Si sí, TDD primero (ver fase 5).
- [ ] ¿Se necesita un componente de UI nuevo? Si sí, listar archivo y tests.
- [ ] ¿Se modifica el state machine de `usePracticeFlow`? Si sí, documentar el cambio de fases.

### 4.3. Decisiones de contenido

- [ ] Política de IDs: numérico (`.1`) o slug (`<prefix>-<NN>`). Documentar en `conventions.md` si cambia.
- [ ] Política de `pedagogicalNote`: obligatorio, opcional por tipo. Si cambia, actualizar `validateExercise`.
- [ ] Política de `relatedTheoryIds`/`relatedExampleIds`: tipar y validar (ver Backlog B3).

## Fase 5: Tasks (delegable a `sdd-tasks-chinos`)

### 5.1. Breakdown

- [ ] `openspec/changes/unit-<N>-<topic-slug>/tasks.md` con tareas numeradas, cada una con: descripción, archivos afectados, criterios de aceptación, dependencias.
- [ ] Marcar tareas con `TDD-first` o `TDD-standard` según el tipo:
  - `TDD-first`: evaluadores, validadores, hooks, reducers.
  - `TDD-standard`: componentes UI, páginas, integraciones.

### 5.2. Review workload forecast

- [ ] Estimar líneas modificadas/agregadas (suma de `wc -l` de los archivos en la sección 4.1).
- [ ] Si excede 400, evaluar `chained-pr` con el usuario.
- [ ] Si excede 800, requerir `size:exception` del mantenedor.

### 5.3. Strict TDD

- [ ] Si el proyecto tiene `strict_tdd: true` en `sdd-init-chinos/pre_utn`, los tests se escriben ANTES del código.
- [ ] Verificar el cache de testing capabilities antes de empezar.

## Fase 6: Apply (delegable a `sdd-apply-chinos`)

### 6.1. Por cada tarea (en orden)

- [ ] Crear tests antes del código (si TDD-first).
- [ ] Implementar.
- [ ] Correr `pnpm run test:run`, `pnpm run typecheck`, `pnpm run build`.
- [ ] Si falla, fix hasta pasar. NO continuar con tests rojos.
- [ ] Marcar la tarea como hecha en `tasks.md`.

### 6.2. Commits

- [ ] Commits chicos, idealmente 1 por tarea completada. Mensaje con conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).
- [ ] Sin "Co-Authored-By" ni atribución a IA.
- [ ] El mensaje del commit referencia el ID de la tarea (por ejemplo, `feat(skill): add polinomios.1 (T-1.2)`).

### 6.3. GGA

- [ ] El hook de pre-commit corre `gga run` automáticamente. Si falla, leer el output y arreglar las violaciones.
- [ ] Si la regla es incorrecta (código bien pero GGA no entiende), abrir issue o discusión, no saltar el gate con `--no-verify` salvo emergencia documentada.

### 6.4. Continuidad entre sesiones

- [ ] Si la sesión se interrumpe, el `apply-progress` se persiste en memoria (`sdd/unit-<N>-<topic-slug>/apply-progress`). Al reanudar, el agente lee el progreso y continúa desde donde quedó.
- [ ] Si el cambio es multi-PC, hacer `git push` desde cada PC después de cada commit para no perder el progreso.

## Fase 7: Verify (delegable a `sdd-verify-chinos`)

### 7.1. Tests

- [ ] `pnpm run test:run` pasa.
- [ ] `pnpm run typecheck` pasa.
- [ ] `pnpm run build` pasa.
- [ ] `vitest --coverage` corre. Coverage de `src/domain/` >= 80%. Coverage de `src/components/` y `src/app/` >= 60%.

### 7.2. Pedagogía

- [ ] Recorrer manualmente (en `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true`) las 4-8 skills de la unidad, completar al menos 3 ejercicios de cada una, verificar:
  - La teoría se muestra y se entiende.
  - Los ejemplos están bien resueltos.
  - Los distractores de MC son plausibles y enseñan algo.
  - El feedback aparece cuando se equivoca uno.
  - El `recoveryTarget` linkea a un recurso útil.
- [ ] Validar con un alumno de prueba (o con el mantenedor) que la secuencia de sub-habilidades es clara.

### 7.3. Verificación automatizada

- [ ] El guard `render-safety` corre sobre las nuevas skills (extender en B8 si aún no se hizo).
- [ ] El guard `decimal-comma-convention` corre sobre las nuevas skills.
- [ ] El validador `validateExercise` rechaza ejercicios mal formados del nuevo contenido.

### 7.4. Reporte

- [ ] `openspec/changes/unit-<N>-<topic-slug>/verify-report.md` con: status (`PASS` / `PASS WITH WARNINGS` / `FAIL`), métricas, hallazgos, próximos pasos.

## Fase 8: Archive (delegable a `sdd-archive-chinos`)

### 8.1. Sync de specs

- [ ] Mover los specs delta de `openspec/changes/unit-<N>-<topic-slug>/specs/<skill-id>/spec.md` a `openspec/specs/<skill-id>/spec.md`.
- [ ] Eliminar la carpeta `openspec/changes/unit-<N>-<topic-slug>/specs/`.

### 8.2. Update de STATUS

- [ ] `openspec/changes/STATUS.json`: agregar entrada `unit-<N>-<topic-slug>` con `status: "done"`, `mergedTo: "main"`, `mergeCommit: <hash>`, `branch: null`, `completedAt: <fecha>`, `summary: <1-2 oraciones>`.
- [ ] `activeBranches: []` (lista vacía).

### 8.3. Limpieza

- [ ] Borrar la rama local: `git branch -d feat/unit-<N>-<topic-slug>`.
- [ ] Borrar la rama remota: `git push origin --delete feat/unit-<N>-<topic-slug>`.
- [ ] Correr `pnpm run audit:branches` y confirmar que no aparecen zombies.

### 8.4. Sesión de cierre

- [ ] `mem_session_summary` con el formato estándar.
- [ ] Incluir: goal, instructions, discoveries (no-triviales), accomplished, next steps, relevant files.
- [ ] Si la unidad deja ítems del backlog sin cerrar, registrarlos en el backlog de la siguiente unidad.

## Criterios de cierre por skill

Una skill se considera "completa" (transitable, publicable) cuando:

- [ ] `src/domain/readiness/index.ts` devuelve `isSkillReady(skillId) === true`.
- [ ] El contenido tiene: 1 theory node, >= 2 worked examples, >= 5 exercises (recomendado >= 8), >= 1 feedback mapping por `errorTag` referenciado.
- [ ] El guard `render-safety` pasa.
- [ ] El guard `decimal-comma-convention` pasa.
- [ ] El alumno puede hacer el flujo completo: `learn/matematica/<skillId>` → `practice?skill=<skillId>` → terminar sin errores.
- [ ] El feedback aparece cuando se equivoca.
- [ ] El `recoveryTarget` linkea a un recurso que existe.

## Anti-patrones (lo que NO hacer)

- **AP-1**: Implementar contenido sin spec. Cualquier JSON en `content/matematica/` debe tener un spec en `openspec/specs/` o en `openspec/changes/<change>/specs/`.
- **AP-2**: Asumir que un campo existe en el modelo. Verificar el tipo TypeScript antes de usar.
- **AP-3**: Cargar contenido que use tipos de `Exercise` no implementados en el dispatcher de evaluador.
- **AP-4**: Omitir `pedagogicalNote` en ejercicios nuevos. Si la regla es "obligatorio", validar en `validateExercise`.
- **AP-5**: Crear feedback mappings con `recoveryTarget` apuntando a un ID que no existe en el contenido.
- **AP-6**: Cargar contenido con math fuera de `$...$`. El guard `render-safety` lo detecta, pero si se desactiva el test, el contenido se rompe en runtime.
- **AP-7**: Hacer PR con build, typecheck o tests rojos. El reviewer debe rechazar sin negociar.
- **AP-8**: Mergear la rama sin actualizar `STATUS.json` en el mismo PR. Multi-PC lo exige.
- **AP-9**: Usar `--no-verify` en un commit sin dejar comentario en el PR que explique la emergencia. Esto es deuda visible.
- **AP-10**: Declarar "Listo" en el README sin que `STATUS.json` diga `status: "done"`. El `STATUS.json` es la fuente; el `README` es la postal.
- **AP-11**: Crear skills sin mapearlas en `PILOT_SKILL_UNIT_MAP` o sin agregarlas a `UNIT_<N>_SKILLS` en `src/domain/models/skill-catalog.ts`. El catálogo debe estar sincronizado.
- **AP-12**: Importar React, Next o Supabase desde `src/domain/`. La regla es dura; la única defensa es el review humano.
- **AP-13**: Usar `throw` en funciones de dominio. El proyecto usa `Result<T,E>`; mantener la convención.
- **AP-14**: Tocar archivos de `material_canonico/` desde un PR de implementación. El material canónico es la fuente pedagógica; se modifica en PRs aparte con revisión de contenido.

## Versionado

Esta plantilla se versiona por unidad si diverge. Para U1, las decisiones tomadas (8 pilot skills, per-skill file con slug IDs, `pedagogicalNote` en expandido) están documentadas en `conventions.md`. Para U2, revisar si esas decisiones siguen aplicando; si no, anotar el cambio aquí.
