# Roadmap Ingenium — Guía humana

> **Para quién:** Pablo / maintainer humano.
> **Para qué:** recalibrar el producto, decidir qué sigue, qué se pausa y qué no se hace.
> **Lectura estimada:** 10 minutos.

---

## Resumen ejecutivo

El proyecto está en una base sólida (dominio hexagonal limpio, 2.479 tests verdes, SDD + TDD + GGA funcionando, bridge de identidad local mergeado en `main`). La auditoría de junio 2026 detectó tres brechas bloqueantes contra el roadmap y propuso once issues nuevos (I-19 a I-29) para cerrarlas sin reescrituras.

**Qué estamos optimizando ahora:**

1. Cerrar M1 (observabilidad pedagógica v0) con los criterios reales del roadmap: intentos no anónimos, fallback local/remote, `/docente` v0.
2. No bloquear M2 (cierre Matemática UTN U4–U6) con refactors preventivos.
3. Dejar M5 (multi-track) preparado con PRs encadenados, no con un mega-cambio.

**Premisa estratégica confirmada:** una sola App, UTN Matemática primero, observabilidad temprana, multi-track sin big-bang.

### Trazabilidad

| Referencia | Ruta |
|---|---|
| Fuente estratégica original | `docs/strategy/roadmap-estrategico-ingenium.md` |
| Auditoría de simplificación | `openspec/changes/strategic-simplification-audit/exploration.md` |
| Guía agéntica | `docs/strategy/roadmap-ingenium-agentico.md` |
| **Propósito de este documento** | Mapa de decisiones y lectura para el maintainer humano |

---

## Premisa estratégica

| Premisa | Qué significa en la práctica |
|---|---|
| Una sola App | Un repo, una base de código, rutas internas por institución. No dos apps. |
| UTN Matemática primero | M2 (U4–U6) sigue siendo prioridad de producción y validación pedagógica. |
| Observabilidad temprana | M1 cierra con `/docente` v0 viendo alumnos reales, actividad, acierto y skills débiles. |
| Multi-track sin big-bang | M5 se prepara con PRs encadenados (I-19, I-20) sin reescribir el dominio de golpe. |

---

## La unidad profesional de cambio

**Roadmap → Milestone → Issue → Branch → Pull Request → Tests → Criterios de aceptación.**

Cada layer tiene una pregunta:

| Layer | Pregunta que responde |
|---|---|
| Roadmap | ¿Hacia dónde va el producto? |
| Milestone | ¿Qué objetivo verificable estamos cerrando ahora? |
| Issue | ¿Qué trabajo concreto resuelve ese objetivo? |
| Branch | ¿Dónde trabajo sin tocar `main`? |
| Pull Request | ¿Cómo reviso el cambio en piezas entendibles? |
| Tests | ¿Cómo sé que no se rompió nada? |
| Criterios de aceptación | ¿Qué significa "terminado" para este issue? |

**Regla:** si un PR no se puede explicar en pocos párrafos, es demasiado grande. Partirlo.

---

## Milestones recalibrados (M0–M6)

| ID | Milestone | Objetivo | Prioridad | Estado | Issues clave |
|---|---|---|---|---|---|
| M0 | Gobernanza del roadmap | Estructura de trabajo, tablero, criterios. | ✅ Hecho | Cerrado | I-01 |
| M1 | Observabilidad pedagógica v0 | Persistir datos mínimos + `/docente` v0. | 🔴 Máxima | En curso | I-02, I-03, I-04, I-05, I-06 + **I-21, I-23, I-24, I-25** (audit) |
| M2 | Matemática UTN cierre MVP | Completar U4, U5, U6 con readiness honesto. | 🟠 Alta | Pendiente | I-07 a I-11 |
| M3 | Simulacro UTN Matemática | Práctica integradora tipo examen. | 🟠 Alta | Pendiente | I-12 |
| M4 | Física común UTN/UNCuyo | Mapa de skills de Física + primera ruta. | 🟡 Media-alta | Pendiente | I-13, I-14 |
| M5 | Preparación multi-track | Desacoplar skill de unidad institucional. | 🟡 Media | Pendiente | I-15, I-16 + **I-19, I-20, I-26, I-27** (audit) |
| M6 | UNCuyo Matemática | Activar ruta institucional específica. | ⚪ Media diferida | Pendiente | I-17, I-18 + **I-22** (audit) |

