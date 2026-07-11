# Delta for practice-coverage

## ADDED Requirements

### Requirement: Practice Bank Size for `mat.u1.conjuntos_numericos`

The system MUST expose a practice bank for skill `mat.u1.conjuntos_numericos` containing at least 40 exercises.

#### Scenario: bank meets minimum threshold

- GIVEN the skill `mat.u1.conjuntos_numericos` is queried for its exercise bank
- WHEN the bank is enumerated
- THEN the count is greater than or equal to 40

#### Scenario: bank falls short

- GIVEN the skill `mat.u1.conjuntos_numericos` is queried for its exercise bank
- WHEN the count is less than 40
- THEN the system reports the bank as insufficient for the `conjuntos-numericos-practice-expansion` change

### Requirement: Category Distribution

The practice bank MUST distribute exercises across these categories with these minimums:

| Category | Minimum Exercises |
|----------|-------------------|
| Pertenencia e inclusión | 8 |
| Clasificación de números | 12 |
| Racionales vs irracionales | 8 |
| Decimales (finitos, periódicos, no periódicos) | 6 |
| Mapa de inclusión entre conjuntos | 4 |
| Errores comunes conceptuales | 6 |

#### Scenario: category coverage is satisfied

- GIVEN the practice bank is filtered by each category
- WHEN each category count is measured
- THEN each count meets or exceeds its minimum

#### Scenario: category falls short

- GIVEN a category has fewer than its required minimum
- WHEN the bank is validated
- THEN a category coverage error names the deficient category and its count

### Requirement: Mandatory Numbers in Bank

The bank MUST include exercises or options that reference each of these numbers: 5, 0, -3, 2/5, 0,75, 0,3̄, √2, √9, π, -4/1.

#### Scenario: mandatory number appears in exercise prompt or options

- GIVEN the bank is searched for each mandatory number
- WHEN a number appears in a prompt or in an option value
- THEN it counts as coverage for that number

#### Scenario: mandatory number is absent

- GIVEN a mandatory number does not appear in any prompt or option
- WHEN the bank is validated
- THEN a missing-number error names the absent number

### Requirement: Skill Scope Boundary

Exercises in the bank MUST NOT include topics from powers, radicals, intervals, absolute value, or logarithms unless the topic is strictly required to classify a number.

#### Scenario: out-of-scope topic is primary focus

- GIVEN an exercise primarily tests powers, radicals, intervals, absolute value, or logarithms
- WHEN it is validated for `mat.u1.conjuntos_numericos`
- THEN it is rejected as out-of-scope for this skill

#### Scenario: out-of-scope topic is incidental to classification

- GIVEN an exercise asks to classify √2 or π
- WHEN the classification target is a number from the sets domain
- THEN it is accepted even though the symbol involves a root or constant

### Requirement: Difficulty Distribution Per Category

Each category MUST include exercises at each difficulty level: básico (1–2), intermedio (3), desafiante (4–5).

#### Scenario: basic exercises present in category

- GIVEN a category is selected
- WHEN exercises with difficulty 1 or 2 are counted
- THEN at least one such exercise exists

#### Scenario: intermediate exercises present in category

- GIVEN a category is selected
- WHEN exercises with difficulty 3 are counted
- THEN at least one such exercise exists

#### Scenario: challenging exercises present in category

- GIVEN a category is selected
- WHEN exercises with difficulty 4 or 5 are counted
- THEN at least one such exercise exists

---

## Added by consolidate-math-mvp-before-unit-3

### Requirement: Per-Unit Validation Scope

Bank validation rules MUST be scoped per unit. Each unit defines its own minimum exercise count and coverage thresholds. U1 thresholds MUST NOT create false positives when applied to U2 or U3 content.

#### Scenario: U1 thresholds do not affect U2

- GIVEN U1 has a minimum of 40 exercises and U2 has a minimum of 20
- WHEN bank validation runs for U2
- THEN U2 is validated against its own threshold (20), not U1's (40)

#### Scenario: unit without explicit thresholds uses defaults

- GIVEN a new unit (e.g., U3) with no explicit thresholds defined
- WHEN bank validation runs for U3
- THEN a default minimum threshold is applied (configurable, minimum 5)

### Requirement: Unit Coverage Metadata

Each exercise MUST declare its unit explicitly. The validator MUST group exercises by unit before applying per-unit thresholds.

#### Scenario: exercises are grouped by unit for validation

- GIVEN exercises from U1 and U2 in the bank
- WHEN validation runs
- THEN exercises are grouped by their declared unit before threshold checks

---

## Added by align-u3-practice-official-exercises

### Requirement: U3 Base vs Challenge Difficulty Policy

All NEW base exercises for the nine in-scope U3 skills MUST have `difficulty` in `1-4` inclusive; each MUST have EXACTLY ONE new challenge with `difficulty === 5`. Nine skills: `mat.u3.ecuaciones_lineales`, `mat.u3.ecuaciones_cuadraticas`, `mat.u3.ecuaciones_valor_absoluto`, `mat.u3.inecuaciones_valor_absoluto`, `mat.u3.inecuaciones_producto_cociente`, `mat.u3.recta`, `mat.u3.sistemas`, `mat.u3.exponenciales`, `mat.u3.logaritmicas`. Content policy (NOT enforced by the `Difficulty` literal type); enforced by per-skill content tests.

