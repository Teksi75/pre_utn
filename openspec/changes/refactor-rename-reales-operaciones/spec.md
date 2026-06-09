# Spec — Skill Rename: `reales_operaciones` → `propiedades_operaciones_reales`

## Purpose

Alinear el identificador y la etiqueta de la skill actual `mat.u1.reales_operaciones` con el material canónico del Seminario de Ingreso UTN Mendoza 2025 (`material_canonico/Matemática/UNIDAD1_matemática.pdf`, índice p. 2, capítulo 13: "Propiedades Operaciones de Números reales").

## Requirements

### Requirement: Skill identifier rename

`mat.u1.reales_operaciones` MUST be renamed to `mat.u1.propiedades_operaciones_reales` everywhere it appears in the repository's source code, content, and active OpenSpec specs.

The literal string `mat.u1.reales_operaciones` MUST NOT appear in:
- `src/**/*.ts` and `src/**/*.tsx`
- `content/matematica/**/*.json`
- `openspec/specs/**/*.md` (active specs only; archive/ is historical and out of scope)

The literal string `mat.u1.reales_operaciones` MAY appear in:
- `openspec/changes/archive/**` (historical record; renaming them would falsify the audit trail)
- `docs/auditorias/unidad-1/AUDITORIA_UNIDAD_1.md` and `LECCIONES_APRENDIDAS_UNIDAD_1.md` (historical reference to the r2 finding; renaming them would falsify the audit record)

#### Scenario: Pilot skills catalog references the new ID

- GIVEN the file `src/domain/catalog/pilot-skills.ts`
- WHEN a developer reads the `PILOT_SKILLS` array
- THEN the entry for "Propiedades Operaciones de Números reales" MUST have `skillId: "mat.u1.propiedades_operaciones_reales"` and `unitKey: "unit-1"`

#### Scenario: Skill catalog has the new ID in UNIT_1_SKILLS

- GIVEN the file `src/domain/models/skill-catalog.ts`
- WHEN a developer reads `UNIT_1_SKILLS` and `ALL_SKILLS`
- THEN both arrays MUST include `mat.u1.propiedades_operaciones_reales` and MUST NOT include `mat.u1.reales_operaciones`

#### Scenario: SKILL_DEPENDENCIES references the new ID

- GIVEN the file `src/domain/models/skill-catalog.ts`
- WHEN a developer reads the `SKILL_DEPENDENCIES` array
- THEN the entries for `mat.u1.potencias_raices`, `mat.u1.racionalizacion`, and `mat.u1.complejos` MUST have `mat.u1.propiedades_operaciones_reales` (not the old name) in their `prerequisites` array

### Requirement: Skill label rename

The `label` field of the renamed skill MUST be `"Propiedades Operaciones de Números reales"` (matching the chapter title in the canonical PDF, not a paraphrase).

The literal string `"Números reales y operaciones"` MUST NOT appear in:
- `src/domain/catalog/pilot-skills.ts` (as a label)
- `README.md` (in the "Skills de Unidad 1 realmente transitables hoy" table)
- Any user-facing text

#### Scenario: Home page shows the new label

- GIVEN the application is running (`pnpm dev`, `http://localhost:3000`)
- WHEN the user navigates to the home page
- THEN the unit 1 skill list MUST show "Propiedades Operaciones de Números reales" (not "Números reales y operaciones")

### Requirement: Exercise ID and skillId rename

The four exercises `ex.u1.reales_operaciones.{1,2,3,4}` in `content/matematica/exercises.json` MUST be renamed to `ex.u1.propiedades_operaciones_reales.{1,2,3,4}`. Both the `id` field and the `skillId` field of each exercise MUST be updated.

The exercise content (prompt, options, expectedAnswer, commonErrorTags, pedagogicalNote, relatedTheoryIds, relatedExampleIds) MUST NOT change.

#### Scenario: Exercise 1 preserves its content with new ID

- GIVEN the original exercise `ex.u1.reales_operaciones.1` in `exercises.json`
- WHEN the rename is applied
- THEN the resulting `ex.u1.propiedades_operaciones_reales.1` MUST have identical `prompt`, `options`, `expectedAnswer`, `commonErrorTags`, and `pedagogicalNote` to the original
- AND the file MUST contain exactly 4 exercises with the new ID prefix

### Requirement: Theory and examples reference the new skillId

The theory node in `content/matematica/theory/unit-1.json` and the worked examples in `content/matematica/examples/unit-1.json` MUST have their `skillId` field updated to `mat.u1.propiedades_operaciones_reales`.

