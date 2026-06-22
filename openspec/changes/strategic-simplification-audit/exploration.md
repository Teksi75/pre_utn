# Exploration: Auditoria estrategica de simplificacion / refactor

> **Change:** `strategic-simplification-audit`
> **Modo:** exploration-only (no implementa)
> **Almacenamiento:** Engram topic `sdd/strategic-simplification-audit/explore` + este archivo
> **Origen:** pedido del orquestador para evaluar el estado actual del repo contra las premisas de `docs/strategy/roadmap-estrategico-ingenium.md` (v. junio 2026).
> **Stack confirmado en repo:** Next.js 16.2.7, React 19.2.7, TypeScript estricto, Tailwind v4, KaTeX, Vitest 4.x, Playwright. **Sin Supabase en codigo fuente.**

---

## 1. Resumen ejecutivo

El proyecto tiene una base solida y disciplinada: dominio hexagonal limpio (`src/domain/` sin React/Next/Supabase), SDD + TDD + GGA con `STATUS.json` portable, 2.479 tests verdes en main, y un bridge de identidad local (`student-local-identity`) ya mergeado en `main` (2026-06-13).

Pero la auditoria detecta **brechas explicitas contra el roadmap** que son **bloqueantes para M1, M2 y M5** y que se pueden cerrar con refactors de bajo riesgo / alto impacto, sin reescrituras:

1. `trackId` y `subjectId` **no existen** en ningun modelo del dominio ni en ningun storage adapter. El `SkillId` es literal type `` `mat.u${1-6}.${string}` ``, lo que ata la institucion UTN-Matematica al modelo y bloquea la promesa del roadmap I-16 (multi-track, home derivado del track).
2. **No hay rastro de Supabase en el codigo fuente.** ADR-004 lo compromete para Auth/Postgres/Storage y los criterios de aceptacion de M1 lo exigen ("La App funciona con Supabase configurado y sin Supabase configurado"). Hoy todo es localStorage. Falta el adapter boundary con fallback local.
3. `ChallengeAttempt` (challenges) **no incluye `studentId`**, contradiciendo el criterio del roadmap "No se registran intentos anonimos". El bridge de identidad local solo se aplico a `PracticeAttempt`, no a `advanced-practice`.
4. Storage de identidad esta duplicado: `getActiveStudentIdInternal` existe copy-pasted en `practice-progress.ts:260` y `diagnostic-storage.ts:44`, y `advanced-practice-progress.ts` ni siquiera tiene equivalente.
5. `MathRoutePanel` tiene `UNIT_TITLE` hardcoded (lineas 21-24) y `LearnMatematicaPage` tiene `UNIT_LABELS` hardcoded (lineas 11-17), copy pedagogico duplicado fuera del catalogo.
6. `buildPrimaryActions` y `buildSuggestedActions` en `student-home/index.ts` comparten el mismo patron "filter por weak + slice(0, MAX_RECOVERY_CARDS)" duplicado en dos lugares con la misma condicion `accuracy < 0.7 || trend === 'needs-review'`. Es if-hell gemelo.

El resto del reporte ordena los hallazgos por prioridad (P0/P1 primero para M1+M5 enabling; luego refactors mas profundos) y marca explicitamente que **NO** se debe tocar todavia porque bloquearia la urgencia pedagogica de M2.

---

## 2. Method / trazabilidad de la exploracion

### Archivos / areas inspeccionadas primero y por que

| # | Area | Por que primero | Archivos leidos |
|---|---|---|---|
| 1 | Roadmap estrategico | Define las premisas contra las que auditar | `docs/strategy/roadmap-estrategico-ingenium.md` (373 lineas) |
| 2 | Reglas del repo (AGENTS.md) y ADR fundacional | Definen constraints duros: dominio sin React/Next/Supabase, pnpm, TS estricto, marca | `AGENTS.md`, `docs/sdd/13-adr-foundation.md` (112 lineas) |
| 3 | `openspec/changes/STATUS.json` | Fuente portable de verdad del estado SDD; revela que cambios ya estan mergeados y que quedo pendiente | `openspec/changes/STATUS.json` (571 lineas) |
| 4 | Esqueleto de la app y rutas | Mapear navegacion y gate points | `src/app/{layout.tsx, page.tsx, learn/page.tsx, diagnostic/page.tsx, practice/page.tsx, practice/usePracticeFlow.ts, practice/start-skill.ts, practice/phases.ts, practice/previous-snapshot.ts}` |
| 5 | Persistencia local (storage adapters) | Es donde vive la promesa "no anonymous attempts + safe local/remote fallback" del roadmap | `src/lib/{practice-progress.ts, diagnostic-storage.ts, student-profile-storage.ts, advanced-practice-progress.ts, skill-label.ts}` |
| 6 | Hook de identidad activa | Punto unico de acceso al alumno activo en runtime | `src/hooks/{useActiveStudent.ts, active-student-store.ts}` |
| 7 | Dominio puro (catalogo, modelos, progress, next-step, student-home, diagnostic, student-profile) | El "interior" que NO debe tener React/Next/Supabase y contra el que se auditan los criterios M1/M5 | `src/domain/{index.ts, models/*, catalog/*, progress/index.ts, diagnostic/index.ts, next-step/index.ts, student-home/index.ts, student-profile/index.ts}` |
| 8 | Componentes home / selector de skill / gate de estudiante / diagnostico | Donde se manifiesta el if-hell y la duplicacion visual | `src/components/{Nav.tsx, StudentGate.tsx, home/HomeNextStepClient.tsx, home/StudentSwitcher.tsx, home/student-home/*, practice/FocusSelector.tsx, practice/PracticeSelectPhase.tsx, practice/PracticeFeedbackPhase.tsx, diagnostic/ResultsDisplay.tsx, diagnostic/practice-link.ts, exercises/ExerciseAnswerInput.tsx}` |

