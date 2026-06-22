# Roadmap estratégico — Ingenium App

**Persistencia, observabilidad docente, Matemática UTN, Física común y evolución multi-institución**

> **Propósito del documento**  
> Unificar criterios, decisiones y forma de trabajo para que el desarrollo avance con estructura profesional: roadmap, milestones, issues, branches, pull requests, tests y criterios de aceptación. El objetivo es sostener la urgencia pedagógica sin perder la dirección estratégica del producto.

**Versión de planificación:** junio de 2026  
**Ubicación recomendada:** `docs/strategy/roadmap-estrategico-ingenium.md`

### Documentos derivados y trazabilidad

| Documento | Ruta | Propósito |
|---|---|---|
| Guía humana | `docs/strategy/roadmap-ingenium-humano.md` | Recalibración y decisiones para el maintainer humano |
| Guía agéntica | `docs/strategy/roadmap-ingenium-agentico.md` | Operación precisa para agentes IA e implementadores |
| Auditoría de simplificación | `openspec/changes/strategic-simplification-audit/exploration.md` | Análisis de brechas y simplificación del roadmap |

> Este documento es la fuente estratégica original. Los derivados clarifican ejecución, orden y reglas para agentes.

---

## Contenido

1. [Visión y premisas estratégicas](#1-visión-y-premisas-estratégicas)
2. [Modelo profesional de trabajo](#2-modelo-profesional-de-trabajo)
3. [Roadmap por milestones](#3-roadmap-por-milestones)
4. [Backlog inicial de issues](#4-backlog-inicial-de-issues)
5. [Flujo de branches y pull requests](#5-flujo-de-branches-y-pull-requests)
6. [Estrategia de tests y validación pedagógica](#6-estrategia-de-tests-y-validación-pedagógica)
7. [Criterios de aceptación reutilizables](#7-criterios-de-aceptación-reutilizables)
8. [Tablero operativo y reglas anti-abrumo](#8-tablero-operativo-y-reglas-anti-abrumo)
9. [Aprendizaje técnico durante el desarrollo](#9-aprendizaje-técnico-durante-el-desarrollo)
10. [Fuentes internas y material canónico](#10-fuentes-internas-y-material-canónico)

---

## 1. Visión y premisas estratégicas

> **Visión del producto**  
> Construir una plataforma educativa de apoyo al ingreso a Ingeniería, con una experiencia pedagógica guiada, seguimiento docente y capacidad de adaptarse a más de una institución sin duplicar código ni contenidos comunes.

### Origen y evolución

La App nació como apoyo para estudiantes del pre de Ingeniería de UTN Mendoza. La dirección estratégica es transformarla progresivamente en una App multi-institución bajo una lógica de rutas curriculares, manteniendo una sola base de código y una sola experiencia de producto.

### Premisa pedagógica central

La App no debe ser solamente un repositorio de ejercicios. Debe permitir observar trayectorias reales, detectar errores frecuentes, orientar la intervención docente y sostener el aprendizaje entre clases presenciales.

### Premisa técnica central

Cada decisión de implementación debe resolver una necesidad inmediata sin cerrar el camino hacia la arquitectura multi-institución. Por eso los datos de progreso deben poder asociarse a alumno, materia, skill y track curricular.

### Decisiones estratégicas

- **Una sola App.** La estrategia favorece un único producto, un único repositorio y rutas internas por institución.
- **UTN Matemática como ruta activa prioritaria.** El cierre de Matemática UTN sigue siendo una prioridad de producción y validación pedagógica.
- **Observabilidad docente temprana.** La persistencia y un mini módulo docente aportan información decisiva sobre alumnos reales que ya usan la App.
- **Física como convergencia temporal.** Física puede planificarse como materia común para UTN y UNCuyo, porque ambas cohortes convergen temporalmente en ese espacio.
- **Multi-track como arquitectura futura.** La ruta institucional debe prepararse sin forzar una reescritura inmediata ni bloquear necesidades urgentes.

> **Regla de decisión**  
> No se trata de resolver toda la arquitectura futura de una vez. Se trata de que cada decisión presente no bloquee el camino futuro.

---

## 2. Modelo profesional de trabajo

El proyecto se organizará mediante una jerarquía simple:

| Elemento | Qué significa | Cuándo se usa |
|---|---|---|
| Roadmap | Mapa estratégico general del producto. | Cuando se necesita dirección, prioridades y coherencia entre decisiones. |
| Milestone | Etapa grande con un objetivo verificable. | Cuando varios issues contribuyen a un mismo resultado. |
| Issue | Unidad concreta de trabajo o decisión. | Cuando algo debe registrarse, discutirse, implementarse o cerrarse. |
| Branch | Rama de Git para trabajar sin tocar `main`. | Cuando se modifica código, contenido o documentación. |
| Pull Request | Propuesta de integrar una branch a `main`. | Cuando el cambio está listo para revisión y validación. |
| Tests | Pruebas automáticas o procedimientos de validación. | Cuando se necesita asegurar comportamiento y evitar regresiones. |
| Criterios de aceptación | Condiciones verificables para cerrar una tarea. | Antes de implementar, para definir qué significa “terminado”. |

> **Unidad profesional de cambio**  
> Issue → Branch → Commits pequeños → Tests → Pull Request → Revisión → Merge → Cierre con criterios de aceptación.

### Definición de terminado

Un cambio puede considerarse terminado cuando:

- cumple los criterios de aceptación escritos en el issue;
- pasan los tests relevantes;
- el PR explica qué cambió, qué no cambió y qué riesgos quedan;
- la validación pedagógica no queda sustituida por la validación técnica;
- el aprendizaje técnico queda registrado en el issue o en el PR cuando corresponda.

---

## 3. Roadmap por milestones

> **Estrategia temporal**  
> El proyecto debe sostener alumnos reales de Matemática UTN, preparar seguimiento docente, cerrar contenido pendiente, iniciar Física como eje común y evolucionar hacia rutas institucionales sin duplicación.

| ID | Milestone | Objetivo | Prioridad | Estado final esperado |
|---|---|---|---|---|
| M0 | Gobernanza del roadmap | Definir estructura de trabajo, tablero, criterios y reglas de priorización. | Inmediata | Documento vivo y issues base creados. |
| M1 | Observabilidad pedagógica v0 | Persistir datos mínimos y crear vista docente inicial. | Máxima | Docente puede ver actividad, avance y errores de alumnos reales. |
| M2 | Matemática UTN cierre MVP | Completar Unidades 4, 5 y 6 con readiness honesto. | Alta | Ruta UTN Matemática transitable de punta a punta. |
| M3 | Simulacro UTN Matemática | Crear práctica integradora alineada a formato de examen. | Alta | Alumno y docente pueden medir preparación global. |
| M4 | Física común UTN/UNCuyo | Definir e iniciar mapa de skills de Física. | Media-alta | Primera ruta de Física compartible. |
| M5 | Preparación multi-track | Desacoplar skill de unidad institucional. | Media | UTN se mantiene y queda base para UNCuyo. |
| M6 | UNCuyo Matemática | Activar ruta institucional específica. | Media diferida | UNCuyo puede usar contenidos comunes y específicos. |

### M0 — Gobernanza del roadmap

**Objetivo:** definir estructura de trabajo, tablero, criterios y reglas de priorización.  
**Resultado esperado:** documento vivo y issues base creados.

### M1 — Observabilidad pedagógica v0

**Objetivo:** persistir datos mínimos y crear vista docente inicial.  
**Resultado esperado:** el docente puede ver actividad, avance y errores de alumnos reales.

### M2 — Matemática UTN cierre MVP

**Objetivo:** completar Unidades 4, 5 y 6 con readiness honesto.  
**Resultado esperado:** ruta UTN Matemática transitable de punta a punta.

### M3 — Simulacro UTN Matemática

**Objetivo:** crear práctica integradora alineada a formato de examen.  
**Resultado esperado:** alumno y docente pueden medir preparación global.

### M4 — Física común UTN/UNCuyo

**Objetivo:** definir e iniciar mapa de skills de Física.  
**Resultado esperado:** primera ruta de Física compartible.

### M5 — Preparación multi-track

**Objetivo:** desacoplar skill de unidad institucional.  
**Resultado esperado:** UTN se mantiene y queda base para UNCuyo.

### M6 — UNCuyo Matemática

**Objetivo:** activar ruta institucional específica.  
**Resultado esperado:** UNCuyo puede usar contenidos comunes y específicos.

---

## 4. Backlog inicial de issues

Los siguientes issues son una propuesta inicial. Los cercanos tienen mayor definición. Los lejanos conservan dirección estratégica y se detallarán cuando el proyecto llegue a ese punto.

| Issue | Título | Milestone | Objetivo | Branch sugerida |
|---|---|---|---|---|
| I-01 | Roadmap estratégico del producto | M0 | Documentar visión, prioridades, reglas de trabajo y tablero. | `docs/roadmap-strategy` |
| I-02 | Diseñar observabilidad pedagógica v0 | M1 | Definir métricas mínimas para acompañamiento docente. | `design/teacher-observability-v0` |
| I-03 | Modelo persistible de progreso | M1 | Definir intento, diagnóstico y plan persistibles con `trackId`. | `design/persisted-progress-model` |
| I-04 | Persistir intentos con fallback local | M1 | Guardar intentos remotamente cuando sea posible y localmente si no. | `feat/supabase-practice-attempts` |
| I-05 | Persistir diagnóstico inicial | M1 | Guardar situación inicial y skills débiles por alumno. | `feat/persist-diagnostic-results` |
| I-06 | Crear `/docente` v0 | M1 | Mostrar alumnos, actividad, acierto y skills débiles. | `feat/teacher-dashboard-v0` |
| I-07 | Definir cierre U4-U6 Matemática UTN | M2 | Precisar alcance MVP de Geometría, Trigonometría y Funciones. | `content/math-utn-close-scope` |
| I-08 | Implementar Unidad 4 UTN | M2 | Geometría y medida con teoría, ejemplos, práctica y feedback. | `content/math-unit-4-geometry` |
| I-09 | Implementar Unidad 5 UTN | M2 | Trigonometría con ruta transitable y feedback. | `content/math-unit-5-trigonometry` |
| I-10 | Implementar Unidad 6 UTN | M2 | Funciones, dominio, gráficos y análisis básico. | `content/math-unit-6-functions` |
| I-11 | QA pedagógico Matemática UTN | M2 | Validar secuencia, errores esperados y readiness. | `qa/math-utn-mvp-review` |
| I-12 | Simulacro UTN Matemática | M3 | Crear práctica integradora tipo examen. | `feat/utn-math-exam-practice` |
| I-13 | Mapa de skills Física | M4 | Ordenar Física común a partir del material canónico. | `design/physics-skill-map` |
| I-14 | Física U1: unidades y vectores | M4 | Primera unidad de Física transitable. | `content/physics-unit-1-vectors` |
| I-15 | Diseñar modelo track | M5 | `Institution`, `track`, `trackUnit` y default UTN. | `design/curricular-track-model` |
| I-16 | Home derivado desde track | M5 | Unidades desde track activa, no desde `skillId` rígido. | `refactor/home-track-derived-units` |
| I-17 | Mapa UNCuyo Matemática | M6 | Comparar programa UNCuyo y mapear skills reutilizables. | `design/uncuyo-math-map` |
| I-18 | Selector institucional | M6 | Elegir ruta UTN/UNCuyo sin duplicar App. | `feat/institution-selector` |

---

## 5. Flujo de branches y pull requests

### Reglas de branches

- Cada branch debe responder a un issue o a una tarea claramente delimitada.
- No mezclar contenido, infraestructura, rediseño visual y arquitectura en la misma branch.
- La branch debe poder descartarse sin comprometer `main`.
- El nombre debe expresar intención: `feat`, `fix`, `refactor`, `docs`, `design`, `content`, `qa`.

| Prefijo | Uso | Ejemplo |
|---|---|---|
| `feat/` | Funcionalidad nueva. | `feat/teacher-dashboard-v0` |
| `fix/` | Corrección de error. | `fix/diagnostic-save-without-profile` |
| `refactor/` | Reorganización sin cambio visible. | `refactor/home-track-derived-units` |
| `docs/` | Documentación. | `docs/roadmap-strategy` |
| `design/` | Diseño técnico o pedagógico. | `design/supabase-schema` |
| `content/` | Contenido educativo. | `content/math-unit-4-geometry` |
| `qa/` | Validación y revisión. | `qa/math-utn-mvp-review` |

> **Regla de pull request**  
> Un PR debe ser revisable. Si no se puede explicar en pocos párrafos qué cambia y qué no cambia, probablemente el PR es demasiado grande.

### Plantilla de PR

```md
# Resumen

Qué cambia y por qué.

## Issue vinculado

Closes #número

## Cambios principales

- Cambio 1
- Cambio 2
- Cambio 3

## Qué no cambia

- Límite explícito del PR.
- Áreas que no se tocaron.

## Tests ejecutados

- pnpm run test:run
- pnpm run typecheck
- pnpm run build

## Validación pedagógica

- Contenido revisado.
- Feedback revisado.
- Secuencia o métricas revisadas.

## Riesgos

- Aspectos que requieren seguimiento.
```

---

## 6. Estrategia de tests y validación pedagógica

> **Criterio principal**  
> Los tests técnicos prueban que el sistema no se rompe. La validación pedagógica prueba que el material enseña, orienta y permite intervenir mejor.

| Tipo de test | Qué verifica | Ejemplo aplicado |
|---|---|---|
| Unitario | Una función o regla pequeña. | Calcular porcentaje de acierto de un alumno. |
| Dominio | Reglas pedagógicas o de negocio. | No registrar intentos sin alumno activo. |
| Integración | Varias partes trabajando juntas. | Responder ejercicio y actualizar progreso. |
| E2E / smoke | Flujo de usuario completo. | Entrar, practicar y ver avance. |
| Regresión | Que un bug corregido no vuelva. | Persistencia sin Supabase configurado no rompe la App. |
| QA pedagógico humano | Calidad didáctica y secuencia. | La skill tiene microobjetivo, ejemplo, práctica y feedback útil. |

### Comandos de verificación esperados

```bash
pnpm run test:run
pnpm run typecheck
pnpm run build
```

También debe ejecutarse:

```bash
pnpm test:e2e
```

cuando el cambio afecte flujos principales.

### Validación pedagógica mínima por skill

- Objetivo didáctico explícito.
- Teoría breve y suficiente.
- Ejemplo resuelto con pasos claros.
- Práctica con dificultad progresiva.
- Feedback para errores esperados.
- Vinculación con unidad, materia y track.
- Readiness honesto: no declarar transitable lo que no tiene recorrido completo.

---

## 7. Criterios de aceptación reutilizables

### Para un issue de contenido educativo

- La unidad o skill aparece en la navegación prevista.
- Tiene teoría, ejemplo, práctica y feedback.
- Respeta material canónico y secuencia pedagógica.
- No rompe unidades ya transitables.
- Incluye tests o QA suficiente para evitar regresión.

### Para persistencia de progreso

- La App funciona con Supabase configurado y sin Supabase configurado.
- Cada intento se asocia a `studentId`, `subjectId`, `skillId` y `trackId`.
- No se registran intentos anónimos.
- El fallback local conserva comportamiento actual.
- No se expone service key en cliente.

### Para modo docente v0

- `/docente` existe y muestra alumnos reales.
- Se ve última actividad por alumno.
- Se ve cantidad de intentos y porcentaje de acierto.
- Se detectan skills débiles o no iniciadas.
- La vista permite tomar decisiones pedagógicas concretas.

### Para multi-track

- Existe una track default UTN Mendoza Matemática.
- Una misma skill puede pertenecer a distinta unidad según track.
- El home deriva unidades desde track activa.
- No se rompe la experiencia UTN existente.
- Existen tests que prueban ordenamiento independiente del `skillId`.

### Para Física común

- El mapa de skills se basa en material canónico.
- Las primeras unidades contemplan magnitudes, unidades, vectores y cinemática.
- El diseño no se ata a una sola institución.
- Las prácticas distinguen cálculo, interpretación de unidades y modelos físicos.

---

## 8. Tablero operativo y reglas anti-abrumo

> **Regla anti-abrumo**  
> En la columna “Ahora” no deben convivir más de tres issues activos. El roadmap completo existe para dar dirección, no para exigir que todo se resuelva al mismo tiempo.

| Ahora | Próximo | Después |
|---|---|---|
| I-01 Roadmap estratégico<br>I-02 Observabilidad docente v0<br>I-03 Modelo persistible de progreso | I-04 Persistir intentos<br>I-05 Persistir diagnóstico<br>I-06 `/docente` v0 | I-07 a I-12 Matemática UTN cierre<br>I-13 a I-14 Física común<br>I-15 a I-18 multi-track y UNCuyo |

### Reglas de gobierno

- No abrir cambios grandes sin issue.
- No implementar una feature sin criterios de aceptación.
- No declarar una skill como lista si no tiene recorrido pedagógico completo.
- No introducir multi-track en una branch cuyo objetivo sea terminar contenido UTN.
- No bloquear urgencias pedagógicas con reestructuraciones técnicas innecesarias.
- No cerrar PR sin explicar qué riesgos quedan.

---

## 9. Aprendizaje técnico durante el desarrollo

El proyecto también debe funcionar como proceso de formación. Cada issue importante debería incluir un apartado de aprendizaje esperado.

| Tipo de issue | Aprendizaje esperado |
|---|---|
| Persistencia | Adapters, fallback, variables de entorno, separación cliente/servidor, seguridad básica. |
| Modo docente | Agregación de datos, métricas, diseño de dashboards y decisiones pedagógicas basadas en evidencia. |
| Contenido | Modelado de skills, microobjetivos, feedback y readiness pedagógico. |
| Multi-track | Separación entre contenido, ruta curricular e institución. |
| Física | Modelado de problemas, unidades, vectores, interpretación de fórmulas y errores típicos. |

> **Regla de aprendizaje**  
> Un issue no está completamente aprovechado hasta que se pueda explicar qué cambió, por qué se cambió, qué riesgo reduce y qué se aprendió técnicamente.

### Prácticas recomendadas

- Leer el diff antes de hacer merge.
- Pedir a la IA exploración y diseño antes de implementación.
- Evitar aceptar cambios que no se pueden explicar.
- Registrar dudas técnicas como comentarios en el issue o en el PR.
- Separar “que funcione” de “entender por qué funciona”.

---

## 10. Fuentes internas y material canónico

Este roadmap se apoya en el estado actual del repositorio, la documentación pedagógica y el material canónico de las materias. Las fuentes internas relevantes son:

- README del repositorio y reglas de agentes.
- Mapa de contenidos de Matemática UTN.
- Mapa de skills de Matemática.
- Material canónico de Matemática UTN: Unidades 1 a 6.
- Modelos de examen de Matemática UTN.
- Material canónico de Física UTN: unidades, vectores, cinemática, dinámica, estática, trabajo, energía y potencia.
- Guías de problemas de Física.
- Análisis comparativo UTN / UNCuyo como insumo de decisión, no como fuente normativa única.

> **Cierre estratégico**  
> El desarrollo se orienta a una App educativa multi-institución, pero el avance debe sostener necesidades reales de alumnos y docentes. La prioridad no es acumular funcionalidades: es construir una herramienta pedagógica observable, confiable y extensible.
