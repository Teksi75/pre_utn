# UTN Ingreso App — Índice maestro de especificación

> **Proyecto:** App de preparación para el ingreso a Ingeniería UTN Mendoza  
> **MVP:** Matemática primero; Física preparada para segunda etapa  
> **Stack:** Next.js · TypeScript · Supabase · Vercel · pnpm  
> **Metodología:** SDD · TDD · ENGRAM · GGA · Gentle-AI/OpenCode/Codex

Este directorio `/docs/` es la **columna vertebral de especificación** para que Codex, OpenCode o cualquier agente de desarrollo pueda construir la App sin perder la intención pedagógica, técnica y de producto.

Cada archivo `.md` debe ser tratado como una **unidad de especificación**: define qué construir, qué no construir, cómo validarlo y qué criterios de aceptación cumplir.

---

## 1. Regla central

La App no es solo un banco de ejercicios. Es un **sistema de entrenamiento, maduración y seguimiento** para el ingreso a Ingeniería UTN.

Debe servir a dos usuarios principales:

1. **Alumno:** practica, recibe feedback, identifica errores y gana autonomía.
2. **Docente:** observa progreso, detecta patrones, asigna tareas y decide intervenciones.

---

## 2. Estructura documental final

```text
docs/
├── README.md
├── 00-conventions.md
│
├── product/
│   ├── 01-vision-app.md
│   ├── 02-mvp-scope.md
│   └── 03-modes-of-work.md
│
├── pedagogy/
│   ├── 04-pedagogical-model.md
│   ├── 05-math-content-map.md
│   ├── 06-skill-map.md
│   ├── 07-exercise-types.md
│   ├── 08-recommendation-engine.md
│   └── 09-metrics.md
│
├── architecture/
│   ├── 10-project-structure.md
│   ├── 11-evaluator-design.md
│   └── 12-repo-extraction-map.md
│
├── sdd/
│   ├── 13-adr-foundation.md
│   ├── 14-agent-workflow-sdd-tdd-engram-gga.md
│   └── 15-documentation-gap.md
│
└── roadmap/
    └── 16-implementation-roadmap.md
```

---

## 3. Orden de lectura para agentes

### Agente que arranca desde cero

```text
1. 00-conventions.md
2. product/01-vision-app.md
3. pedagogy/04-pedagogical-model.md
4. product/02-mvp-scope.md
5. architecture/10-project-structure.md
6. pedagogy/06-skill-map.md
7. pedagogy/07-exercise-types.md
8. architecture/11-evaluator-design.md
9. sdd/14-agent-workflow-sdd-tdd-engram-gga.md
10. roadmap/16-implementation-roadmap.md
```

### Agente que toma una feature puntual

```text
1. 00-conventions.md
2. sdd/14-agent-workflow-sdd-tdd-engram-gga.md
3. El archivo específico de la feature
4. Los archivos listados en "Depende de"
5. Implementar con TDD
6. Verificar con GGA
7. Registrar decisiones o desvíos
```

---

## 4. Dependencias documentales

```text
00-conventions
 ├── product/01-vision-app
 │    ├── product/02-mvp-scope
 │    ├── product/03-modes-of-work
 │    └── pedagogy/04-pedagogical-model
 │
 ├── pedagogy/05-math-content-map
 │    ├── pedagogy/06-skill-map
 │    ├── pedagogy/07-exercise-types
 │    ├── pedagogy/08-recommendation-engine
 │    └── pedagogy/09-metrics
 │
 ├── architecture/10-project-structure
 │    ├── architecture/11-evaluator-design
 │    └── architecture/12-repo-extraction-map
 │
 └── sdd/13-adr-foundation
      ├── sdd/14-agent-workflow-sdd-tdd-engram-gga
      └── sdd/15-documentation-gap
```

---

## 5. Criterios globales de aceptación

- [ ] La App puede desarrollar Matemática primero sin bloquear Física futura.
- [ ] Toda feature nueva se puede ubicar en producto, pedagogía, arquitectura o SDD.
- [ ] Ningún agente implementa sin spec previa.
- [ ] Ningún agente usa `npm`; todo se ejecuta con `pnpm`.
- [ ] La App usa material oficial con trazabilidad e intención pedagógica, evitando repeticiones mecánicas sin valor agregado.
- [ ] El alumno tiene feedback formativo.
- [ ] El docente tiene visibilidad pedagógica accionable.
- [ ] `pnpm run test`, `pnpm run typecheck` y `pnpm run build` pasan antes de cerrar una tarea.