### Busquedas / metricas usadas para detectar complejidad

| Senal que buscaba | Busqueda | Hallazgo |
|---|---|---|
| Multi-institucion / multi-track modelado | `rg "trackId\|track_id"` en `src/` | **0 matches** - el modelo no existe |
| Multi-materia modelado | `rg "subjectId\|subject_id"` en `src/` | **0 matches** - el modelo no existe |
| Identidad de estudiante | `rg "studentId\|student_id"` en `src/` | **78 matches** - si modelado (M1 enabling) |
| Acoplamiento UTN en codigo | `rg "utn\|UTN"` en `src/` | 32 matches concentrados en **claves de localStorage** y strings de copy; el codigo de dominio **NO dice "UTN"**, dice "mat.uN" |
| Adapter boundary Supabase | `rg "supabase\|@supabase"` en `src/` | **0 matches** - no hay adapter de Supabase |
| Patron de try/catch silencioso en storage | `rg "catch\s*\{"` en `src/` | 18 matches en 4 archivos de `lib/` - patron uniforme pero **disperso** (sin helper compartido) |
| Acoplamiento a `mat.u${1-6}` | `rg "mat\.u\d"` en `src/` | 100+ matches - el literal type `SkillId = mat.u${1-6}.${string}` **propaga el acoplamiento institucional a todo el dominio** |
| Hardcoded unit titles | lectura directa de `MathRoutePanel.tsx` y `learn/matematica/page.tsx` | Encontradas dos copias (MathRoutePanel:21-24 + LearnMatematicaPage:11-17) |
| Duplicacion interna de helpers de storage | lectura directa de `practice-progress.ts` y `diagnostic-storage.ts` | `getActiveStudentIdInternal` aparece **identica** en ambos archivos (lineas 260 y 44) |
| `EMPTY_PROGRESS` exportado y reusado | `rg "EMPTY_PROGRESS"` en `src/` | 13 matches - unica fuente de verdad, pero `EMPTY_PROGRESS` y `loadProgress()` se usan **antes de que se cargue** el profile activo, lo cual provoca el bug conocido del flujo de practica (`usePracticeFlow.ts:213` saltea hasta que `progress !== EMPTY_PROGRESS`) |
| `MathWatermark` envolvente | lectura directa de 5 archivos de `app/` y `components/` | Confirmado: se aplica con variantes `topic="sets"` hardcoded en 5 lugares |
| Tests fixtures duplicados | `rg "function activateStudent"` en `src/lib/__tests__/` | 2 fixtures identicos (`practice-progress.test.ts:41` y `diagnostic-storage.test.ts:70`); mismo patron en `student-profile-storage.test.ts` |

### Limitaciones / huecos

- No corri tests (`pnpm run test:run`) ni `pnpm typecheck` / `pnpm build`. La rama `main` tiene 2.479 tests verdes segun `STATUS.json:566`. No verifique el comportamiento runtime.
- No inspeccione el contenido literal de los 5 JSON de `content/matematica/` (teoria, ejemplos, feedback, ejercicios, challenges) mas alla de los imports y la cantidad de archivos. Si inspeccione `catalog/index.ts` y `catalog/content-loaders.ts` que son quienes los cargan.
- `docs/auditorias/unidad-1/` y `docs/qa/` los mire por nombre y resumen, no linea por linea.
- `supabase/migrations/` esta **vacio** (solo `.gitkeep`). No hay schema Supabase definido - la promesa ADR-004 + M1 es todavia contractual, no implementacion.
- No inspeccione `playwright.config.ts` ni los fixtures de e2e mas alla de confirmar que existen en `tests/e2e/specs/`.

---

## 3. Mapa actual de la arquitectura