#### Scenario: Theory node points to the new skill

- GIVEN the file `content/matematica/theory/unit-1.json`
- WHEN a developer searches for entries with `skillId: "mat.u1.reales_operaciones"`
- THEN the search MUST return 0 results
- AND the file MUST contain an entry with `skillId: "mat.u1.propiedades_operaciones_reales"`

### Requirement: Active OpenSpec spec updated

The file `openspec/specs/complex-numbers-skill/spec.md` line 11 declares that `mat.u1.complejos` has `mat.u1.reales_operaciones` as prerequisite. This declaration MUST be updated to reference `mat.u1.propiedades_operaciones_reales`.

#### Scenario: Complex numbers spec references the new prerequisite

- GIVEN the file `openspec/specs/complex-numbers-skill/spec.md`
- WHEN a developer reads the prerequisite declaration for `mat.u1.complejos`
- THEN the declaration MUST read `mat.u1.propiedades_operaciones_reales` (not the old name)

### Requirement: All tests pass with the renamed identifiers

All existing test files (`src/domain/__tests__/*.test.ts`, `src/lib/__tests__/*.test.ts`, `src/app/practice/__tests__/*.test.ts`, `src/components/diagnostic/__tests__/*.test.ts`) MUST be updated to reference the new identifiers where they currently reference the old ones.

After the update:
- `pnpm run test:run` MUST pass with 0 failures.
- `pnpm run typecheck` MUST pass.
- `pnpm run build` MUST succeed.

#### Scenario: Diagnostic test suite passes

- GIVEN `src/domain/__tests__/diagnostic.test.ts` has been updated to use `mat.u1.propiedades_operaciones_reales` and the exercise IDs `ex.u1.propiedades_operaciones_reales.{1,2,3,4}`
- WHEN a developer runs `pnpm run test:run src/domain/__tests__/diagnostic.test.ts`
- THEN the test suite MUST report 0 failures

#### Scenario: Accessibility test suite passes

- GIVEN `src/domain/__tests__/accessibility.test.ts` has been updated
- WHEN a developer runs `pnpm run test:run src/domain/__tests__/accessibility.test.ts`
- THEN the test suite MUST report 0 failures (in particular, the test "reales_operaciones IS accessible when prereq accuracy is exactly at threshold (0.7)" should now be called "propiedades_operaciones_reales IS accessible...")

### Requirement: Content not changed (only renamed)

The pedagogical content of the four exercises (the actual math problems, the answer shapes, the feedback mappings, the theory concepts, the worked examples) MUST NOT change in this refactor. The rename is structural; pedagogical review is out of scope and deferred to the post-rename content expansion (backlog item D2).

#### Scenario: Exercise 1 prompt is byte-identical after rename

- GIVEN the original `prompt` of `ex.u1.reales_operaciones.1`
- WHEN the rename is applied
- THEN the `prompt` of `ex.u1.propiedades_operaciones_reales.1` MUST be byte-identical to the original

## Non-functional requirements

### NFR: Reversibility

If the rename needs to be reverted (e.g., a critical bug is discovered post-merge), the change MUST be revertible by a single `git revert` of the merge commit. The four commits in the change MUST NOT introduce irreversible transformations (no data migrations, no destructive schema changes).

### NFR: Multi-PC safety

After the merge to `main`, the `git pull` on the second PC MUST NOT generate conflicts. This implies the rename is atomic per-file (the entire file content is updated in a single commit, not multiple commits that could diverge).

### NFR: Documentation drift

`docs/auditorias/unidad-1/AUDITORIA_UNIDAD_1.md` and `LECCIONES_APRENDIDAS_UNIDAD_1.md` reference the old name as part of the r2 audit findings. These documents MUST keep the old name references for historical accuracy (renaming them would falsify the audit record). The change MUST add a note in the proposal or tasks explaining that the audit reports intentionally retain the old name.

## Out of scope

- Renaming `potencias_raices` (different topic: caps. 14+17 of the PDF).
- Renaming `intervalos`, `valor_absoluto`, `logaritmos`, `complejos` (all aligned with the PDF index).
- Expanding the exercise bank of the renamed skill (backlog item D2).
- Implementing the `PedagogyEvent` telemetry model (backlog item B6, deferred).
- Migrating `recoveryTarget` to a discriminated union (backlog item A3).
- Renaming any archived change files (`openspec/changes/archive/**`).
