# Proposal — refactor: rename `reales_operaciones` → `propiedades_operaciones_reales`

## Why

La pasada `r2` de la auditoría de Unidad 1 ([`docs/auditorias/unidad-1/AUDITORIA_UNIDAD_1.md`](../../../docs/auditorias/unidad-1/AUDITORIA_UNIDAD_1.md)) leyó el material canónico de la UTN Mendoza ([`material_canonico/Matemática/UNIDAD1_matemática.pdf`](../../../material_canonico/Matemática/UNIDAD1_matemática.pdf), p. 2) y descubrió que el nombre de la skill actual **no aparece en el índice del PDF**.

El índice del PDF lista 4 temas distintos dentro del bloque "Números reales":

1. **Números reales** (definición del conjunto ℝ)
2. **Propiedades Operaciones de Números reales** (cap. 13) ← *el nombre canónico*
3. **Potenciación de Números reales** (cap. 14)
4. **Radicación de Números reales** (cap. 17)

El código actual tiene **un solo skill** `mat.u1.reales_operaciones` que mezcla los 4, y la skill `potencias_raices` se solapa con los caps. 14 y 17. Esto genera dos problemas:

- **Drift pedagógico**: el alumno/docente que busca "Propiedades Operaciones" en el código no lo encuentra por nombre. La fuente normativa es el PDF, no el código.
- **Riesgo de escalabilidad**: si en el futuro alguien agrega el tema "Números reales" como skill separada, el nombre `reales_operaciones` colisiona con ambas (cap. 8 y cap. 13).

## What changes

### Rename 1:1

- `mat.u1.reales_operaciones` → `mat.u1.propiedades_operaciones_reales`
- `Números reales y operaciones` (label) → `Propiedades Operaciones de Números reales` (label, alineado con cap. 13 del PDF)

### Alcance del rename

- La skill renombrada cubre el **capítulo 13** del PDF: ley de cierre, asociativa, conmutativa, elemento neutro, opuesto, inverso, distributiva.
- El banco actual de 4 ejercicios de orden de operaciones **se conserva** (orden de operaciones es un caso de aplicación de la asociativa y la distributiva, está dentro del alcance del cap. 13).
- **No se agrega contenido nuevo en este change**. La ampliación del banco se hace en un change posterior (referencia: [`BACKLOG_MEJORAS_UNIDAD_2.md`](../../../docs/auditorias/unidad-1/BACKLOG_MEJORAS_UNIDAD_2.md) ítem D2 reactivado).

### Lo que NO se toca en este change

- `potencias_raices` no se renombra. Cubre los caps. 14 y 17 del PDF (potenciación y radicación), que son temas distintos.
- `intervalos` no se toca. No se ve afectado.
- Los archivos en `openspec/changes/archive/` NO se modifican. Son histórico.
- El `UTN1_matemática.pdf` no se modifica. Es material canónico, fuente pedagógica.

## Scope

### Archivos a tocar (verificado por grep el 2026-06-09)

**Código (3 archivos)**:
- `src/domain/catalog/pilot-skills.ts` (1 match: `skillId` + `label`)
- `src/domain/models/skill-catalog.ts` (3 matches: array `UNIT_1_SKILLS` + `SKILL_DEPENDENCIES`)
- `content/matematica/theory/unit-1.json` (1 match: nodo de teoría)
- `content/matematica/examples/unit-1.json` (1 match: ejemplos)
- `content/matematica/exercises.json` (4 matches: 4 ejercicios, `id` y `skillId`)

**Tests (13 archivos)**:
- `src/domain/__tests__/evaluator-index.test.ts`
- `src/domain/__tests__/exercise.test.ts`
- `src/domain/__tests__/diagnostic.test.ts`
- `src/domain/__tests__/catalog.test.ts`
- `src/domain/__tests__/catalog-content.test.ts`
- `src/domain/__tests__/complejos-domain.test.ts`
- `src/domain/__tests__/catalog-readiness.test.ts`
- `src/domain/__tests__/accessibility.test.ts`
- `src/domain/__tests__/next-step.test.ts`
- `src/domain/__tests__/progress.test.ts`
- `src/domain/__tests__/evaluator-error-tagging.test.ts`
- `src/domain/__tests__/readiness.test.ts`
- `src/domain/__tests__/exercise-options.test.ts`
- `src/domain/__tests__/skill.test.ts`
- `src/domain/__tests__/theory.test.ts`
- `src/domain/__tests__/worked-example.test.ts`
- `src/domain/__tests__/study-plan.test.ts`
- `src/lib/__tests__/practice-progress.test.ts`
- `src/app/practice/__tests__/start-skill.test.ts`
- `src/components/diagnostic/__tests__/practice-link.test.ts`