```
pre_utn/
+- src/
|  +- app/                       <- Rutas (Next.js App Router)
|  |  +- layout.tsx              <- RootLayout: <Nav/> + <main/> + footer
|  |  +- page.tsx                <- Home: server component, monta <HomeNextStepClient/>
|  |  +- learn/                  <- /learn (indice) + /learn/matematica + /learn/matematica/[skillId]
|  |  +- practice/               <- /practice (flujo guiado en 4-7 fases)
|  |  |  +- page.tsx             <- Orquestador (server-rendered shell, luego client)
|  |  |  +- usePracticeFlow.ts   <- Hook con state machine + persistencia
|  |  |  +- phases.ts            <- Pure nextPhase()
|  |  |  +- start-skill.ts       <- Analisis de ?skill=... y buildAccessibleSkillMap
|  |  |  +- previous-snapshot.ts <- Snapshot read-only del ejercicio anterior
|  |  +- diagnostic/             <- /diagnostic (3 fases: loading -> question -> results)
|  |
|  +- components/                <- UI presentacional
|  |  +- Nav.tsx                 <- Brand mark + nav items + chip de alumno activo
|  |  +- StudentGate.tsx         <- Card de identificacion
|  |  +- home/
|  |  |  +- HomeNextStepClient.tsx <- Compone 4 paneles: Mission, Situation, Route, Decisions
|  |  |  +- StudentSwitcher.tsx     <- Modal de cambiar/crear perfil
|  |  |  +- HomeGreeting.tsx        <- Saludo hydration-safe
|  |  |  +- StudyPlanCard.tsx       <- Card del plan
|  |  |  +- student-home/           <- MissionCard, MathRoutePanel, StudentSituationPanel, DecisionBoardPanel
|  |  +- practice/               <- FocusSelector, Practice*Phase, AnswerForm, FeedbackDisplay, ...
|  |  +- diagnostic/             <- DiagnosticQuestion, DiagnosticProgress, ResultsDisplay, practice-link, resolveResultsTopic
|  |  +- exercises/              <- ExerciseAnswerInput, SubmittedAnswerDisplay, helpers (answer-state, layout, option-shuffle)
|  |  +- math/                   <- RichText, MathThemePlate, math-visuals
|  |  +- ui/                     <- Button, Card, StatusPill, BackButton, DirectionalTransition, PhaseBadge
|  |
|  +- hooks/
|  |  +- useActiveStudent.ts     <- useSyncExternalStore sobre el store
|  |  +- active-student-store.ts <- Set<listener> + snapshot
|  |
|  +- lib/                        <- Adapters de persistencia (NO dominio)
|  |  +- practice-progress.ts    <- pre-utn.practice.v1, central map por studentId
|  |  +- diagnostic-storage.ts   <- pre-utn.diagnostic.v1 + pre-utn.study-plan.v1 (ambas central-map)
|  |  +- student-profile-storage.ts <- pre-utn.profiles.v1, ProfilesState
|  |  +- advanced-practice-progress.ts <- pre-utn.advanced-practice.v1, ChallengeAttempt sin studentId
|  |  +- skill-label.ts          <- Deriva label humano de SkillId slug
|  |
|  +- domain/                     <- LOGICA PURA, sin React/Next/Supabase
|  |  +- models/                 <- Skill, SkillId (literal type mat.u${1-6}.${string}), Exercise, ...
|  |  +- catalog/                <- pilot-skills.ts, content-loaders.ts, readiness.ts, accessibility.ts, skill-availability.ts, challenges/
|  |  +- progress/index.ts       <- computeAccuracy, computeTrend, computeMasteryLevel, PracticeAttempt/PracticeProgress
|  |  +- diagnostic/index.ts     <- selectBalancedSet, estimateSkills, suggestPractice, createStudyPlan
|  |  +- next-step/index.ts      <- deriveHomeNextStep
|  |  +- student-home/index.ts   <- deriveStudentHomeViewModel
|  |  +- student-profile/index.ts <- createProfile, validateDisplayName, PracticeAttempt re-export
|  |  +- evaluator/              <- evaluateAnswer (dispatcher por ExerciseType)
|  |  +- feedback/               <- generateFeedback
|  |  +- readiness/              <- computeReadiness
|  |  +- error-taxonomy/         <- Carga de tags
|  |  +- intervals/              <- IntervalRepresentation + svg-layout
|  |  +- shared/                 <- parseSkillUnit (helper)
|  |  +- utils/                  <- isFiniteNumericAnswer
|  |  +- visuals/                <- MathTheme map
|  |
|  +- types/react-canary.d.ts
|  +- instrumentation.ts
+- content/
|  +- matematica/                 <- theory/, examples/, feedback/, exercises/, challenges/ + exercises.json maestro
|  +- fisica/                     <- Carpena presente pero Vacia (Fisica = fase 2, fuera de scope MVP)
+- tests/e2e/                     <- 14 specs Playwright (canary + 13 muestras U1/U2)
+- docs/strategy/, docs/sdd/, docs/auditorias/unidad-1/, docs/qa/
+- openspec/changes/STATUS.json   <- 24 cambios tracked, 1 in-progress (implement-unit-3)
+- openspec/specs/                <- 26 specs (math-skill-model, student-local-identity, teacher-digital-home, ...)
+- supabase/migrations/           <- **vacio** (.gitkeep). ADR-004 sin implementar.
+- scripts/audit-branches.sh      <- Drift / zombie / stale detection
```

Responsabilidades por capa:

- **Dominio** (puro, sin React/Next/Supabase): define modelos, contratos, reducers. La mayoria de la complejidad vive aca.
- **Hooks** (cliente React): unico puente entre `localStorage` y los componentes. `useActiveStudent` ya encapsula el patron de "store externo + useSyncExternalStore + listeners".
- **Lib (adapters)**: persistencia local. Hoy la unica fuente de verdad; manana deberia ser un fallback de un adapter Supabase.
- **Components**: presentacionales. Algunos todavia hacen I/O directo (`StudyPlanSection`, `StudentSwitcher`, `HomeNextStepClient`) lo cual es un patron inconsistente con `useActiveStudent`.
- **App routes**: la mayoria son server components que delegan a un `<Client/>` con `useEffect` para hidratacion. Patron razonable, pero el `HomeNextStepClient` (158 lineas) ya se siente demasiado cargado.

---

## 4. Hallazgos priorizados

### P0 - Bloqueantes para el roadmap (M1, M5 enabling)

#### Hallazgo 1: `trackId` y `subjectId` no existen (bloquea M5 / I-16)

