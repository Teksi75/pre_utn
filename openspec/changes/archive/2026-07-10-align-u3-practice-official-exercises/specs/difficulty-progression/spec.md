# Delta for difficulty-progression

## ADDED Requirements

### Requirement: U3 Difficulty-5 Is Reserved for Challenges

For the nine in-scope U3 skills in `align-u3-practice-official-exercises`, every entry with `difficulty === 5` MUST be a challenge (i.e. loaded via the challenge loader, not the base exercise loader). Conversely, every challenge for these nine skills MUST have `difficulty === 5` exactly.

#### Scenario: diff-5 entries are challenges only

- GIVEN the catalog after this change
- WHEN all U3 exercises with `difficulty === 5` are enumerated
- THEN each one is a challenge (loaded by the challenge loader)

#### Scenario: in-scope U3 challenges are diff 5

- GIVEN the challenge loader
- WHEN challenges for the nine in-scope U3 skill IDs are enumerated
- THEN every one has `difficulty === 5`

### Requirement: Per-Skill Base Difficulty Monotonicity

For each in-scope U3 skill, base exercises (non-challenge) ordered by `id` MUST show a non-decreasing difficulty sequence across the FIRST occurrence of each new diff level added by this change.

#### Scenario: monotonic base progression

- GIVEN `mat.u3.sistemas` exercises ordered by id
- WHEN difficulties are inspected
- THEN the new entries added by this change show non-decreasing difficulty

### Requirement: Challenge Difficulty Is Exactly 5

A U3 challenge for an in-scope skill MUST NOT be added with `difficulty` other than 5. Any other difficulty fails validation per the per-skill content test.

#### Scenario: wrong challenge difficulty rejected

- GIVEN a structurally valid candidate challenge with one of the nine new U3 alignment skill IDs and `difficulty: 4`
- WHEN the generic challenge loader parses it and the scoped U3 alignment policy audit runs
- THEN generic parsing remains compatible with difficulty 4 or 5
- AND the scoped policy audit rejects it because every newly added alignment challenge requires `difficulty === 5`
- AND the existing `mat.u3.traduccion_lenguaje_verbal` difficulty-4 challenge remains accepted

### Requirement: Existing `traduccion_lenguaje_verbal` Desafios Preserved

The two existing desafios `ex.u3.traduccion_lenguaje_verbal.desafio-01` (diff 5) and `ex.u3.traduccion_lenguaje_verbal.desafio-02` (diff 4) MUST remain at their original `difficulty` and MUST NOT be duplicated by this change.

#### Scenario: existing desafios untouched

- GIVEN the challenge loader before this change
- WHEN `mat.u3.traduccion_lenguaje_verbal` challenges are queried
- THEN exactly 2 entries are returned at their original `difficulty` values
- AND no new challenge with that skill id is added by this change