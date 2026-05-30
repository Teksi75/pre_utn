# 07 — Tipos de ejercicios y respuestas

> **Status:** Aprobado  
> **Depende de:** 05-math-content-map.md · 06-skill-map.md

---

## 1. Decisión pedagógica

En el MVP, el alumno **resuelve en papel** y carga en la App su respuesta final. Opcionalmente puede subir foto del desarrollo.

La App corrige el resultado final. El docente puede revisar procedimientos cuando sea necesario.

---

## 2. Tipos de ejercicio

| Tipo | ID | Evaluación automática |
|---|---|---|
| Opción múltiple | `multiple_choice` | Sí |
| Numérico | `numeric` | Sí |
| Fracción | `rational` | Sí |
| Intervalo | `interval` | Sí |
| Complejo | `complex` | Sí |
| Conjunto solución | `equation_solution_set` | Sí |
| Recta / función algebraica | `line_equation` | Sí, equivalencia |
| Análisis de función | `function_analysis` | Sí, parcial |
| Foto de desarrollo | `photo` | Revisión docente |

---

## 3. Contrato base

```ts
export type ExerciseType =
  | 'multiple_choice'
  | 'numeric'
  | 'rational'
  | 'interval'
  | 'complex'
  | 'equation_solution_set'
  | 'line_equation'
  | 'function_analysis'
  | 'photo';

export interface Exercise {
  id: string;
  subject: 'matematica' | 'fisica';
  unit: number;
  skillId: string;
  type: ExerciseType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  statement: string;
  correctAnswer: AnswerPayload;
  explanation: string;
  commonErrorTags?: string[];
  sourceReference?: string;
  isExamStyle: boolean;
}
```

---

## 4. Respuestas

```ts
export type AnswerPayload =
  | { type: 'multiple_choice'; value: 'A' | 'B' | 'C' | 'D' | 'E' }
  | { type: 'numeric'; value: string; tolerance?: number }
  | { type: 'rational'; numerator: string; denominator: string }
  | { type: 'interval'; value: string }
  | { type: 'complex'; real: string; imaginary: string }
  | { type: 'equation_solution_set'; solutions: string[]; allowUnordered: boolean }
  | { type: 'line_equation'; value: string; form?: 'slope_intercept' | 'general' | 'point_slope' }
  | { type: 'function_analysis'; domain?: string; image?: string; zeros?: string[]; positive?: string[]; negative?: string[]; increasing?: string[]; decreasing?: string[] }
  | { type: 'photo'; storagePath: string };
```

---

## 5. Intento del alumno

```ts
export interface Attempt {
  id: string;
  studentId: string;
  sessionId: string;
  exerciseId: string;
  mode: 'diagnostic' | 'unit_practice' | 'skill_practice' | 'smart_review' | 'exam' | 'error_review';
  answer: AnswerPayload;
  isCorrect: boolean | null;
  partialCredit?: number;
  feedback: string;
  errorTags: string[];
  timeSpentSeconds: number;
  submittedAt: string;
}
```

---

## 6. Criterios de aceptación

- [ ] Cada tipo tiene UI de carga adecuada.
- [ ] Cada tipo automático tiene evaluador.
- [ ] Cada respuesta queda persistida como JSONB.
- [ ] Foto se guarda en Supabase Storage.
- [ ] La App no exige escribir todo el procedimiento para poder avanzar.
- [ ] El docente puede ver foto si existe.
