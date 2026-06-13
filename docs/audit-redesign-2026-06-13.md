# Auditoría inicial — Sprint de rediseño estético Ingenium / Pre UTN

**Fecha:** 2026-06-13
**Rama:** `feature/redesign-fase-a-b`
**Base:** `main` (working tree limpio, sin commits propios aún)
**Stack confirmado:** Next.js 16.2.7 + React 19.2.7 + TypeScript estricto + Tailwind v4 + KaTeX. Despliegue en Vercel.
**Tests runner:** Vitest 4.x.

Esta auditoría es la **Paso 1** obligatoria del spec v4. No se ha tocado
`src/app/globals.css` ni ningún otro archivo de la rama. El objetivo es
dejar registrados los hallazgos para que la Fase A1 (normalizar tokens)
arranque con ojos abiertos.

---

## 1. Tokens actuales (`src/app/globals.css`)

### Bloque `:root` (líneas 5–71)

| Categoría | Tokens | Notas |
|---|---|---|
| **Brand (stone)** | `--color-brand-50/100/200/300/400/500/600/700/800/900/950` | Base neutra cálida. Rango completo 11 stops. |
| **Accent (ámbar)** | `--color-accent-500`, `--color-accent-600` | Solo 2 stops. Resto implícito en CSS. |
| **Surfaces** | `--color-page-background` (`#f2efea`), `--color-surface` (`#fafaf9`), `--color-muted` (`#a8a29e`) | Mismo valor que `brand-50/100/500` — riesgo de tokens duplicados con nombres distintos. |
| **Tipografía** | `--font-sans`, `--text-xs..3xl`, `--leading-tight/normal/relaxed`, `--font-weight-normal/medium/semibold/bold` | Tipografía via `system-ui`. |
| **Spacing** | `--spacing-1..12` | Grid 4px. |
| **Radius** | `--radius-card` (1rem), `--radius-button` (0.75rem), `--radius-badge` (9999px) | Tres radios explícitos. |
| **Shadow** | `--shadow-card`, `--shadow-elevated` | Sombras cálidas stone-tinted. |
| **Motion** | `--duration-fast` (200ms), `--duration-normal` (300ms), `--ease-out` | Sin tokens para "lento". |
| **Focus ring** | `--ring-focus` (3px outline ámbar translúcido) | Color hardcodeado, debería ser token. |

### `@theme inline` (líneas 101–106)

```css
@theme inline {
  --color-background: var(--color-page-background);
  --color-foreground: var(--color-brand-900);
  --font-sans: var(--font-sans);
  --font-mono: ui-monospace, ...;
}
```

**Qué genera utilidades Tailwind v4 automáticamente:**
- Cualquier `--color-*` declarado en `:root` (incluyendo `--color-brand-950` y
  `--color-accent-500`) se promueve a utility classes como `bg-brand-900`,
  `text-accent-500`, `border-brand-300`, etc.
- `--font-sans` y `--font-mono` quedan como `font-sans` / `font-mono`.
- El resto (`--text-*`, `--leading-*`, `--spacing-*`, `--radius-*`, `--shadow-*`,
  `--duration-*`, `--ease-out`, `--ring-focus`, `--font-weight-*`) son **solo
  CSS variables** — no generan utilities. Hay que consumirlas con
  `var(--token)` o `text-[var(--text-2xl)]`.

### Clases utilitarias propias (líneas 73–99)

- `.app-watermark` — `pointer-events:none; user-select:none; z-index:0`.
- `.app-glass-surface`, `.app-glass-surface-strong`, `.app-glass-accent` —
  tarjetas con backdrop-blur y bordes translúcidos.

### Otros bloques

- `body` aplica `var(--color-page-background)`, `var(--color-brand-900)`,
  `var(--font-sans)`, antialiasing y `font-optical-sizing: auto`.
- `*:focus-visible` aplica `box-shadow: var(--ring-focus)` y `outline: none`.
- `.skip-link` posiciona absoluto y entra con `:focus`.
- View transitions (`vt-fade-in/out`, `vt-slide-up/down`, `vt-nav-forward/back`).
- `prefers-reduced-motion` ya está implementado y anula animaciones a
  `0.01ms` globalmente.

---

## 2. Pills / badges inline

