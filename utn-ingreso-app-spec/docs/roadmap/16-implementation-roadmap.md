# 16 — Roadmap de implementación

> **Status:** Propuesto  
> **Depende de:** 02-mvp-scope.md · 10-project-structure.md · 14-agent-workflow-sdd-tdd-engram-gga.md

---

## Sprint 0 — Inicialización técnica

Objetivo: crear base del proyecto.

Tareas:

- crear repo o rama nueva;
- configurar Next.js + TypeScript + Tailwind;
- configurar pnpm;
- configurar Vitest;
- configurar Supabase env;
- crear estructura `src/domain`, `content`, `docs`, `supabase`;
- agregar docs de esta carpeta.

Aceptación:

- [ ] `pnpm install` funciona.
- [ ] `pnpm run dev` levanta.
- [ ] `pnpm run test` corre.
- [ ] `pnpm run build` pasa.

---

## Sprint 1 — Dominio matemático base

Objetivo: construir skills, tipos y evaluador.

Tareas:

- implementar skill map;
- implementar tipos de ejercicio;
- implementar dispatcher;
- implementar evaluadores básicos: multiple_choice, numeric, rational, complex;
- tests unitarios.

Aceptación:

- [ ] Evaluadores puros.
- [ ] Tests por tipo.
- [ ] Sin imports de framework en domain.

---

## Sprint 2 — Evaluadores avanzados

Objetivo: cubrir problemas de examen.

Tareas:

- interval;
- equation_solution_set;
- line_equation;
- function_analysis;
- errorTags.

Aceptación:

- [ ] Simulacro puede corregir al menos 8/10 tipos.
- [ ] Function analysis soporta crédito parcial.

---

## Sprint 3 — Persistencia y sesiones

Objetivo: registrar alumnos, sesiones e intentos.

Tareas:

- Supabase schema;
- students;
- sessions;
- attempts;
- API submit attempt;
- API start session.

Aceptación:

- [ ] Intento queda persistido.
- [ ] Respuesta se guarda como JSONB.
- [ ] No hay service role en cliente.

---

## Sprint 4 — UI alumno MVP

Objetivo: alumno puede practicar.

Tareas:

- dashboard alumno;
- diagnóstico;
- práctica por unidad;
- feedback;
- progreso básico.

Aceptación:

- [ ] Alumno completa sesión.
- [ ] Ve feedback.
- [ ] Ve progreso.

---

## Sprint 5 — Métricas y recomendaciones

Objetivo: cerrar loop adaptativo.

Tareas:

- calcular métricas;
- motor de recomendación;
- revisión de errores;
- repaso inteligente.

Aceptación:

- [ ] Recomendación tiene reason.
- [ ] Errores frecuentes visibles.

---

## Sprint 6 — Simulacro y panel docente

Objetivo: versión usable en curso.

Tareas:

- simulacro de 10 ejercicios;
- timer;
- reporte final;
- dashboard docente;
- lista de alumnos;
- detalle de intentos.

Aceptación:

- [ ] Simulacro sin feedback hasta finalizar.
- [ ] Docente ve desempeño.

---

## Sprint 7 — Contenido y ajuste pedagógico

Objetivo: mejorar calidad del banco.

Tareas:

- cargar U1-U3 completas;
- cargar exam-style;
- revisar distractores;
- ajustar feedback;
- revisar dashboard con docente real.

Aceptación:

- [ ] Banco mínimo operativo.
- [ ] Feedback útil.
- [ ] Dashboard accionable.

---

## Post-MVP — Física

Objetivo: replicar arquitectura para Física.

Tareas:

- content map Física;
- skill map Física;
- tipos de ejercicios físicos;
- evaluador físico-numérico;
- unidades, magnitudes, vectores, cinemática, dinámica, estática, energía.

Aceptación:

- [ ] Física usa shared students/sessions/attempts/metrics.
- [ ] No duplica infraestructura.
