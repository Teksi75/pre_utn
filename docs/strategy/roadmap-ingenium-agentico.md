# Roadmap Ingenium — Guía agéntica

> **Para quién:** agentes IA, sesiones futuras, implementadores.
> **Para qué:** operar el proyecto con precisión — SDD, TDD, branches, PRs, tests, criterios de aceptación.
> **Lectura:** referencia. No leer de punta a punta; buscar la sección que corresponde a la tarea.

---

## Fuente de verdad y arranque

Antes de cualquier trabajo operativo, leer en este orden:

1. `AGENTS.md` — reglas obligatorias del repo (SDD, TDD, pnpm, TS estricto, dominio puro, marca).
2. `docs/strategy/roadmap-ingenium-agentico.md` — guía operativa vigente para agentes e implementadores.
3. `openspec/changes/STATUS.json` — estado portable de todos los cambios SDD.
4. Rama actual y `git status` — verificar que se está en la branch correcta y el working tree está limpio.
5. Artefactos openspec del change en curso (si existen): `proposal.md`, `spec.md`, `design.md`, `tasks.md`.

Consultar `docs/strategy/roadmap-ingenium-humano.md` solo cuando haga falta confirmar el **Mapa de lectura recomendado** o una decisión de producto. Tratar `docs/strategy/roadmap-estrategico-ingenium.md` como fuente estratégica original/histórica: no usarlo como guía operativa vigente si contradice este documento.

**Regla:** no implementar features sin spec. No escribir código sin haber leído los criterios de aceptación del issue.

### Trazabilidad

| Referencia | Ruta |
|---|---|
| Fuente estratégica original | `docs/strategy/roadmap-estrategico-ingenium.md` |
| Guía humana | `docs/strategy/roadmap-ingenium-humano.md` |
| Auditoría de simplificación | `openspec/changes/strategic-simplification-audit/exploration.md` |
| **Propósito de este documento** | Guía operativa para agentes IA e implementadores |

---

## Flujo SDD

```
preflight → init guard → proposal → spec → design → tasks → apply → verify → archive
```

| Fase | Qué hace | Cuándo detenerse |
|---|---|---|
| **preflight** | Leer contexto, verificar `applyState`, cargar skills. | Si `applyState: blocked`, parar y reportar. |
| **init guard** | Verificar que SDD está inicializado (registry, testing-capabilities). | Si no existe, correr `sdd-init`. |
| **proposal** | Describir intent, scope, approach del cambio. | No avanzar sin confirmación del usuario. |
| **spec** | Escribir delta specs con escenarios. | Los escenarios son los criterios de aceptación. |
| **design** | Decisiones técnicas y arquitectura. | No implementar sin design aprobado. |
| **tasks** | Partir en tareas implementables. | Cada tarea debe tener criterios verificables. |
| **apply** | Implementar tareas siguiendo spec + design. | TDD estricto para dominio/evaluadores/métricas. |
| **verify** | Ejecutar tests y probar contra specs. | Si falla, no hacer merge. |
| **archive** | Sincronizar delta specs al corpus principal. | Solo tras verify exitoso. |

**Regla dura:** ningún feature se implementa sin spec. Si el orchestrator pide apply sin spec, responder `blocked`.

---

## TDD

### Qué requiere TDD estricto

- `src/domain/` completo: evaluadores, métricas, recomendaciones, progress, diagnostic, next-step, student-home, student-profile.
- Cualquier función pura que calcule algo sobre intentos, progreso, readiness, o view-models.

### Comandos de verificación

```bash
pnpm run test          # unit + integration (Vitest)
pnpm run typecheck     # TypeScript estricto
pnpm run build         # Next.js build
pnpm test:e2e          # Playwright — cuando el cambio afecta flujos principales
```

### Ciclo TDD estricto

```
RED → GREEN → REFACTOR
```

1. Escribir test que describe el comportamiento esperado. Verificar que falla.
2. Implementar lo mínimo para que pase.
3. Refactorear sin cambiar comportamiento. Tests siguen verdes.