Detalle completo en el grep correspondiente. Resumen de patrones encontrados:

### Migrables a `StatusPill` (estado semántico)

| Archivo | Estado mostrado | Migrar |
|---|---|---|
| `src/components/home/teacher-home/MathRoutePanel.tsx:42–53` | "Dominada" / "En progreso" / "Sin empezar" | ✅ sí (fase B4) |
| `src/components/practice/FocusSelector.tsx:212–224` | "Disponible" / "Bloqueada" / "Próximamente" | ✅ sí (fase D2) |
| `src/components/home/StudyPlanCard.tsx:148, 154, 174` | badges de masteria + "Habilidad nueva" / errores | ⚠️ revisar si compite |
| `src/components/diagnostic/ResultsDisplay.tsx:94, 99` | porcentaje de acierto / errores | ⚠️ revisar si compite |
| `src/components/exercises/SubmittedAnswerDisplay.tsx:37, 41` | acierto / fallo de respuesta enviada | ⚠️ revisar si compite |

### No migrables (no son "estados semánticos")

| Archivo | Uso | Notas |
|---|---|---|
| `src/components/diagnostic/DiagnosticQuestion.tsx:30` | pill decorativo de pregunta (no estado) | Mantener — no es semántico. |
| `src/components/ui/PhaseBadge.tsx:19` | "Fase X de N" | Mantener — es contador. |
| `src/components/practice/PracticeExercisePhase.tsx:72, 100` | "Ejercicio X de N" / "Ejercicio anterior" | Mantener — son contadores. |
| `src/components/practice/ExerciseCard.tsx:18, 21` | etiqueta decorativa de fase | Mantener. |
| `src/components/practice/TheoryCard.tsx:47`, `WorkedExampleCard.tsx:23, 49` | etiquetas de sección | Mantener. |
| `src/components/practice/PracticeFeedbackPhase.tsx:127, 155` | mismas etiquetas decorativas | Mantener. |
| `src/components/practice/PracticeRecoveryPhase.tsx` (revisar) | pendientes de leer en fase C/D | TBD. |
| `src/components/Nav.tsx:41` | chip de alumno activo (identidad, no estado) | Mantener. |
| `src/app/learn/matematica/[skillId]/page.tsx:45` | etiqueta de unidad | Mantener. |
| `src/app/diagnostic/page.tsx:200` | spinner | Mantener. |
| `src/app/practice/page.tsx:304` | ícono de check de "completado" | Mantener. |
| `src/components/home/SkillRoadmap.tsx:45` | bullet de roadmap (3px) | Mantener. |

**Conclusión:** los `StatusPill` cubren los casos de B4 y D2; el resto
queda fuera del scope A1 (no se tocarán).

---

## 3. Watermarks (`MathWatermark`)

Inventario completo:

| Archivo | Variante | Opacity | Decisión sprint |
|---|---|---|---|
| `src/app/page.tsx` (en realidad vía `HomeNextStepClient.tsx:133`) | `background` | default (0.45) | Mantener (aporta identidad en home). No tocar. |
| `src/app/diagnostic/page.tsx:276` | `hero` | default (0.40) | **Fase C1: remover wrapper** en pantalla de pregunta. |
| `src/app/diagnostic/ResultsDisplay.tsx:64` | `hero` | 0.15 | Mantener (pantalla de resultados, no es resolución). |
| `src/app/learn/page.tsx:8` | `background` | default | Mantener. |
| `src/app/learn/matematica/page.tsx:27` | `background` | default | Mantener. |
| `src/app/learn/matematica/[skillId]/page.tsx:33` | `background` | default | Mantener. |
| `src/components/practice/PracticeTheoryPhase.tsx:32` | `background` | 0.18 | Mantener. |
| `src/components/practice/PracticeExamplePhase.tsx:33` | `background` | 0.18 | Mantener. |
| `src/components/practice/PracticeExercisePhase.tsx:64` | `card` | 0.12 | **Fase D3: eliminar o reducir.** |
| `src/components/practice/PracticeFeedbackPhase.tsx:119` | `card` | 0.12 | **Fase D3: revisar — depende de si se considera "resolución".** |
| `src/components/practice/PracticeRecoveryPhase.tsx:40` | `background` | 0.18 | Mantener (recuperación, no resolución pura). |

