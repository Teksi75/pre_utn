# Delta for Math Exercise Catalog

## ADDED Requirements

### Requirement: Unit 3 Exercise Source

The catalog MUST load `content/matematica/exercises/unit-3.json` as a per-unit source with the same priority as `unit-2.json`: loaded before the legacy monolith so it wins any ID collisions.

#### Scenario: U3-CAT-001 — Unit-3 file is registered

- GIVEN `content-loaders.ts`
- WHEN the unit exercise file registry is inspected
- THEN `3` maps to the `unit-3.json` import

#### Scenario: U3-CAT-002 — Unit-3 source loads before monolith

- GIVEN `loadCatalog()` composes from unit files first, then monolith
- WHEN an exercise ID exists in both `unit-3.json` and `exercises.json`
- THEN the unit-3 entry is the one returned by `queryBySkill`

### Requirement: Unit 3 Threshold

`UNIT_THRESHOLDS` MUST declare `"unit-3": 24`. `loadCatalog()` MUST throw when U3 has fewer than 24 exercises.

#### Scenario: U3-CAT-003 — Threshold declared

- GIVEN `UNIT_THRESHOLDS`
- WHEN `["unit-3"]` is read
- THEN the value is `>= 24`

#### Scenario: U3-CAT-004 — Threshold enforced

- GIVEN a U3 exercise count below 24
- WHEN `loadCatalog()` is called
- THEN it throws naming `Unit 3`

### Requirement: Unit 3 Loader Coverage

`loadExercisesForSkill` MUST return at least 3 exercises for each of the 8 U3 skill IDs after the change is applied.

#### Scenario: U3-CAT-005 — Every U3 skill has exercises

- GIVEN the loaded catalog
- WHEN `loadExercisesForSkill("mat.u3.recta")` (and the other 7 U3 IDs) is called
- THEN each returns an array of length `>= 3`

#### Scenario: U3-CAT-006 — Exercises use new IDs (`.2+`)

- GIVEN U3 exercises loaded from `unit-3.json`
- WHEN the trailing numeric suffix of their IDs is inspected
- THEN every ID ends with a number `>= 2` (legacy `.1` entries stay in the monolith)

## MODIFIED Requirements

### Requirement: Catalog Loading Across Split Files

The catalog MUST load exercises from multiple per-unit or per-skill files while preserving all existing Catalog Coverage, Catalog Querying, and validation behaviors. The total loaded count MUST equal the union of all split files.

(Previously: only U1/U2 unit files were registered; U3 fell through to the monolith and was not a first-class source.)

#### Scenario: exercises load from split files

- GIVEN the catalog is split into per-unit files (`unit-1.json`, `unit-2.json`, `unit-3.json`)
- WHEN the catalog is loaded
- THEN all exercises from all unit files are available

#### Scenario: split catalog preserves deterministic ordering

- GIVEN exercises loaded from multiple per-unit files
- WHEN queried by skill with difficulty filter
- THEN results are deterministic: difficulty ascending, then ID ascending

## REMOVED Requirements

*None.*

## RENAMED Requirements

*None.*