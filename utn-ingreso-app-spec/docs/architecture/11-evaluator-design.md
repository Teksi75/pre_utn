# 11 — Diseño del evaluador matemático

> **Status:** Aprobado  
> **Depende de:** 07-exercise-types.md · 06-skill-map.md

---

## 1. Patrón de diseño

El evaluador usa un **dispatcher** por tipo de ejercicio.

```text
evaluateAnswer(exercise, answer)
│
├── multiple_choice
├── numeric
├── rational
├── interval
├── complex
├── equation_solution_set
├── line_equation
├── function_analysis
└── photo
```

---

## 2. Contrato

```ts
export interface EvaluationResult {
  isCorrect: boolean | null;
  partialCredit?: number;
  feedback: string;
  expectedAnswer: AnswerPayload;
  studentAnswer: AnswerPayload;
  errorTags: string[];
  needsTeacherReview?: boolean;
}

export function evaluateAnswer(exercise: Exercise, answer: AnswerPayload): EvaluationResult;
```

---

## 3. Reglas por tipo

| Tipo | Regla |
|---|---|
| `multiple_choice` | Comparar opción. |
| `numeric` | Comparar valor con tolerancia. |
| `rational` | Simplificar y comparar fracciones. |
| `interval` | Normalizar notación y comparar. |
| `complex` | Comparar parte real e imaginaria. |
| `equation_solution_set` | Comparar conjuntos de soluciones sin importar orden. |
| `line_equation` | Llevar a forma general y comparar proporcionalidad. |
| `function_analysis` | Comparar campos con crédito parcial. |
| `photo` | No corrige; marca revisión docente. |

---

## 4. Error tags

El evaluador debe poder devolver tags de error cuando sea posible:

```ts
export type MathErrorTag =
  | 'sign_error'
  | 'domain_restriction_missing'
  | 'interval_endpoint_error'
  | 'fraction_simplification_error'
  | 'complex_part_error'
  | 'slope_parallel_perpendicular_error'
  | 'log_domain_error'
  | 'extra_solution'
  | 'missing_solution'
  | 'notation_error';
```

---

## 5. Tests mínimos

Cada evaluador debe tener:

- respuesta correcta;
- respuesta incorrecta;
- variante equivalente aceptada;
- caso de notación inválida;
- errorTag cuando aplique.

---

## 6. Criterios de aceptación

- [ ] El dispatcher delega correctamente.
- [ ] Los evaluadores son funciones puras.
- [ ] Hay tests por cada tipo.
- [ ] `photo` no intenta corregir automáticamente.
- [ ] `function_analysis` permite crédito parcial.
- [ ] Los errores frecuentes alimentan métricas y recomendaciones.
