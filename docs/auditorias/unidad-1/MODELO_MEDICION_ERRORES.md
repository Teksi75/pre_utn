# Modelo de medición de errores — `PedagogyEvent`

Diseño del modelo de telemetría pedagógica para U2+. Este modelo cierra las brechas H-18, H-19 y H-22 de la [`AUDITORIA_UNIDAD_1.md`](./AUDITORIA_UNIDAD_1.md) y reemplaza el actual `PracticeAttempt` plano por una union discriminada que captura el contexto completo de cada interacción del alumno.

## 1. Por qué un modelo nuevo

El modelo actual (`PracticeAttempt` en `src/lib/practice-progress.ts`) guarda `{ exerciseId, skillId, correct, errorTag, answeredAt, difficulty }`. Con eso se puede calcular `accuracy` y `trend`, pero no se puede responder:

- ¿Cuánto tardó el alumno en este intento?
- ¿Cuántas veces reintentó antes de acertar?
- ¿Pidió una pista? ¿Cuál?
- ¿Hizo click en "Repasar teoría" después de errar?
- ¿Volvió a la teoría, la leyó, y volvió a intentar?
- ¿Su precisión mejora con la práctica o se estanca?
- ¿El tiempo por intento baja con la练习量 o sube por fatigue?

El modelo `PedagogyEvent` agrega las primitivas necesarias sin tocar el flujo de `usePracticeFlow` actual — es un append-only log que se guarda en `localStorage` (decisión local-first del proyecto) y se puede migrar a Supabase sin cambiar el modelo.

## 2. Diseño: union discriminada

`PedagogyEvent` es una union discriminada de TypeScript. Cada tipo de evento tiene su `kind`, sus campos específicos, y se identifica por tipo en `switch` exhaustivos. La ventaja: el compilador obliga a manejar todos los casos (no hay "olvidé un evento").

```ts
// src/domain/pedagogy-event/index.ts (propuesta)

export type PedagogyEvent =
  | ExerciseShown
  | AnswerSubmitted
  | HintRequested
  | TheoryLinkClicked
  | ExampleLinkClicked
  | RetryStarted
  | RecoveryViewed
  | PracticeCompleted
  | DiagnosticStarted
  | DiagnosticCompleted;

export type PedagogyEventKind = PedagogyEvent["kind"];

/** Momento en que se muestra un ejercicio al alumno. */
export interface ExerciseShown {
  readonly kind: "exercise.shown";
  readonly eventId: string; // ULID
  readonly sessionId: string; // ULID, estable durante la sesión
  readonly skillId: SkillId;
  readonly exerciseId: ExerciseId;
  readonly difficulty: Difficulty;
  readonly shownAt: number; // epoch ms
  readonly attemptIndex: number; // 1, 2, 3, ... para este ejercicio en esta sesión
  readonly theorySeen: boolean; // ¿el alumno vio la teoría en esta sesión?
  readonly examplesSeenCount: number; // ¿cuántos ejemplos resolvió?
}

export interface AnswerSubmitted {
  readonly kind: "answer.submitted";
  readonly eventId: string;
  readonly sessionId: string;
  readonly skillId: SkillId;
  readonly exerciseId: ExerciseId;
  readonly attemptIndex: number;
  readonly shownAt: number;
  readonly submittedAt: number;
  readonly timeMs: number; // submittedAt - shownAt
  readonly correct: boolean;
  readonly errorTag: string | null; // null si fue correcto o si no se pudo taggear
  readonly userAnswer: string; // la respuesta cruda (sin normalizar)
}

/** El alumno pidió una pista. */
export interface HintRequested {
  readonly kind: "hint.requested";
  readonly eventId: string;
  readonly sessionId: string;
  readonly skillId: SkillId;
  readonly exerciseId: ExerciseId;
  readonly attemptIndex: number;
  readonly requestedAt: number;
  readonly hintLevel: 1 | 2 | 3; // 1 = pista conceptual, 2 = procedimiento, 3 = respuesta parcial
}

/** El alumno hizo click en un link a la teoría desde el feedback. */
export interface TheoryLinkClicked {
  readonly kind: "theory.link.clicked";
  readonly eventId: string;
  readonly sessionId: string;
  readonly skillId: SkillId;
  readonly exerciseId: ExerciseId;
  readonly clickedAt: number;
  readonly theoryId: string; // el ID del nodo de teoría
  readonly returnToExercise: boolean; // si volvió al mismo ejercicio después
}

export interface ExampleLinkClicked {
  readonly kind: "example.link.clicked";
  readonly eventId: string;
  readonly sessionId: string;
  readonly skillId: SkillId;
  readonly exerciseId: ExerciseId;
  readonly clickedAt: number;
  readonly exampleId: string;
  readonly returnToExercise: boolean;
}

/** El alumno reintentó el mismo ejercicio (sin feedback de por medio o después de feedback). */
export interface RetryStarted {
  readonly kind: "retry.started";
  readonly eventId: string;
  readonly sessionId: string;
  readonly skillId: SkillId;
  readonly exerciseId: ExerciseId;
  readonly attemptIndex: number; // el nuevo attemptIndex
  readonly startedAt: number;
  readonly trigger: "user_choice" | "recovery_phase" | "auto";
}

export interface RecoveryViewed {
  readonly kind: "recovery.viewed";
  readonly eventId: string;
  readonly sessionId: string;
  readonly skillId: SkillId;
  readonly exerciseId: ExerciseId;
  readonly viewedAt: number;
  readonly recoveryTarget: { kind: "theory" | "example"; id: string };
  readonly durationMs: number; // cuánto tiempo estuvo en la fase de recuperación
}

export interface PracticeCompleted {
  readonly kind: "practice.completed";
  readonly eventId: string;
  readonly sessionId: string;
  readonly skillId: SkillId;
  readonly completedAt: number;
  readonly exercisesAttempted: number;
  readonly exercisesCorrect: number;
  readonly totalTimeMs: number;
  readonly hintsUsed: number;
  readonly theoryClicks: number;
  readonly recoverySuccessRate: number; // 0..1
}

export interface DiagnosticStarted {
  readonly kind: "diagnostic.started";
  readonly eventId: string;
  readonly sessionId: string;
  readonly startedAt: number;
  readonly unit: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface DiagnosticCompleted {
  readonly kind: "diagnostic.completed";
  readonly eventId: string;
  readonly sessionId: string;
  readonly startedAt: number;
  readonly completedAt: number;
  readonly totalTimeMs: number;
  readonly skillEstimates: ReadonlyArray<{
    readonly skillId: SkillId;
    readonly accuracy: number; // 0..1
    readonly attempts: number;
  }>;
}
```