**Regla:** si se completa una tarea sin escribir test primero, marcarla como FAILED en la tabla de evidencia TDD.

### Qué NO requiere TDD estricto

- Contenido educativo (archivos JSON de theory, examples, exercises, feedback).
- Documentación.
- Estilos CSS / Tailwind.
- Componentes presentacionales puros que no calculan nada (snapshots son suficientes).

---

## Unidad profesional de cambio — responsabilidades del agente

| Layer | Responsabilidad del agente |
|---|---|
| **Roadmap** | No modificar sin instrucción explícita del usuario. |
| **Milestone** | Verificar que el issue pertenece al milestone correcto. |
| **Issue** | Leer criterios de aceptación antes de escribir código. |
| **Branch** | Crear desde `main` actualizada, nombrar según convención. |
| **Pull Request** | ≤ 400 líneas. Si excede, proponer chained PRs. |
| **Tests** | Escribir ANTES de implementar (TDD estricto para dominio). |
| **Criterios de aceptación** | Verificar cada uno explícitamente en verify. |

---

## Branches y PRs

### Naming

| Prefijo | Uso | Ejemplo |
|---|---|---|
| `feat/` | Funcionalidad nueva | `feat/teacher-dashboard-v0` |
| `fix/` | Corrección | `fix/challenge-attempt-student-id` |
| `refactor/` | Reorganización sin cambio visible | `refactor/active-session-module` |
| `docs/` | Documentación | `docs/roadmap-strategy` |
| `design/` | Diseño técnico/pedagógico | `design/curricular-track-model` |
| `content/` | Contenido educativo | `content/math-unit-4-geometry` |
| `qa/` | Validación | `qa/math-utn-mvp-review` |

### Reglas

- Una branch = un issue = una concern. No mezclar contenido, infra, rediseño y arquitectura.
- Commits como work units: cada commit debe ser revisable por sí mismo.
- La branch debe poder descartarse sin comprometer `main`.

### PR template essentials

```markdown
# Resumen
Qué cambia y por qué.

## Issue vinculado
Closes #número

## Cambios principales
- Cambio 1
- Cambio 2

## Qué no cambia
- Límite explícito del PR.

## Tests ejecutados
- pnpm run test
- pnpm run typecheck
- pnpm run build
- [pnpm test:e2e si aplica]

## Validación pedagógica
- [Contenido / feedback / secuencia revisados]

## Riesgos
- [Aspectos que requieren seguimiento]
```

### Presupuesto de revisión

- **≤ 400 líneas cambiadas** por PR.
- Si el refactor excede (I-19, I-20): **chained PRs obligatorios**.
- Chain strategy para I-19: `stacked-to-main` — PR de dominio → PR de catálogo → PR de UI.
- Si el workload forecast dice `400-line budget risk: High`, parar y pedir decisión antes de implementar.

---

## Guardas de arquitectura

### `src/domain/` es puro

- **Prohibido:** imports de React, Next.js, Supabase, o cualquier efecto secundario.
- **Permitido:** TypeScript, lógica pura, tipos, reducers, contratos.
- Si un test de dominio necesita mock de React, el diseño está mal.

### Persistencia

- Debe soportar **fallback local** (localStorage) y **future remote adapter** (Supabase).
- Adapter boundary: un solo punto de acceso a la identidad activa (`getActiveProfileId`).
- No acceder a `localStorage.getItem("pre-utn.profiles.v1")` fuera del módulo de sesión activa.
- No exponer service key en cliente. Nunca.

### Intentos (attempts)

- `PracticeAttempt` y `ChallengeAttempt` deben llevar `studentId`, `subjectId`, `skillId`, `trackId` cuando aplique.
- **No intentos anónimos.** Todo intento se asocia a un perfil activo.
- **No unificar `Attempt` con discriminator para diagnóstico** como acción inmediata. El shape del intento de diagnóstico es intencionalmente mínimo. Postpuesto hasta que haya necesidad de producto explícita.

