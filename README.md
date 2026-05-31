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

El material canónico se trata como fuente pedagógica válida. La app puede apoyarse en su teoría, ejemplos y evaluaciones; para los ejercicios se prefiere variar valores, contexto o redacción cuando eso aporte práctica nueva, salvo repeticiones intencionales para reforzar un concepto.

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
- Mantener trazabilidad del material de referencia usado y justificar repeticiones literales cuando tengan intención didáctica.

## Estado actual

- Repositorio GitHub privado inicializado.
- GGA instalado como pre-commit hook con provider `opencode`.
- Scaffold de app creado con Next.js, TypeScript, Tailwind, pnpm y Vitest.
- **Primera experiencia usable completada** (change `first-usable-student-experience`):
  - Dominio base de Matemática implementado y archivado con SDD
  - Error tagging automático en evaluador (patrones de error comunes)
  - Práctica guiada: selección de unidad/skill, ejercicios, feedback pedagógico
  - Diagnóstico inicial: selección balanceada, estimación de skills, sugerencias de práctica
  - Navegación home con links a `/practice` y `/diagnostic`
- Verificación actual: `pnpm run test:run` (168 tests), `pnpm run typecheck` y `pnpm run build` pasan.
- `material_canonico/` contiene PDFs de referencia para orientar teoría, ejemplos, ejercicios y evaluación.

## Rutas disponibles

| Ruta | Descripción |
|------|-------------|
| `/` | Home con navegación a práctica y diagnóstico |
| `/practice` | Práctica guiada: seleccionar unidad/skill, resolver ejercicios, recibir feedback con error tags |
| `/diagnostic` | Diagnóstico inicial: selección balanceada de ejercicios, estimación de skills débiles, sugerencias de práctica |

## Cómo correr

```bash
pnpm install
pnpm dev
```

Abrir http://localhost:3000 en el navegador.

## Próximos pasos

1. **Revisión visual humana**: verificar que las rutas funcionan correctamente en navegador
2. **Física (segunda fase)**: extender el dominio y catálogo a Física
3. **Métricas avanzadas**: tracking de progreso, analytics, reportes para docentes
4. **Persistencia Supabase**: guardar intentos, progreso, perfiles de usuario
5. **Component tests**: testing de componentes React con React Testing Library