**Nota sobre M1 y M2:** M2 puede avanzar sin esperar a M5. M1 debe cerrarse antes de meter multi-track real.

---

## Backlog completo

### Issues originales del roadmap (I-01 a I-18)

| ID | Título | Milestone | Branch sugerida |
|---|---|---|---|
| I-01 | Roadmap estratégico del producto | M0 | `docs/roadmap-strategy` |
| I-02 | Diseñar observabilidad pedagógica v0 | M1 | `design/teacher-observability-v0` |
| I-03 | Modelo persistible de progreso | M1 | `design/persisted-progress-model` |
| I-04 | Persistir intentos con fallback local | M1 | `feat/supabase-practice-attempts` |
| I-05 | Persistir diagnóstico inicial | M1 | `feat/persist-diagnostic-results` |
| I-06 | Crear `/docente` v0 | M1 | `feat/teacher-dashboard-v0` |
| I-07 | Definir cierre U4–U6 Matemática UTN | M2 | `content/math-utn-close-scope` |
| I-08 | Implementar Unidad 4 UTN | M2 | `content/math-unit-4-geometry` |
| I-09 | Implementar Unidad 5 UTN | M2 | `content/math-unit-5-trigonometry` |
| I-10 | Implementar Unidad 6 UTN | M2 | `content/math-unit-6-functions` |
| I-11 | QA pedagógico Matemática UTN | M2 | `qa/math-utn-mvp-review` |
| I-12 | Simulacro UTN Matemática | M3 | `feat/utn-math-exam-practice` |
| I-13 | Mapa de skills Física | M4 | `design/physics-skill-map` |
| I-14 | Física U1: unidades y vectores | M4 | `content/physics-unit-1-vectors` |
| I-15 | Diseñar modelo track | M5 | `design/curricular-track-model` |
| I-16 | Home derivado desde track | M5 | `refactor/home-track-derived-units` |
| I-17 | Mapa UNCuyo Matemática | M6 | `design/uncuyo-math-map` |
| I-18 | Selector institucional | M6 | `feat/institution-selector` |

### Issues propuestos por la auditoría (I-19 a I-29)

> **Importante:** estos issues **no estaban en el roadmap original**. Fueron propuestos en junio 2026 tras auditar el repo contra las premisas del roadmap. Marcan brechas reales que bloquean M1 y M5.

| ID | Título | Milestone | Esfuerzo | Qué cierra |
|---|---|---|---|---|
| **I-19** | Modelo persistible con `trackId` y `subjectId` (fusión de I-15 + I-16) | M5 | M | Habilita M5 completo |
| **I-20** | Home derivado desde track activa (labels desde catálogo) | M5 | S | Habilita I-22 |
| **I-21** | Challenges: agregar `studentId` a `ChallengeAttempt` + migración legacy | M1 | S | Cierra criterio M1 "no anonymous attempts" |
| **I-22** | Selector institucional (placeholder — solo design) | M6 | XS | Design, sin código |
| **I-23** | Adapter boundary para identidad activa (`getActiveProfileId` único) | M1 + M5 | S | Pre-requisito de Supabase adapter |
| **I-24** | Persistencia con fallback local/remote (Supabase adapter v0) | M1 | L | Habilita `/docente` v0 |
| **I-25** | `/docente` v0 (cierre de M1) | M1 | L | Cierra M1 |
| **I-26** | De-duplicar `buildPrimaryActions` / `buildSuggestedActions` weak filter | M5 | XS | Limpieza, sin cambio funcional |
| **I-27** | Reemplazar `=== EMPTY_PROGRESS` por flag `isLoaded` | M5 | XS | Robustez |
| **I-28** | Compound components para `ExerciseAnswerInput` | post-M5 | M | Limpieza |
| **I-29** | Partir `usePracticeFlow` en state machine + recorder | post-M5 | M | Limpieza |