### Componentes

- Presentacionales no deben hacer I/O directo de localStorage. Usar hooks (`useActiveStudent`, futuros `useStudentProgress`, `useStudyPlan`).
- Patrón: hook con `useSyncExternalStore` sobre store externo.

---

## Restricciones específicas del roadmap

### M1 antes de M5 profundo

- Cerrar I-21, I-23, I-24, I-25 antes de meter multi-track real.
- M1 necesita: intentos no anónimos + adapter boundary + `/docente` v0.

### M2 no se bloquea

- M2 (U4–U6) puede avanzar en paralelo sin esperar a M5.
- Si M2 y M5 tocan `domain/models/skill-catalog.ts`, coordinar branches.

### Orden recomendado

> **Regla:** los IDs `I-#` son identificadores estables, no prioridad de ejecución. Para decidir qué hacer siguiente, consultar el **Mapa de lectura recomendado** en `roadmap-ingenium-humano.md`. El usuario puede override en cualquier momento.

1. **I-21** — `studentId` en `ChallengeAttempt` (size S).
2. **I-23** — Adapter boundary `getActiveProfileId` (size S).
3. **I-24** — Supabase adapter v0 con fallback (size L).
4. **I-25** — `/docente` v0 (size L).
5. **I-19 → I-20 → I-26 → I-27** — M5 en chained PRs.

### Rechazado / postpuesto

- **Mega `Attempt` discriminator para diagnóstico:** rechazado como acción inmediata. El diagnóstico tiene shape mínimo intencional.
- **Reescribir `SkillId` literal type de una sola vez:** esperar I-19 con PRs encadenados.
- **Partir `usePracticeFlow` o `ExerciseAnswerInput`:** post-M5 (I-28, I-29).

---

## Trabajo de contenido — reglas operativas

### Qué NO hacer

- **No agregar contenido UNCuyo** antes de I-17 (mapeo) y sin el modelo multi-track de M5 disponible.
- **No duplicar** contenido UTN en carpetas UNCuyo de forma ciega.
- **No mezclar** branches de contenido con branches de infraestructura o refactor.

### Qué hacer antes de implementar contenido

1. Leer material canónico y documentar criterios de aceptación en el issue.
2. Verificar que el issue tiene spec (delta spec con escenarios).
3. Confirmar branch prefix correcto: `content/`, `design/`, o `qa/`.

### Fuentes canónicas externas

Antes de agregar contenido, leer/inspeccionar la carpeta canónica correspondiente en OneDrive.

| Tarea | Fuente canónica |
|---|---|
| Matemática UTN U4–U6 | `C:\Users\pablo\OneDrive\ingenium-web\Pre Ingenierías\Pre UTN Mza\2026\Matemática` |
| Matemática UNCuyo (post I-17) | `C:\Users\pablo\OneDrive\ingenium-web\Pre Ingenierías\Pre ingenierías UNCuyo\Matemática` |
| Física (cualquier track) | Comparar UTN (`…\Pre UTN Mza\2026\Física`) y UNCuyo (`…\Pre ingenierías UNCuyo\Física`) antes de decidir común vs. variante |

**Reglas duras:**

- Si la ruta es inaccesible → **STOP**. Pedir a Pablo el PDF fuente o un extracto. **No inventar contenido.**
- No pegar texto de PDF crudo en la app. Normalizar en la estructura JSON del repo (`content/{materia}/{tipo}/unit-{n}.json`) respetando reglas pedagógicas.
- Para Física: comparar ambas fuentes (UTN + UNCuyo) antes de decidir qué es contenido común y qué es variante por track.
- Para Matemática UNCuyo: usar la fuente UNCuyo **solo después** del mapeo de I-17.

### Scope de una branch de contenido

- Actualizar archivos JSON de contenido (theory, examples, exercises, feedback).
- Actualizar catálogo/navegación **solo en lo necesario** para que la nueva unidad sea transitable.
- No tocar dominio, persistencia, ni componentes de infraestructura.