### 2.1. Por qué union discriminada y no clase

- **Exhaustividad en `switch`**: `const handler = (e: PedagogyEvent) => { switch (e.kind) { ... } }` obliga al compilador a señalar si se agrega un nuevo tipo de evento.
- **Serialización trivial**: es JSON puro, sin métodos ni prototypes. Append-only a `localStorage` o a Supabase.
- **Tests reducibles**: para cada `kind`, se testea el shape; para agregaciones, se testea el reducer con eventos sintéticos.
- **No necesita runtime**: TypeScript resuelve la discriminación en compile time.

### 2.2. Por qué no `extends BaseEvent`

Se podría tener una `BaseEvent` con `eventId`, `sessionId`, `timestamp`, y que cada tipo extienda. Es otra opción válida. La diferencia: con `extends`, los campos compartidos se escriben una vez pero la lectura en `switch` es idéntica. La union discriminada es más explícita sobre qué tiene cada evento y permite que un evento futuro tenga timestamp como `startedAt` y otro como `viewedAt` sin forzar la convención "todos tienen `at`".

## 3. Hooks de captura

Tres hooks de React para emitir eventos sin acoplar el componente a la lógica de telemetría.

### 3.1. `useSession`

Devuelve un `sessionId: string` (ULID) estable durante la sesión del navegador. Invalida al cerrar la pestaña.

```ts
// src/hooks/useSession.ts (propuesta)
import { useEffect, useState } from "react";
import { ulid } from "ulid";

export function useSession(): string {
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return "ssr-placeholder";
    const existing = window.sessionStorage.getItem("pre-utn.session.id");
    if (existing) return existing;
    const fresh = ulid();
    window.sessionStorage.setItem("pre-utn.session.id", fresh);
    return fresh;
  });
  return sessionId;
}
```

### 3.2. `useAttemptTimer`

Mide el tiempo entre el "ejercicio mostrado" y el "submit". Devuelve `start()`, `stop()`, y `elapsedMs`.

```ts
// src/hooks/useAttemptTimer.ts (propuesta)
import { useRef, useCallback, useState } from "react";

export function useAttemptTimer() {
  const startedAtRef = useRef<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const start = useCallback(() => {
    startedAtRef.current = performance.now();
    setElapsedMs(0);
  }, []);

  const stop = useCallback((): number => {
    if (startedAtRef.current === null) return 0;
    const elapsed = performance.now() - startedAtRef.current;
    startedAtRef.current = null;
    setElapsedMs(elapsed);
    return elapsed;
  }, []);

  return { start, stop, elapsedMs };
}
```