- **Evidencia:**
  - `grep -r "trackId\|track_id" src/` -> 0 matches.
  - `grep -r "subjectId\|subject_id" src/` -> 0 matches.
  - `src/domain/models/skill.ts:10`: `export type SkillId = `mat.u${1 | 2 | 3 | 4 | 5 | 6}.${string}`;` - **literal type que ata UTN-Matematica al modelo**.
  - `src/domain/models/skill-catalog.ts:11-93`: `UNIT_1_SKILLS` a `UNIT_6_SKILLS` hardcoded con prefijos `mat.uN`.
  - `src/domain/catalog/pilot-skills.ts:9-125`: `PILOT_SKILLS` con `unitKey: "unit-1"|"unit-2"|"unit-3"` (string suelto, no tipado).
  - `src/domain/catalog/content-loaders.ts:28-42`: imports de `theoryUnit1`, `examplesUnit2`, etc. hardcoded con subfijo numerico.
  - `src/components/home/student-home/MathRoutePanel.tsx:21-24`: `UNIT_TITLE` hardcoded.
  - `src/app/learn/matematica/page.tsx:11-17`: `UNIT_LABELS` hardcoded.
  - `src/app/learn/page.tsx:18-29`: la nav hardcodea "Matematica" como unica materia.
- **Impacto contra el roadmap:** el roadmap I-16 ("Home derivado desde track activa, no desde skillId rigido") es **literalmente imposible** hoy. El home deriva unidades desde `parseSkillUnit(skillId)` en `student-home/index.ts:348`, lo cual rompe M5. La premisa "Una sola App, no dos apps" (ADR-001) sobrevive, pero la evolucion multi-institucion no.
- **Propuesta de refactor:**
  1. Introducir `TrackId` (literal type, e.g. `utn-matematica`) y `SubjectId` (`matematica`) en `src/domain/models/`.
  2. Hacer `SkillId` opaco (no template literal) y derivarlo del track: `type SkillId = string & { __brand: "SkillId" }` o `type SkillId = string` con `validateSkillId()`.
  3. Reemplazar `UNIT_1_SKILLS` por `loadTrackSkills(trackId): readonly SkillId[]` en `domain/catalog/`.
  4. Hacer que `PracticeAttempt` y `ChallengeAttempt` lleven `subjectId` y `trackId` ademas de `studentId`.
  5. Extraer `MathRoutePanel`'s `UNIT_TITLE` y `LearnMatematicaPage`'s `UNIT_LABELS` al catalogo (`unitCatalog[trackId][unitKey].title`).
- **Before/after (sketch):**
  ```ts
  // Before (hardcoded)
  const UNIT_TITLE: Record<number, string> = {
    1: "Conjuntos numericos y operaciones",
    2: "Polinomios y ecuaciones",
  };
  // After (catalogado)
  const title = getUnit(trackId, unitKey).title;
  ```
- **Beneficios:** habilita M5, elimina hardcoded UTN-Matematica en UI, y sienta las bases para I-15/I-16/I-18 del roadmap.
- **Riesgos y mitigaciones:**
  - Rompe el `SkillId` literal type -> refactor de los cientos de tests que lo usan. Mitigacion: hacer un cambio PR por concern (1) domain model, (2) catalog loader, (3) UI) y mantener backwards-compat con un type guard temporal.
  - "No se toca el flow pedagogo" -> la promesa del change es: las skills existentes siguen funcionando identicas, lo unico que cambia es de donde sale el label y como se cargan.
- **Criterios de aceptacion:**
  - `trackId` y `subjectId` son tipos exportados del dominio y aparecen en `PracticeAttempt` y `ChallengeAttempt`.
  - Tests existentes siguen verdes sin modificacion.
  - `UTN Matematica` se selecciona como track por defecto (sin friccion para alumnos existentes).
  - Hay un test que prueba `getUnit(trackId, unitKey).title` para al menos U1-U3.
  - `SkillRoadmap` y `MathRoutePanel` no tienen `UNIT_TITLE` hardcoded.

#### Hallazgo 2: `ChallengeAttempt` no incluye `studentId` (bloquea M1 / "no anonymous attempts")

- **Evidencia:**
  - `src/lib/advanced-practice-progress.ts:30-37`: la interfaz `ChallengeAttempt` declara `exerciseId`, `skillId`, `correct`, `answeredAt`, `timeMs`, `attemptIndex`. **No tiene `studentId`.**
  - `src/lib/advanced-practice-progress.ts:158-188`: `addChallengeAttempt(attempt: ChallengeAttempt)` graba directo en `pre-utn.advanced-practice.v1` sin gate por profile activo.
  - En contraste: `src/lib/practice-progress.ts:213-258`: `addAttempt(attempt: PracticeAttempt)` SI exige active profile y devuelve `{ ok: false; reason: "missing-active-profile" }`.
- **Impacto contra el roadmap:** el criterio de aceptacion M1 reza "No se registran intentos anonimos". Los challenges son intentos de practica del alumno. No etiquetarlos por studentId rompe la trazabilidad pedagogica que el docente necesita.
- **Propuesta de refactor:**
  1. Aniadir `readonly studentId: string` a `ChallengeAttempt` (con opcion `?` mientras dura la migracion legacy, igual que se hizo con `PracticeAttempt.studentId?`).
  2. En `addChallengeAttempt`, leer el active studentId del mismo `pre-utn.profiles.v1` y asignarlo antes de persistir. Devolver `PersistenceResult` consistente con el resto.
  3. Migrar los registros legacy que no tengan studentId re-keyandolos al "Alumno local" cuando se detecten (mismo patron que `runLegacyMigration`).