**Specs normativas (1 archivo, 1 match en sección normativa)**:
- `openspec/specs/complex-numbers-skill/spec.md` (línea 11: declara el prerequisite como `mat.u1.reales_operaciones`)

**Auditoría (3 archivos, contexto histórico)**:
- `docs/auditorias/unidad-1/AUDITORIA_UNIDAD_1.md` (7+ menciones como referencia de hallazgos)
- `docs/auditorias/unidad-1/LECCIONES_APRENDIDAS_UNIDAD_1.md` (1 mención)
- `docs/auditorias/unidad-1/BACKLOG_MEJORAS_UNIDAD_2.md` (ya actualizado, no se toca)

### Archivos que NO se tocan (decisión explícita)

- `openspec/changes/archive/2026-06-04-*`, `2026-06-08-*`: histórico. El rename no existía cuando se escribieron.
- `openspec/changes/unit-1-pedagogical-slice/*`: este change es de la fase pedagógica, cuando se llamó "reales_operaciones" por primera vez. Tocar los `archive/` y los `unit-1-pedagogical-slice` rompería el contexto histórico de la decisión original.
- `utn-ingreso-app-spec/docs/pedagogy/06-skill-map.md`: especificación original del proyecto (2025), referencia histórica.
- `material_canonico/Matemática/UNIDAD1_matemática.pdf`: fuente canónica, no se modifica.

## Success criteria

1. `rg "mat\.u1\.reales_operaciones" src/ content/ openspec/specs/` retorna 0 resultados.
2. `rg "Números reales y operaciones" src/ content/` retorna 0 resultados (label actualizado).
3. `pnpm run test:run` pasa.
4. `pnpm run typecheck` pasa.
5. `pnpm run build` pasa.
6. `openspec/specs/complex-numbers-skill/spec.md` línea 11 referencia `mat.u1.propiedades_operaciones_reales` como prerequisite.
7. El home page (`pnpm dev`, `http://localhost:3000`) muestra la skill con label "Propiedades Operaciones de Números reales".
8. Los 4 ejercicios de orden de operaciones siguen disponibles en `/practice?skill=mat.u1.propiedades_operaciones_reales`.

## Risks

| Riesgo | Mitigación |
|--------|------------|
| Algún test asume el nombre viejo en una cadena de strings compleja | Hacer el rename archivo por archivo, correr tests después de cada uno. Si un test rompe, revisar el contexto antes de cambiar. |
| El catálogo `skill-catalog.ts` valida dependencias y rechaza un ID que no existe | Verificar que el ID nuevo esté en `ALL_SKILLS` antes de referenciarlo. |
| La home page cachea el label en `localStorage` | El label se renderiza desde `pilot-skills.ts` en cada carga, no hay cache. |
| Multi-PC: el rename en main pero no en el otro PC genera conflicto al hacer pull | Después de merge a main, hacer `git pull` en ambos PCs. |
| `masteryLevel` u otras métricas en `localStorage` usan el ID viejo | Las métricas se almacenan por `skillId` en `accuracyBySkill`. Después del rename, el `skillId` cambia y el progreso histórico del alumno se "pierde" para esta skill. Aceptable para un refactor pre-U2. |

## Out of scope

- Ampliar el banco de la skill a 8-12 ejercicios (ver [`BACKLOG_MEJORAS_UNIDAD_2.md`](../../../docs/auditorias/unidad-1/BACKLOG_MEJORAS_UNIDAD_2.md) D2 reactivado).
- Renombrar otras skills que no respetan el PDF (por ejemplo, `potencias_raices` cubre caps. 14+17, podría llamarse `potenciacion_radicacion` o separarse).
- Migrar el campo `recoveryTarget` a tipo discriminado (ver Backlog A3).
- Implementar el modelo `PedagogyEvent` (ver Backlog B6, deferred).

## Estimation

- Búsqueda con `rg` y conteo de matches: 5 min
- Rename mecánico en código (3 archivos): 15 min
- Rename mecánico en contenido (3 archivos JSON): 15 min
- Rename mecánico en tests (19 archivos): 1.5 horas
- Spec normativa (1 archivo): 5 min
- Correr tests + typecheck + build: 10 min
- Commit y push: 10 min

**Total estimado**: 2-3 horas.