### Riesgo detectado — test de caracterización

`src/components/practice/__tests__/practice-watermark.test.ts` exige que
`PracticeExercisePhase` y `PracticeFeedbackPhase`:

1. Importen `MathWatermark` desde `@/components/math-visuals/MathWatermark`.
2. Declaren prop `skillId`.
3. Rendericen `<MathWatermark skillId={skillId} variant="card" opacity={0.12} />`.

Ese test **bloquea** la fase D3. Opciones para cuando lleguemos:

- (a) Eliminar el watermark en ejercicio → actualizar el test para validar
  ausencia en `PracticeExercisePhase` y aceptar la reducción en
  `PracticeFeedbackPhase` (no es fase de "resolución" propiamente).
- (b) Mantener el watermark con opacidad casi nula → actualizar el test
  para validar la nueva opacidad.
- (c) Reemplazar `MathWatermark` por una variante silenciosa (e.g. un
  contenedor vacío) → actualizar el test.

Recomendación preliminar: **opción (a)** para `PracticeExercisePhase` (la fase
más "ruido al enunciado") y mantener (con test actualizado) `PracticeFeedbackPhase`.
Decisión a confirmar en D3, no en A1.

`src/app/__tests__/page-teacher-digital-home.test.ts` también debe leerse para
B2/B5: ya valida que `page.tsx` no importa `MathWatermark` directamente.

---

## 4. CTAs en Home

Inventario de botones/enlaces visualmente prominentes:

| Texto visible | Archivo | Línea | Estilo actual | ¿Compite con CTA principal? |
|---|---|---|---|---|
| `${hero.ctaLabel} →` (ej. "Arrancá por el diagnóstico") | `TeacherDigitalHero.tsx` | 30–35 | `bg-brand-900 text-white` (primary inline) | **Sí — este ES el candidato a CTA principal único.** |
| `Hacer diagnóstico →` | `DecisionBoardPanel.tsx` | 48–53 | `bg-brand-900 text-white` (primary inline) | ⚠️ **Duplica el estilo del hero** si ambos renderizan. |
| `Practicar →` | `DecisionBoardPanel.tsx` | 48–53 | mismo estilo | ⚠️ Mismo problema. |
| `Ver material →` | `DecisionBoardPanel.tsx` | 48–53 | mismo estilo | ⚠️ Mismo problema. |
| `Hacer diagnóstico →` | `app/page.tsx` (Zona 3) | 30–38 | `app-glass-surface` (secundario) | No, bien jerarquizado. |
| `Ir a práctica →` | `app/page.tsx` (Zona 3) | 41–49 | `app-glass-surface` | No, bien jerarquizado. |

**Problema a resolver en B2:** `DecisionBoardPanel` y `TeacherDigitalHero`
comparten la misma clase de botón. Si la view-model del hero propone
"Hacer diagnóstico" y `DecisionBoardPanel` también lo propone con la misma
estética, hay redundancia visual. La solución prevista en el spec es bajar
la jerarquía del `DecisionBoardPanel` a `secondary` o `ghost` y dejar el
hero como único `primary`.

**Otros enlaces** (no compiten por ser CTA, pero hay que ver si heredan
estilo del glass): `Cambiar alumno` (en `HomeNextStepClient:143–149`),
`<Nav>` items, "← Volver" en páginas internas.

---

## 5. Scripts reales (`package.json`)

| Script | Definido | Notas |
|---|---|---|
| `pnpm run dev` | ✅ | `next dev` |
| `pnpm run build` | ✅ | `next build` |
| `pnpm run start` | ✅ | `next start` |
| `pnpm run test` | ✅ | `vitest` (watch) |
| `pnpm run test:run` | ✅ | `vitest run` |
| `pnpm run test:coverage` | ✅ | `vitest run --coverage` |
| `pnpm run typecheck` | ✅ | `tsc --noEmit` |
| `pnpm run audit:branches` | ✅ | `bash scripts/audit-branches.sh` |
| `pnpm run lint` | ❌ | **No ejecutar.** No existe. |
| `pnpm run test:visual` | ❌ | **No ejecutar.** No existe. |
| `pnpm run lighthouse` | ❌ | **No ejecutar.** No existe. |