### 3.3. `useHint`

Devuelve el estado de hints y un `requestHint()` que emite el evento y devuelve el texto de la pista.

```ts
// src/hooks/useHint.ts (propuesta)
import { useState, useCallback } from "react";

export type HintLevel = 1 | 2 | 3;

export interface Hint {
  readonly level: HintLevel;
  readonly text: string;
}

export function useHint(hints: ReadonlyArray<Hint>, onRequest: (level: HintLevel) => void) {
  const [currentLevel, setCurrentLevel] = useState<HintLevel | null>(null);

  const requestHint = useCallback(() => {
    if (currentLevel === null) {
      const next: HintLevel = 1;
      setCurrentLevel(next);
      onRequest(next);
      return hints[0];
    }
    if (currentLevel < 3 && currentLevel < hints.length) {
      const next = (currentLevel + 1) as HintLevel;
      setCurrentLevel(next);
      onRequest(next);
      return hints[currentLevel]; // index 1 = level 2, etc.
    }
    return null;
  }, [currentLevel, hints, onRequest]);

  return { currentLevel, requestHint };
}
```

## 4. Logger: `pedagogyEventLog`

Función pura que serializa y persiste. Append-only a `localStorage` con clave `pre-utn.pedagogy.v1`. Migración trivial a Supabase cambiando la implementación del `store`.

```ts
// src/lib/pedagogy-event-logger.ts (propuesta)

import type { PedagogyEvent } from "@/domain/pedagogy-event";

const STORAGE_KEY = "pre-utn.pedagogy.v1";

export interface PedagogyEventStore {
  append(event: PedagogyEvent): void;
  readAll(): ReadonlyArray<PedagogyEvent>;
  clear(): void;
}

class LocalStorageEventStore implements PedagogyEventStore {
  append(event: PedagogyEvent): void {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const events: PedagogyEvent[] = raw ? JSON.parse(raw) : [];
    events.push(event);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }

  readAll(): ReadonlyArray<PedagogyEvent> {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

const defaultStore = new LocalStorageEventStore();

export function logPedagogyEvent(event: PedagogyEvent): void {
  defaultStore.append(event);
}

export function readPedagogyEvents(): ReadonlyArray<PedagogyEvent> {
  return defaultStore.readAll();
}

export function clearPedagogyEvents(): void {
  defaultStore.clear();
}
```

**Decisión**: el logger es síncrono. Para 106 ejercicios y ~8 eventos por ejercicio, son ~850 eventos totales; un append a `localStorage` toma <1ms. Si se migra a Supabase, este logger se vuelve async (con `Promise<void>`) y los hooks que llaman `logPedagogyEvent` deben `await`. El contrato del consumidor no cambia.

## 5. Métricas derivadas

Reducers puros sobre `ReadonlyArray<PedagogyEvent>`. Todos viven en `src/domain/pedagogy-event/metrics.ts` y se testean con eventos sintéticos.

### 5.1. `errorTagFrequency(events, skillId?): Map<string, number>`

Cuenta cuántas veces se observó cada `errorTag` en respuestas incorrectas. Opcionalmente filtra por skill.

```ts
// propuesta
export function errorTagFrequency(
  events: ReadonlyArray<PedagogyEvent>,
  skillId?: SkillId
): Map<string, number> {
  const freq = new Map<string, number>();
  for (const e of events) {
    if (e.kind !== "answer.submitted") continue;
    if (e.correct) continue;
    if (!e.errorTag) continue;
    if (skillId && e.skillId !== skillId) continue;
    freq.set(e.errorTag, (freq.get(e.errorTag) ?? 0) + 1);
  }
  return freq;
}
```

**Uso**: "Los 5 errores más frecuentes del alumno en `valor_absoluto`". Permite intervenciones pedagógicas tempranas.

### 5.2. `timeOnTask(events, skillId?): { median: number; p90: number; p99: number }`

Distribución del tiempo por intento (`timeMs` en `answer.submitted`). Opcionalmente filtra por skill.