- **Before/after (sketch):**
  ```ts
  // Before
  export interface ChallengeAttempt {
    readonly exerciseId: string;
    readonly skillId: SkillId;
    readonly correct: boolean;
    readonly answeredAt: string;
    readonly timeMs: number;
    readonly attemptIndex: number;
  }
  // After
  export interface ChallengeAttempt {
    readonly exerciseId: string;
    readonly skillId: SkillId;
    readonly studentId: string;          // <- nuevo
    readonly correct: boolean;
    readonly answeredAt: string;
    readonly timeMs: number;
    readonly attemptIndex: number;
  }
  ```
- **Beneficios:** cumple criterio M1, mantiene consistencia con `PracticeAttempt`, no requiere cambios UI porque el bridge se hace dentro del adapter.
- **Riesgos y mitigaciones:** romper el storage local existente -> mitigacion: la adicion de `studentId?` opcional en el modelo y el helper de migracion son el mismo patron ya aplicado en `practice-progress.ts:127-138`.
- **Criterios de aceptacion:**
  - `ChallengeAttempt.studentId` es obligatorio en TypeScript y se inyecta en `addChallengeAttempt`.
  - Migracion legacy idempotente para datos existentes.
  - Tests: 3 casos (registro nuevo OK; sin profile = blocked; legacy migrado).
  - `computeAdvancedReadiness` agrupa por studentId activo, no por todos los attempts globales.

#### Hallazgo 3: Identidad del alumno se consulta via `localStorage.getItem` en 3 archivos (preparar adapter boundary)

- **Evidencia:**
  - `src/lib/practice-progress.ts:260-269`: `getActiveStudentIdInternal()` lee `pre-utn.profiles.v1` directamente.
  - `src/lib/diagnostic-storage.ts:44-53`: misma funcion, copy-pasted.
  - `src/lib/advanced-practice-progress.ts`: **no la tiene** - el adapter ni siquiera consulta el profile activo.
- **Impacto contra el roadmap:** el ADR-004 (Supabase) y el criterio M1 ("La App funciona con Supabase configurado y sin Supabase configurado") requieren un **adapter boundary** entre el storage concreto (localStorage hoy, Supabase manana) y el dominio. Hoy ese limite no existe: cada adapter habla directo con `localStorage`. Esto significa que cuando llegue el adapter remoto, hay que tocar 4 archivos, no 1.
- **Propuesta de refactor:**
  1. Mover `getActiveStudentId` y los helpers de lectura/escritura a un modulo compartido: `src/lib/active-profile-store.ts` con una API minima (`getActiveProfileId()`, `withActiveProfile<T>(fn)`).
  2. Re-exportarlo desde `student-profile-storage.ts` (donde ya vive el source-of-truth del profile) o desde un archivo nuevo `src/lib/active-session.ts`.
  3. Hacer que `practice-progress`, `diagnostic-storage` y `advanced-practice-progress` consuman ese modulo unico.
  4. Sentar la base para que cuando llegue el adapter Supabase, solo se cambie ese modulo y el resto del codigo sigue funcionando.
- **Before/after (sketch):**
  ```ts
  // Before (duplicado en 2 archivos + ausente en 1)
  function getActiveStudentIdInternal(): string | null {
    const profilesRaw = localStorage.getItem("pre-utn.profiles.v1");
    if (!profilesRaw) return null;
    const parsed = JSON.parse(profilesRaw) as { activeStudentId: string | null };
    return parsed.activeStudentId ?? null;
  }
  // After (un solo punto de acceso)
  // src/lib/active-session.ts
  export function getActiveProfileId(): string | null { /* ... */ }
  // src/lib/practice-progress.ts, diagnostic-storage.ts, advanced-practice-progress.ts
  import { getActiveProfileId } from "./active-session";
  ```
- **Beneficios:** habilita el swap localStorage -> Supabase sin tocar 4 archivos. Cierra Hallazgo 2 naturalmente. Reduce 2 copias a 1 fuente.
- **Riesgos y mitigaciones:** riesgo bajo porque es una extraccion sin cambio de comportamiento. Tests ya existentes cubren cada adapter por separado.
- **Criterios de aceptacion:**
  - `getActiveStudentIdInternal` eliminado de `practice-progress.ts` y `diagnostic-storage.ts`.
  - `advanced-practice-progress.ts` pasa a usar `getActiveProfileId`.
  - Tests verdes sin modificacion.
  - Cero accesos directos a `localStorage.getItem("pre-utn.profiles.v1")` fuera de `active-session.ts`.

---

### P1 - Bajo riesgo, alto impacto (limpieza, no bloqueante)

#### Hallazgo 4: `buildPrimaryActions` y `buildSuggestedActions` duplican logica "weak skills" en `student-home/index.ts`

- **Evidencia:**
  - `src/domain/student-home/index.ts:276-294` (buildPrimaryActions): mismo filtro `accuracy < WEAK_SKILL_THRESHOLD || trend === "needs-review"` + slice(0, MAX_RECOVERY_CARDS).
  - `src/domain/student-home/index.ts:429-444` (buildSuggestedActions): **mismo bloque literal**, solo cambia el shape del return.
  - Misma constante `WEAK_SKILL_THRESHOLD = 0.7` declarada dos veces en el mismo archivo (`student-home/index.ts:20` y `next-step/index.ts:7`).