El spec dice "no ejecutar scripts inexistentes": cumplido. La verificación
oficial es `typecheck` + `test:run` + (opcional) `build`.

---

## 6. Tailwind v4

- **Versión:** `tailwindcss@^4` (dev) + `@tailwindcss/postcss@^4` (dev).
- **`tailwind.config.ts`:** no existe. Solo `postcss.config.mjs` (revisar
  contenido si hace falta).
- **Convención actual de clases en el repo — es mixta y es el problema
  central de A1:**

  | Patrón | Ejemplo | Notas |
  |---|---|---|
  | Utilidad Tailwind pura | `text-brand-900`, `bg-amber-50`, `text-red-700` | Funciona porque los tokens viven en `:root` y Tailwind v4 los autoexpone. **Riesgo:** si renombramos un token, se rompe en silencio. |
  | Utility con `var()` arbitrario | `text-[var(--color-brand-700)]`, `bg-[var(--color-page-background)]` | Más explícito, no depende del auto-discovery. **Riesgo:** el motor de Tailwind no valida el contenido. |
  | Mixto | `text-brand-700 bg-[var(--color-brand-100)]` | Conviven. Ya hay casos reales. |

- **Clases especiales que requieren validación:**

  - `bg-accent-500/10` (`FocusSelector.tsx:192`): opacidad sobre utility
    `bg-accent-500`. Tailwind v4 soporta `<color>/<alpha>` para colores
    con formato de canal separado, pero **sólo** si la utility se genera
    desde `@theme`. Hoy `--color-accent-500` está en `:root`; v4 lo
    detecta y debería generar la utility, pero **no he confirmado** que
    el alpha funcione sin un `<alpha-value>` explícito. **Riesgo
    documentado para A1**: al normalizar tokens vamos a tener que
    definir `--color-accent-500` con canal alpha válido o documentar la
    excepción.
  - `text-accent-600`, `text-accent-700`, `bg-accent-50`, `hover:bg-accent-50`
    (`learn/matematica/page.tsx:78`): mismo riesgo.
  - `text-amber-600`, `bg-amber-50`, etc.: usan la paleta por defecto
    de Tailwind (`amber`), no nuestros tokens. Hay una mezcla: a veces
    usamos tokens (`brand-*`, `accent-*`) y a veces la paleta raw de
    Tailwind (`amber-*`, `green-*`, `red-*`). **Decisión a tomar en A1.**

- **Sin `tailwind.config.ts`:** correcto. No crear.

---

## 7. Riesgos detectados

| # | Riesgo | Severidad | Fase que lo mitiga |
|---|---|---|---|
| 1 | `bg-accent-500/10` puede no generar CSS si Tailwind v4 no detecta alpha en el token | Media | A1 (validar con build) |
| 2 | Mezcla entre tokens propios (`brand-*`, `accent-*`) y paleta raw de Tailwind (`amber-*`, `green-*`, `red-*`) | Media | A1 + A3 |
| 3 | Tests de caracterización de `MathWatermark` van a romperse cuando D3 lo elimine | Media | D3 (actualizar `practice-watermark.test.ts`) |
| 4 | `DecisionBoardPanel` duplica el estilo `primary` del hero | Alta (B2) | B2 |
| 5 | `MathWatermark` en pregunta de diagnóstico distrae | Alta (C1) | C1 |
| 6 | Barra de progreso muestra "0%" en primera pregunta | Media | C2 |
| 7 | `MathRoutePanel` y `FocusSelector` definen pills inline con hex raw (`bg-green-50`, `bg-amber-100`, etc.) | Media | A1 (semantic tokens) + A2 (StatusPill) |
| 8 | `--color-page-background` y `--color-brand-50/100/200` comparten valores similares — riesgo de tokens duplicados con nombres distintos | Baja | A1 |
| 9 | `--color-accent-500` y `--color-accent-600` son los únicos stops; las utilities `bg-accent-50/100/200/300/400` no existen | Media | A1 (decidir: ampliar paleta accent o documentar que solo se usan 500/600) |
| 10 | `prefers-reduced-motion` ya implementado; no introducir regresiones | Baja | F1 |
| 11 | `<button>` con `text-brand-600 ... underline` (`HomeNextStepClient.tsx:144–148`) — "Cambiar alumno" no tiene `focus-visible` ni target 44px explícito | Baja | B1 (greeting rework, copiar patrón) |
| 12 | `FocusSelector` selecciona skill con `bg-accent-500/10` — si alpha no funciona, la selección visual cae | Media | D1/D2 |
| 13 | `PracticeExercisePhase` envuelve TODO en `MathWatermark` card; removerlo cambia el layout | Media | D3 |
| 14 | `E1` requiere mover `<main>` a `flex-1` dentro de un `flex flex-col` en `<body>` — choca con el `min-h-screen` actual | Baja | E1 |
| 15 | Hydration del greeting: `TeacherDigitalHero` hoy no genera fecha; B1 la va a introducir y debe cuidarse | Baja | B1 |

