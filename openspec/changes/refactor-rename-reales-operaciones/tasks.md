# Tasks — Skill Rename: `reales_operaciones` → `propiedades_operaciones_reales`

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~100-150 (rename mecánico en ~25 archivos) |
| 400-line budget risk | Low |
| Chained PRs recommended | No (single PR viable) |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk (default) |
| Chain strategy | N/A (single PR) |

## Tasks

### T1. Rename en `src/domain/catalog/pilot-skills.ts`

- [ ] Reemplazar `skillId: "mat.u1.reales_operaciones"` → `skillId: "mat.u1.propiedades_operaciones_reales"` (1 match).
- [ ] Reemplazar el `label` de `"Números reales y operaciones"` → `"Propiedades Operaciones de Números reales"` (1 match).
- [ ] Commit: `refactor(domain): rename reales_operaciones to propiedades_operaciones_reales in pilot-skills`.

### T2. Rename en `src/domain/models/skill-catalog.ts`

- [ ] Reemplazar `"mat.u1.reales_operaciones"` en el array `UNIT_1_SKILLS` (1 match).
- [ ] Reemplazar las 3 entradas en `SKILL_DEPENDENCIES` que referencian el ID viejo (en `potencias_raices`, `racionalizacion`, `complejos`).
- [ ] Verificar que `ALL_SKILLS` y `KNOWN_SKILL_IDS` se actualizan automáticamente (si son derivados).
- [ ] Commit: `refactor(domain): update skill-catalog with new ID and dependencies`.

### T3. Rename en contenido (3 archivos JSON)

- [ ] `content/matematica/theory/unit-1.json`: cambiar `skillId` en el nodo de teoría.
- [ ] `content/matematica/examples/unit-1.json`: cambiar `skillId` en los 2 ejemplos.
- [ ] `content/matematica/exercises.json`: cambiar `id` (4 matches con `.1`, `.2`, `.3`, `.4`) y `skillId` (4 matches).
- [ ] Verificar byte-identical del contenido pedagógico (prompts, options, expectedAnswer, commonErrorTags) — verificado por `git diff` que solo muestre cambios en `id` y `skillId`.
- [ ] Commit: `refactor(content): update theory, examples, and exercises with new skill ID`.

### T4. Rename en tests de dominio (13 archivos)

- [ ] `src/domain/__tests__/evaluator-index.test.ts` (2 matches).
- [ ] `src/domain/__tests__/exercise.test.ts` (6 matches).
- [ ] `src/domain/__tests__/diagnostic.test.ts` (15+ matches — archivo grande).
- [ ] `src/domain/__tests__/catalog.test.ts` (6 matches).
- [ ] `src/domain/__tests__/catalog-content.test.ts` (3 matches).
- [ ] `src/domain/__tests__/complejos-domain.test.ts` (4 matches en prerequisites + tests descriptivos).
- [ ] `src/domain/__tests__/catalog-readiness.test.ts` (7 matches).
- [ ] `src/domain/__tests__/accessibility.test.ts` (12+ matches).
- [ ] `src/domain/__tests__/next-step.test.ts` (verificar matches).
- [ ] `src/domain/__tests__/progress.test.ts` (verificar matches).
- [ ] `src/domain/__tests__/evaluator-error-tagging.test.ts` (verificar matches).
- [ ] `src/domain/__tests__/readiness.test.ts` (verificar matches).
- [ ] `src/domain/__tests__/exercise-options.test.ts` (verificar matches).
- [ ] Commit por archivo o agrupado en 1-2 commits: `refactor(tests): update domain tests with new skill ID`.
- [ ] Correr `pnpm run test:run src/domain/__tests__/` después del cambio. Si falla, revisar contexto.

### T5. Rename en tests de lib, app y components (6 archivos)

- [ ] `src/lib/__tests__/practice-progress.test.ts` (8+ matches).
- [ ] `src/app/practice/__tests__/start-skill.test.ts` (4+ matches).
- [ ] `src/domain/__tests__/skill.test.ts`, `theory.test.ts`, `worked-example.test.ts`, `study-plan.test.ts` (verificar matches, probablemente 0 o 1 cada uno).
- [ ] `src/components/diagnostic/__tests__/practice-link.test.ts` (verificar matches).
- [ ] Commit: `refactor(tests): update lib, app, and components tests with new skill ID`.

### T6. Rename en spec normativa activa

- [ ] `openspec/specs/complex-numbers-skill/spec.md` línea 11: cambiar `mat.u1.reales_operaciones` → `mat.u1.propiedades_operaciones_reales` (1 match).
- [ ] Commit: `refactor(spec): update complex-numbers-skill spec with new prerequisite ID`.

### T7. Verificación final

- [ ] `rg "mat\.u1\.reales_operaciones" src/ content/ openspec/specs/` retorna 0 resultados.
- [ ] `rg "Números reales y operaciones" src/ content/ README.md` retorna 0 resultados.
- [ ] `pnpm run test:run` pasa con 0 failures.
- [ ] `pnpm run typecheck` pasa.
- [ ] `pnpm run build` pasa.
- [ ] Inspeccionar visualmente el diff de `content/matematica/exercises.json` para confirmar que solo `id` y `skillId` cambiaron, no el contenido pedagógico.

### T8. Commit final + push

- [ ] Verificar que `openspec/changes/STATUS.json` no necesita actualización (este change NO entra en `STATUS.json` hasta el merge, según convención multi-PC).
- [ ] Push de la rama a origin (si hay remoto) o quedarse local.
- [ ] Avisar al usuario para revisión.

## Strict TDD

Este refactor NO es TDD-first porque:
- La lógica de negocio no cambia. Solo cambian strings (identificadores).
- Los tests ya existen. Solo se actualizan strings.
- No hay nuevo código que requiera tests nuevos.

El refactor es seguro **porque los tests existentes sirven como red de seguridad**: si el rename rompe algo, los tests fallan.

## Verification of scope

Después de T7, verificar que el conteo de matches es exactamente 0 en `src/`, `content/`, y `openspec/specs/`:

```bash
rg "mat\.u1\.reales_operaciones" src/ content/ openspec/specs/
```

Si retorna cualquier match, hay un archivo que se pasó por alto. Investigar antes de cerrar.
