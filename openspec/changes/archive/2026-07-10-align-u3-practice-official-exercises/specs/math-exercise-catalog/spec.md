# Delta for math-exercise-catalog

## MODIFIED Requirements

### Requirement: Catalog Querying

The catalog SHALL support querying by unit, skill, and difficulty range. Deterministic ordering per pair:

| Pair condition | Order |
|---|---|
| Both entries carry validated U3 logarithmic metadata: `progressionFamily ∈ {"log-expansion","log-combining"}` AND finite numeric `progressionOrder` | `progressionFamily` rank ASC (`log-expansion`=0, `log-combining`=1), then numeric `progressionOrder` ASC within same family |
| Otherwise | difficulty ASC, then ID lexicographic ASC |

This is the ONLY cross-family override. All other pairings (legacy, missing/malformed metadata, single-side metadata, or `progressionFamily` outside the recognized set) fall back to the legacy rule.

(Previously: difficulty-then-ID unconditional; same-family override scoped. Updated: same-family rule replaced by strictly-scoped cross-family precedence that fires ONLY for the recognized U3 logarithmic metadata set.)

#### Scenario: query by skill orders results

- GIVEN three exercises for one skill with difficulties 2, 1, 4
- WHEN exercises are requested by skill
- THEN results return in difficulty order 1, 2, 4

#### Scenario: query with no matches is safe

- GIVEN no exercises match a requested skill or difficulty range
- WHEN the catalog is queried
- THEN an empty result returns without error

#### Scenario: P37 expansion precedes P38 combining by validated U3 logarithmic metadata

- GIVEN logaritmicas entries spanning both families with finite numeric `progressionOrder` values
- WHEN the catalog loader enumerates the skill
- THEN every entry with `progressionFamily = "log-expansion"` appears before every entry with `progressionFamily = "log-combining"`
- AND within each family, entries sort ascending by numeric `progressionOrder`
- AND ordering is NOT based on prompt, canonical anchor, or `pedagogicalNote` text

#### Scenario: ordinary entries retain legacy difficulty-then-ID ordering

- GIVEN entries lacking `progressionFamily`/`progressionOrder`, with `progressionFamily` outside the recognized U3 logarithmic set, OR with non-numeric/non-finite `progressionOrder`
- WHEN the catalog loader enumerates the skill
- THEN results return in legacy order (difficulty ASC, then ID lexicographic ASC)
- AND the same ordering applies when only ONE entry in the pair carries the metadata

### Requirement: Unit 2 Official-PDF Canonical Trace

Each new U2 exercise (PR 3-7) MUST carry `canonicalTrace` with `path` including `02_ej_utn.pdf` and `sourceUse` ∈ {`reference`, `adapted`, `reinforcement`} for exercises/theory/worked-examples. Challenges use enum: `canonical-source | adapted | calibrated-from-exam | solution-pattern`. `alignment` MUST NOT be used on any surface.

(Previously: sourceUse enum was `reference, adapted, reinforcement, alignment`; challenge enum omitted; `alignment` incorrectly allowed on the exercise surface.)

#### Scenario: U2-CAT-OFFICIAL-001 — All aligned exercises reference 02_ej_utn.pdf

- GIVEN any of the 32 new U2 exercises (PR 3-7)
- WHEN its `canonicalTrace` is inspected
- THEN at least one entry has `path` matching `02_ej_utn.pdf`
- AND that entry's `sourceUse` is one of `reference, adapted, reinforcement`

#### Scenario: U2-CAT-OFFICIAL-002 — PR-by-PR coverage

- GIVEN the 32 aligned exercises grouped by PR (PR 3: 4, PR 4: 6, PR 5: 10, PR 6: 4, PR 7: 8)
- WHEN each group's `canonicalTrace` is inspected
- THEN every exercise carries an official-PDF trace

## ADDED Requirements

### Requirement: U3 Aligned Exercise Coverage (P34/P37 Mandatory)

The catalog MUST add base exercises (difficulty 1-4) per in-scope U3 skill. Required: `ecuaciones_lineales` >=1 diff-3 P1c/g/j/k/l/m/n; `ecuaciones_cuadraticas` >=1 diff-3 P5d, >=1 diff-4 P6; `ecuaciones_valor_absoluto` (NEW) >=5 MC diff 1-3 incl P8g; `inecuaciones_valor_absoluto` >=1 diff-4 P9n/o; `inecuaciones_producto_cociente` (NEW) >=5 MC diff 3-4 incl P9p/q/r/t/u/w; `recta` >=1 diff-4 parallel + >=1 diff-4 perpendicular (P12c/d/g or P20a/b); `sistemas` >=1 diff-4 P25, P27/P29, P32, P34; `exponenciales` >=1 diff-4 P39b/c, P39m/n; `logaritmicas` >=1 diff-2/3 P37, >=1 diff-3 P38, >=1 diff-3 P40k, >=1 diff-4 P40m, >=1 diff-4 P40n.

#### Scenario: P34 single MC combines three interpretations

- GIVEN `mat.u3.sistemas` difficulty-4 entries
- WHEN the P34-anchored exercise is inspected
- THEN its MC prompt requires system classification (SPD/SCI/SI), graph interpretation, and solution-set selection
- AND its MC options encode all three interpretations
- AND its `canonicalTrace.path` resolves to the verified PDF

### Requirement: canonicalTrace Existence, Enum, and Path Resolution

Every new U3 exercise MUST carry `canonicalTrace` with a path resolving on disk (verified: `material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf`). `sourceUse` MUST be `reference | adapted | reinforcement` (NEVER `alignment`, NEVER `canonical-source`).

#### Scenario: every new U3 exercise has a resolvable trace

- GIVEN the catalog
- WHEN every new U3 exercise is inspected
- THEN each carries `canonicalTrace` resolving on disk
- AND `sourceUse` is `reference | adapted | reinforcement` (NOT `alignment`/`canonical-source`)