- **Impacto:** duplicacion que invita a que un cambio se haga en un lado y no en el otro. Ademas, ambos bucles recorren `availableSkills` y `progress.attempts` por separado, lo cual es O(N) doble para datos que ya estan en el mismo sitio.
- **Propuesta:**
  1. Extraer un helper `selectWeakReadySkills(progress, availableSkills): readonly AccessibleSkill[]`.
  2. `buildPrimaryActions` y `buildSuggestedActions` consumen ese helper.
  3. Mover `WEAK_SKILL_THRESHOLD` a un modulo de constantes compartidas (e.g. `src/domain/shared/pedagogy-constants.ts`) y re-exportarlo.
- **Beneficios:** una sola fuente de verdad para "que es una skill debil". Si manana cambia el threshold, cambia en un solo lado.
- **Riesgos:** muy bajos. Tests existentes son behaviour-level sobre el view-model, asi que la extraccion no los rompe.
- **Criterios de aceptacion:** los 3 tests `derive-student-home-view-model.test.ts` siguen verdes sin modificacion.

#### Hallazgo 5: `getActiveStudentIdInternal` duplicado y `PRACTICE_SKILL_UNIT_MAP` re-exporta sin agregar valor

- **Evidencia:**
  - `src/lib/practice-progress.ts:260-269`: `getActiveStudentIdInternal` (10 lineas).
  - `src/lib/diagnostic-storage.ts:44-53`: misma funcion (10 lineas).
  - `src/app/practice/start-skill.ts:12-14`: `PRACTICE_SKILL_UNIT_MAP` que solo hace `...PILOT_SKILL_UNIT_MAP`. Un spread que no agrega valor y ofusca de donde viene la fuente real.
- **Impacto:** ruido que confunde. Cualquiera que lea `start-skill.ts` puede pensar que `PRACTICE_SKILL_UNIT_MAP` es una constante "real" cuando en realidad es un alias.
- **Propuesta:**
  1. Resolver Hallazgo 3 (esto cubre la mitad).
  2. Eliminar `PRACTICE_SKILL_UNIT_MAP` de `start-skill.ts:12-14` y hacer `import { PILOT_SKILL_UNIT_MAP } from "../../domain/catalog/pilot-skills";` directo en los call sites (`usePracticeFlow.ts:16` y `start-skill.ts:75`).
- **Beneficios:** elimina una indireccion inutil, deja el codigo mas leal a la fuente.
- **Riesgos:** minimos. Solo se cambia el nombre del binding, no la logica.
- **Criterios de aceptacion:** tests verdes; `PILOT_SKILL_UNIT_MAP` aparece exactamente en los call sites que lo necesitan.

#### Hallazgo 6: `EMPTY_PROGRESS` se compara por referencia en `usePracticeFlow` (fragil ante refactors)

- **Evidencia:**
  - `src/lib/practice-progress.ts:36-43`: `EMPTY_PROGRESS` es un objeto frozen.
  - `src/app/practice/usePracticeFlow.ts:213`: `if (progress === EMPTY_PROGRESS) return;` compara por identidad para saber "el storage todavia no respondio".
- **Impacto:** si alguien refactorea `loadProgress()` para devolver un objeto nuevo aunque los datos esten vacios, el flow deja de esperar. Es un acoplamiento fragil entre la implementacion del storage y la logica del hook.
- **Propuesta:**
  1. Cambiar la firma de `loadProgress()` para que devuelva un discriminador: `{ state: "empty" | "loaded"; progress: PracticeProgress }`.
  2. O exponer explicitamente `isLoaded: boolean` separado.
  3. En `usePracticeFlow`, leer el flag en vez de comparar por identidad.
- **Beneficios:** desacopla hook de storage, robustez ante refactors.
- **Riesgos:** se cambian 1 tipo y 1 call site. Tests existentes son por comportamiento asi que no se rompen.
- **Criterios de aceptacion:** cero comparaciones por referencia (`=== EMPTY_PROGRESS`) fuera del archivo que lo declara.

#### Hallazgo 7: `MathRoutePanel.UNIT_TITLE` y `LearnMatematicaPage.UNIT_LABELS` hardcoded

- **Evidencia:**
  - `src/components/home/student-home/MathRoutePanel.tsx:21-24`: `UNIT_TITLE: Record<number, string>` solo con U1 y U2 (las unicas con contenido).
  - `src/app/learn/matematica/page.tsx:11-17`: `UNIT_LABELS: Readonly<Record<string, string>>` con U1, U2, U3.
- **Impacto:** los labels pedagogicos viven en el codigo de UI, no en el catalogo. Cuando llegue U3 con contenido pleno, hay que tocar 2 archivos para agregar el titulo. Si M5 habilita UNCuyo con tracks paralelos, el problema escala.
- **Propuesta:** dentro del refactor mayor de Hallazgo 1, mover estos labels a `unitCatalog[trackId][unitKey].title`.
- **Beneficios:** mismo cambio que Hallazgo 1 cubre este.
- **Criterios de aceptacion:** cero `UNIT_TITLE` o `UNIT_LABELS` hardcoded en `components/` o `app/`.

#### Hallazgo 8: Componentes home hacen I/O directo de localStorage (rompe el patron del hook)

