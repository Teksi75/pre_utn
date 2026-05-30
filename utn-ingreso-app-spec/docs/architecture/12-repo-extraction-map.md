# 12 — Mapa de extracción desde repos existentes

> **Status:** Aprobado  
> **Depende de:** 10-project-structure.md

---

## 1. Principio

No copiar ciegamente una App previa. Extraer patrones, decisiones y componentes conceptuales.

```text
Se reutilizan ideas, contratos y arquitectura.
No se arrastra contenido ni deuda técnica innecesaria.
```

---

## 2. `sistema-ingresos`

Tomar como base técnica:

- arquitectura de dominio;
- math-core;
- evaluadores;
- equivalencia matemática;
- métricas por subskill;
- recomendaciones;
- sesiones e intentos;
- Supabase como persistencia;
- enfoque SDD.

Adaptar:

- tipos de respuesta para UTN;
- skill map de ingreso UTN;
- evaluadores de complejos, intervalos, dominio y funciones;
- endpoints para multi-materia.

No tomar:

- contenidos específicos de secundaria;
- nomenclatura infantil;
- reglas de Lengua.

---

## 3. `app-ingreso-product`

Tomar como base de producto y UX:

- práctica por habilidades;
- simuladores;
- dashboard;
- recomendación visible;
- progreso por skill;
- separación entre entrenamiento y simulacro.

Adaptar:

- estética más preuniversitaria;
- flujo para adolescentes de 17 años;
- rol docente más fuerte;
- menos gamificación infantil.

---

## 4. `ingenium-autoevaluaciones`

Tomar como experiencia de producción:

- recorridos por materia;
- panel docente básico;
- intentos registrados;
- feedback inmediato;
- separación oficial/no oficial;
- experiencia con Vercel.

Adaptar:

- persistencia real con Supabase;
- panel docente más accionable;
- no depender de archivos locales para producción.

---

## 5. Criterios de aceptación

- [ ] Cada componente tomado tiene justificación.
- [ ] No se copia contenido oficial.
- [ ] No se copia una arquitectura que impida Física.
- [ ] Las métricas mantienen escala interna [0,1].
- [ ] El nuevo proyecto usa pnpm.
