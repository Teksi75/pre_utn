# Delta for practice-coverage

## ADDED Requirements

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
| `tests/fixtures/compatibility/u3-advanced-progress-baseline.ts` | `AdvancedPracticeProgress` literal (`challengeAttempts: ChallengeAttempt[]` plus `readinessBySkill: Record<SkillId, number \| null>`) |

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