### Carpetas destino por materia/track

#### M2 — Matemática UTN U4–U6

Usar carpetas existentes. No crear splits por track.

| Tipo | Ruta |
|---|---|
| theory | `content/matematica/theory/unit-{4,5,6}.json` |
| examples | `content/matematica/examples/unit-{4,5,6}.json` |
| exercises | `content/matematica/exercises/unit-{4,5,6}.json` |
| feedback | `content/matematica/feedback/unit-{4,5,6}.json` |
| challenges | `content/matematica/challenges/unit-{4,5,6}.json` — solo si el issue lo incluye |
| catálogo | `src/domain/catalog/*` — cambios mínimos de navegación |

#### M4 — Física común

Crear estructura nueva bajo `content/fisica/` con el mismo patrón. No split UTN/UNCuyo al inicio.

| Tipo | Ruta |
|---|---|
| theory | `content/fisica/theory/unit-{1,2,…}.json` |
| examples | `content/fisica/examples/unit-{1,2,…}.json` |
| exercises | `content/fisica/exercises/unit-{1,2,…}.json` |
| feedback | `content/fisica/feedback/unit-{1,2,…}.json` |
| challenges | `content/fisica/challenges/unit-{1,2,…}.json` — solo si el issue lo incluye |
| tracks | `content/fisica/tracks/utn-mendoza.json`, `content/fisica/tracks/uncuyo.json` — cuando aplique |
| variants | `content/fisica/variants/{track}/…` — solo con evidencia de diferencia material |

#### M6 — Matemática UNCuyo

**Stop rules — no avanzar antes de tiempo:**

1. **No crear** `content/matematica/uncuyo/` ni carpeta paralela antes de que I-17 exista y demuestre contenido genuinamente distinto.
2. **No duplicar** contenido UTN en carpetas UNCuyo de forma ciega.
3. **Antes de M5/M6**, solo crear track mapping: `content/matematica/tracks/utn-mendoza.json` y `content/matematica/tracks/uncuyo.json`.
4. **Variantes UNCuyo** (`content/matematica/variants/uncuyo/{theory,examples,exercises,feedback}/…`) solo si I-17 prueba diferencia material. Si el contenido es igual o equivalente, reusar `content/matematica/{theory,examples,exercises,feedback}/`.

| Paso | Qué crear | Condición |
|---|---|---|
| 1 | `content/matematica/tracks/*.json` | Arranque de M5/M6 |
| 2 | `content/matematica/variants/uncuyo/…` | I-17 demuestra contenido distinto |

### Coordinación con track/catálogo

Si el cambio de contenido toca el modelo de track o catálogo:

- **Parar** y coordinar con I-19 (modelo persistible con `trackId`) o I-20 (home derivado desde track).
- No avanzar solo.

### Checklist de aceptación para contenido institucional

- [ ] Decisión común vs. específico de track está documentada en el issue.
- [ ] No se creó app ni carpeta paralela para la nueva institución.
- [ ] Track mapping es explícito (archivo JSON o entrada en catálogo).
- [ ] Contenido respeta material canónico y secuencia pedagógica.
- [ ] La nueva unidad es transitable sin romper las existentes.
- [ ] Readiness honesto: no marcar como transitable lo que no tiene recorrido completo.

---

## Templates de criterios de aceptación

### Persistencia

- [ ] App funciona con Supabase configurado y sin Supabase configurado.
- [ ] Cada intento lleva `studentId`, `subjectId`, `skillId`, `trackId`.
- [ ] No se registran intentos anónimos.
- [ ] Fallback local conserva comportamiento actual.
- [ ] No se expone service key en cliente.

### Teacher dashboard (`/docente`)

- [ ] `/docente` existe y muestra alumnos reales.
- [ ] Se ve última actividad por alumno.
- [ ] Se ve cantidad de intentos y porcentaje de acierto.
- [ ] Se detectan skills débiles o no iniciadas.
- [ ] La vista permite tomar decisiones pedagógicas concretas.

