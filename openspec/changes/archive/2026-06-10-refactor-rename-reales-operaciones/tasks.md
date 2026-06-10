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

- [x] Reemplazar `skillId: "mat.u1.reales_operaciones"` → `skillId: "mat.u1.propiedades_operaciones_reales"` (1 match). — Applied prior to this session.
- [x] Reemplazar el `label` de `"Números reales y operaciones"` → `"Propiedades Operaciones de Números reales"` (1 match). — Applied prior to this session.

### T2. Rename en `src/domain/models/skill-catalog.ts`

- [x] Reemplazar `"mat.u1.reales_operaciones"` en el array `UNIT_1_SKILLS` (1 match). — Applied prior to this session.
- [x] Reemplazar las 3 entradas en `SKILL_DEPENDENCIES` que referencian el ID viejo (en `potencias_raices`, `racionalizacion`, `complejos`). — Applied prior to this session.
- [x] Verificar que `ALL_SKILLS` y `KNOWN_SKILL_IDS` se actualizan automáticamente (si son derivados). — Derivan de UNIT_1_SKILLS, confirmado vía typecheck.

### T3. Rename en contenido (4 archivos JSON + feedback + IDs internos)

- [x] `content/matematica/theory/unit-1.json`: cambiar `id: "theory-reales-operaciones"` → `id: "theory-propiedades-operaciones-reales"` y `skillId`. — Applied prior to this session.
- [x] `content/matematica/examples/unit-1.json`: cambiar `id: "example-reales-operaciones-1"` y `-2` → `id: "example-propiedades-operaciones-reales-1"` y `-2` y `skillId`. — Applied prior to this session.
- [x] `content/matematica/exercises.json`: cambiar `id`, `skillId`, `relatedTheoryIds`, `relatedExampleIds`. — Applied prior to this session.
- [x] `content/matematica/feedback/unit-1.json`: cambiar `recoveryTarget`. — Applied prior to this session.
- [x] Verificar byte-identical del contenido pedagógico (prompts, options, expectedAnswer, commonErrorTags). — Confirmed via git diff: only IDs changed, content untouched.

### T4. Rename en tests de dominio (13 archivos)

- [x] All domain test files updated with new ID. — Applied prior to this session.
- [x] `src/domain/__tests__/pilot-skills.test.ts`: removed negative assertion with old ID literal (final fix in this session).

### T5. Rename en tests de lib, app y components (6 archivos)

- [x] All lib, app, and component test files updated with new ID. — Applied prior to this session.

### T6. Rename en spec normativa activa

- [x] `openspec/specs/complex-numbers-skill/spec.md` línea 11: cambiado a `mat.u1.propiedades_operaciones_reales`. — Applied prior to this session.

### T7. Verificación final

- [x] `rg "mat\.u1\.reales_operaciones" src/ content/ openspec/specs/` retorna 0 resultados.
- [x] `rg "Números reales y operaciones" src/ content/ README.md` retorna 0 resultados.
- [x] `pnpm run test:run` pasa con 0 failures (62 files, 1040 tests).
- [x] `pnpm run typecheck` pasa.
- [x] `pnpm run build` pasa.
- [x] Inspeccionar visualmente el diff de `content/matematica/exercises.json` para confirmar que solo `id` y `skillId` cambiaron, no el contenido pedagógico. — Confirmed via git show e3850e9 (verify-report line 14). Stale checkbox reconciled during archive per orchestrator instruction.

### T8. Commit final + push

- [x] Verificar que `openspec/changes/STATUS.json` no necesita actualización — change ya mergeado, STATUS.json ya actualizado en commit 5d19b50.
- [x] Commit de limpieza post-merge: `fix(domain): remove last reales_operaciones literal from pilot-skills test` (45ed7d0).
- [x] Ready for verification review.

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