---

## 8. Convención de tokens — propuesta para A1 (a confirmar antes de tocar)

> Esta convención **se discute y se aprueba antes de escribir código**.
> La idea es terminar A1 con una sola fuente de verdad y un acuerdo
> explícito sobre cuándo usar cada forma.

### 8.1 Tipos de tokens

| Categoría | Convención | Ejemplo |
|---|---|---|
| Color semántico de marca | `--color-brand-{n}` (stone) y `--color-accent-{n}` (ámbar) en `:root` | `--color-brand-900`, `--color-accent-500` |
| Color semántico de estado | Nuevos `--color-status-{name}` (semántico, no escala numérica) | `--color-status-available`, `--color-status-locked`, `--color-status-weak`, `--color-status-success` |
| Surface / background | `--color-page-background`, `--color-surface`, `--color-elevated` (alias semánticos) | `--color-page-background` |
| Tipografía | Mantener `--text-*`, `--leading-*`, `--font-weight-*` | `--text-2xl` |
| Spacing | Mantener `--spacing-1..12` (4px grid) | `--spacing-4` |
| Radius | Mantener `--radius-card|button|badge` | `--radius-badge` |
| Shadow | Mantener `--shadow-card|elevated` | `--shadow-card` |
| Motion | Mantener `--duration-fast|normal`, `--ease-out` | `--duration-normal` |
| Focus ring | Mantener `--ring-focus` | `--ring-focus` |

### 8.2 Cuándo usar cada forma de clase (convención de consumo)

Reglas claras, sin ambigüedad:

1. **Colores de marca (stone / accent)** — usar utility Tailwind generada
   por el token:
   - `bg-brand-900`, `text-brand-700`, `border-brand-200`, `bg-accent-500`,
     `text-accent-600`, `bg-accent-50`, `hover:bg-accent-50`, etc.
   - Permitido `text-accent-500/10` o `bg-accent-500/10` solo cuando
     la utility existe y funciona (validar con `pnpm run build`).
2. **Colores de estado semántico** — usar utility Tailwind generada por
   `--color-status-*`:
   - `bg-status-available`, `text-status-locked`, `border-status-weak`, etc.
   - **No** hex crudo en componentes. **No** `bg-green-50`, `text-red-700`
     para "estado completado / error" — usar `bg-status-success`,
     `text-status-weak` (o la utility equivalente).
3. **Tokens no expuestos a Tailwind** (radio, shadow, spacing, font,
   duration, ring focus) — usar `var()`:
   - `rounded-[var(--radius-card)]`, `shadow-[var(--shadow-card)]`,
     `focus-visible:shadow-[var(--ring-focus)]`, `duration-[var(--duration-fast)]`.
4. **Excepciones permitidas** (deben documentarse en el PR):
   - `text-[var(--color-brand-700)]` cuando la utility no funcione
     por alguna razón específica (a documentar).
   - **Prohibido** inventar valores hex en componentes.

### 8.3 Acciones concretas de A1

Si esta convención se aprueba, A1 queda así:

1. Renombrar/limpiar duplicados en `:root`:
   - Eliminar `--color-brand-50` (duplica a `--color-brand-100`).
   - Eliminar `--color-muted` (usar `--color-brand-500` directamente).
   - Mantener `--color-page-background` y `--color-surface` como alias
     semánticos (no son duplicados, son nombres de rol).
