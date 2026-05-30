# Pre UTN — App de preparación para el ingreso

Aplicación de preparación para el ingreso a Ingeniería UTN Mendoza. El proyecto busca convertir el material de referencia en un sistema de práctica, feedback y seguimiento pedagógico para alumnos y docentes.

## Foco del MVP

La primera etapa implementa **Matemática**. Física queda preparada como segunda fase, sin bloquear decisiones de arquitectura ni modelo pedagógico.

| Área | Estado |
|---|---|
| Matemática | MVP inicial |
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
- Verificación actual: `pnpm run test`, `pnpm run typecheck` y `pnpm run build` pasan.
- `material_canonico/` queda fuera del repo hasta definir política de uso y trazabilidad.

## Próximo paso

Analizar el material canónico de **Matemática** para construir un mapa pedagógico propio del MVP:

1. Inventariar unidades, temas, ejercicios y evaluaciones.
2. Extraer habilidades evaluables sin copiar contenido canónico como contenido propio.
3. Comparar el análisis contra `utn-ingreso-app-spec/docs/pedagogy/05-math-content-map.md` y `06-skill-map.md`.
4. Proponer la primera feature de dominio con SDD antes de implementar código.
