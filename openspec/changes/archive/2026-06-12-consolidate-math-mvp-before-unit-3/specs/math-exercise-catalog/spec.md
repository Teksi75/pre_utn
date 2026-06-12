# Delta for math-exercise-catalog

## ADDED Requirements

### Requirement: Catalog Loading Across Split Files

The catalog MUST load exercises from multiple per-unit or per-skill files while preserving all existing Catalog Coverage, Catalog Querying, and validation behaviors. The total loaded count MUST equal the union of all split files.

#### Scenario: exercises load from split files

- GIVEN the catalog is split into per-unit files (e.g., `u1.json`, `u2.json`)
- WHEN the catalog is loaded
- THEN all exercises from all unit files are available

#### Scenario: split catalog preserves deterministic ordering

- GIVEN exercises loaded from multiple per-unit files
- WHEN queried by skill with difficulty filter
- THEN results are deterministic: difficulty ascending, then ID ascending

### Requirement: Shared Unit-Parsing Helper

The system MUST expose a shared pure helper that extracts unit number from skill IDs using the pattern `mat.u{N}.{skill}`. Both the catalog loader and teacher home view-model derivation MUST use this helper.

#### Scenario: helper extracts unit from valid skill ID

- GIVEN skill ID `mat.u2.polinomios_basico`
- WHEN the helper is called
- THEN it returns `2`

#### Scenario: helper defaults for unknown pattern

- GIVEN a skill ID that does not match `mat.u{N}.{skill}`
- WHEN the helper is called
- THEN it returns `1` as default

### Requirement: Supabase-Readiness Boundary Review

The catalog loading boundary MUST be reviewable for future adapter compatibility. Current file-based loading MUST NOT add throwaway persistence abstractions, but the loading interface SHOULD remain composable for a future Supabase adapter.

#### Scenario: loader interface is composable

- GIVEN the current catalog loader
- WHEN its interface is inspected
- THEN it accepts exercise data as input (not hardcoded file paths)
- AND adding a Supabase source would not require rewriting query logic
