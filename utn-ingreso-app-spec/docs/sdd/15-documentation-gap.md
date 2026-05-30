# 15 — Gap de documentación y trabajo pendiente

> **Status:** Aprobado  
> **Depende de:** todos los documentos previos

---

## 1. Evaluación general

La documentación actual es suficiente para iniciar el MVP de Matemática, pero no reemplaza tres trabajos pendientes:

1. creación de banco de ejercicios originales;
2. implementación de evaluadores;
3. diseño fino del dashboard docente.

---

## 2. Cobertura actual

| Necesidad | Estado |
|---|---|
| Visión de producto | Cubierta |
| Enfoque pedagógico alumno/docente | Cubierto |
| MVP | Cubierto |
| Mapa de contenidos | Cubierto |
| Skill map | Cubierto |
| Tipos de ejercicio | Cubierto |
| Evaluador | Diseñado, no implementado |
| Recomendaciones | Diseñadas, no implementadas |
| Métricas | Diseñadas, no implementadas |
| Banco de ejercicios | Falta contenido |
| Física | Estructura preparada, falta desarrollo |
| Rúbricas de procedimiento | Falta post-MVP |

---

## 3. Gaps críticos pre-MVP

| Gap | Acción |
|---|---|
| Banco de ejercicios U1-U3 | Crear ejercicios originales en JSON/TS. |
| Evaluadores | Implementar con tests. |
| Supabase schema | Crear migraciones. |
| Dashboard docente básico | Implementar vista mínima. |
| Simulacro | Crear plantilla de 10 ejercicios. |

---

## 4. Gaps post-MVP

| Gap | Acción |
|---|---|
| Corrección automática de procedimiento | Diseñar rúbricas y evaluar IA/OCR. |
| Física | Replicar estructura de Matemática. |
| Ejercicios parametrizados | Crear generadores. |
| Reportes PDF | Implementar export. |
| Gamificación moderada | Evaluar sin infantilizar. |

---

## 5. Criterio de suficiencia documental

La documentación es suficiente si un agente puede responder:

```text
qué construir,
por qué,
dónde ubicarlo,
cómo testearlo,
cómo validar que ayuda al alumno,
cómo validar que ayuda al docente.
```

Con esta versión, la respuesta es sí para el MVP de Matemática.