#### Scenario: no base exercise has difficulty 5

- GIVEN the catalog
- WHEN each in-scope U3 skill's base exercises are enumerated
- THEN no base exercise has `difficulty === 5`

#### Scenario: exactly 9 new challenges at diff 5

- GIVEN the challenge loader
- WHEN new challenges for the in-scope U3 skill IDs are enumerated
- THEN the count is exactly 9
- AND every one has `difficulty === 5`

### Requirement: Companion Ownership Preserved

This change MUST NOT add base exercises or challenges for families owned by registered companions. **#82** owns P7, P10a-h, P13-P19, P31a-j. **#83** owns P22, P23, P30.

#### Scenario: no companion-family exercise lands here

- GIVEN the catalog after this change
- WHEN any new exercise is inspected
- THEN no exercise references P7, P10, P13-P19, P22, P23, P30, or P31

### Requirement: Existing U3 IDs and Progress Preserved

This change MUST NOT renumber any existing U3 exercise ID, MUST NOT alter the `pre-utn.practice.v1` storage shape (full student-scoped envelope with `students` and `activeStudentId`), and MUST NOT change the schema of `PracticeProgress`, `PracticeProgressMap`, `ChallengeAttempt`, or `AdvancedPracticeProgress`.

#### Scenario: existing U3 IDs preserved

- GIVEN the existing catalog
- WHEN this change is applied
- THEN every existing `ex.u3.<skill>.<n>` ID resolves to the same `id`, `skillId`, and `difficulty`

#### Scenario: practice storage shape preserved (full student-scoped envelope)

- GIVEN a populated `pre-utn.practice.v1` entry holding `{ students, activeStudentId }`
- WHEN the catalog is reloaded after this change
- THEN the entry parses without error
- AND `students[activeStudentId]` retains its original `PracticeProgress` keys and types

### Requirement: Literal Immutable Compatibility Fixtures (Frozen Baselines)

The compatibility test suite MUST check in immutable, literal fixture files under `tests/fixtures/compatibility/` capturing pre-change state. Fixtures MUST be TypeScript literal objects declared `as const`, MUST NOT import from `src/domain/catalog/`, `src/domain/practice/`, or `src/domain/advanced-practice/`, and MUST NOT derive expected values from the post-change catalog.

Required frozen fixtures (exact paths):

| Fixture file | Shape |
|--------------|-------|
| `tests/fixtures/compatibility/u3-exercise-baseline.ts` | `{ id, skillId, difficulty }[]` (every pre-change `ex.u3.<skill>.<n>`) |
| `tests/fixtures/compatibility/u3-challenge-baseline.ts` | `{ id, skillId, difficulty, type, canonicalTrace }[]` (`desafio-01` diff 5 + `desafio-02` diff 4 for `mat.u3.traduccion_lenguaje_verbal`) |
| `tests/fixtures/compatibility/u3-practice-progress-baseline.ts` | `PracticeProgressMap` literal (full `pre-utn.practice.v1` envelope: `{ students, activeStudentId }`) |
| `tests/fixtures/compatibility/u3-advanced-progress-baseline.ts` | `AdvancedPracticeProgress` literal (`challengeAttempts: ChallengeAttempt[]` plus `readinessBySkill: Record<SkillId, number | null>`) |

`ChallengeAttempt` fields in `u3-advanced-progress-baseline.ts` MUST be EXACTLY: `studentId`, `exerciseId`, `skillId`, `correct`, `answeredAt`, `timeMs`, `attemptIndex`. NO other field names (no `attemptId`, no `selectedOptionId`, no `submittedAt`). `readinessBySkill` values MUST be `number | null` (null = "not started"); numeric values MUST be finite in `[0, 100]`.

#### Scenario: frozen U3 base inventory matches post-change IDs

- GIVEN the frozen `u3-exercise-baseline.ts` literal
- WHEN the post-change catalog enumerates `ex.u3.<skill>.<n>` IDs
- THEN every frozen `id` resolves to the same `id`, `skillId`, and `difficulty`

#### Scenario: frozen `traduccion_lenguaje_verbal` desafios preserved

- GIVEN the frozen `u3-challenge-baseline.ts` literal
- WHEN the post-change loader queries `mat.u3.traduccion_lenguaje_verbal`
- THEN it returns exactly 2 entries
- AND `desafio-01` retains `difficulty: 5`, `desafio-02` retains `difficulty: 4`

#### Scenario: frozen `pre-utn.practice.v1` parses as full envelope

- GIVEN the frozen `u3-practice-progress-baseline.ts` literal `{ students, activeStudentId }`
- WHEN the post-change parser reads it
- THEN `students[activeStudentId]` parses with the same `PracticeProgress` keys and types

#### Scenario: frozen advanced-practice preserves fields and readiness

- GIVEN the frozen `u3-advanced-progress-baseline.ts` literal
- WHEN the post-change advanced-practice parser reads it
- THEN every `ChallengeAttempt` field (`studentId, exerciseId, skillId, correct, answeredAt, timeMs, attemptIndex`) parses with the same type
- AND `readinessBySkill` retains the same keys and same `number | null` values