2. Ampliar la paleta accent a 5 stops (50, 100, 200, 500, 600, 700)
   para soportar las utilities existentes y futuras. Decidir si
   reutilizamos valores de la paleta `amber` por defecto o creamos
   nuestros. **Mi recomendación:** crear nuestros, partiendo del
   actual `--color-accent-500` (#f59e0b) y derivando 50/100/200/700.
3. Agregar tokens semánticos de estado en `:root`:
   - `--color-status-available: #16a34a` (verde para "disponible / dominada").
   - `--color-status-locked: #d97706` (ámbar oscuro para "bloqueada / pendiente").
   - `--color-status-weak: #dc2626` (rojo para "necesita refuerzo / error").
   - `--color-status-success: #16a34a` (alias de `available` cuando el
     énfasis es "logro" en vez de "disponibilidad"). Si nos parece
     redundante, colapsar a uno solo.
   - Y exponer también backgrounds suaves para cada uno (status-available-soft,
     status-locked-soft, status-weak-soft) para `bg-*` translúcidos.
4. **No tocar** `@theme inline` (sigue correcto).
5. **No crear** `tailwind.config.ts`.
6. Verificar con `pnpm run typecheck` y `pnpm run build` que las
   utilities generadas siguen disponibles.

### 8.4 Política de cambio mínimo

- No renombrar `--color-brand-*` ni `--color-accent-*` (rompería
  silenciosamente todas las utilities existentes en componentes).
- Solo agregar tokens nuevos y eliminar duplicados con valor idéntico
  a otro token (ej. `--color-brand-50`).
- Si un componente depende de un token a punto de renombrarse, seguir
  el protocolo de mitigación del spec (1 commit atómico por archivo
  cuando hay <5 usos, commits por grupo cuando ≥5).

---

## 9. Archivos probablemente a tocar (resumen)

Siguiendo la lista de archivos a revisar del spec y lo relevado:

- **Auditoría (este doc):** `docs/audit-redesign-2026-06-13.md`.
- **Fase A1:** `src/app/globals.css` + este doc (agregar §8.3 firmada).
- **Fase A2:** `src/components/ui/StatusPill.tsx` (nuevo).
- **Fase A3:** `src/components/ui/Card.tsx`, `src/components/ui/Button.tsx` (mínimo).
- **Fase B1:** `HomeNextStepClient.tsx`, `TeacherDigitalHero.tsx` (greeting + fecha).
- **Fase B2:** `app/page.tsx`, `DecisionBoardPanel.tsx` (jerarquía de CTAs).
- **Fase B3:** `TeacherDigitalHero.tsx` (identidad profe digital).
- **Fase B4:** `MathRoutePanel.tsx` (StatusPill).
- **Fase B5:** `app/page.tsx` (acciones rápidas, peso secundario).
- **Fase B6:** `StudentSituationPanel.tsx` (revisar y solo si compite).
- **Fase C1:** `app/diagnostic/page.tsx` (quitar watermark en pregunta).
- **Fase C2:** `app/diagnostic/page.tsx` (progress bar 0% y aria).
- **Fase C3:** `app/diagnostic/page.tsx` + `DiagnosticQuestion.tsx` (un solo contador).
- **Fase D1:** `app/practice/page.tsx`, `FocusSelector.tsx` (selector nativo).
- **Fase D2:** `FocusSelector.tsx` (StatusPill).
- **Fase D3:** `PracticeExercisePhase.tsx` (reducir/eliminar watermark) + actualizar `practice-watermark.test.ts`.
- **Fase D4:** `ExerciseAnswerInput.tsx` (selección visual).
- **Fase E1:** `app/layout.tsx` (footer sticky).
- **Fase E2:** `Nav.tsx` (mobile-safe).
- **Fase F1/F2:** transversal, sin archivo nuevo; auditoría de motion y focus.

---

## 10. Próximos pasos propuestos

1. **Aprobación de esta auditoría** (firma de Pablo) — bloqueante.
2. **Aprobación de la convención §8** — bloqueante para A1.
3. Aplicación de A1: cambios en `:root` + `@theme inline` (probablemente
   ninguno) + verificación con `pnpm run typecheck`, `pnpm run test:run`,
   `pnpm run build`.
4. Commit atómico con mensaje tipo
   `chore(tokens): normalize status semantic tokens (A1)`.
5. Reporte al usuario (este documento) + diff resumido.

---

*Fin de la auditoría. Esperando OK antes de tocar `globals.css`.*
