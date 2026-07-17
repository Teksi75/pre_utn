# Delta for Math Exercise Catalog

## Purpose

Make `mat.u3.ecuaciones_lineales` an honest topic slice by (PR1) adding MC exercises that activate the existing `u3_aislamiento_incorrecto` detector and (PR2) recovering the canonical P1l exercise `ex.u3.ecuaciones_lineales.6` from `03_ej_utn.pdf` (adapted). No new U3 skill is introduced. **PR1 is fully autonomous. PR2's external dependency on `recuperar-u3-traza-canonica-ejercicios` PR2 (parser + U3 audit) is recorded as SATISFIED by PR #98 (merge commit `e553648079cd7b6f9864683d4ab4d694b4f6a8e7`; head branch `feat/u3-traza-canonica-parser` @ `d4c77a5`), which delivered `parseOptionalCanonicalTrace` and `auditU3TraceSourceUse` to `main`. Implementation of PR2 MUST verify its future base contains merge commit `e553648` or the equivalent merged symbols (`parseOptionalCanonicalTrace`, `auditU3TraceSourceUse` are importable) before writing any `canonicalTrace` entry; if verification fails, PR2 MUST NOT proceed.** No non-U3 (U1/U2/U4/U5/U6) catalog content is touched.

## ADDED Requirements

### Requirement: U3 Ecuaciones Lineales MC Isolation Coverage

The catalog MUST add at least one new MC exercise to `mat.u3.ecuaciones_lineales` whose `commonErrorTags` includes `u3_aislamiento_incorrecto` (an existing U3 tag). This activates the existing MC-only detector that the four current numerical exercises cannot reach.

| ID | Concept | Difficulty | Type | Error tags |
|----|---------|------------|------|------------|
| `ex.u3.ecuaciones_lineales.{6a,6b,…}` (new MC, count per PR1) | Isolation error: divide by coefficient is missing or sign is lost when moving a negative term | 2-3 | `multiple-choice` | `u3_aislamiento_incorrecto` |

#### Scenario: U3LIN-CAT-001 — u3_aislamiento_incorrecto is reachable in the catalog

- GIVEN the updated catalog with the new MC exercise
- WHEN `loadExercisesForSkill("mat.u3.ecuaciones_lineales")` runs
- THEN at least one returned exercise has `type === "multiple-choice"` AND `commonErrorTags` includes `u3_aislamiento_incorrecto`

### Requirement: U3 P1l Canonical Exercise (PR2)

PR2 MUST add `ex.u3.ecuaciones_lineales.6` — the canonical P1l exercise (linear equation with irrational coefficients) — recovered from `03_ej_utn.pdf`, carrying a `canonicalTrace` entry with the EXERCISE `sourceUse` vocabulary (4-value general union: `adapted | reinforcement | reference | alignment`; U3 audit narrows runtime to `adapted | reinforcement | reference`).

| Field | Value |
|-------|-------|
| ID | `ex.u3.ecuaciones_lineales.6` |
| Skill | `mat.u3.ecuaciones_lineales` |
| Type | `multiple-choice`, Difficulty 4 |
| `commonErrorTags` (MUST) | include `u3_racionalizacion_irracional` |
| `canonicalTrace[].path` | includes `03_ej_utn.pdf` (resolves within repository boundary) |
| `canonicalTrace[].sourceUse` (EXERCISE surface, U3 audit narrowing) | `adapted` \| `reinforcement` \| `reference` (no `alignment` for U3 audit inputs) |

#### Scenario: U3LIN-CAT-002 — P1l exercise parses and tags correctly

- GIVEN `ex.u3.ecuaciones_lineales.6` is loaded and the canonical-trace parser + U3 audit are on `main`
- WHEN the exercise is validated and the U3 audit runs
- THEN `canonicalTrace[0].path` resolves within repository boundary
- AND `sourceUse` is one of `adapted` / `reinforcement` / `reference` (no `alignment`)
- AND `commonErrorTags` includes `u3_racionalizacion_irracional`

### Requirement: U3 Slice Declared-Tag Catalog Growth (additive, on top of current 12-tag baseline)

The declared U3 tag catalog used by `src/domain/__tests__/u3-exercise-shape.test.ts` MUST add `u3_racionalizacion_irracional` so the new exercise passes the shape test. The 12 pre-existing `u3_*` tags — 8 originals from the original Unit 3 contract + 3 modeling tags (`u3_traduccion_incorrecta`, `u3_verificacion_omitida`, `u3_interpretacion_contextual_incorrecta`) + legacy `u3_direccion_desigualdad` — MUST remain unchanged. This slice adds exactly one new declared U3 tag.

#### Scenario: U3LIN-CAT-003 — declared catalog admits the new tag without dropping existing ones

- GIVEN the updated declared-tag set
- WHEN the shape test runs against `unit-3.json`
- THEN `u3_racionalizacion_irracional` is in the catalog (post-slice declared total = 13)
- AND the twelve pre-existing `u3_*` tags are still present with unchanged IDs
- AND `ex.u3.ecuaciones_lineales.6` passes validation with `u3_racionalizacion_irracional` in its `commonErrorTags`

### Requirement: PR1 Autonomous; PR2 External Dependency SATISFIED With Base Verification

PR1 MUST be fully autonomous — no new `canonicalTrace` write, no dependency on `parseOptionalCanonicalTrace` or `auditU3TraceSourceUse`. PR2's external dependency on `recuperar-u3-traza-canonica-ejercicios` PR2 (parser + U3 audit) is recorded as **SATISFIED** by PR #98 (merge commit `e553648079cd7b6f9864683d4ab4d694b4f6a8e7`; head `feat/u3-traza-canonica-parser` @ `d4c77a5`), which delivered `parseOptionalCanonicalTrace` and `auditU3TraceSourceUse` to `main`. Implementation of PR2 MUST verify its future base contains merge commit `e553648` or the equivalent merged symbols (`parseOptionalCanonicalTrace`, `auditU3TraceSourceUse` are importable) before writing any `canonicalTrace` entry; if verification fails, PR2 MUST NOT proceed.

#### Scenario: U3LIN-CAT-004 — PR2 dependency SATISFIED; PR1 proceeds; PR2 verifies base before writing canonicalTrace

- GIVEN `recuperar-u3-traza-canonica-ejercicios` PR2 is merged on `main` (PR #98, `e553648079cd7b6f9864683d4ab4d694b4f6a8e7`)
- WHEN the orchestrator plans PR1 and PR2 for this change
- THEN PR1 may proceed and merge independently (no canonical-trace parser dependency)
- AND PR2 may proceed BUT the implementation branch MUST verify `e553648` is an ancestor of its base (e.g. `git merge-base --is-ancestor e553648079cd7b6f9864683d4ab4d694b4f6a8e7 HEAD` returns 0) OR the symbols `parseOptionalCanonicalTrace` and `auditU3TraceSourceUse` are importable from `src/domain`, before writing `canonicalTrace`

## MODIFIED Requirements

*None.*

## REMOVED Requirements

*None.*

## RENAMED Requirements

*None.*