```ts
// propuesta
export function timeOnTask(
  events: ReadonlyArray<PedagogyEvent>,
  skillId?: SkillId
): { median: number; p90: number; p99: number; count: number } {
  const times: number[] = [];
  for (const e of events) {
    if (e.kind !== "answer.submitted") continue;
    if (skillId && e.skillId !== skillId) continue;
    times.push(e.timeMs);
  }
  times.sort((a, b) => a - b);
  if (times.length === 0) return { median: 0, p90: 0, p99: 0, count: 0 };
  return {
    median: times[Math.floor(times.length * 0.5)],
    p90: times[Math.floor(times.length * 0.9)],
    p99: times[Math.floor(times.length * 0.99)],
    count: times.length,
  };
}
```

**Uso**: "¿Cuánto tarda el alumno en un ejercicio de `complejos`? Si p90 > 5 minutos, el ejercicio es muy difícil."

### 5.3. `retryCount(events, exerciseId): number`

Cuenta cuántos `RetryStarted` hubo para un ejercicio específico.

### 5.4. `recoverySuccessRate(events, skillId?): number`

Para cada `RecoveryViewed`, ¿el siguiente `AnswerSubmitted` del mismo `exerciseId` es correcto? Tasa de éxito 0..1.

```ts
// propuesta
export function recoverySuccessRate(
  events: ReadonlyArray<PedagogyEvent>,
  skillId?: SkillId
): { rate: number; total: number } {
  let total = 0;
  let success = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.kind !== "recovery.viewed") continue;
    if (skillId && e.skillId !== skillId) continue;
    // Buscar el siguiente answer.submitted del mismo exerciseId
    for (let j = i + 1; j < events.length; j++) {
      const next = events[j];
      if (next.kind === "answer.submitted" && next.exerciseId === e.exerciseId) {
        total++;
        if (next.correct) success++;
        break;
      }
    }
  }
  return { rate: total === 0 ? 0 : success / total, total };
}
```

**Uso**: "¿La fase de recuperación funciona? Si `rate < 0.5`, el `recoveryTarget` no está bien elegido."

### 5.5. `hintUsageRate(events, skillId?): number`

`count(HintRequested) / count(ExerciseShown)`. Mide dependencia de hints.

### 5.6. `theoryEngagement(events, skillId?): { clicks: number; returns: number; rate: number }`

`theory.link.clicked` con `returnToExercise: true` dividido por `theory.link.clicked` total. Mide si el alumno realmente repasa la teoría o solo hace click y se va.

### 5.7. `attemptIndexDistribution(events, exerciseId): Map<number, number>`

Para un ejercicio específico, cuántos `AnswerSubmitted` hubo con cada `attemptIndex`. Sirve para detectar ejercicios "frustrantes" (muchos intentos sin éxito).

## 6. Tests

Cada métrica tiene tests en `src/domain/pedagogy-event/__tests__/metrics.test.ts` con eventos sintéticos. Mínimo 3 tests por métrica:

- Input vacío → output neutro (0 / Map vacío / `{ rate: 0, total: 0 }`).
- Input con 1 evento → output correcto.
- Input con 10 eventos variados → output correcto.

Para el logger (`pedagogy-event-logger.ts`):

- `append` agrega al final del array.
- `readAll` devuelve todos los eventos en orden.
- `clear` borra todo.
- Eventos con shape inválido se rechazan (validación en runtime con Zod o similar; opcional, se puede delegar a TypeScript en compile time).

Para los hooks (`useSession`, `useAttemptTimer`, `useHint`):

- `useSession` mantiene el mismo `sessionId` entre renders.
- `useSession` genera uno nuevo al cambiar de pestaña (verificable con test e2e).
- `useAttemptTimer` mide correctamente: `start`, `stop`, `elapsedMs > 0` después de `setTimeout(100)`.
- `useHint` avanza de nivel 1 a 2 a 3 y bloquea en 3.

## 7. Criterios de aceptación

El modelo `PedagogyEvent` se considera "implementado" cuando:

