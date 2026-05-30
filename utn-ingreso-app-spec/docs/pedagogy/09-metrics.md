# 09 — Métricas y dashboard pedagógico

> **Status:** Aprobado  
> **Depende de:** 04-pedagogical-model.md · 06-skill-map.md

---

## 1. Convención de escalas

Las métricas internas usan ratios de 0 a 1. La UI muestra porcentajes de 0 a 100.

```text
Dominio interno: 0.72
UI: 72 %
```

---

## 2. Métricas por alumno

```ts
export interface StudentMetrics {
  studentId: string;
  calculatedAt: string;
  globalAccuracyRatio: number;
  readiness: 'not_ready' | 'developing' | 'almost_ready' | 'ready';
  currentUnit: number;
  totalAttempts: number;
  totalPracticeMinutes: number;
  lastActiveAt?: string;
  skillMetrics: SkillMetric[];
  unitMetrics: UnitMetric[];
  frequentErrors: FrequentError[];
}

export interface SkillMetric {
  skillId: string;
  attempts: number;
  correctAttempts: number;
  accuracyRatio: number;
  averageTimeSeconds: number;
  level: 'not_attempted' | 'weak' | 'developing' | 'solid' | 'mastered';
  lastAttemptAt?: string;
}

export interface UnitMetric {
  unit: number;
  skillsTotal: number;
  skillsAttempted: number;
  skillsMastered: number;
  progressRatio: number;
  accuracyRatio: number;
}

export interface FrequentError {
  errorTag: string;
  description: string;
  occurrences: number;
  relatedSkillIds: string[];
  lastOccurrenceAt: string;
}
```

---

## 3. Niveles por skill

```text
not_attempted: 0 intentos
weak: menos de 40 % con al menos 3 intentos
developing: 40 % a 69 %
solid: 70 % a 89 %
mastered: 90 % o más con al menos 5 intentos
```

---

## 4. Dashboard del alumno

Debe mostrar:

- unidad actual;
- progreso general;
- próxima recomendación;
- skills fuertes;
- skills débiles;
- errores repetidos;
- acceso a práctica sugerida.

No debe saturar con métricas técnicas.

---

## 5. Dashboard docente

Debe mostrar:

```text
Alumno | Unidad | Dominio | Error principal | Próximo paso | Última actividad
```

También debe permitir ver:

- métricas por alumno;
- métricas por grupo;
- skills más débiles;
- errores frecuentes grupales;
- alumnos en riesgo;
- simulacros realizados.

---

## 6. Criterios de aceptación

- [ ] Las métricas internas son ratios [0,1].
- [ ] La UI muestra porcentajes [0,100].
- [ ] El dashboard docente muestra acciones, no solo datos.
- [ ] Los errores frecuentes tienen descripción legible.
- [ ] El readiness se calcula y se muestra de forma prudente.
- [ ] No se promete aprobación del examen.
