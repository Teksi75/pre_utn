# Unit 3 Mathematics Specification

## Purpose

Vertical slice for Unit 3 (Ecuaciones y sistemas): theory, examples, feedback, exercises, and pilot activation of the 8 U3 skill IDs already in `skill-catalog.ts`.

## Requirements

### Requirement: Unit 3 Section Visibility

`/learn/matematica` MUST render a "Unidad 3 — Ecuaciones y sistemas" section below U2 with exactly 8 cards — one per `mat.u3.*` skill in `UNIT_3_SKILLS`.

#### Scenario: U3-VIS-001 — Section with 8 cards

- GIVEN a student visits `/learn/matematica`
- WHEN the page renders
- THEN a section "Unidad 3 — Ecuaciones y sistemas" appears below U2 with 8 `Link` cards linking the 8 U3 skill IDs

### Requirement: U3 Pilot Activation

`PILOT_SKILLS` MUST contain exactly 8 entries with `unitKey: "unit-3"` and a Spanish label.

#### Scenario: U3-PILOT-001 — Eight U3 entries

- GIVEN `PILOT_SKILLS`
- WHEN filtered to `unitKey === "unit-3"`
- THEN count is 8 AND skillIds equal `UNIT_3_SKILLS`

### Requirement: U3 Content Files

Four JSON files MUST ship under `content/matematica/`: `theory/unit-3.json`, `examples/unit-3.json`, `feedback/unit-3.json`, `exercises/unit-3.json`. Loaders MUST parse them by `unitKey: "unit-3"`.

#### Scenario: U3-FILES-001 — All four files parse

- GIVEN the four `unit-3.json` files
- WHEN `loadTheoryContent`, `loadExampleContent`, `loadFeedbackContent` (`unit-3`) and `loadExercisesForSkill` run
- THEN each returns a non-empty array

### Requirement: Theory and Examples per U3 Skill

Each of the 8 U3 skill IDs MUST have ≥1 theory node and ≥2 worked examples. The detail page MUST render both.

#### Scenario: U3-THEORY-001 — Coverage by skill

- GIVEN `loadTheoryContent("unit-3")` and `loadExampleContent("unit-3")`
- WHEN grouped by `skillId`
- THEN each U3 skill has ≥1 theory node AND ≥2 examples

#### Scenario: U3-SKILL-PAGE-001 — Detail renders

- GIVEN `/learn/matematica/mat.u3.ecuaciones_lineales`
- WHEN the page renders
- THEN theory concepts and worked examples are visible

### Requirement: U3 Exercise Bank

`content/matematica/exercises/unit-3.json` MUST contain ≥24 exercises distributed across the 8 U3 skills (≥3 each). IDs MUST match `ex.u3.<skill>.{N>=2}`. No `free-response`. `symbolic` only when driven by `polynomial-evaluator`. Theory nodes MUST NOT declare `pageReferences`.

#### Scenario: U3-EX-001 — Count and dedup

- GIVEN the loaded U3 exercises
- WHEN counted
- THEN ≥24 entries exist AND none collide with the 5 legacy `ex.u3.*.1` IDs

#### Scenario: U3-EX-002 — Coverage per skill

- GIVEN U3 exercises
- WHEN grouped by `skillId`
- THEN each U3 skill has ≥3 entries with trailing number `>= 2`

### Requirement: U3 Loader Threshold

`UNIT_THRESHOLDS` MUST declare `"unit-3": 24`. `loadCatalog()` MUST throw naming "Unit 3" when the count is below 24.

#### Scenario: U3-THRESHOLD-001 — Threshold enforced

- GIVEN a U3 count < 24
- WHEN `loadCatalog()` runs
- THEN it throws naming Unit 3 and the current count

### Requirement: Feedback Tags Discipline

For first U3 implementation, exercises MUST declare `commonErrorTags: []` unless a matching `FeedbackMapping` exists in `feedback/unit-3.json`. The validator MUST report any non-empty tag without feedback.

#### Scenario: U3-FB-001 — Empty tags pass

- GIVEN `commonErrorTags: []`
- WHEN the validator runs
- THEN no diagnostic references the exercise

#### Scenario: U3-FB-002 — Non-empty tag without feedback fails

- GIVEN `commonErrorTags: ["u3_signo_desigualdad"]` and no mapping for it
- WHEN the validator runs
- THEN a diagnostic names the exercise ID and the missing tag

### Requirement: Legacy U3 Monolith Preservation

The 5 existing U3 entries in `content/matematica/exercises.json` MUST remain untouched. Cleanup is deferred.

#### Scenario: U3-LEGACY-001 — Priority is unit-3

- GIVEN the same ID in both `unit-3.json` and `exercises.json`
- WHEN `loadCatalog()` composes sources
- THEN the unit-3 entry wins AND the 5 legacy `ex.u3.*.1` IDs remain reachable

### Requirement: Verification

`pnpm run test`, `pnpm run typecheck`, `pnpm run build` MUST all exit 0 with no U1/U2 regressions.

#### Scenario: U3-VERIFY-001 — All green

- GIVEN the implementation is complete
- WHEN each command runs
- THEN each exits 0 AND existing U1/U2 tests pass unchanged

## Pedagogical Impact

Alumno: studies equations, inequalities, lines, systems, exponentials, logarithms with worked examples per U3 skill. Docente: practice signals become available for the future teacher panel (separate product).

## Out of Scope

Migrating/removing the 5 legacy U3 entries; new exercise types; Física and Units 4–6; new evaluators or routes.