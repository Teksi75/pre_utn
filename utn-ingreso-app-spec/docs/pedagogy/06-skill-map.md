# 06 — Skill map inicial de Matemática UTN

> **Status:** Aprobado  
> **Depende de:** 05-math-content-map.md

---

## 1. Convención de IDs

```text
mat.u<unidad>.<skill>
exam.<habilidad_de_examen>
```

Ejemplos:

```text
mat.u1.complejos
mat.u3.recta
mat.u6.dominio_imagen
exam.ecuacion_fraccionaria
```

---

## 2. Skills por unidad

### Unidad 1

```ts
export const UNIT_1_SKILLS = [
  'mat.u1.conjuntos_numericos',
  'mat.u1.reales_operaciones',
  'mat.u1.potencias_raices',
  'mat.u1.racionalizacion',
  'mat.u1.intervalos',
  'mat.u1.valor_absoluto',
  'mat.u1.logaritmos',
  'mat.u1.complejos',
] as const;
```

### Unidad 2

```ts
export const UNIT_2_SKILLS = [
  'mat.u2.polinomios_basico',
  'mat.u2.operaciones_polinomios',
  'mat.u2.ruffini_resto',
  'mat.u2.factorizacion',
  'mat.u2.gauss',
  'mat.u2.mcm_mcd_polinomios',
  'mat.u2.ecuaciones_fraccionarias',
] as const;
```

### Unidad 3

```ts
export const UNIT_3_SKILLS = [
  'mat.u3.ecuaciones_lineales',
  'mat.u3.ecuaciones_cuadraticas',
  'mat.u3.inecuaciones_lineales',
  'mat.u3.inecuaciones_valor_absoluto',
  'mat.u3.recta',
  'mat.u3.sistemas',
  'mat.u3.exponenciales',
  'mat.u3.logaritmicas',
] as const;
```

### Unidad 4

```ts
export const UNIT_4_SKILLS = [
  'mat.u4.perimetro_area_volumen',
  'mat.u4.proporciones',
  'mat.u4.thales',
  'mat.u4.pitagoras',
  'mat.u4.razones_trigonometricas',
  'mat.u4.seno_coseno',
] as const;
```

### Unidad 5

```ts
export const UNIT_5_SKILLS = [
  'mat.u5.angulos',
  'mat.u5.radianes',
  'mat.u5.circunferencia_trigonometrica',
  'mat.u5.identidades',
  'mat.u5.ecuaciones_trigonometricas',
  'mat.u5.complejos_forma_polar',
] as const;
```

### Unidad 6

```ts
export const UNIT_6_SKILLS = [
  'mat.u6.funcion_concepto',
  'mat.u6.dominio_imagen',
  'mat.u6.ceros_positividad_negatividad',
  'mat.u6.crecimiento_decrecimiento',
  'mat.u6.funcion_afin',
  'mat.u6.funcion_cuadratica',
  'mat.u6.funcion_exponencial',
  'mat.u6.funcion_logaritmica',
  'mat.u6.funcion_trigonometrica',
  'mat.u6.funcion_por_tramos',
] as const;
```

---

## 3. Skills de examen

```ts
export const EXAM_SKILLS = [
  'exam.complejos',
  'exam.ecuacion_fraccionaria',
  'exam.logaritmos',
  'exam.inecuacion_valor_absoluto',
  'exam.recta',
  'exam.angulos_triangulo',
  'exam.exponencial',
  'exam.trigonometrica',
  'exam.dominio',
  'exam.funcion_por_tramos',
] as const;
```

---

## 4. Prerrequisitos sugeridos

```ts
export const SKILL_DEPENDENCIES = [
  { skillId: 'mat.u1.reales_operaciones', prerequisites: ['mat.u1.conjuntos_numericos'] },
  { skillId: 'mat.u1.potencias_raices', prerequisites: ['mat.u1.reales_operaciones'] },
  { skillId: 'mat.u1.racionalizacion', prerequisites: ['mat.u1.potencias_raices'] },
  { skillId: 'mat.u1.logaritmos', prerequisites: ['mat.u1.potencias_raices'] },
  { skillId: 'mat.u1.complejos', prerequisites: ['mat.u1.reales_operaciones'] },

  { skillId: 'mat.u2.operaciones_polinomios', prerequisites: ['mat.u2.polinomios_basico'] },
  { skillId: 'mat.u2.ruffini_resto', prerequisites: ['mat.u2.operaciones_polinomios'] },
  { skillId: 'mat.u2.factorizacion', prerequisites: ['mat.u2.operaciones_polinomios'] },
  { skillId: 'mat.u2.ecuaciones_fraccionarias', prerequisites: ['mat.u2.factorizacion'] },

  { skillId: 'mat.u3.inecuaciones_valor_absoluto', prerequisites: ['mat.u1.valor_absoluto', 'mat.u3.inecuaciones_lineales'] },
  { skillId: 'mat.u3.recta', prerequisites: ['mat.u3.ecuaciones_lineales'] },
  { skillId: 'mat.u3.exponenciales', prerequisites: ['mat.u1.potencias_raices'] },
  { skillId: 'mat.u3.logaritmicas', prerequisites: ['mat.u1.logaritmos'] },

  { skillId: 'mat.u4.pitagoras', prerequisites: ['mat.u1.potencias_raices'] },
  { skillId: 'mat.u4.razones_trigonometricas', prerequisites: ['mat.u4.pitagoras'] },

  { skillId: 'mat.u5.ecuaciones_trigonometricas', prerequisites: ['mat.u5.identidades'] },
  { skillId: 'mat.u5.complejos_forma_polar', prerequisites: ['mat.u1.complejos', 'mat.u5.radianes'] },

  { skillId: 'mat.u6.dominio_imagen', prerequisites: ['mat.u1.intervalos'] },
  { skillId: 'mat.u6.funcion_afin', prerequisites: ['mat.u3.recta'] },
  { skillId: 'mat.u6.funcion_cuadratica', prerequisites: ['mat.u3.ecuaciones_cuadraticas'] },
  { skillId: 'mat.u6.funcion_por_tramos', prerequisites: ['mat.u6.dominio_imagen', 'mat.u6.ceros_positividad_negatividad'] },
] as const;
```

---

## 5. Tipo recomendado

```ts
export interface Skill {
  id: string;
  name: string;
  unit: number | 'exam';
  description: string;
  prerequisites: string[];
  isExamSkill: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}
```

---

## 6. Criterios de aceptación

- [ ] No hay skills duplicadas.
- [ ] Todo ejercicio tiene `skillId` válido.
- [ ] Las dependencias no generan ciclos.
- [ ] Las exam skills se mapean a skills de unidad.
- [ ] El dashboard puede agrupar por unidad y por skill.
