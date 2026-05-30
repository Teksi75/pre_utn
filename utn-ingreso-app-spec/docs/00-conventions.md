# 00 — Convenciones transversales del proyecto

> **Status:** Aprobado  
> **Depende de:** nadie  
> **Todos los archivos dependen de este documento**

---

## 1. Package manager obligatorio: pnpm

Este proyecto usa **pnpm** como única herramienta de gestión de paquetes.

```bash
pnpm install
pnpm add <package>
pnpm add -D <package>
pnpm run dev
pnpm run test
pnpm run typecheck
pnpm run build
```

Reglas:

- No usar `npm install`.
- No crear `package-lock.json`.
- No usar `yarn.lock`.
- Si una guía externa usa `npm`, traducir el comando a `pnpm`.
- El lockfile oficial es `pnpm-lock.yaml`.

Motivo: seguridad, reproducibilidad, instalación estricta, menor riesgo de dependencias transitivas ocultas y mejor compatibilidad con monorepos futuros.

---

## 2. Stack técnico base

| Capa | Decisión |
|---|---|
| Framework | Next.js con App Router |
| Lenguaje | TypeScript estricto |
| UI | React + Tailwind |
| Persistencia | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage para fotos de desarrollo |
| Deploy | Vercel |
| Tests | Vitest + eventualmente Playwright |
| Package manager | pnpm |
| Metodología | SDD + TDD + ENGRAM + GGA |

---

## 3. SDD — Spec-Driven Development

Toda feature comienza con una especificación en `/docs/`.

Flujo obligatorio:

```text
Spec → Tests → Implementación → Verificación → Registro
```

Prohibido:

```text
Implementar primero y documentar después.
```

Todo agente debe poder responder:

1. ¿Qué archivo `.md` estoy implementando?
2. ¿Qué criterios de aceptación debo cumplir?
3. ¿Qué tests prueban que terminé?
4. ¿Qué impacto pedagógico tiene esta feature?

---

## 4. TDD — Test-Driven Development

Para dominio, evaluadores, métricas y recomendaciones:

```text
RED → GREEN → REFACTOR
```

Reglas:

- Primero escribir el test que falla.
- Luego implementar el mínimo código necesario.
- Luego refactorizar sin romper tests.
- Evitar tests frágiles basados en detalles de UI.
- Priorizar tests de dominio puro.

---

## 5. ENGRAM — Memoria y trazabilidad de decisiones

ENGRAM se usa como soporte de memoria para agentes.

Cada cambio relevante debe dejar trazabilidad:

- spec aplicada;
- decisiones tomadas;
- supuestos;
- tests ejecutados;
- deuda técnica creada;
- próximos pasos.

Formato sugerido de registro:

```text
ENGRAM NOTE
Feature: evaluator.interval
Spec: docs/architecture/11-evaluator-design.md
Decision: intervalos se normalizan por parser propio, no por string literal.
Tests: interval.test.ts PASS
Debt: equivalencia semántica de uniones en distinto orden queda post-MVP.
```

---

## 6. GGA — Gentleman Guardian Angel

GGA se usa como revisión de seguridad, calidad y consistencia.

Checklist mínimo antes de cerrar tarea:

- [ ] No hay secretos en el código.
- [ ] No hay `any` innecesario.
- [ ] No hay imports circulares.
- [ ] No hay dependencia no declarada.
- [ ] No hay acceso directo a tablas desde UI cliente.
- [ ] `domain/` no importa React, Next ni Supabase.
- [ ] Tests pasan.
- [ ] Build pasa.
- [ ] La feature respeta el enfoque pedagógico.

---

## 7. Convenciones de TypeScript

- `strict: true`.
- Evitar `any`; usar `unknown` y narrowing.
- Tipos públicos exportados desde `index.ts`.
- Uniones discriminadas para tipos de respuesta.
- Funciones puras en `src/domain`.
- Side effects solo en infraestructura, API o UI.

---

## 8. Convenciones de carpetas

```text
src/domain/       lógica pura
src/app/          rutas Next.js y API routes
src/components/   componentes React
content/          ejercicios y contenido estático
docs/             especificación
supabase/         migraciones SQL
tests/            integración y fixtures
```

---

## 9. Convención de commits

```text
feat(evaluator): add interval evaluator
fix(metrics): normalize accuracy ratio
spec(pedagogy): add teacher intervention model
test(recommendation): cover repeated error rule
refactor(domain): isolate subject evaluators
```

---

## 10. Regla pedagógica transversal

Toda feature debe poder responder:

```text
¿Esto ayuda al alumno a aprender, practicar, corregirse o madurar?
¿Esto ayuda al docente a interpretar, intervenir o planificar?
```

Si la respuesta a ambas preguntas es “no”, la feature no entra en el MVP.
