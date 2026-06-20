# Delta for Math Error Taxonomy

## ADDED Requirements

### Requirement: U3 Error Tags

The taxonomy MUST include 8 new error tags with prefix `u3_*`, one per U3 skill, with valid ID, unit 3, description, and examples. Each tag MUST follow the `u{1-6}_{slug}` ID convention.

| Tag ID | Misconception |
|--------|---------------|
| `u3_aislamiento_incorrecto` | Fails to apply inverse operations in the same order or misses a sign while isolating the variable |
| `u3_factorizacion_cuadratica` | Factors the quadratic incorrectly (wrong roots, wrong sign, or skips the constant term) |
| `u3_signo_desigualdad` | Flips the inequality sign when multiplying/dividing by a negative number, or forgets to flip |
| `u3_dos_valores_absoluto` | Treats `|ax + b| < c` as a single linear solution instead of a conjunction/disjunction |
| `u3_pendiente_o_ordenada` | Computes slope with swapped coordinates or mixes slope with y-intercept |
| `u3_sustitucion_o_eliminacion` | Drops a term during substitution/elimination or substitutes into the wrong equation |
| `u3_igualdad_exponenciales` | Treats different bases as equal or fails to equate exponents after matching bases |
| `u3_propiedad_logaritmo` | Misapplies log properties (e.g., `log(a + b) = log a + log b`, wrong change-of-base) |

#### Scenario: U3-TAG-001 — All U3 tags load

- GIVEN the updated taxonomy
- WHEN unit 3 tags are queried
- THEN 8 `u3_*` tags are present with complete metadata (id, unit=3, description, examples)

#### Scenario: U3-TAG-002 — Tags pass validation

- GIVEN each `u3_*` tag
- WHEN validated against the ErrorTag schema
- THEN validation succeeds with normalized tag

#### Scenario: U3-TAG-003 — No duplicates

- GIVEN the taxonomy with added U3 tags
- WHEN unique IDs are verified
- THEN no duplicate tag IDs exist

### Requirement: U3 Detection Patterns

Each new `u3_*` tag MUST have at least one detection pattern in `error-tagging.ts`. Patterns MAY match MC distractors, numerical answer shape, or symbolic outcome. Empty pattern slots are acceptable for the first implementation when paired with empty `commonErrorTags` per the feedback-tags discipline.

#### Scenario: U3-TAG-004 — At least one detection pattern registered

- GIVEN the U3 taxonomy entries
- WHEN `error-tagging.ts` is inspected
- THEN for each of the 8 new `u3_*` tags either a detector exists OR the tag is marked `detectionDeferred: true` in the implementation notes

## MODIFIED Requirements

### Requirement: Minimum Coverage and Uniqueness

The taxonomy SHALL contain at least 2 error tags per mathematics unit and every tag MUST be unique.

(Previously: U3 had no tag entries. After this change U3 has 8.)

#### Scenario: complete taxonomy loads

- GIVEN each unit has at least 2 unique error tags
- WHEN the taxonomy is loaded
- THEN loading succeeds

#### Scenario: duplicate or missing coverage fails

- GIVEN a duplicate tag or fewer than 2 tags for a unit
- WHEN the taxonomy is loaded
- THEN loading fails with duplicate or coverage details

## REMOVED Requirements

*None.*

## RENAMED Requirements

*None.*