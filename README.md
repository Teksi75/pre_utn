# Ingenium App

App educativa de apoyo para estudiantes que preparan el ingreso a Ingeniería.

El proyecto nació como una aplicación para acompañar el preingreso a Ingeniería UTN Mendoza. La dirección actual es evolucionar hacia una plataforma multi-institución, con rutas curriculares diferenciadas por institución, manteniendo una sola App, un solo repositorio y una base pedagógica común.

La App complementa las clases presenciales con práctica guiada, feedback, seguimiento del progreso y herramientas de observabilidad docente. No reemplaza al docente: organiza la práctica, registra trayectorias y ayuda a detectar a tiempo dónde necesita intervención cada alumno.

App publicada: https://pre-utn.vercel.app/

---

## Estado del proyecto

Matemática es el módulo activo principal.

| Área | Estado |
|---|---|
| Matemática UTN — Unidades 1, 2 y 3 | Transitable |
| Matemática UTN — Unidades 4, 5 y 6 | Roadmap / cierre MVP |
| Observabilidad pedagógica | En curso |
| Modo docente v0 | En curso |
| Física | Roadmap |
| Multi-track UTN/UNCuyo | Roadmap estratégico |
| UNCuyo Matemática | Planificado |

El estado actual del MVP cubre Matemática UTN en sus primeras tres unidades. Las Unidades 4, 5 y 6 existen en el mapa general de skills, pero todavía no forman un recorrido completo para el alumno. Ver detalle actual en el contenido, specs y catálogo del repo.

---

## Premisa estratégica

| Premisa | Qué significa |
|---|---|
| Una sola App | No se crearán apps separadas para UTN y UNCuyo. |
| Una sola base de código | El contenido común debe reutilizarse. |
| Rutas internas por institución | Cada institución puede tener orden, énfasis y simulacros propios. |
| UTN Matemática primero | La ruta activa inicial sigue siendo Matemática UTN Mendoza. |
| Observabilidad temprana | Antes de escalar contenido, se necesita ver el avance real de los alumnos. |
| Multi-track sin big-bang | La arquitectura multi-institución se incorporará por PRs pequeños y encadenados. |

---

## Roadmap resumido

### M0 — Gobernanza del roadmap

Estado: cerrado.

Objetivo: ordenar la forma profesional de trabajo mediante roadmap, milestones, issues, branches, PRs, tests y criterios de aceptación.

### M1 — Observabilidad pedagógica v0

Estado: en curso.  
Prioridad: máxima.

Objetivo: que el docente pueda ver qué están haciendo los alumnos reales y dónde necesitan ayuda.

Incluye:

- intentos asociados a estudiante;
- eliminación de intentos anónimos;
- modelo persistible de progreso;
- fallback local/remoto;
- preparación para Supabase;
- `/docente` v0;
- actividad reciente;
- porcentaje de acierto;
- skills débiles;
- diagnóstico realizado o pendiente.

### M2 — Matemática UTN cierre MVP

Estado: pendiente.  
Prioridad: alta.

Objetivo: completar el recorrido transitable de Matemática UTN.

Incluye:

- Unidad 4: Geometría y medida;
- Unidad 5: Trigonometría;
- Unidad 6: Funciones;
- QA pedagógico;
- readiness honesto;
- validación humana.

### M3 — Simulacro UTN Matemática

Estado: pendiente.  
Prioridad: alta.

Objetivo: crear práctica integradora tipo examen, alineada con el formato real del ingreso.

### M4 — Física común UTN/UNCuyo

Estado: pendiente.  
Prioridad: media-alta.

Objetivo: diseñar el mapa de skills de Física y comenzar una primera ruta común.

### M5 — Preparación multi-track

Estado: pendiente.  
Prioridad: estratégica.

Objetivo: desacoplar skills de unidades institucionales rígidas.

La misma skill debe poder aparecer en distinta unidad según la institución.

Ejemplo conceptual:

```text
Skill común: valor absoluto

UTN Mendoza:
Unidad 1

UNCuyo:
Unidad definida por su propio programa
```

### M6 — UNCuyo Matemática

Estado: pendiente.  
Prioridad: media diferida.

Objetivo: activar la ruta institucional UNCuyo una vez que el modelo multi-track esté preparado.

---

