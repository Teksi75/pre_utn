# 03 — Modos de trabajo de la App

> **Status:** Aprobado  
> **Depende de:** 01-vision-app.md · 06-skill-map.md

---

## 1. Modos principales

La App tiene seis modos de trabajo:

```text
A. Diagnóstico inicial
B. Práctica por unidad
C. Práctica por habilidad
D. Repaso inteligente
E. Simulacro de examen
F. Revisión de errores
```

Cada modo responde a una necesidad pedagógica distinta.

---

## 2. Modo A — Diagnóstico inicial

### Propósito

Detectar la base real del alumno antes de asignarle práctica.

### Contenido

10 a 15 ejercicios breves sobre:

- operaciones con reales;
- fracciones;
- potencias;
- raíces;
- despejes;
- intervalos;
- valor absoluto;
- ecuaciones simples;
- logaritmos básicos.

### Salida esperada

```ts
interface DiagnosticResult {
  studentId: string;
  completedAt: string;
  skillLevels: SkillLevel[];
  recommendedStart: {
    unit: number;
    reason: string;
  };
}
```

---

## 3. Modo B — Práctica por unidad

### Propósito

Acompañar el avance de las clases presenciales.

### Regla

La clase presencial avanza con el orden oficial de unidades. La App acompaña ese orden, pero puede intercalar repasos de prerrequisitos.

### Flujo

```text
Elegir unidad → Resolver ejercicios → Feedback → Registrar intento → Actualizar métrica
```

---

## 4. Modo C — Práctica por habilidad

### Propósito

Permitir que el alumno o docente elija una skill puntual.

Ejemplos:

- ecuaciones fraccionarias;
- dominio de funciones;
- rectas perpendiculares;
- inecuaciones con valor absoluto;
- complejos.

---

## 5. Modo D — Repaso inteligente

### Propósito

La App decide qué conviene repasar.

### Reglas de selección

Priorizar:

1. errores recientes;
2. skills críticas para el examen;
3. prerrequisitos de la unidad actual;
4. skills dominadas que requieren repaso espaciado;
5. habilidades con bajo porcentaje de aciertos.

---

## 6. Modo E — Simulacro de examen

### Propósito

Entrenar en formato similar al examen.

### Regla pedagógica

Durante el simulacro:

- no hay feedback inmediato;
- se muestra avance y tiempo;
- el resultado se ve al final;
- el informe posterior desglosa por skill.

### Plantilla base

```text
1. Complejos
2. Ecuación fraccionaria
3. Logaritmos
4. Inecuación con valor absoluto
5. Recta
6. Ángulos en triángulos
7. Exponenciales
8. Trigonometría
9. Dominio de funciones
10. Función por tramos
```

---

## 7. Modo F — Revisión de errores

### Propósito

Que el alumno vea sus errores repetidos y que el docente tenga información accionable.

Ejemplos de errores:

- error de signos;
- pérdida de restricciones de dominio;
- intervalo mal cerrado;
- pendiente inversa pero no opuesta;
- logaritmo aplicado fuera de dominio;
- solución extra en ecuación fraccionaria.

---

## 8. Criterios de aceptación

- [ ] Los seis modos están representados en navegación o flujo interno.
- [ ] Cada intento registra modo, skill, ejercicio, respuesta y resultado.
- [ ] Práctica y simulacro tienen comportamiento distinto respecto al feedback.
- [ ] El repaso inteligente puede explicar por qué eligió una skill.
- [ ] La revisión de errores muestra patrones, no solo ejercicios fallados.
