# Delta for Math Error Taxonomy

## Purpose

Extend the U3 error tag set with `u3_racionalizacion_irracional` (additional, non-replacement) plus its detection pattern, so the canonical P1l exercise (`ex.u3.ecuaciones_lineales.6`) and its challenge can be tagged when a student rationalizes an irrational coefficient incorrectly. This slice does not migrate or rename any existing U3 tag, and does NOT widen non-U3 behavior (U1, U2, U4, U5, U6 tags stay untouched).

## ADDED Requirements

### Requirement: Unit 3 Racionalizacion Irracional Tag

The taxonomy MUST include one new error tag with prefix `u3_*` for the misconception of rationalizing an irrational coefficient incorrectly. The tag is **additional** to the existing U3 tag set — it MUST NOT replace or rename any existing U3 tag.

| Tag ID | Misconception | Impact |
|--------|---------------|--------|
| `u3_racionalizacion_irracional` | Fails to rationalize the irrational coefficient before isolating (drops the radical, applies an incorrect conjugate, or keeps an irrational factor in the final answer where a rational one is required) | Exercise incorrect |

#### Scenario: U3LIN-TAG-001 — new tag loads with the canonical `ErrorTag` contract

- GIVEN the updated taxonomy
- WHEN unit 3 tags are queried
- THEN `u3_racionalizacion_irracional` is present with valid `id`, `unit: 3`, a Spanish-neutral `description` (the pedagogical visible explanation), and `examples` containing at least one wrong and one correct answer
- AND the tag MUST NOT require, expose, or emulate a `label` field — the `ErrorTag` contract is exactly `{ id, unit, description, examples }` and this slice MUST NOT widen the model

#### Scenario: U3LIN-TAG-002 — original 8 U3 tags preserved; exactly one new U3 tag added relative to the current 12-tag baseline

- GIVEN the taxonomy after this slice
- WHEN unit 3 tags are queried
- THEN the eight U3 tags from the original Unit 3 contract (one per U3 skill: `u3_aislamiento_incorrecto`, `u3_factorizacion_cuadratica`, `u3_signo_desigualdad`, `u3_dos_valores_absoluto`, `u3_pendiente_o_ordenada`, `u3_sustitucion_o_eliminacion`, `u3_igualdad_exponenciales`, `u3_propiedad_logaritmo`) are still present with unchanged IDs
- AND the current U3 baseline — those 8 originals + 3 modeling tags (`u3_traduccion_incorrecta`, `u3_verificacion_omitida`, `u3_interpretacion_contextual_incorrecta`) + the legacy `u3_direccion_desigualdad` = 12 pre-existing `u3_*` tags — is also unchanged
- AND `u3_racionalizacion_irracional` is the only U3 tag added by this slice (post-slice declared total = 13)

### Requirement: Racionalizacion Irracional Detection Pattern

The detector in `src/domain/evaluator/error-tagging.ts` MUST dispatch `u3_racionalizacion_irracional` when the student answer for a P1l-style exercise fails to remove the irrational coefficient. Pattern scope: `multiple-choice` answers whose selected value either keeps an irrational coefficient of the same radicand as the original prompt or applies an incorrect conjugate that does not match the prompt's exact denominator.

| Tag ID | Detection pattern | Example wrong | Example correct |
|--------|------------------|---------------|-----------------|
| `u3_racionalizacion_irracional` | MC selected option still contains the original irrational coefficient unchanged (no rationalization step performed) | Selected `x = (5 - √3) / (2 - √3)` for prompt rationalizing `(5 - √3) / (2 - √3)` | Selected `x = 7 + 4√3` (rationalized) |

#### Scenario: U3LIN-TAG-003 — detector fires when rationalization is skipped

- GIVEN a P1l exercise tagged with `commonErrorTags: ["u3_racionalizacion_irracional"]`
- WHEN the student selects the option that retains the original irrational denominator
- THEN the tagged error returned is exactly `u3_racionalizacion_irracional`

#### Scenario: U3LIN-TAG-004 — detector does not fire when rationalization is correct

- GIVEN a P1l exercise tagged with `commonErrorTags: ["u3_racionalizacion_irracional"]`
- WHEN the student selects the correctly rationalized option
- THEN no `u3_racionalizacion_irracional` tag is returned

## MODIFIED Requirements

*None.*

## REMOVED Requirements

*None.*

## RENAMED Requirements

*None.*
