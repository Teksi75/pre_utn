# 10 — Estructura del proyecto

> **Status:** Aprobado  
> **Depende de:** 00-conventions.md · 01-vision-app.md

---

## 1. Estructura recomendada

```text
utn-ingreso-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (student)/
│   │   ├── (teacher)/
│   │   └── api/
│   │
│   ├── domain/
│   │   ├── subjects/
│   │   │   ├── matematica/
│   │   │   │   ├── skills/
│   │   │   │   ├── exercises/
│   │   │   │   ├── evaluator/
│   │   │   │   ├── rubrics/
│   │   │   │   └── recommendations/
│   │   │   │
│   │   │   └── fisica/
│   │   │       ├── skills/
│   │   │       ├── exercises/
│   │   │       ├── evaluator/
│   │   │       └── rubrics/
│   │   │
│   │   └── shared/
│   │       ├── students/
│   │       ├── sessions/
│   │       ├── attempts/
│   │       ├── metrics/
│   │       ├── recommendations/
│   │       ├── schedule/
│   │       ├── dashboard/
│   │       ├── teacher/
│   │       └── persistence/
│   │
│   ├── components/
│   ├── hooks/
│   └── lib/
│
├── content/
│   ├── matematica/
│   │   ├── source-map/
│   │   ├── exercises/
│   │   ├── worked-examples/
│   │   └── micro-lessons/
│   └── fisica/
│       ├── source-map/
│       ├── exercises/
│       ├── worked-examples/
│       └── micro-lessons/
│
├── docs/
├── supabase/
│   └── migrations/
└── tests/
```

---

## 2. Reglas de arquitectura

### `domain/`

- Lógica pura.
- Sin React.
- Sin Next.
- Sin Supabase.
- Totalmente testeable con Vitest.

### `content/`

- Ejercicios originales.
- JSON o TS tipado.
- Con uso trazable del material oficial cuando aporte valor pedagógico.
- Con referencias internas a unidad/skill.

### `src/app/`

- Rutas Next.js.
- API routes.
- Server components.
- Client components solo cuando haga falta interacción.

### `supabase/`

- Migraciones SQL versionadas.
- RLS documentado.
- Buckets de storage si hay fotos.

---

## 3. Multi-materia

La App es multi-materia desde el día 1:

```ts
export type SubjectId = 'matematica' | 'fisica';
```

Aunque Física no esté implementada en MVP, la estructura debe existir.

---

## 4. Criterios de aceptación

- [ ] `src/domain` no importa framework.
- [ ] `matematica` y `fisica` comparten forma estructural.
- [ ] Los módulos compartidos no tienen lógica específica de Matemática.
- [ ] Los contenidos están fuera del código de dominio.
- [ ] El proyecto usa `pnpm-lock.yaml`.