---

## Mapa de lectura recomendado

Los IDs `I-#` son **identificadores estables**, no orden de ejecución. Se conservan para trazabilidad con el roadmap original y los artefactos SDD existentes.

La siguiente tabla propone el orden humano de lectura e implementación:

| Orden humano | Issue(s) | Tema | Por qué leerlo así |
|---|---|---|---|
| 1 | I-21 | `studentId` en ChallengeAttempt | Corrección rápida de M1. Cierra "no anonymous attempts". |
| 2 | I-23 | Adapter boundary de identidad activa | Habilita todo lo que viene de Supabase. Pre-requisito natural. |
| 3 | I-24 | Persistencia Supabase con fallback local | Core de M1. Sin esto no hay datos remotos. |
| 4 | I-25 + I-02/I-03/I-04/I-05/I-06 | Observabilidad, dashboard docente, diseño y persistencia | Cierre de M1. Agrupa diseño + implementación + `/docente` v0. |
| 5 | I-07/I-08/I-09/I-10/I-11 | Contenido Matemática UTN U4–U6 + QA | M2 completo. Avanza en paralelo sin bloquear. |
| 6 | I-12 | Simulacro UTN Matemática | M3. Práctica integradora tipo examen. |
| 7 | I-13/I-14 | Mapa de Física + contenido U1 | M4. Arranca Física común. |
| 8 | I-17 | Mapeo Matemática UNCuyo (read-only) | Descubrimiento temprano. Se puede leer antes de M6 completo. |
| 9 | I-19/I-20/I-26/I-27 + I-15/I-16 | Modelo multi-track + limpieza home | M5. PRs encadenados, no big-bang. |
| 10 | I-18/I-22 | Selector institucional | M6. Depende del modelo multi-track. |
| 11 | I-28/I-29 | Limpieza profunda post-M5 | Sin valor pedagógico inmediato. Pausado. |

---

## Orden de ejecución recomendado

> Ver también el **Mapa de lectura recomendado** arriba para el orden completo con todos los milestones.

### Ahora (M1 — observabilidad)

1. **I-21** — `studentId` en `ChallengeAttempt`. Chico, cierra un criterio explícito de M1.
2. **I-23** — Adapter boundary de identidad activa. Pre-requisito natural de Supabase.
3. **I-24** — Supabase adapter v0 con fallback local.
4. **I-25** — `/docente` v0.

### En paralelo sin bloquear (M2 — contenido)

- M2 (I-07 a I-11) **puede avanzar sin esperar a M5**. No hay dependencia técnica.
- Si M2 y M5 tocan ambas `domain/models/skill-catalog.ts`, coordinar branches.

### Después (M5 — multi-track, con PRs encadenados)

- **I-19** → **I-20** → **I-26** → **I-27**, cada uno en su propia branch y PR.
- I-19 es el más grande: partirlo en chained PRs (domain → catalog → UI).

### Pausado (post-M5)

- I-28, I-29: limpieza sin valor pedagógico inmediato.

---

## Estrategia de incorporación de contenido teórico/práctico

| Milestone | Issues | Qué se incorpora | Branches |
|---|---|---|---|
| M2 | I-07 a I-11 | Matemática UTN faltante (U4–U6) | `content/...`, `qa/...` |
| M4 | I-13, I-14 | Física común UTN/UNCuyo (U1) | `design/...`, `content/...` |
| M6 | I-17, I-18 | Matemática UNCuyo | `design/...`, `feat/...` |

### Detalle por milestone

**M2 — Matemática UTN (I-07 a I-11):**