## Orden de ejecución recomendado

Prioridad inmediata:

1. Cerrar M1 — observabilidad pedagógica v0.
2. Avanzar M2 — cierre Matemática UTN U4–U6 sin esperar multi-track.
3. Diseñar M4 — Física común.
4. Preparar M5 — multi-track por PRs encadenados.
5. Activar M6 — UNCuyo Matemática.

Regla de trabajo:

> No más de tres issues activos al mismo tiempo.

---

## Unidad profesional de cambio

El proyecto se organiza así:

```text
Roadmap → Milestone → Issue → Branch → Pull Request → Tests → Criterios de aceptación
```

| Capa | Pregunta que responde |
|---|---|
| Roadmap | ¿Hacia dónde va el producto? |
| Milestone | ¿Qué objetivo verificable estamos cerrando? |
| Issue | ¿Qué trabajo concreto resuelve ese objetivo? |
| Branch | ¿Dónde trabajo sin tocar `main`? |
| Pull Request | ¿Cómo reviso el cambio en una pieza entendible? |
| Tests | ¿Cómo sé que no rompí nada? |
| Criterios de aceptación | ¿Qué significa “terminado”? |

Regla:

> Si un PR no se puede explicar en pocos párrafos, es demasiado grande.

---

## Fuente de verdad

Este README es una puerta de entrada. No reemplaza a la documentación estratégica, al material canónico, a las specs ni al código.

| Tema | Fuente |
|---|---|
| Reglas obligatorias del repo | `AGENTS.md` |
| Roadmap humano | `docs/strategy/roadmap-ingenium-humano.md` |
| Roadmap estratégico | `docs/strategy/roadmap-estrategico-ingenium.md` |
| Guía para agentes IA | `docs/strategy/roadmap-ingenium-agentico.md` |
| Estado SDD portable | `openspec/changes/STATUS.json` |
| Cambios SDD activos | `openspec/changes/` |
| Material canónico | `material_canonico/` |
| Mapas pedagógicos | `utn-ingreso-app-spec/docs/pedagogy/` |
| Contenido cargado | `content/` |
| Catálogo y readiness | `src/domain/catalog/` |
| Dominio puro | `src/domain/` |
| Scripts reales | `package.json` |

---

## Reglas principales

- No implementar features sin spec.
- No escribir código sin criterios de aceptación.
- No cerrar una tarea solo porque pasan tests técnicos.
- No listar una skill como transitable hasta que tenga teoría, ejemplo, práctica, feedback y readiness real.
- No medir progreso pedagógico solo por cantidad de ejercicios.
- No duplicar apps para cada institución.
- No hacer big-bang multi-track.
- No mezclar contenido, infraestructura, refactor y rediseño visual en la misma branch.
- No bloquear la urgencia pedagógica con refactors preventivos.
- No usar copy de “profe digital”: la App es apoyo; la enseñanza ocurre en clase.

---

## Branches

Convenciones sugeridas:

| Prefijo | Uso | Ejemplo |
|---|---|---|
| `docs/` | Documentación | `docs/roadmap-strategy` |
| `design/` | Diseño técnico o pedagógico | `design/teacher-observability-v0` |
| `feat/` | Funcionalidad nueva | `feat/teacher-dashboard-v0` |
| `fix/` | Corrección | `fix/challenge-attempt-student-id` |
| `refactor/` | Reorganización sin cambio visible | `refactor/home-track-derived-units` |
| `content/` | Contenido educativo | `content/math-unit-4-geometry` |
| `qa/` | Validación | `qa/math-utn-mvp-review` |

Regla:

> Una branch = un issue = una preocupación principal.

---

## Pull Requests

Un PR debe ser revisable y acotado.

Reglas:

- idealmente hasta 400 líneas modificadas;
- si excede, partir en PRs encadenados;
- explicar qué cambia;
- explicar qué no cambia;
- vincular issue;
- listar tests ejecutados;
- declarar riesgos;
- incluir validación pedagógica cuando toque contenido.

Template mínimo:

```md
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
- pnpm test:e2e si aplica

## Validación pedagógica

- Contenido, feedback y secuencia revisados si corresponde.

## Riesgos

- Aspectos que requieren seguimiento.
```

---

## TDD y validación

TDD estricto aplica a:

