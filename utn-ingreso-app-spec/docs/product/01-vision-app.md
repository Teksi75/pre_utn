# 01 — Visión de la App

> **Status:** Aprobado  
> **Depende de:** 00-conventions.md

---

## 1. Qué debería ser la App

La App debe ser una plataforma única de preparación para el **Ingreso a Ingeniería UTN Mendoza**, con Matemática como primer módulo operativo y Física preparada para una segunda etapa.

No debe ser solamente un repositorio de ejercicios. Debe funcionar como:

```text
sistema de práctica + maduración + seguimiento + simulación de examen
```

Debe integrarse al curso presencial, no competir con él.

---

## 2. Funciones centrales

| Función | Descripción |
|---|---|
| Ordenar el estudio | Alinear práctica con el cronograma y las unidades. |
| Entrenar habilidades | Practicar por skill, no solo por tema general. |
| Detectar errores | Identificar patrones: signos, dominio, despejes, intervalos. |
| Recomendar pasos | Decidir si conviene repetir, bajar dificultad, simular o consultar docente. |
| Simular examen | Entrenar bajo formato y presión similares al examen. |
| Dar visibilidad docente | Convertir intentos en información pedagógica accionable. |

---

## 3. Usuarios principales

### Alumno

Necesita:

- saber qué practicar;
- recibir feedback inmediato;
- reconocer errores frecuentes;
- sostener continuidad entre clases;
- entrenar simulacros;
- ganar seguridad antes del examen.

### Docente

Necesita:

- ver avance por alumno;
- detectar debilidades grupales;
- saber a quién intervenir;
- asignar práctica focalizada;
- decidir qué repasar en clase;
- distinguir error aislado de error persistente.

---

## 4. Estructura conceptual

```text
Ingreso UTN Ingeniería
│
├── Matemática
│   ├── Diagnóstico
│   ├── Práctica por unidad
│   ├── Práctica por habilidad
│   ├── Repaso inteligente
│   ├── Simulacros
│   └── Mis errores
│
├── Física
│   └── Segunda etapa
│
├── Progreso
├── Tareas
└── Panel docente
```

---

## 5. Qué NO es la App

| No es | Motivo |
|---|---|
| Un LMS genérico | Está orientada al ingreso UTN. |
| Un sustituto del profesor | El docente sigue tomando decisiones pedagógicas. |
| Una copia de cuadernillos | Los materiales oficiales son referencia, no contenido reproducido. |
| Un examen automático final | Es herramienta de entrenamiento, no certificación. |
| Una app gamificada infantil | El público es preuniversitario; la estética debe ser seria, clara y motivadora. |

---

## 6. Principio de producto

> La App debe hacer visible lo que normalmente queda oculto: qué no entiende el alumno, qué error repite, qué habilidad falta madurar y qué intervención conviene.

---

## 7. Criterios de aceptación

- [ ] La App tiene una navegación principal centrada en Ingreso UTN.
- [ ] Matemática funciona como primer módulo completo.
- [ ] Física aparece como estructura preparada, no bloqueante.
- [ ] Toda práctica queda asociada a una skill.
- [ ] El alumno recibe feedback formativo.
- [ ] El docente accede a métricas útiles para intervenir.
