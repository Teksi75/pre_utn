# 13 — ADR fundacionales

> **Status:** Aprobado  
> **Depende de:** 00-conventions.md · 10-project-structure.md

---

## ADR-001 — Una App integrada, no dos apps separadas

### Decisión

Construir una sola App de Ingreso UTN con Matemática y Física como materias internas.

### Razón

El alumno prepara un ingreso integrado. Matemática y Física comparten usuarios, calendario, progreso y dashboard.

### Consecuencia

Matemática se implementa primero, pero la arquitectura ya soporta Física.

---

## ADR-002 — Matemática primero

### Decisión

El primer MVP se enfoca en Matemática.

### Razón

Matemática se rinde primero y además es prerrequisito operativo para Física.

---

## ADR-003 — pnpm obligatorio

### Decisión

Usar pnpm en lugar de npm.

### Razón

Seguridad, reproducibilidad, instalación estricta, mejor control de dependencias.

---

## ADR-004 — Supabase como base de datos

### Decisión

Usar Supabase para Auth, PostgreSQL y Storage.

### Razón

El proyecto necesita alumnos, intentos, sesiones, fotos y panel docente.

---

## ADR-005 — Evaluador por dispatcher

### Decisión

Usar evaluadores específicos por tipo de respuesta.

### Razón

No se evalúa igual un intervalo, un complejo, una recta o una función por tramos.

---

## ADR-006 — Uso pedagógico del material canónico

### Decisión

Los cuadernillos y exámenes son fuente pedagógica válida. Los ejercicios de la App preferentemente varían valores, contexto o redacción para aportar práctica nueva; pueden repetir ejemplos o ejercicios oficiales cuando la repetición tenga intención didáctica explícita.

### Razón

Cuidado legal, pedagogía propia y posibilidad de parametrizar dificultad.

---

## ADR-007 — Enfoque pedagógico dual

### Decisión

Toda feature debe contemplar impacto en alumno y docente.

### Razón

El curso es presencial con apoyo de App. El docente necesita datos para intervenir.

---

## ADR-008 — SDD + TDD + ENGRAM + GGA

### Decisión

El desarrollo asistido por agentes se organiza con specs, tests, memoria y revisión.

### Razón

Evita deriva, deuda técnica y pérdida de intención pedagógica.

---

## ADR-009 — Bifurcacion de skills raíz en Unidad 1 (issue #62)

### Decisión

`mat.u1.conjuntos_numericos` y `mat.u1.intervalos` son ambos skills raíz declarados en paralelo. El grafo de `SKILL_DEPENDENCIES` omite intencionalmente la entrada de `intervalos` (que precede a `valor_absoluto`) y la de `conjuntos_numericos` (que precede a `propiedades_operaciones_reales`). NO existe una cadena lineal `racionalizacion → intervalos`. El catálogo bifurca U1 en dos puntos de entrada independientes.

### Razón

La bifurcación permite al alumno arrancar U1 desde cualquier rama según el tema que su profesor indique en clase. La evidencia que sostiene este diseño:

- Tests pinned en `src/domain/__tests__/accessibility.test.ts` (lineas 113 y 212) que asserts los dos roots accesibles con progreso vacío.
- Docstring de `prerequisitesFor()` en `src/domain/catalog/accessibility.ts:54-58` que ya nombra `intervalos` como root en paralelo con `conjuntos_numericos`.
- `openspec/specs/valor-absoluto-skill/spec.md:11` fija `valor_absoluto` con prerequisite `intervalos`, lectura coherente con la bifurcación.
- Fuente pedagogica canónica `utn-ingreso-app-spec/docs/pedagogy/06-skill-map.md` tampoco declara prereq para `intervalos`.

El issue #62 se reabre como intento de "bug de prerrequisito faltante" cuando en realidad es una decisión documentada. La claridad del codigo (comentario in-code + docstring expandido) es lo único que faltaba.

### Consecuencia

- `prerequisitesFor()` devuelve `[]` para cualquier skill no presente en `SKILL_DEPENDENCIES`. Esto es semántico (es root), no ausencia de datos.
- El `StatusPill` "Disponible" para un root es correcto: "disponible porque no hay prereq", NO "disponible porque se cumplio el prereq".
- Cualquier cambio de edge sobre un root requiere un ADR nuevo (numerado >= 009) y un plan de migración de progreso del alumno.

### Alternativas consideradas

- **Gatear `intervalos` detrás de `racionalizacion`** (Hypothesis B del issue #62): rechazado. Contradice los tests pinned, el docstring explícito, `valor-absoluto-skill/spec.md:11`, y la fuente canónica. Re-abre la misma pregunta ya respondida por el diseño actual.
- **Cambiar el codigo sin documentar** (silencio): rechazado. El issue existe precisamente porque el silencio no se sostuvo; cualquier cambio futuro re-abre la misma confusión.
- **Solo una caracterización test** (option B de la exploración): válido como follow-up si la recurrencia se observa, pero fuera del scope de este change. La triangulación ADR + comment + docstring es la defensa mínima viable.

---

## Criterios de aceptación

- [ ] Las decisiones se respetan en código y documentación.
- [ ] Todo cambio que contradiga un ADR debe crear un nuevo ADR.
- [ ] Los agentes citan el ADR relevante cuando implementan una feature fundacional.
