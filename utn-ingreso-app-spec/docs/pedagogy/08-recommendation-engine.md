# 08 — Motor de recomendaciones pedagógicas

> **Status:** Aprobado  
> **Depende de:** 04-pedagogical-model.md · 06-skill-map.md · 09-metrics.md

---

## 1. Propósito

El motor de recomendaciones decide el próximo paso del alumno a partir de su historial.

No debe parecer una caja negra. Debe poder explicar:

```text
Te recomendamos esto porque...
```

---

## 2. Acciones posibles

```ts
export type RecommendationAction =
  | 'start_diagnostic'
  | 'continue_current_unit'
  | 'similar_practice'
  | 'lower_difficulty'
  | 'worked_example'
  | 'smart_review'
  | 'spaced_review'
  | 'exam_focus'
  | 'exam_simulation'
  | 'teacher_review'
  | 'assigned_task';
```

---

## 3. Reglas pedagógicas

| Condición | Recomendación |
|---|---|
| Alumno sin historial | Diagnóstico inicial |
| Un fallo en una skill | Ejercicio similar |
| Dos fallos seguidos | Bajar dificultad + ejemplo resuelto |
| Tres fallos seguidos | Revisión docente |
| Tres aciertos seguidos | Subir dificultad |
| Skill dominada sin práctica reciente | Repaso espaciado |
| Examen cercano | Priorizar skills de examen |
| Docente asignó tarea | Tarea asignada tiene prioridad |

---

## 4. Contrato

```ts
export interface RecommendationInput {
  studentId: string;
  currentUnit: number;
  daysToExam?: number;
  skillMetrics: SkillMetric[];
  recentAttempts: Attempt[];
  pendingTeacherTasks: string[];
}

export interface RecommendationOutput {
  action: RecommendationAction;
  targetSkillId?: string;
  targetExerciseId?: string;
  difficulty?: number;
  reason: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  visibleToStudent: boolean;
  visibleToTeacher: boolean;
}
```

---

## 5. Prioridades

```text
1. Tarea asignada por docente
2. Examen muy cercano
3. Tres fallos seguidos
4. Dos fallos seguidos
5. Errores recientes
6. Repaso espaciado
7. Subir dificultad
8. Continuar unidad
```

---

## 6. Criterios de aceptación

- [ ] Toda recomendación incluye `reason` legible.
- [ ] El docente puede ver recomendaciones críticas.
- [ ] El alumno no recibe demasiadas alertas negativas.
- [ ] Tres fallos seguidos disparan intervención docente.
- [ ] El sistema no recomienda una skill cuyos prerrequisitos estén débiles.
- [ ] Tests cubren cada regla.
