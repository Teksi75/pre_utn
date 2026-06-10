# Pre UTN

Pre UTN es una app de preparación para el ingreso a Ingeniería UTN Mendoza. Complementa las clases presenciales con práctica, feedback y seguimiento pedagógico para alumnos y docentes.

App publicada: https://pre-utn.vercel.app/

## Estado real del MVP

- Matemática es el primer módulo activo.
- Física queda para una segunda fase.
- Unidad 1 está en construcción: no es todavía un curso completo.
- Las rutas actuales permiten aprender, practicar y diagnosticar sobre el catálogo disponible, pero solo deben tratarse como transitables las skills que tengan teoría, ejemplos, práctica, feedback y readiness real.

Skills de Unidad 1 realmente transitables hoy:

| Skill | Estado |
|-------|--------|
| Conjuntos numéricos | Listo |
| Propiedades Operaciones de Números reales | Listo |
| Intervalos | Listo |
| Potencias y raíces | Listo |
| Racionalización | Listo |
| Valor absoluto | Listo |
| Logaritmos | Listo |

Temas de Unidad 1 que todavía faltan completar como recorrido transitable:

- (ninguno — las 8 skills están en estado "Listo")

## Fuente de verdad

Este README es una puerta de entrada y un mapa de navegación. No es la fuente normativa única.

| Tema | Fuente activa |
|------|---------------|
| Pedagogía y contenido canónico | `material_canonico/Matemática/` |
| Mapa de contenidos | `utn-ingreso-app-spec/docs/pedagogy/05-math-content-map.md` |
| Mapa de skills | `utn-ingreso-app-spec/docs/pedagogy/06-skill-map.md` |
| Estado de implementación SDD | `openspec/changes/` vigentes |
| Contenido cargado en la app | `content/matematica/` |
| Catálogo y readiness técnico | `src/domain/catalog/` |
| Scripts reales | `package.json` |

La fuente pedagógica es el material canónico y las specs activas. La fuente técnica es el código y los tests. La fuente de estado implementado son los cambios SDD vigentes y el contenido real del repo.

## Reglas para agentes

- No implementar features sin revisar material canónico y specs activas.
- No asumir que este README está más actualizado que el código, `openspec/changes/` o el contenido real.
- No cerrar una tarea solo porque pasan tests técnicos.
- No listar una skill como transitable hasta que tenga teoría, ejemplos, práctica, feedback y readiness real.
- No medir progreso pedagógico por cantidad de ejercicios.
- Justificar el camino didáctico mediante microobjetivos y errores esperados.

## Camino actual de Unidad 1

| Paso | Tema | Estado |
|------|------|--------|
| 0 | Conjuntos numéricos | Listo |
| 1 | Propiedades Operaciones de Números reales | Listo |
| 2 | Potencias y raíces | Listo |
| 3 | Racionalización | Listo |
| 4 | Intervalos | Listo |
| 5 | Valor absoluto | Listo |
| 6 | Logaritmos | Listo |
| 7 | Complejos | Listo |

`En construcción` significa que ya existe una parte del recorrido, pero todavía no alcanza readiness completo. `Pendiente` puede incluir ejercicios sueltos o referencias parciales, pero todavía no tiene recorrido pedagógico completo y validado para el alumno.

## Cómo correr

```bash
pnpm install
pnpm dev
pnpm run test:run
pnpm run typecheck
pnpm run build
```

Abrir `http://localhost:3000` para usar la app en desarrollo.

## Quality gate (GGA)

GGA corre automáticamente en `pre-commit` revisando los cambios contra las reglas de `AGENTS.md`. La instalación del binario y del hook es por máquina: ver [docs/qa/gga-setup.md](./docs/qa/gga-setup.md) y el [checklist manual](./docs/qa/gga-checklist.md).

## Modo QA de contenido

Para revisar una skill sin completar sus prerrequisitos, activar el modo QA de contenido en desarrollo:

```bash
NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true pnpm dev
```

En PowerShell:

```powershell
$env:NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE="true"; pnpm dev
```

También se puede dejar configurado localmente en `.env.local`:

```env
NEXT_PUBLIC_ENABLE_QA_CONTENT_MODE=true
```

Con el modo activo, abrir una skill lista por URL directa, por ejemplo:

```text
http://localhost:3000/practice?skill=mat.u1.valor_absoluto
```

Este modo es solo para QA/contenido: no desbloquea skills desconocidas o sin readiness, y no cambia el flujo pedagógico normal cuando la variable está apagada.

## Advertencia de validación

Que `build`, `typecheck` y los tests pasen significa que el sistema no se rompe técnicamente.

No significa que el contenido sea suficiente, que la secuencia sea pedagógicamente correcta o que la experiencia sea satisfactoria para un alumno. La validación pedagógica humana sigue siendo obligatoria.