- **Evidencia:**
  - `src/components/home/StudyPlanSection.tsx:34-37`: usa `useEffect` + `loadStudyPlan()` + `loadProgress()` directo.
  - `src/components/home/StudentSwitcher.tsx:26`: `const profiles = loadProfiles().profiles;` - lectura directa fuera de cualquier hook (se ejecuta en cada render).
  - `src/components/home/HomeNextStepClient.tsx:46-47`: `loadProgress()` y `loadDiagnosticResult()` directo en `useEffect`.
- **Impacto:** el patron "hook + useSyncExternalStore" ya existe (`useActiveStudent`). Mezclarlo con "leer directo en useEffect" genera doble fuente de verdad y dos consumidores pueden leer versiones distintas del mismo storage.
- **Propuesta:** extraer `useStudentProgress()` y `useStudyPlan()` siguiendo el mismo patron de `useActiveStudent` (external store + useSyncExternalStore). Esto tambien facilita el dia que el storage sea remoto: el componente no se entera.
- **Beneficios:** patron consistente; componente presentacional no toca storage; un solo lugar para aadir "isLoading" y "error" cuando llegue Supabase.
- **Riesgos:** moderados. Hay que mover la lectura al hook, pero la logica de derivacion del view-model queda en el componente.
- **Criterios de aceptacion:** cero accesos directos a `loadProgress` / `loadDiagnosticResult` / `loadStudyPlan` / `loadProfiles` desde `src/components/` o `src/app/`. Solo desde `src/hooks/`.

---

### P2 - Refactors mas profundos (posponer o partir, no bloquean M1/M5 inmediato)

#### Hallazgo 9: `ExerciseAnswerInput` (286 lineas, 4 tipos de ejercicio en un solo componente)

- **Evidencia:** `src/components/exercises/ExerciseAnswerInput.tsx` cubre `multiple-choice`, `true-false`, `numerical/fill-blank/graphical` con bloques condicionales secuenciales (lineas 151, 209, 248, 280). Funciona, pero rompe el principio de composicion: una sola prop `exercise: Exercise` con tipo discriminado lleva a un `if (type === ...)` que se ramifica.
- **Propuesta:** descomponer en compound components (`<MultipleChoiceForm/>`, `<TrueFalseForm/>`, `<TextAnswerForm/>`) y un `<ExerciseAnswerInput>` shell que elige segun el tipo. Sigue el patron recomendado por Vercel Composition Patterns (composition over boolean props).
- **Beneficios:** testing aislado por tipo; menos riesgo al aniadir un nuevo ExerciseType.
- **Riesgos y mitigaciones:** refactor visualmente inofensivo pero requiere actualizar tests de Playwright que dependen de `data-testid="answer-form-multiple-choice"` etc. Mitigacion: PR atómico + regression test e2e antes/despues.
- **Por que NO hacerlo ahora:** ninguno de los criterios M1/M5 lo necesita. Hacerlo en la cola de I-15/I-16 cuando llegue el refactor de track.

#### Hallazgo 10: `usePracticeFlow` (423 lineas) contiene state machine + persistencia + profile gate

- **Evidencia:** el hook declara 19 `useState` + 2 `useRef` + 3 callbacks + 1 useEffect + expone 22 propiedades del return. Mezcla: selector de skill, carga de teoria, persistencia de intento, retry, previous-snapshot, profile-blocked.
- **Propuesta:** partir en `usePracticeStateMachine()` (phases + selectedSkillId + evaluation) y `useAttemptRecorder()` (addAttempt + retry + snapshot). El componente `PracticePage` los compone.
- **Por que NO hacerlo ahora:** refactor sin cambio visible. La urgencia pedagogica es M2/M3, no limpieza del hook.

#### Hallazgo 11: `home/HomeNextStepClient.tsx` (158 lineas) mezcla `viewModel` derivation + composition + switcher UI

- **Evidencia:** lee 4 storages, deriva 2 view-models, renderiza 4 paneles, controla el modal de switcher, y expone el gate de identificacion.
- **Propuesta:** extraer `useStudentHomeViewModel()` hook y dejar el componente solo como composition. Logica del switcher se puede partir en su propio `StudentSwitcherController`.
- **Por que NO hacerlo ahora:** no hay deuda pedagogica, solo deuda de testing (es dificil testear los 4 estados del flow desde un solo componente).

---

## 5. Backlog de issues sugerido con mapping a milestones

> Numeracion propuesta continua con la del roadmap (I-19 en adelante).

| ID | Titulo | Milestone | Branch sugerida | Bloquea / habilita | Esfuerzo |
|---|---|---|---|---|---|
| I-19 | Modelo persistible con `trackId` y `subjectId` (I-15 + I-16 fusionados) | M5 | `design/curricular-track-model` (issue) -> `refactor/track-id-model-domain` (PR) | Habilita I-20, I-21, I-22, M5 completo | M |
| I-20 | Decoupling del home desde track activa (`MathRoutePanel.UNIT_TITLE` + `LearnMatematicaPage.UNIT_LABELS` desde catalogo) | M5 | `refactor/home-track-derived-units` | Habilita I-22 | S |
| I-21 | Challenges: agregar `studentId` a `ChallengeAttempt` + migracion legacy | M1 | `fix/challenge-attempt-student-id` | Cierra criterio M1 "no anonymous attempts" | S |
| I-22 | Selector institucional (placeholder futuro - sin implementacion) | M6 | `design/institution-selector` | Solo design, no codigo | XS |
| I-23 | Adapter boundary para identidad activa (`getActiveProfileId` unico) | M1 + M5 | `refactor/active-session-module` | Pre-requisito de Supabase adapter | S |
| I-24 | Persistencia con fallback local/remote (Supabase adapter v0, gating por env) | M1 | `design/supabase-adapter` (issue) -> `feat/supabase-practice-attempts` | Habilita `/docente` v0 | L |
| I-25 | `/docente` v0 (M1 final) | M1 | `feat/teacher-dashboard-v0` | Cierra M1 | L |
| I-26 | De-duplicar `buildPrimaryActions`/`buildSuggestedActions` weak filter | M5 (limpieza) | `refactor/student-home-weak-filter-helper` | Limpieza, sin cambio funcional | XS |
| I-27 | Reemplazar `=== EMPTY_PROGRESS` por `isLoaded` flag | M5 (limpieza) | `refactor/load-progress-loaded-flag` | Robustez | XS |
| I-28 | Compound components para ExerciseAnswerInput | post-M5 | `refactor/exercise-answer-input-compound` | Limpieza | M |
| I-29 | Partir `usePracticeFlow` en state machine + recorder | post-M5 | `refactor/use-practice-flow-split` | Limpieza | M |