- I-07 define scope para U4–U6.
- I-08 implementa U4 Geometría.
- I-09 implementa U5 Trigonometría.
- I-10 implementa U6 Funciones.
- I-11 QA pedagógico de todo lo anterior.

**M4 — Física común UTN/UNCuyo (I-13, I-14):**

- I-13 diseña skill map desde material canónico.
- I-14 implementa Física U1 (unidades y vectores).

**M6 — Matemática UNCuyo (I-17, I-18):**

- I-17 mapea programa UNCuyo y decide qué es reusable/común vs. específico.
- I-18 agrega selector institucional (después de que el modelo multi-track esté listo).
- **No** copiar toda la matemática UTN en una app o carpeta paralela.

### Organización del contenido

#### M2 — Matemática UTN U4–U6 (carpetas existentes)

Las unidades 4, 5 y 6 usan los mismos folders ya existentes de matemática. No se crean carpetas nuevas ni splits por track.

| Tipo | Ruta |
|---|---|
| Teoría | `content/matematica/theory/unit-4.json`, `unit-5.json`, `unit-6.json` |
| Ejemplos | `content/matematica/examples/unit-4.json`, `unit-5.json`, `unit-6.json` |
| Ejercicios | `content/matematica/exercises/unit-4.json`, `unit-5.json`, `unit-6.json` |
| Feedback | `content/matematica/feedback/unit-4.json`, `unit-5.json`, `unit-6.json` |
| Challenges | `content/matematica/challenges/unit-4.json`, `unit-5.json`, `unit-6.json` — **solo si el issue los incluye**; no obligatorio. |
| Catálogo / navegación | `src/domain/catalog/*` — solo los cambios mínimos para que U4–U6 sean transitables. |

#### M4 — Física común UTN/UNCuyo (estructura nueva bajo `content/fisica/`)

Física arranca desde cero. El contenido común va directo en `content/fisica/` con el mismo patrón de matemática. **No** split UTN/UNCuyo al inicio.

| Tipo | Ruta |
|---|---|
| Teoría | `content/fisica/theory/unit-1.json` (y `unit-2.json`, … para unidades siguientes) |
| Ejemplos | `content/fisica/examples/unit-1.json` |
| Ejercicios | `content/fisica/exercises/unit-1.json` |
| Feedback | `content/fisica/feedback/unit-1.json` |
| Challenges | `content/fisica/challenges/unit-1.json` — solo si el issue los incluye. |
| Track mapping (cuando aplique) | `content/fisica/tracks/utn-mendoza.json`, `content/fisica/tracks/uncuyo.json` |
| Variantes por track (solo con evidencia) | `content/fisica/variants/{track}/theory/…`, `examples/…`, `exercises/…`, `feedback/…` |

#### M6 — Matemática UNCuyo (no copiar todo de entrada)

**No** crear `content/matematica/uncuyo/` ni carpeta paralela antes de que I-17 pruebe que hay contenido genuinamente distinto.

| Paso | Qué se crea | Cuándo |
|---|---|---|
| 1 | `content/matematica/tracks/utn-mendoza.json` y `content/matematica/tracks/uncuyo.json` | Cuando arranca M5/M6 — mapeo de unidades y skills por track. |
| 2 | `content/matematica/variants/uncuyo/theory/…`, `examples/…`, `exercises/…`, `feedback/…` | **Solo** si I-17 demuestra que el contenido UNCuyo es materialmente distinto del compartido/UTN. |

**Regla:** si el contenido es igual o equivalente, se reusa el de `content/matematica/{theory,examples,…}` sin duplicar.

### Fuentes canónicas externas

El repo almacena artefactos normalizados (JSON de teoría, ejemplos, ejercicios, feedback). Los PDFs y materiales de referencia viven **fuera del repo**, en OneDrive.

