# Pre UTN — App de preparación para el ingreso

Aplicación de preparación para el ingreso a Ingeniería UTN Mendoza. El proyecto busca convertir el material de referencia en un sistema de práctica, feedback y seguimiento pedagógico para alumnos y docentes.

## Foco del MVP

La primera etapa implementa **Matemática**. Física queda preparada como segunda fase, sin bloquear decisiones de arquitectura ni modelo pedagógico.

| Área | Estado |
|---|---|
| Matemática | Dominio base implementado |
| Física | Segunda fase |
| Stack previsto | Next.js · TypeScript · Supabase · Vercel · pnpm |
| Metodología | SDD · TDD · ENGRAM · GGA |

## Estructura inicial

```text
material_canonico/        Material de referencia: teoría, ejercicios y evaluaciones
utn-ingreso-app-spec/     Especificación del producto y plan de implementación
src/                      App Next.js inicial
openspec/                 Cambios SDD y trazabilidad de implementación
```

El material canónico se trata como fuente de análisis y referencia. Los ejercicios y experiencias de la app deben ser diseñados como contenido pedagógico propio, respetando la intención formativa del ingreso.

## Documentación principal

El punto de entrada de especificación está en:

```text
utn-ingreso-app-spec/docs/README.md
```

Lectura mínima para agentes o colaboradores:

1. `utn-ingreso-app-spec/docs/00-conventions.md`
2. `utn-ingreso-app-spec/docs/README.md`
3. `utn-ingreso-app-spec/docs/sdd/14-agent-workflow-sdd-tdd-engram-gga.md`

## Reglas de trabajo

- No implementar features sin especificación previa.
- Usar `pnpm`; no usar `npm` ni `yarn`.
- Aplicar TDD en dominio, evaluadores, métricas y recomendaciones.
- Pasar revisión GGA antes de cerrar tareas.
- Mantener separación entre material canónico y contenido propio de la app.

## Estado actual

- Repositorio GitHub privado inicializado.
- GGA instalado como pre-commit hook con provider `opencode`.
- Scaffold de app creado con Next.js, TypeScript, Tailwind, pnpm y Vitest.
- Dominio base de Matemática implementado y archivado con SDD:
  - modelos de habilidad, ejercicio, error y resultado;
  - evaluador inicial para respuestas numéricas, exactas y booleanas;
  - taxonomía inicial de errores;
  - catálogo de 30 ejercicios pedagógicos originales, 5 por unidad.
- Verificación actual: `pnpm run test:run` (141 tests), `pnpm run typecheck` y `pnpm run build` pasan.
- `material_canonico/` queda fuera del repo hasta definir política de uso y trazabilidad.

## Próximo paso

Construir la primera experiencia usable sobre el dominio de **Matemática** ya implementado:

1. Definir con SDD la primera experiencia de práctica o diagnóstico.
2. Resolver la auto-asignación de `errorTag` cuando el patrón de respuesta lo permita.
3. Diseñar feedback pedagógico sin exponer contenido canónico como contenido propio.
4. Mantener TDD estricto en dominio, evaluadores, métricas y recomendaciones.