---

## 6. "No hacer todavia" (anti-abrumo para urgencia pedagogica)

Reglas tomadas del roadmap seccion 8 ("reglas anti-abrumo") y aplicadas a esta auditoria:

| Tentacion | Por que NO ahora |
|---|---|
| Reescribir `src/domain/models/skill.ts` para quitar el literal type `mat.u${1-6}.${string}` de una sola vez | Toca cientos de tests. **Espera I-19** para hacerlo con branch dedicada y PRs chained. |
| Mover toda la lectura de localStorage a un hook `useStorage()` generico | YAGNI. **Espera I-23 + I-24** para definir el contrato del adapter boundary cuando Supabase entre. Hoy, el cambio seria puro teatro. |
| Cambiar el contrato de `PracticeAttempt` para que `studentId` sea obligatorio (no opcional) | Rompe tests y datos en disco de cualquier alumno existente. **Espera I-21** primero para challenges (que es el unico "anonimo" que queda) y deja practice con `?` hasta la migracion Supabase. |
| Partir `usePracticeFlow` (423 lineas) en 3 hooks | Refactor sin valor pedagogico visible. **Post-M5**. |
| Introducir un sistema de "feature flags" global para QA mode | Ya existe `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE` y `isContentQaModeEnabled()`. No hay que generalizarlo. |
| Hacer que `Nav` tenga un menu responsive / hamburguesa | No hay peticion pedagogica. Cosmético, fuera de scope. |
| Unificar `focused_practice` y `free_practice` | Hoy el flujo guiado **es** la practica. No hay dos modos que unificar. |
| Empezar a usar SWR/Tanstack-Query "por las dudas" | Stack actual: useSyncExternalStore + localStorage. SWR no aporta nada hasta que el storage sea remoto. |

---

## 7. Campos del contrato de respuesta

| Campo | Valor |
|---|---|
| `status` | `success` |
| `executive_summary` | El proyecto esta bien estructurado y testeado, pero la auditoria detecta 3 gaps bloqueantes contra el roadmap (`trackId`/`subjectId` no modelados, sin Supabase, challenges sin `studentId`) y 5 oportunidades de simplificacion de bajo riesgo. La urgencia pedagogica de M2 no se bloquea con estos cambios si se ejecutan como PRs chained en branches dedicadas. |
| `artifacts` | `openspec/changes/strategic-simplification-audit/explore.md` (este archivo) + Engram topic `sdd/strategic-simplification-audit/explore` (mem_save). |
| `next_recommended` | Priorizar I-21 (`studentId` en `ChallengeAttempt`) en M1 porque es chico y cierra un criterio explicito. Luego I-23 (active-session module) que es pre-requisito natural de I-19 (track model). M5 se atiende al final del sprint M1 con I-19+I-20 en chained PRs. |
| `risks` | Si I-19 se aborda sin branch dedicada y sin chained PRs, hay riesgo alto de romper 2.479 tests. La mitigacion obligatoria es el patron chained-prs-stacked-to-main ya establecido (PR domain -> PR catalog -> PR UI). Riesgo secundario: si M2 (Unidades 4-6) entra en paralelo, hay que coordinar las branches porque ambas tocan `domain/models/skill-catalog.ts`. |
| `skill_resolution` | Skills loaded: sdd-explore (orquestador), vercel-react-best-practices, vercel-composition-patterns, cognitive-doc-design. Skill-registry note: `.atl/skill-registry.md` no existe, paths inyectados directamente desde el installed skill list (`available_skills` en el system prompt). |

---

## 8. Como seguir (para el orquestador)

1. Confirmar si el orden I-21 -> I-23 -> I-19+I-20 -> I-24 -> I-25 es razonable para el usuario, o si prefiere priorizar I-19 antes que I-21.
2. Si la respuesta es "adelante", el siguiente paso NO es un solo PR. Es:
   - branch `feat/challenge-attempt-student-id` para I-21 (size S, una sola concern).
   - branch `refactor/active-session-module` para I-23 (size S).
   - branch `design/curricular-track-model` para el design doc de I-19/I-20 (size XS, sin codigo).
3. El orchestrador debe avisar al usuario que M2 (Unidades 4-6) sigue siendo la prioridad de feature y que estos refactors son "puente" para que M1 y M5 sean posibles sin reescribir el feature work en curso.