| Materia / Track | Ruta canónica (OneDrive local) |
|---|---|
| Matemática UTN — U4, U5, U6 | `C:\Users\pablo\OneDrive\ingenium-web\Pre Ingenierías\Pre UTN Mza\2026\Matemática` |
| Matemática UNCuyo — todas las unidades | `C:\Users\pablo\OneDrive\ingenium-web\Pre Ingenierías\Pre ingenierías UNCuyo\Matemática` |
| Física UTN | `C:\Users\pablo\OneDrive\ingenium-web\Pre Ingenierías\Pre UTN Mza\2026\Física` |
| Física UNCuyo | `C:\Users\pablo\OneDrive\ingenium-web\Pre Ingenierías\Pre ingenierías UNCuyo\Física` |

**Reglas:**

- Los PDFs son la **fuente pedagógica canónica**. Antes de crear teoría, ejemplos, ejercicios o feedback, consultar el material de OneDrive.
- El contenido **no se copia literal**; se transforma en unidades app-friendly con: objetivo, teoría, ejemplos, ejercicios, feedback y feedback de errores esperados.
- Las rutas de OneDrive son referencias de máquina local. Si la máquina no tiene acceso, la tarea queda **bloqueada** hasta que Pablo provea los archivos o extractos equivalentes.

### Regla de branches

- **No mezclar** contenido con infraestructura o refactor en la misma branch.
- Cada branch de contenido toca solo JSON de contenido y catálogo/navegación mínima.

---

## No hacer todavía

| Tentación | Por qué no ahora |
|---|---|
| Reescribir `SkillId` literal type de una sola vez | Toca cientos de tests. Esperar I-19 con PRs encadenados. |
| Mega `Attempt` discriminator unificado para diagnóstico | El shape del intento de diagnóstico es intencionalmente mínimo. No hay necesidad de producto que justifique unificarlo con `PracticeAttempt` hoy. Postpuesto. |
| Mover toda la lectura de localStorage a un hook genérico | YAGNI. Esperar I-23 + I-24 para definir el contrato del adapter boundary cuando Supabase entre. |
| Partir `usePracticeFlow` (423 líneas) en 3 hooks | Refactor sin valor pedagógico visible. Post-M5 (I-29). |
| Reescribir `ExerciseAnswerInput` como compound components | Ningún criterio M1/M5 lo necesita. Post-M5 (I-28). |
| Cambiar `PracticeAttempt.studentId` de opcional a obligatorio | Rompe tests y datos en disco. Esperar migración Supabase. |
| Feature flags globales para QA mode | Ya existe `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE`. No generalizar. |

---

## Reglas de decisión

1. **No más de 3 issues activos** en la columna "Ahora".
2. **No feature sin criterios de aceptación** escritos antes de implementar.
3. **No refactor que bloquee urgencia pedagógica.** M2 (contenido) no espera a M5.
4. **No intentos anónimos.** Todo intento lleva `studentId` + `subjectId` + `skillId` + `trackId` cuando aplique.
5. **No "profe digital" en el copy de la app del alumno.** La app es material de apoyo; la enseñanza ocurre en clase con Pablo.
6. **No big-bang multi-track.** M5 se prepara con PRs encadenados, no con una reescritura.

---

## Carga de revisión

| Regla | Valor |
|---|---|
| Presupuesto por PR | ≤ 400 líneas cambiadas |
| Refactors amplios (I-19, I-20) | Chained PRs obligatorios |
| PRs encadenados | `stacked-to-main`: cada PR apunta al anterior o a `main` tras merge |
| PR sin explicación de riesgos | No se mergea |

**Lectura recomendada:** si un PR necesita más de 10 minutos de revisión, está pidiendo ser partido.

---

## Siguiente paso

1. Confirmar orden I-21 → I-23 → I-24 → I-25 para M1.
2. Abrir I-21 como primer issue activo.
3. Mantener M2 (U4–U6) como prioridad de feature en paralelo.
4. Dejar I-19/I-20 para cuando M1 esté cerrado y M2 encaminado.