- [ ] `src/domain/pedagogy-event/index.ts` define la union discriminada con los 10 tipos.
- [ ] `src/lib/pedagogy-event-logger.ts` implementa `append`, `readAll`, `clear` con persistencia en `localStorage`.
- [ ] `src/hooks/useSession.ts`, `useAttemptTimer.ts`, `useHint.ts` están implementados y testeados.
- [ ] `src/domain/pedagogy-event/metrics.ts` implementa las 7 métricas de la sección 5.
- [ ] `usePracticeFlow` emite los 8 eventos relevantes (`ExerciseShown`, `AnswerSubmitted`, `HintRequested`, `TheoryLinkClicked`, `ExampleLinkClicked`, `RetryStarted`, `RecoveryViewed`, `PracticeCompleted`).
- [ ] `useDiagnostic` emite `DiagnosticStarted` y `DiagnosticCompleted`.
- [ ] `pnpm run test:run` pasa con los tests nuevos.
- [ ] `pnpm run typecheck` pasa.
- [ ] `pnpm run build` pasa.
- [ ] Smoke test manual: en `NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true`, abrir un ejercicio de `valor_absoluto`, equivocarse, pedir una pista, hacer click en "Repasar teoría", volver, reintentar, acertar. Verificar que `localStorage.getItem("pre-utn.pedagogy.v1")` contiene los 6 eventos esperados en orden.
- [ ] La UI de diagnóstico muestra `errorTagFrequency` y `recoverySuccessRate` para que el alumno/docente vea sus patrones.

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| `localStorage` se llena después de N sesiones | El log se trunca silenciosamente | Implementar rotación: si `events.length > 1000`, mover los más viejos a `pre-utn.pedagogy.archive.v1` y dejar los recientes en la clave activa. |
| `timeMs` varía entre dispositivos rápidos y lentos | Métrica no comparable entre alumnos | Normalizar por `median` por skill. Comparar intra-alumno (antes/después) en lugar de inter-alumno. |
| El alumno borra `localStorage` | Pérdida de telemetría | Documentar que la decisión es local-first. Plan de migración a Supabase en el backlog (H-20). |
| `sessionId` cambia entre pestañas | Métricas fragmentadas | Usar `sessionStorage` (no `localStorage`) para el `sessionId`, así cada pestaña tiene su propio ID y se cierra con la pestaña. |
| `errorTag` libre (string) en `AnswerSubmitted` | Tags huérfanos si se borran del catálogo | Validar contra `KNOWN_ERROR_TAGS` al emitir. Si no se encuentra, emitir con `errorTag: "unknown"` y crear un test que detecte. |
| Eventos se pierden al navegar | El log no captura transiciones | Usar `useEffect` cleanup para flush. Si el logger se vuelve async, garantizar que el `await` ocurre antes del `unmount`. |
| Privacidad: el log contiene respuestas del alumno | Si se sincroniza a Supabase, hay que aclarar el consentimiento | Para piloto local está bien. Para cohorte real, agregar disclaimer en onboarding y opción de "borrar mi telemetría". |
| El modelo crece con tipos nuevos | Tests se rompen si se agrega un `kind` y no se maneja | Usar `assertNever(event)` en el switch para forzar exhaustividad. El compilador señala. |
| Performance: serializar 1000+ eventos en cada `readAll` | UI se congela | Paginación: `readAll({ offset, limit })`. Para la mayoría de las métricas, hacer `reduce` incremental al `append` y guardar el resultado precomputado. |
| `timeMs` con `performance.now()` es inexacto en SSR o tabs en background | Métrica ruidosa | Filtrar eventos con `timeMs < 100` (probable bug de timer) y `timeMs > 600_000` (10 min, probable tab abandonada). |

## 9. Privacidad

- **Local-first**: el log vive en `localStorage` del navegador del alumno. No se envía a ningún servidor en el MVP.
- **Sin PII**: el log no contiene nombre, email, IP, ni identificadores del dispositivo. Solo `sessionId` (ULID aleatorio, no trazable al alumno).
- **Borrado explícito**: agregar botón "Borrar mi progreso" en la home que llama `clearPedagogyEvents()` y borra también `PracticeProgress` y `DiagnosticResult`.
- **Consentimiento futuro**: cuando se migre a Supabase, agregar disclaimer en onboarding: "Esta app guarda tu progreso y patrones de error para que tus docentes puedan ayudarte. Podés borrar todo en cualquier momento desde la home."

## 10. Roadmap de adopción

| Slice | Qué incluye | Estimación |
|-------|--------------|------------|
| Slice 1 | Modelo de tipos + logger + tests | 1 día |
| Slice 2 | Hooks `useSession`, `useAttemptTimer`, `useHint` + tests | 1 día |
| Slice 3 | Integración en `usePracticeFlow` (emite 8 eventos) | 1 día |
| Slice 4 | Métricas en `metrics.ts` + 7 reducers + tests | 1 día |
| Slice 5 | UI: panel de "Mis patrones" en home mostrando `errorTagFrequency`, `recoverySuccessRate`, `timeOnTask` | 1 día |
| Slice 6 | Migración a Supabase (cuando se decida sync) | 1 semana |

**Total para U2**: 5 días (slices 1-5) en paralelo al slice 1 de contenido.