### Multi-track

- [ ] Existe track default UTN Mendoza Matemática.
- [ ] Una misma skill puede pertenecer a distinta unidad según track.
- [ ] Home deriva unidades desde track activa.
- [ ] No se rompe la experiencia UTN existente.
- [ ] Tests prueban ordenamiento independiente del `skillId`.

### Contenido educativo

- [ ] Unidad/skill aparece en la navegación prevista.
- [ ] Tiene teoría, ejemplo, práctica y feedback.
- [ ] Respeta material canónico y secuencia pedagógica.
- [ ] No rompe unidades ya transitables.
- [ ] Readiness honesto: no declarar transitable lo que no tiene recorrido completo.

### Refactor-only (sin cambio funcional)

- [ ] Tests existentes siguen verdes sin modificación.
- [ ] Cero accesos directos al patrón reemplazado fuera del módulo nuevo.
- [ ] No hay cambio visible en UI ni en comportamiento del alumno.
- [ ] El PR explica qué se movió y por qué.

---

## Gates: parar y preguntar

Detenerse y preguntar al usuario antes de continuar si:

| Situación | Por qué |
|---|---|
| Regla de producto ambigua | No inventar criterios pedagógicos. |
| PR excede 400 líneas | Imponer chained PRs o pedir `size:exception`. |
| Toca auth, seguridad o persistencia | Confirmar approach antes de escribir código. |
| Cambia shape de datos de estudiante | Migración legacy puede romper datos existentes. |
| Migración de datos | Confirmar estrategia de migración idempotente. |
| Semántica de track/subject ambigua | No asumir; preguntar. |
| Spec no existe o está incompleta | No implementar sin spec. |

---

## Gates: parar y revisar

Detenerse y revisar (no necesariamente preguntar) si:

- Un test falla tras implementar: verificar que el test es correcto antes de cambiarlo.
- El diseño resulta incorrecto o incompleto: anotar en el return summary, no desviar en silencio.
- Una tarea está bloqueada por algo inesperado: reportar al orchestrator.
- El workload forecast cambia durante la implementación: re-evaluar chained PRs.

---

## Engram

### Qué guardar

- Decisiones de arquitectura o diseño.
- Bug fixes (qué estaba mal, por qué, cómo se arregló).
- Patrones establecidos (naming, estructura, convenciones).
- Cambios de configuración.
- Descubrimientos no obvios sobre el codebase.
- Gotchas o edge cases.

### Formato

```
title: "Switched from sessions to JWT"
type: decision | architecture | bugfix | pattern | config | discovery
content:
  **What**: [qué se hizo]
  **Why**: [por qué]
  **Where**: [archivos/paths]
  **Learned**: [gotchas, omitir si no hay]
```

### Reglas

- `capture_prompt: false` para artefactos SDD generados (proposal, spec, design, tasks, apply-progress).
- `capture_prompt: true` (default) para decisiones humanas y descubrimientos.
- Topic keys estables para temas evolutivos: `architecture/auth-model`, `sdd/{change}/apply-progress`.
- No sobreescribir topics diferentes con la misma key.

---

## Verificación final antes de return

Antes de reportar éxito al orchestrator:

1. Re-leer el artefacto de tasks persistido.
2. Confirmar que cada tarea reportada como completada tiene `[x]` en el artefacto.
3. Si alguna tarea completada sigue con `[ ]`, arreglar el checkbox antes de retornar.
4. No reportar "Ready for verify" si el trabajo completado solo vive en todos internos o apply-progress.

---

## Siguiente paso

1. Confirmar con el usuario el orden de issues para M1.
2. Abrir el primer issue (I-21) y crear branch desde `main` actualizada.
3. Cargar skill `sdd-apply` y seguir el flujo.
4. Mantener M2 como prioridad de feature en paralelo.