- `src/domain/`;
- evaluadores;
- métricas;
- progreso;
- diagnóstico;
- recomendaciones;
- view-models;
- funciones puras que calculan readiness, intentos o progreso.

Ciclo:

```text
RED → GREEN → REFACTOR
```

No requieren TDD estricto:

- documentación;
- contenido educativo;
- estilos;
- componentes presentacionales puros sin lógica de dominio.

La validación técnica no reemplaza la validación pedagógica.

Que `build`, `typecheck` y tests pasen significa que el sistema no se rompe técnicamente. No significa que el contenido sea suficiente, que la secuencia sea pedagógicamente correcta ni que la experiencia sea satisfactoria para un alumno.

---

## Comandos de desarrollo

Instalar dependencias:

```bash
pnpm install
```

Servidor local:

```bash
pnpm dev
```

Abrir:

```text
http://localhost:3000
```

Tests:

```bash
pnpm run test
pnpm run test:run
```

Typecheck:

```bash
pnpm run typecheck
```

Build:

```bash
pnpm run build
```

E2E:

```bash
pnpm test:e2e:install
pnpm test:e2e
```

Auditoría de branches:

```bash
pnpm run audit:branches
```

---

## Modo QA de contenido

Para revisar una skill sin completar prerrequisitos:

```bash
NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true pnpm dev
```

En PowerShell:

```powershell
$env:NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE="true"; pnpm dev
```

También se puede configurar en `.env.local`:

```env
NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true
```

Ejemplo:

```text
http://localhost:3000/practice?skill=mat.u1.valor_absoluto
```

Este modo es solo para QA/contenido. No desbloquea skills desconocidas o sin readiness.

---

## Arquitectura

### Dominio puro

`src/domain/` debe permanecer libre de dependencias de UI e infraestructura.

No debe importar:

- React;
- Next.js;
- Supabase;
- APIs del navegador;
- localStorage directo.

Debe contener:

- lógica pura;
- tipos;
- contratos;
- reducers;
- funciones determinísticas.

---

## Persistencia y observabilidad

La persistencia debe permitir:

- fallback local;
- futuro adapter remoto;
- preparación para Supabase;
- compatibilidad con datos existentes;
- separación entre dominio e infraestructura.

Todo intento debe estar asociado a:

- `studentId`;
- `subjectId`;
- `skillId`;
- `trackId` cuando aplique;
- fecha/hora;
- resultado;
- error tag si corresponde.

`/docente` v0 debe responder:

> ¿Qué está haciendo cada alumno y dónde necesita ayuda?

No corresponde a `/docente` v0:

- editor de contenidos;
- reportes PDF;
- mensajería;
- administración compleja;
- analíticas avanzadas;
- multi-institución visible.

---

## Contenido educativo

Una skill solo puede declararse transitable si tiene:

- teoría;
- ejemplo;
- práctica;
- feedback;
- conexión clara con material canónico;
- readiness honesto;
- validación pedagógica humana.

No marcar como lista una skill solo porque existen ejercicios sueltos.

---

## Multi-track

El modelo multi-track debe permitir rutas institucionales sin duplicar la App.

Criterios mínimos:

- track default UTN Mendoza Matemática;
- home derivado desde track activa;
- skills reutilizables;
- unidades institucionales diferenciadas;
- contenido común compartido;
- contenido específico solo cuando esté justificado;
- tests que prueben que una misma skill puede aparecer en distinta unidad según track.

No implementar UNCuyo duplicando Matemática UTN en una carpeta paralela.

---

## No hacer todavía

- No reescribir todos los `SkillId` de una sola vez.
- No implementar multi-track como mega-cambio.
- No unificar intentos de diagnóstico y práctica sin necesidad de producto.
- No partir `usePracticeFlow` si no aporta valor pedagógico inmediato.
- No reescribir componentes por limpieza si no desbloquean M1, M2 o M5.
- No crear una app separada para UNCuyo.
- No activar selector institucional sin modelo de tracks.

---

## Principio final

La App debe crecer sin perder criterio pedagógico.

El objetivo no es cubrir temas más rápido. El objetivo es acompañar mejor a cada alumno, hacer visible su trayectoria, intervenir a tiempo y sostener recorridos institucionales distintos sobre una base técnica y pedagógica común.
