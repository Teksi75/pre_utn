# 04 — Modelo pedagógico para alumno y docente

> **Status:** Aprobado  
> **Depende de:** 01-vision-app.md  
> **Motivo de creación:** La propuesta inicial documentaba muy bien arquitectura y MVP, pero necesitaba explicitar el enfoque pedagógico tanto para el alumno como para el profesor.

---

## 1. Principio pedagógico central

La App debe funcionar como un **andamiaje de aprendizaje**.

No se limita a decir “correcto” o “incorrecto”. Debe ayudar a responder:

```text
¿Qué intentó hacer el alumno?
¿Dónde se equivocó?
¿Qué habilidad está detrás de ese error?
¿Qué debería practicar ahora?
¿Qué debería mirar el docente?
```

---

## 2. Modelo para el alumno

### 2.1 Objetivos

El alumno debe:

- practicar con frecuencia;
- resolver primero en papel;
- cargar resultado final;
- contrastar su respuesta;
- aprender del error;
- volver sobre habilidades débiles;
- ganar confianza para el examen.

### 2.2 Tipo de feedback

El feedback debe ser:

| Tipo | Ejemplo |
|---|---|
| Correctivo | “El resultado no coincide. Revisá el signo al pasar términos.” |
| Conceptual | “En una ecuación fraccionaria hay que excluir valores que anulan denominadores.” |
| Procedimental | “Primero factorizá el denominador, después multiplicá por el común denominador.” |
| Metacognitivo | “Este error ya apareció antes: conviene volver a practicar intervalos.” |
| Motivacional sobrio | “Mejoraste en despejes, pero todavía falta consolidar dominio.” |

### 2.3 No infantilizar

El público está preparando ingreso universitario. La App debe ser clara y cercana, pero no infantil.

Evitar:

- badges excesivos;
- frases vacías;
- estética de primaria;
- “gamificación” que tape el contenido.

Usar:

- progreso claro;
- objetivos de sesión;
- errores visibles;
- recomendaciones concretas.

---

## 3. Modelo para el docente

### 3.1 Rol del docente

El docente no es reemplazado. La App le da evidencia para intervenir mejor.

La App debe ayudarlo a decidir:

- qué tema repasar en clase;
- qué alumno necesita intervención;
- qué tarea asignar;
- qué skill está frenando a un grupo;
- quién está listo para simulacro;
- quién acierta pero tarda demasiado;
- quién abandona o no practica.

### 3.2 Información útil para el docente

No alcanza con mostrar puntaje. El docente necesita datos interpretables:

```text
Alumno → Unidad actual → Skill débil → Error frecuente → Acción sugerida
```

Ejemplo:

```text
Martina → Unidad 3 → Inecuaciones con valor absoluto → intervalo mal cerrado → asignar práctica guiada de intervalos
```

### 3.3 Intervención docente

La App debe poder marcar situaciones como:

| Señal | Acción sugerida |
|---|---|
| 3 fallos seguidos en la misma skill | Revisión docente |
| Muchos intentos con bajo tiempo | Posible respuesta al azar |
| Alto tiempo y error repetido | Dificultad conceptual |
| No practica hace varios días | Seguimiento externo |
| Fallos grupales en una skill | Replanificar clase |

---

## 4. Ciclo pedagógico

```text
Clase presencial
    ↓
Práctica en App
    ↓
Feedback inmediato
    ↓
Métricas por skill
    ↓
Recomendación automática
    ↓
Intervención docente si hace falta
    ↓
Nueva práctica / simulacro
```

---

## 5. Principios de diseño didáctico

### 5.1 Práctica deliberada

Cada sesión debe tener un objetivo claro:

```text
Hoy practicás inecuaciones con valor absoluto porque fallaste 2 veces en intervalos.
```

### 5.2 Repaso espaciado

Las skills dominadas no desaparecen. Pasan a repaso periódico.

### 5.3 Error como dato

El error no es solo una respuesta incorrecta. Es señal de una habilidad que necesita trabajo.

### 5.4 Progresión de dificultad

La dificultad debe subir por evidencia, no por calendario.

### 5.5 Separación entre práctica y simulacro

- En práctica: feedback inmediato.
- En simulacro: no hay feedback hasta entregar.

---

## 6. Criterios de aceptación

- [ ] Cada feedback tiene intención pedagógica explícita.
- [ ] El docente puede ver errores frecuentes, no solo puntajes.
- [ ] Las recomendaciones indican una acción concreta.
- [ ] La App diferencia error conceptual, procedimental y de notación cuando sea posible.
- [ ] La App no infantiliza al alumno.
- [ ] La información del dashboard puede traducirse en decisión de clase.
