# 02 — Alcance del MVP

> **Status:** Aprobado  
> **Depende de:** 01-vision-app.md · 04-pedagogical-model.md

---

## 1. Definición del MVP

El MVP es:

```text
Matemática UTN funcional + arquitectura preparada para Física.
```

El objetivo no es cargar “todo perfecto”, sino construir un núcleo real que permita a un alumno practicar y a un docente observar progreso.

---

## 2. Entra en el MVP

### Alumno

| Feature | Prioridad |
|---|---|
| Registro o perfil simple de alumno | P0 |
| Diagnóstico inicial | P0 |
| Práctica por unidad | P0 |
| Práctica por habilidad | P1 |
| Simulacro estilo examen | P0 |
| Feedback inmediato | P0 |
| Historial de intentos | P0 |
| Progreso por skill | P1 |
| Revisión de errores frecuentes | P1 |
| Foto opcional del desarrollo | P2 |

### Docente

| Feature | Prioridad |
|---|---|
| Lista de alumnos | P0 |
| Ver intentos | P0 |
| Ver skills débiles | P1 |
| Ver errores frecuentes | P1 |
| Asignar tarea focalizada | P2 |
| Dashboard grupal | P2 |

### Contenido matemático inicial

Prioridad de carga:

1. Diagnóstico de prerrequisitos.
2. Unidad 1: reales, potencias, raíces, intervalos, valor absoluto, logaritmos, complejos.
3. Unidad 2: polinomios, factorización, ecuaciones fraccionarias.
4. Unidad 3: ecuaciones, inecuaciones, recta, exponenciales, logarítmicas.
5. Skills de examen: complejos, ecuación fraccionaria, logaritmos, inecuaciones con valor absoluto, recta, triángulos, exponenciales, trigonometría, dominio, función por tramos.
6. Unidad 4, 5 y 6 cargadas de forma incremental.

---

## 3. No entra en el MVP

| Feature | Motivo | Momento |
|---|---|---|
| Física completa | Primero Matemática | v1.1/v2 |
| OCR o corrección automática de fotos | Alta complejidad | v2 |
| IA generativa de ejercicios en producción | Riesgo pedagógico y de calidad | Post-MVP |
| Gamificación compleja | No es esencial | Post-MVP |
| App móvil nativa | Web responsive alcanza | Futuro |
| Reportes PDF automáticos | Dashboard primero | v1.1 |
| Corrección del procedimiento paso a paso | Requiere rúbricas maduras | v2 |

---

## 4. Criterio de “terminado” para MVP

El MVP está terminado cuando:

- un alumno puede entrar, hacer diagnóstico, practicar y simular;
- el sistema corrige respuestas finales de varios tipos;
- cada intento queda registrado;
- las métricas se actualizan;
- el docente puede ver desempeño básico;
- hay al menos un simulacro funcional;
- la arquitectura no impide agregar Física.

---

## 5. Criterios técnicos de aceptación

- [ ] `pnpm run test` pasa.
- [ ] `pnpm run typecheck` pasa.
- [ ] `pnpm run build` pasa.
- [ ] Supabase tiene migraciones versionadas.
- [ ] No hay dependencia de `npm`.
- [ ] No se exponen claves de servicio en cliente.

---

## 6. Criterios pedagógicos de aceptación

- [ ] Cada ejercicio tiene skill asociada.
- [ ] Cada feedback explica el error o el próximo paso.
- [ ] Cada métrica puede traducirse en decisión docente.
- [ ] El simulacro no da feedback hasta finalizar.
- [ ] La práctica sí da feedback inmediato.
