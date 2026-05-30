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

## ADR-006 — Contenido original

### Decisión

Los cuadernillos y exámenes son fuente de referencia; los ejercicios de la App son originales.

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

## Criterios de aceptación

- [ ] Las decisiones se respetan en código y documentación.
- [ ] Todo cambio que contradiga un ADR debe crear un nuevo ADR.
- [ ] Los agentes citan el ADR relevante cuando implementan una feature fundacional.
